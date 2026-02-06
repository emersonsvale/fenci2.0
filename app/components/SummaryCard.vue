<script setup lang="ts">
import { computed, ref } from 'vue'
import { useCurrency } from '~/composables/useCurrency'

/**
 * SummaryCard - Card de resumo financeiro
 * Usado para exibir valores de resumo como "A pagar", "A receber", etc.
 */

const { formatCurrency } = useCurrency()

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

// Estado de visibilidade do valor
const isValueVisible = ref(true)

function toggleVisibility() {
  isValueVisible.value = !isValueVisible.value
}

const formattedValue = computed(() => {
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
  <div id="summary-card" class="card p-4 flex items-center gap-4 hover:shadow-card-hover transition-all duration-200">
    <!-- Icon -->
    <div
      v-if="icon"
      class="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
      :class="{
        'bg-error/10': icon === 'down',
        'bg-success/10': icon === 'up',
        'bg-surface-overlay': icon === 'neutral',
      }"
    >
      <span
        class="material-symbols-outlined text-2xl"
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
      <div class="flex items-center gap-2 mb-0.5">
        <span class="text-caption font-medium text-content-subtle">
          {{ label }}
        </span>
        <button
          v-if="showVisibilityToggle"
          type="button"
          class="text-content-subtle hover:text-content-muted transition-colors"
          @click="toggleVisibility"
          :title="isValueVisible ? 'Ocultar valor' : 'Mostrar valor'"
        >
          <span class="material-symbols-outlined text-base">
            {{ isValueVisible ? 'visibility' : 'visibility_off' }}
          </span>
        </button>
      </div>

      <!-- Value -->
      <div v-if="loading" class="skeleton h-7 w-28 rounded" />
      <p v-else class="text-heading-sm font-bold truncate" :class="variantClasses">
        {{ isValueVisible ? formattedValue : '••••••' }}
      </p>
    </div>
  </div>
</template>
