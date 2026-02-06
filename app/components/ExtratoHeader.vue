<script setup lang="ts">
import { computed } from 'vue'
import type { LancamentoType } from '../composables/useLancamento'
import LancamentoDropdown from './LancamentoDropdown.vue'
import PeriodSelector from './PeriodSelector.vue'
import { ref } from 'vue'

/**
 * ExtratoHeader - Header da página de extratos
 * Exibe saudação, citação do dia, seletor de período e botão de ação
 */

export interface ExtratoHeaderProps {
  userName: string
  period: { month: number; year: number }
  quote: { text: string; author: string }
}

const props = defineProps<ExtratoHeaderProps>()

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
  <header id="extrato-header" class="mb-5">
    <!-- Top row: Greeting + Actions -->
    <div class="flex items-start justify-between">
      <!-- Greeting + Quote -->
      <div>
        <h1 class="text-heading-lg text-content-main">
          Olá, {{ greeting }}, {{ userName }}!
        </h1>
        <p class="text-body-sm text-content-subtle mt-1 flex items-center gap-1">
          <span class="material-symbols-outlined text-base">format_quote</span>
          "{{ quote.text }}" – {{ quote.author }}
        </p>
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
            class="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-white font-medium text-body-sm hover:bg-primary-600 transition-colors"
            @click.stop="toggleDropdown"
          >
            Lançamento
            <span class="material-symbols-outlined text-lg">add</span>
          </button>

          <!-- Dropdown Menu -->
          <LancamentoDropdown
            :is-open="isDropdownOpen"
            @close="closeDropdown"
            @select="handleSelectLancamento"
          />
        </div>
      </div>
    </div>
  </header>
</template>
