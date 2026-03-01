<script setup lang="ts">
import { computed, ref } from 'vue'
import type { LancamentoType } from '../composables/useLancamento'
import LancamentoDropdown from './LancamentoDropdown.vue'
import PeriodSelector from './PeriodSelector.vue'

/**
 * DashboardHeader - Header do dashboard
 * Exibe saudaÃ§Ã£o, seletor de perÃ­odo e botÃ£o de aÃ§Ã£o
 */

export interface DashboardHeaderProps {
  userName: string
  period: { month: number; year: number }
}

const props = defineProps<DashboardHeaderProps>()

const emit = defineEmits<{
  'update:period': [value: { month: number; year: number }]
  'open-lancamento': [type: LancamentoType]
}>()

const greeting = computed(() => {
  const hour = new Date().getHours()
  if (hour < 12) return 'Bom dia'
  if (hour < 18) return 'Boa tarde'
  return 'Boa noite'
})

// Estado do dropdown
const isDropdownOpen = ref(false)

function toggleDropdown() {
  isDropdownOpen.value = !isDropdownOpen.value
}

function closeDropdown() {
  isDropdownOpen.value = false
}

function handleSelectLancamento(type: LancamentoType) {
  isDropdownOpen.value = false
  emit('open-lancamento', type)
}
</script>

<template>
  <header id="dashboard-header" class="flex items-center justify-between mb-5">
    <!-- Greeting -->
    <div>
      <h1 class="text-heading-lg font-bold text-content-main">
        {{ greeting }}, <span class="text-primary">{{ userName }}</span>
      </h1>
    </div>

    <!-- Actions -->
    <div class="flex items-center gap-3">
      <!-- Period Selector -->
      <PeriodSelector
        :model-value="period"
        @update:model-value="emit('update:period', $event)"
      />

      <!-- New Lancamento Button with Dropdown -->
      <div class="relative">
        <button
          type="button"
          class="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-white font-medium text-body-sm hover:bg-primary-600 shadow-primary transition-all duration-200 hover:-translate-y-[1px]"
          @click.stop="toggleDropdown"
        >
          <span class="material-symbols-outlined text-lg">add</span>
          Lançamento
        </button>

        <!-- Dropdown Menu -->
        <LancamentoDropdown
          :is-open="isDropdownOpen"
          @close="closeDropdown"
          @select="handleSelectLancamento"
        />
      </div>
    </div>
  </header>
</template>
