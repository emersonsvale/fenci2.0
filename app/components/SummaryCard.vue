<script setup lang="ts">
import { computed } from 'vue'
import { useCurrency } from '~/composables/useCurrency'
import { usePrivacyMode } from '~/composables/usePrivacyMode'

/**
 * SummaryCard - Card de resumo financeiro
 * Usado para exibir valores de resumo como "A pagar", "A receber", etc.
 */

const { formatCurrency } = useCurrency()
const { isPrivacyMode, togglePrivacyMode, PRIVACY_MASK } = usePrivacyMode()

export interface SummaryCardProps {
  label: string
  value: number
  variant?: 'default' | 'danger' | 'success' | 'warning' | 'neutral'
  icon?: 'up' | 'down' | 'neutral'
  showCurrency?: boolean
  loading?: boolean
  showVisibilityToggle?: boolean
}

const props = withDefaults(defineProps<SummaryCardProps>(), {
  variant: 'default',
  showCurrency: true,
  loading: false,
  showVisibilityToggle: false,
})

const formattedValue = computed(() => {
  if (isPrivacyMode.value) return PRIVACY_MASK
  if (props.showCurrency) {
    return formatCurrency(props.value)
  }
  return props.value.toLocaleString('pt-BR')
})

const variantClasses = computed(() => {
  const variants: Record<string, string> = {
    default: 'text-content-main',
    danger: 'text-error',
    success: 'text-success',
    warning: 'text-warning',
    neutral: 'text-content-muted',
  }
  return variants[props.variant]
})
</script>

<template>
  <div
    id="summary-card"
    class="summary-card card p-3 lg:p-4 flex items-center gap-3 lg:gap-4 hover:shadow-card-hover transition-all duration-300 group"
    :class="{
      'summary-card-red': icon === 'down',
      'summary-card-green': icon === 'up',
      'summary-card-blue': icon === 'neutral',
    }"
  >
    <!-- Icon -->
    <div
      v-if="icon"
      class="w-9 h-9 lg:w-11 lg:h-11 rounded-xl flex items-center justify-center flex-shrink-0 transition-transform duration-300 group-hover:scale-110"
      :class="{
        'bg-error/10': icon === 'down',
        'bg-success/10': icon === 'up',
        'bg-surface-overlay': icon === 'neutral',
      }"
    >
      <span
        class="material-symbols-outlined text-xl lg:text-2xl"
        :class="{
          'text-error': icon === 'down',
          'text-success': icon === 'up',
          'text-content-subtle': icon === 'neutral',
        }"
      >
        {{ icon === 'down' ? 'arrow_downward' : icon === 'up' ? 'arrow_upward' : 'remove' }}
      </span>
    </div>

    <!-- Content -->
    <div class="flex-1 min-w-0">
      <!-- Label with visibility toggle -->
      <div class="flex items-center gap-1.5 lg:gap-2 mb-0.5">
        <span class="text-[10px] lg:text-caption font-medium text-content-subtle truncate uppercase tracking-wide">
          {{ label }}
        </span>
        <button
          v-if="showVisibilityToggle"
          type="button"
          class="text-content-subtle hover:text-content-muted transition-colors shrink-0"
          @click="togglePrivacyMode"
          :title="isPrivacyMode ? 'Mostrar valores' : 'Ocultar valores'"
        >
          <span class="material-symbols-outlined text-sm lg:text-base">
            {{ isPrivacyMode ? 'visibility_off' : 'visibility' }}
          </span>
        </button>
      </div>

      <!-- Value -->
      <div v-if="loading" class="skeleton h-5 lg:h-7 w-20 lg:w-28 rounded" />
      <p v-else class="text-body-sm lg:text-heading-sm font-bold truncate" :class="variantClasses">
        {{ formattedValue }}
      </p>
    </div>
  </div>
</template>
