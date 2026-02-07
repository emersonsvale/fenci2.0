import { ref, onMounted, onUnmounted, type Ref } from 'vue'

/**
 * useSwipeGesture - Detecta gestos de swipe horizontal em touch devices
 * Usado para abrir/fechar a sidebar no mobile com swipe da borda esquerda
 */

export interface SwipeGestureOptions {
  /** Distância mínima em px para considerar um swipe válido (default: 50) */
  threshold?: number
  /** Zona de ativação a partir da borda esquerda em px (default: 30) */
  edgeZone?: number
  /** Callback ao detectar swipe para a direita (abrir sidebar) */
  onSwipeRight?: () => void
  /** Callback ao detectar swipe para a esquerda (fechar sidebar) */
  onSwipeLeft?: () => void
  /** Se o gesto está habilitado (desabilitar quando modais abertos etc.) */
  enabled?: Ref<boolean>
}

export function useSwipeGesture(options: SwipeGestureOptions) {
  const {
    threshold = 50,
    edgeZone = 30,
    onSwipeRight,
    onSwipeLeft,
    enabled,
  } = options

  const touchStartX = ref(0)
  const touchStartY = ref(0)
  const touchCurrentX = ref(0)
  const isSwiping = ref(false)
  const startedFromEdge = ref(false)

  /** Progresso do swipe em px (positivo = direita, negativo = esquerda) */
  const swipeDelta = ref(0)

  function handleTouchStart(e: TouchEvent): void {
    if (enabled && !enabled.value) return

    const touch = e.touches[0]
    if (!touch) return

    touchStartX.value = touch.clientX
    touchStartY.value = touch.clientY
    touchCurrentX.value = touch.clientX
    startedFromEdge.value = touch.clientX <= edgeZone
    isSwiping.value = false
    swipeDelta.value = 0
  }

  function handleTouchMove(e: TouchEvent): void {
    if (enabled && !enabled.value) return

    const touch = e.touches[0]
    if (!touch) return

    touchCurrentX.value = touch.clientX
    const deltaX = touch.clientX - touchStartX.value
    const deltaY = Math.abs(touch.clientY - touchStartY.value)

    // Só considerar swipe horizontal se o movimento horizontal > vertical
    if (Math.abs(deltaX) > deltaY && Math.abs(deltaX) > 10) {
      isSwiping.value = true
      swipeDelta.value = deltaX
    }
  }

  function handleTouchEnd(): void {
    if (enabled && !enabled.value) return

    if (!isSwiping.value) {
      resetState()
      return
    }

    const deltaX = touchCurrentX.value - touchStartX.value

    // Swipe para a direita (abrir sidebar) — deve iniciar da borda
    if (deltaX > threshold && startedFromEdge.value && onSwipeRight) {
      onSwipeRight()
    }

    // Swipe para a esquerda (fechar sidebar) — pode iniciar de qualquer lugar
    if (deltaX < -threshold && onSwipeLeft) {
      onSwipeLeft()
    }

    resetState()
  }

  function resetState(): void {
    isSwiping.value = false
    swipeDelta.value = 0
    startedFromEdge.value = false
  }

  onMounted(() => {
    if (import.meta.server) return
    document.addEventListener('touchstart', handleTouchStart, { passive: true })
    document.addEventListener('touchmove', handleTouchMove, { passive: true })
    document.addEventListener('touchend', handleTouchEnd, { passive: true })
  })

  onUnmounted(() => {
    if (import.meta.server) return
    document.removeEventListener('touchstart', handleTouchStart)
    document.removeEventListener('touchmove', handleTouchMove)
    document.removeEventListener('touchend', handleTouchEnd)
  })

  return {
    isSwiping,
    swipeDelta,
  }
}
