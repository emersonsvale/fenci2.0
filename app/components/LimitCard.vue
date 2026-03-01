<script setup lang="ts">
import { computed } from 'vue'
import { useCurrency } from '~/composables/useCurrency'
import { usePrivacyMode } from '~/composables/usePrivacyMode'

const { formatCurrency } = useCurrency()
const { isPrivacyMode, PRIVACY_MASK } = usePrivacyMode()

/**
 * LimitCard - Card de limite mensal
 * Exibe o limite de gastos e progresso atual
 */

export interface LimitCardProps {
  limite: number
  gasto: number
  loading?: boolean
}

const props = withDefaults(defineProps<LimitCardProps>(), {
  loading: false,
})

const emit = defineEmits<{
  edit: []
}>()

const percentage = computed(() => {
  if (props.limite === 0) return 50 // Default 50% quando não há limite definido
  return Math.round((props.gasto / props.limite) * 100)
})


const progressColor = computed(() => {
  if (percentage.value >= 100) return 'bg-error'
  if (percentage.value >= 80) return 'bg-warning'
  return 'bg-primary'
})
</script>

<template>
  <div id="limit-card" class="card-glow p-5">
    <!-- Header -->
    <div class="flex items-center justify-between mb-3">
      <span class="text-caption font-medium text-content-subtle uppercase tracking-wider">Limite mensal</span>
      <button
        type="button"
        class="p-1.5 rounded-xl hover:bg-surface-overlay transition-all duration-200"
        title="Editar limite"
        @click="emit('edit')"
      >
        <span class="material-symbols-outlined text-lg text-content-subtle">edit</span>
      </button>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="space-y-3">
      <div class="skeleton h-8 w-28 rounded" />
      <div class="skeleton h-2.5 w-full rounded-full" />
    </div>

    <!-- Content quando há limite definido -->
    <div v-else-if="limite > 0">
      <!-- Limite Value -->
      <p class="text-heading-lg font-bold text-content-main mb-1">
        {{ formatCurrency(limite) }}
      </p>

      <!-- Gasto Info -->
      <p class="text-body-sm text-content-muted mb-4">
        Gasto: <span class="font-semibold transition-colors duration-300" :class="!isPrivacyMode && percentage >= 80 ? 'text-error' : 'text-primary'">{{ formatCurrency(gasto) }}</span>
      </p>

      <!-- Progress Bar -->
      <div class="flex items-center gap-3">
        <div class="flex-1 h-2.5 bg-surface-overlay rounded-full overflow-hidden">
          <div
            class="h-full rounded-full transition-all duration-700 ease-out"
            :class="progressColor"
            :style="{ width: `${Math.min(percentage, 100)}%` }"
          />
        </div>
        <span class="text-body-sm font-bold w-12 text-right tabular-nums" :class="progressColor.replace('bg-', 'text-')">
          {{ isPrivacyMode ? PRIVACY_MASK : `${percentage}%` }}
        </span>
      </div>

      <!-- Alerta se passou de 80% -->
      <Transition
        enter-active-class="transition-all duration-300 ease-out"
        enter-from-class="opacity-0 translate-y-1"
        leave-active-class="transition-all duration-200 ease-in"
        leave-to-class="opacity-0"
      >
        <p v-if="percentage >= 100" class="text-caption text-error mt-3 flex items-center gap-1.5 p-2 bg-error/8 rounded-lg">
          <span class="material-symbols-outlined text-sm">warning</span>
          Limite excedido!
        </p>
        <p v-else-if="percentage >= 80" class="text-caption text-warning mt-3 flex items-center gap-1.5 p-2 bg-warning/8 rounded-lg">
          <span class="material-symbols-outlined text-sm">info</span>
          Atenção: próximo do limite
        </p>
      </Transition>
    </div>

    <!-- Empty State quando não há limite -->
    <div v-else class="text-center py-6">
      <div class="w-14 h-14 rounded-2xl bg-primary/8 flex items-center justify-center mx-auto mb-3">
        <span class="material-symbols-outlined text-2xl text-primary/60">savings</span>
      </div>
      <p class="text-body-sm text-content-muted mb-3">Nenhum limite definido</p>
      <button
        type="button"
        class="text-primary text-body-sm font-semibold hover:text-primary-600 transition-colors inline-flex items-center gap-1"
        @click="emit('edit')"
      >
        <span class="material-symbols-outlined text-lg">add_circle</span>
        Definir limite
      </button>
    </div>
  </div>
</template>
