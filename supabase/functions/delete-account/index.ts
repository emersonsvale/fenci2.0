import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ success: false, message: "Método não permitido" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ success: false, message: "Não autorizado" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: userError } = await userClient.auth.getUser(token);
    if (userError || !user?.id) {
      return new Response(JSON.stringify({ success: false, message: "Usuário não autenticado" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const userId = user.id;
    const admin = createClient(supabaseUrl, serviceRoleKey);
    const steps: { table: string; column: string }[] = [
      { table: "planning_entries", column: "user_id" },
      { table: "planning_installments", column: "user_id" },
      { table: "planning_savings", column: "user_id" },
      { table: "planning_categories", column: "user_id" },
      { table: "plannings", column: "user_id" },
      { table: "goal_contributions", column: "user_id" },
      { table: "transactions", column: "user_id" },
      { table: "recurring_transactions", column: "user_id" },
      { table: "credit_card_invoices", column: "user_id" },
      { table: "credit_cards", column: "user_id" },
      { table: "goals", column: "user_id" },
      { table: "budgets", column: "user_id" },
      { table: "investment_transactions", column: "user_id" },
      { table: "investments", column: "user_id" },
      { table: "investment_wallets", column: "user_id" },
      { table: "accounts", column: "user_id" },
    ];
    for (const { table, column } of steps) {
      const { error } = await admin.from(table).delete().eq(column, userId);
      if (error) {
        console.error(table, error);
        return new Response(JSON.stringify({ success: false, message: error.message }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }
    await admin.from("categories").update({ parent_id: null }).eq("user_id", userId);
    const { error: catErr } = await admin.from("categories").delete().eq("user_id", userId);
    if (catErr) {
      console.error("categories", catErr);
      return new Response(JSON.stringify({ success: false, message: catErr.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const { error: notifErr } = await admin.from("notification_preferences").delete().eq("user_id", userId);
    if (notifErr) {
      console.error("notification_preferences", notifErr);
      return new Response(JSON.stringify({ success: false, message: notifErr.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const { data: fileList } = await admin.storage.from("avatars").list(userId);
    if (fileList?.length) {
      const paths = fileList.map((f) => `${userId}/${f.name}`);
      await admin.storage.from("avatars").remove(paths);
    }
    const { error: profErr } = await admin.from("profiles").delete().eq("id", userId);
    if (profErr) {
      console.error("profiles", profErr);
      return new Response(JSON.stringify({ success: false, message: profErr.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const { error: authErr } = await admin.auth.admin.deleteUser(userId);
    if (authErr) {
      console.error("auth delete", authErr);
      return new Response(JSON.stringify({ success: false, message: "Erro ao excluir conta." }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    return new Response(JSON.stringify({ success: true, message: "Conta excluída com sucesso." }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error(err);
    return new Response(JSON.stringify({ success: false, message: "Erro inesperado." }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
