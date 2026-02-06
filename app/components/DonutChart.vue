<script setup lang="ts">
import { computed } from 'vue'

/**
 * DonutChart - Gráfico de rosca
 * Usado para exibir proporções como contas pagas/pendentes
 */

export interface DonutChartProps {
  value: number
  total: number
  label?: string
  color?: string
  size?: number
  strokeWidth?: number
  loading?: boolean
}

const props = withDefaults(defineProps<DonutChartProps>(), {
  color: '#22C55E',
  size: 120,
  strokeWidth: 12,
  loading: false,
})

const percentage = computed(() => {
  if (props.total === 0) return 0
  return Math.round((props.value / props.total) * 100)
})

const radius = computed(() => (props.size - props.strokeWidth) / 2)
const circumference = computed(() => 2 * Math.PI * radius.value)
const strokeDashoffset = computed(() => {
  return circumference.value - (percentage.value / 100) * circumference.value
})

const center = computed(() => props.size / 2)
</script>

<template>
  <div id="donut-chart" class="inline-flex flex-col items-center">
    <!-- Loading State -->
    <div v-if="loading" class="skeleton rounded-full" :style="{ width: `${size}px`, height: `${size}px` }" />

    <!-- Chart -->
    <div v-else class="relative" :style="{ width: `${size}px`, height: `${size}px` }">
      <svg :width="size" :height="size" class="transform -rotate-90">
        <!-- Background Circle -->
        <circle
          :cx="center"
          :cy="center"
          :r="radius"
          fill="none"
          class="stroke-surface-light-tertiary dark:stroke-surface-dark-tertiary"
          :stroke-width="strokeWidth"
        />

        <!-- Progress Circle -->
        <circle
          :cx="center"
          :cy="center"
          :r="radius"
          fill="none"
          :stroke="color"
          :stroke-width="strokeWidth"
          :stroke-dasharray="circumference"
          :stroke-dashoffset="strokeDashoffset"
          stroke-linecap="round"
          class="transition-all duration-700 ease-smooth"
        />
      </svg>

      <!-- Center Content -->
      <div class="absolute inset-0 flex items-center justify-center">
        <div class="text-center">
          <span class="text-heading-md font-bold text-content-main">
            {{ percentage }}%
          </span>
          <p class="text-caption text-content-subtle">
            {{ value }} de {{ total }}
          </p>
        </div>
      </div>
    </div>

    <!-- Label -->
    <span v-if="label" class="mt-3 text-body-sm text-content-muted">
      {{ label }}
    </span>
  </div>
</template>
