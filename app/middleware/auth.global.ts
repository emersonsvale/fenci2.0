/**
 * Middleware global de autenticação.
 * - Usuário logado em página de visitante (ex: /login) → redireciona para /dashboard.
 * - Usuário deslogado em rota protegida → redireciona para /login.
 * Executa apenas no client para evitar inconsistências com useSupabaseUser no SSR.
 * Em rotas protegidas, confere getSession() quando useSupabaseUser ainda não atualizou (ex.: pós-login com reload).
 */

const ROTAS_PUBLICAS = ['/', '/login', '/cadastro', '/esqueci-senha', '/reset-senha', '/confirm']

/** Aguarda sessão aparecer no client (útil após full-page redirect pós-login). */
async function getSessionWithRetry (supabase: { auth: { getSession: () => Promise<{ data: { session: unknown } }> } }, maxAttempts = 60): Promise<unknown> {
  // Pequeno delay para o plugin Supabase ter restaurado do storage
  await new Promise(r => setTimeout(r, 100))
  for (let i = 0; i < maxAttempts; i++) {
    const { data: { session } } = await supabase.auth.getSession()
    if (session) return session
    await new Promise(r => setTimeout(r, 50))
  }
  return null
}

export default defineNuxtRouteMiddleware(async (to) => {
  if (import.meta.server) return

  const user = useSupabaseUser()
  const path = to.path

  // Logado em rota de visitante → dashboard
  if (user.value && ROTAS_PUBLICAS.includes(path)) {
    return navigateTo('/dashboard', { replace: true })
  }

  // Em rota protegida com user.value null: pode ser pós-login (reload) → espera sessão no client
  if (!user.value && !ROTAS_PUBLICAS.includes(path)) {
    const supabase = useSupabaseClient()
    const session = await getSessionWithRetry(supabase)
    if (session) return
    return navigateTo('/login', { replace: true })
  }
})
