import { ref, computed, watch, onMounted } from 'vue'
import { useSupabaseClient, useSupabaseUser } from '#imports'
import type { Database, Transaction } from 'shared/types/database.types'

/**
 * useCalendario - Composable para gerenciar o calendário financeiro
 * Carrega transações do mês e organiza por dia
 */

export interface CalendarioTransaction {
  id: string
  description: string
  amount: number
  type: 'income' | 'expense' | 'transfer'
  status: string | null
  category?: {
    name: string
    icon: string | null
    color: string | null
  } | null
}

export interface DayData {
  date: Date
  day: number
  isCurrentMonth: boolean
  isToday: boolean
  isSelected: boolean
  transactions: CalendarioTransaction[]
  totalEntradas: number
  totalSaidas: number
}

export interface DaySummary {
  totalEntradas: number
  totalSaidas: number
  transactions: CalendarioTransaction[]
}

// Frases motivacionais
const motivationalQuotes = [
  { text: 'Uma jornada de mil milhas começa com o primeiro passo.', author: 'Lao Tsé' },
  { text: 'O sucesso é a soma de pequenos esforços repetidos dia após dia.', author: 'Robert Collier' },
  { text: 'Não é sobre ter tempo, é sobre fazer tempo.', author: 'Desconhecido' },
  { text: 'Cuide dos centavos e os reais cuidarão de si mesmos.', author: 'Benjamin Franklin' },
  { text: 'A liberdade financeira é uma jornada, não um destino.', author: 'Desconhecido' },
  { text: 'Invista em você mesmo. Seu futuro eu agradecerá.', author: 'Desconhecido' },
  { text: 'Pequenos passos todos os dias levam a grandes conquistas.', author: 'Desconhecido' },
  { text: 'Discipline é a ponte entre metas e realizações.', author: 'Jim Rohn' },
]

export function useCalendario() {
  const supabase = useSupabaseClient<Database>()
  const user = useSupabaseUser()

  // Estado
  const isLoading = ref(false)
  const currentMonth = ref(new Date().getMonth())
  const currentYear = ref(new Date().getFullYear())
  const selectedDate = ref<Date>(new Date())
  const transactions = ref<Transaction[]>([])
  const transactionsWithCategory = ref<TransactionRow[]>([])

  // Frase motivacional do dia
  const dailyQuote = computed(() => {
    const dayOfYear = Math.floor((Date.now() - new Date(currentYear.value, 0, 0).getTime()) / (1000 * 60 * 60 * 24))
    return motivationalQuotes[dayOfYear % motivationalQuotes.length]
  })

  // Nome do usuário
  const userName = computed(() => {
    const u = user.value
    if (!u) return 'Usuário'
    return u.user_metadata?.full_name || u.email?.split('@')[0] || 'Usuário'
  })

  // Saudação baseada na hora
  const greeting = computed(() => {
    const hour = new Date().getHours()
    if (hour < 12) return 'Bom dia'
    if (hour < 18) return 'Boa tarde'
    return 'Boa noite'
  })

  // Nome do mês atual
  const monthName = computed(() => {
    const date = new Date(currentYear.value, currentMonth.value, 1)
    return date.toLocaleDateString('pt-BR', { month: 'long' })
  })

  // Dias do calendário (incluindo dias do mês anterior e próximo)
  const calendarDays = computed((): DayData[] => {
    const days: DayData[] = []
    const firstDay = new Date(currentYear.value, currentMonth.value, 1)
    const lastDay = new Date(currentYear.value, currentMonth.value + 1, 0)
    
    // Ajuste para começar na segunda-feira (0 = segunda, 6 = domingo)
    let startOffset = firstDay.getDay() - 1
    if (startOffset < 0) startOffset = 6

    // Dias do mês anterior
    const prevMonthLastDay = new Date(currentYear.value, currentMonth.value, 0)
    for (let i = startOffset - 1; i >= 0; i--) {
      const day = prevMonthLastDay.getDate() - i
      const date = new Date(currentYear.value, currentMonth.value - 1, day)
      days.push(createDayData(date, false))
    }

    // Dias do mês atual
    for (let day = 1; day <= lastDay.getDate(); day++) {
      const date = new Date(currentYear.value, currentMonth.value, day)
      days.push(createDayData(date, true))
    }

    // Dias do próximo mês para completar a grade (6 semanas = 42 dias)
    const remainingDays = 42 - days.length
    for (let day = 1; day <= remainingDays; day++) {
      const date = new Date(currentYear.value, currentMonth.value + 1, day)
      days.push(createDayData(date, false))
    }

    return days
  })

  // Dados do dia selecionado
  const selectedDayData = computed((): DaySummary => {
    const dayStr = formatDateToISO(selectedDate.value)
    const dayTransactions = transactionsWithCategory.value.filter(t => getTransactionDateStr(t) === dayStr)

    const mapped = dayTransactions.map(t => {
      const cat = getCategoryFromRow(t)
      return {
        id: t.id,
        description: t.description,
        amount: t.amount,
        type: t.type as 'income' | 'expense' | 'transfer',
        status: t.status,
        category: cat ? { name: cat.name, icon: cat.icon, color: cat.color } : null,
      }
    })

    const totalEntradas = mapped
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + Math.abs(Number(t.amount)), 0)
    const totalSaidas = mapped
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + Math.abs(Number(t.amount)), 0)

    return {
      totalEntradas,
      totalSaidas,
      transactions: mapped,
    }
  })

  // Helpers
  function formatDateToISO(date: Date): string {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }

  /** Retorna a data da transação no formato YYYY-MM-DD (normaliza ISO com time) */
  function getTransactionDateStr(t: { transaction_date?: string | null }): string {
    const raw = t.transaction_date
    if (raw == null || typeof raw !== 'string') return ''
    return raw.includes('T') ? raw.split('T')[0]! : raw
  }

  type TransactionRow = Transaction & {
    categories?: { name: string; icon: string | null; color: string | null } | null
    category?: { name: string; icon: string | null; color: string | null } | null
  }

  function getCategoryFromRow(t: TransactionRow): { name: string; icon: string | null; color: string | null } | null {
    return t.categories ?? t.category ?? null
  }

  function createDayData(date: Date, isCurrentMonth: boolean): DayData {
    const today = new Date()
    const isToday = date.getDate() === today.getDate() &&
                    date.getMonth() === today.getMonth() &&
                    date.getFullYear() === today.getFullYear()
    
    const isSelected = date.getDate() === selectedDate.value.getDate() &&
                       date.getMonth() === selectedDate.value.getMonth() &&
                       date.getFullYear() === selectedDate.value.getFullYear()

    const dayStr = formatDateToISO(date)
    const dayTransactions = transactionsWithCategory.value.filter(t => getTransactionDateStr(t) === dayStr)

    const mapped = dayTransactions.map(t => {
      const cat = getCategoryFromRow(t)
      return {
        id: t.id,
        description: t.description,
        amount: t.amount,
        type: t.type as 'income' | 'expense' | 'transfer',
        status: t.status,
        category: cat ? { name: cat.name, icon: cat.icon, color: cat.color } : null,
      }
    })

    const totalEntradas = mapped
      .filter(m => m.type === 'income')
      .reduce((sum, m) => sum + Math.abs(Number(m.amount)), 0)
    const totalSaidas = mapped
      .filter(m => m.type === 'expense')
      .reduce((sum, m) => sum + Math.abs(Number(m.amount)), 0)

    return {
      date,
      day: date.getDate(),
      isCurrentMonth,
      isToday,
      isSelected,
      transactions: mapped,
      totalEntradas,
      totalSaidas,
    }
  }

  // Ações
  function selectDate(date: Date) {
    selectedDate.value = date
  }

  function previousMonth() {
    if (currentMonth.value === 0) {
      currentMonth.value = 11
      currentYear.value--
    } else {
      currentMonth.value--
    }
  }

  function nextMonth() {
    if (currentMonth.value === 11) {
      currentMonth.value = 0
      currentYear.value++
    } else {
      currentMonth.value++
    }
  }

  /** Obtém o userId da sessão (usa getSession quando useSupabaseUser ainda não resolveu). */
  async function getUserId(): Promise<string | null> {
    if (user.value?.id) return user.value.id
    const { data: { session } } = await supabase.auth.getSession()
    return session?.user?.id ?? null
  }

  // Fetch transações do período visível no calendário (6 semanas: mês anterior + atual + próximo)
  async function fetchTransactions() {
    const userId = await getUserId()
    if (!userId) return

    isLoading.value = true
    try {
      const firstDay = new Date(currentYear.value, currentMonth.value, 1)
      let startOffset = firstDay.getDay() - 1
      if (startOffset < 0) startOffset = 6
      const lastDay = new Date(currentYear.value, currentMonth.value + 1, 0)
      const daysInMonth = lastDay.getDate()
      const prevMonthDays = startOffset
      const nextMonthDays = 42 - prevMonthDays - daysInMonth

      const gridStart = new Date(currentYear.value, currentMonth.value, 1 - prevMonthDays)
      const gridEndExclusive = new Date(currentYear.value, currentMonth.value + 1, nextMonthDays + 1)

      const startStr = formatDateToISO(gridStart)
      const endStrExclusive = formatDateToISO(gridEndExclusive)

      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', userId)
        .gte('transaction_date', startStr)
        .lt('transaction_date', endStrExclusive)
        .order('transaction_date', { ascending: true })

      if (error) {
        console.error('Erro Supabase calendário:', error)
        throw error
      }

      transactionsWithCategory.value = (data ?? []) as TransactionRow[]
    } catch (err) {
      console.error('Erro ao carregar transações:', err)
    } finally {
      isLoading.value = false
    }
  }

  // Watch para recarregar transações quando mudar o mês
  watch([currentMonth, currentYear], () => {
    fetchTransactions()
  }, { immediate: true })

  // Watch para recarregar quando o usuário estiver disponível (inclui primeira carga)
  watch(user, (newUser) => {
    if (newUser?.id) {
      fetchTransactions()
    }
  }, { immediate: true })

  // No cliente, garantir fetch após montagem (sessão pode ter sido restaurada)
  onMounted(() => {
    fetchTransactions()
  })

  return {
    // Estado
    isLoading,
    currentMonth,
    currentYear,
    selectedDate,
    
    // Computed
    userName,
    greeting,
    dailyQuote,
    monthName,
    calendarDays,
    selectedDayData,
    
    // Ações
    selectDate,
    previousMonth,
    nextMonth,
    fetchTransactions,
  }
}
