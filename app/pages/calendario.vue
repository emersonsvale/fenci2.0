<script setup lang="ts">
import { ref, computed } from 'vue'
import { useCalendario } from '../composables/useCalendario'
import { useLancamento, type LancamentoType, type LancamentoFormData } from '../composables/useLancamento'
import { usePullToRefresh } from '../composables/usePullToRefresh'
import { useSidebar } from '../composables/useSidebar'
import PageHeader from '../components/PageHeader.vue'
import PullToRefreshIndicator from '../components/PullToRefreshIndicator.vue'
import LancamentoDropdown from '../components/LancamentoDropdown.vue'
import CalendarioGrid from '../components/CalendarioGrid.vue'
import CalendarioSidebar from '../components/CalendarioSidebar.vue'
import LancamentoEntradaModal from '../components/LancamentoEntradaModal.vue'
import LancamentoSaidaModal from '../components/LancamentoSaidaModal.vue'
import LancamentoCartaoModal from '../components/LancamentoCartaoModal.vue'

/**
 * Calendario - Página de calendário financeiro
 * Exibe transações organizadas por dia em formato de calendário
 */

definePageMeta({
  layout: 'dashboard',
})

// Composable do calendário
const {
  isLoading,
  currentMonth,
  currentYear,
  selectedDate,
  userName,
  greeting,
  dailyQuote,
  monthName,
  calendarDays,
  selectedDayData,
  selectDate,
  previousMonth,
  nextMonth,
  fetchTransactions,
} = useCalendario()

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
} = useLancamento()

function handleCreateCard() {
  closeLancamentoModal()
  navigateTo('/contas?openCreditCard=1')
}

// Handlers
function handleOpenLancamento(type: LancamentoType) {
  openLancamentoModal(type)
}

async function handleSubmitEntrada(data: LancamentoFormData, createAnother: boolean) {
  const success = await createEntrada(data)
  if (success) {
    if (!createAnother) {
      closeLancamentoModal()
    }
    // Atualizar dados do calendário
    fetchTransactions()
  }
}

async function handleSubmitSaida(data: LancamentoFormData, createAnother: boolean) {
  const success = await createSaida(data)
  if (success) {
    if (!createAnother) {
      closeLancamentoModal()
    }
    // Atualizar dados do calendário
    fetchTransactions()
  }
}

async function handleSubmitCartao(data: LancamentoFormData, createAnother: boolean) {
  const success = await createCartao(data)
  if (success) {
    if (!createAnother) {
      closeLancamentoModal()
    }
    // Atualizar dados do calendário
    fetchTransactions()
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

const isLancamentoDropdownOpen = ref(false)
function toggleLancamentoDropdown() {
  isLancamentoDropdownOpen.value = !isLancamentoDropdownOpen.value
}
function closeLancamentoDropdown() {
  isLancamentoDropdownOpen.value = false
}
function handleSelectLancamentoFromDropdown(type: LancamentoType) {
  isLancamentoDropdownOpen.value = false
  handleOpenLancamento(type)
}

// Pull-to-refresh (mobile)
const { isMobile: ptrMobile } = useSidebar()
const ptrEnabled = computed(() => ptrMobile.value)
const { pullDistance, isPulling, isRefreshing: ptrRefreshing } = usePullToRefresh({
  enabled: ptrEnabled,
  onRefresh: async () => {
    await fetchTransactions()
  },
})
</script>

<template>
  <div id="calendario-page" class="flex flex-col">
    <!-- Pull-to-Refresh Indicator -->
    <PullToRefreshIndicator
      :pull-distance="pullDistance"
      :is-pulling="isPulling"
      :is-refreshing="ptrRefreshing"
    />

    <!-- Header em largura total -->
    <PageHeader
      :user-name="userName"
      :quote="dailyQuote"
    >
      <template #actions>
        <div class="flex items-center gap-2 lg:gap-3 flex-wrap sm:flex-nowrap">
          <div class="flex items-center gap-2 lg:gap-3">
            <button
              type="button"
              class="w-8 h-8 rounded-full border border-default-subtle flex items-center justify-center hover:bg-surface-overlay transition-colors"
              @click="previousMonth"
            >
              <span class="material-symbols-outlined text-lg text-content-subtle">chevron_left</span>
            </button>
            <span class="text-body-sm lg:text-body-md font-medium text-content-main capitalize min-w-[100px] lg:min-w-[120px] text-center">
              {{ monthName }} {{ currentYear }}
            </span>
            <button
              type="button"
              class="w-8 h-8 rounded-full border border-default-subtle flex items-center justify-center hover:bg-surface-overlay transition-colors"
              @click="nextMonth"
            >
              <span class="material-symbols-outlined text-lg text-content-subtle">chevron_right</span>
            </button>
          </div>
          <div class="relative">
            <button
              type="button"
              class="inline-flex items-center gap-1.5 lg:gap-2 px-3 lg:px-4 py-2 rounded-lg bg-primary text-white font-medium text-body-sm hover:bg-primary-600 transition-colors"
              @click.stop="toggleLancamentoDropdown"
            >
              <span class="hidden sm:inline">Lançamento</span>
              <span class="material-symbols-outlined text-lg">add</span>
            </button>
            <LancamentoDropdown
              :is-open="isLancamentoDropdownOpen"
              @close="closeLancamentoDropdown"
              @select="handleSelectLancamentoFromDropdown"
            />
          </div>
        </div>
      </template>
    </PageHeader>

    <!-- Conteúdo: coluna principal + sidebar (max 1500px, centralizado) -->
    <div class="flex flex-col lg:flex-row gap-5 flex-1 min-w-0 w-full max-w-[1500px] mx-auto">
      <div class="flex-1 min-w-0 overflow-x-auto">
        <!-- Calendar Grid -->
        <CalendarioGrid
          :days="calendarDays"
          :loading="isLoading"
          @select-date="selectDate"
        />
      </div>

      <!-- Sidebar -->
      <CalendarioSidebar
        class="w-full lg:w-auto"
        :selected-date="selectedDate"
        :day-summary="selectedDayData"
        :loading="isLoading"
      />
    </div>

    <!-- Modais de Lançamento -->
    <LancamentoEntradaModal
      :is-open="activeLancamentoType === 'entrada'"
      :accounts="accounts"
      :categories="categories"
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
      :accounts="accounts"
      :categories="categories"
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
      :credit-cards="creditCards"
      :categories="categories"
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
