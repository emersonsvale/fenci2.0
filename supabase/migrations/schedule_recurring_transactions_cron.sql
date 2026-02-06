-- Agendar execução diária da função que gera lançamentos recorrentes.
-- Execute este arquivo APÓS habilitar o Cron no Supabase:
-- Dashboard > Integrations > Cron (pg_cron) > Enable.
--
-- O job roda todo dia às 00:05 UTC e chama process_recurring_transactions_monthly(),
-- que cria na tabela transactions os lançamentos de recurring_transactions
-- cujo day_of_month coincide com o dia atual.

SELECT cron.schedule(
  'process_recurring_transactions_monthly',
  '5 0 * * *',
  $$SELECT public.process_recurring_transactions_monthly()$$
);
