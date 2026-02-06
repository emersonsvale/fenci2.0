-- Trigger: ao inserir transação com credit_card_id e invoice_id, atualiza
-- credit_cards.available_limit e credit_card_invoices.total_amount.
-- createCartao e o job de recorrentes só inserem; a consistência fica no banco.

CREATE OR REPLACE FUNCTION public.on_transaction_credit_card_insert()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $func$
DECLARE
  abs_amount numeric;
BEGIN
  IF NEW.credit_card_id IS NOT NULL AND NEW.invoice_id IS NOT NULL THEN
    abs_amount := ABS(NEW.amount);

    UPDATE credit_cards
    SET available_limit = COALESCE(available_limit, 0) - abs_amount
    WHERE id = NEW.credit_card_id;

    UPDATE credit_card_invoices
    SET total_amount = COALESCE(total_amount, 0) + abs_amount
    WHERE id = NEW.invoice_id;
  END IF;

  RETURN NEW;
END;
$func$;

DROP TRIGGER IF EXISTS trigger_after_transaction_credit_card_insert ON transactions;

CREATE TRIGGER trigger_after_transaction_credit_card_insert
  AFTER INSERT ON transactions
  FOR EACH ROW
  EXECUTE FUNCTION public.on_transaction_credit_card_insert();
