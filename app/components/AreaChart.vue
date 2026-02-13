<script setup lang="ts">
import { ref, watch, onMounted, onBeforeUnmount } from 'vue'
import {
  Chart,
  registerables,
  type ChartConfiguration,
} from 'chart.js'

/**
 * AreaChart - Gráfico de área (Chart.js)
 * Exibe entradas e saídas ao longo do tempo
 */

export interface AreaChartData {
  label: string
  value: number
}

export interface AreaChartSeries {
  name: string
  data: AreaChartData[]
  color: string
}

export interface AreaChartProps {
  series: AreaChartSeries[]
  height?: number
  loading?: boolean
}

const props = withDefaults(defineProps<AreaChartProps>(), {
  height: 220,
  loading: false,
})

Chart.register(...registerables)

const canvasRef = ref<HTMLCanvasElement | null>(null)
let chartInstance: Chart | null = null

const visibleSeries = ref<boolean[]>([])

function toggleSeries(index: number) {
  if (visibleSeries.value[index] === undefined) return
  visibleSeries.value = [...visibleSeries.value]
  visibleSeries.value[index] = !visibleSeries.value[index]
  if (chartInstance) {
    const meta = chartInstance.getDatasetMeta(index)
    meta.hidden = !visibleSeries.value[index]
    chartInstance.update()
  }
}

function buildChartConfig(): ChartConfiguration<'line'> | null {
  if (!canvasRef.value || !props.series.length) return null

  const labels = props.series[0]?.data?.map((d) => d.label) ?? []
  const allValues = props.series.flatMap((s) => s.data.map((d) => d.value))
  const maxValue = allValues.length ? Math.max(...allValues) : 0
  const suggestedMax = maxValue <= 0 ? 100 : Math.ceil((maxValue * 1.15) / 100) * 100

  const datasets = props.series.map((serie, index) => ({
    label: serie.name,
    data: serie.data.map((d) => d.value),
    borderColor: serie.color,
    backgroundColor: serie.color + '40',
    fill: true,
    tension: 0.35,
    pointRadius: 4,
    pointBackgroundColor: serie.color,
    borderWidth: 2,
    order: props.series.length - index,
  }))

  function formatCurrency(value: number): string {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value)
  }

  return {
    type: 'line',
    data: { labels, datasets },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: {
        mode: 'index',
        intersect: false,
      },
      plugins: {
        legend: {
          display: false,
        },
        tooltip: {
          enabled: true,
          callbacks: {
            label(context) {
              const value = context.parsed.y
              const serieName = context.dataset.label ?? ''
              return `${serieName}: ${formatCurrency(value)}`
            },
          },
        },
      },
      scales: {
        x: {
          grid: { display: false },
          ticks: {
            maxRotation: 0,
            font: { size: 11 },
            color: '#9CA3AF',
          },
        },
        y: {
          beginAtZero: true,
          suggestedMax,
          grid: {
            color: 'rgba(0,0,0,0.06)',
          },
          ticks: {
            font: { size: 11 },
            color: '#9CA3AF',
            callback(value) {
              if (typeof value === 'number' && value >= 1000) {
                return 'R$ ' + (value / 1000).toFixed(0) + 'k'
              }
              return 'R$ ' + value
            },
          },
        },
      },
    },
  }
}

function initChart() {
  if (!canvasRef.value || props.loading) return
  const config = buildChartConfig()
  if (!config) return
  destroyChart()
  chartInstance = new Chart(canvasRef.value, config)
  if (visibleSeries.value.length !== props.series.length) {
    visibleSeries.value = props.series.map(() => true)
  }
  visibleSeries.value.forEach((visible, index) => {
    if (!visible && chartInstance) {
      const meta = chartInstance.getDatasetMeta(index)
      if (meta) meta.hidden = true
    }
  })
}

function destroyChart() {
  if (chartInstance) {
    chartInstance.destroy()
    chartInstance = null
  }
}

onMounted(() => {
  if (!props.loading) initChart()
})

onBeforeUnmount(() => {
  destroyChart()
})

// Quando o canvas estiver disponível (ex.: após ClientOnly montar)
watch(
  canvasRef,
  (el) => {
    if (el && !props.loading) initChart()
  },
  { immediate: true }
)

watch(
  () => [props.series, props.loading],
  () => {
    if (props.loading) return
    initChart()
  },
  { deep: true }
)
</script>

<template>
  <div id="area-chart" class="w-full">
    <!-- Loading -->
    <div
      v-if="loading"
      class="skeleton rounded-xl w-full"
      :style="{ height: `${height}px` }"
    />

    <!-- Gráfico Chart.js (apenas no client: canvas) -->
    <template v-else>
      <ClientOnly>
        <div
          class="w-full rounded-xl overflow-hidden"
          :style="{ height: `${height}px` }"
        >
          <canvas ref="canvasRef" />
        </div>
        <template #fallback>
          <div
            class="w-full rounded-xl bg-surface-elevated flex items-center justify-center text-content-muted text-body-sm"
            :style="{ height: `${height}px` }"
          >
            Carregando gráfico...
          </div>
        </template>
      </ClientOnly>

      <!-- Legenda clicável: mostra/oculta série no gráfico -->
      <div class="flex items-center justify-center gap-6 mt-4">
        <button
          v-for="(serie, index) in series"
          :key="serie.name"
          type="button"
          class="flex items-center gap-2 rounded-lg px-2 py-1 transition-opacity hover:opacity-90"
          :class="{ 'opacity-40': !visibleSeries[index] }"
          :aria-pressed="visibleSeries[index]"
          @click="toggleSeries(index)"
        >
          <div
            class="w-3 h-3 rounded-full shrink-0"
            :style="{ backgroundColor: serie.color }"
          />
          <span class="text-body-sm text-content-muted">
            {{ serie.name }}
          </span>
        </button>
      </div>
    </template>
  </div>
</template>
