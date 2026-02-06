import { ref } from 'vue'
import { useSupabaseClient, useSupabaseUser, useState } from '#imports'
import type { Database, TransactionInsert, RecurringTransactionInsert, Account, Category, CreditCard } from 'shared/types/database.types'
import { getInstallmentDate, type RepetitionFrequency } from 'shared/constants/repetition'
import { getReferenceMonth, getOrCreateInvoice } from '../utils/creditCardInvoice'

export type LancamentoType = 'entrada' | 'saida' | 'cartao' | null

export interface LancamentoFormData {
  accountId: string
  categoryId: string
  creditCardId?: string
  description: string
  amount: number
  transactionDate: string
  /** Repetir lançamento = criar N parcelas (não grava is_recurring sozinho) */
  isRecurring: boolean
  isPaid: boolean
  totalInstallments: number
  /** Frequência da repetição: semanal, mensal, trimestral, semestral, anual */
  repetitionFrequency?: RepetitionFrequency
  /** Recorrente (fixa) = cobrança fixa mensal; quando true grava is_recurring no banco */
  isFixedRecurring?: boolean
  /** No cartão: quando true com parcelas > 1, amount é o valor total e cada parcela = total/N */
  amountIsTotal?: boolean
  notes?: string
  tags?: string[]
}

export function useLancamento() {
  const supabase = useSupabaseClient<Database>()
  const user = useSupabaseUser()

  // Estado do modal (local, não precisa persistir)
  const isDropdownOpen = ref(false)
  const activeLancamentoType = ref<LancamentoType>(null)
  const isSubmitting = ref(false)
  const error = ref<string | null>(null)

  // Dados para os selects (useState para persistir)
  const accounts = useState<Account[]>('lancamento-accounts', () => [])
  const categories = useState<Category[]>('lancamento-categories', () => [])
  const creditCards = useState<CreditCard[]>('lancamento-creditCards', () => [])
  const isLoadingOptions = ref(false)

  // Abrir dropdown
  function openDropdown() {
    isDropdownOpen.value = true
  }

  // Fechar dropdown
  function closeDropdown() {
    isDropdownOpen.value = false
  }

  // Abrir modal de lançamento
  function openLancamentoModal(type: LancamentoType) {
    activeLancamentoType.value = type
    isDropdownOpen.value = false
    loadOptions()
  }

  // Fechar modal
  function closeLancamentoModal() {
    activeLancamentoType.value = null
    error.value = null
  }

  // Carregar opções de contas, categorias e cartões
  async function loadOptions() {
    const { data: authData } = await supabase.auth.getUser()
    const userId = authData?.user?.id
    if (!userId) return

    isLoadingOptions.value = true

    try {
      const [accountsResult, categoriesResult, creditCardsResult] = await Promise.all([
        supabase
          .from('accounts')
          .select('*')
          .eq('user_id', userId)
          .eq('is_active', true)
          .order('name'),
        supabase
          .from('categories')
          .select('*')
          .eq('user_id', userId)
          .eq('is_active', true)
          .order('name'),
        supabase
          .from('credit_cards')
          .select('*')
          .eq('user_id', userId)
          .eq('is_active', true)
          .order('name'),
      ])

      if (accountsResult.error) throw accountsResult.error
      if (categoriesResult.error) throw categoriesResult.error
      if (creditCardsResult.error) throw creditCardsResult.error

      accounts.value = accountsResult.data || []
      categories.value = categoriesResult.data || []
      creditCards.value = creditCardsResult.data || []
    } catch (err) {
      console.error('Erro ao carregar opções:', err)
      error.value = 'Erro ao carregar opções'
    } finally {
      isLoadingOptions.value = false
    }
  }

  // Criar transação de entrada (receita)
  async function createEntrada(data: LancamentoFormData): Promise<boolean> {
    const { data: authData } = await supabase.auth.getUser()
    const userId = authData?.user?.id
    if (!userId) return false

    // Se "Marcar como pago/recebido" estiver ligado, todas as parcelas vêm pagas
    const markAsPaid = data.isPaid === true

    isSubmitting.value = true
    error.value = null

    try {
      const transactions: TransactionInsert[] = []

      if (data.isRecurring && data.totalInstallments > 1) {
        // Criar múltiplas transações para parcelas; se marcado como pago, todas vêm pagas
        const installmentGroupId = crypto.randomUUID()
        const frequency = data.repetitionFrequency ?? 'monthly'
        for (let i = 0; i < data.totalInstallments; i++) {
          const transaction_date = getInstallmentDate(data.transactionDate, i, frequency)
          transactions.push({
            user_id: userId,
            account_id: data.accountId,
            category_id: data.categoryId || null,
            description: data.description,
            amount: data.amount,
            transaction_date,
            type: 'income',
            is_paid: markAsPaid,
            status: markAsPaid ? 'confirmed' : 'pending',
            is_recurring: data.isFixedRecurring === true,
            installment_number: i + 1,
            total_installments: data.totalInstallments,
            installment_group_id: installmentGroupId,
            notes: data.notes || null,
            tags: data.tags?.length ? data.tags : null,
          })
        }
      } else {
        // Transação única
        transactions.push({
          user_id: userId,
          account_id: data.accountId,
          category_id: data.categoryId || null,
          description: data.description,
          amount: data.amount,
          transaction_date: data.transactionDate,
          type: 'income',
          is_paid: markAsPaid,
          status: markAsPaid ? 'confirmed' : 'pending',
          is_recurring: data.isFixedRecurring === true,
          notes: data.notes || null,
          tags: data.tags?.length ? data.tags : null,
        })
      }

      const { error: insertError } = await supabase
        .from('transactions')
        .insert(transactions)

      if (insertError) throw insertError

      return true
    } catch (err) {
      console.error('Erro ao criar entrada:', err)
      error.value = 'Erro ao criar lançamento'
      return false
    } finally {
      isSubmitting.value = false
    }
  }

  // Criar transação de saída (despesa)
  async function createSaida(data: LancamentoFormData): Promise<boolean> {
    const { data: authData } = await supabase.auth.getUser()
    const userId = authData?.user?.id
    if (!userId) return false

    const firstInstallmentPaid = data.isPaid === true
    const isFixedRecurring = data.isFixedRecurring === true

    isSubmitting.value = true
    error.value = null

    try {
      let recurringId: string | null = null

      if (isFixedRecurring) {
        const startDate = data.transactionDate
        const dayOfMonth = new Date(startDate).getDate()
        let endDate: string | null = null
        if (data.isRecurring && data.totalInstallments > 1) {
          const last = new Date(startDate)
          last.setMonth(last.getMonth() + data.totalInstallments - 1)
          endDate = last.toISOString().split('T')[0]
        }
        const recurring: RecurringTransactionInsert = {
          user_id: userId,
          account_id: data.accountId,
          category_id: data.categoryId || null,
          type: 'expense',
          amount: Math.abs(data.amount),
          description: data.description,
          notes: data.notes || null,
          frequency: 'monthly',
          day_of_month: dayOfMonth,
          start_date: startDate,
          end_date: endDate,
          is_active: true,
          auto_confirm: firstInstallmentPaid,
        }
        const { data: recurringRow, error: recurringError } = await supabase
          .from('recurring_transactions')
          .insert(recurring)
          .select('id')
          .single()
        if (recurringError) throw recurringError
        recurringId = recurringRow?.id ?? null
      }

      const transactions: TransactionInsert[] = []

      if (data.isRecurring && data.totalInstallments > 1) {
        const installmentGroupId = crypto.randomUUID()
        const frequency = data.repetitionFrequency ?? 'monthly'
        for (let i = 0; i < data.totalInstallments; i++) {
          const transaction_date = getInstallmentDate(data.transactionDate, i, frequency)
          transactions.push({
            user_id: userId,
            account_id: data.accountId,
            category_id: data.categoryId || null,
            description: data.description,
            amount: -Math.abs(data.amount),
            transaction_date,
            type: 'expense',
            is_paid: firstInstallmentPaid,
            status: firstInstallmentPaid ? 'confirmed' : 'pending',
            is_recurring: isFixedRecurring,
            installment_number: i + 1,
            total_installments: data.totalInstallments,
            installment_group_id: installmentGroupId,
            notes: data.notes || null,
            tags: data.tags?.length ? data.tags : null,
            recurring_transaction_id: recurringId,
          })
        }
      } else {
        transactions.push({
          user_id: userId,
          account_id: data.accountId,
          category_id: data.categoryId || null,
          description: data.description,
          amount: -Math.abs(data.amount),
          transaction_date: data.transactionDate,
          type: 'expense',
          is_paid: firstInstallmentPaid,
          status: firstInstallmentPaid ? 'confirmed' : 'pending',
          is_recurring: isFixedRecurring,
          notes: data.notes || null,
          tags: data.tags?.length ? data.tags : null,
          recurring_transaction_id: recurringId,
        })
      }

      const { error: insertError } = await supabase
        .from('transactions')
        .insert(transactions)

      if (insertError) throw insertError

      return true
    } catch (err) {
      console.error('Erro ao criar saída:', err)
      error.value = 'Erro ao criar lançamento'
      return false
    } finally {
      isSubmitting.value = false
    }
  }

  // Criar transação de cartão de crédito
  async function createCartao(data: LancamentoFormData): Promise<boolean> {
    const { data: authData } = await supabase.auth.getUser()
    const userId = authData?.user?.id
    if (!userId || !data.creditCardId) return false

    const card = creditCards.value.find((c) => c.id === data.creditCardId)
    if (!card) {
      error.value = 'Cartão não encontrado'
      return false
    }

    isSubmitting.value = true
    error.value = null

    try {
      const defaultAccountId = data.accountId || accounts.value[0]?.id
      if (!defaultAccountId) {
        error.value = 'Nenhuma conta disponível'
        return false
      }

      const closingDay = card.closing_day ?? 28
      const dueDay = card.due_day ?? 8
      const numTx = data.isRecurring && data.totalInstallments > 1 ? data.totalInstallments : 1
      const totalAmount = Math.abs(data.amount)
      // Parcelado: valor digitado é o total; cada parcela = total/N (última parcela ajustada para fechar exato)
      const amountPerTx =
        data.amountIsTotal === true && numTx > 1
          ? Math.round((totalAmount / numTx) * 100) / 100
          : totalAmount
      const totalAmountToCheck = data.amountIsTotal === true && numTx > 1 ? totalAmount : amountPerTx * numTx
      const availableLimit = card.available_limit ?? 0
      if (availableLimit < totalAmountToCheck) {
        error.value = 'Limite insuficiente no cartão'
        return false
      }

      const transactions: TransactionInsert[] = []
      const installmentGroupId = crypto.randomUUID()
      const frequency = data.repetitionFrequency ?? 'monthly'

      if (data.isRecurring && data.totalInstallments > 1) {
        const isParcelado = data.amountIsTotal === true
        for (let i = 0; i < data.totalInstallments; i++) {
          const transaction_date = getInstallmentDate(data.transactionDate, i, frequency)
          const referenceMonth = getReferenceMonth(transaction_date, closingDay)
          const invoiceId = await getOrCreateInvoice(supabase, data.creditCardId!, referenceMonth, userId, closingDay, dueDay)
          if (!invoiceId) {
            error.value = 'Erro ao obter fatura do cartão'
            return false
          }
          // Parcelado: última parcela recebe o restante para totalizar exato
          const thisAmount =
            isParcelado && i === data.totalInstallments - 1
              ? Math.round((totalAmount - amountPerTx * (data.totalInstallments - 1)) * 100) / 100
              : amountPerTx
          transactions.push({
            user_id: userId,
            account_id: defaultAccountId,
            category_id: data.categoryId || null,
            credit_card_id: data.creditCardId,
            invoice_id: invoiceId,
            description: data.description,
            amount: -thisAmount,
            transaction_date,
            type: 'expense',
            is_paid: false,
            status: 'pending',
            is_recurring: data.isFixedRecurring === true,
            installment_number: i + 1,
            total_installments: data.totalInstallments,
            installment_group_id: installmentGroupId,
            notes: data.notes || null,
            tags: data.tags?.length ? data.tags : null,
          })
        }
      } else {
        const transaction_date = data.transactionDate
        const referenceMonth = getReferenceMonth(transaction_date, closingDay)
        const invoiceId = await getOrCreateInvoice(supabase, data.creditCardId!, referenceMonth, userId, closingDay, dueDay)
        if (!invoiceId) {
          error.value = 'Erro ao obter fatura do cartão'
          return false
        }
        transactions.push({
          user_id: userId,
          account_id: defaultAccountId,
          category_id: data.categoryId || null,
          credit_card_id: data.creditCardId,
          invoice_id: invoiceId,
          description: data.description,
          amount: -amountPerTx,
          transaction_date,
          type: 'expense',
          is_paid: false,
          status: 'pending',
          is_recurring: data.isFixedRecurring === true,
          notes: data.notes || null,
          tags: data.tags?.length ? data.tags : null,
        })
      }

      const { error: insertError } = await supabase.from('transactions').insert(transactions)
      if (insertError) throw insertError

      // Limite e total_amount sao atualizados pelo trigger on_transaction_credit_card_insert no Supabase
      await loadOptions()
      return true
    } catch (err: unknown) {
      console.error('Erro ao criar lançamento cartão:', err)
      const msg = err && typeof err === 'object' && 'message' in err ? String((err as { message: string }).message) : ''
      if (msg.includes('limit') || msg.includes('limite')) error.value = 'Limite insuficiente no cartão'
      else if (msg.includes('RLS') || msg.includes('row level')) error.value = 'Sem permissão para este cartão'
      else error.value = 'Erro ao criar lançamento'
      return false
    } finally {
      isSubmitting.value = false
    }
  }

  // Criar conta rápida
  async function createQuickAccount(name: string, type: string = 'checking'): Promise<string | null> {
    const { data: authData } = await supabase.auth.getUser()
    const userId = authData?.user?.id
    if (!userId) return null

    try {
      const { data, error: insertError } = await supabase
        .from('accounts')
        .insert({
          user_id: userId,
          name,
          type,
          is_active: true,
          include_in_total: true,
          initial_balance: 0,
          current_balance: 0,
        })
        .select('id')
        .single()

      if (insertError) throw insertError

      // Recarregar contas
      await loadOptions()

      return data?.id || null
    } catch (err) {
      console.error('Erro ao criar conta:', err)
      return null
    }
  }

  // Criar categoria rápida
  async function createQuickCategory(name: string, type: 'income' | 'expense'): Promise<string | null> {
    const { data: authData } = await supabase.auth.getUser()
    const userId = authData?.user?.id
    if (!userId) return null

    try {
      const { data, error: insertError } = await supabase
        .from('categories')
        .insert({
          user_id: userId,
          name,
          type,
          is_active: true,
          is_system: false,
        })
        .select('id')
        .single()

      if (insertError) throw insertError

      // Recarregar categorias
      await loadOptions()

      return data?.id || null
    } catch (err) {
      console.error('Erro ao criar categoria:', err)
      return null
    }
  }

  // Filtrar categorias por tipo
  function getCategoriesByType(type: 'income' | 'expense') {
    return categories.value.filter((c) => c.type === type)
  }

  // Atualizar transação existente
  async function updateTransaction(transactionId: string, data: LancamentoFormData, type: 'income' | 'expense'): Promise<boolean> {
    const { data: authData } = await supabase.auth.getUser()
    const userId = authData?.user?.id
    if (!userId) return false

    isSubmitting.value = true
    error.value = null

    try {
      let accountId = data.accountId
      if (!accountId || accountId.trim() === '') {
        const { data: current } = await supabase
          .from('transactions')
          .select('account_id')
          .eq('id', transactionId)
          .eq('user_id', userId)
          .single()
        accountId = current?.account_id ?? accounts.value[0]?.id ?? ''
        if (!accountId) {
          error.value = 'Nenhuma conta disponível para esta transação'
          return false
        }
      }

      const amount = type === 'income' ? Math.abs(data.amount) : -Math.abs(data.amount)
      const isPaid = data.isPaid !== false
      const transactionDateIso = `${data.transactionDate}T12:00:00.000Z`

      const { error: updateError } = await supabase
        .from('transactions')
        .update({
          account_id: accountId,
          category_id: data.categoryId || null,
          description: data.description,
          amount: amount,
          transaction_date: transactionDateIso,
          is_paid: isPaid,
          status: isPaid ? 'confirmed' : 'pending',
          is_recurring: data.isFixedRecurring !== undefined ? data.isFixedRecurring === true : data.isRecurring,
          tags: data.tags?.length ? data.tags : null,
        })
        .eq('id', transactionId)
        .eq('user_id', userId)

      if (updateError) throw updateError

      return true
    } catch (err) {
      console.error('Erro ao atualizar transação:', err)
      error.value = 'Erro ao atualizar lançamento'
      return false
    } finally {
      isSubmitting.value = false
    }
  }

  /**
   * Atualiza lançamento(s) de cartão de crédito.
   * Se applyToAllInstallments for true e a transação fizer parte de um grupo parcelado,
   * atualiza todas as parcelas do grupo (recalculando valores). Caso contrário, atualiza só a transação atual.
   */
  async function updateCreditCardTransaction(
    transactionId: string,
    data: LancamentoFormData,
    options: { applyToAllInstallments: boolean; installmentGroupId: string | null; currentInstallmentNumber: number | null; currentTotalInstallments: number }
  ): Promise<boolean> {
    const { data: authData } = await supabase.auth.getUser()
    const userId = authData?.user?.id
    if (!userId) return false

    isSubmitting.value = true
    error.value = null

    try {
      let accountId = data.accountId
      if (!accountId || accountId.trim() === '') {
        const { data: current } = await supabase
          .from('transactions')
          .select('account_id')
          .eq('id', transactionId)
          .eq('user_id', userId)
          .single()
        accountId = current?.account_id ?? accounts.value[0]?.id ?? ''
        if (!accountId) {
          error.value = 'Nenhuma conta disponível para esta transação'
          return false
        }
      }

      const isPaid = data.isPaid !== false
      const totalAmount = Math.abs(data.amount)
      const n = Math.max(1, data.totalInstallments || 1)

      if (options.applyToAllInstallments && options.installmentGroupId && n > 1) {
        const { data: groupRows } = await supabase
          .from('transactions')
          .select('id, installment_number')
          .eq('installment_group_id', options.installmentGroupId)
          .eq('user_id', userId)
          .order('installment_number')

        if (!groupRows?.length) {
          error.value = 'Parcelas do grupo não encontradas'
          return false
        }

        const numParcelas = groupRows.length
        const amountPerParcel = Math.round((totalAmount / numParcelas) * 100) / 100
        const frequency = data.repetitionFrequency ?? 'monthly'
        for (let i = 0; i < groupRows.length; i++) {
          const row = groupRows[i]
          const isLast = i === groupRows.length - 1
          const thisAmount = isLast
            ? Math.round((totalAmount - amountPerParcel * (numParcelas - 1)) * 100) / 100
            : amountPerParcel
          const parcelDate = getInstallmentDate(data.transactionDate, (row.installment_number ?? i + 1) - 1, frequency)
          const transactionDateIso = `${parcelDate}T12:00:00.000Z`

          const { error: updateError } = await supabase
            .from('transactions')
            .update({
              account_id: accountId,
              credit_card_id: data.creditCardId || null,
              category_id: data.categoryId || null,
              description: data.description,
              amount: -thisAmount,
              transaction_date: transactionDateIso,
              is_paid: isPaid,
              status: isPaid ? 'confirmed' : 'pending',
              is_recurring: data.isFixedRecurring !== undefined ? data.isFixedRecurring === true : data.isRecurring,
              total_installments: numParcelas,
              tags: data.tags?.length ? data.tags : null,
            })
            .eq('id', row.id)
            .eq('user_id', userId)

          if (updateError) throw updateError
        }
        return true
      }

      const transactionDateIso = `${data.transactionDate}T12:00:00.000Z`
      const amountThis = n > 1 ? -Math.round((totalAmount / n) * 100) / 100 : -totalAmount

      const { error: updateError } = await supabase
        .from('transactions')
        .update({
          account_id: accountId,
          credit_card_id: data.creditCardId || null,
          category_id: data.categoryId || null,
          description: data.description,
          amount: amountThis,
          transaction_date: transactionDateIso,
          is_paid: isPaid,
          status: isPaid ? 'confirmed' : 'pending',
          is_recurring: data.isFixedRecurring !== undefined ? data.isFixedRecurring === true : data.isRecurring,
          tags: data.tags?.length ? data.tags : null,
        })
        .eq('id', transactionId)
        .eq('user_id', userId)

      if (updateError) throw updateError
      return true
    } catch (err) {
      console.error('Erro ao atualizar lançamento cartão:', err)
      error.value = 'Erro ao atualizar lançamento'
      return false
    } finally {
      isSubmitting.value = false
    }
  }

  return {
    // Estado
    isDropdownOpen,
    activeLancamentoType,
    isSubmitting,
    error,
    isLoadingOptions,

    // Dados
    accounts,
    categories,
    creditCards,

    // Ações dropdown
    openDropdown,
    closeDropdown,
    openLancamentoModal,
    closeLancamentoModal,

    // Ações CRUD
    createEntrada,
    createSaida,
    createCartao,
    createQuickAccount,
    createQuickCategory,
    updateTransaction,
    updateCreditCardTransaction,

    // Helpers
    getCategoriesByType,
    loadOptions,
  }
}
