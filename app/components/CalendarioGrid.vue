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
const weekDaysMobile = ['S', 'T', 'Q', 'Q', 'S', 'S', 'D']
</script>

<template>
  <div
    id="calendario-grid"
    class="calendario-container rounded-xl overflow-hidden border border-border-light/80 dark:border-border-dark/50 shadow-xs"
  >
    <!-- Week Days Header -->
    <div class="week-header">
      <div
        v-for="(day, i) in weekDays"
        :key="day"
        class="py-2 lg:py-3 text-center text-caption lg:text-body-sm font-medium text-content-subtle"
      >
        <span class="hidden sm:inline">{{ day }}</span>
        <span class="sm:hidden">{{ weekDaysMobile[i] }}</span>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="days-grid p-1 lg:p-2">
      <div
        v-for="i in 42"
        :key="i"
        class="min-h-[60px] lg:min-h-[100px] rounded-lg animate-pulse bg-surface-light-tertiary dark:bg-surface-dark-tertiary"
      />
    </div>

    <!-- Calendar Grid -->
    <div v-else class="days-grid p-1 lg:p-2">
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
  gap: 2px;
}

@media (min-width: 1024px) {
  .days-grid {
    gap: 6px;
  }
}
</style>
