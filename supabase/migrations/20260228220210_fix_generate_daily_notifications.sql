CREATE OR REPLACE FUNCTION public.generate_daily_notifications()
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_today date := current_date;
  v_tomorrow date := current_date + 1;
  v_yesterday date := current_date - 1;
  v_notify_due_dates boolean;
  v_notify_overdue boolean;
  v_due_date_days_before int;
  v_user_id uuid;
  v_days_before int;
BEGIN
  -- We loop through all profiles (users)
  FOR v_user_id IN SELECT id FROM public.profiles
  LOOP
    -- Get preferences, using boolean/integer variables so we can handle missing rows gracefully
    SELECT coalesce(np.notify_due_dates, true),
           coalesce(np.notify_overdue, true),
           coalesce(np.due_date_days_before, 3)
      INTO v_notify_due_dates, v_notify_overdue, v_due_date_days_before
      FROM public.notification_preferences np
      WHERE np.user_id = v_user_id
      LIMIT 1;

    -- If there's no preference entry at all, the vars become NULL
    IF v_notify_due_dates IS NULL THEN
      v_notify_due_dates := true;
      v_notify_overdue := true;
      v_due_date_days_before := 3;
    END IF;

    v_days_before := greatest(1, v_due_date_days_before);

    -- 1) Lembre: Hoje é dia de receber R$X de [fulano] (transações de receita com vencimento hoje, não recebidas)
    IF v_notify_due_dates THEN
      INSERT INTO public.notifications (user_id, type, title, body, reference_id, reference_type)
      SELECT v_user_id, 'income_due_today', 'Lembrete',
             'Lembre: Hoje é dia de receber R$' || public._fmt_brl(abs(t.amount)) || ' de ' || coalesce(t.description, 'Receita') || '.',
             t.id, 'transaction'
      FROM public.transactions t
      WHERE t.user_id = v_user_id
        AND t.type = 'income'
        AND t.is_paid = false
        AND t.transaction_date = v_today
        AND t.credit_card_id IS NULL;
    END IF;

    -- 2) Rendas recorrentes: hoje é dia de receber
    IF v_notify_due_dates THEN
      INSERT INTO public.notifications (user_id, type, title, body, reference_id, reference_type)
      SELECT v_user_id, 'recurring_income_due_today', 'Lembrete',
             'Lembre: Hoje é dia de receber R$' || public._fmt_brl(r.amount) || ' de ' || coalesce(r.description, 'Renda') || '.',
             r.id, 'recurring_transaction'
      FROM public.recurring_transactions r
      WHERE r.user_id = v_user_id
        AND r.type = 'income'
        AND r.is_active = true
        AND r.day_of_month = extract(day from v_today)::int
        AND (r.end_date IS NULL OR r.end_date >= v_today)
        AND r.start_date <= v_today;
    END IF;

    -- 3) Atenção: Lançamento X de R$Y vence hoje
    IF v_notify_due_dates THEN
      INSERT INTO public.notifications (user_id, type, title, body, reference_id, reference_type)
      SELECT v_user_id, 'expense_due_today', 'Atenção',
             'Atenção: o lançamento "' || t.description || '" de R$' || public._fmt_brl(abs(t.amount)) || ' vence hoje.',
             t.id, 'transaction'
      FROM public.transactions t
      WHERE t.user_id = v_user_id
        AND t.type = 'expense'
        AND t.is_paid = false
        AND t.credit_card_id IS NULL
        AND t.transaction_date = v_today;
    END IF;

    -- 4) Atenção: Lançamento X de R$Y vai vencer amanhã
    IF v_notify_due_dates AND v_days_before >= 1 THEN
      INSERT INTO public.notifications (user_id, type, title, body, reference_id, reference_type)
      SELECT v_user_id, 'expense_due_tomorrow', 'Atenção',
             'Atenção: o lançamento "' || t.description || '" de R$' || public._fmt_brl(abs(t.amount)) || ' vai vencer amanhã.',
             t.id, 'transaction'
      FROM public.transactions t
      WHERE t.user_id = v_user_id
        AND t.type = 'expense'
        AND t.is_paid = false
        AND t.credit_card_id IS NULL
        AND t.transaction_date = v_tomorrow;
    END IF;

    -- 5) Atenção: Lançamento X de R$Y venceu ontem (ou está em atraso)
    IF v_notify_overdue THEN
      INSERT INTO public.notifications (user_id, type, title, body, reference_id, reference_type)
      SELECT v_user_id, 'expense_overdue', 'Atenção',
             CASE
               WHEN t.transaction_date = v_yesterday THEN 'Atenção: o lançamento "' || t.description || '" de R$' || public._fmt_brl(abs(t.amount)) || ' venceu ontem.'
               ELSE 'Atenção: o lançamento "' || t.description || '" de R$' || public._fmt_brl(abs(t.amount)) || ' está em atraso (venc. ' || to_char(t.transaction_date, 'DD/MM') || ').'
             END,
             t.id, 'transaction'
      FROM public.transactions t
      WHERE t.user_id = v_user_id
        AND t.type = 'expense'
        AND t.is_paid = false
        AND t.credit_card_id IS NULL
        AND t.transaction_date < v_today;
    END IF;

    -- 6) Fatura de cartão: vence hoje
    IF v_notify_due_dates THEN
      INSERT INTO public.notifications (user_id, type, title, body, reference_id, reference_type)
      SELECT v_user_id, 'invoice_due_today', 'Atenção',
             'Atenção: a fatura do cartão (venc. ' || to_char(i.due_date, 'DD/MM') || ') de R$' || public._fmt_brl((i.total_amount - coalesce(i.paid_amount, 0))) || ' vence hoje.',
             i.id, 'credit_card_invoice'
      FROM public.credit_card_invoices i
      WHERE i.user_id = v_user_id
        AND lower(coalesce(i.status, '')) <> 'paid'
        AND i.due_date = v_today;
    END IF;

    -- 7) Fatura de cartão: vence amanhã
    IF v_notify_due_dates AND v_days_before >= 1 THEN
      INSERT INTO public.notifications (user_id, type, title, body, reference_id, reference_type)
      SELECT v_user_id, 'invoice_due_tomorrow', 'Atenção',
             'Atenção: uma fatura de cartão (venc. ' || to_char(i.due_date, 'DD/MM') || ') de R$' || public._fmt_brl((i.total_amount - coalesce(i.paid_amount, 0))) || ' vence amanhã.',
             i.id, 'credit_card_invoice'
      FROM public.credit_card_invoices i
      WHERE i.user_id = v_user_id
        AND lower(coalesce(i.status, '')) <> 'paid'
        AND i.due_date = v_tomorrow;
    END IF;

    -- 8) Fatura de cartão: vencida
    IF v_notify_overdue THEN
      INSERT INTO public.notifications (user_id, type, title, body, reference_id, reference_type)
      SELECT v_user_id, 'invoice_overdue', 'Atenção',
             'Atenção: fatura de cartão (venc. ' || to_char(i.due_date, 'DD/MM') || ') de R$' || public._fmt_brl((i.total_amount - coalesce(i.paid_amount, 0))) || ' está vencida.',
             i.id, 'credit_card_invoice'
      FROM public.credit_card_invoices i
      WHERE i.user_id = v_user_id
        AND lower(coalesce(i.status, '')) <> 'paid'
        AND i.due_date < v_today;
    END IF;

  END LOOP;
END;
$function$;
