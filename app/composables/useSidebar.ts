/**
 * useSidebar - Estado de colapso da sidebar (minimizada/expandida)
 * Persiste no localStorage para manter preferência entre sessões.
 * Suporta mobile: no mobile a sidebar é um drawer com overlay.
 */

const STORAGE_KEY = 'fenci-sidebar-collapsed'
const MOBILE_BREAKPOINT = 1024 // lg breakpoint do Tailwind

function getInitialCollapsed(): boolean {
  if (import.meta.server) return false
  const stored = localStorage.getItem(STORAGE_KEY)
  return stored === 'true'
}

function persistCollapsed(collapsed: boolean): void {
  if (import.meta.server) return
  localStorage.setItem(STORAGE_KEY, String(collapsed))
}

export const SIDEBAR_WIDTH_EXPANDED = 250
export const SIDEBAR_WIDTH_COLLAPSED = 72

export function useSidebar() {
  const isCollapsed = useState<boolean>(
    'sidebar-collapsed',
    () => (import.meta.client ? getInitialCollapsed() : false),
  )

  /** Se estamos em viewport mobile (< lg) */
  const isMobile = useState<boolean>('sidebar-is-mobile', () => false)

  /** Drawer mobile aberto */
  const isMobileOpen = useState<boolean>('sidebar-mobile-open', () => false)

  // Detectar mobile via matchMedia
  if (import.meta.client) {
    const checkMobile = (): void => {
      isMobile.value = window.innerWidth < MOBILE_BREAKPOINT
      // Fechar drawer se saiu do mobile
      if (!isMobile.value) {
        isMobileOpen.value = false
      }
    }

    onMounted(() => {
      checkMobile()
      window.addEventListener('resize', checkMobile)
    })

    onUnmounted(() => {
      window.removeEventListener('resize', checkMobile)
    })
  }

  const toggle = (): void => {
    if (isMobile.value) {
      isMobileOpen.value = !isMobileOpen.value
    } else {
      isCollapsed.value = !isCollapsed.value
      persistCollapsed(isCollapsed.value)
    }
  }

  const setCollapsed = (collapsed: boolean): void => {
    isCollapsed.value = collapsed
    persistCollapsed(collapsed)
  }

  const openMobile = (): void => {
    isMobileOpen.value = true
  }

  const closeMobile = (): void => {
    isMobileOpen.value = false
  }

  /** Largura da sidebar em desktop (no mobile é 0 pois a sidebar é overlay) */
  const width = computed(() => {
    if (isMobile.value) return 0
    return isCollapsed.value ? SIDEBAR_WIDTH_COLLAPSED : SIDEBAR_WIDTH_EXPANDED
  })

  return {
    isCollapsed,
    isMobile,
    isMobileOpen,
    toggle,
    setCollapsed,
    openMobile,
    closeMobile,
    width,
  }
}
