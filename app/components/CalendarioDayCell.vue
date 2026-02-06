<script setup lang="ts">
import type { DayData } from '../composables/useCalendario'

/**
 * CalendarioDayCell - Célula de um dia no calendário
 * Exibe o número do dia e resumo de transações
 */

export interface CalendarioDayCellProps {
  dayData: DayData
}

const props = defineProps<CalendarioDayCellProps>()

const emit = defineEmits<{
  select: [date: Date]
}>()

// Formatar valor em BRL
function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
  }).format(value)
}

// Formatar valor compacto (sem símbolo, só número)
function formatCompact(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)
}
</script>

<template>
  <button
    type="button"
    class="calendar-cell"
    :class="{
      'calendar-cell-current': dayData.isCurrentMonth,
      'calendar-cell-other': !dayData.isCurrentMonth,
      'calendar-cell-today': dayData.isToday,
      'calendar-cell-selected': dayData.isSelected,
    }"
    @click="emit('select', dayData.date)"
  >
    <!-- Day Number -->
    <span
      class="day-number"
      :class="{
        'day-number-today': dayData.isToday,
        'day-number-selected': dayData.isSelected,
      }"
    >
      {{ dayData.day.toString().padStart(2, '0') }}
    </span>

    <!-- Transaction Summary -->
    <div v-if="dayData.isCurrentMonth && (dayData.totalEntradas > 0 || dayData.totalSaidas > 0)" class="transactions-summary">
      <!-- Entradas -->
      <div
        v-if="dayData.totalEntradas > 0"
        class="transaction-badge badge-income"
      >
        + R${{ formatCompact(dayData.totalEntradas) }}
      </div>
      
      <!-- Saídas -->
      <div
        v-if="dayData.totalSaidas > 0"
        class="transaction-badge badge-expense"
      >
        - R${{ formatCompact(dayData.totalSaidas) }}
      </div>
    </div>
  </button>
</template>

<style scoped>
.calendar-cell {
  @apply relative flex flex-col items-start p-2 rounded-lg
         min-h-[100px] w-full text-left
         transition-all duration-200 ease-smooth
         bg-surface-light-tertiary dark:bg-surface-dark-tertiary
         hover:bg-surface-light-secondary dark:hover:bg-surface-dark-secondary
         border border-transparent
         hover:border-border-light/80 dark:hover:border-border-dark/50;
}

.calendar-cell-current {
  @apply bg-surface-light-secondary dark:bg-surface-dark-secondary;
}

.calendar-cell-other {
  @apply opacity-50 bg-surface-light-tertiary dark:bg-surface-dark-tertiary;
}

.calendar-cell-today {
  @apply ring-2 ring-primary ring-inset;
}

.calendar-cell-selected {
  @apply ring-2 ring-primary border-primary/30 bg-surface-light-tertiary dark:bg-surface-dark-tertiary;
}

.day-number {
  @apply text-body-sm font-medium text-content-primary dark:text-content-primary-dark mb-2;
}

.day-number-today {
  @apply text-primary font-semibold;
}

.day-number-selected {
  @apply text-content-primary dark:text-content-primary-dark font-semibold;
}

.transactions-summary {
  @apply flex flex-col gap-1 w-full mt-auto;
}

.transaction-badge {
  @apply text-caption font-medium px-2 py-0.5 rounded-md text-center;
}

.badge-income {
  @apply bg-primary/20 text-primary;
}

.badge-expense {
  @apply bg-warning/20 text-warning;
}
</style>
