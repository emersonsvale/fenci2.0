<script setup lang="ts">
import { ref, watch, onMounted, onBeforeUnmount } from 'vue'
import { Chart, registerables, type ChartConfiguration } from 'chart.js'

/**
 * PlanejamentoCategoryChart - Gráfico de barras por categoria (previsto x realizado)
 */

export interface CategoryTotal {
  name: string
  planned: number
  actual: number
}

const props = withDefaults(
  defineProps<{
    data: CategoryTotal[]
    height?: number
    loading?: boolean
  }>(),
  { height: 180, loading: false }
)

Chart.register(...registerables)

const canvasRef = ref<HTMLCanvasElement | null>(null)
let chartInstance: Chart | null = null

const PLANNED_COLOR = '#3B82F6'
const ACTUAL_COLOR = '#22C55E'

function buildChartConfig(): ChartConfiguration<'bar'> | null {
  if (!canvasRef.value || !props.data.length) return null

  const labels = props.data.map((d) => d.name)
  return {
    type: 'bar',
    data: {
      labels,
      datasets: [
        {
          label: 'Previsto',
          data: props.data.map((d) => d.planned),
          backgroundColor: PLANNED_COLOR + '99',
          borderColor: PLANNED_COLOR,
          borderWidth: 1,
        },
        {
          label: 'Realizado',
          data: props.data.map((d) => d.actual),
          backgroundColor: ACTUAL_COLOR + '99',
          borderColor: ACTUAL_COLOR,
          borderWidth: 1,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'top',
          labels: {
            usePointStyle: true,
            padding: 8,
            font: { size: 11 },
            color: '#6B7280',
          },
        },
        tooltip: {
          callbacks: {
            label(context) {
              const value = context.raw as number
              return `${context.dataset.label}: ${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)}`
            },
          },
        },
      },
      scales: {
        x: {
          grid: { display: false },
          ticks: {
            maxRotation: 45,
            font: { size: 10 },
            color: '#6B7280',
            maxTicksLimit: 8,
          },
        },
        y: {
          beginAtZero: true,
          grid: {
            color: 'rgba(0,0,0,0.06)',
          },
          ticks: {
            font: { size: 10 },
            color: '#6B7280',
            callback(value) {
              if (typeof value === 'number' && value >= 1000) {
                return 'R$ ' + (value / 1000).toFixed(1) + 'k'
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

watch(
  canvasRef,
  (el) => {
    if (el && !props.loading) initChart()
  },
  { immediate: true }
)

watch(
  () => [props.data, props.loading],
  () => {
    if (props.loading) return
    initChart()
  },
  { deep: true }
)
</script>

<template>
  <div class="w-full">
    <div
      v-if="loading"
      class="skeleton rounded-xl w-full"
      :style="{ height: `${height}px` }"
    />
    <template v-else>
      <ClientOnly>
        <div
          class="w-full rounded-xl overflow-hidden border border-default bg-surface-elevated p-3"
          :style="{ height: `${height}px` }"
        >
          <canvas ref="canvasRef" />
        </div>
        <template #fallback>
          <div
            class="w-full rounded-xl border border-default bg-surface-elevated flex items-center justify-center text-content-subtle text-body-sm"
            :style="{ height: `${height}px` }"
          >
            Carregando gráfico...
          </div>
        </template>
      </ClientOnly>
    </template>
  </div>
</template>
