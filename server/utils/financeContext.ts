import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '../../../shared/types/database.types'

const MESES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
]

export interface FinanceContextPeriod {
  month: number // 1-12 (calendário)
  year: number
}

/**
 * Monta um resumo em texto da vida financeira do usuário para alimentar a IA.
 * Usa apenas: profiles, accounts, budgets, categories, credit_cards, credit_card_invoices, recurring_transactions, transactions.
 * Se period for informado, transações, orçamentos e faturas são filtrados por esse mês/ano.
 */
export async function buildFinanceContext(
  userId: string,
  supabase: SupabaseClient<Database>,
  period?: FinanceContextPeriod
): Promise<string> {
  const sections: string[] = []
  const toNum = (v: unknown) => (typeof v === 'number' ? v : Number(v) || 0)

  if (period) {
    const nomeMes = MESES[period.month - 1] ?? `${period.month}`
    sections.push(
      `## Período de referência\nO usuário está com o mês/ano "${nomeMes} ${period.year}" selecionado na tela. Todas as análises de transações, orçamentos e faturas abaixo referem-se a este período. Sempre responda considerando este mês/ano quando falar de "este mês", "o mês", valores a pagar, etc.`
    )
  }

  // profiles
  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, preferred_currency')
    .eq('id', userId)
    .single()

  if (profile) {
    const nome = profile.full_name?.trim() || 'Não informado'
    sections.push(
      `## Perfil (profiles)\nNome do usuário: ${nome}. Moeda preferida: ${profile.preferred_currency ?? 'BRL'}.`
    )
  }

  // accounts (com id para a Fê poder sugerir lançamentos)
  const { data: accounts } = await supabase
    .from('accounts')
    .select('id, name, type, current_balance, include_in_total')
    .eq('user_id', userId)
    .eq('is_active', true)

  if (accounts?.length) {
    const totalBalance = accounts
      .filter((a) => a.include_in_total !== false)
      .reduce((s, a) => s + toNum(a.current_balance), 0)
    const list = accounts
      .map((a) => `  - id=${a.id} | ${a.name} (${a.type}): saldo ${formatCurrency(toNum(a.current_balance))}`)
      .join('\n')
    sections.push(
      `## Contas (accounts) — total "incluir no total": ${formatCurrency(totalBalance)}\nUse o id da conta ao sugerir lançamento.\n${list}`
    )
  }

  // categories (com id para a Fê poder sugerir lançamentos)
  const { data: categories } = await supabase
    .from('categories')
    .select('id, name, type')
    .eq('user_id', userId)
    .eq('is_active', true)

  if (categories?.length) {
    const list = categories
      .map((c) => `  - id=${c.id} | ${c.name} (${c.type})`)
      .join('\n')
    sections.push(
      `## Categorias (categories) — use o id ao sugerir lançamento\n${list}`
    )
  }

  // credit_cards
  const { data: cards } = await supabase
    .from('credit_cards')
    .select('name, credit_limit, available_limit')
    .eq('user_id', userId)
    .eq('is_active', true)

  if (cards?.length) {
    const list = cards
      .map(
        (c) =>
          `  - ${c.name}: limite ${formatCurrency(toNum(c.credit_limit))}, disponível ${formatCurrency(toNum(c.available_limit))}`
      )
      .join('\n')
    sections.push(`## Cartões de crédito (credit_cards)\n${list}`)
  }

  // transactions — por período selecionado ou últimos 60 dias
  let dateFrom: string
  let dateTo: string
  let periodLabel: string
  if (period) {
    dateFrom = `${period.year}-${String(period.month).padStart(2, '0')}-01`
    const lastDay = new Date(period.year, period.month, 0).getDate()
    dateTo = `${period.year}-${String(period.month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`
    periodLabel = `${MESES[period.month - 1] ?? period.month}/${period.year}`
  } else {
    const sixtyDaysAgo = new Date()
    sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60)
    dateFrom = sixtyDaysAgo.toISOString().slice(0, 10)
    dateTo = new Date().toISOString().slice(0, 10)
    periodLabel = 'últimos 60 dias'
  }

  const { data: transactions } = await supabase
    .from('transactions')
    .select('type, amount, category_id, is_recurring, description')
    .eq('user_id', userId)
    .gte('transaction_date', dateFrom)
    .lte('transaction_date', dateTo)

  if (transactions?.length) {
    const income = transactions.filter((t) => t.type === 'income').reduce((s, t) => s + toNum(t.amount), 0)
    const expenseAll = transactions.filter((t) => t.type === 'expense').reduce((s, t) => s + Math.abs(toNum(t.amount)), 0)
    const expenseFixas = transactions
      .filter((t) => t.type === 'expense' && t.is_recurring === true)
      .reduce((s, t) => s + Math.abs(toNum(t.amount)), 0)
    const expenseVariaveis = expenseAll - expenseFixas
    const transfer = transactions.filter((t) => t.type === 'transfer').reduce((s, t) => s + Math.abs(toNum(t.amount)), 0)
    sections.push(
      `## Transações (transactions) — ${periodLabel}\nEntradas: ${formatCurrency(income)}. Saídas totais: ${formatCurrency(expenseAll)} (fixas/recorrentes: ${formatCurrency(expenseFixas)}; variáveis/avulsas: ${formatCurrency(expenseVariaveis)}). Transferências: ${formatCurrency(transfer)}. Saldo do período: ${formatCurrency(income - expenseAll)}.`
    )
    const avulsas = transactions
      .filter((t) => t.type === 'expense' && t.is_recurring !== true)
      .map((t) => ({ desc: t.description || 'Sem descrição', val: Math.abs(toNum(t.amount)) }))
      .sort((a, b) => b.val - a.val)
      .slice(0, 15)
    if (avulsas.length > 0) {
      const list = avulsas.map((a) => `  - ${a.desc}: ${formatCurrency(a.val)}`).join('\n')
      sections.push(`## Maiores despesas variáveis (transactions, ${periodLabel})\n${list}`)
    }
  }

  // budgets — mês selecionado ou atual
  const now = new Date()
  const refMonth = period
    ? `${period.year}-${String(period.month).padStart(2, '0')}`
    : `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  const { data: budgets } = await supabase
    .from('budgets')
    .select('name, amount, spent_amount')
    .eq('user_id', userId)
    .eq('reference_month', refMonth)

  if (budgets?.length) {
    const list = budgets
      .map(
        (b) =>
          `  - ${b.name}: orçado ${formatCurrency(toNum(b.amount))}, gasto ${formatCurrency(toNum(b.spent_amount))}`
      )
      .join('\n')
    sections.push(`## Orçamentos (budgets) — mês ${refMonth}\n${list}`)
  }

  // credit_card_invoices (do mês selecionado ou recentes)
  let invoicesQuery = supabase
    .from('credit_card_invoices')
    .select('reference_month, total_amount, status, due_date')
    .eq('user_id', userId)
    .in('status', ['open', 'closed', 'overdue'])
    .order('due_date', { ascending: true })
  if (period) {
    invoicesQuery = invoicesQuery.eq('reference_month', refMonth)
  } else {
    invoicesQuery = invoicesQuery.limit(6)
  }
  const { data: invoices } = await invoicesQuery

  if (invoices?.length) {
    const list = invoices
      .map(
        (i) =>
          `  - ${i.reference_month}: total ${formatCurrency(toNum(i.total_amount))}, vencimento ${i.due_date}, status ${i.status}`
      )
      .join('\n')
    sections.push(`## Faturas de cartão (credit_card_invoices)\n${list}`)
  }

  // recurring_transactions
  const { data: recurring } = await supabase
    .from('recurring_transactions')
    .select('description, amount, frequency, type, is_active')
    .eq('user_id', userId)
    .eq('is_active', true)

  if (recurring?.length) {
    const rendas = recurring.filter((r) => r.type === 'income')
    const saidas = recurring.filter((r) => r.type === 'expense')
    const rendaStr =
      rendas.length > 0
        ? rendas.map((r) => `    ${r.description}: ${formatCurrency(toNum(r.amount))} (${r.frequency})`).join('\n')
        : '    Nenhuma.'
    const saidaStr =
      saidas.length > 0
        ? saidas.map((r) => `    ${r.description}: ${formatCurrency(toNum(r.amount))} (${r.frequency})`).join('\n')
        : '    Nenhuma.'
    sections.push(`## Recorrentes (recurring_transactions)\nRendas:\n${rendaStr}\nSaídas:\n${saidaStr}`)
  }

  if (sections.length === 0) {
    return 'Nenhum dado financeiro cadastrado ainda (profiles, accounts, budgets, categories, credit_cards, credit_card_invoices, recurring_transactions, transactions).'
  }

  return sections.join('\n\n')
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value)
}
