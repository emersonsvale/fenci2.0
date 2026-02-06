/**
 * useTheme - Controle de tema claro/escuro
 * Persiste no localStorage e aplica a classe "dark" no <html> (Tailwind darkMode: 'class').
 */

const STORAGE_KEY = 'fenci-theme'

function getInitialDark(): boolean {
  if (import.meta.server) return false
  const stored = localStorage.getItem(STORAGE_KEY)
  if (stored === 'dark') return true
  if (stored === 'light') return false
  return window.matchMedia('(prefers-color-scheme: dark)').matches
}

function applyTheme(isDark: boolean): void {
  if (import.meta.server) return
  const html = document.documentElement
  if (isDark) {
    html.classList.add('dark')
    localStorage.setItem(STORAGE_KEY, 'dark')
  } else {
    html.classList.remove('dark')
    localStorage.setItem(STORAGE_KEY, 'light')
  }
}

export function useTheme() {
  const isDark = useState<boolean>('theme-is-dark', () => false)

  const toggleTheme = (): void => {
    isDark.value = !isDark.value
    applyTheme(isDark.value)
  }

  const setTheme = (dark: boolean): void => {
    isDark.value = dark
    applyTheme(dark)
  }

  onMounted(() => {
    const initial = getInitialDark()
    isDark.value = initial
    applyTheme(initial)
  })

  return { isDark, toggleTheme, setTheme }
}

