<script setup lang="ts">
import { computed } from 'vue'
import { useCurrency } from '~/composables/useCurrency'
import { usePrivacyMode } from '~/composables/usePrivacyMode'

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

const { formatCurrency } = useCurrency()
const { isPrivacyMode, togglePrivacyMode } = usePrivacyMode()
</script>

<template>
  <div id="balance-card" class="card-glow p-5">
    <!-- Header -->
    <div class="flex items-center justify-between mb-3">
      <span class="text-caption font-medium text-content-subtle uppercase tracking-wider">Saldo atual</span>
      <button
        type="button"
        class="p-1.5 rounded-xl hover:bg-surface-overlay transition-all duration-200"
        :title="isPrivacyMode ? 'Mostrar valores' : 'Ocultar valores'"
        @click="togglePrivacyMode"
      >
        <span class="material-symbols-outlined text-lg text-content-subtle">
          {{ isPrivacyMode ? 'visibility_off' : 'visibility' }}
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
      <p class="text-heading-lg font-bold mb-4 transition-colors duration-300" :class="saldo >= 0 ? 'text-content-main' : 'text-error'">
        {{ formatCurrency(saldo) }}
      </p>

      <!-- Entradas e Saídas -->
      <div class="space-y-2">
        <!-- Entradas -->
        <div class="flex items-center gap-3 p-2 -mx-2 rounded-xl hover:bg-success/5 transition-colors duration-200">
          <div class="w-8 h-8 rounded-xl bg-success/12 flex items-center justify-center">
            <span class="material-symbols-outlined text-base text-success">trending_up</span>
          </div>
          <div class="flex-1 flex items-center justify-between">
            <p class="text-caption text-content-subtle">Entradas</p>
            <p class="text-body-sm font-semibold text-success">{{ formatCurrency(entradas) }}</p>
          </div>
        </div>

        <!-- Saídas -->
        <div class="flex items-center gap-3 p-2 -mx-2 rounded-xl hover:bg-error/5 transition-colors duration-200">
          <div class="w-8 h-8 rounded-xl bg-error/12 flex items-center justify-center">
            <span class="material-symbols-outlined text-base text-error">trending_down</span>
          </div>
          <div class="flex-1 flex items-center justify-between">
            <p class="text-caption text-content-subtle">Saídas</p>
            <p class="text-body-sm font-semibold text-error">{{ formatCurrency(saidas) }}</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
