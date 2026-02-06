-- Atualiza o job mensal de recorrentes para suportar cartão: obtém/cria fatura e insere com invoice_id.
-- O trigger on_transaction_credit_card_insert atualiza available_limit e total_amount.

DROP FUNCTION IF EXISTS public.process_recurring_transactions_monthly();

-- Helper: retorna reference_month (YYYY-MM) para uma data e closing_day.
CREATE OR REPLACE FUNCTION public.get_invoice_reference_month(occurrence_date date, closing_day int)
RETURNS text
LANGUAGE sql
STABLE
AS $$
  SELECT CASE
    WHEN EXTRACT(DAY FROM occurrence_date)::int <= closing_day
    THEN to_char(occurrence_date, 'YYYY-MM')
    ELSE to_char((date_trunc('month', occurrence_date) + interval '1 month')::date, 'YYYY-MM')
  END;
$$;

-- Helper: busca ou cria fatura; retorna id.
CREATE OR REPLACE FUNCTION public.get_or_create_credit_card_invoice(
  p_credit_card_id uuid,
  p_reference_month text,
  p_user_id uuid
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  inv_id uuid;
  c_closing_day int;
  c_due_day int;
  first_day date;
  last_day date;
  closing_day_actual int;
  closing_date date;
  due_month_start date;
  due_last_day int;
  due_day_actual int;
  due_date date;
BEGIN
  SELECT id INTO inv_id FROM credit_card_invoices
  WHERE credit_card_id = p_credit_card_id AND reference_month = p_reference_month;
  IF inv_id IS NOT NULL THEN RETURN inv_id; END IF;

  SELECT closing_day, due_day INTO c_closing_day, c_due_day
  FROM credit_cards WHERE id = p_credit_card_id;
  c_closing_day := COALESCE(c_closing_day, 28);
  c_due_day := COALESCE(c_due_day, 8);

  first_day := (p_reference_month || '-01')::date;
  last_day := (date_trunc('month', first_day) + interval '1 month' - interval '1 day')::date;
  closing_day_actual := LEAST(c_closing_day, EXTRACT(DAY FROM last_day)::int);
  closing_date := first_day + (closing_day_actual - 1) * interval '1 day';

  due_month_start := first_day + interval '1 month';
  due_last_day := EXTRACT(DAY FROM (due_month_start + interval '1 month' - interval '1 day'))::int;
  due_day_actual := LEAST(c_due_day, due_last_day);
  due_date := due_month_start + (due_day_actual - 1) * interval '1 day';

  INSERT INTO credit_card_invoices (user_id, credit_card_id, reference_month, closing_date, due_date, total_amount, paid_amount, status)
  VALUES (p_user_id, p_credit_card_id, p_reference_month, closing_date, due_date, 0, 0, 'open')
  RETURNING id INTO inv_id;
  RETURN inv_id;
END;
$$;

-- Job diário: gera transações das recurring_transactions cujo day_of_month = dia atual.
-- Para recorrentes com credit_card_id: obtém/cria fatura e insere com invoice_id (trigger atualiza limite e total).
CREATE OR REPLACE FUNCTION public.process_recurring_transactions_monthly()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  r record;
  occurrence_date date;
  ref_month text;
  inv_id uuid;
  closing_day int;
  tx_amount numeric;
  v_inserted integer := 0;
  v_exists boolean;
  v_day_to_use int;
  v_last_day int;
BEGIN
  occurrence_date := CURRENT_DATE;
  v_last_day := EXTRACT(DAY FROM (date_trunc('month', occurrence_date) + interval '1 month' - interval '1 day'))::int;

  FOR r IN
    SELECT * FROM recurring_transactions
    WHERE is_active = true
      AND frequency = 'monthly'
      AND day_of_month IS NOT NULL
      AND day_of_month = EXTRACT(DAY FROM occurrence_date)::int
      AND start_date <= occurrence_date
      AND (end_date IS NULL OR end_date >= occurrence_date)
  LOOP
    v_day_to_use := LEAST(r.day_of_month, v_last_day);
    occurrence_date := date_trunc('month', CURRENT_DATE)::date + (v_day_to_use - 1);

    SELECT EXISTS(
      SELECT 1 FROM transactions t
      WHERE t.recurring_transaction_id = r.id AND t.transaction_date::date = occurrence_date
    ) INTO v_exists;
    IF v_exists THEN CONTINUE; END IF;

    IF r.credit_card_id IS NOT NULL THEN
      SELECT c.closing_day INTO closing_day FROM credit_cards c WHERE c.id = r.credit_card_id;
      closing_day := COALESCE(closing_day, 28);
      ref_month := public.get_invoice_reference_month(occurrence_date, closing_day);
      inv_id := public.get_or_create_credit_card_invoice(r.credit_card_id, ref_month, r.user_id);
      tx_amount := -ABS(r.amount);

      INSERT INTO transactions (user_id, account_id, category_id, credit_card_id, invoice_id, description, amount, transaction_date, type, is_paid, status, is_recurring, recurring_transaction_id)
      VALUES (r.user_id, r.account_id, r.category_id, r.credit_card_id, inv_id, r.description, tx_amount, occurrence_date::text, r.type, COALESCE(r.auto_confirm, false), CASE WHEN COALESCE(r.auto_confirm, false) THEN 'confirmed' ELSE 'pending' END, true, r.id);
    ELSE
      tx_amount := CASE WHEN r.type = 'expense' THEN -ABS(r.amount) ELSE ABS(r.amount) END;
      INSERT INTO transactions (user_id, account_id, category_id, description, amount, transaction_date, type, is_paid, status, is_recurring, recurring_transaction_id)
      VALUES (r.user_id, r.account_id, r.category_id, r.description, tx_amount, occurrence_date::text, r.type, COALESCE(r.auto_confirm, false), CASE WHEN COALESCE(r.auto_confirm, false) THEN 'confirmed' ELSE 'pending' END, true, r.id);
    END IF;
    v_inserted := v_inserted + 1;
  END LOOP;

  RETURN v_inserted;
END;
$$;
