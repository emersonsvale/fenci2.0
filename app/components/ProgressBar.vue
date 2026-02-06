<script setup lang="ts">
import { computed } from 'vue'

/**
 * ProgressBar - Barra de progresso reutilizável
 * Usada para exibir progresso de limites, metas, etc.
 */

export interface ProgressBarProps {
  value: number
  max: number
  variant?: 'primary' | 'success' | 'warning' | 'error'
  size?: 'sm' | 'md' | 'lg'
  showLabel?: boolean
  showPercentage?: boolean
  color?: string // Cor customizada (hex)
}

const props = withDefaults(defineProps<ProgressBarProps>(), {
  variant: 'primary',
  size: 'md',
  showLabel: false,
  showPercentage: false,
  color: undefined,
})

const percentage = computed(() => {
  if (props.max === 0) return 0
  const calc = (props.value / props.max) * 100
  return Math.min(Math.max(calc, 0), 100)
})

const variantClasses = computed(() => {
  const variants: Record<string, string> = {
    primary: 'bg-primary',
    success: 'bg-success',
    warning: 'bg-warning',
    error: 'bg-error',
  }
  return variants[props.variant]
})

const sizeClasses = computed(() => {
  const sizes: Record<string, string> = {
    sm: 'h-1.5',
    md: 'h-2.5',
    lg: 'h-4',
  }
  return sizes[props.size]
})

// Determina a cor automaticamente baseada no percentual
const autoVariant = computed(() => {
  if (percentage.value >= 100) return 'bg-error'
  if (percentage.value >= 80) return 'bg-warning'
  if (percentage.value >= 50) return 'bg-primary'
  return 'bg-success'
})
</script>

<template>
  <div id="progress-bar" class="w-full">
    <!-- Labels -->
    <div v-if="showLabel || showPercentage" class="flex justify-between items-center mb-1">
      <slot name="label" />
      <span v-if="showPercentage" class="text-caption font-medium text-content-muted">
        {{ Math.round(percentage) }}%
      </span>
    </div>

    <!-- Progress Track -->
    <div
      class="w-full bg-surface-light-tertiary dark:bg-surface-dark-tertiary rounded-full overflow-hidden"
      :class="sizeClasses"
    >
      <!-- Progress Fill -->
      <div
        class="h-full rounded-full transition-all duration-500 ease-smooth"
        :class="!color ? (variant === 'primary' ? autoVariant : variantClasses) : ''"
        :style="{ width: `${percentage}%`, backgroundColor: color || undefined }"
      />
    </div>
  </div>
</template>
