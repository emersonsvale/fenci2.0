import { computed, watch } from 'vue'
import type { ComputedRef } from 'vue'
import { useSupabaseClient, useSupabaseUser, useState } from '#imports'
import type {
  Database,
  Category,
  CreditCard,
  Account,
  RecurringTransaction,
} from 'shared/types/database.types'

/**
 * Tipos para a página de Contas
 */

export interface RendaDisplay {
  id: string
  provedor: string
  valor: number
  diaRecebimento: number
  tipo: 'fixo' | 'variavel'
  isActive: boolean
  hasLimit: boolean
  endDate: string | null
  accountId?: string
  categoryId?: string
}

export interface CategoryDisplay {
  id: string
  name: string
  icon: string | null
  color: string
  type: 'income' | 'expense'
  isSystem: boolean
  totalAmount?: number
}

export interface CreditCardDisplay {
  id: string
  name: string
  lastDigits: string
  brand: string | null
  color: string
}

export interface AccountDisplay {
  id: string
  name: string
  bankName: string | null
  accountNumber: string | null
  type: string
  color: string
  icon: string | null
  balance: number
}

export interface RendaFormData {
  provedor: string
  valor: number
  diaRecebimento: number
  accountId: string
  categoryId?: string
  hasLimit?: boolean
  endDate?: string
}

export interface CategoryFormData {
  name: string
  icon?: string
  color?: string
  type: 'income' | 'expense'
}

export interface CreditCardFormData {
  name: string
  lastDigits: string
  brand?: string
  color?: string
  closingDay: number
  dueDay: number
  creditLimit?: number
  accountId?: string
}

export interface AccountFormData {
  name: string
  bankName?: string
  type: string
  initialBalance?: number
  color?: string
  icon?: string
}

/** Lançamento da fatura do cartão para exibição no drawer */
export interface CardInvoiceTransaction {
  id: string
  description: string
  amount: number
  transactionDate: string
  categoryName: string | null
}

/** Lançamento de conta para exibição no drawer (extrato da conta) */
export interface AccountTransaction {
  id: string
  description: string
  amount: number
  transactionDate: string
  categoryName: string | null
  type: 'income' | 'expense' | 'transfer'
}

/**
 * useContas - Composable para gerenciar dados da página de Contas
 */
export function useContas() {
  const supabase = useSupabaseClient<Database>()
  const user = useSupabaseUser()

  // Estado global compartilhado usando useState (persiste entre HMR)
  const isLoading = useState<boolean>('contas-isLoading', () => false)
  const error = useState<string | null>('contas-error', () => null)
  const rendas = useState<RecurringTransaction[]>('contas-rendas', () => [])
  const categories = useState<Category[]>('contas-categories', () => [])
  const creditCards = useState<CreditCard[]>('contas-creditCards', () => [])
  const accounts = useState<Account[]>('contas-accounts', () => [])
  const categoryTotals = useState<Record<string, number>>('contas-categoryTotals', () => ({}))
  /** Total da fatura do mês por credit_card_id (preenchido por fetchCreditCardInvoicesForMonth) */
  const invoiceTotalsByCard = useState<Record<string, number>>('contas-invoiceTotalsByCard', () => ({}))
  /** Soma dos amount por account_id (entradas e saídas) para cálculo correto do saldo da conta */
  const accountTransactionSums = useState<Record<string, number>>('contas-accountTransactionSums', () => ({}))

  // Nome do usuário
  const userName = computed(() => {
    const u = user.value
    if (!u) return 'Usuário'
    return u.user_metadata?.full_name?.split(' ')[0] || u.email?.split('@')[0] || 'Usuário'
  })

  // Computed: Total de rendas
  const totalRendas = computed(() => {
    return rendas.value
      .filter((r) => r.is_active)
      .reduce((sum, r) => sum + r.amount, 0)
  })

  // Computed: Rendas formatadas para display
  const rendasList = computed<RendaDisplay[]>(() => {
    return rendas.value
      .filter((r) => r.is_active)
      .map((r) => ({
        id: r.id,
        provedor: r.description,
        valor: r.amount,
        diaRecebimento: r.day_of_month || 1,
        tipo: r.frequency === 'monthly' ? 'fixo' : 'variavel',
        isActive: r.is_active ?? true,
        hasLimit: !!r.end_date,
        endDate: r.end_date,
        accountId: r.account_id ?? undefined,
        categoryId: r.category_id ?? undefined,
      }))
  })

  // Computed: Categorias de entrada
  const incomeCategories = computed<CategoryDisplay[]>(() => {
    return categories.value
      .filter((c) => c.type === 'income' && c.is_active)
      .map((c) => ({
        id: c.id,
        name: c.name,
        icon: c.icon,
        color: c.color || '#22C55E',
        type: 'income' as const,
        isSystem: c.is_system ?? false,
        totalAmount: categoryTotals.value[c.id] || 0,
      }))
  })

  // Computed: Categorias de saída
  const expenseCategories = computed<CategoryDisplay[]>(() => {
    return categories.value
      .filter((c) => c.type === 'expense' && c.is_active)
      .map((c) => ({
        id: c.id,
        name: c.name,
        icon: c.icon,
        color: c.color || '#EF4444',
        type: 'expense' as const,
        isSystem: c.is_system ?? false,
        totalAmount: categoryTotals.value[c.id] || 0,
      }))
  })

  // Computed: Cartões de crédito formatados
  const creditCardsList = computed<CreditCardDisplay[]>(() => {
    return creditCards.value
      .filter((c) => c.is_active)
      .map((c) => ({
        id: c.id,
        name: c.name,
        lastDigits: c.last_digits || '0000',
        brand: c.brand,
        color: c.color || '#6B7280',
      }))
  })

  // Computed: Contas bancárias formatadas (saldo = initial_balance + soma de todas as transações da conta)
  const accountsList = computed<AccountDisplay[]>(() => {
    return accounts.value
      .filter((a) => a.is_active)
      .map((a) => {
        const initial = Number(a.initial_balance ?? 0)
        const sumMovements = accountTransactionSums.value[a.id] ?? 0
        const balance = initial + sumMovements
        return {
          id: a.id,
          name: a.name,
          bankName: a.bank_name,
          accountNumber: a.bank_name, // Usar o nome do banco como identificador
          type: a.type,
          color: a.color || '#6B7280',
          icon: a.icon,
          balance,
        }
      })
  })

  /**
   * Buscar todos os dados da página
   */
  async function fetchContasData() {
    const { data: authData } = await supabase.auth.getUser()
    const userId = authData?.user?.id
    if (!userId) return

    isLoading.value = true
    error.value = null

    try {

      // Buscar dados em paralelo (inclui transações para cálculo de saldo das contas)
      const [
        rendasResult,
        categoriesResult,
        creditCardsResult,
        accountsResult,
        transactionsForBalanceResult,
      ] = await Promise.all([
        // Rendas recorrentes (tipo income)
        supabase
          .from('recurring_transactions')
          .select('*')
          .eq('user_id', userId)
          .eq('type', 'income')
          .eq('is_active', true)
          .order('description', { ascending: true }),

        // Categorias
        supabase
          .from('categories')
          .select('*')
          .eq('user_id', userId)
          .eq('is_active', true)
          .order('name', { ascending: true }),

        // Cartões de crédito
        supabase
          .from('credit_cards')
          .select('*')
          .eq('user_id', userId)
          .eq('is_active', true)
          .order('name', { ascending: true }),

        // Contas
        supabase
          .from('accounts')
          .select('*')
          .eq('user_id', userId)
          .eq('is_active', true)
          .order('name', { ascending: true }),

        // Transações por conta (amount já vem positivo para entrada e negativo para saída)
        supabase
          .from('transactions')
          .select('account_id, amount')
          .eq('user_id', userId)
          .not('account_id', 'is', null),
      ])

      // Verificar erros
      if (rendasResult.error) throw rendasResult.error
      if (categoriesResult.error) throw categoriesResult.error
      if (creditCardsResult.error) throw creditCardsResult.error
      if (accountsResult.error) throw accountsResult.error
      if (transactionsForBalanceResult.error) throw transactionsForBalanceResult.error

      // Soma dos valores por conta (entradas aumentam, saídas diminuem o saldo)
      const sums: Record<string, number> = {}
      for (const row of transactionsForBalanceResult.data || []) {
        const id = row.account_id
        if (!id) continue
        sums[id] = (sums[id] ?? 0) + Number(row.amount)
      }
      accountTransactionSums.value = sums

      // Atualizar estado
      rendas.value = rendasResult.data || []
      categories.value = categoriesResult.data || []
      creditCards.value = creditCardsResult.data || []
      accounts.value = accountsResult.data || []
    } catch (err) {
      console.error('Erro ao carregar dados de contas:', err)
      error.value = 'Erro ao carregar dados de contas'
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Buscar totais por categoria para um mês específico
   */
  async function fetchCategoryTotals(month: number, year: number) {
    const { data: authData } = await supabase.auth.getUser()
    const userId = authData?.user?.id
    if (!userId) return

    try {
      // Calcular primeiro e último dia do mês
      const startDate = new Date(year, month, 1).toISOString().split('T')[0]
      const endDate = new Date(year, month + 1, 0).toISOString().split('T')[0]

      // Buscar transações do mês
      const { data: transactions, error: transactionError } = await supabase
        .from('transactions')
        .select('category_id, amount')
        .eq('user_id', userId)
        .gte('transaction_date', startDate)
        .lte('transaction_date', endDate)
        .not('category_id', 'is', null)

      if (transactionError) throw transactionError

      // Calcular totais por categoria
      const totals: Record<string, number> = {}
      if (transactions) {
        for (const t of transactions) {
          if (t.category_id) {
            totals[t.category_id] = (totals[t.category_id] || 0) + t.amount
          }
        }
      }

      categoryTotals.value = totals
    } catch (err) {
      console.error('Erro ao buscar totais por categoria:', err)
    }
  }

  /**
   * Buscar totais de fatura por cartão para um mês (reference_month = primeiro dia do mês).
   * Preenche invoiceTotalsByCard.
   */
  async function fetchCreditCardInvoicesForMonth(month: number, year: number) {
    const { data: authData } = await supabase.auth.getUser()
    const userId = authData?.user?.id
    if (!userId) return

    const referenceMonthDate = `${year}-${String(month + 1).padStart(2, '0')}-01`
    try {
      const { data: invoices, error: invError } = await supabase
        .from('credit_card_invoices')
        .select('credit_card_id, total_amount')
        .eq('user_id', userId)
        .eq('reference_month', referenceMonthDate)

      if (invError) throw invError

      const byCard: Record<string, number> = {}
      if (invoices) {
        for (const inv of invoices) {
          byCard[inv.credit_card_id] = Number(inv.total_amount ?? 0)
        }
      }
      invoiceTotalsByCard.value = byCard
    } catch (err) {
      console.error('Erro ao buscar faturas por cartão:', err)
      invoiceTotalsByCard.value = {}
    }
  }

  /**
   * Buscar lançamentos (compras) do cartão que entram na fatura do mês selecionado.
   * Regra: fatura do mês M contém compras do mês M-1.
   */
  async function getCardInvoiceTransactions(
    cardId: string,
    month: number,
    year: number
  ): Promise<{ transactions: CardInvoiceTransaction[]; total: number }> {
    const { data: authData } = await supabase.auth.getUser()
    const userId = authData?.user?.id
    if (!userId) return { transactions: [], total: 0 }

    const prevDate = new Date(year, month - 1, 1)
    const prevMonth = prevDate.getMonth()
    const prevYear = prevDate.getFullYear()
    const startDate = new Date(prevYear, prevMonth, 1).toISOString().split('T')[0]
    const endDate = new Date(prevYear, prevMonth + 1, 0).toISOString().split('T')[0]

    try {
      const { data: rows, error } = await supabase
        .from('transactions')
        .select('id, description, amount, transaction_date, category_id, categories(name)')
        .eq('user_id', userId)
        .eq('credit_card_id', cardId)
        .gte('transaction_date', startDate)
        .lte('transaction_date', endDate)
        .order('transaction_date', { ascending: true })

      if (error) throw error

      const transactions: CardInvoiceTransaction[] = (rows || []).map((t) => ({
        id: t.id,
        description: t.description || '',
        amount: Math.abs(Number(t.amount)),
        transactionDate: (t.transaction_date || '').toString().split('T')[0],
        categoryName: (t.categories as { name: string } | null)?.name ?? null,
      }))
      const total = transactions.reduce((sum, t) => sum + t.amount, 0)
      return { transactions, total }
    } catch (err) {
      console.error('Erro ao buscar lançamentos da fatura do cartão:', err)
      return { transactions: [], total: 0 }
    }
  }

  /**
   * Buscar lançamentos da conta no mês/ano selecionado (transações onde account_id = accountId).
   */
  async function getAccountTransactions(
    accountId: string,
    month: number,
    year: number
  ): Promise<{ transactions: AccountTransaction[] }> {
    const { data: authData } = await supabase.auth.getUser()
    const userId = authData?.user?.id
    if (!userId) return { transactions: [] }

    const startDate = new Date(year, month, 1).toISOString().split('T')[0]
    const endDate = new Date(year, month + 1, 0).toISOString().split('T')[0]

    try {
      const { data: rows, error } = await supabase
        .from('transactions')
        .select('id, description, amount, transaction_date, type, category_id, categories(name)')
        .eq('user_id', userId)
        .eq('account_id', accountId)
        .gte('transaction_date', startDate)
        .lte('transaction_date', endDate)
        .order('transaction_date', { ascending: false })

      if (error) throw error

      const transactions: AccountTransaction[] = (rows || []).map((t) => ({
        id: t.id,
        description: t.description || '',
        amount: Number(t.amount),
        transactionDate: (t.transaction_date || '').toString().split('T')[0],
        categoryName: (t.categories as { name: string } | null)?.name ?? null,
        type: (t.type as 'income' | 'expense' | 'transfer') || 'expense',
      }))
      return { transactions }
    } catch (err) {
      console.error('Erro ao buscar lançamentos da conta:', err)
      return { transactions: [] }
    }
  }

  /**
   * Criar nova renda recorrente
   */
  async function createRenda(data: RendaFormData): Promise<boolean> {
    const { data: authData } = await supabase.auth.getUser()
    const userId = authData?.user?.id
    if (!userId) return false

    try {
      const { error: insertError } = await supabase
        .from('recurring_transactions')
        .insert({
          user_id: userId,
          description: data.provedor,
          amount: data.valor,
          day_of_month: data.diaRecebimento,
          account_id: data.accountId,
          category_id: data.categoryId,
          type: 'income',
          frequency: 'monthly',
          start_date: new Date().toISOString().split('T')[0],
          end_date: data.hasLimit && data.endDate ? data.endDate : null,
          is_active: true,
        })

      if (insertError) throw insertError

      await fetchContasData()
      return true
    } catch (err) {
      console.error('Erro ao criar renda:', err)
      error.value = 'Erro ao criar renda'
      return false
    }
  }

  /**
   * Atualizar renda existente
   */
  async function updateRenda(id: string, data: Partial<RendaFormData>): Promise<boolean> {
    const { data: authData } = await supabase.auth.getUser()
    const userId = authData?.user?.id
    if (!userId) return false

    try {
      const updateData: Record<string, unknown> = {}
      if (data.provedor !== undefined) updateData.description = data.provedor
      if (data.valor !== undefined) updateData.amount = data.valor
      if (data.diaRecebimento !== undefined) updateData.day_of_month = data.diaRecebimento
      if (data.accountId !== undefined) updateData.account_id = data.accountId
      if (data.categoryId !== undefined) updateData.category_id = data.categoryId
      // Tratar end_date: se hasLimit é true e tem endDate, usa endDate; senão, limpa (null)
      if (data.hasLimit !== undefined) {
        updateData.end_date = data.hasLimit && data.endDate ? data.endDate : null
      }

      const { error: updateError } = await supabase
        .from('recurring_transactions')
        .update(updateData)
        .eq('id', id)
        .eq('user_id', userId)

      if (updateError) throw updateError

      await fetchContasData()
      return true
    } catch (err) {
      console.error('Erro ao atualizar renda:', err)
      error.value = 'Erro ao atualizar renda'
      return false
    }
  }

  /**
   * Deletar renda (soft delete)
   */
  async function deleteRenda(id: string): Promise<boolean> {
    const { data: authData } = await supabase.auth.getUser()
    const userId = authData?.user?.id
    if (!userId) return false

    try {
      const { error: deleteError } = await supabase
        .from('recurring_transactions')
        .update({ is_active: false })
        .eq('id', id)
        .eq('user_id', userId)

      if (deleteError) throw deleteError

      await fetchContasData()
      return true
    } catch (err) {
      console.error('Erro ao deletar renda:', err)
      error.value = 'Erro ao deletar renda'
      return false
    }
  }

  /**
   * Criar nova categoria
   */
  async function createCategory(data: CategoryFormData): Promise<boolean> {
    const { data: authData } = await supabase.auth.getUser()
    const userId = authData?.user?.id
    if (!userId) {
      error.value = 'Usuário não autenticado'
      return false
    }

    try {
      const { error: insertError } = await supabase
        .from('categories')
        .insert({
          user_id: userId,
          name: data.name,
          icon: data.icon,
          color: data.color || (data.type === 'income' ? '#22C55E' : '#EF4444'),
          type: data.type,
          is_active: true,
          is_system: false,
        })

      if (insertError) throw insertError

      await fetchContasData()
      return true
    } catch (err) {
      console.error('Erro ao criar categoria:', err)
      error.value = 'Erro ao criar categoria'
      return false
    }
  }

  /**
   * Atualizar categoria existente
   */
  async function updateCategory(id: string, data: Partial<CategoryFormData>): Promise<boolean> {
    const { data: authData } = await supabase.auth.getUser()
    const userId = authData?.user?.id
    if (!userId) return false

    try {
      const { error: updateError } = await supabase
        .from('categories')
        .update({
          name: data.name,
          icon: data.icon,
          color: data.color,
        })
        .eq('id', id)
        .eq('user_id', userId)

      if (updateError) throw updateError

      await fetchContasData()
      return true
    } catch (err) {
      console.error('Erro ao atualizar categoria:', err)
      error.value = 'Erro ao atualizar categoria'
      return false
    }
  }

  /**
   * Deletar categoria (soft delete)
   */
  async function deleteCategory(id: string): Promise<boolean> {
    const { data: authData } = await supabase.auth.getUser()
    const userId = authData?.user?.id
    if (!userId) return false

    try {
      const { error: deleteError } = await supabase
        .from('categories')
        .update({ is_active: false })
        .eq('id', id)
        .eq('user_id', userId)

      if (deleteError) throw deleteError

      await fetchContasData()
      return true
    } catch (err) {
      console.error('Erro ao deletar categoria:', err)
      error.value = 'Erro ao deletar categoria'
      return false
    }
  }

  /**
   * Criar novo cartão de crédito
   */
  async function createCreditCard(data: CreditCardFormData): Promise<boolean> {
    const { data: authData } = await supabase.auth.getUser()
    const userId = authData?.user?.id
    if (!userId) return false

    try {
      const { error: insertError } = await supabase
        .from('credit_cards')
        .insert({
          user_id: userId,
          name: data.name,
          last_digits: data.lastDigits,
          brand: data.brand,
          color: data.color,
          closing_day: data.closingDay,
          due_day: data.dueDay,
          credit_limit: data.creditLimit,
          available_limit: data.creditLimit,
          account_id: data.accountId,
          is_active: true,
        })

      if (insertError) throw insertError

      await fetchContasData()
      return true
    } catch (err) {
      console.error('Erro ao criar cartão:', err)
      error.value = 'Erro ao criar cartão'
      return false
    }
  }

  /**
   * Atualizar cartão de crédito
   */
  async function updateCreditCard(id: string, data: CreditCardFormData): Promise<boolean> {
    const { data: authData } = await supabase.auth.getUser()
    const userId = authData?.user?.id
    if (!userId) return false

    try {
      const { error: updateError } = await supabase
        .from('credit_cards')
        .update({
          name: data.name,
          last_digits: data.lastDigits,
          brand: data.brand || null,
          color: data.color,
          closing_day: data.closingDay,
          due_day: data.dueDay,
          credit_limit: data.creditLimit ?? 0,
          account_id: data.accountId || null,
        })
        .eq('id', id)
        .eq('user_id', userId)

      if (updateError) throw updateError

      await fetchContasData()
      return true
    } catch (err) {
      console.error('Erro ao atualizar cartão:', err)
      error.value = 'Erro ao atualizar cartão'
      return false
    }
  }

  /**
   * Deletar cartão (soft delete)
   */
  async function deleteCreditCard(id: string): Promise<boolean> {
    const { data: authData } = await supabase.auth.getUser()
    const userId = authData?.user?.id
    if (!userId) return false

    try {
      const { error: deleteError } = await supabase
        .from('credit_cards')
        .update({ is_active: false })
        .eq('id', id)
        .eq('user_id', userId)

      if (deleteError) throw deleteError

      await fetchContasData()
      return true
    } catch (err) {
      console.error('Erro ao deletar cartão:', err)
      error.value = 'Erro ao deletar cartão'
      return false
    }
  }

  /**
   * Criar nova conta bancária
   */
  async function createAccount(data: AccountFormData): Promise<boolean> {
    const { data: authData } = await supabase.auth.getUser()
    const userId = authData?.user?.id
    if (!userId) return false

    try {
      // Inserir a conta
      const { data: newAccount, error: insertError } = await supabase
        .from('accounts')
        .insert({
          user_id: userId,
          name: data.name,
          bank_name: data.bankName,
          type: data.type,
          initial_balance: data.initialBalance || 0,
          current_balance: data.initialBalance || 0,
          color: data.color,
          icon: data.icon,
          is_active: true,
          include_in_total: true,
        })
        .select()
        .single()

      if (insertError) throw insertError

      // Se tem saldo inicial, criar transação de entrada
      if (data.initialBalance && data.initialBalance > 0 && newAccount) {
        const { error: transactionError } = await supabase
          .from('transactions')
          .insert({
            user_id: userId,
            account_id: newAccount.id,
            description: `Saldo inicial - ${data.name}`,
            amount: data.initialBalance,
            transaction_date: new Date().toISOString().split('T')[0],
            type: 'income',
            is_paid: true,
            status: 'confirmed',
            is_recurring: false,
          })

        if (transactionError) {
          console.error('Erro ao criar transação de saldo inicial:', transactionError)
          // Não falha a criação da conta, apenas loga o erro
        }
      }

      await fetchContasData()
      return true
    } catch (err) {
      console.error('Erro ao criar conta:', err)
      error.value = 'Erro ao criar conta'
      return false
    }
  }

  /**
   * Atualizar conta existente
   */
  async function updateAccount(id: string, data: Partial<AccountFormData>): Promise<boolean> {
    const { data: authData } = await supabase.auth.getUser()
    const userId = authData?.user?.id
    if (!userId) return false

    try {
      const updateData: Record<string, unknown> = {}
      if (data.name !== undefined) updateData.name = data.name
      if (data.bankName !== undefined) updateData.bank_name = data.bankName
      if (data.type !== undefined) updateData.type = data.type
      if (data.color !== undefined) updateData.color = data.color
      if (data.icon !== undefined) updateData.icon = data.icon

      const { error: updateError } = await supabase
        .from('accounts')
        .update(updateData)
        .eq('id', id)
        .eq('user_id', userId)

      if (updateError) throw updateError

      await fetchContasData()
      return true
    } catch (err) {
      console.error('Erro ao atualizar conta:', err)
      error.value = 'Erro ao atualizar conta'
      return false
    }
  }

  /**
   * Deletar conta (soft delete)
   */
  async function deleteAccount(id: string): Promise<boolean> {
    const { data: authData } = await supabase.auth.getUser()
    const userId = authData?.user?.id
    if (!userId) return false

    try {
      const { error: deleteError } = await supabase
        .from('accounts')
        .update({ is_active: false })
        .eq('id', id)
        .eq('user_id', userId)

      if (deleteError) throw deleteError

      await fetchContasData()
      return true
    } catch (err) {
      console.error('Erro ao deletar conta:', err)
      error.value = 'Erro ao deletar conta'
      return false
    }
  }

  // Buscar dados na inicialização (usando auth diretamente)
  const initializeData = async () => {
    const { data: authData } = await supabase.auth.getUser()
    if (authData?.user?.id && categories.value.length === 0) {
      await fetchContasData()
    }
  }

  // Chamar inicialização
  initializeData()

  // Watch para recarregar quando o usuário mudar
  watch(
    () => user.value?.id,
    (newId, oldId) => {
      if (newId && newId !== oldId) {
        fetchContasData()
      }
    }
  )

  return {
    // Estado
    isLoading,
    error,

    // Dados computados
    userName,
    totalRendas,
    rendasList,
    incomeCategories,
    expenseCategories,
    creditCardsList,
    accountsList,

    // Dados brutos (para selects / edição)
    accounts,
    categories,
    creditCards,

    // Ações - Rendas
    createRenda,
    updateRenda,
    deleteRenda,

    // Ações - Categorias
    createCategory,
    updateCategory,
    deleteCategory,

    // Ações - Cartões
    createCreditCard,
    updateCreditCard,
    deleteCreditCard,

    // Ações - Contas
    createAccount,
    updateAccount,
    deleteAccount,

    // Refresh
    fetchContasData,
    fetchCategoryTotals,

    // Faturas de cartão
    invoiceTotalsByCard,
    fetchCreditCardInvoicesForMonth,
    getCardInvoiceTransactions,

    // Lançamentos de conta
    getAccountTransactions,
  }
}
