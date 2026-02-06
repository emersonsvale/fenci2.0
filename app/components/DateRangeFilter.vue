<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import type { DateFilter } from '../composables/useExtrato'
import { toDDMMYYYY } from '../utils/formatDate'
import AppDateInput from './AppDateInput.vue'

/**
 * DateRangeFilter - Filtro de intervalo de datas
 * Permite selecionar data inicial e final para filtrar transações
 */

export interface DateRangeFilterProps {
  modelValue: DateFilter
}

const props = defineProps<DateRangeFilterProps>()

const emit = defineEmits<{
  'update:modelValue': [value: DateFilter]
  'clear': []
}>()

// Estado local
const isOpen = ref(false)
const localStartDate = ref(props.modelValue.startDate || '')
const localEndDate = ref(props.modelValue.endDate || '')

// Sync com props
watch(() => props.modelValue, (newValue) => {
  localStartDate.value = newValue.startDate || ''
  localEndDate.value = newValue.endDate || ''
}, { deep: true })

// Verificar se há filtro ativo
const hasFilter = computed(() => {
  return props.modelValue.startDate || props.modelValue.endDate
})

// Label do botão
const buttonLabel = computed(() => {
  if (!hasFilter.value) return 'Filtrar por data'
  
  const formatDate = (date: string) => toDDMMYYYY(date)

  if (props.modelValue.startDate && props.modelValue.endDate) {
    return `${formatDate(props.modelValue.startDate)} - ${formatDate(props.modelValue.endDate)}`
  }
  if (props.modelValue.startDate) {
    return `A partir de ${formatDate(props.modelValue.startDate)}`
  }
  if (props.modelValue.endDate) {
    return `Até ${formatDate(props.modelValue.endDate)}`
  }
  return 'Filtrar por data'
})

// Atalhos de período
const shortcuts = [
  { label: 'Hoje', getValue: () => {
    const today = new Date().toISOString().split('T')[0]
    return { startDate: today, endDate: today }
  }},
  { label: 'Últimos 7 dias', getValue: () => {
    const today = new Date()
    const start = new Date(today)
    start.setDate(start.getDate() - 6)
    return { startDate: start.toISOString().split('T')[0], endDate: today.toISOString().split('T')[0] }
  }},
  { label: 'Últimos 15 dias', getValue: () => {
    const today = new Date()
    const start = new Date(today)
    start.setDate(start.getDate() - 14)
    return { startDate: start.toISOString().split('T')[0], endDate: today.toISOString().split('T')[0] }
  }},
  { label: 'Este mês', getValue: () => {
    const today = new Date()
    const start = new Date(today.getFullYear(), today.getMonth(), 1)
    const end = new Date(today.getFullYear(), today.getMonth() + 1, 0)
    return { startDate: start.toISOString().split('T')[0], endDate: end.toISOString().split('T')[0] }
  }},
]

function toggleDropdown() {
  isOpen.value = !isOpen.value
}

function closeDropdown() {
  isOpen.value = false
}

function applyFilter() {
  emit('update:modelValue', {
    startDate: localStartDate.value || null,
    endDate: localEndDate.value || null,
  })
  closeDropdown()
}

function applyShortcut(shortcut: typeof shortcuts[0]) {
  const value = shortcut.getValue()
  localStartDate.value = value.startDate
  localEndDate.value = value.endDate
  emit('update:modelValue', value)
  closeDropdown()
}

function clearFilter() {
  localStartDate.value = ''
  localEndDate.value = ''
  emit('update:modelValue', { startDate: null, endDate: null })
  emit('clear')
  closeDropdown()
}
</script>

<template>
  <div id="date-range-filter" class="relative">
    <!-- Trigger Button -->
    <button
      type="button"
      class="inline-flex items-center gap-2 px-3 py-2 rounded-lg text-body-sm font-medium transition-all border"
      :class="hasFilter 
        ? 'bg-primary/10 text-primary border-primary/30 hover:bg-primary/20' 
        : 'bg-surface-overlay text-content-muted border-transparent hover:bg-surface-overlay/80'"
      @click="toggleDropdown"
    >
      <span class="material-symbols-outlined text-lg">calendar_month</span>
      <span>{{ buttonLabel }}</span>
      <span v-if="hasFilter" class="material-symbols-outlined text-sm" @click.stop="clearFilter">close</span>
      <span v-else class="material-symbols-outlined text-sm">expand_more</span>
    </button>

    <!-- Backdrop -->
    <Teleport to="body">
      <div
        v-if="isOpen"
        class="fixed inset-0 z-dropdown"
        @click="closeDropdown"
      />
    </Teleport>

    <!-- Dropdown -->
    <Transition
      enter-active-class="transition-all duration-200 ease-out"
      enter-from-class="opacity-0 scale-95 -translate-y-1"
      enter-to-class="opacity-100 scale-100 translate-y-0"
      leave-active-class="transition-all duration-150 ease-in"
      leave-from-class="opacity-100 scale-100 translate-y-0"
      leave-to-class="opacity-0 scale-95 -translate-y-1"
    >
      <div
        v-if="isOpen"
        class="absolute left-0 top-full mt-2 w-72 bg-surface-elevated rounded-xl shadow-lg border border-default-subtle z-popover p-4"
      >
        <!-- Atalhos -->
        <div class="mb-4">
          <p class="text-caption text-content-subtle mb-2">Atalhos</p>
          <div class="flex flex-wrap gap-2">
            <button
              v-for="shortcut in shortcuts"
              :key="shortcut.label"
              type="button"
              class="px-2.5 py-1 rounded-md text-caption font-medium bg-surface-overlay text-content-muted hover:bg-surface-overlay/70 transition-colors"
              @click="applyShortcut(shortcut)"
            >
              {{ shortcut.label }}
            </button>
          </div>
        </div>

        <!-- Separador -->
        <div class="border-t border-default-subtle my-3" />

        <!-- Inputs de data -->
        <div class="space-y-3">
          <div>
            <label class="block text-caption text-content-subtle mb-1.5">Data inicial</label>
            <AppDateInput
              v-model="localStartDate"
              input-class="w-full px-3 py-2 rounded-lg bg-surface-overlay border border-transparent text-body-sm text-content-main focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-all"
            />
          </div>
          <div>
            <label class="block text-caption text-content-subtle mb-1.5">Data final</label>
            <AppDateInput
              v-model="localEndDate"
              input-class="w-full px-3 py-2 rounded-lg bg-surface-overlay border border-transparent text-body-sm text-content-main focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-all"
            />
          </div>
        </div>

        <!-- Ações -->
        <div class="flex items-center gap-2 mt-4 pt-3 border-t border-default-subtle">
          <button
            type="button"
            class="flex-1 px-3 py-2 rounded-lg text-body-sm font-medium text-content-muted hover:bg-surface-overlay transition-colors"
            @click="clearFilter"
          >
            Limpar
          </button>
          <button
            type="button"
            class="flex-1 px-3 py-2 rounded-lg text-body-sm font-medium bg-primary text-white hover:bg-primary-600 transition-colors"
            @click="applyFilter"
          >
            Aplicar
          </button>
        </div>
      </div>
    </Transition>
  </div>
</template>
