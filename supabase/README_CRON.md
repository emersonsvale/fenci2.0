# Lançamentos recorrentes (Cron)

A função `public.process_recurring_transactions_monthly()` gera todo mês os lançamentos a partir da tabela `recurring_transactions`, no dia configurado em `day_of_month`.

## Habilitar e agendar

1. No **Supabase Dashboard**: **Integrations** > **Cron** (pg_cron) > **Enable**.
2. No **SQL Editor**, execute o conteúdo do arquivo:
   - `supabase/migrations/schedule_recurring_transactions_cron.sql`

Isso agenda a execução **diária às 00:05 UTC**. Em cada execução a função verifica se o dia atual coincide com algum `day_of_month` das recorrentes ativas e, para o mês corrente, insere na tabela `transactions` apenas quando ainda não existir lançamento para aquele `recurring_transaction_id` e data.

## Comportamento

- Quando o usuário marca **Recorrente (fixa)** ao criar uma saída, é criado um registro em `recurring_transactions` com `frequency = 'monthly'` e `day_of_month` igual ao dia do vencimento.
- Se ele também usar **Repetir** (N parcelas), é definido `end_date` na recorrente para o último mês das parcelas, para o cron não duplicar lançamentos.
- A função usa `auto_confirm` da recorrente para definir `is_paid` e `status` do lançamento gerado.
