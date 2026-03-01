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

const donutSize = computed(() => Math.min(chartSize.value, 140))

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
    class="card-glow p-5"
    aria-label="Contas pagas do mês"
  >
    <h3 class="text-body-sm font-semibold text-content-main mb-1">
      Contas pagas de {{ monthName }}
    </h3>

    <!-- Loading State -->
    <div v-if="loading" class="flex justify-center py-6">
      <div class="w-28 h-28 rounded-full skeleton" />
    </div>

    <!-- Empty State (sem despesas) -->
    <div v-else-if="contasPagas.totalValor === 0" class="flex flex-col items-center justify-center py-8">
      <div class="w-14 h-14 rounded-2xl bg-success/10 flex items-center justify-center mb-3">
        <span class="material-symbols-outlined text-2xl text-success">
          check_circle
        </span>
      </div>
      <p class="text-body-sm font-medium text-content-muted text-center">
        Nenhuma despesa neste mês
      </p>
    </div>

    <!-- Donut Chart + Legend -->
    <template v-else>
      <!-- Progress Bar compacta -->
      <div class="mt-3 mb-4">
        <div class="flex items-baseline justify-between mb-2">
          <span class="text-display-sm font-bold text-content-main tabular-nums">
            {{ isPrivacyMode ? PRIVACY_MASK : `${Math.round((contasPagas.valorPago / contasPagas.totalValor) * 100)}%` }}
          </span>
          <span class="text-caption text-content-subtle">
            {{ formatCurrency(contasPagas.valorPago) }}
          </span>
        </div>
        <div class="w-full h-2 bg-gray-200/60 dark:bg-white/[0.06] rounded-full overflow-hidden">
          <div 
            class="h-full rounded-full bg-gradient-to-r from-primary to-primary-400 transition-all duration-1000 ease-out"
            :style="{ width: `${Math.min(100, Math.round((contasPagas.valorPago / contasPagas.totalValor) * 100))}%` }"
          />
        </div>
      </div>

      <!-- Donut Chart (menor, decorativo) -->
      <div
        ref="chartWrapRef"
        class="w-full max-w-[140px] mx-auto py-2"
      >
        <DonutChart
          :value="contasPagas.valorPago"
          :total="contasPagas.totalValor"
          :size="donutSize"
          :stroke-width="8"
          color="#22C55E"
        >
          <template #center="{ percentage }">
            <div class="text-center">
              <span class="text-body-sm font-bold text-content-main">
                {{ isPrivacyMode ? PRIVACY_MASK : `${percentage}%` }}
              </span>
            </div>
          </template>
        </DonutChart>
      </div>

      <!-- Legend -->
      <div class="flex flex-col gap-2.5 mt-3 pt-3 border-t border-gray-100 dark:border-white/[0.06]">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-2.5">
            <span class="w-2 h-2 rounded-full bg-primary" />
            <span class="text-caption text-content-muted">Pago</span>
          </div>
          <span class="text-caption font-semibold text-content-main tabular-nums">
            {{ formatCurrency(contasPagas.valorPago) }}
          </span>
        </div>
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-2.5">
            <span class="w-2 h-2 rounded-full bg-gray-300 dark:bg-white/[0.15]" />
            <span class="text-caption text-content-muted">Pendente</span>
          </div>
          <span class="text-caption font-semibold text-content-main tabular-nums">
            {{ formatCurrency(contasPagas.valorPendente) }}
          </span>
        </div>
      </div>
    </template>
  </div>
</template>
