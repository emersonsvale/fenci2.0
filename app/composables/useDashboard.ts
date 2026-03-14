import { ref, computed, watch } from 'vue'
import { useSupabaseClient, useSupabaseUser } from '#imports'
import type { Database, Transaction, Category, CreditCard, Account, Budget, Investment, RecurringTransaction, CreditCardInvoice } from 'shared/types/database.types'
import { parseTransactionDateLocal } from '../utils/formatDate'

interface DashboardPeriod {
  month: number
  year: number
}

interface CategorySummary {
  id: string
  name: string
  icon: string | null
  color: string | null
  value: number
  percentage: number
}

interface ChartDataPoint {
  label: string
  value: number
}

interface ChartSeries {
  name: string
  color: string
  data: ChartDataPoint[]
}

interface Vencimento {
  id: string
  descricao: string
  tipo: string
  vencimento: Date
  valor: number
  pago: boolean
}

interface CreditCardDisplay {
  id: string
  name: string
  lastDigits: string
  brand: 'visa' | 'mastercard' | 'elo' | 'amex' | 'hipercard' | 'other'
  color: string
  limit: number
  used: number
}

interface InvestmentDisplay {
  id: string
  name: string
  status: 'ativo' | 'inativo'
  value: number
}

interface ProviderDisplay {
  id: string
  name: string
  type: string
  value: number
  color: string
}

/** Remove itens duplicados por id (mantém a primeira ocorrência). */
function dedupeById<T extends { id: string }>(items: T[]): T[] {
  const seen = new Set<string>()
  return items.filter((item) => {
    if (seen.has(item.id)) return false
    seen.add(item.id)
    return true
  })
}

export function useDashboard() {
  const supabase = useSupabaseClient<Database>()
  const user = useSupabaseUser()

  // Estado
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  const selectedPeriod = ref<DashboardPeriod>({
    month: new Date().getMonth(),
    year: new Date().getFullYear(),
  })

  // Dados brutos do banco
  const transactions = ref<Transaction[]>([])
  const categories = ref<Category[]>([])
  const creditCards = ref<CreditCard[]>([])
  const accounts = ref<Account[]>([])
  const budgets = ref<Budget[]>([])
  const investments = ref<Investment[]>([])
  const recurringIncomes = ref<RecurringTransaction[]>([])
  const recurringExpenses = ref<RecurringTransaction[]>([])
  const creditCardInvoices = ref<CreditCardInvoice[]>([])

  // Evita fetch duplo: só refetch quando o userId realmente mudar (ex.: outro login)
  const lastFetchedUserId = ref<string | null>(null)

  // Nome do usuário
  const userName = computed(() => {
    const u = user.value
    if (!u) return 'Usuário'
    return u.user_metadata?.full_name?.split(' ')[0] || u.email?.split('@')[0] || 'Usuário'
  })

  // Nome do mês do período (ex.: "Fevereiro")
  const monthName = computed(() => {
    const d = new Date(selectedPeriod.value.year, selectedPeriod.value.month, 1)
    return d.toLocaleDateString('pt-BR', { month: 'long' }).replace(/^\w/, (c) => c.toUpperCase())
  })

  // Datas do período selecionado
  const periodDates = computed(() => {
    const startDate = new Date(selectedPeriod.value.year, selectedPeriod.value.month, 1)
    const endDate = new Date(selectedPeriod.value.year, selectedPeriod.value.month + 1, 0)
    return {
      start: startDate.toISOString().split('T')[0],
      end: endDate.toISOString().split('T')[0],
    }
  })

  // Transações do período atual (mesmo critério do extrato: YYYY-MM-DD por partes da string)
  const periodTransactions = computed(() => {
    return transactions.value.filter((t) => {
      const dateParts = (t.transaction_date || '').toString().split('T')[0].split('-')
      const transactionYear = parseInt(dateParts[0], 10)
      const transactionMonth = parseInt(dateParts[1], 10) - 1
      return (
        !Number.isNaN(transactionYear) &&
        !Number.isNaN(transactionMonth) &&
        transactionMonth === selectedPeriod.value.month &&
        transactionYear === selectedPeriod.value.year
      )
    })
  })

  // Saídas recorrentes de CONTA ainda não lançadas no período (igual ao extrato: entram em "A pagar" e "Total recorrentes")
  const saidasVirtuaisNoPeriodoAmount = computed(() => {
    const periodo = periodTransactions.value
    const toNum = (v: unknown) => (typeof v === 'number' ? v : Number(v) || 0)
    const { month, year } = selectedPeriod.value
    const recurringIdsWithReal = new Set(
      periodo.filter((t) => t.recurring_transaction_id).map((t) => t.recurring_transaction_id as string)
    )
    const lastDayOfMonth = new Date(year, month + 1, 0).getDate()
    const monthStart = `${year}-${String(month + 1).padStart(2, '0')}-01`
    const monthEnd = `${year}-${String(month + 1).padStart(2, '0')}-${String(lastDayOfMonth).padStart(2, '0')}`
    let total = 0
    for (const r of recurringExpenses.value) {
      if (!r.is_active || r.credit_card_id) continue
      let occurrenceDate: Date | null = null
      if (r.frequency === 'monthly' && r.day_of_month != null) {
        const day = Math.min(r.day_of_month, lastDayOfMonth)
        occurrenceDate = new Date(year, month, day, 12, 0, 0)
      } else if (r.next_occurrence) {
        const next = new Date(r.next_occurrence)
        if (next.getMonth() === month && next.getFullYear() === year) {
          occurrenceDate = next
        }
      }
      if (!occurrenceDate) continue
      const occurrenceStr = occurrenceDate.toISOString().slice(0, 10)
      const startStr = r.start_date ? r.start_date.slice(0, 10) : null
      const endStr = r.end_date ? r.end_date.slice(0, 10) : null
      if (startStr && occurrenceStr < startStr) continue
      if (endStr && occurrenceStr > endStr) continue
      if (recurringIdsWithReal.has(r.id)) continue
      total += Math.abs(toNum(r.amount))
    }
    return total
  })

  // Summary Cards Data (igual ao extrato: A pagar, Receita mensal, A receber, Total recorrentes)
  const summaryData = computed(() => {
    const periodo = periodTransactions.value
    const toNum = (v: unknown) => (typeof v === 'number' ? v : Number(v) || 0)
    const periodTxConta = periodo.filter((t) => !t.credit_card_id)
    const monthKey = `${selectedPeriod.value.year}-${String(selectedPeriod.value.month + 1).padStart(2, '0')}`

    // Total faturas de cartão não pagas (referência do mês selecionado)
    const totalFaturasCartao = unpaidInvoicesAmountForMonth.value
    const saidasVirtuais = saidasVirtuaisNoPeriodoAmount.value

    if (isSelectedMonthFuture.value) {
      const aPagar = projectedSaidasRecorrentesSelectedMonth.value + totalFaturasCartao
      const receitaMensal = projectedReceitaSelectedMonth.value
      return {
        aPagar,
        receitaMensal,
        aReceber: receitaMensal,
        totalRecorrentes: projectedReceitaSelectedMonth.value + projectedSaidasRecorrentesSelectedMonth.value,
      }
    }

    // A pagar: despesas de conta pendentes + faturas não pagas + saídas recorrentes virtuais (conta, ainda não lançadas)
    const aPagarConta = periodTxConta
      .filter(
        (t) =>
          t.type === 'expense' &&
          !t.is_paid &&
          !(t.invoice_id && !t.credit_card_id)
      )
      .reduce((sum, t) => sum + Math.abs(toNum(t.amount)), 0)
    const aPagar = aPagarConta + totalFaturasCartao + saidasVirtuais

    // Rendas recorrentes ativas ainda não realizadas no período
    const realizedRecurringIds = new Set(
      periodo.filter((t) => t.type === 'income' && t.recurring_transaction_id).map((t) => t.recurring_transaction_id!)
    )
    const rendasAindaNaoRealizadas = recurringIncomes.value
      .filter((r) => r.is_active !== false && !realizedRecurringIds.has(r.id))
      .reduce((sum, r) => sum + toNum(r.amount), 0)

    // Receita mensal: entradas do período (conta) + rendas não realizadas
    const receitaTransacoes = periodTxConta
      .filter((t) => t.type === 'income')
      .reduce((sum, t) => sum + toNum(t.amount), 0)
    const receitaMensal = receitaTransacoes + rendasAindaNaoRealizadas

    // A receber: receitas pendentes (conta) + rendas não realizadas
    const receitasPendentes = periodTxConta
      .filter((t) => t.type === 'income' && !t.is_paid)
      .reduce((sum, t) => sum + toNum(t.amount), 0)
    const aReceber = receitasPendentes + rendasAindaNaoRealizadas

    // Total recorrentes: transações de conta recorrentes no período + saídas virtuais (igual extrato)
    const totalRecorrentesReal = periodTxConta
      .filter((t) => t.is_recurring)
      .reduce((sum, t) => sum + Math.abs(toNum(t.amount)), 0)
    const totalRecorrentes = totalRecorrentesReal + saidasVirtuais

    return {
      aPagar,
      receitaMensal,
      aReceber,
      totalRecorrentes,
    }
  })

  // Transações de cartão do mês ANTERIOR (compras que entram na fatura do mês selecionado) — mesma regra do extrato
  const previousMonthCardTransactions = computed(() => {
    const { month, year } = selectedPeriod.value
    const prevDate = new Date(year, month - 1, 1)
    const prevMonth = prevDate.getMonth()
    const prevYear = prevDate.getFullYear()
    return transactions.value.filter((t) => {
      if (!t.credit_card_id) return false
      const dateParts = (t.transaction_date || '').toString().split('T')[0].split('-')
      const transactionYear = parseInt(dateParts[0], 10)
      const transactionMonth = parseInt(dateParts[1], 10) - 1
      return (
        !Number.isNaN(transactionYear) &&
        !Number.isNaN(transactionMonth) &&
        transactionMonth === prevMonth &&
        transactionYear === prevYear
      )
    })
  })

  // Saídas recorrentes de cartão do mês ANTERIOR (compras virtuais que entram na fatura do mês selecionado)
  const previousMonthCardRecurringTransactions = computed(() => {
    const { month, year } = selectedPeriod.value
    const prevDate = new Date(year, month - 1, 1)
    const prevMonth = prevDate.getMonth()
    const prevYear = prevDate.getFullYear()

    const saidas = recurringExpenses.value.filter(
      (r) => r.is_active && r.credit_card_id
    )

    const lastDayOfMonth = new Date(prevYear, prevMonth + 1, 0).getDate()
    const result: any[] = []

    for (const r of saidas) {
      let occurrenceDate: Date | null = null

      if (r.frequency === 'monthly' && r.day_of_month != null) {
        const day = Math.min(r.day_of_month, lastDayOfMonth)
        occurrenceDate = new Date(prevYear, prevMonth, day, 12, 0, 0)
      } else if (r.next_occurrence) {
        const next = new Date(r.next_occurrence)
        if (next.getMonth() === prevMonth && next.getFullYear() === prevYear) {
          occurrenceDate = next
        }
      }

      if (!occurrenceDate) continue

      const occurrenceStr = occurrenceDate.toISOString().slice(0, 10)
      const startStr = r.start_date ? r.start_date.slice(0, 10) : null
      const endStr = r.end_date ? r.end_date.slice(0, 10) : null
      if (startStr && occurrenceStr < startStr) continue
      if (endStr && occurrenceStr > endStr) continue

      result.push({
        ...r,
        transaction_date: occurrenceStr,
      })
    }

    return result
  })

  // Faturas do mês: valor = soma das compras do mês anterior por cartão (igual extrato), não invoice.total_amount
  const monthKeyRef = computed(() =>
    `${selectedPeriod.value.year}-${String(selectedPeriod.value.month + 1).padStart(2, '0')}`
  )
  const paidInvoicesAmountForMonth = computed(() => {
    const toNum = (v: unknown) => (typeof v === 'number' ? v : Number(v) || 0)
    const prevMonthCartao = previousMonthCardTransactions.value
    const prevMonthCartaoRecurring = previousMonthCardRecurringTransactions.value

    const recurringIdsWithReal = new Set(
      prevMonthCartao
        .filter((t) => t.recurring_transaction_id)
        .map((t) => t.recurring_transaction_id as string)
    )

    const byCard = new Map<string, number>()
    for (const t of prevMonthCartao) {
      const cid = t.credit_card_id!
      byCard.set(cid, (byCard.get(cid) ?? 0) + Math.abs(toNum(t.amount)))
    }
    for (const r of prevMonthCartaoRecurring) {
      if (!recurringIdsWithReal.has(r.id)) {
        const cid = r.credit_card_id!
        byCard.set(cid, (byCard.get(cid) ?? 0) + Math.abs(toNum(r.amount)))
      }
    }

    let total = 0
    for (const [creditCardId, totalCard] of byCard) {
      if (totalCard <= 0) continue
      const inv = creditCardInvoices.value.find((i) => {
        if (i.credit_card_id !== creditCardId) return false
        return (i.reference_month || '').slice(0, 7) === monthKeyRef.value
      })
      const isPaid =
        inv &&
        ((inv.status || '').toLowerCase() === 'paid' ||
          (inv.paid_amount != null && toNum(inv.paid_amount) >= totalCard))
      if (isPaid) total += totalCard
    }
    return total
  })
  const unpaidInvoicesAmountForMonth = computed(() => {
    const toNum = (v: unknown) => (typeof v === 'number' ? v : Number(v) || 0)
    const prevMonthCartao = previousMonthCardTransactions.value
    const prevMonthCartaoRecurring = previousMonthCardRecurringTransactions.value

    const recurringIdsWithReal = new Set(
      prevMonthCartao
        .filter((t) => t.recurring_transaction_id)
        .map((t) => t.recurring_transaction_id as string)
    )

    const byCard = new Map<string, number>()
    for (const t of prevMonthCartao) {
      const cid = t.credit_card_id!
      byCard.set(cid, (byCard.get(cid) ?? 0) + Math.abs(toNum(t.amount)))
    }
    for (const r of prevMonthCartaoRecurring) {
      if (!recurringIdsWithReal.has(r.id)) {
        const cid = r.credit_card_id!
        byCard.set(cid, (byCard.get(cid) ?? 0) + Math.abs(toNum(r.amount)))
      }
    }

    let total = 0
    for (const [creditCardId, totalCard] of byCard) {
      if (totalCard <= 0) continue
      const inv = creditCardInvoices.value.find((i) => {
        if (i.credit_card_id !== creditCardId) return false
        return (i.reference_month || '').slice(0, 7) === monthKeyRef.value
      })
      const isPaid =
        inv &&
        ((inv.status || '').toLowerCase() === 'paid' ||
          (inv.paid_amount != null && toNum(inv.paid_amount) >= totalCard))
      if (!isPaid) total += totalCard
    }
    return total
  })

  // Mês selecionado é futuro? (para mostrar projeções em todo o dashboard)
  const isSelectedMonthFuture = computed(() => {
    const today = new Date()
    const realMonth = today.getMonth()
    const realYear = today.getFullYear()
    const { month, year } = selectedPeriod.value
    return year > realYear || (year === realYear && month > realMonth)
  })

  // Valores projetados para o mês selecionado (quando é futuro: rendas e despesas recorrentes mensais)
  const projectedReceitaSelectedMonth = computed(() => {
    const toNum = (v: unknown) => (typeof v === 'number' ? v : Number(v) || 0)
    const { month, year } = selectedPeriod.value
    const lastDay = new Date(year, month + 1, 0).getDate()
    const monthStart = `${year}-${String(month + 1).padStart(2, '0')}-01`
    const monthEnd = `${year}-${String(month + 1).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`
    return recurringIncomes.value
      .filter((r) => r.is_active !== false && r.frequency === 'monthly')
      .filter((r) => {
        const startStr = r.start_date ? r.start_date.slice(0, 10) : null
        const endStr = r.end_date ? r.end_date.slice(0, 10) : null
        if (startStr && monthEnd < startStr) return false
        if (endStr && monthStart > endStr) return false
        return true
      })
      .reduce((sum, r) => sum + toNum(r.amount), 0)
  })
  const projectedSaidasRecorrentesSelectedMonth = computed(() => {
    const toNum = (v: unknown) => (typeof v === 'number' ? v : Number(v) || 0)
    const { month, year } = selectedPeriod.value
    const lastDay = new Date(year, month + 1, 0).getDate()
    const monthStart = `${year}-${String(month + 1).padStart(2, '0')}-01`
    const monthEnd = `${year}-${String(month + 1).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`
    return recurringExpenses.value
      .filter((r) => r.is_active !== false && r.frequency === 'monthly')
      .filter((r) => {
        const startStr = r.start_date ? r.start_date.slice(0, 10) : null
        const endStr = r.end_date ? r.end_date.slice(0, 10) : null
        if (startStr && monthEnd < startStr) return false
        if (endStr && monthStart > endStr) return false
        return true
      })
      .reduce((sum, r) => sum + Math.abs(toNum(r.amount)), 0)
  })

  // Total das faturas do mês (pagas + não pagas) — para alinhar balanço com extrato
  const totalInvoicesAmountForMonth = computed(
    () => paidInvoicesAmountForMonth.value + unpaidInvoicesAmountForMonth.value
  )

  // Entradas e saídas totais do período (balanço do mês) — mesma lógica do extrato (lista do mês)
  const balanceData = computed(() => {
    const periodo = periodTransactions.value
    const toNum = (v: unknown) => (typeof v === 'number' ? v : Number(v) || 0)
    const periodTxConta = periodo.filter((t) => !t.credit_card_id)

    if (isSelectedMonthFuture.value) {
      const entradas = projectedReceitaSelectedMonth.value
      const saidas = projectedSaidasRecorrentesSelectedMonth.value + unpaidInvoicesAmountForMonth.value
      return {
        saldo: entradas - saidas,
        entradas,
        saidas,
      }
    }

    // Entradas: todas as entradas de conta no período + rendas recorrentes ainda não realizadas (igual extrato)
    const realizedRecurringIds = new Set(
      periodo.filter((t) => t.type === 'income' && t.recurring_transaction_id).map((t) => t.recurring_transaction_id!)
    )
    const rendasAindaNaoRealizadas = recurringIncomes.value
      .filter((r) => r.is_active !== false && !realizedRecurringIds.has(r.id))
      .reduce((sum, r) => sum + toNum(r.amount), 0)
    const entradasTransacoes = periodTxConta
      .filter((t) => t.type === 'income')
      .reduce((sum, t) => sum + toNum(t.amount), 0)
    const entradas = entradasTransacoes + rendasAindaNaoRealizadas

    // Saídas: todas as despesas de conta no período (exc. pagamento fatura) + saídas virtuais + total faturas do mês (igual extrato)
    const saidasTransacoes = periodTxConta
      .filter(
        (t) =>
          t.type === 'expense' &&
          !(t.invoice_id && !t.credit_card_id)
      )
      .reduce((sum, t) => sum + Math.abs(toNum(t.amount)), 0)
    const saidas =
      saidasTransacoes +
      saidasVirtuaisNoPeriodoAmount.value +
      totalInvoicesAmountForMonth.value

    return {
      saldo: entradas - saidas,
      entradas,
      saidas,
    }
  })

  // Dados do gráfico: últimos 6 meses + mês atual + próximos 2 meses (mesma lógica do card Saídas para saídas)
  const chartSeries = computed<ChartSeries[]>(() => {
    const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']
    const currentMonth = selectedPeriod.value.month
    const currentYear = selectedPeriod.value.year
    const toNum = (v: unknown) => (typeof v === 'number' ? v : Number(v) || 0)

    const entradasData: ChartDataPoint[] = []
    const saidasData: ChartDataPoint[] = []

    // i de 5 a -2: 6 meses atrás, mês atual, 2 meses à frente
    for (let i = 5; i >= -2; i--) {
      let month = currentMonth - i
      let year = currentYear

      if (month < 0) {
        month += 12
        year -= 1
      } else if (month > 11) {
        month -= 12
        year += 1
      }

      const monthKey = `${year}-${String(month + 1).padStart(2, '0')}`

      const monthTransactions = transactions.value.filter((t) => {
        const dateParts = (t.transaction_date || '').toString().split('T')[0].split('-')
        const transactionYear = parseInt(dateParts[0], 10)
        const transactionMonth = parseInt(dateParts[1], 10) - 1
        return (
          !Number.isNaN(transactionYear) &&
          !Number.isNaN(transactionMonth) &&
          transactionMonth === month &&
          transactionYear === year
        )
      })

      // Entradas = rendas já recebidas no mês
      const entradas = monthTransactions
        .filter((t) => t.type === 'income' && t.is_paid)
        .reduce((sum, t) => sum + toNum(t.amount), 0)

      // Saídas = despesas de conta pagas (sem cartão, sem "Pagamento fatura") + faturas do mês pagas
      const saidasConta = monthTransactions
        .filter(
          (t) =>
            t.type === 'expense' &&
            t.is_paid &&
            !t.credit_card_id &&
            !(t.invoice_id && t.type === 'expense')
        )
        .reduce((sum, t) => sum + Math.abs(toNum(t.amount)), 0)

      const prevDate = new Date(year, month - 1, 1)
      const prevMonth = prevDate.getMonth()
      const prevYear = prevDate.getFullYear()
      const prevMonthCartao = transactions.value.filter((t) => {
        if (!t.credit_card_id) return false
        const dateParts = (t.transaction_date || '').toString().split('T')[0].split('-')
        const transactionYear = parseInt(dateParts[0], 10)
        const transactionMonth = parseInt(dateParts[1], 10) - 1
        return (
          !Number.isNaN(transactionYear) &&
          !Number.isNaN(transactionMonth) &&
          transactionMonth === prevMonth &&
          transactionYear === prevYear
        )
      })
      const byCard = new Map<string, number>()
      for (const t of prevMonthCartao) {
        const cid = t.credit_card_id!
        byCard.set(cid, (byCard.get(cid) ?? 0) + Math.abs(toNum(t.amount)))
      }
      let saidasFaturas = 0
      for (const [creditCardId, totalCard] of byCard) {
        if (totalCard <= 0) continue
        const inv = creditCardInvoices.value.find((i) => {
          if (i.credit_card_id !== creditCardId) return false
          return (i.reference_month || '').slice(0, 7) === monthKey
        })
        const isPaid =
          inv &&
          ((inv.status || '').toLowerCase() === 'paid' ||
            (inv.paid_amount != null && toNum(inv.paid_amount) >= totalCard))
        if (isPaid) saidasFaturas += totalCard
      }

      let saidas = saidasConta + saidasFaturas

      // Mês futuro = após a data de HOJE (não o mês selecionado), para que Mar/Abr/Mai etc. mostrem projeção quando ainda não ocorreram
      const today = new Date()
      const realMonth = today.getMonth()
      const realYear = today.getFullYear()
      const isFutureMonth =
        year > realYear || (year === realYear && month > realMonth)
      if (isFutureMonth) {
        const lastDayOfMonth = new Date(year, month + 1, 0).getDate()
        // Entradas projetadas: rendas recorrentes ativas que ocorrem nesse mês
        const entradasProjetadas = recurringIncomes.value
          .filter((r) => r.is_active !== false)
          .filter((r) => {
            if (r.frequency !== 'monthly') return false
            const startStr = r.start_date ? r.start_date.slice(0, 10) : null
            const endStr = r.end_date ? r.end_date.slice(0, 10) : null
            const monthStart = `${year}-${String(month + 1).padStart(2, '0')}-01`
            const monthEnd = `${year}-${String(month + 1).padStart(2, '0')}-${String(lastDayOfMonth).padStart(2, '0')}`
            if (startStr && monthEnd < startStr) return false
            if (endStr && monthStart > endStr) return false
            return true
          })
          .reduce((sum, r) => sum + toNum(r.amount), 0)
        // Saídas projetadas: despesas recorrentes ativas que ocorrem nesse mês
        const saidasProjetadas = recurringExpenses.value
          .filter((r) => r.is_active !== false)
          .filter((r) => {
            if (r.frequency !== 'monthly') return false
            const startStr = r.start_date ? r.start_date.slice(0, 10) : null
            const endStr = r.end_date ? r.end_date.slice(0, 10) : null
            const monthStart = `${year}-${String(month + 1).padStart(2, '0')}-01`
            const monthEnd = `${year}-${String(month + 1).padStart(2, '0')}-${String(lastDayOfMonth).padStart(2, '0')}`
            if (startStr && monthEnd < startStr) return false
            if (endStr && monthStart > endStr) return false
            return true
          })
          .reduce((sum, r) => sum + Math.abs(toNum(r.amount)), 0)
        entradasData.push({ label: months[month], value: entradasProjetadas })
        saidasData.push({ label: months[month], value: saidasProjetadas })
      } else {
        entradasData.push({ label: months[month], value: entradas })
        saidasData.push({ label: months[month], value: saidas })
      }
    }

    return [
      { name: 'Entradas', color: '#22C55E', data: entradasData },
      { name: 'Saídas', color: '#EF4444', data: saidasData },
    ]
  })

  // Gastos por categoria (mês selecionado: real ou projetado quando futuro)
  const categorySummary = computed<CategorySummary[]>(() => {
    const toNum = (v: unknown) => (typeof v === 'number' ? v : Number(v) || 0)
    const { month, year } = selectedPeriod.value
    const lastDay = new Date(year, month + 1, 0).getDate()
    const monthStart = `${year}-${String(month + 1).padStart(2, '0')}-01`
    const monthEnd = `${year}-${String(month + 1).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`

    const categoryMap = new Map<string, number>()

    if (isSelectedMonthFuture.value) {
      recurringExpenses.value
        .filter((r) => r.is_active !== false && r.frequency === 'monthly')
        .filter((r) => {
          const startStr = r.start_date ? r.start_date.slice(0, 10) : null
          const endStr = r.end_date ? r.end_date.slice(0, 10) : null
          if (startStr && monthEnd < startStr) return false
          if (endStr && monthStart > endStr) return false
          return true
        })
        .forEach((r) => {
          const key = r.category_id ?? '__sem_categoria__'
          categoryMap.set(key, (categoryMap.get(key) ?? 0) + Math.abs(toNum(r.amount)))
        })
    } else {
      const periodo = periodTransactions.value.filter((t) => t.type === 'expense' && t.is_paid)
      periodo.forEach((t) => {
        if (t.category_id) {
          categoryMap.set(t.category_id, (categoryMap.get(t.category_id) ?? 0) + Math.abs(toNum(t.amount)))
        }
      })
    }

    const totalGasto = [...categoryMap.values()].reduce((s, v) => s + v, 0)
    if (totalGasto === 0) return []

    const result: CategorySummary[] = []
    categoryMap.forEach((value, categoryId) => {
      const category = categories.value.find((c) => c.id === categoryId)
      result.push({
        id: categoryId === '__sem_categoria__' ? 'outros' : categoryId,
        name: category?.name ?? 'Outros',
        icon: category?.icon ?? null,
        color: category?.color ?? null,
        value,
        percentage: Math.round((value / totalGasto) * 100),
      })
    })
    return result.sort((a, b) => b.value - a.value).slice(0, 5)
  })

  // Contas pagas do mês (despesas de conta + faturas do mês de referência — alinhado ao extrato)
  const contasPagas = computed(() => {
    const toNum = (v: unknown) => (typeof v === 'number' ? v : Number(v) || 0)

    if (isSelectedMonthFuture.value) {
      const valorPago = 0
      const valorPendente = projectedSaidasRecorrentesSelectedMonth.value + unpaidInvoicesAmountForMonth.value
      const totalValor = valorPendente || 1
      return { valorPago, valorPendente, totalValor }
    }

    // Só despesas de conta; exclui "Pagamento fatura cartão" (invoice_id + expense) para não duplicar com faturas
    const periodo = periodTransactions.value.filter(
      (t) =>
        t.type === 'expense' &&
        !t.credit_card_id &&
        !(t.invoice_id && t.type === 'expense')
    )

    const valorPagoConta = periodo
      .filter((t) => t.is_paid)
      .reduce((sum, t) => sum + Math.abs(toNum(t.amount)), 0)
    const valorPendenteConta = periodo
      .filter((t) => !t.is_paid)
      .reduce((sum, t) => sum + Math.abs(toNum(t.amount)), 0)

    const valorPago = valorPagoConta + paidInvoicesAmountForMonth.value
    const valorPendente = valorPendenteConta + unpaidInvoicesAmountForMonth.value
    const totalValor = valorPago + valorPendente

    return { valorPago, valorPendente, totalValor: totalValor || 1 }
  })

  // Vencimentos próximos: apenas lançamentos que NÃO são de cartão + faturas de cartão
  const vencimentos = computed<Vencimento[]>(() => {
    const toNum = (v: unknown) => (typeof v === 'number' ? v : Number(v) || 0)
    const endNextMonth = new Date(selectedPeriod.value.year, selectedPeriod.value.month + 2, 0)

    // 1) Lançamentos que não são de cartão (sem credit_card_id), não pagos
    const fromTransactions = periodTransactions.value
      .filter((t) => t.type === 'expense' && !t.is_paid && !t.credit_card_id)
      .map((t) => {
        const category = categories.value.find((c) => c.id === t.category_id)
        return {
          id: t.id,
          descricao: t.description,
          tipo: category?.name || 'Outros',
          vencimento: parseTransactionDateLocal(t.transaction_date),
          valor: Math.abs(toNum(t.amount)),
          pago: false,
        }
      })

    // 2) Faturas de cartão (due_date no período atual ou próximo mês, não pagas; inclui vencidas)
    const startMonth = new Date(selectedPeriod.value.year, selectedPeriod.value.month - 1, 1)
    const fromInvoices = creditCardInvoices.value
      .filter((inv) => {
        const status = (inv.status || '').toLowerCase()
        if (status === 'paid') return false
        const due = new Date(inv.due_date)
        return due >= startMonth && due <= endNextMonth
      })
      .map((inv) => {
        const card = creditCards.value.find((c) => c.id === inv.credit_card_id)
        const total = toNum(inv.total_amount)
        const paid = toNum(inv.paid_amount)
        return {
          id: `invoice-${inv.id}`,
          descricao: `Fatura ${card?.name ?? 'Cartão'}${card?.last_digits ? ` •••• ${card.last_digits}` : ''}`,
          tipo: 'Cartão de crédito',
          vencimento: new Date(inv.due_date),
          valor: total - paid,
          pago: (inv.status || '').toLowerCase() === 'paid',
        }
      })

    return [...fromTransactions, ...fromInvoices]
      .sort((a, b) => a.vencimento.getTime() - b.vencimento.getTime())
      .slice(0, 5)
  })

  // Limite (orçamento total do mês) — reference_month no DB é date (ex.: 2025-02-01), comparar YYYY-MM
  const limiteData = computed(() => {
    const refMonth = `${selectedPeriod.value.year}-${String(selectedPeriod.value.month + 1).padStart(2, '0')}`
    const budgetTotal = budgets.value
      .filter((b) => (String(b.reference_month || '').slice(0, 7)) === refMonth)
      .reduce((sum, b) => sum + b.amount, 0)

    const gastoTotal = periodTransactions.value
      .filter((t) => t.type === 'expense' && t.is_paid)
      .reduce((sum, t) => sum + Math.abs(t.amount), 0)

    return {
      limite: budgetTotal,
      gasto: gastoTotal,
    }
  })

  // Investimentos
  const investmentsList = computed<InvestmentDisplay[]>(() => {
    return investments.value.slice(0, 4).map((inv) => ({
      id: inv.id,
      name: inv.name,
      status: 'ativo' as const,
      value: inv.current_value || 0,
    }))
  })

  // Cartões de crédito
  const creditCardsList = computed<CreditCardDisplay[]>(() => {
    return creditCards.value
      .filter((c) => c.is_active)
      .map((c) => ({
        id: c.id,
        name: c.name,
        lastDigits: c.last_digits || '0000',
        brand: (c.brand as CreditCardDisplay['brand']) || 'mastercard',
        color: c.color || '#6B7280',
        limit: c.credit_limit || 0,
        used: (c.credit_limit || 0) - (c.available_limit || 0),
      }))
  })

  // Provedores/Contas bancárias
  const providers = computed<ProviderDisplay[]>(() => {
    return accounts.value
      .filter((a) => a.is_active)
      .slice(0, 4)
      .map((a) => ({
        id: a.id,
        name: a.name,
        type: a.type,
        value: a.current_balance || 0,
        color: a.color || '#6B7280',
      }))
  })

  // Intervalo de datas para buscar transações: 6 meses antes do período selecionado até fim do mês selecionado
  function getTransactionDateRange(): { start: string; end: string } {
    const { month, year } = selectedPeriod.value
    const startDate = new Date(year, month - 6, 1)
    const endDate = new Date(year, month + 1, 0) // último dia do mês selecionado
    return {
      start: startDate.toISOString().split('T')[0],
      end: endDate.toISOString().split('T')[0],
    }
  }

  /** Obtém o ID do usuário logado (usa getSession quando useSupabaseUser ainda não resolveu). */
  async function getUserId(): Promise<string | null> {
    if (user.value?.id) return user.value.id
    const { data: { session } } = await supabase.auth.getSession()
    return session?.user?.id ?? null
  }

  // Fetch de dados do usuário logado
  async function fetchDashboardData() {
    const userId = await getUserId()
    if (!userId) return

    isLoading.value = true
    error.value = null

    try {
      const { start, end } = getTransactionDateRange()
      const invoiceDueStart = new Date(selectedPeriod.value.year, selectedPeriod.value.month - 1, 1).toISOString().split('T')[0]
      const invoiceDueEnd = new Date(selectedPeriod.value.year, selectedPeriod.value.month + 2, 0).toISOString().split('T')[0]

      // Buscar dados em paralelo
      const [
        transactionsResult,
        categoriesResult,
        creditCardsResult,
        accountsResult,
        budgetsResult,
        investmentsResult,
        recurringIncomesResult,
        recurringExpensesResult,
        invoicesResult,
      ] = await Promise.all([
        // Transações do período relevante (6 meses antes do mês selecionado até fim do mês selecionado)
        supabase
          .from('transactions')
          .select('*')
          .eq('user_id', userId)
          .gte('transaction_date', start)
          .lte('transaction_date', end)
          .order('transaction_date', { ascending: false }),

        // Categorias (ativas + inativas para exibir nomes de transações antigas)
        supabase.from('categories').select('*').eq('user_id', userId),

        // Cartões de crédito
        supabase.from('credit_cards').select('*').eq('user_id', userId).eq('is_active', true),

        // Contas
        supabase.from('accounts').select('*').eq('user_id', userId).eq('is_active', true),

        // Orçamentos
        supabase.from('budgets').select('*').eq('user_id', userId),

        // Investimentos
        supabase.from('investments').select('*').eq('user_id', userId),

        // Rendas recorrentes (recurring_transactions tipo income)
        supabase
          .from('recurring_transactions')
          .select('*')
          .eq('user_id', userId)
          .eq('type', 'income'),

        // Despesas recorrentes (recurring_transactions tipo expense) — para projeção nos meses futuros do gráfico
        supabase
          .from('recurring_transactions')
          .select('*')
          .eq('user_id', userId)
          .eq('type', 'expense'),

        // Faturas de cartão (vencimento no mês atual ou próximo)
        supabase
          .from('credit_card_invoices')
          .select('*')
          .eq('user_id', userId)
          .gte('due_date', invoiceDueStart)
          .lte('due_date', invoiceDueEnd)
          .order('due_date', { ascending: true }),
      ])

      // Verificar erros
      if (transactionsResult.error) throw transactionsResult.error
      if (categoriesResult.error) throw categoriesResult.error
      if (creditCardsResult.error) throw creditCardsResult.error
      if (accountsResult.error) throw accountsResult.error
      if (budgetsResult.error) throw budgetsResult.error
      if (investmentsResult.error) throw investmentsResult.error
      if (recurringIncomesResult.error) throw recurringIncomesResult.error
      if (recurringExpensesResult.error) throw recurringExpensesResult.error
      if (invoicesResult.error) throw invoicesResult.error

      // Atualizar estado (deduplicar por id para evitar itens repetidos)
      transactions.value = dedupeById(transactionsResult.data || [])
      categories.value = dedupeById(categoriesResult.data || [])
      creditCards.value = dedupeById(creditCardsResult.data || [])
      accounts.value = dedupeById(accountsResult.data || [])
      budgets.value = dedupeById(budgetsResult.data || [])
      investments.value = dedupeById(investmentsResult.data || [])
      recurringIncomes.value = dedupeById(recurringIncomesResult.data || [])
      recurringExpenses.value = dedupeById(recurringExpensesResult.data || [])
      creditCardInvoices.value = dedupeById(invoicesResult.data || [])
      lastFetchedUserId.value = userId
    } catch (err) {
      console.error('Erro ao carregar dados do dashboard:', err)
      error.value = 'Erro ao carregar dados do dashboard'
    } finally {
      isLoading.value = false
    }
  }


  // Marcar transação como paga
  async function markTransactionAsPaid(transactionId: string) {
    const userId = await getUserId()
    if (!userId) return

    try {
      const { error: updateError } = await supabase
        .from('transactions')
        .update({ is_paid: true, status: 'confirmed' })
        .eq('id', transactionId)
        .eq('user_id', userId)

      if (updateError) throw updateError

      // Atualizar estado local
      const index = transactions.value.findIndex((t) => t.id === transactionId)
      if (index !== -1) {
        transactions.value[index] = { ...transactions.value[index], is_paid: true, status: 'confirmed' }
      }
    } catch (err) {
      console.error('Erro ao marcar transação como paga:', err)
      throw err
    }
  }

  /** Salva o limite mensal (orçamento geral). Cria ou atualiza budget "Limite mensal" para o mês. */
  async function saveMonthlyLimit(amount: number): Promise<boolean> {
    const userId = await getUserId()
    if (!userId) return false

    const { year, month } = selectedPeriod.value
    const referenceMonthDate = `${year}-${String(month + 1).padStart(2, '0')}-01`

    try {
      const { data: existing } = await supabase
        .from('budgets')
        .select('id')
        .eq('user_id', userId)
        .eq('name', 'Limite mensal')
        .eq('reference_month', referenceMonthDate)
        .maybeSingle()

      if (existing) {
        const { error: updateError } = await supabase
          .from('budgets')
          .update({ amount, updated_at: new Date().toISOString() })
          .eq('id', existing.id)
        if (updateError) throw updateError
      } else {
        const { error: insertError } = await supabase.from('budgets').insert({
          user_id: userId,
          name: 'Limite mensal',
          category_id: null,
          amount,
          reference_month: referenceMonthDate,
          is_recurring: false,
        })
        if (insertError) throw insertError
      }

      await fetchDashboardData()
      return true
    } catch (err) {
      console.error('Erro ao salvar limite mensal:', err)
      return false
    }
  }

  // Só recarrega quando o userId mudar para outro (evita fetch duplo no primeiro load)
  watch(
    () => user.value?.id,
    (newId) => {
      if (newId && newId !== lastFetchedUserId.value) fetchDashboardData()
    },
    { immediate: false }
  )

  // Refetch quando o período selecionado mudar (para carregar transações do novo mês)
  watch(
    () => [selectedPeriod.value.month, selectedPeriod.value.year],
    () => {
      if (user.value?.id) {
        fetchDashboardData()
      }
    }
  )

  return {
    // Estado
    isLoading,
    error,
    selectedPeriod,

    // Dados computados
    userName,
    monthName,
    summaryData,
    balanceData,
    chartSeries,
    categorySummary,
    contasPagas,
    vencimentos,
    limiteData,
    investmentsList,
    creditCardsList,
    providers,

    // Ações
    fetchDashboardData,
    markTransactionAsPaid,
    saveMonthlyLimit,
  }
}
