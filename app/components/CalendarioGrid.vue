<script setup lang="ts">
import type { DayData } from '../composables/useCalendario'
import CalendarioDayCell from './CalendarioDayCell.vue'

/**
 * CalendarioGrid - Grid do calendário com dias da semana
 */

export interface CalendarioGridProps {
  days: DayData[]
  loading?: boolean
}

defineProps<CalendarioGridProps>()

const emit = defineEmits<{
  'select-date': [date: Date]
}>()

const weekDays = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab', 'Dom']
</script>

<template>
  <div
    id="calendario-grid"
    class="calendario-container rounded-xl overflow-hidden border border-border-light/80 dark:border-border-dark/50 shadow-xs"
  >
    <!-- Week Days Header -->
    <div class="week-header">
      <div
        v-for="day in weekDays"
        :key="day"
        class="py-3 text-center text-body-sm font-medium text-content-subtle"
      >
        {{ day }}
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="days-grid p-2">
      <div
        v-for="i in 42"
        :key="i"
        class="min-h-[100px] rounded-lg animate-pulse bg-surface-light-tertiary dark:bg-surface-dark-tertiary"
      />
    </div>

    <!-- Calendar Grid -->
    <div v-else class="days-grid p-2">
      <CalendarioDayCell
        v-for="(dayData, index) in days"
        :key="`${dayData.date.getTime()}-${index}`"
        :day-data="dayData"
        @select="emit('select-date', $event)"
      />
    </div>
  </div>
</template>

<style scoped>
.calendario-container {
  @apply bg-surface-light-secondary dark:bg-surface-dark-secondary;
}

.week-header {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  @apply border-b border-border-light/80 dark:border-border-dark/50 bg-surface-light-tertiary dark:bg-surface-dark-tertiary;
}

.days-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 6px;
}
</style>
