<script setup lang="ts">
import { ref, watch, onMounted, onBeforeUnmount } from 'vue'
import {
  Chart,
  registerables,
  type ChartConfiguration,
  type ChartType,
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

function buildChartConfig(): ChartConfiguration<'line'> | null {
  if (!canvasRef.value || !props.series.length) return null

  const labels = props.series[0]?.data?.map((d) => d.label) ?? []
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

      <!-- Legenda -->
      <div class="flex items-center justify-center gap-6 mt-4">
        <div
          v-for="serie in series"
          :key="serie.name"
          class="flex items-center gap-2"
        >
          <div
            class="w-3 h-3 rounded-full shrink-0"
            :style="{ backgroundColor: serie.color }"
          />
          <span class="text-body-sm text-content-muted">
            {{ serie.name }}
          </span>
        </div>
      </div>
    </template>
  </div>
</template>
