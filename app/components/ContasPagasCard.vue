<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import DonutChart from './DonutChart.vue'

/**
 * ContasPagasCard - Card de contas pagas do mês
 * Igual ao bloco da sidebar do extrato: título com mês, donut, legenda Pagas/Pendentes
 */

export interface ContasPagasCardProps {
  contasPagas: { pagas: number; total: number }
  monthName: string
  loading?: boolean
}

const props = withDefaults(defineProps<ContasPagasCardProps>(), {
  loading: false,
})

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
    <div v-else-if="contasPagas.total === 0" class="flex flex-col items-center justify-center py-8">
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
          :value="contasPagas.pagas"
          :total="contasPagas.total"
          :size="donutSize"
          :stroke-width="12"
          color="#22C55E"
        />
      </div>

      <!-- Legend -->
      <div class="flex items-center justify-center gap-6 mt-4 pt-3 border-t border-default-subtle">
        <div class="flex items-center gap-2">
          <span class="w-2.5 h-2.5 rounded-full bg-success shadow-sm" />
          <span class="text-caption text-content-muted">
            Pagas ({{ contasPagas.pagas }})
          </span>
        </div>
        <div class="flex items-center gap-2">
          <span class="w-2.5 h-2.5 rounded-full bg-surface-overlay shadow-sm" />
          <span class="text-caption text-content-muted">
            Pendentes ({{ contasPagas.total - contasPagas.pagas }})
          </span>
        </div>
      </div>
    </template>
  </div>
</template>
