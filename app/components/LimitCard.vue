<script setup lang="ts">
import { computed } from 'vue'

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

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value)
}

const progressColor = computed(() => {
  if (percentage.value >= 100) return 'bg-error'
  if (percentage.value >= 80) return 'bg-warning'
  return 'bg-primary'
})
</script>

<template>
  <div id="limit-card" class="card p-5">
    <!-- Header -->
    <div class="flex items-center justify-between mb-3">
      <span class="text-caption font-medium text-content-subtle uppercase tracking-wider">Limite mensal</span>
      <button
        type="button"
        class="p-1.5 rounded-lg hover:bg-surface-overlay transition-colors"
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
        Gasto: <span class="font-semibold" :class="percentage >= 80 ? 'text-error' : 'text-primary'">{{ formatCurrency(gasto) }}</span>
      </p>

      <!-- Progress Bar -->
      <div class="flex items-center gap-3">
        <div class="flex-1 h-2.5 bg-surface-overlay rounded-full overflow-hidden">
          <div
            class="h-full rounded-full transition-all duration-500"
            :class="progressColor"
            :style="{ width: `${Math.min(percentage, 100)}%` }"
          />
        </div>
        <span class="text-body-sm font-semibold w-12 text-right" :class="progressColor.replace('bg-', 'text-')">
          {{ percentage }}%
        </span>
      </div>

      <!-- Alerta se passou de 80% -->
      <p v-if="percentage >= 100" class="text-caption text-error mt-2 flex items-center gap-1">
        <span class="material-symbols-outlined text-sm">warning</span>
        Limite excedido!
      </p>
      <p v-else-if="percentage >= 80" class="text-caption text-warning mt-2 flex items-center gap-1">
        <span class="material-symbols-outlined text-sm">info</span>
        Atenção: próximo do limite
      </p>
    </div>

    <!-- Empty State quando não há limite -->
    <div v-else class="text-center py-4">
      <span class="material-symbols-outlined text-3xl text-content-subtle mb-2 block opacity-50">savings</span>
      <p class="text-body-sm text-content-muted mb-2">Nenhum limite definido</p>
      <button
        type="button"
        class="text-primary text-body-sm font-medium hover:text-primary-600 transition-colors"
        @click="emit('edit')"
      >
        + Definir limite
      </button>
    </div>
  </div>
</template>
