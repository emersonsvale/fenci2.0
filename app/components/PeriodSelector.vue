<script setup lang="ts">
import { ref, computed } from 'vue'

/**
 * PeriodSelector - Seletor de período (mês/ano)
 * Usado para filtrar dados por período em várias telas
 */

export interface PeriodSelectorProps {
  modelValue: { month: number; year: number }
}

const props = defineProps<PeriodSelectorProps>()

const emit = defineEmits<{
  'update:modelValue': [value: { month: number; year: number }]
}>()

const months = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
]

const currentPeriod = computed(() => {
  return `${months[props.modelValue.month]} ${props.modelValue.year}`
})

const years = computed(() => {
  const currentYear = new Date().getFullYear()
  return Array.from({ length: 5 }, (_, i) => currentYear - 2 + i)
})

const isDropdownOpen = ref(false)
const selectedMonth = ref(props.modelValue.month)
const selectedYear = ref(props.modelValue.year)

function goToPreviousPeriod() {
  let newMonth = props.modelValue.month - 1
  let newYear = props.modelValue.year

  if (newMonth < 0) {
    newMonth = 11
    newYear -= 1
  }

  emit('update:modelValue', { month: newMonth, year: newYear })
}

function goToNextPeriod() {
  let newMonth = props.modelValue.month + 1
  let newYear = props.modelValue.year

  if (newMonth > 11) {
    newMonth = 0
    newYear += 1
  }

  emit('update:modelValue', { month: newMonth, year: newYear })
}

function toggleDropdown() {
  isDropdownOpen.value = !isDropdownOpen.value
  if (isDropdownOpen.value) {
    selectedMonth.value = props.modelValue.month
    selectedYear.value = props.modelValue.year
  }
}

function applySelection() {
  emit('update:modelValue', { month: selectedMonth.value, year: selectedYear.value })
  isDropdownOpen.value = false
}

function closeDropdown() {
  isDropdownOpen.value = false
}
</script>

<template>
  <div id="period-selector" class="relative inline-flex items-center gap-2">
    <!-- Previous Button -->
    <button
      type="button"
      class="period-nav-btn"
      aria-label="Período anterior"
      @click="goToPreviousPeriod"
    >
      <span class="material-symbols-outlined text-lg">chevron_left</span>
    </button>

    <!-- Current Period Display -->
    <button
      type="button"
      class="period-display"
      @click="toggleDropdown"
    >
      <span>{{ currentPeriod }}</span>
      <span class="material-symbols-outlined text-lg transition-transform" :class="{ 'rotate-180': isDropdownOpen }">
        expand_more
      </span>
    </button>

    <!-- Next Button -->
    <button
      type="button"
      class="period-nav-btn"
      aria-label="Próximo período"
      @click="goToNextPeriod"
    >
      <span class="material-symbols-outlined text-lg">chevron_right</span>
    </button>

    <!-- Dropdown -->
    <Transition name="dropdown">
      <div
        v-if="isDropdownOpen"
        class="period-dropdown"
      >
        <!-- Backdrop -->
        <div class="fixed inset-0" @click="closeDropdown" />

        <!-- Content -->
        <div class="relative bg-surface-light dark:bg-surface-dark-secondary rounded-xl shadow-lg border border-border-light dark:border-border-dark p-4 min-w-[280px]">
          <!-- Year Selector -->
          <div class="mb-4">
            <label class="text-caption text-content-secondary dark:text-content-secondary-dark mb-2 block">Ano</label>
            <div class="flex gap-2 flex-wrap">
              <button
                v-for="year in years"
                :key="year"
                type="button"
                class="year-btn"
                :class="{ 'year-btn-active': selectedYear === year }"
                @click="selectedYear = year"
              >
                {{ year }}
              </button>
            </div>
          </div>

          <!-- Month Selector -->
          <div class="mb-4">
            <label class="text-caption text-content-secondary dark:text-content-secondary-dark mb-2 block">Mês</label>
            <div class="grid grid-cols-3 gap-2">
              <button
                v-for="(month, index) in months"
                :key="index"
                type="button"
                class="month-btn"
                :class="{ 'month-btn-active': selectedMonth === index }"
                @click="selectedMonth = index"
              >
                {{ month.substring(0, 3) }}
              </button>
            </div>
          </div>

          <!-- Apply Button -->
          <button
            type="button"
            class="w-full btn-primary btn-sm"
            @click="applySelection"
          >
            Aplicar
          </button>
        </div>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.period-nav-btn {
  @apply p-2 rounded-lg
         text-content-secondary dark:text-content-secondary-dark
         hover:bg-surface-light-tertiary dark:hover:bg-surface-dark-tertiary
         transition-colors duration-200;
}

.period-display {
  @apply flex items-center gap-2 px-4 py-2 rounded-lg
         text-body-sm font-medium text-content-primary dark:text-content-primary-dark
         bg-surface-light dark:bg-surface-dark-secondary
         border border-border-light dark:border-border-dark
         hover:border-primary dark:hover:border-primary
         transition-all duration-200;
}

.period-dropdown {
  @apply absolute top-full left-1/2 -translate-x-1/2 mt-2 z-dropdown;
}

.year-btn {
  @apply px-3 py-1.5 rounded-lg text-body-sm
         text-content-secondary dark:text-content-secondary-dark
         hover:bg-surface-light-tertiary dark:hover:bg-surface-dark-tertiary
         transition-colors duration-200;
}

.year-btn-active {
  @apply bg-primary text-white hover:bg-primary-600;
}

.month-btn {
  @apply px-2 py-2 rounded-lg text-body-sm text-center
         text-content-secondary dark:text-content-secondary-dark
         hover:bg-surface-light-tertiary dark:hover:bg-surface-dark-tertiary
         transition-colors duration-200;
}

.month-btn-active {
  @apply bg-primary text-white hover:bg-primary-600;
}

/* Dropdown Animation */
.dropdown-enter-active,
.dropdown-leave-active {
  transition: all 0.2s ease;
}

.dropdown-enter-from,
.dropdown-leave-to {
  opacity: 0;
  transform: translateX(-50%) translateY(-8px);
}
</style>
