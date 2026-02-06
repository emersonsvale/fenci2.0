import { ref, computed, watch, onMounted } from 'vue'
import { useSupabaseClient, useSupabaseUser, useState } from '#imports'
import type { Database, Transaction, Category, CreditCard, Account, RecurringTransaction, CreditCardInvoice } from 'shared/types/database.types'

/**
 * useExtrato - Composable para a página de extratos
 * Gerencia filtros, busca e exibição de transações
 */

export interface ExtratoPeriod {
  month: number
  year: number
}

export type ExtratoTab = 'recorrentes' | 'por_data' | 'hoje' | 'ver_tudo'
export type ExtratoStatus = 'entrada' | 'saida' | 'pago' | 'atrasado' | 'aguardando'

export interface DateFilter {
  startDate: string | null  // formato: 'YYYY-MM-DD'
  endDate: string | null    // formato: 'YYYY-MM-DD'
}

export interface ExtratoTransaction {
  id: string
  description: string
  category: {
    id: string
    name: string
    icon: string | null
    color: string | null
  } | null
  type: 'income' | 'expense' | 'transfer'
  date: Date
  time: string
  amount: number
  status: 'pago' | 'atrasado' | 'aguardando'
  isPaid: boolean
  isRecurring: boolean
  installmentInfo: {
    current: number
    total: number
    percentage: number
  } | null
  account: {
    id: string
    name: string
  } | null
  /** Indica que o item vem de uma renda recorrente (recurring_transactions tipo income) */
  isRendaRecorrente?: boolean
  /** Indica que o item vem de uma saída recorrente (recurring_transactions tipo expense) ainda não lançada */
  isSaidaRecorrente?: boolean
  /** ID da recurring_transaction quando isRendaRecorrente ou isSaidaRecorrente é true */
  recurringId?: string
  /** Tags da transação */
  tags?: string[]
  /** Linha de resumo da fatura do cartão (uma por cartão no período) */
  isFaturaSummary?: boolean
  /** ID do cartão quando isFaturaSummary é true */
  creditCardId?: string
  /** ID da fatura quando disponível */
  invoiceId?: string
  /** reference_month (YYYY-MM) quando isFaturaSummary, para pagamento sem invoiceId */
  referenceMonth?: string
  /** Data de vencimento da fatura (YYYY-MM-DD) quando isFaturaSummary */
  dueDate?: string
}

export interface ExtratoCreditCard {
  id: string
  name: string
  brand: string
  color: string
  transactions: {
    id: string
    description: string
    amount: number
    installmentInfo: string | null
    /** Data da compra (YYYY-MM-DD) */
    transactionDate: string
    category: {
      id: string
      name: string
      icon: string | null
      color: string | null
    } | null
  }[]
  totalAmount: number
}

export interface ExtratoSummary {
  aPagar: number
  receitaMensal: number
  aReceber: number
  totalRecorrentes: number
}

// Grupo de transações por data (para aba "Por data")
export interface TransactionDateGroup {
  dateKey: string           // formato: 'YYYY-MM-DD'
  dayOfWeek: string         // ex: 'domingo'
  formattedDate: string     // ex: '1 fev. 2026'
  monthName: string         // ex: 'Fevereiro'
  dailyBalance: number      // saldo do dia (entradas - saídas)
  transactions: ExtratoTransaction[]
}

// Lista de citações motivacionais
const quotes = [
  { text: 'Uma jornada de mil milhas começa com o primeiro passo.', author: 'Lao Tsé' },
  { text: 'O segredo para ir em frente é começar.', author: 'Mark Twain' },
  { text: 'Não é o mais forte que sobrevive, mas o que melhor se adapta às mudanças.', author: 'Charles Darwin' },
  { text: 'Faça do seu dinheiro um servo, não um mestre.', author: 'Francis Bacon' },
  { text: 'A economia é a base da liberdade.', author: 'Calvin Coolidge' },
  { text: 'O dinheiro é um excelente servo, mas um péssimo mestre.', author: 'P.T. Barnum' },
]

export function useExtrato() {
  const supabase = useSupabaseClient<Database>()
  const user = useSupabaseUser()

  // Estado
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  // Período selecionado
  const selectedPeriod = ref<ExtratoPeriod>({
    month: new Date().getMonth(),
    year: new Date().getFullYear(),
  })

  // Filtros
  const activeTab = ref<ExtratoTab>('ver_tudo')
  const searchQuery = ref('')
  const activeStatusFilters = ref<ExtratoStatus[]>([])
  const activeTagFilters = ref<string[]>([])
  const dateFilter = ref<DateFilter>({ startDate: null, endDate: null })

  // Dados brutos (usando useState para persistir entre navegações)
  const transactions = useState<Transaction[]>('extrato-transactions', () => [])
  const categories = useState<Category[]>('extrato-categories', () => [])
  const creditCards = useState<CreditCard[]>('extrato-creditCards', () => [])
  const accounts = useState<Account[]>('extrato-accounts', () => [])
  const recurringTransactions = useState<RecurringTransaction[]>('extrato-recurring', () => [])
  const invoices = useState<CreditCardInvoice[]>('extrato-invoices', () => [])

  // Chave para forçar re-render da lista após atualizações (marcar pago/não pago)
  const listRefreshKey = useState<number>('extrato-list-refresh-key', () => 0)

  // Citação do dia (baseada no dia do mês)
  const dailyQuote = computed(() => {
    const dayOfMonth = new Date().getDate()
    return quotes[dayOfMonth % quotes.length]
  })

  // Nome do usuário
  const userName = computed(() => {
    const u = user.value
    if (!u) return 'Usuário'
    return u.user_metadata?.full_name || u.email?.split('@')[0] || 'Usuário'
  })

  // Nome do mês para exibição
  const monthName = computed(() => {
    const months = [
      'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
      'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
    ]
    return months[selectedPeriod.value.month]
  })

  // Transações do período (mês/ano selecionado)
  const periodTransactions = computed(() => {
    return transactions.value.filter((t) => {
      // Extrair ano e mês diretamente da string de data (formato: YYYY-MM-DD)
      // Isso evita problemas de timezone
      const dateParts = t.transaction_date.split('T')[0].split('-')
      const transactionYear = parseInt(dateParts[0], 10)
      const transactionMonth = parseInt(dateParts[1], 10) - 1 // Converter para 0-indexed

      return transactionMonth === selectedPeriod.value.month && transactionYear === selectedPeriod.value.year
    })
  })

  // Transações de cartão do mês ANTERIOR ao selecionado (compras que entram na fatura do mês selecionado)
  // Regra: compras de janeiro → fatura de fevereiro (paga em fev)
  const previousMonthCardTransactions = computed(() => {
    const { month, year } = selectedPeriod.value
    const prevDate = new Date(year, month - 1, 1)
    const prevMonth = prevDate.getMonth()
    const prevYear = prevDate.getFullYear()
    return transactions.value.filter((t) => {
      if (!t.credit_card_id) return false
      const dateParts = t.transaction_date.split('T')[0].split('-')
      const transactionYear = parseInt(dateParts[0], 10)
      const transactionMonth = parseInt(dateParts[1], 10) - 1
      return transactionMonth === prevMonth && transactionYear === prevYear
    })
  })

  // Rendas recorrentes (recurring_transactions tipo income) expandidas para o período como transações de exibição
  const rendasAsTransactions = computed<ExtratoTransaction[]>(() => {
    const month = selectedPeriod.value.month
    const year = selectedPeriod.value.year
    const rendas = recurringTransactions.value.filter(
      (r) => r.type === 'income' && r.is_active
    )

    const lastDayOfMonth = new Date(year, month + 1, 0).getDate()
    const result: ExtratoTransaction[] = []

    for (const r of rendas) {
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

      const category = categories.value.find((c) => c.id === r.category_id)
      const account = accounts.value.find((a) => a.id === r.account_id)

      result.push({
        id: `renda-${r.id}`,
        description: r.description,
        category: category
          ? {
              id: category.id,
              name: category.name,
              icon: category.icon,
              color: category.color,
            }
          : null,
        type: 'income',
        date: occurrenceDate,
        time: '12:00',
        amount: r.amount,
        status: 'aguardando',
        isPaid: false,
        isRecurring: true,
        installmentInfo: null,
        account: account ? { id: account.id, name: account.name } : null,
        isRendaRecorrente: true,
        recurringId: r.id,
      })
    }

    return result.sort((a, b) => b.date.getTime() - a.date.getTime())
  })

  // Saídas recorrentes (recurring_transactions tipo expense) expandidas para o período — aparecem em meses em que ainda não foi lançado
  const saidasAsTransactions = computed<ExtratoTransaction[]>(() => {
    const month = selectedPeriod.value.month
    const year = selectedPeriod.value.year
    const saidas = recurringTransactions.value.filter(
      (r) => r.type === 'expense' && r.is_active
    )

    const lastDayOfMonth = new Date(year, month + 1, 0).getDate()
    const result: ExtratoTransaction[] = []

    for (const r of saidas) {
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

      const category = categories.value.find((c) => c.id === r.category_id)
      const account = accounts.value.find((a) => a.id === r.account_id)
      const amount = -Math.abs(r.amount)

      result.push({
        id: `saida-${r.id}`,
        description: r.description,
        category: category
          ? {
              id: category.id,
              name: category.name,
              icon: category.icon,
              color: category.color,
            }
          : null,
        type: 'expense',
        date: occurrenceDate,
        time: '12:00',
        amount,
        status: 'aguardando',
        isPaid: false,
        isRecurring: true,
        installmentInfo: null,
        account: account ? { id: account.id, name: account.name } : null,
        isSaidaRecorrente: true,
        recurringId: r.id,
      })
    }

    return result.sort((a, b) => b.date.getTime() - a.date.getTime())
  })

  // Summary data (despesas de conta + totais de faturas de cartão, sem duplicar)
  const summaryData = computed<ExtratoSummary>(() => {
    const periodo = periodTransactions.value
    const periodTxConta = periodo.filter((t) => !t.credit_card_id)
    const recurringIdsWithReal = new Set(
      periodo
        .filter((t) => t.recurring_transaction_id)
        .map((t) => t.recurring_transaction_id as string)
    )

    // Total das faturas do cartão no mês selecionado = apenas faturas NÃO PAGAS (compras do mês anterior)
    const monthKeyRef = `${selectedPeriod.value.year}-${String(selectedPeriod.value.month + 1).padStart(2, '0')}`
    const totalFaturasCartao = (() => {
      const prevMonthCartao = previousMonthCardTransactions.value
      const byCard = new Map<string, number>()
      for (const t of prevMonthCartao) {
        const cid = t.credit_card_id!
        byCard.set(cid, (byCard.get(cid) ?? 0) + Math.abs(t.amount))
      }
      let total = 0
      for (const [creditCardId, totalCard] of byCard) {
        const inv = invoices.value.find((i) => {
          if (i.credit_card_id !== creditCardId) return false
          const ref = i.reference_month ?? ''
          const norm = ref.slice(0, 7)
          return norm === monthKeyRef
        })
        const isPaid =
          inv &&
          (inv.status === 'paid' ||
            (inv.paid_amount != null &&
              inv.total_amount != null &&
              inv.paid_amount >= inv.total_amount))
        if (!isPaid) total += totalCard
      }
      return total
    })()

    // A pagar: despesas de conta pendentes (exceto "Pagamento fatura cartão") + faturas não pagas + saídas recorrentes virtuais
    const aPagarConta = periodTxConta
      .filter(
        (t) =>
          t.type === 'expense' &&
          !t.is_paid &&
          !(t.invoice_id && !t.credit_card_id) // exclui pagamento de fatura (só reflete na fatura como paga)
      )
      .reduce((sum, t) => sum + Math.abs(t.amount), 0)
    const saidasVirtuaisNoPeriodo = saidasAsTransactions.value.filter(
      (s) => !recurringIdsWithReal.has(s.recurringId!)
    )
    const aPagar = aPagarConta + totalFaturasCartao + saidasVirtuaisNoPeriodo.reduce((sum, s) => sum + Math.abs(s.amount), 0)

    // Rendas ativas (tipo income)
    const rendasAtivas = recurringTransactions.value.filter(
      (r) => r.type === 'income' && r.is_active
    )
    const totalRendas = rendasAtivas.reduce((sum, r) => sum + (r.amount || 0), 0)

    // Rendas já realizadas neste período (existe transação com recurring_transaction_id)
    const totalRendasRealizadas = rendasAtivas
      .filter((r) => recurringIdsWithReal.has(r.id))
      .reduce((sum, r) => sum + (r.amount || 0), 0)
    const totalRendasAindaNaoRealizadas = totalRendas - totalRendasRealizadas

    // Receita mensal: apenas transações de conta (entrada)
    const receitaTransacoes = periodTxConta
      .filter((t) => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0)
    const receitaMensal = receitaTransacoes + totalRendasAindaNaoRealizadas

    // A receber: receitas de conta pendentes + rendas ainda não realizadas
    const receitasPendentes = periodTxConta
      .filter((t) => t.type === 'income' && !t.is_paid)
      .reduce((sum, t) => sum + t.amount, 0)
    const aReceber = receitasPendentes + totalRendasAindaNaoRealizadas

    // Total recorrentes: apenas transações de conta recorrentes + saídas virtuais (cartão não entra aqui para não duplicar)
    const totalRecorrentesReal = periodTxConta
      .filter((t) => t.is_recurring)
      .reduce((sum, t) => sum + Math.abs(t.amount), 0)
    const totalRecorrentes = totalRecorrentesReal + saidasVirtuaisNoPeriodo.reduce((sum, s) => sum + Math.abs(s.amount), 0)

    return {
      aPagar,
      receitaMensal,
      aReceber,
      totalRecorrentes,
    }
  })

  // Contas pagas do mês (apenas despesas de conta, não cartão)
  const contasPagas = computed(() => {
    const despesas = periodTransactions.value.filter((t) => t.type === 'expense' && !t.credit_card_id)
    const pagas = despesas.filter((t) => t.is_paid).length
    const total = despesas.length

    return { pagas, total }
  })

  // Tags já usadas em outros lançamentos (para autocomplete)
  const existingTags = computed(() => {
    const set = new Set<string>()
    for (const t of transactions.value) {
      if (t.tags && Array.isArray(t.tags)) {
        for (const tag of t.tags) {
          if (typeof tag === 'string' && tag.trim()) set.add(tag.trim())
        }
      }
    }
    return Array.from(set).sort((a, b) => a.localeCompare(b, 'pt-BR', { sensitivity: 'base' }))
  })

  // Determinar status da transação
  function getTransactionStatus(t: Transaction): 'pago' | 'atrasado' | 'aguardando' {
    if (t.is_paid) return 'pago'
    
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const transactionDate = new Date(t.transaction_date)
    transactionDate.setHours(0, 0, 0, 0)
    
    if (transactionDate < today) return 'atrasado'
    return 'aguardando'
  }

  // Mapear transações para o formato de exibição
  function mapTransaction(t: Transaction): ExtratoTransaction {
    const category = categories.value.find((c) => c.id === t.category_id)
    const account = accounts.value.find((a) => a.id === t.account_id)
    const transactionDate = new Date(t.transaction_date)

    return {
      id: t.id,
      description: t.description,
      category: category ? {
        id: category.id,
        name: category.name,
        icon: category.icon,
        color: category.color,
      } : null,
      type: t.type as 'income' | 'expense' | 'transfer',
      date: transactionDate,
      time: transactionDate.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      amount: t.amount,
      status: getTransactionStatus(t),
      isPaid: t.is_paid || false,
      isRecurring: t.is_recurring || false,
      installmentInfo: t.total_installments && t.total_installments > 1 && t.installment_number
        ? {
            current: t.installment_number,
            total: t.total_installments,
            percentage: Math.round((t.installment_number / t.total_installments) * 100),
          }
        : null,
      account: account ? {
        id: account.id,
        name: account.name,
      } : null,
      tags: t.tags && Array.isArray(t.tags) ? [...t.tags] : [],
    }
  }

  // Transações filtradas (transações de conta + rendas/saídas recorrentes + linhas de fatura por cartão)
  const filteredTransactions = computed<ExtratoTransaction[]>(() => {
    const periodTx = periodTransactions.value
    // Excluir "Pagamento fatura cartão": transação de saída com invoice_id e sem credit_card_id (só marca a fatura como paga, não aparece no extrato)
    const periodTxConta = periodTx.filter(
      (t) => !t.credit_card_id && !(t.invoice_id && t.type === 'expense')
    )
    const realMapped = periodTxConta.map(mapTransaction)

    // Evitar duplicata quando já existe transação gerada dessa recorrente no mês
    const recurringIdsWithRealTransaction = new Set(
      periodTx
        .filter((t) => t.recurring_transaction_id)
        .map((t) => t.recurring_transaction_id as string)
    )
    const rendasToShow = rendasAsTransactions.value.filter(
      (r) => !recurringIdsWithRealTransaction.has(r.recurringId!)
    )
    const saidasToShow = saidasAsTransactions.value.filter(
      (s) => !recurringIdsWithRealTransaction.has(s.recurringId!)
    )

    // Fatura do mês selecionado = compras do mês anterior (ex.: compras de jan → fatura de fev)
    const prevMonthCartao = previousMonthCardTransactions.value
    const faturaRows: ExtratoTransaction[] = []
    const month = selectedPeriod.value.month
    const year = selectedPeriod.value.year
    const monthKey = `${year}-${String(month + 1).padStart(2, '0')}`
    const monthNamesShort = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']
    const monthLabel = `${monthNamesShort[month]}/${year}`

    const byCard = new Map<string, { total: number; invoiceId: string | null }>()
    for (const t of prevMonthCartao) {
      const cid = t.credit_card_id!
      const key = cid
      const absAmount = Math.abs(t.amount)
      if (!byCard.has(key)) byCard.set(key, { total: 0, invoiceId: t.invoice_id ?? null })
      const entry = byCard.get(key)!
      entry.total += absAmount
      if (t.invoice_id) entry.invoiceId = t.invoice_id
    }

    for (const [creditCardId, { total }] of byCard) {
      if (total <= 0) continue
      const card = creditCards.value.find((c) => c.id === creditCardId)
      const cardName = card?.name ?? 'Cartão'
      const inv = invoices.value.find((i) => {
        if (i.credit_card_id !== creditCardId) return false
        const ref = i.reference_month ?? ''
        return ref.slice(0, 7) === monthKey
      })
      const faturaPaga = !!(
        inv &&
        (inv.status === 'paid' ||
          (inv.paid_amount != null &&
            inv.total_amount != null &&
            inv.paid_amount >= inv.total_amount))
      )
      // Data exibida = dia de vencimento (não fechamento)
      let dueDateStr: string | undefined
      if (inv?.due_date) {
        dueDateStr = typeof inv.due_date === 'string' ? inv.due_date.slice(0, 10) : undefined
      } else if (card?.due_day != null) {
        const dueMonth0 = month === 11 ? 0 : month + 1
        const dueYear = month === 11 ? year + 1 : year
        const lastDayDue = new Date(dueYear, dueMonth0 + 1, 0).getDate()
        const dueDayActual = Math.min(card.due_day, lastDayDue)
        dueDateStr = `${dueYear}-${String(dueMonth0 + 1).padStart(2, '0')}-${String(dueDayActual).padStart(2, '0')}`
      }
      const faturaDate = dueDateStr
        ? new Date(dueDateStr + 'T12:00:00')
        : new Date(year, month + 1, 1, 12, 0, 0)
      faturaRows.push({
        id: `fatura-${creditCardId}-${year}-${month + 1}`,
        description: `Fatura ${cardName} - ${monthLabel}`,
        category: null,
        type: 'expense',
        date: faturaDate,
        time: '12:00',
        amount: -total,
        status: faturaPaga ? 'pago' : 'aguardando',
        isPaid: faturaPaga,
        isRecurring: false,
        installmentInfo: null,
        account: null,
        isFaturaSummary: true,
        creditCardId,
        invoiceId: inv?.id ?? undefined,
        referenceMonth: monthKey,
        dueDate: dueDateStr || undefined,
      })
    }

    let result = [...rendasToShow, ...saidasToShow, ...realMapped, ...faturaRows]

    // Filtrar por aba
    switch (activeTab.value) {
      case 'recorrentes':
        result = result.filter((t) => t.isRecurring)
        break
      case 'hoje':
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        result = result.filter((t) => {
          const tDate = new Date(t.date)
          tDate.setHours(0, 0, 0, 0)
          return tDate.getTime() === today.getTime()
        })
        break
      case 'por_data':
        break
      case 'ver_tudo':
      default:
        break
    }

    // Filtrar por intervalo de data
    if (dateFilter.value.startDate || dateFilter.value.endDate) {
      result = result.filter((t) => {
        // Obter a data da transação no formato YYYY-MM-DD (horário local, não UTC)
        const d = t.date
        const year = d.getFullYear()
        const month = String(d.getMonth() + 1).padStart(2, '0')
        const day = String(d.getDate()).padStart(2, '0')
        const transactionDateStr = `${year}-${month}-${day}`
        
        if (dateFilter.value.startDate) {
          if (transactionDateStr < dateFilter.value.startDate) return false
        }
        
        if (dateFilter.value.endDate) {
          if (transactionDateStr > dateFilter.value.endDate) return false
        }
        
        return true
      })
    }

    // Filtrar por busca
    if (searchQuery.value.trim()) {
      const query = searchQuery.value.toLowerCase()
      result = result.filter((t) =>
        t.description.toLowerCase().includes(query) ||
        t.category?.name.toLowerCase().includes(query)
      )
    }

    // Filtrar por status
    if (activeStatusFilters.value.length > 0) {
      result = result.filter((t) => {
        const filters = activeStatusFilters.value
        
        // Entrada/Saída
        if (filters.includes('entrada') && t.type === 'income') return true
        if (filters.includes('saida') && t.type === 'expense') return true
        
        // Status
        if (filters.includes('pago') && t.status === 'pago') return true
        if (filters.includes('atrasado') && t.status === 'atrasado') return true
        if (filters.includes('aguardando') && t.status === 'aguardando') return true
        
        // Se nenhum filtro de tipo/status bater, verificar se só tem filtros de tipo
        const hasTypeFilter = filters.includes('entrada') || filters.includes('saida')
        const hasStatusFilter = filters.includes('pago') || filters.includes('atrasado') || filters.includes('aguardando')
        
        if (hasTypeFilter && !hasStatusFilter) return false
        if (!hasTypeFilter && hasStatusFilter) return false
        
        return false
      })
    }

    // Filtrar por tags (transação deve ter pelo menos uma das tags selecionadas)
    if (activeTagFilters.value.length > 0) {
      const selectedTags = activeTagFilters.value
      result = result.filter((t) =>
        t.tags && t.tags.length > 0 && t.tags.some((tag) => selectedTags.includes(tag))
      )
    }

    // Ordenar: "Ver tudo" = faturas não pagas no topo, depois tudo por data; "Por data" = só por data; demais abas = mais recente primeiro
    const byDateAsc = (a: ExtratoTransaction, b: ExtratoTransaction) => a.date.getTime() - b.date.getTime()
    const byDateDesc = (a: ExtratoTransaction, b: ExtratoTransaction) => b.date.getTime() - a.date.getTime()
    if (activeTab.value === 'ver_tudo') {
      return result.sort((a, b) => {
        const aUnpaidFatura = a.isFaturaSummary && !a.isPaid
        const bUnpaidFatura = b.isFaturaSummary && !b.isPaid
        if (aUnpaidFatura && !bUnpaidFatura) return -1
        if (!aUnpaidFatura && bUnpaidFatura) return 1
        return byDateAsc(a, b)
      })
    }
    if (activeTab.value === 'por_data') {
      return result.sort(byDateAsc)
    }
    return result.sort(byDateDesc)
  })

  // Transações agrupadas por data (para aba "Por data")
  const groupedByDateTransactions = computed<TransactionDateGroup[]>(() => {
    const transactions = filteredTransactions.value
    
    // Agrupar por data
    const groups = new Map<string, ExtratoTransaction[]>()
    
    transactions.forEach((t) => {
      const d = t.date
      const year = d.getFullYear()
      const month = String(d.getMonth() + 1).padStart(2, '0')
      const day = String(d.getDate()).padStart(2, '0')
      const dateKey = `${year}-${month}-${day}`
      
      if (!groups.has(dateKey)) {
        groups.set(dateKey, [])
      }
      groups.get(dateKey)!.push(t)
    })
    
    // Converter para array e adicionar metadados
    const result: TransactionDateGroup[] = []
    
    groups.forEach((txs, dateKey) => {
      const date = new Date(dateKey + 'T12:00:00') // Usar meio-dia para evitar problemas de timezone
      
      // Calcular saldo do dia (entradas - saídas)
      const dailyBalance = txs.reduce((sum, t) => {
        if (t.type === 'income') return sum + t.amount
        if (t.type === 'expense') return sum - Math.abs(t.amount)
        return sum
      }, 0)
      
      result.push({
        dateKey,
        dayOfWeek: date.toLocaleDateString('pt-BR', { weekday: 'long' }),
        formattedDate: date.toLocaleDateString('pt-BR', { day: 'numeric', month: 'short', year: 'numeric' }).replace('.', ''),
        monthName: date.toLocaleDateString('pt-BR', { month: 'long' }).replace(/^\w/, c => c.toUpperCase()),
        dailyBalance,
        transactions: txs.sort((a, b) => a.date.getTime() - b.date.getTime()), // Mais antigo primeiro dentro do grupo
      })
    })
    
    // Ordenar grupos por data (mais antigo primeiro)
    return result.sort((a, b) => a.dateKey.localeCompare(b.dateKey))
  })

  // Cartões de crédito: compras do mês anterior (fatura do mês selecionado)
  const creditCardsList = computed<ExtratoCreditCard[]>(() => {
    const prevMonthCartao = previousMonthCardTransactions.value
    return creditCards.value
      .filter((c) => c.is_active)
      .map((card) => {
        const cardTransactions = prevMonthCartao
          .filter((t) => t.credit_card_id === card.id)
          .map((t) => {
            const category = categories.value.find((c) => c.id === t.category_id)
            return {
              id: t.id,
              description: t.description,
              amount: Math.abs(t.amount),
              installmentInfo: t.total_installments && t.total_installments > 1 && t.installment_number
                ? `${t.installment_number}/${t.total_installments}`
                : null,
              transactionDate: t.transaction_date.split('T')[0],
              category: category ? {
                id: category.id,
                name: category.name,
                icon: category.icon,
                color: category.color,
              } : null,
            }
          })

        const totalAmount = cardTransactions.reduce((sum, t) => sum + t.amount, 0)

        return {
          id: card.id,
          name: card.name,
          brand: card.brand || 'other',
          color: card.color || '#6B7280',
          transactions: cardTransactions, // Todos os lançamentos da fatura (mês anterior)
          totalAmount,
        }
      })
      .filter((card) => card.transactions.length > 0 || card.totalAmount > 0)
  })

  // Total dos cartões
  const totalCreditCards = computed(() => {
    return creditCardsList.value.reduce((sum, card) => sum + card.totalAmount, 0)
  })

  // Toggle filtro de status (reatribuição para garantir reatividade)
  function toggleStatusFilter(status: ExtratoStatus) {
    const currentFilters = [...activeStatusFilters.value]
    const index = currentFilters.indexOf(status)
    if (index > -1) {
      currentFilters.splice(index, 1)
    } else {
      currentFilters.push(status)
    }
    activeStatusFilters.value = currentFilters
  }

  // Toggle filtro de tag
  function toggleTagFilter(tag: string) {
    const current = [...activeTagFilters.value]
    const index = current.indexOf(tag)
    if (index > -1) {
      current.splice(index, 1)
    } else {
      current.push(tag)
    }
    activeTagFilters.value = current
  }

  // Limpar filtros
  function clearFilters() {
    searchQuery.value = ''
    activeStatusFilters.value = []
    activeTagFilters.value = []
    activeTab.value = 'ver_tudo'
    dateFilter.value = { startDate: null, endDate: null }
  }

  // Setar filtro de data
  function setDateFilter(filter: DateFilter) {
    dateFilter.value = { ...filter }
  }

  // Limpar filtro de data
  function clearDateFilter() {
    dateFilter.value = { startDate: null, endDate: null }
  }

  // Função auxiliar para obter o userId da sessão
  async function getUserId(): Promise<string | null> {
    // Primeiro tenta usar o composable
    if (user.value?.id) {
      return user.value.id
    }
    
    // Fallback: obtém diretamente da sessão do Supabase
    const { data: { session } } = await supabase.auth.getSession()
    return session?.user?.id || null
  }

  // Fetch de dados
  async function fetchExtratoData() {
    // Obtém o userId da sessão
    const userId = await getUserId()
    
    if (!userId) {
      return
    }

    isLoading.value = true
    error.value = null

    try {

      // Buscar dados em paralelo
      const [
        transactionsResult,
        categoriesResult,
        creditCardsResult,
        accountsResult,
        recurringResult,
        invoicesResult,
      ] = await Promise.all([
        // Transações do período selecionado (com margem de 1 mês)
        supabase
          .from('transactions')
          .select('*')
          .eq('user_id', userId)
          .order('transaction_date', { ascending: false }),

        // Categorias
        supabase.from('categories').select('*').eq('user_id', userId).eq('is_active', true),

        // Cartões de crédito
        supabase.from('credit_cards').select('*').eq('user_id', userId).eq('is_active', true),

        // Contas
        supabase.from('accounts').select('*').eq('user_id', userId).eq('is_active', true),

        // Transações recorrentes
        supabase.from('recurring_transactions').select('*').eq('user_id', userId).eq('is_active', true),

        // Faturas de cartão (para saber status pago e não duplicar "A pagar")
        supabase.from('credit_card_invoices').select('*').eq('user_id', userId),
      ])

      // Verificar erros
      if (transactionsResult.error) throw transactionsResult.error
      if (categoriesResult.error) throw categoriesResult.error
      if (creditCardsResult.error) throw creditCardsResult.error
      if (accountsResult.error) throw accountsResult.error
      if (recurringResult.error) throw recurringResult.error
      if (invoicesResult.error) throw invoicesResult.error

      // Atualizar estado (cópia do array para garantir nova referência reativa)
      transactions.value = [...(transactionsResult.data || [])]
      categories.value = categoriesResult.data || []
      creditCards.value = creditCardsResult.data || []
      accounts.value = accountsResult.data || []
      recurringTransactions.value = recurringResult.data || []
      invoices.value = invoicesResult.data || []

    } catch (err) {
      console.error('Erro ao carregar dados do extrato:', err)
      error.value = 'Erro ao carregar dados do extrato'
    } finally {
      isLoading.value = false
    }
  }

  // Marcar transação como paga
  async function markAsPaid(transactionId: string) {
    const userId = await getUserId()
    if (!userId) return

    try {
      const { error: updateError } = await supabase
        .from('transactions')
        .update({ is_paid: true, status: 'confirmed' })
        .eq('id', transactionId)
        .eq('user_id', userId)

      if (updateError) throw updateError

      // Atualizar estado local (nova referência do array para garantir reatividade)
      const index = transactions.value.findIndex((t) => t.id === transactionId)
      if (index !== -1) {
        transactions.value = [
          ...transactions.value.slice(0, index),
          { ...transactions.value[index], is_paid: true, status: 'confirmed' },
          ...transactions.value.slice(index + 1),
        ]
      }
    } catch (err) {
      console.error('Erro ao marcar transação como paga:', err)
      throw err
    }
  }

  // Marcar transação como não paga / não recebida
  async function markAsUnpaid(transactionId: string) {
    const userId = await getUserId()
    if (!userId) {
      console.warn('[useExtrato] markAsUnpaid: sem user, abortando')
      return
    }
    if (transactionId.startsWith('renda-') || transactionId.startsWith('saida-')) {
      console.warn('[useExtrato] markAsUnpaid: id é de item virtual (renda/saída), abortando')
      return
    }

    try {
      const { data, error: updateError } = await supabase
        .from('transactions')
        .update({ is_paid: false, status: 'pending' })
        .eq('id', transactionId)
        .eq('user_id', userId)
        .select('id')
        .maybeSingle()

      if (updateError) throw updateError
      if (!data) {
        console.warn('markAsUnpaid: nenhuma linha atualizada para id', transactionId)
      }

      // Recarregar dados e forçar re-render da lista
      await fetchExtratoData()
      listRefreshKey.value += 1
    } catch (err) {
      console.error('Erro ao marcar transação como não paga:', err)
      throw err
    }
  }

  // Excluir transação (ignora itens virtuais renda-/saida-)
  async function deleteTransaction(transactionId: string) {
    if (transactionId.startsWith('renda-') || transactionId.startsWith('saida-')) {
      return
    }
    const userId = await getUserId()
    if (!userId) return

    try {
      const { error: deleteError } = await supabase
        .from('transactions')
        .delete()
        .eq('id', transactionId)
        .eq('user_id', userId)

      if (deleteError) throw deleteError

      // Remover do estado local
      transactions.value = transactions.value.filter((t) => t.id !== transactionId)
    } catch (err) {
      console.error('Erro ao excluir transação:', err)
      throw err
    }
  }

  /**
   * Marcar renda como recebida: cria o lançamento (transação) no banco a partir da renda recorrente.
   * A data da transação é a data da ocorrência exibida no extrato.
   */
  async function markRendaAsReceived(recurringId: string, transactionDate: string): Promise<void> {
    const userId = await getUserId()
    if (!userId) throw new Error('Usuário não autenticado')

    const renda = recurringTransactions.value.find((r) => r.id === recurringId)
    if (!renda || renda.type !== 'income') {
      throw new Error('Renda não encontrada')
    }

    const transactionDateIso = `${transactionDate}T12:00:00.000Z`

    const { error: insertError } = await supabase.from('transactions').insert({
      user_id: userId,
      account_id: renda.account_id,
      category_id: renda.category_id || null,
      description: renda.description,
      amount: renda.amount,
      transaction_date: transactionDateIso,
      type: 'income',
      is_paid: true,
      status: 'confirmed',
      is_recurring: true,
      recurring_transaction_id: renda.id,
    })

    if (insertError) {
      console.error('Erro ao criar lançamento da renda:', insertError)
      throw insertError
    }

    await fetchExtratoData()
  }

  // Atualizar transação no estado local (otimista após edição, evita item sumir da lista)
  function updateTransactionLocal(transactionId: string, updates: Partial<Transaction>) {
    const index = transactions.value.findIndex((t) => t.id === transactionId)
    if (index === -1) return
    const current = transactions.value[index]
    transactions.value = [
      ...transactions.value.slice(0, index),
      { ...current, ...updates },
      ...transactions.value.slice(index + 1),
    ]
  }

  // Obter transação por ID (mapeada)
  function getTransactionById(transactionId: string): ExtratoTransaction | null {
    const transaction = transactions.value.find((t) => t.id === transactionId)
    if (!transaction) return null
    return mapTransaction(transaction)
  }

  // Obter dados brutos da transação por ID (para edição)
  function getRawTransactionById(transactionId: string) {
    const transaction = transactions.value.find((t) => t.id === transactionId)
    if (!transaction) return null
    
    // Formatar a data para YYYY-MM-DD
    const date = new Date(transaction.transaction_date)
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    const formattedDate = `${year}-${month}-${day}`
    
    return {
      id: transaction.id,
      accountId: transaction.account_id || '',
      categoryId: transaction.category_id || '',
      creditCardId: transaction.credit_card_id || '',
      description: transaction.description,
      amount: Math.abs(transaction.amount),
      transactionDate: formattedDate,
      isRecurring: transaction.is_recurring || false,
      isPaid: transaction.is_paid || false,
      totalInstallments: transaction.total_installments || 1,
      type: transaction.type,
      tags: transaction.tags ? [...transaction.tags] : [],
    }
  }

  // Inicialização: carrega dados quando estiver no cliente
  onMounted(async () => {
    // Aguarda um pequeno delay para garantir que a sessão esteja disponível
    await new Promise(resolve => setTimeout(resolve, 100))
    
    const userId = await getUserId()
    
    if (userId) {
      // Sempre carrega os dados ao montar
      await fetchExtratoData()
    }
  })

  return {
    // Estado
    isLoading,
    error,
    selectedPeriod,
    listRefreshKey,

    // Filtros
    activeTab,
    searchQuery,
    activeStatusFilters,
    activeTagFilters,
    dateFilter,

    // Dados
    userName,
    monthName,
    dailyQuote,
    summaryData,
    contasPagas,
    existingTags,
    filteredTransactions,
    groupedByDateTransactions,
    creditCardsList,
    totalCreditCards,
    extratoAccounts: accounts,

    // Ações
    toggleStatusFilter,
    toggleTagFilter,
    clearFilters,
    setDateFilter,
    clearDateFilter,
    fetchExtratoData,
    markAsPaid,
    markAsUnpaid,
    deleteTransaction,
    markRendaAsReceived,
    updateTransactionLocal,
    getTransactionById,
    getRawTransactionById,
  }
}
