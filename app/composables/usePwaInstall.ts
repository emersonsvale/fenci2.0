import { ref, onMounted } from 'vue'

/**
 * usePwaInstall - Gerencia o prompt de instalação do PWA
 * Captura o evento beforeinstallprompt e expõe métodos para instalar
 */

// Tipo para o evento de instalação
interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

const deferredPrompt = ref<BeforeInstallPromptEvent | null>(null)
const isInstallable = ref(false)
const isInstalled = ref(false)

const DISMISS_KEY = 'fenci-pwa-install-dismissed'
const DISMISS_DURATION_MS = 7 * 24 * 60 * 60 * 1000 // 7 dias

export function usePwaInstall() {
  /** Verifica se o usuário dispensou recentemente o prompt */
  function wasDismissedRecently(): boolean {
    if (import.meta.server) return true
    const dismissed = localStorage.getItem(DISMISS_KEY)
    if (!dismissed) return false
    const dismissedAt = parseInt(dismissed, 10)
    return Date.now() - dismissedAt < DISMISS_DURATION_MS
  }

  onMounted(() => {
    if (import.meta.server) return

    // Detectar se já está instalado (display-mode: standalone)
    if (window.matchMedia('(display-mode: standalone)').matches) {
      isInstalled.value = true
      return
    }

    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault()
      deferredPrompt.value = e as BeforeInstallPromptEvent
      isInstallable.value = !wasDismissedRecently()
    })

    window.addEventListener('appinstalled', () => {
      isInstalled.value = true
      isInstallable.value = false
      deferredPrompt.value = null
    })
  })

  /** Exibir o prompt de instalação nativo */
  async function install(): Promise<boolean> {
    if (!deferredPrompt.value) return false

    await deferredPrompt.value.prompt()
    const { outcome } = await deferredPrompt.value.userChoice

    if (outcome === 'accepted') {
      isInstallable.value = false
      deferredPrompt.value = null
      return true
    }

    return false
  }

  /** Dispensar o prompt por um período */
  function dismiss(): void {
    isInstallable.value = false
    if (import.meta.client) {
      localStorage.setItem(DISMISS_KEY, String(Date.now()))
    }
  }

  return {
    isInstallable,
    isInstalled,
    install,
    dismiss,
  }
}
