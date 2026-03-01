<script setup lang="ts">
import { computed, ref, onMounted } from 'vue'
import { usePrivacyMode } from '~/composables/usePrivacyMode'

/**
 * DonutChart - Gráfico de rosca refinado
 * Design moderno com anel fino, gradiente sutil e animação suave
 */

const { isPrivacyMode, PRIVACY_MASK } = usePrivacyMode()

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
  strokeWidth: 8,
  loading: false,
})

const isAnimated = ref(false)

onMounted(() => {
  requestAnimationFrame(() => {
    isAnimated.value = true
  })
})

const percentage = computed(() => {
  if (props.total === 0) return 0
  return Math.round((props.value / props.total) * 100)
})

const radius = computed(() => (props.size - props.strokeWidth) / 2)
const circumference = computed(() => 2 * Math.PI * radius.value)
const strokeDashoffset = computed(() => {
  if (!isAnimated.value) return circumference.value
  return circumference.value - (percentage.value / 100) * circumference.value
})

const center = computed(() => props.size / 2)

// ID único para o gradiente SVG
const gradientId = computed(() => `donut-grad-${Math.random().toString(36).slice(2, 9)}`)
</script>

<template>
  <div id="donut-chart" class="inline-flex flex-col items-center">
    <!-- Loading State -->
    <div v-if="loading" class="skeleton rounded-full" :style="{ width: `${size}px`, height: `${size}px` }" />

    <!-- Chart -->
    <div v-else class="donut-wrapper relative" :style="{ width: `${size}px`, height: `${size}px` }">
      <svg :width="size" :height="size" class="transform -rotate-90">
        <defs>
          <linearGradient :id="gradientId" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" :stop-color="color" stop-opacity="1" />
            <stop offset="100%" :stop-color="color" stop-opacity="0.6" />
          </linearGradient>
        </defs>

        <!-- Background Circle -->
        <circle
          :cx="center"
          :cy="center"
          :r="radius"
          fill="none"
          class="stroke-gray-200/60 dark:stroke-white/[0.06]"
          :stroke-width="strokeWidth"
        />

        <!-- Progress Circle -->
        <circle
          :cx="center"
          :cy="center"
          :r="radius"
          fill="none"
          :stroke="`url(#${gradientId})`"
          :stroke-width="strokeWidth"
          :stroke-dasharray="circumference"
          :stroke-dashoffset="strokeDashoffset"
          stroke-linecap="round"
          class="donut-progress"
        />
      </svg>

      <!-- Center Content -->
      <div class="absolute inset-0 flex items-center justify-center">
        <slot name="center" :percentage="percentage" :value="value" :total="total">
          <div class="text-center">
            <span class="text-heading-md font-bold text-content-main">
              {{ isPrivacyMode ? PRIVACY_MASK : `${percentage}%` }}
            </span>
            <p class="text-caption text-content-subtle">
              {{ isPrivacyMode ? PRIVACY_MASK : `${value} de ${total}` }}
            </p>
          </div>
        </slot>
      </div>
    </div>

    <!-- Label -->
    <span v-if="label" class="mt-3 text-body-sm text-content-muted">
      {{ label }}
    </span>
  </div>
</template>

<style scoped>
.donut-progress {
  transition: stroke-dashoffset 1.2s cubic-bezier(0.4, 0, 0.2, 1);
}
</style>
