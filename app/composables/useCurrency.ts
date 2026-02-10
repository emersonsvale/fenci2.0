import { computed } from 'vue'
import { useProfile } from '~/composables/useProfile'
import { usePrivacyMode } from '~/composables/usePrivacyMode'

const DEFAULT_CURRENCY = 'BRL'
const LOCALE = 'pt-BR'

/**
 * useCurrency - Moeda preferida do usuário e formatação
 * Reflete a preferência "Moeda padrão" da aba Preferências do perfil em todo o app.
 * Respeita o modo de privacidade: quando ativo, retorna valores mascarados.
 */
export function useCurrency() {
  const { profile } = useProfile()
  const { isPrivacyMode, PRIVACY_MASK } = usePrivacyMode()

  const preferredCurrency = computed(() => {
    return profile.value?.preferred_currency || DEFAULT_CURRENCY
  })

  function formatCurrency(value: number): string {
    if (isPrivacyMode.value) return PRIVACY_MASK
    return new Intl.NumberFormat(LOCALE, {
      style: 'currency',
      currency: preferredCurrency.value,
    }).format(value)
  }

  return {
    preferredCurrency,
    formatCurrency,
  }
}
