import { computed, watch } from 'vue'
import type { ComputedRef } from 'vue'
import { useSupabaseClient, useSupabaseUser, useState } from '#imports'
import type {
  Database,
  Category,
  CreditCard,
  Account,
  RecurringTransaction,
} from '../../shared/types/database.types'

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

  // Computed: Contas bancárias formatadas
  const accountsList = computed<AccountDisplay[]>(() => {
    return accounts.value
      .filter((a) => a.is_active)
      .map((a) => ({
        id: a.id,
        name: a.name,
        bankName: a.bank_name,
        accountNumber: a.bank_name, // Usar o nome do banco como identificador
        type: a.type,
        color: a.color || '#6B7280',
        icon: a.icon,
      }))
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

      // Buscar dados em paralelo
      const [
        rendasResult,
        categoriesResult,
        creditCardsResult,
        accountsResult,
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
      ])

      // Verificar erros
      if (rendasResult.error) throw rendasResult.error
      if (categoriesResult.error) throw categoriesResult.error
      if (creditCardsResult.error) throw creditCardsResult.error
      if (accountsResult.error) throw accountsResult.error

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
  }
}
