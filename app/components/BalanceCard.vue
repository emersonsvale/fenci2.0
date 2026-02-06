<script setup lang="ts">
import { ref, computed } from 'vue'

/**
 * BalanceCard - Card de balanço financeiro
 * Exibe o saldo total e entradas/saídas
 */

export interface BalanceCardProps {
  saldo: number
  entradas: number
  saidas: number
  loading?: boolean
}

const props = withDefaults(defineProps<BalanceCardProps>(), {
  loading: false,
})

const showValues = ref(true)

function formatCurrency(value: number): string {
  if (!showValues.value) return '••••••'
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value)
}

function toggleVisibility() {
  showValues.value = !showValues.value
}
</script>

<template>
  <div id="balance-card" class="card p-5">
    <!-- Header -->
    <div class="flex items-center justify-between mb-3">
      <span class="text-caption font-medium text-content-subtle uppercase tracking-wider">Saldo atual</span>
      <button
        type="button"
        class="p-1.5 rounded-lg hover:bg-surface-overlay transition-colors"
        :title="showValues ? 'Ocultar valores' : 'Mostrar valores'"
        @click="toggleVisibility"
      >
        <span class="material-symbols-outlined text-lg text-content-subtle">
          {{ showValues ? 'visibility' : 'visibility_off' }}
        </span>
      </button>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="space-y-4">
      <div class="skeleton h-8 w-28 rounded" />
      <div class="skeleton h-5 w-24 rounded" />
      <div class="skeleton h-5 w-24 rounded" />
    </div>

    <!-- Content -->
    <div v-else>
      <!-- Saldo -->
      <p class="text-heading-lg font-bold mb-4" :class="saldo >= 0 ? 'text-content-main' : 'text-error'">
        {{ formatCurrency(saldo) }}
      </p>

      <!-- Entradas e Saídas -->
      <div class="space-y-3">
        <!-- Entradas -->
        <div class="flex items-center gap-3">
          <div class="w-8 h-8 rounded-full bg-success/15 flex items-center justify-center">
            <span class="material-symbols-outlined text-base text-success">arrow_upward</span>
          </div>
          <div class="flex-1">
            <p class="text-caption text-content-subtle">Entradas</p>
            <p class="text-body-sm font-semibold text-success">{{ formatCurrency(entradas) }}</p>
          </div>
        </div>

        <!-- Saídas -->
        <div class="flex items-center gap-3">
          <div class="w-8 h-8 rounded-full bg-error/15 flex items-center justify-center">
            <span class="material-symbols-outlined text-base text-error">arrow_downward</span>
          </div>
          <div class="flex-1">
            <p class="text-caption text-content-subtle">Saídas</p>
            <p class="text-body-sm font-semibold text-error">{{ formatCurrency(saidas) }}</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
