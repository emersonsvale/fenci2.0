<script setup lang="ts">
import type { DaySummary, CalendarioTransaction } from '../composables/useCalendario'

/**
 * CalendarioSidebar - Sidebar lateral com detalhes do dia selecionado
 */

export interface CalendarioSidebarProps {
  selectedDate: Date
  daySummary: DaySummary
  loading?: boolean
}

defineProps<CalendarioSidebarProps>()

// Formatar data para exibição
function formatDate(date: Date): string {
  const day = date.getDate().toString().padStart(2, '0')
  const month = date.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '')
  return `${day} de ${month}.`
}

// Formatar valor em BRL
function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
  }).format(value)
}

// Obter ícone baseado no tipo
function getTransactionIcon(transaction: CalendarioTransaction): string {
  if (transaction.type === 'income') return 'add_circle'
  if (transaction.type === 'expense') return 'remove_circle'
  return 'swap_horiz'
}

// Obter cor do valor (entrada = sucesso, saída = erro, transferência = neutro)
function getAmountColor(transaction: CalendarioTransaction): string {
  if (transaction.type === 'income') return 'text-primary'
  if (transaction.type === 'expense') return 'text-error'
  return 'text-content-main'
}

// Valor absoluto para exibição (backend pode armazenar despesa como negativa)
function getDisplayAmount(transaction: CalendarioTransaction): number {
  return Math.abs(Number(transaction.amount))
}

// Sinal para exibição
function getAmountSign(transaction: CalendarioTransaction): string {
  if (transaction.type === 'income') return '+'
  if (transaction.type === 'expense') return '-'
  return ''
}

// Obter label do status
function getStatusLabel(status: string | null): string {
  switch (status) {
    case 'pending': return 'Aguardando'
    case 'confirmed': return 'Confirmado'
    case 'cancelled': return 'Cancelado'
    default: return 'Aguardando'
  }
}
</script>

<template>
  <aside id="calendario-sidebar" class="w-[320px] flex-shrink-0 space-y-4">
    <!-- Day Summary Card -->
    <div class="bg-surface-elevated rounded-xl p-5 shadow-xs border border-default-subtle">
      <h3 class="text-body-sm text-content-muted mb-1">Valores do dia</h3>
      <p class="text-display-sm text-content-main capitalize">{{ formatDate(selectedDate) }}</p>
      
      <!-- Totals -->
      <div class="flex gap-4 mt-4">
        <div>
          <p class="text-caption text-content-subtle">Total entradas</p>
          <p class="text-heading-sm text-primary font-semibold">
            {{ formatCurrency(daySummary.totalEntradas) }}
          </p>
        </div>
        <div>
          <p class="text-caption text-content-subtle">Total saídas</p>
          <p class="text-heading-sm text-error font-semibold">
            {{ formatCurrency(daySummary.totalSaidas) }}
          </p>
        </div>
      </div>
    </div>

    <!-- Transactions List -->
    <div class="bg-surface-elevated rounded-xl p-5 shadow-xs border border-default-subtle">
      <h3 class="text-body-md font-semibold text-content-main mb-4">Transações</h3>
      
      <!-- Loading -->
      <div v-if="loading" class="space-y-3">
        <div v-for="i in 3" :key="i" class="flex items-center gap-3">
          <div class="w-8 h-8 rounded-full bg-surface-overlay animate-pulse" />
          <div class="flex-1">
            <div class="h-4 w-3/4 bg-surface-overlay rounded animate-pulse mb-1" />
            <div class="h-3 w-1/2 bg-surface-overlay rounded animate-pulse" />
          </div>
        </div>
      </div>

      <!-- Empty State -->
      <div
        v-else-if="daySummary.transactions.length === 0"
        class="text-center py-8"
      >
        <span class="material-symbols-outlined text-4xl text-content-subtle mb-2 block">event_busy</span>
        <p class="text-body-sm text-content-subtle">Nenhuma transação neste dia</p>
      </div>

      <!-- Transactions -->
      <div v-else class="space-y-1">
        <div
          v-for="transaction in daySummary.transactions"
          :key="transaction.id"
          class="flex items-start gap-3 p-2.5 rounded-lg hover:bg-surface-overlay transition-colors"
        >
          <!-- Icon -->
          <div
            class="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
            :class="transaction.type === 'income' ? 'bg-primary/10' : 'bg-surface-overlay'"
          >
            <span
              class="material-symbols-outlined text-lg"
              :class="transaction.type === 'income' ? 'text-primary' : 'text-content-muted'"
            >
              {{ getTransactionIcon(transaction) }}
            </span>
          </div>

          <!-- Info -->
          <div class="flex-1 min-w-0">
            <p class="text-body-sm font-medium text-content-main truncate">
              {{ transaction.description }}
            </p>
            <div class="flex items-center gap-1 text-caption text-content-subtle">
              <span class="material-symbols-outlined text-sm">schedule</span>
              {{ getStatusLabel(transaction.status) }}
            </div>
          </div>

          <!-- Amount -->
          <p class="text-body-sm font-semibold flex-shrink-0" :class="getAmountColor(transaction)">
            {{ getAmountSign(transaction) }}{{ formatCurrency(getDisplayAmount(transaction)) }}
          </p>
        </div>
      </div>
    </div>
  </aside>
</template>
