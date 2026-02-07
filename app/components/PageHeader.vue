<script setup lang="ts">
import { computed, ref } from 'vue'
import type { LancamentoType } from '../composables/useLancamento'
import LancamentoDropdown from './LancamentoDropdown.vue'
import PeriodSelector from './PeriodSelector.vue'
import NotificationCenter from './NotificationCenter.vue'

/**
 * PageHeader - Header padrão do sistema
 * Saudação, citação do dia, seletor de período e botão Lançamento
 */

const DEFAULT_QUOTES = [
  { text: 'Uma jornada de mil milhas começa com o primeiro passo.', author: 'Lao Tsé' },
  { text: 'O segredo para ir em frente é começar.', author: 'Mark Twain' },
  { text: 'Não é o mais forte que sobrevive, mas o que melhor se adapta às mudanças.', author: 'Charles Darwin' },
  { text: 'Faça do seu dinheiro um servo, não um mestre.', author: 'Francis Bacon' },
  { text: 'A economia é a base da liberdade.', author: 'Calvin Coolidge' },
  { text: 'O dinheiro é um excelente servo, mas um péssimo mestre.', author: 'P.T. Barnum' },
]

export interface PageHeaderProps {
  userName: string
  period?: { month: number; year: number }
  /** Citação exibida abaixo da saudação. Se não informada, usa citação do dia. */
  quote?: { text: string; author: string }
}

const props = withDefaults(defineProps<PageHeaderProps>(), {
  period: undefined,
  quote: undefined,
})

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

const displayQuote = computed(() => {
  if (props.quote) return props.quote
  const dayOfMonth = new Date().getDate()
  return DEFAULT_QUOTES[dayOfMonth % DEFAULT_QUOTES.length]
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
  <header id="page-header" class="mb-4 lg:mb-6 w-full">
    <div class="flex flex-col gap-3 lg:gap-4">
      <!-- Top: Greeting + Actions -->
      <div class="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        <!-- Greeting + Quote -->
        <div class="min-w-0 flex-1">
          <h1 class="text-heading-sm lg:text-heading-lg text-content-main truncate">
            Olá, {{ greeting }}, {{ userName }}!
          </h1>
          <p class="text-caption lg:text-body-sm text-content-subtle mt-1 flex items-start gap-1 leading-snug">
            <span class="material-symbols-outlined text-base shrink-0 mt-0.5">format_quote</span>
            <span class="line-clamp-2">"{{ displayQuote.text }}" – {{ displayQuote.author }}</span>
          </p>
        </div>

        <!-- Actions: notificações + slot customizado ou padrão (período + lançamento) -->
        <div class="flex items-center gap-2 lg:gap-3 flex-wrap sm:flex-nowrap">
          <NotificationCenter />
          <slot name="actions">
            <template v-if="period !== undefined">
              <PeriodSelector
                :model-value="period"
                @update:model-value="emit('update:period', $event)"
              />
            </template>
            <div class="relative">
              <button
                type="button"
                class="btn btn-primary !w-auto px-4 lg:px-6 py-2 lg:py-2.5 rounded-full inline-flex items-center gap-1.5 lg:gap-2 text-body-sm"
                @click.stop="toggleDropdown"
              >
                <span class="material-symbols-outlined text-lg">add</span>
                <span class="hidden sm:inline">Lançamento</span>
              </button>
              <LancamentoDropdown
                :is-open="isDropdownOpen"
                @close="closeDropdown"
                @select="handleSelectLancamento"
              />
            </div>
          </slot>
        </div>
      </div>
    </div>
  </header>
</template>
