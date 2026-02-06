<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useExtrato, type ExtratoTab, type ExtratoStatus, type ExtratoCreditCard } from '../composables/useExtrato'
import { useExtratoSelection } from '../composables/useExtratoSelection'
import { useLancamento, type LancamentoType, type LancamentoFormData } from '../composables/useLancamento'
import PageHeader from '../components/PageHeader.vue'
import ExtratoFilters from '../components/ExtratoFilters.vue'
import ExtratoList from '../components/ExtratoList.vue'
import ExtratoListByDate from '../components/ExtratoListByDate.vue'
import ExtratoSidebar from '../components/ExtratoSidebar.vue'
import ExtratoSelectionSummary from '../components/ExtratoSelectionSummary.vue'
import SummaryCard from '../components/SummaryCard.vue'
import LancamentoEntradaModal from '../components/LancamentoEntradaModal.vue'
import LancamentoSaidaModal from '../components/LancamentoSaidaModal.vue'
import LancamentoCartaoModal from '../components/LancamentoCartaoModal.vue'
import ConfirmDeleteModal from '../components/ConfirmDeleteModal.vue'
import InstallmentScopeModal from '../components/InstallmentScopeModal.vue'
import PayInvoiceModal from '../components/PayInvoiceModal.vue'
import ExtratoCardLancamentosDrawer from '../components/ExtratoCardLancamentosDrawer.vue'
import { useCreditCardInvoice } from '../composables/useCreditCardInvoice'

/**
 * Extrato - Página de extrato de transações
 * Exibe lista completa de transações com filtros e ações
 */

definePageMeta({
  layout: 'dashboard',
})

// Composable de extrato
const {
  isLoading,
  selectedPeriod,
  activeTab,
  searchQuery,
  activeStatusFilters,
  activeTagFilters,
  dateFilter,
  userName,
  monthName,
  dailyQuote,
  summaryData,
  contasPagas,
  filteredTransactions,
  groupedByDateTransactions,
  creditCardsList,
  totalCreditCards,
  extratoAccounts,
  listRefreshKey,
  toggleStatusFilter,
  toggleTagFilter,
  setDateFilter,
  fetchExtratoData,
  markAsPaid,
  markAsUnpaid,
  deleteTransaction,
  markRendaAsReceived,
  updateTransactionLocal,
  getTransactionById,
  getRawTransactionById,
  existingTags,
} = useExtrato()

const {
  selectedIds,
  selectedIdsList,
  selectedCount,
  hasSelection,
  isSelected,
  toggle: toggleSelection,
  clear: clearSelection,
} = useExtratoSelection()

const { payInvoice, error: payInvoiceError, isSubmitting: isPayInvoiceSubmitting } = useCreditCardInvoice()
const isPayInvoiceModalOpen = ref(false)
const payInvoicePayload = ref<{
  creditCardId: string
  invoiceId?: string
  referenceMonth?: string
  amount: number
  dueDate?: string
} | null>(null)

function handlePayInvoice(payload: { creditCardId: string; invoiceId?: string; referenceMonth?: string; amount: number; dueDate?: string }) {
  payInvoicePayload.value = payload
  isPayInvoiceModalOpen.value = true
}

async function handlePayInvoiceSubmit(submitPayload: { accountId: string; amount: number; paymentDate: string }) {
  if (!payInvoicePayload.value) return
  const success = await payInvoice(
    payInvoicePayload.value.invoiceId ?? null,
    payInvoicePayload.value.creditCardId,
    submitPayload.accountId,
    submitPayload.amount,
    submitPayload.paymentDate,
    payInvoicePayload.value.referenceMonth
  )
  if (success) {
    isPayInvoiceModalOpen.value = false
    payInvoicePayload.value = null
    await fetchExtratoData()
    listRefreshKey.value += 1
  }
}

function handleClosePayInvoiceModal() {
  isPayInvoiceModalOpen.value = false
  payInvoicePayload.value = null
}

const route = useRoute()
const monthNameForSidebar = computed((): string => monthName?.value ?? '')

// Transações selecionadas e totais para o painel de sumário
const selectedTransactionsSummary = computed(() => {
  const ids = selectedIdsList.value
  let soma = 0
  let valorLiquido = 0
  for (const id of ids) {
    const t = getTransactionById(id)
    if (t) {
      soma += Math.abs(t.amount)
      valorLiquido += t.amount
    }
  }
  return { soma, valorLiquido }
})

// Ajusta o período exibido para o mês da transação (evita item sumir após editar)
function setPeriodToTransactionDate(transactionDate: string) {
  const parts = transactionDate.split('-').map(Number)
  const month = parts[1]
  const year = parts[0]
  if (parts.length >= 2 && month !== undefined && year !== undefined) {
    selectedPeriod.value = { month: month - 1, year }
  }
}

// Estado do modal de exclusão
const isDeleteModalOpen = ref(false)
const transactionToDelete = ref<{ id: string; name: string } | null>(null)
const isDeleting = ref(false)
// Exclusão em massa
const isBulkDeleteModalOpen = ref(false)
const isBulkDeleting = ref(false)

// Estado para edição de transação
interface EditTransactionData {
  id: string
  accountId: string
  categoryId: string
  description: string
  amount: number
  transactionDate: string
  isRecurring: boolean
  isPaid: boolean
  totalInstallments: number
  tags?: string[]
  creditCardId?: string
}
const editTransactionData = ref<EditTransactionData | null>(null)

// Composable para lançamentos
const {
  activeLancamentoType,
  isSubmitting,
  error: lancamentoError,
  isLoadingOptions,
  accounts,
  categories,
  creditCards,
  openLancamentoModal,
  closeLancamentoModal,
  createEntrada,
  createSaida,
  createCartao,
  createQuickAccount,
  createQuickCategory,
  updateTransaction,
  updateCreditCardTransaction,
} = useLancamento()

// Handlers
function handleOpenLancamento(type: LancamentoType) {
  openLancamentoModal(type)
}

async function handleSubmitEntrada(data: LancamentoFormData, createAnother: boolean, editId?: string) {
  let success: boolean

  if (editId) {
    success = await updateTransaction(editId, data, 'income')
    if (success) {
      const transactionDateIso = `${data.transactionDate}T12:00:00.000Z`
      updateTransactionLocal(editId, {
        account_id: data.accountId,
        category_id: data.categoryId || null,
        description: data.description,
        amount: Math.abs(data.amount),
        transaction_date: transactionDateIso,
        is_paid: data.isPaid,
        status: data.isPaid ? 'confirmed' : 'pending',
        is_recurring: data.isFixedRecurring !== undefined ? data.isFixedRecurring === true : data.isRecurring,
        tags: data.tags?.length ? data.tags : null,
      })
      // Garantir que o período exibido seja o mês da transação para o item continuar visível
      setPeriodToTransactionDate(data.transactionDate)
    }
  } else {
    success = await createEntrada(data)
  }

  if (success) {
    if (!createAnother) {
      handleCloseModal()
    }
    fetchExtratoData()
  }
}

async function handleSubmitSaida(data: LancamentoFormData, createAnother: boolean, editId?: string) {
  let success: boolean

  if (editId) {
    success = await updateTransaction(editId, data, 'expense')
    if (success) {
      const transactionDateIso = `${data.transactionDate}T12:00:00.000Z`
      updateTransactionLocal(editId, {
        account_id: data.accountId,
        category_id: data.categoryId || null,
        description: data.description,
        amount: -Math.abs(data.amount),
        transaction_date: transactionDateIso,
        is_paid: data.isPaid,
        status: data.isPaid ? 'confirmed' : 'pending',
        is_recurring: data.isFixedRecurring !== undefined ? data.isFixedRecurring === true : data.isRecurring,
        tags: data.tags?.length ? data.tags : null,
      })
      setPeriodToTransactionDate(data.transactionDate)
    }
  } else {
    success = await createSaida(data)
  }

  if (success) {
    if (!createAnother) {
      handleCloseModal()
    }
    fetchExtratoData()
  }
}

const isInstallmentScopeModalOpen = ref(false)
const pendingCartaoSubmit = ref<{
  data: LancamentoFormData
  createAnother: boolean
  editId: string
  raw: { installmentGroupId: string | null; installmentNumber: number | null; totalInstallments: number }
} | null>(null)

async function handleSubmitCartao(data: LancamentoFormData, createAnother: boolean, editId?: string) {
  if (editId) {
    const raw = getRawTransactionById(editId)
    const isParcelado = raw?.installmentGroupId && (raw.totalInstallments ?? 1) > 1
    if (isParcelado && raw) {
      pendingCartaoSubmit.value = {
        data,
        createAnother,
        editId,
        raw: {
          installmentGroupId: raw.installmentGroupId ?? null,
          installmentNumber: raw.installmentNumber ?? null,
          totalInstallments: raw.totalInstallments ?? 1,
        },
      }
      isInstallmentScopeModalOpen.value = true
      return
    }
    const success = await updateCreditCardTransaction(editId, data, {
      applyToAllInstallments: false,
      installmentGroupId: raw?.installmentGroupId ?? null,
      currentInstallmentNumber: raw?.installmentNumber ?? null,
      currentTotalInstallments: raw?.totalInstallments ?? 1,
    })
    if (success) {
      const transactionDateIso = `${data.transactionDate}T12:00:00.000Z`
      const rawEdit = getRawTransactionById(editId)
      updateTransactionLocal(editId, {
        ...(data.accountId ? { account_id: data.accountId } : rawEdit?.accountId ? { account_id: rawEdit.accountId } : {}),
        category_id: data.categoryId || null,
        description: data.description,
        amount: -Math.abs(data.amount),
        transaction_date: transactionDateIso,
        is_paid: data.isPaid,
        status: data.isPaid ? 'confirmed' : 'pending',
        is_recurring: data.isFixedRecurring !== undefined ? data.isFixedRecurring === true : data.isRecurring,
        tags: data.tags?.length ? data.tags : null,
      })
      setPeriodToTransactionDate(data.transactionDate)
      if (!createAnother) handleCloseModal()
      fetchExtratoData()
    }
    return
  }
  const success = await createCartao(data)
  if (success) {
    if (!createAnother) handleCloseModal()
    fetchExtratoData()
  }
}

async function applyCartaoSubmitScope(applyToAllInstallments: boolean) {
  const pending = pendingCartaoSubmit.value
  if (!pending) return
  const { data, createAnother, editId, raw } = pending
  const success = await updateCreditCardTransaction(editId, data, {
    applyToAllInstallments,
    installmentGroupId: raw.installmentGroupId,
    currentInstallmentNumber: raw.installmentNumber,
    currentTotalInstallments: raw.totalInstallments,
  })
  isInstallmentScopeModalOpen.value = false
  pendingCartaoSubmit.value = null
  if (success) {
    handleCloseModal()
    fetchExtratoData()
  }
}

function cancelInstallmentScopeModal() {
  isInstallmentScopeModalOpen.value = false
  pendingCartaoSubmit.value = null
}

async function handleCreateAccount(name: string) {
  await createQuickAccount(name)
}

async function handleCreateIncomeCategory(name: string) {
  await createQuickCategory(name, 'income')
}

async function handleCreateExpenseCategory(name: string) {
  await createQuickCategory(name, 'expense')
}

async function handleMarkPaid(id: string) {
  try {
    await markAsPaid(id)
  } catch (err) {
    console.error('Erro ao marcar como pago:', err)
  }
}

function handleEditTransaction(id: string) {
  handleCloseCardDrawer()
  const rawTransaction = getRawTransactionById(id)
  if (!rawTransaction) return

  // Preencher os dados de edição
  editTransactionData.value = {
    id: rawTransaction.id,
    accountId: rawTransaction.accountId,
    categoryId: rawTransaction.categoryId,
    description: rawTransaction.description,
    amount: rawTransaction.amount,
    transactionDate: rawTransaction.transactionDate,
    isRecurring: rawTransaction.isRecurring,
    isPaid: rawTransaction.isPaid,
    totalInstallments: rawTransaction.totalInstallments,
    tags: rawTransaction.tags,
    creditCardId: rawTransaction.creditCardId,
  }

  // Determinar o tipo de modal a abrir baseado no tipo da transação
  if (rawTransaction.creditCardId) {
    openLancamentoModal('cartao')
  } else if (rawTransaction.type === 'income') {
    openLancamentoModal('entrada')
  } else {
    openLancamentoModal('saida')
  }
}

// Limpar dados de edição e iniciais ao fechar modal
function handleCloseModal() {
  editTransactionData.value = null
  initialCartaoCreditCardId.value = null
  initialCartaoTransactionDate.value = null
  closeLancamentoModal()
}

function handleCreateCard() {
  handleCloseModal()
  navigateTo('/contas?openCreditCard=1')
}

function handleDeleteTransaction(id: string) {
  handleCloseCardDrawer()
  const transaction = getTransactionById(id)
  if (!transaction) return

  transactionToDelete.value = {
    id: transaction.id,
    name: transaction.description,
  }
  isDeleteModalOpen.value = true
}

async function confirmDelete() {
  if (!transactionToDelete.value) return

  isDeleting.value = true
  try {
    await deleteTransaction(transactionToDelete.value.id)
    isDeleteModalOpen.value = false
    transactionToDelete.value = null
  } catch (err) {
    console.error('Erro ao excluir transação:', err)
  } finally {
    isDeleting.value = false
  }
}

function cancelDelete() {
  isDeleteModalOpen.value = false
  transactionToDelete.value = null
}

function handleToggleSelect(id: string) {
  toggleSelection(id)
}

function handleSelectionClose() {
  clearSelection()
}

async function handleBulkMarkPaid() {
  const ids = selectedIdsList.value
  for (const id of ids) {
    try {
      await markAsPaid(id)
    } catch (err) {
      console.error('Erro ao marcar como pago:', id, err)
    }
  }
  clearSelection()
  fetchExtratoData()
}

async function handleBulkMarkUnpaid() {
  const ids = selectedIdsList.value
  for (const id of ids) {
    try {
      await markAsUnpaid(id)
    } catch (err) {
      console.error('Erro ao marcar como não pago:', id, err)
    }
  }
  clearSelection()
  fetchExtratoData()
}

function handleBulkDelete() {
  isBulkDeleteModalOpen.value = true
}

async function confirmBulkDelete() {
  isBulkDeleting.value = true
  try {
    const ids = [...selectedIdsList.value]
    for (const id of ids) {
      await deleteTransaction(id)
    }
    isBulkDeleteModalOpen.value = false
    clearSelection()
    fetchExtratoData()
  } catch (err) {
    console.error('Erro ao excluir lançamentos:', err)
  } finally {
    isBulkDeleting.value = false
  }
}

function cancelBulkDelete() {
  isBulkDeleteModalOpen.value = false
}

function handleViewMoreCards() {
  // TODO: Navegar para página de cartões
  console.log('Ver mais cartões')
}

const selectedCardForDrawer = ref<ExtratoCreditCard | null>(null)

function handleCardClick(cardId: string) {
  const card = creditCardsList.value.find((c) => c.id === cardId) ?? null
  selectedCardForDrawer.value = card
}

function handleCloseCardDrawer() {
  selectedCardForDrawer.value = null
}

// Pré-preenchimento ao adicionar lançamento a partir do drawer (cartão + mês da fatura)
const initialCartaoCreditCardId = ref<string | null>(null)
const initialCartaoTransactionDate = ref<string | null>(null)

/** Primeiro dia do mês da fatura (mês anterior ao período selecionado) em YYYY-MM-DD */
function getFaturaMonthFirstDay(): string {
  const { month, year } = selectedPeriod.value
  const d = new Date(year, month - 1, 1)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function handleAddFromCardDrawer() {
  if (!selectedCardForDrawer.value) return
  initialCartaoCreditCardId.value = selectedCardForDrawer.value.id
  initialCartaoTransactionDate.value = getFaturaMonthFirstDay()
  handleCloseCardDrawer()
  openLancamentoModal('cartao')
}

// Atualiza o card do drawer quando a lista de cartões é recarregada (ex.: após editar/excluir)
watch(creditCardsList, (list) => {
  if (selectedCardForDrawer.value) {
    const found = list.find((c) => c.id === selectedCardForDrawer.value!.id)
    if (found) selectedCardForDrawer.value = found
  }
}, { deep: true })

// Abrir drawer do cartão quando vier do dashboard com ?openCard=id
function tryOpenCardDrawerFromQuery() {
  const cardId = route.query.openCard
  if (typeof cardId === 'string' && cardId) {
    const card = creditCardsList.value.find((c) => c.id === cardId) ?? null
    if (card) {
      selectedCardForDrawer.value = card
      // Remove o query da URL sem recarregar
      if (typeof window !== 'undefined' && window.history?.replaceState) {
        const url = new URL(window.location.href)
        url.searchParams.delete('openCard')
        window.history.replaceState({}, '', url.pathname + url.search)
      }
    }
  }
}

onMounted(() => {
  tryOpenCardDrawerFromQuery()
})

watch(() => route.query.openCard, () => {
  tryOpenCardDrawerFromQuery()
})

// Se os cartões carregarem depois do mount, abrir o drawer se houver openCard na URL
watch(creditCardsList, () => {
  tryOpenCardDrawerFromQuery()
}, { deep: true })

function handleEditRenda(recurringId: string) {
  navigateTo({ path: '/contas', query: { editarRenda: recurringId } })
}

function handleEditSaida(recurringId: string) {
  navigateTo({ path: '/contas', query: { editarSaida: recurringId } })
}

async function handleMarkRendaReceived(payload: { recurringId: string; transactionDate: string }) {
  try {
    await markRendaAsReceived(payload.recurringId, payload.transactionDate)
  } catch (err) {
    console.error('Erro ao marcar renda como recebida:', err)
  }
}

async function handleMarkUnpaid(id: string) {
  try {
    await markAsUnpaid(id)
  } catch (err) {
    console.error('Erro ao marcar como não pago/recebido:', err)
  }
}
</script>

<template>
  <div id="extrato-page" class="flex flex-col">
    <!-- Header em largura total (fora da coluna) -->
    <PageHeader
      :user-name="userName"
      :period="selectedPeriod"
      :quote="dailyQuote"
      @update:period="selectedPeriod = $event"
      @open-lancamento="handleOpenLancamento"
    />

    <!-- Conteúdo: coluna principal + sidebar (max 1500px, centralizado) -->
    <div class="flex gap-5 flex-1 min-w-0 w-full max-w-[1500px] mx-auto">
      <div class="flex-1 min-w-0">
      <!-- Summary Cards -->
      <div class="grid grid-cols-4 gap-4 mb-5">
        <SummaryCard
          label="A pagar"
          :value="summaryData.aPagar"
          variant="danger"
          icon="down"
          :loading="isLoading"
          show-visibility-toggle
        />
        <SummaryCard
          label="Receita mensal"
          :value="summaryData.receitaMensal"
          variant="success"
          icon="up"
          :loading="isLoading"
        />
        <SummaryCard
          label="A receber"
          :value="summaryData.aReceber"
          variant="success"
          icon="up"
          :loading="isLoading"
        />
        <SummaryCard
          label="Total recorrentes"
          :value="summaryData.totalRecorrentes"
          variant="neutral"
          :loading="isLoading"
        />
      </div>

      <!-- Filters -->
      <div class="bg-surface-elevated rounded-xl p-4 mb-5 shadow-xs border border-default-subtle">
        <ExtratoFilters
          :active-tab="activeTab"
          :search-query="searchQuery"
          :active-status-filters="activeStatusFilters"
          :available-tags="existingTags"
          :active-tag-filters="activeTagFilters"
          :date-filter="dateFilter"
          @update:active-tab="activeTab = $event"
          @update:search-query="searchQuery = $event"
          @toggle-status="toggleStatusFilter"
          @toggle-tag="toggleTagFilter"
          @update:date-filter="setDateFilter"
        />
      </div>

      <!-- Transactions List -->
      <!-- Exibição por data (agrupada) -->
      <ExtratoListByDate
        v-if="activeTab === 'por_data'"
        :key="`list-by-date-${listRefreshKey}`"
        :groups="groupedByDateTransactions"
        :loading="isLoading"
        :selected-ids="selectedIds"
        @mark-paid="handleMarkPaid"
        @mark-unpaid="handleMarkUnpaid"
        @edit="handleEditTransaction"
        @delete="handleDeleteTransaction"
        @edit-renda="handleEditRenda"
        @edit-saida="handleEditSaida"
        @mark-renda-received="handleMarkRendaReceived"
        @toggle-select="handleToggleSelect"
        @pay-invoice="handlePayInvoice"
      />
      
      <!-- Exibição padrão (lista simples) -->
      <ExtratoList
        v-else
        :key="`list-${listRefreshKey}`"
        :transactions="filteredTransactions"
        :loading="isLoading"
        :selected-ids="selectedIds"
        @mark-paid="handleMarkPaid"
        @mark-unpaid="handleMarkUnpaid"
        @edit="handleEditTransaction"
        @delete="handleDeleteTransaction"
        @edit-renda="handleEditRenda"
        @edit-saida="handleEditSaida"
        @mark-renda-received="handleMarkRendaReceived"
        @toggle-select="handleToggleSelect"
        @pay-invoice="handlePayInvoice"
      />
    </div>

    <!-- Right Sidebar -->
    <ExtratoSidebar
      class="w-[320px] flex-shrink-0"
      :credit-cards="creditCardsList"
      :total-credit-cards="totalCreditCards"
      :contas-pagas="contasPagas"
      :month-name="monthNameForSidebar"
      :loading="isLoading"
      @view-more-cards="handleViewMoreCards"
      @card-click="handleCardClick"
    />
    </div>

    <!-- Modais de Lançamento -->
    <LancamentoEntradaModal
      :is-open="activeLancamentoType === 'entrada'"
      :accounts="accounts"
      :categories="categories"
      :existing-tags="existingTags"
      :is-loading="isLoadingOptions"
      :is-submitting="isSubmitting"
      :error="lancamentoError"
      :edit-data="editTransactionData"
      @close="handleCloseModal"
      @submit="handleSubmitEntrada"
      @create-account="handleCreateAccount"
      @create-category="handleCreateIncomeCategory"
    />

    <LancamentoSaidaModal
      :is-open="activeLancamentoType === 'saida'"
      :accounts="accounts"
      :categories="categories"
      :existing-tags="existingTags"
      :is-loading="isLoadingOptions"
      :is-submitting="isSubmitting"
      :error="lancamentoError"
      :edit-data="editTransactionData"
      @close="handleCloseModal"
      @submit="handleSubmitSaida"
      @create-account="handleCreateAccount"
      @create-category="handleCreateExpenseCategory"
    />

    <LancamentoCartaoModal
      :is-open="activeLancamentoType === 'cartao'"
      :credit-cards="creditCards"
      :categories="categories"
      :is-loading="isLoadingOptions"
      :is-submitting="isSubmitting"
      :error="lancamentoError"
      :edit-data="editTransactionData"
      :initial-credit-card-id="initialCartaoCreditCardId"
      :initial-transaction-date="initialCartaoTransactionDate"
      @close="handleCloseModal"
      @submit="handleSubmitCartao"
      @create-category="handleCreateExpenseCategory"
      @create-card="handleCreateCard"
    />

    <PayInvoiceModal
      :is-open="isPayInvoiceModalOpen"
      :accounts="extratoAccounts"
      :initial-amount="payInvoicePayload?.amount ?? 0"
      :credit-card-id="payInvoicePayload?.creditCardId ?? ''"
      :invoice-id="payInvoicePayload?.invoiceId"
      :reference-month="payInvoicePayload?.referenceMonth"
      :due-date="payInvoicePayload?.dueDate"
      :error="payInvoiceError"
      :is-submitting="isPayInvoiceSubmitting"
      @close="handleClosePayInvoiceModal"
      @submit="handlePayInvoiceSubmit"
    />

    <InstallmentScopeModal
      :is-open="isInstallmentScopeModalOpen"
      :is-submitting="isSubmitting"
      @only-this="applyCartaoSubmitScope(false)"
      @all-installments="applyCartaoSubmitScope(true)"
      @cancel="cancelInstallmentScopeModal"
    />

    <!-- Painel de sumário dos selecionados (sobreposto) -->
    <ExtratoSelectionSummary
      v-if="hasSelection"
      :soma="selectedTransactionsSummary.soma"
      :valor-liquido="selectedTransactionsSummary.valorLiquido"
      :selected-count="selectedCount"
      @close="handleSelectionClose"
      @mark-paid="handleBulkMarkPaid"
      @mark-unpaid="handleBulkMarkUnpaid"
      @delete="handleBulkDelete"
    />

    <!-- Modal de Confirmação de Exclusão (único) -->
    <ConfirmDeleteModal
      :is-open="isDeleteModalOpen"
      :item-name="transactionToDelete?.name || ''"
      :is-deleting="isDeleting"
      title="Excluir Lançamento"
      message="Tem certeza que deseja excluir este lançamento? Esta ação não pode ser desfeita."
      @confirm="confirmDelete"
      @cancel="cancelDelete"
    />

    <!-- Modal de Confirmação de Exclusão em massa -->
    <ConfirmDeleteModal
      :is-open="isBulkDeleteModalOpen"
      :item-name="`${selectedCount} lançamento(s)`"
      :is-deleting="isBulkDeleting"
      title="Excluir Lançamentos"
      :message="`Tem certeza que deseja excluir os ${selectedCount} lançamentos selecionados? Esta ação não pode ser desfeita.`"
      @confirm="confirmBulkDelete"
      @cancel="cancelBulkDelete"
    />

    <!-- Drawer: lançamentos do cartão (sidebar) -->
    <ExtratoCardLancamentosDrawer
      :is-open="selectedCardForDrawer !== null"
      :card="selectedCardForDrawer"
      @close="handleCloseCardDrawer"
      @add="handleAddFromCardDrawer"
      @edit="handleEditTransaction"
      @delete="handleDeleteTransaction"
    />
  </div>
</template>
