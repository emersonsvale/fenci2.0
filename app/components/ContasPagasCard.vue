<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import DonutChart from './DonutChart.vue'
import { useCurrency } from '~/composables/useCurrency'
import { usePrivacyMode } from '~/composables/usePrivacyMode'

/**
 * ContasPagasCard - Card de contas pagas do mês
 * Exibe valor pago vs valor pendente em formato monetário com gráfico donut
 */

export interface ContasPagasCardProps {
  contasPagas: { valorPago: number; valorPendente: number; totalValor: number }
  monthName: string
  loading?: boolean
}

const props = withDefaults(defineProps<ContasPagasCardProps>(), {
  loading: false,
})

const { formatCurrency } = useCurrency()
const { isPrivacyMode, PRIVACY_MASK } = usePrivacyMode()

const chartWrapRef = ref<HTMLElement | null>(null)
const chartSize = ref(130)

const donutSize = computed(() => Math.min(chartSize.value, 200))

function measureChartContainer() {
  if (chartWrapRef.value) {
    const w = chartWrapRef.value.clientWidth
    chartSize.value = w > 0 ? w : 130
  }
}

let resizeObserver: ResizeObserver | null = null

onMounted(() => {
  measureChartContainer()
  if (chartWrapRef.value && typeof ResizeObserver !== 'undefined') {
    resizeObserver = new ResizeObserver(measureChartContainer)
    resizeObserver.observe(chartWrapRef.value)
  }
  window.addEventListener('resize', measureChartContainer)
})

onUnmounted(() => {
  resizeObserver?.disconnect()
  window.removeEventListener('resize', measureChartContainer)
})
</script>

<template>
  <div
    class="bg-surface-elevated rounded-xl p-4 shadow-xs border border-default-subtle"
    aria-label="Contas pagas do mês"
  >
    <h3 class="text-body-sm font-medium text-content-muted mb-4 pb-3 border-b border-default-subtle">
      Contas pagas de {{ monthName }}
    </h3>

    <!-- Loading State -->
    <div v-if="loading" class="flex justify-center py-6">
      <div class="w-32 h-32 rounded-full bg-surface-overlay animate-pulse" />
    </div>

    <!-- Empty State (sem despesas) -->
    <div v-else-if="contasPagas.totalValor === 0" class="flex flex-col items-center justify-center py-8">
      <div class="w-16 h-16 rounded-full bg-success/10 flex items-center justify-center mb-3">
        <span class="material-symbols-outlined text-3xl text-success">
          check_circle
        </span>
      </div>
      <p class="text-body-sm text-content-subtle text-center">
        Nenhuma despesa neste mês
      </p>
    </div>

    <!-- Donut Chart + Legend -->
    <template v-else>
      <div
        ref="chartWrapRef"
        class="w-full max-w-[200px] mx-auto aspect-square py-2"
      >
        <DonutChart
          :value="contasPagas.valorPago"
          :total="contasPagas.totalValor"
          :size="donutSize"
          :stroke-width="12"
          color="#22C55E"
        >
          <template #center="{ percentage }">
            <div class="text-center">
              <span class="text-heading-md font-bold text-content-main">
                {{ isPrivacyMode ? PRIVACY_MASK : `${percentage}%` }}
              </span>
              <p class="text-caption text-content-subtle leading-tight mt-0.5">
                {{ formatCurrency(contasPagas.valorPago) }}
              </p>
            </div>
          </template>
        </DonutChart>
      </div>

      <!-- Legend -->
      <div class="flex flex-col gap-2 mt-4 pt-3 border-t border-default-subtle">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-2">
            <span class="w-2.5 h-2.5 rounded-full bg-success shadow-sm" />
            <span class="text-caption text-content-muted">Pago</span>
          </div>
          <span class="text-caption font-medium text-content-main">
            {{ formatCurrency(contasPagas.valorPago) }}
          </span>
        </div>
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-2">
            <span class="w-2.5 h-2.5 rounded-full bg-surface-overlay shadow-sm" />
            <span class="text-caption text-content-muted">Pendente</span>
          </div>
          <span class="text-caption font-medium text-content-main">
            {{ formatCurrency(contasPagas.valorPendente) }}
          </span>
        </div>
      </div>
    </template>
  </div>
</template>
