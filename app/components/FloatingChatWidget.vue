<script setup lang="ts">
import { ref, watch, onUnmounted, computed } from 'vue'
import FloatingButton from './FloatingButton.vue'
import FloatingChat from './FloatingChat.vue'
import FeInsightCard from './FeInsightCard.vue'

/**
 * Widget que combina o botão flutuante (Elipse.png), o insight da Fê e o chat flutuante.
 * Botão, insight e chat ficam no mesmo container e se movem juntos ao arrastar.
 */

const isChatOpen = ref(false)
const wrapperRef = ref<HTMLElement | null>(null)

const CHAT_WIDTH = 360
const DEFAULT_OFFSET = 24
/** Altura máxima estimada do painel (chat aberto) para garantir que não saia da tela por cima */
const MAX_PANEL_HEIGHT = 560

/** Posição ancorada em bottom/right (px). Null = usa classe bottom-6 right-6. */
const widgetPosition = ref<{ bottom: number; right: number } | null>(null)
const isDragging = ref(false)
const dragStart = ref<{ x: number; y: number; bottom: number; right: number } | null>(null)
/** Evita que um clique no botão abra o chat logo após um arraste */
const dragJustEnded = ref(false)
const DRAG_THRESHOLD_PX = 6

const wrapperStyle = computed(() => {
  if (!widgetPosition.value) return undefined
  return {
    bottom: `${widgetPosition.value.bottom}px`,
    right: `${widgetPosition.value.right}px`,
    top: 'auto',
    left: 'auto',
  }
})

function getDefaultBottomRight(): { bottom: number; right: number } {
  return { bottom: DEFAULT_OFFSET, right: DEFAULT_OFFSET }
}

function clampBottomRight(bottom: number, right: number): { bottom: number; right: number } {
  if (typeof window === 'undefined') return { bottom, right }
  const maxBottom = Math.max(DEFAULT_OFFSET, window.innerHeight - 120)
  const minBottom = DEFAULT_OFFSET
  const maxRight = window.innerWidth - CHAT_WIDTH - DEFAULT_OFFSET
  const minRight = DEFAULT_OFFSET
  return {
    bottom: Math.max(minBottom, Math.min(bottom, maxBottom)),
    right: Math.max(minRight, Math.min(right, maxRight)),
  }
}

function startDrag(clientX: number, clientY: number) {
  const currentBottom = widgetPosition.value?.bottom ?? DEFAULT_OFFSET
  const currentRight = widgetPosition.value?.right ?? DEFAULT_OFFSET
  if (widgetPosition.value === null) {
    widgetPosition.value = getDefaultBottomRight()
  }
  dragStart.value = { x: clientX, y: clientY, bottom: currentBottom, right: currentRight }
}

function onButtonDragStart(e: MouseEvent | TouchEvent) {
  e.preventDefault()
  const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX
  const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY
  startDrag(clientX, clientY)
  setupDragListeners()
}

function onDragMove(e: MouseEvent | TouchEvent) {
  if (!dragStart.value) return
  const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX
  const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY
  const deltaX = clientX - dragStart.value.x
  const deltaY = clientY - dragStart.value.y
  if (!isDragging.value) {
    const dist = Math.hypot(deltaX, deltaY)
    if (dist < DRAG_THRESHOLD_PX) return
    e.preventDefault()
    isDragging.value = true
  } else {
    e.preventDefault()
  }
  widgetPosition.value = clampBottomRight(
    dragStart.value.bottom - deltaY,
    dragStart.value.right - deltaX
  )
}

function onDragEnd() {
  removeDragListeners()
  if (isDragging.value) {
    dragJustEnded.value = true
  }
  dragStart.value = null
  isDragging.value = false
}

function setupDragListeners() {
  document.addEventListener('mousemove', onDragMove)
  document.addEventListener('mouseup', onDragEnd)
  document.addEventListener('touchmove', onDragMove, { passive: false })
  document.addEventListener('touchend', onDragEnd)
}

function removeDragListeners() {
  document.removeEventListener('mousemove', onDragMove)
  document.removeEventListener('mouseup', onDragEnd)
  document.removeEventListener('touchmove', onDragMove)
  document.removeEventListener('touchend', onDragEnd)
}


// Ao abrir o chat, limita o bottom para o painel não sair da tela por cima
watch(isChatOpen, (open) => {
  if (open && widgetPosition.value && typeof window !== 'undefined') {
    const maxBottom = window.innerHeight - MAX_PANEL_HEIGHT
    if (widgetPosition.value.bottom > maxBottom) {
      widgetPosition.value = {
        ...widgetPosition.value,
        bottom: Math.max(DEFAULT_OFFSET, maxBottom),
      }
    }
  }
})

onUnmounted(() => {
  removeDragListeners()
})

function toggleChat() {
  isChatOpen.value = !isChatOpen.value
}

function closeChat() {
  isChatOpen.value = false
}

function handleButtonClick() {
  if (dragJustEnded.value) {
    dragJustEnded.value = false
    return
  }
  toggleChat()
}
</script>

<template>
  <div
    ref="wrapperRef"
    class="fixed z-[400] flex w-[360px] max-w-[calc(100vw-3rem)] flex-col-reverse items-end gap-2"
    :class="[
      !widgetPosition && 'bottom-6 right-6',
      isDragging && 'cursor-grabbing',
    ]"
    :style="wrapperStyle"
  >
    <!-- Só o botão move o widget; insight e chat seguem o botão -->
    <div
      class="cursor-grab shrink-0 touch-none select-none"
      :class="{ 'cursor-grabbing': isDragging }"
      @mousedown="onButtonDragStart"
      @touchstart.prevent="onButtonDragStart"
      @click="handleButtonClick"
    >
      <FloatingButton
        aria-label="Arrastar para mover; clique para abrir chat"
        embedded
      />
    </div>
    <!-- Insight da Fê (junto ao botão; esconde quando o chat está aberto) -->
    <div
      v-if="!isChatOpen"
      class="w-full shrink-0"
    >
      <FeInsightCard embedded />
    </div>
    <FloatingChat
      :is-open="isChatOpen"
      title="Fê - Assistente Financeira"
      embedded
      @close="closeChat"
    />
  </div>
</template>
