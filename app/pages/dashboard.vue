<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useSupabaseUser } from '#imports'
import { useDashboard } from '../composables/useDashboard'
import { useLancamento, type LancamentoType, type LancamentoFormData } from '../composables/useLancamento'
import { useProfile } from '../composables/useProfile'
import { useLimitAlerts } from '../composables/useLimitAlerts'
import { usePullToRefresh } from '../composables/usePullToRefresh'
import { useSidebar } from '../composables/useSidebar'
import PageHeader from '../components/PageHeader.vue'
import PullToRefreshIndicator from '../components/PullToRefreshIndicator.vue'
import SummaryCard from '../components/SummaryCard.vue'
import AreaChart from '../components/AreaChart.vue'
import CategoryList from '../components/CategoryList.vue'
import VencimentoCard from '../components/VencimentoCard.vue'
import LimitCard from '../components/LimitCard.vue'
import BalanceCard from '../components/BalanceCard.vue'
import ContasPagasCard from '../components/ContasPagasCard.vue'
import CreditCardWidget from '../components/CreditCardWidget.vue'
import LancamentoEntradaModal from '../components/LancamentoEntradaModal.vue'
import LancamentoSaidaModal from '../components/LancamentoSaidaModal.vue'
import LancamentoCartaoModal from '../components/LancamentoCartaoModal.vue'
import LimitModal from '../components/LimitModal.vue'
import DashboardSkeleton from '../components/DashboardSkeleton.vue'

/**
 * Dashboard - Página principal do sistema
 * Exibe visão geral das finanças do usuário
 */

definePageMeta({
  layout: 'dashboard',
})

const user = useSupabaseUser()
const { notificationPreferences, loadNotificationPreferences } = useProfile()

// Composable com todos os dados do dashboard
const {
  isLoading,
  selectedPeriod,
  userName,
  monthName,
  summaryData,
  balanceData,
  chartSeries,
  categorySummary,
  contasPagas,
  vencimentos,
  limiteData,
  creditCardsList,
  markTransactionAsPaid,
  fetchDashboardData,
  saveMonthlyLimit,
} = useDashboard()

// Alertas de limite (10%, 30%, 50%, 75%, 90%, 100%) — respeita preferência "Alertas de orçamento"
const limitPeriodRef = computed(() => ({
  year: selectedPeriod.value.year,
  month: selectedPeriod.value.month + 1,
}))
const notifyBudgetAlertsRef = computed(() => notificationPreferences.value?.notify_budget_alerts ?? true)
const userIdRef = computed(() => user.value?.id ?? null)
useLimitAlerts({
  limiteDataRef: limiteData,
  periodRef: limitPeriodRef,
  notifyEnabledRef: notifyBudgetAlertsRef,
  userIdRef,
})

// Modal de limite mensal
const limitModalOpen = ref(false)
const isSavingLimit = ref(false)
const limitError = ref<string | null>(null)

// Garantir carregamento dos dados do usuário logado ao montar a página (sessão já disponível no client)
onMounted(async () => {
  fetchDashboardData()
  if (!notificationPreferences.value) {
    await loadNotificationPreferences()
  }
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
  loadOptions,
} = useLancamento()

function handleCreateCard() {
  closeLancamentoModal()
  navigateTo('/contas?openCreditCard=1')
}

function handleCreditCardClick(card: { id: string }) {
  navigateTo(`/extratos?openCard=${card.id}`)
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
    // Atualizar dados do dashboard
    fetchDashboardData()
  }
}

async function handleSubmitSaida(data: LancamentoFormData, createAnother: boolean) {
  const success = await createSaida(data)
  if (success) {
    if (!createAnother) {
      closeLancamentoModal()
    }
    // Atualizar dados do dashboard
    fetchDashboardData()
  }
}

async function handleSubmitCartao(data: LancamentoFormData, createAnother: boolean) {
  const success = await createCartao(data)
  if (success) {
    if (!createAnother) {
      closeLancamentoModal()
    }
    // Atualizar dados do dashboard
    fetchDashboardData()
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

async function handlePayVencimento(vencimento: { id: string }) {
  try {
    await markTransactionAsPaid(vencimento.id)
  } catch (err) {
    console.error('Erro ao pagar vencimento:', err)
  }
}

function handleEditLimit() {
  limitError.value = null
  limitModalOpen.value = true
}

async function handleSaveLimit(amount: number) {
  isSavingLimit.value = true
  limitError.value = null
  const success = await saveMonthlyLimit(amount)
  isSavingLimit.value = false
  if (success) {
    limitModalOpen.value = false
  } else {
    limitError.value = 'Não foi possível salvar o limite. Tente novamente.'
  }
}

function handleCloseLimitModal() {
  limitModalOpen.value = false
  limitError.value = null
}

// Pull-to-refresh (mobile)
const { isMobile } = useSidebar()
const ptrEnabled = computed(() => isMobile.value)
const { pullDistance, isPulling, isRefreshing } = usePullToRefresh({
  enabled: ptrEnabled,
  onRefresh: async () => {
    await fetchDashboardData()
  },
})
</script>

<template>
  <div id="dashboard-page" class="flex flex-col w-full">
    <!-- Pull-to-Refresh Indicator -->
    <PullToRefreshIndicator
      :pull-distance="pullDistance"
      :is-pulling="isPulling"
      :is-refreshing="isRefreshing"
    />

    <!-- Full-page Skeleton (first load only) -->
    <DashboardSkeleton v-if="isLoading && !chartSeries.length" />

    <!-- Real Content (hidden during first load skeleton) -->
    <template v-else>
    <!-- Header -->
    <PageHeader
      :user-name="userName"
      :period="selectedPeriod"
      @update:period="selectedPeriod = $event"
      @open-lancamento="handleOpenLancamento"
    />

    <!-- Conteúdo -->
    <div class="flex flex-col lg:flex-row gap-6 flex-1 min-w-0 w-full">
      <div class="flex-1 min-w-0 space-y-6 animate-fade-in">
        <!-- Resumo do mês (igual ao extrato) -->
        <section aria-label="Resumo do mês">
          <div class="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4 mb-5">
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
        </section>

        <!-- Gráfico Entrada e Saída -->
        <section class="card p-6" aria-label="Entrada e saída">
          <h3 class="text-heading-sm font-semibold text-content-main mb-4">
            Entrada e Saída
          </h3>
          <AreaChart
            :series="chartSeries"
            :height="180"
            :loading="isLoading"
          />
        </section>

        <!-- Categorias + Contas pagas -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <CategoryList
            :categories="categorySummary"
            :loading="isLoading"
          />

          <ContasPagasCard
            :contas-pagas="contasPagas"
            :month-name="monthName"
            :loading="isLoading"
          />
        </div>

        <!-- Vencimentos -->
        <div class="grid grid-cols-1 gap-6">
          <VencimentoCard
            class="w-full"
            :vencimentos="vencimentos"
            :loading="isLoading"
            @view-all="navigateTo('/extratos')"
          />
        </div>
      </div>

      <!-- Sidebar direita -->
      <aside class="w-full lg:w-[320px] lg:flex-shrink-0 space-y-4 animate-fade-in">
      <!-- Limite Card -->
      <LimitCard
        :limite="limiteData.limite"
        :gasto="limiteData.gasto"
        :loading="isLoading"
        @edit="handleEditLimit"
      />

      <!-- Balance Card -->
      <BalanceCard
        :saldo="balanceData.saldo"
        :entradas="balanceData.entradas"
        :saidas="balanceData.saidas"
        :loading="isLoading"
      />

      <!-- Credit Cards -->
      <CreditCardWidget
        :cards="creditCardsList"
        :loading="isLoading"
        @card-click="handleCreditCardClick"
        @add-card="handleCreateCard"
      />
    </aside>
    </div>
    </template>

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

    <!-- Modal Limite mensal -->
    <LimitModal
      :is-open="limitModalOpen"
      :current-limit="limiteData.limite"
      :month-label="monthName"
      :is-loading="false"
      :is-submitting="isSavingLimit"
      :error="limitError"
      @close="handleCloseLimitModal"
      @save="handleSaveLimit"
    />
  </div>
</template>
