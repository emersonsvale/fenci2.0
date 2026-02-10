<script setup lang="ts">
import { ref, computed } from 'vue'
import { useCalendario } from '../composables/useCalendario'
import { useLancamento, type LancamentoType, type LancamentoFormData } from '../composables/useLancamento'
import { usePullToRefresh } from '../composables/usePullToRefresh'
import { useSidebar } from '../composables/useSidebar'
import PageHeader from '../components/PageHeader.vue'
import PullToRefreshIndicator from '../components/PullToRefreshIndicator.vue'
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
  calendarDays,
  selectedDayData,
  selectDate,
  fetchTransactions,
} = useCalendario()

// Período para o header (mesmo padrão da tela de contas)
const selectedPeriod = computed({
  get: () => ({ month: currentMonth.value, year: currentYear.value }),
  set: (p: { month: number; year: number }) => {
    currentMonth.value = p.month
    currentYear.value = p.year
  },
})

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

    <!-- Header + conteúdo (mesmo padrão da tela de contas) -->
    <div class="w-full max-w-[1500px] mx-auto flex flex-col flex-1 min-w-0 gap-5">
      <PageHeader
        :user-name="userName"
        :period="selectedPeriod"
        @update:period="selectedPeriod = $event"
        @open-lancamento="handleOpenLancamento"
      />

      <!-- Conteúdo: coluna principal + sidebar -->
      <div class="flex flex-col lg:flex-row gap-5 flex-1 min-w-0">
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
