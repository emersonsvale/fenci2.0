<script setup lang="ts">
import { ref, computed } from 'vue'

/**
 * CreditCardWidget - Widget de cartões de crédito
 * Exibe os cartões do usuário com carrossel
 */

export interface CreditCard {
  id: string
  name: string
  lastDigits: string
  brand: 'visa' | 'mastercard' | 'elo' | 'amex' | 'hipercard' | 'other'
  color: string
  limit: number
  used: number
}

export interface CreditCardWidgetProps {
  cards: CreditCard[]
  loading?: boolean
}

const props = withDefaults(defineProps<CreditCardWidgetProps>(), {
  loading: false,
})

const emit = defineEmits<{
  'card-click': [card: CreditCard]
  'add-card': []
}>()

const currentIndex = ref(0)

function nextCard() {
  if (currentIndex.value < props.cards.length - 1) {
    currentIndex.value++
  } else {
    currentIndex.value = 0
  }
}

function prevCard() {
  if (currentIndex.value > 0) {
    currentIndex.value--
  } else {
    currentIndex.value = props.cards.length - 1
  }
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value)
}

const currentCard = computed(() => props.cards[currentIndex.value])

const availableLimit = computed(() => {
  if (!currentCard.value) return 0
  return currentCard.value.limit - currentCard.value.used
})
</script>

<template>
  <div id="credit-card-widget" class="card p-5">
    <!-- Header -->
    <div class="flex items-center justify-between mb-3">
      <span class="text-caption font-medium text-content-subtle uppercase tracking-wider">Cartões</span>
      <div v-if="cards.length > 1" class="flex items-center gap-1">
        <button
          type="button"
          class="p-1 rounded-lg hover:bg-surface-overlay transition-colors"
          @click="prevCard"
        >
          <span class="material-symbols-outlined text-lg text-content-subtle">chevron_left</span>
        </button>
        <button
          type="button"
          class="p-1 rounded-lg hover:bg-surface-overlay transition-colors"
          @click="nextCard"
        >
          <span class="material-symbols-outlined text-lg text-content-subtle">chevron_right</span>
        </button>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="space-y-3">
      <div class="skeleton h-32 rounded-xl" />
    </div>

    <!-- Card Display -->
    <div v-else-if="currentCard" class="space-y-3">
      <!-- Credit Card Visual -->
      <div
        class="credit-card-visual"
        :style="{ background: `linear-gradient(135deg, ${currentCard.color}, ${currentCard.color}dd)` }"
        @click="emit('card-click', currentCard)"
      >
        <!-- Card Content -->
        <div class="flex items-start justify-between mb-4">
          <p class="text-white font-medium text-body-sm">{{ currentCard.name }}</p>
          <div class="w-8 h-5 bg-yellow-400/90 rounded-sm" />
        </div>

        <!-- Card Number -->
        <p class="text-white/90 font-mono text-body-sm tracking-widest mb-4">
          •••• •••• •••• {{ currentCard.lastDigits }}
        </p>

        <!-- Card Footer -->
        <div class="flex items-end justify-between">
          <div>
            <p class="text-white/70 text-caption">Disponível</p>
            <p class="text-white font-bold text-heading-sm">
              {{ formatCurrency(availableLimit) }}
            </p>
          </div>
          <div class="text-right">
            <p class="text-white/70 text-caption">Usado</p>
            <p class="text-white/90 font-semibold text-body-sm">
              {{ formatCurrency(currentCard.used) }}
            </p>
          </div>
        </div>
      </div>

      <!-- Card Indicators -->
      <div v-if="cards.length > 1" class="flex justify-center gap-1.5">
        <button
          v-for="(card, index) in cards"
          :key="card.id"
          type="button"
          class="w-2 h-2 rounded-full transition-all duration-200"
          :class="index === currentIndex ? 'bg-primary w-4' : 'bg-surface-overlay'"
          @click="currentIndex = index"
        />
      </div>
    </div>

    <!-- Empty State -->
    <div v-else class="text-center py-6">
      <span class="material-symbols-outlined text-4xl text-content-subtle mb-2 block opacity-50">credit_card_off</span>
      <p class="text-body-sm text-content-muted mb-3">Nenhum cartão cadastrado</p>
      <button
        type="button"
        class="text-primary text-body-sm font-medium hover:text-primary-600 transition-colors"
        @click="emit('add-card')"
      >
        + Adicionar cartão
      </button>
    </div>
  </div>
</template>

<style scoped>
.credit-card-visual {
  @apply relative p-4 rounded-xl overflow-hidden cursor-pointer
         min-h-[140px] transition-all duration-300
         hover:shadow-lg hover:scale-[1.02];
}
</style>
