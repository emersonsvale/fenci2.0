<script setup lang="ts">
import { computed, ref, onMounted, onUnmounted } from 'vue'
import type { LancamentoType } from '../composables/useLancamento'
import LancamentoDropdown from './LancamentoDropdown.vue'
import PeriodSelector from './PeriodSelector.vue'
import NotificationCenter from './NotificationCenter.vue'

/**
 * PageHeader - Header padrão do sistema
 * Saudação, citação do dia (rotativa por período), seletor de período e botão Lançamento
 */

type QuoteItem = { text: string; author: string }

const QUOTES_MANHA: QuoteItem[] = [
  { text: 'O sucesso é a soma de pequenos esforços repetidos dia após dia.', author: 'Robert Collier' },
  { text: 'A persistência é o caminho do êxito.', author: 'Charles Chaplin' },
  { text: 'Poupar é o primeiro passo para a liberdade financeira.', author: '' },
  { text: 'Não é o mais forte que sobrevive, mas o que melhor se adapta às mudanças.', author: 'Charles Darwin' },
  { text: 'Se você quer colher frutos no futuro, comece plantando hoje!', author: '' },
  { text: 'A disciplina é a ponte entre objetivos e realizações.', author: 'Jim Rohn' },
]

const QUOTES_TARDE: QuoteItem[] = [
  { text: 'Acredite, você pode. Você já está no meio do caminho.', author: 'Theodore Roosevelt' },
  { text: 'Gaste menos do que ganha e viva melhor do que imagina.', author: '' },
  { text: 'A felicidade não está em possuir dinheiro, mas em usá-lo com sabedoria.', author: '' },
  { text: 'Grandes conquistas exigem grandes esforços.', author: 'Heráclito' },
  { text: 'O segredo do sucesso financeiro é gastar com propósito.', author: '' },
  { text: 'Uma jornada de mil milhas começa com o primeiro passo.', author: 'Lao Tsé' },
]

const QUOTES_NOITE: QuoteItem[] = [
  { text: 'Quem cedo madruga, conquista mais oportunidades.', author: '' },
  { text: 'Planejar hoje é economizar amanhã.', author: '' },
  { text: 'O conhecimento é a melhor moeda que existe.', author: 'Benjamin Franklin' },
  { text: 'Não é sobre quanto você ganha, mas sobre quanto você economiza.', author: '' },
  { text: 'A persistência é o caminho do êxito.', author: 'Charles Chaplin' },
  { text: 'Descansar bem é parte do sucesso.', author: '' },
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

const ROTATION_INTERVAL_MS = 30_000 // 30 segundos

const greeting = computed(() => {
  const hour = new Date().getHours()
  if (hour < 12) return 'Bom dia'
  if (hour < 18) return 'Boa tarde'
  return 'Boa noite'
})

const quotesForPeriod = computed((): QuoteItem[] => {
  const hour = new Date().getHours()
  if (hour < 12) return QUOTES_MANHA
  if (hour < 18) return QUOTES_TARDE
  return QUOTES_NOITE
})

const currentQuoteIndex = ref(0)

const displayQuote = computed(() => {
  if (props.quote) return props.quote
  const list = quotesForPeriod.value
  const index = currentQuoteIndex.value % list.length
  return list[index]
})

let rotationTimer: ReturnType<typeof setInterval> | null = null

onMounted(() => {
  rotationTimer = setInterval(() => {
    currentQuoteIndex.value += 1
  }, ROTATION_INTERVAL_MS)
})

onUnmounted(() => {
  if (rotationTimer) clearInterval(rotationTimer)
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
          <p class="text-caption lg:text-body-sm text-content-subtle mt-1 leading-snug line-clamp-2">
            "{{ displayQuote.text }}"<template v-if="displayQuote.author"> – {{ displayQuote.author }}</template>
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
