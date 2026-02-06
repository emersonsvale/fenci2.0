<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { useContas } from '../composables/useContas'
import { useLancamento, type LancamentoType, type LancamentoFormData } from '../composables/useLancamento'
import PageHeader from '../components/PageHeader.vue'
import RendaCard from '../components/RendaCard.vue'
import ContasCategorySection from '../components/ContasCategorySection.vue'
import ContasListSection from '../components/ContasListSection.vue'
import CategoriesDrawer from '../components/CategoriesDrawer.vue'
import ContasListDrawer from '../components/ContasListDrawer.vue'
import BaseModal from '../components/BaseModal.vue'
import RendaModal from '../components/RendaModal.vue'
import CategoryModal from '../components/CategoryModal.vue'
import LancamentoEntradaModal from '../components/LancamentoEntradaModal.vue'
import LancamentoSaidaModal from '../components/LancamentoSaidaModal.vue'
import LancamentoCartaoModal from '../components/LancamentoCartaoModal.vue'
import type { CategoryDisplay, CreditCardFormData, AccountFormData } from '../composables/useContas'
import type { RendaFormData as RendaModalFormData } from '../components/RendaModal.vue'
import type { CategoryFormData as CategoryModalFormData } from '../components/CategoryModal.vue'

/**
 * Contas - Página de gerenciamento de contas
 * Permite gerenciar rendas, categorias, cartões e contas bancárias
 */

definePageMeta({
  layout: 'dashboard',
})

// Composable de contas
const {
  isLoading,
  userName,
  totalRendas,
  rendasList,
  incomeCategories,
  expenseCategories,
  creditCardsList,
  creditCards,
  accountsList,
  accounts,
  categories,
  createRenda,
  updateRenda,
  deleteRenda,
  createCategory,
  updateCategory,
  deleteCategory,
  createCreditCard,
  updateCreditCard,
  deleteCreditCard,
  createAccount,
  updateAccount,
  deleteAccount,
  fetchContasData,
  fetchCategoryTotals,
} = useContas()

// Composable para lançamentos
const {
  activeLancamentoType,
  isSubmitting,
  error: lancamentoError,
  isLoadingOptions,
  accounts: lancamentoAccounts,
  categories: lancamentoCategories,
  creditCards: lancamentoCreditCards,
  openLancamentoModal,
  closeLancamentoModal,
  createEntrada,
  createSaida,
  createCartao,
  createQuickAccount,
  createQuickCategory,
  loadOptions,
} = useLancamento()

// Período selecionado
const selectedPeriod = ref({
  month: new Date().getMonth(),
  year: new Date().getFullYear(),
})

// Buscar totais por categoria quando o período mudar
watch(
  selectedPeriod,
  (newPeriod) => {
    fetchCategoryTotals(newPeriod.month, newPeriod.year)
  },
  { deep: true }
)

const route = useRoute()

// Buscar totais na inicialização
onMounted(() => {
  fetchCategoryTotals(selectedPeriod.value.month, selectedPeriod.value.year)
  if (route.query.openCreditCard === '1') {
    openCreditCardModal()
    navigateTo({ path: route.path, query: {} })
  }
})

function handleCreateCard() {
  closeLancamentoModal()
  openCreditCardModal()
}

// Cartão sendo editado (id para abrir o modal em modo edição)
const editingCreditCard = ref<{ id: string } | null>(null)

// Estado dos modais
const isRendaModalOpen = ref(false)
const isCategoryModalOpen = ref(false)
const isCreditCardModalOpen = ref(false)
const isAccountModalOpen = ref(false)

// Tipo de categoria a ser criada (income/expense)
const categoryModalType = ref<'income' | 'expense'>('income')

// Drawer de lista completa de categorias (Ver mais)
const isCategoriesDrawerOpen = ref(false)
const categoriesDrawerType = ref<'income' | 'expense'>('income')

function openCategoriesDrawer(type: 'income' | 'expense') {
  categoriesDrawerType.value = type
  isCategoriesDrawerOpen.value = true
}

function handleCategoriesDrawerAdd() {
  isCategoriesDrawerOpen.value = false
  openCategoryModal(categoriesDrawerType.value)
}

function handleCategoriesDrawerItemClick(category: CategoryDisplay) {
  handleCategoryClick(category)
  isCategoriesDrawerOpen.value = false
}

const categoriesDrawerTitle = computed(() =>
  categoriesDrawerType.value === 'income' ? 'Categorias de entradas' : 'Categorias de saídas'
)

const categoriesDrawerList = computed(() =>
  categoriesDrawerType.value === 'income' ? incomeCategories.value : expenseCategories.value
)

// Drawers: cartões de crédito e contas bancárias (Ver mais)
const isCreditCardsDrawerOpen = ref(false)
const isAccountsDrawerOpen = ref(false)

function openCreditCardsDrawer() {
  isCreditCardsDrawerOpen.value = true
}

function openAccountsDrawer() {
  isAccountsDrawerOpen.value = true
}

function handleCreditCardsDrawerItemClick(item: { id: string; name: string; identifier: string }) {
  isCreditCardsDrawerOpen.value = false
  handleCreditCardEdit(item)
}

function handleCreditCardsDrawerEdit(item: { id: string; name: string; identifier: string }) {
  isCreditCardsDrawerOpen.value = false
  handleCreditCardEdit(item)
}

function handleAccountsDrawerItemClick(item: { id: string; name: string; identifier: string; icon?: string | null; color?: string }) {
  isAccountsDrawerOpen.value = false
  handleAccountClick(item)
}

function handleAccountsDrawerEdit(item: { id: string; name: string; identifier: string; icon?: string | null; color?: string }) {
  isAccountsDrawerOpen.value = false
  handleAccountClick(item)
}

function handleCreditCardsDrawerAdd() {
  isCreditCardsDrawerOpen.value = false
  openCreditCardModal()
}

function handleAccountsDrawerAdd() {
  isAccountsDrawerOpen.value = false
  openAccountModal()
}

// Categoria sendo editada
const editingCategory = ref<{
  id: string
  name: string
  icon: string | null
} | null>(null)

// Renda sendo editada
const editingRenda = ref<{
  id: string
  provedor: string
  valor: number
  diaRecebimento: number
  accountId?: string
  categoryId?: string
  hasLimit?: boolean
  endDate?: string | null
} | null>(null)

// Estado de submissão dos modais
const isRendaSubmitting = ref(false)
const isCategorySubmitting = ref(false)

const creditCardForm = ref<CreditCardFormData>({
  name: '',
  lastDigits: '',
  brand: '',
  color: '#6B7280',
  closingDay: 1,
  dueDay: 10,
  creditLimit: 0,
})

const accountForm = ref<AccountFormData>({
  name: '',
  bankName: '',
  type: 'checking',
  initialBalance: 0,
  color: '#6B7280',
})

// Conta sendo editada
const editingAccount = ref<{
  id: string
  name: string
  bankName?: string | null
  type: string
  color?: string | null
  icon?: string | null
} | null>(null)

// Estado de confirmação de exclusão de conta
const isConfirmingAccountDelete = ref(false)

// Display values para máscaras de moeda
const creditLimitDisplay = ref('')
const initialBalanceDisplay = ref('')

// Handlers para máscaras de moeda
function handleCreditLimitInput(event: Event) {
  const input = event.target as HTMLInputElement
  const numbers = input.value.replace(/\D/g, '')
  
  if (numbers === '') {
    creditLimitDisplay.value = ''
    creditCardForm.value.creditLimit = 0
    return
  }

  const numValue = parseInt(numbers, 10) / 100
  creditCardForm.value.creditLimit = numValue
  creditLimitDisplay.value = numValue.toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}

function handleInitialBalanceInput(event: Event) {
  const input = event.target as HTMLInputElement
  const numbers = input.value.replace(/\D/g, '')
  
  if (numbers === '') {
    initialBalanceDisplay.value = ''
    accountForm.value.initialBalance = 0
    return
  }

  const numValue = parseInt(numbers, 10) / 100
  accountForm.value.initialBalance = numValue
  initialBalanceDisplay.value = numValue.toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}

// Formatação de moeda
function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value)
}

// === Handlers de Lançamento ===
function handleOpenLancamento(type: LancamentoType) {
  openLancamentoModal(type)
}

async function handleSubmitEntrada(data: LancamentoFormData, createAnother: boolean) {
  const success = await createEntrada(data)
  if (success) {
    if (!createAnother) {
      closeLancamentoModal()
    }
    fetchContasData()
    fetchCategoryTotals(selectedPeriod.value.month, selectedPeriod.value.year)
  }
}

async function handleSubmitSaida(data: LancamentoFormData, createAnother: boolean) {
  const success = await createSaida(data)
  if (success) {
    if (!createAnother) {
      closeLancamentoModal()
    }
    fetchContasData()
    fetchCategoryTotals(selectedPeriod.value.month, selectedPeriod.value.year)
  }
}

async function handleSubmitCartao(data: LancamentoFormData, createAnother: boolean) {
  const success = await createCartao(data)
  if (success) {
    if (!createAnother) {
      closeLancamentoModal()
    }
    fetchContasData()
    fetchCategoryTotals(selectedPeriod.value.month, selectedPeriod.value.year)
  }
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

// === Handlers de Renda ===
function openRendaModal(renda?: { id: string; provedor: string; valor: number; diaRecebimento: number; hasLimit?: boolean; endDate?: string | null }) {
  if (renda) {
    editingRenda.value = {
      id: renda.id,
      provedor: renda.provedor,
      valor: renda.valor,
      diaRecebimento: renda.diaRecebimento,
      hasLimit: renda.hasLimit,
      endDate: renda.endDate,
    }
  } else {
    editingRenda.value = null
  }
  isRendaModalOpen.value = true
}

async function handleRendaSubmit(data: RendaModalFormData) {
  isRendaSubmitting.value = true

  let success = false
  if (editingRenda.value) {
    success = await updateRenda(editingRenda.value.id, {
      provedor: data.provedor,
      valor: data.valor,
      diaRecebimento: data.diaRecebimento,
      accountId: data.accountId,
      categoryId: data.categoryId,
      hasLimit: data.hasLimit,
      endDate: data.endDate,
    })
  } else {
    success = await createRenda({
      provedor: data.provedor,
      valor: data.valor,
      diaRecebimento: data.diaRecebimento,
      accountId: data.accountId,
      categoryId: data.categoryId,
      hasLimit: data.hasLimit,
      endDate: data.endDate,
    })
  }

  isRendaSubmitting.value = false

  if (success) {
    isRendaModalOpen.value = false
  }
}

async function handleRendaCreateAccount(name: string) {
  await createQuickAccount(name)
  // Recarregar dados para atualizar lista de contas
  fetchContasData()
}

async function handleRendaCreateCategory(name: string) {
  await createQuickCategory(name, 'income')
  // Recarregar dados para atualizar lista de categorias
  fetchContasData()
}

async function handleDeleteRenda(id: string) {
  if (confirm('Tem certeza que deseja excluir esta renda?')) {
    await deleteRenda(id)
  }
}

function handleEditRenda(id: string) {
  const renda = rendasList.value.find((r) => r.id === id)
  if (renda) {
    openRendaModal(renda)
  }
}

// === Handlers de Categoria ===
function openCategoryModal(type: 'income' | 'expense') {
  categoryModalType.value = type
  editingCategory.value = null
  isCategoryModalOpen.value = true
}

async function handleCategorySubmit(data: CategoryModalFormData) {
  isCategorySubmitting.value = true

  try {
    let success = false
    
    if (editingCategory.value) {
      // Atualizar categoria existente
      success = await updateCategory(editingCategory.value.id, {
        name: data.name,
        icon: data.icon,
      })
    } else {
      // Criar nova categoria
      success = await createCategory({
        name: data.name,
        icon: data.icon,
        color: data.type === 'income' ? '#22C55E' : '#EF4444',
        type: data.type,
      })
    }

    if (success) {
      isCategoryModalOpen.value = false
      editingCategory.value = null
    }
  } catch (err) {
    console.error('Error in handleCategorySubmit:', err)
  } finally {
    isCategorySubmitting.value = false
  }
}

function handleCategoryClick(category: CategoryDisplay) {
  categoryModalType.value = category.type
  editingCategory.value = {
    id: category.id,
    name: category.name,
    icon: category.icon,
  }
  isCategoryModalOpen.value = true
}

async function handleCategoryDelete(id: string) {
  isCategorySubmitting.value = true

  try {
    const success = await deleteCategory(id)

    if (success) {
      isCategoryModalOpen.value = false
      editingCategory.value = null
    }
  } catch (err) {
    console.error('Error in handleCategoryDelete:', err)
  } finally {
    isCategorySubmitting.value = false
  }
}

// === Handlers de Cartão de Crédito ===
function openCreditCardModal(card?: { id: string }) {
  if (card) {
    const full = creditCards.value.find((c) => c.id === card.id)
    if (full) {
      editingCreditCard.value = { id: full.id }
      creditCardForm.value = {
        name: full.name,
        lastDigits: full.last_digits || '',
        brand: full.brand || '',
        color: full.color || '#6B7280',
        closingDay: full.closing_day,
        dueDay: full.due_day,
        creditLimit: full.credit_limit ?? 0,
        accountId: full.account_id || undefined,
      }
      creditLimitDisplay.value =
        (full.credit_limit ?? 0).toLocaleString('pt-BR', {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })
    } else {
      editingCreditCard.value = null
      creditCardForm.value = {
        name: '',
        lastDigits: '',
        brand: '',
        color: '#6B7280',
        closingDay: 1,
        dueDay: 10,
        creditLimit: 0,
      }
      creditLimitDisplay.value = ''
    }
  } else {
    editingCreditCard.value = null
    creditCardForm.value = {
      name: '',
      lastDigits: '',
      brand: '',
      color: '#6B7280',
      closingDay: 1,
      dueDay: 10,
      creditLimit: 0,
    }
    creditLimitDisplay.value = ''
  }
  isCreditCardModalOpen.value = true
}

function handleCreditCardEdit(item: { id: string; name: string; identifier: string }) {
  openCreditCardModal({ id: item.id })
}

async function handleSaveCreditCard() {
  if (!creditCardForm.value.name || !creditCardForm.value.lastDigits) return

  const success = editingCreditCard.value
    ? await updateCreditCard(editingCreditCard.value.id, creditCardForm.value)
    : await createCreditCard(creditCardForm.value)

  if (success) {
    isCreditCardModalOpen.value = false
    editingCreditCard.value = null
    await loadOptions()
  }
}

// === Handlers de Conta Bancária ===
function openAccountModal(account?: { id: string; name: string; bankName?: string | null; type: string; color?: string | null; icon?: string | null }) {
  if (account) {
    // Edição
    editingAccount.value = account
    accountForm.value = {
      name: account.name,
      bankName: account.bankName || '',
      type: account.type,
      initialBalance: 0, // Não permite editar saldo inicial
      color: account.color || '#6B7280',
      icon: account.icon || undefined,
    }
    initialBalanceDisplay.value = ''
  } else {
    // Nova conta
    editingAccount.value = null
    accountForm.value = {
      name: '',
      bankName: '',
      type: 'checking',
      initialBalance: 0,
      color: '#6B7280',
    }
    initialBalanceDisplay.value = ''
  }
  isConfirmingAccountDelete.value = false
  isAccountModalOpen.value = true
}

function handleAccountClick(item: { id: string; name: string; identifier: string; icon?: string | null; color?: string }) {
  // Encontrar a conta completa no accountsList
  const account = accountsList.value.find((a) => a.id === item.id)
  if (account) {
    openAccountModal({
      id: account.id,
      name: account.name,
      bankName: account.bankName,
      type: account.type,
      color: account.color,
      icon: account.icon,
    })
  }
}

async function handleSaveAccount() {
  if (!accountForm.value.name) return

  let success = false
  if (editingAccount.value) {
    // Atualização
    success = await updateAccount(editingAccount.value.id, {
      name: accountForm.value.name,
      bankName: accountForm.value.bankName,
      type: accountForm.value.type,
      color: accountForm.value.color,
      icon: accountForm.value.icon,
    })
  } else {
    // Criação
    success = await createAccount(accountForm.value)
  }

  if (success) {
    isAccountModalOpen.value = false
    editingAccount.value = null
  }
}

async function handleDeleteAccount() {
  if (!editingAccount.value) return

  if (!isConfirmingAccountDelete.value) {
    isConfirmingAccountDelete.value = true
    return
  }

  const success = await deleteAccount(editingAccount.value.id)
  if (success) {
    isAccountModalOpen.value = false
    editingAccount.value = null
    isConfirmingAccountDelete.value = false
  }
}

function cancelAccountDelete() {
  isConfirmingAccountDelete.value = false
}

// Prepara dados para o componente de lista
const creditCardsListItems = computed(() => {
  return creditCardsList.value.map((card) => ({
    id: card.id,
    name: card.name,
    identifier: card.lastDigits,
    color: card.color,
  }))
})

const accountsListItems = computed(() => {
  return accountsList.value.map((account) => ({
    id: account.id,
    name: account.name,
    identifier: account.bankName || account.type,
    icon: account.icon,
    color: account.color,
  }))
})
</script>

<template>
  <div id="contas-page" class="flex flex-col h-full gap-5">
    <!-- Header + conteúdo (max 1500px, centralizado) -->
    <div class="w-full max-w-[1500px] mx-auto flex flex-col flex-1 min-w-0 gap-5">
    <PageHeader
      :user-name="userName"
      :period="selectedPeriod"
      @update:period="selectedPeriod = $event"
      @open-lancamento="handleOpenLancamento"
    />

    <!-- Main Content: 3 colunas — Rendas (altura total) | Categorias + Cartões | Categorias + Contas -->
    <div class="flex flex-col flex-1 min-w-0 overflow-y-auto">
      <div class="grid grid-cols-3 gap-5 flex-1 min-h-0 grid-rows-[1fr]">
        <!-- Coluna 1: Rendas (altura total da página) -->
        <div class="bg-surface-elevated rounded-xl p-5 shadow-xs h-full min-h-0 flex flex-col">
          <div class="flex items-center justify-between mb-4 shrink-0">
            <div>
              <h3 class="text-body-md font-semibold text-content-main">Rendas</h3>
              <p class="text-heading-md font-bold text-success mt-1">
                {{ formatCurrency(totalRendas) }}
              </p>
            </div>
          </div>

          <div class="flex-1 min-h-0 overflow-y-auto space-y-3">
            <div v-if="isLoading" class="space-y-3">
              <div v-for="i in 2" :key="i" class="skeleton h-24 rounded-xl" />
            </div>

            <div v-else class="space-y-3">
              <RendaCard
                v-for="renda in rendasList"
                :key="renda.id"
                :id="renda.id"
                :provedor="renda.provedor"
                :valor="renda.valor"
                :dia-recebimento="renda.diaRecebimento"
                @edit="handleEditRenda"
                @delete="handleDeleteRenda"
              />

              <div
                v-if="rendasList.length === 0"
                class="py-8 text-center text-content-subtle"
              >
                <span class="material-symbols-outlined text-3xl mb-2 block">payments</span>
                <p class="text-body-sm">Nenhuma renda cadastrada</p>
              </div>
            </div>
          </div>

          <button
            type="button"
            class="w-full mt-4 py-3 rounded-xl bg-primary text-white font-medium text-body-sm hover:bg-primary-600 transition-colors flex items-center justify-center gap-2 shrink-0"
            @click="openRendaModal()"
          >
            <span class="material-symbols-outlined text-lg">add</span>
            Nova renda
          </button>
        </div>

        <!-- Coluna 2: Categorias de entradas + Cartões de crédito (mesmo tamanho) -->
        <div class="grid grid-rows-[1fr_1fr] gap-5 h-full min-h-0">
          <div class="min-h-0 flex flex-col">
            <ContasCategorySection
              title="Categorias de entradas"
              :categories="incomeCategories"
              :loading="isLoading"
              @add="openCategoryModal('income')"
              @view-all="openCategoriesDrawer('income')"
              @item-click="handleCategoryClick"
            />
          </div>
          <div class="min-h-0 flex flex-col">
            <ContasListSection
              title="Cartões de crédito"
              :items="creditCardsListItems"
              :loading="isLoading"
              variant="card"
              @add="openCreditCardModal"
              @view-all="openCreditCardsDrawer"
              @item-click="() => {}"
              @edit="handleCreditCardEdit"
            />
          </div>
        </div>

        <!-- Coluna 3: Categorias de saídas + Contas bancárias (mesmo tamanho) -->
        <div class="grid grid-rows-[1fr_1fr] gap-5 h-full min-h-0">
          <div class="min-h-0 flex flex-col">
            <ContasCategorySection
              title="Categorias de saídas"
              :categories="expenseCategories"
              :loading="isLoading"
              @add="openCategoryModal('expense')"
              @view-all="openCategoriesDrawer('expense')"
              @item-click="handleCategoryClick"
            />
          </div>
          <div class="min-h-0 flex flex-col">
            <ContasListSection
              title="Contas bancárias"
              :items="accountsListItems"
              :loading="isLoading"
              variant="bank"
              @add="openAccountModal()"
              @view-all="openAccountsDrawer"
              @item-click="handleAccountClick"
              @edit="handleAccountClick"
            />
          </div>
        </div>
      </div>
    </div>

    <!-- Modal de Renda -->
    <RendaModal
      :is-open="isRendaModalOpen"
      :accounts="accounts"
      :categories="categories"
      :editing-renda="editingRenda"
      :is-loading="isRendaSubmitting"
      @close="isRendaModalOpen = false"
      @submit="handleRendaSubmit"
      @create-account="handleRendaCreateAccount"
      @create-category="handleRendaCreateCategory"
    />

    <!-- Drawer: lista completa de categorias (Ver mais) -->
    <CategoriesDrawer
      :is-open="isCategoriesDrawerOpen"
      :title="categoriesDrawerTitle"
      :categories="categoriesDrawerList"
      :loading="isLoading"
      @close="isCategoriesDrawerOpen = false"
      @add="handleCategoriesDrawerAdd"
      @item-click="handleCategoriesDrawerItemClick"
    />

    <!-- Drawer: lista completa de cartões de crédito -->
    <ContasListDrawer
      :is-open="isCreditCardsDrawerOpen"
      title="Cartões de crédito"
      :items="creditCardsListItems"
      :loading="isLoading"
      variant="card"
      @close="isCreditCardsDrawerOpen = false"
      @add="handleCreditCardsDrawerAdd"
      @item-click="handleCreditCardsDrawerItemClick"
      @edit="handleCreditCardsDrawerEdit"
    />

    <!-- Drawer: lista completa de contas bancárias -->
    <ContasListDrawer
      :is-open="isAccountsDrawerOpen"
      title="Contas bancárias"
      :items="accountsListItems"
      :loading="isLoading"
      variant="bank"
      @close="isAccountsDrawerOpen = false"
      @add="handleAccountsDrawerAdd"
      @item-click="handleAccountsDrawerItemClick"
      @edit="handleAccountsDrawerEdit"
    />

    <!-- Modal de Categoria -->
    <CategoryModal
      :is-open="isCategoryModalOpen"
      :type="categoryModalType"
      :editing-category="editingCategory"
      :is-loading="isCategorySubmitting"
      @close="isCategoryModalOpen = false; editingCategory = null"
      @submit="handleCategorySubmit"
      @delete="handleCategoryDelete"
    />

    <!-- Modal de Cartão de Crédito -->
    <BaseModal
      :is-open="isCreditCardModalOpen"
      :title="editingCreditCard ? 'Editar Cartão de Crédito' : 'Novo Cartão de Crédito'"
      :subtitle="editingCreditCard ? 'Altere as informações do cartão' : 'Adicione um cartão para controlar seus gastos'"
      @close="isCreditCardModalOpen = false; editingCreditCard = null"
    >
      <div class="space-y-4">
        <!-- Nome -->
        <div>
          <label class="label-dark">Nome do cartão</label>
          <input
            v-model="creditCardForm.name"
            type="text"
            placeholder="Ex: Nubank, Itaú"
            class="w-full px-5 py-3 bg-surface-elevated border border-default rounded-full text-content-main placeholder:text-content-subtle focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
          />
        </div>

        <!-- Últimos 4 dígitos -->
        <div>
          <label class="label-dark">Últimos 4 dígitos</label>
          <input
            v-model="creditCardForm.lastDigits"
            type="text"
            maxlength="4"
            placeholder="0000"
            class="w-full px-5 py-3 bg-surface-elevated border border-default rounded-full text-content-main placeholder:text-content-subtle focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
          />
        </div>

        <!-- Bandeira -->
        <div>
          <label class="label-dark">Bandeira</label>
          <select
            v-model="creditCardForm.brand"
            class="w-full px-5 py-3 bg-surface-elevated border border-default rounded-full text-content-main focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent appearance-none cursor-pointer"
          >
            <option value="">Selecione</option>
            <option value="visa">Visa</option>
            <option value="mastercard">Mastercard</option>
            <option value="elo">Elo</option>
            <option value="amex">American Express</option>
            <option value="hipercard">Hipercard</option>
            <option value="other">Outra</option>
          </select>
        </div>

        <!-- Dias de fechamento e vencimento -->
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="label-dark">Dia de fechamento</label>
            <select
              v-model.number="creditCardForm.closingDay"
              class="w-full px-5 py-3 bg-surface-elevated border border-default rounded-full text-content-main focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent appearance-none cursor-pointer"
            >
              <option v-for="dia in 28" :key="dia" :value="dia">{{ dia }}</option>
            </select>
          </div>
          <div>
            <label class="label-dark">Dia de vencimento</label>
            <select
              v-model.number="creditCardForm.dueDay"
              class="w-full px-5 py-3 bg-surface-elevated border border-default rounded-full text-content-main focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent appearance-none cursor-pointer"
            >
              <option v-for="dia in 28" :key="dia" :value="dia">{{ dia }}</option>
            </select>
          </div>
        </div>

        <!-- Limite -->
        <div>
          <label class="label-dark">Limite de crédito</label>
          <div class="relative">
            <span class="absolute left-5 top-1/2 -translate-y-1/2 text-content-subtle text-sm">R$</span>
            <input
              :value="creditLimitDisplay"
              type="text"
              inputmode="numeric"
              placeholder="0,00"
              class="w-full pl-12 pr-5 py-3 bg-surface-elevated border border-default rounded-full text-content-main placeholder:text-content-subtle focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              @input="handleCreditLimitInput"
            />
          </div>
        </div>

        <!-- Cor -->
        <div>
          <label class="label-dark">Cor do cartão</label>
          <div class="flex items-center gap-3">
            <input
              v-model="creditCardForm.color"
              type="color"
              class="w-12 h-12 rounded-full border border-default cursor-pointer"
            />
            <input
              v-model="creditCardForm.color"
              type="text"
              class="flex-1 px-5 py-3 bg-surface-elevated border border-default rounded-full text-content-main placeholder:text-content-subtle focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>
        </div>
      </div>

      <template #footer>
        <div class="flex justify-end gap-3">
          <button
            type="button"
            class="px-6 py-3 rounded-full text-body-sm text-content-muted hover:bg-surface-overlay transition-colors"
            @click="isCreditCardModalOpen = false; editingCreditCard = null"
          >
            Cancelar
          </button>
          <button
            type="button"
            class="px-8 py-3 rounded-full bg-primary text-white text-body-sm font-semibold hover:brightness-110 hover:shadow-primary transition-all"
            @click="handleSaveCreditCard"
          >
            {{ editingCreditCard ? 'Salvar' : 'Criar' }}
          </button>
        </div>
      </template>
    </BaseModal>

    <!-- Modal de Conta Bancária -->
    <BaseModal
      :is-open="isAccountModalOpen"
      :title="editingAccount ? 'Editar Conta Bancária' : 'Nova Conta Bancária'"
      :subtitle="editingAccount ? 'Altere as informações da conta' : 'Adicione uma conta para gerenciar seu dinheiro'"
      @close="isAccountModalOpen = false; editingAccount = null; isConfirmingAccountDelete = false"
    >
      <div class="space-y-4">
        <!-- Nome -->
        <div>
          <label class="label-dark">Nome da conta</label>
          <input
            v-model="accountForm.name"
            type="text"
            placeholder="Ex: Conta Corrente Nubank"
            class="w-full px-5 py-3 bg-surface-elevated border border-default rounded-full text-content-main placeholder:text-content-subtle focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
          />
        </div>

        <!-- Banco -->
        <div>
          <label class="label-dark">Nome do banco</label>
          <input
            v-model="accountForm.bankName"
            type="text"
            placeholder="Ex: Nubank, Itaú"
            class="w-full px-5 py-3 bg-surface-elevated border border-default rounded-full text-content-main placeholder:text-content-subtle focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
          />
        </div>

        <!-- Tipo -->
        <div>
          <label class="label-dark">Tipo de conta</label>
          <select
            v-model="accountForm.type"
            class="w-full px-5 py-3 bg-surface-elevated border border-default rounded-full text-content-main focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent appearance-none cursor-pointer"
          >
            <option value="checking">Conta Corrente</option>
            <option value="savings">Poupança</option>
            <option value="wallet">Carteira</option>
            <option value="investment">Investimento</option>
            <option value="other">Outra</option>
          </select>
        </div>

        <!-- Saldo Inicial (apenas na criação) -->
        <div v-if="!editingAccount">
          <label class="label-dark">Saldo inicial</label>
          <div class="relative">
            <span class="absolute left-5 top-1/2 -translate-y-1/2 text-content-subtle text-sm">R$</span>
            <input
              :value="initialBalanceDisplay"
              type="text"
              inputmode="numeric"
              placeholder="0,00"
              class="w-full pl-12 pr-5 py-3 bg-surface-elevated border border-default rounded-full text-content-main placeholder:text-content-subtle focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              @input="handleInitialBalanceInput"
            />
          </div>
          <p class="mt-1.5 text-xs text-content-subtle">
            O saldo inicial será lançado como uma entrada no extrato
          </p>
        </div>

        <!-- Cor -->
        <div>
          <label class="label-dark">Cor</label>
          <div class="flex items-center gap-3">
            <input
              v-model="accountForm.color"
              type="color"
              class="w-12 h-12 rounded-full border border-default cursor-pointer"
            />
            <input
              v-model="accountForm.color"
              type="text"
              class="flex-1 px-5 py-3 bg-surface-elevated border border-default rounded-full text-content-main placeholder:text-content-subtle focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>
        </div>
      </div>

      <template #footer>
        <!-- Confirmação de exclusão -->
        <div v-if="isConfirmingAccountDelete" class="flex items-center justify-between w-full">
          <p class="text-body-sm text-error">Tem certeza que deseja excluir?</p>
          <div class="flex gap-2">
            <button
              type="button"
              class="px-4 py-2 rounded-full text-body-sm text-content-muted hover:bg-surface-overlay transition-colors"
              @click="cancelAccountDelete"
            >
              Não
            </button>
            <button
              type="button"
              class="px-4 py-2 rounded-full bg-error text-white text-body-sm font-semibold hover:brightness-110 transition-all"
              @click="handleDeleteAccount"
            >
              Sim, excluir
            </button>
          </div>
        </div>

        <!-- Botões normais -->
        <div v-else class="flex justify-between w-full">
          <!-- Botão de excluir (apenas na edição) -->
          <div>
            <button
              v-if="editingAccount"
              type="button"
              class="px-4 py-3 rounded-full text-body-sm text-error hover:bg-error/10 transition-colors"
              @click="handleDeleteAccount"
            >
              Excluir conta
            </button>
          </div>

          <div class="flex gap-3">
            <button
              type="button"
              class="px-6 py-3 rounded-full text-body-sm text-content-muted hover:bg-surface-overlay transition-colors"
              @click="isAccountModalOpen = false; editingAccount = null"
            >
              Cancelar
            </button>
            <button
              type="button"
              class="px-8 py-3 rounded-full bg-primary text-white text-body-sm font-semibold hover:brightness-110 hover:shadow-primary transition-all"
              @click="handleSaveAccount"
            >
              {{ editingAccount ? 'Salvar' : 'Criar' }}
            </button>
          </div>
        </div>
      </template>
    </BaseModal>
    </div>

    <!-- Modais de Lançamento -->
    <LancamentoEntradaModal
      :is-open="activeLancamentoType === 'entrada'"
      :accounts="lancamentoAccounts"
      :categories="lancamentoCategories"
      :is-loading="isLoadingOptions"
      :is-submitting="isSubmitting"
      :error="lancamentoError"
      @close="closeLancamentoModal"
      @submit="handleSubmitEntrada"
      @create-account="handleCreateAccount"
      @create-category="handleCreateIncomeCategory"
    />

    <LancamentoSaidaModal
      :is-open="activeLancamentoType === 'saida'"
      :accounts="lancamentoAccounts"
      :categories="lancamentoCategories"
      :is-loading="isLoadingOptions"
      :is-submitting="isSubmitting"
      :error="lancamentoError"
      @close="closeLancamentoModal"
      @submit="handleSubmitSaida"
      @create-account="handleCreateAccount"
      @create-category="handleCreateExpenseCategory"
    />

    <LancamentoCartaoModal
      :is-open="activeLancamentoType === 'cartao'"
      :credit-cards="lancamentoCreditCards"
      :categories="lancamentoCategories"
      :is-loading="isLoadingOptions"
      :is-submitting="isSubmitting"
      :error="lancamentoError"
      @close="closeLancamentoModal"
      @submit="handleSubmitCartao"
      @create-category="handleCreateExpenseCategory"
      @create-card="handleCreateCard"
    />
  </div>
</template>
