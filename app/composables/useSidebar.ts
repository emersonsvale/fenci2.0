/**
 * useSidebar - Estado de colapso da sidebar (minimizada/expandida)
 * Persiste no localStorage para manter preferência entre sessões.
 */

const STORAGE_KEY = 'fenci-sidebar-collapsed'

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
    () => (import.meta.client ? getInitialCollapsed() : false)
  )

  const toggle = (): void => {
    isCollapsed.value = !isCollapsed.value
    persistCollapsed(isCollapsed.value)
  }

  const setCollapsed = (collapsed: boolean): void => {
    isCollapsed.value = collapsed
    persistCollapsed(collapsed)
  }

  const width = computed(() => (isCollapsed.value ? SIDEBAR_WIDTH_COLLAPSED : SIDEBAR_WIDTH_EXPANDED))

  return {
    isCollapsed,
    toggle,
    setCollapsed,
    width,
  }
}
