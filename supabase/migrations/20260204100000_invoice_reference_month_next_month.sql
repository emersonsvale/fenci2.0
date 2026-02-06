-- Fatura: compras do mês M aparecem na fatura do mês M+1 (paga no mês seguinte).
-- Atualiza get_invoice_reference_month para sempre retornar o mês seguinte à data da compra.

CREATE OR REPLACE FUNCTION public.get_invoice_reference_month(occurrence_date date, closing_day int)
RETURNS text
LANGUAGE sql
STABLE
AS $$
  -- Compras do mês M → fatura do mês M+1 (ex.: janeiro → fatura de fevereiro)
  SELECT to_char((date_trunc('month', occurrence_date) + interval '1 month')::date, 'YYYY-MM');
$$;
