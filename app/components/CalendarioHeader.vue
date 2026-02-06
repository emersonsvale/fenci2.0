<script setup lang="ts">
import { ref } from 'vue'
import type { LancamentoType } from '../composables/useLancamento'
import LancamentoDropdown from './LancamentoDropdown.vue'

/**
 * CalendarioHeader - Header da página de calendário
 * Exibe saudação, frase motivacional, navegação de mês e botão de lançamento
 */

export interface CalendarioHeaderProps {
  userName: string
  greeting: string
  quote: { text: string; author: string }
  monthName: string
  year: number
}

const props = defineProps<CalendarioHeaderProps>()

const emit = defineEmits<{
  'previous-month': []
  'next-month': []
  'open-lancamento': [type: LancamentoType]
}>()

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
  <header id="calendario-header" class="mb-5">
    <!-- Top Row: Greeting + Actions -->
    <div class="flex items-start justify-between mb-4">
      <!-- Greeting & Quote -->
      <div>
        <h1 class="text-heading-lg text-content-primary">
          Olá, {{ greeting.toLowerCase() }}, {{ userName }}!
        </h1>
        <p class="text-body-sm text-content-tertiary flex items-center gap-1 mt-1">
          <span class="text-warning">!</span>
          "{{ quote.text }}" – {{ quote.author }}
        </p>
      </div>

      <!-- Lancamento Button -->
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

    <!-- Month Navigation -->
    <div class="flex items-center gap-3">
      <button
        type="button"
        class="w-8 h-8 rounded-full border border-border-light flex items-center justify-center hover:bg-surface-light-tertiary transition-colors"
        @click="emit('previous-month')"
      >
        <span class="material-symbols-outlined text-lg text-content-secondary">chevron_left</span>
      </button>
      
      <span class="text-body-md font-medium text-content-primary capitalize">
        {{ monthName }} {{ year }}
      </span>
      
      <button
        type="button"
        class="w-8 h-8 rounded-full border border-border-light flex items-center justify-center hover:bg-surface-light-tertiary transition-colors"
        @click="emit('next-month')"
      >
        <span class="material-symbols-outlined text-lg text-content-secondary">chevron_right</span>
      </button>
    </div>
  </header>
</template>
