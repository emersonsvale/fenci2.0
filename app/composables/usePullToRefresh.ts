import { ref, onMounted, onUnmounted, type Ref } from 'vue'

/**
 * usePullToRefresh - Gesto nativo de puxar para atualizar no mobile
 * Ativa apenas quando o scroll está no topo da página.
 * Exibe um indicador visual e chama a callback de refresh.
 */

export interface PullToRefreshOptions {
  /** Callback assíncrona chamada ao ativar o refresh */
  onRefresh: () => Promise<void>
  /** Distância mínima de pull em px para ativar (default: 80) */
  threshold?: number
  /** Distância máxima de pull em px (default: 150) */
  maxPull?: number
  /** Se o pull-to-refresh está habilitado */
  enabled?: Ref<boolean>
}

export function usePullToRefresh(options: PullToRefreshOptions) {
  const {
    onRefresh,
    threshold = 80,
    maxPull = 150,
    enabled,
  } = options

  const pullDistance = ref(0)
  const isRefreshing = ref(false)
  const isPulling = ref(false)

  let touchStartY = 0
  let isTracking = false

  function canActivate(): boolean {
    if (enabled && !enabled.value) return false
    if (isRefreshing.value) return false
    // Só ativar se a página está no topo
    return window.scrollY <= 0
  }

  function handleTouchStart(e: TouchEvent): void {
    if (!canActivate()) return

    const touch = e.touches[0]
    if (!touch) return

    touchStartY = touch.clientY
    isTracking = true
  }

  function handleTouchMove(e: TouchEvent): void {
    if (!isTracking || !canActivate()) {
      isTracking = false
      return
    }

    const touch = e.touches[0]
    if (!touch) return

    const deltaY = touch.clientY - touchStartY

    // Apenas puxar para baixo
    if (deltaY <= 0) {
      pullDistance.value = 0
      isPulling.value = false
      return
    }

    // Resistência progressiva (diminui velocidade quanto mais puxa)
    const resistance = 0.4
    const adjustedDelta = Math.min(deltaY * resistance, maxPull)

    pullDistance.value = adjustedDelta
    isPulling.value = adjustedDelta > 10
  }

  async function handleTouchEnd(): Promise<void> {
    if (!isTracking) return
    isTracking = false

    if (pullDistance.value >= threshold && !isRefreshing.value) {
      // Ativar refresh
      isRefreshing.value = true
      pullDistance.value = threshold * 0.5 // Manter um pouco visível enquanto carrega

      try {
        await onRefresh()
      } finally {
        isRefreshing.value = false
        pullDistance.value = 0
        isPulling.value = false
      }
    } else {
      // Não atingiu o threshold, voltar
      pullDistance.value = 0
      isPulling.value = false
    }
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
    pullDistance,
    isPulling,
    isRefreshing,
  }
}
