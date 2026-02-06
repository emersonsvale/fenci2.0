import type { Database, CreditCardInvoiceInsert } from '../../shared/types/database.types'

type SupabaseClient = import('@supabase/supabase-js').SupabaseClient<Database>

/**
 * Retorna o reference_month (YYYY-MM) da fatura à qual uma compra pertence.
 * Regra: compras do mês M são pagas no mês M+1 → fatura sempre do mês seguinte à compra.
 * Ex.: compras de janeiro aparecem na fatura de fevereiro (paga em fev).
 */
export function getReferenceMonth(transactionDate: string, _closingDay?: number): string {
  const [y, m] = transactionDate.split('T')[0].split('-').map(Number)
  const month0 = m - 1
  const year = y
  const nextDate = new Date(year, month0 + 1, 1)
  const nextYear = nextDate.getFullYear()
  const nextMonth = String(nextDate.getMonth() + 1).padStart(2, '0')
  return `${nextYear}-${nextMonth}`
}

/**
 * Calcula closing_date (dia closingDay no mês de reference_month) e
 * due_date (dia dueDay no mês seguinte).
 */
function getClosingAndDueDates(referenceMonth: string, closingDay: number, dueDay: number): { closing_date: string; due_date: string } {
  const [y, m] = referenceMonth.split('-').map(Number)
  const year = y
  const month0 = m - 1

  const lastDayOfMonth = new Date(year, month0 + 1, 0).getDate()
  const closingDayActual = Math.min(closingDay, lastDayOfMonth)
  const closing_date = `${year}-${String(month0 + 1).padStart(2, '0')}-${String(closingDayActual).padStart(2, '0')}`

  const dueMonth = new Date(year, month0 + 2, 0)
  const dueMonthNum = dueMonth.getMonth() + 1
  const dueYear = dueMonth.getFullYear()
  const lastDayDueMonth = new Date(dueYear, dueMonthNum, 0).getDate()
  const dueDayActual = Math.min(dueDay, lastDayDueMonth)
  const due_date = `${dueYear}-${String(dueMonthNum).padStart(2, '0')}-${String(dueDayActual).padStart(2, '0')}`

  return { closing_date, due_date }
}

/**
 * Busca fatura por credit_card_id + reference_month; se não existir, cria e retorna o id.
 * No Supabase a coluna reference_month é tipo date: usamos o primeiro dia do mês (YYYY-MM-01).
 */
export async function getOrCreateInvoice(
  supabase: SupabaseClient,
  creditCardId: string,
  referenceMonth: string,
  userId: string,
  closingDay: number,
  dueDay: number
): Promise<string | null> {
  const referenceMonthDate = `${referenceMonth}-01`

  const { data: existing } = await supabase
    .from('credit_card_invoices')
    .select('id')
    .eq('credit_card_id', creditCardId)
    .eq('reference_month', referenceMonthDate)
    .maybeSingle()

  if (existing?.id) return existing.id

  const { closing_date, due_date } = getClosingAndDueDates(referenceMonth, closingDay, dueDay)
  const insert: CreditCardInvoiceInsert = {
    user_id: userId,
    credit_card_id: creditCardId,
    reference_month: referenceMonthDate,
    closing_date,
    due_date,
    total_amount: 0,
    paid_amount: 0,
    status: 'open',
  }

  const { data: inserted, error } = await supabase
    .from('credit_card_invoices')
    .insert(insert)
    .select('id')
    .single()

  if (error) {
    console.error('Erro ao criar fatura:', error)
    return null
  }
  return inserted?.id ?? null
}
