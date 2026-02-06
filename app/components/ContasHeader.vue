<script setup lang="ts">
import { computed, ref } from 'vue'
import PeriodSelector from './PeriodSelector.vue'
import LancamentoDropdown from './LancamentoDropdown.vue'
import type { LancamentoType } from '../composables/useLancamento'

/**
 * ContasHeader - Header da página de Contas
 * Alinhado ao DashboardHeader: saudação, seletor de período e botão Lançamento
 */

export interface ContasHeaderProps {
  userName: string
  period: { month: number; year: number }
}

const props = defineProps<ContasHeaderProps>()

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
  <header id="contas-header" class="flex items-center justify-between mb-5">
    <!-- Greeting (igual ao Dashboard) -->
    <div>
      <h1 class="text-heading-lg text-content-main">
        Olá, {{ userName }}
      </h1>
      <p class="text-body-sm text-content-subtle">
        {{ greeting }}
      </p>
    </div>

    <!-- Actions -->
    <div class="flex items-center gap-3">
      <PeriodSelector
        :model-value="period"
        @update:model-value="emit('update:period', $event)"
      />

      <div class="relative">
        <button
          type="button"
          class="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-error text-white font-medium text-body-sm hover:bg-red-600 transition-colors"
          @click.stop="toggleDropdown"
        >
          <span class="material-symbols-outlined text-lg">add</span>
          Lançamento
        </button>

        <LancamentoDropdown
          :is-open="isDropdownOpen"
          @close="closeDropdown"
          @select="handleSelectLancamento"
        />
      </div>
    </div>
  </header>
</template>
