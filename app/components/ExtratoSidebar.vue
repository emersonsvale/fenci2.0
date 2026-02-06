<script setup lang="ts">
import { computed, ref, onMounted, onUnmounted, watch } from 'vue'
import type { ExtratoCreditCard } from '../composables/useExtrato'
import { useCurrency } from '~/composables/useCurrency'
import ContasPagasCard from './ContasPagasCard.vue'

const { formatCurrency } = useCurrency()

/** Quantidade de transações exibidas por cartão antes do "Ver mais" */
const TRANSACTIONS_PER_CARD = 5

/** Carrossel: largura do card e gap entre slides */
const CARD_WIDTH_PX = 260
const CARD_GAP_PX = 12

/** Duração da transição entre slides (ms) */
const CAROUSEL_DURATION_MS = 800

/** Atraso do autoplay entre slides (ms) */
const CAROUSEL_AUTOPLAY_DELAY_MS = 4000

/** Escala dos slides inativos (o ativo fica 1) */
const CAROUSEL_INACTIVE_SCALE = 0.78

/**
 * ExtratoSidebar - Sidebar da página de extratos
 * Exibe cartões de crédito em carrossel e resumo de contas pagas
 */

export interface ExtratoSidebarProps {
  creditCards: ExtratoCreditCard[]
  totalCreditCards: number
  contasPagas: { pagas: number; total: number }
  monthName: string
  loading?: boolean
}

const props = withDefaults(defineProps<ExtratoSidebarProps>(), {
  loading: false,
})

const emit = defineEmits<{
  'view-more-cards': []
  'card-click': [cardId: string]
}>()


function getDisplayedTransactions(card: ExtratoCreditCard) {
  return card.transactions.slice(0, TRANSACTIONS_PER_CARD)
}

function hasMoreTransactions(card: ExtratoCreditCard) {
  return card.transactions.length > TRANSACTIONS_PER_CARD
}

function onCardClick(cardId: string, event: Event) {
  const target = event.target as HTMLElement
  if (target.closest('[data-ver-mais]')) {
    event.stopPropagation()
    emit('view-more-cards')
  } else {
    emit('card-click', cardId)
  }
}

// --- Carrossel ---
const currentIndex = ref(0)
const isHovering = ref(false)
const prefersReducedMotion = ref(false)
const viewportRef = ref<HTMLElement | null>(null)
const viewportWidth = ref(0)

const totalSlides = computed(() => props.creditCards.length)

const dotIndices = computed(() =>
  Array.from({ length: totalSlides.value }, (_, i) => i),
)

/** Centraliza o slide ativo: centro do viewport = centro do slide ativo */
const trackOffsetPx = computed(() => {
  if (totalSlides.value === 0) return 0
  const index = currentIndex.value % totalSlides.value
  const w = viewportWidth.value
  if (w > 0) {
    return w / 2 - CARD_WIDTH_PX / 2 - index * (CARD_WIDTH_PX + CARD_GAP_PX)
  }
  return -(index * (CARD_WIDTH_PX + CARD_GAP_PX))
})

function measureViewport() {
  if (viewportRef.value) viewportWidth.value = viewportRef.value.clientWidth
}

function goTo(index: number) {
  if (totalSlides.value === 0) return
  currentIndex.value = ((index % totalSlides.value) + totalSlides.value) % totalSlides.value
}

function next() {
  if (totalSlides.value === 0) return
  currentIndex.value = (currentIndex.value + 1) % totalSlides.value
}

let autoplayTimer: ReturnType<typeof setInterval> | null = null

function startAutoplay() {
  if (prefersReducedMotion.value || totalSlides.value <= 1) return
  autoplayTimer = setInterval(() => {
    next()
  }, CAROUSEL_AUTOPLAY_DELAY_MS)
}

function stopAutoplay() {
  if (autoplayTimer) {
    clearInterval(autoplayTimer)
    autoplayTimer = null
  }
}

let resizeObserver: ResizeObserver | null = null

onMounted(() => {
  if (typeof window === 'undefined') return
  const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
  prefersReducedMotion.value = mq.matches
  mq.addEventListener('change', (e) => { prefersReducedMotion.value = e.matches })
  measureViewport()
  if (viewportRef.value && typeof ResizeObserver !== 'undefined') {
    resizeObserver = new ResizeObserver(() => measureViewport())
    resizeObserver.observe(viewportRef.value)
  }
  window.addEventListener('resize', measureViewport)
  startAutoplay()
})

onUnmounted(() => {
  stopAutoplay()
  resizeObserver?.disconnect()
  window.removeEventListener('resize', measureViewport)
})

watch([() => props.creditCards.length, prefersReducedMotion], () => {
  stopAutoplay()
  if (!prefersReducedMotion.value && totalSlides.value > 1) startAutoplay()
})

watch(currentIndex, () => {
  if (currentIndex.value >= totalSlides.value && totalSlides.value > 0) {
    currentIndex.value = 0
  }
})

function onCarouselMouseEnter() {
  isHovering.value = true
  stopAutoplay()
}

function onCarouselMouseLeave() {
  isHovering.value = false
  if (!prefersReducedMotion.value && totalSlides.value > 1) startAutoplay()
}
</script>

<template>
  <aside id="extrato-sidebar" class="space-y-4">
    <!-- Seus cartões - layout horizontal como no design -->
    <div class="bg-surface-elevated rounded-xl p-4 shadow-xs border border-default-subtle">
      <!-- Cabeçalho: título + total geral -->
      <div class="flex items-center justify-between mb-4">
        <span class="text-body-sm font-medium text-content-muted">Seus cartões</span>
        <span class="text-heading-sm font-bold text-content-main">
          {{ formatCurrency(totalCreditCards) }}
        </span>
      </div>

      <!-- Loading -->
      <div v-if="loading" class="flex gap-3 overflow-hidden">
        <div v-for="i in 2" :key="i" class="min-w-[260px] flex-shrink-0 rounded-lg bg-surface-overlay/50 p-4 animate-pulse">
          <div class="flex items-center gap-2 mb-3">
            <div class="w-7 h-5 rounded bg-surface-overlay" />
            <div class="h-4 w-16 bg-surface-overlay rounded" />
          </div>
          <div class="space-y-2">
            <div v-for="j in 4" :key="j" class="h-3 bg-surface-overlay rounded" />
          </div>
        </div>
      </div>

      <!-- Carrossel de cartões -->
      <div v-else class="-mx-1">
        <!-- Empty State -->
        <div
          v-if="creditCards.length === 0"
          class="text-center py-6"
        >
          <span class="material-symbols-outlined text-2xl text-content-subtle mb-2 block">
            credit_card_off
          </span>
          <p class="text-caption text-content-subtle">
            Nenhum cartão com transações
          </p>
        </div>

        <div
          v-else
          class="extrato-carousel"
          @mouseenter="onCarouselMouseEnter"
          @mouseleave="onCarouselMouseLeave"
        >
          <div
            ref="viewportRef"
            class="extrato-carousel-viewport overflow-hidden"
          >
            <div
              class="extrato-carousel-track flex gap-3 items-center"
              :style="{
                transform: `translateX(${trackOffsetPx}px)`,
                transition: `transform ${CAROUSEL_DURATION_MS}ms ease-out`,
              }"
            >
              <article
                v-for="(card, index) in creditCards"
                :key="card.id"
                role="button"
                tabindex="0"
                class="extrato-carousel-slide flex-shrink-0 w-[260px] min-h-[200px] rounded-xl bg-surface-overlay border border-default-subtle p-4 cursor-pointer hover:border-default flex flex-col"
                :class="{ 'extrato-carousel-slide--active': index === currentIndex }"
                :style="{
                  transform: index === currentIndex ? 'scale(1)' : `scale(${CAROUSEL_INACTIVE_SCALE})`,
                  opacity: index === currentIndex ? 1 : 0.92,
                }"
                @click="onCardClick(card.id, $event)"
                @keydown.enter="emit('card-click', card.id)"
              >
                <!-- Cabeçalho do card: ícone + nome + total do cartão -->
                <div class="flex items-center justify-between mb-3">
                  <div class="min-w-0">
                    <span class="text-body-sm font-medium text-content-main truncate block">
                      {{ card.name }}
                    </span>
                  </div>
                  <span class="text-body-sm font-semibold text-content-main flex-shrink-0 ml-2">
                    {{ formatCurrency(card.totalAmount) }}
                  </span>
                </div>

                <!-- Transações do cartão -->
                <div class="space-y-2 flex-1 min-h-0">
                  <div
                    v-for="(tx, index) in getDisplayedTransactions(card)"
                    :key="tx.id || index"
                    class="flex items-center justify-between gap-2 text-caption"
                  >
                    <span class="text-content-subtle truncate min-w-0">
                      {{ tx.installmentInfo ? `${tx.installmentInfo} ` : '' }}{{ tx.description }}
                    </span>
                    <span class="text-content-main font-medium flex-shrink-0">
                      {{ formatCurrency(tx.amount) }}
                    </span>
                  </div>

                  <!-- Ver mais (por cartão) -->
                  <button
                    v-if="hasMoreTransactions(card)"
                    type="button"
                    data-ver-mais
                    class="w-full text-center text-caption text-content-subtle hover:text-content-main transition-colors py-1.5"
                    @click.prevent="emit('view-more-cards')"
                  >
                    Ver mais
                  </button>
                </div>

                <!-- Rodapé: total do cartão -->
                <div class="mt-3 pt-3 border-t border-default-subtle flex justify-end">
                  <span class="text-body-sm font-semibold text-content-main">
                    {{ formatCurrency(card.totalAmount) }}
                  </span>
                </div>
              </article>
            </div>
          </div>

          <!-- Indicadores (dots) -->
          <div
            v-if="totalSlides > 1"
            class="flex justify-center gap-1.5 mt-3"
            role="tablist"
            aria-label="Slides do carrossel"
          >
            <button
              v-for="i in dotIndices"
              :key="i"
              type="button"
              role="tab"
              :aria-selected="currentIndex === i"
              :aria-label="`Ir para cartão ${Number(i) + 1}`"
              class="extrato-carousel-dot h-2 rounded-full transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-surface-elevated"
              :class="currentIndex === i ? 'extrato-carousel-dot--active w-5' : 'w-2 bg-content-subtle/50 hover:bg-content-subtle'"
              @click="goTo(Number(i))"
            />
          </div>
        </div>
      </div>
    </div>

    <!-- Contas Pagas do Mês -->
    <ContasPagasCard
      :contas-pagas="contasPagas"
      :month-name="monthName"
      :loading="loading"
    />
  </aside>
</template>

<style scoped>
.extrato-carousel-viewport {
  min-height: 220px;
}

.extrato-carousel-track {
  will-change: transform;
  min-height: 200px;
}

.extrato-carousel-slide {
  transform-origin: center center;
  transition: transform 0.35s ease-out, opacity 0.35s ease-out, border-color 0.2s ease;
}

.extrato-carousel-dot--active {
  @apply bg-primary;
}
</style>
