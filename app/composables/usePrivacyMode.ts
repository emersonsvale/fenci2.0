import { ref, readonly } from 'vue'

/**
 * usePrivacyMode - Modo de privacidade global
 * Quando ativo, oculta todos os valores financeiros e numéricos do sistema.
 * Persistido no localStorage para manter preferência entre sessões.
 */

const STORAGE_KEY = 'fenci-privacy-mode'
const PRIVACY_MASK = '••••••'

// Estado global singleton (compartilhado entre todos os componentes)
const isPrivacyMode = ref(false)
let initialized = false

function initFromStorage(): void {
  if (initialized || typeof window === 'undefined') return
  initialized = true
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored === 'true') {
      isPrivacyMode.value = true
    }
  } catch {
    // localStorage indisponível (SSR, iframe sandbox, etc.)
  }
}

function persistToStorage(): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(STORAGE_KEY, String(isPrivacyMode.value))
  } catch {
    // Silencioso caso localStorage esteja indisponível
  }
}

export function usePrivacyMode() {
  // Inicializa do localStorage no primeiro uso no client
  initFromStorage()

  /** Alterna o modo de privacidade (visível ↔ oculto) */
  function togglePrivacyMode(): void {
    isPrivacyMode.value = !isPrivacyMode.value
    persistToStorage()
  }

  /** Retorna o valor mascarado se o modo privacidade estiver ativo */
  function maskValue(value: string | number): string {
    if (isPrivacyMode.value) return PRIVACY_MASK
    return String(value)
  }

  return {
    isPrivacyMode: readonly(isPrivacyMode),
    togglePrivacyMode,
    maskValue,
    PRIVACY_MASK,
  }
}
