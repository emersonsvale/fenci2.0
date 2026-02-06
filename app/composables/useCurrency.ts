import { computed } from 'vue'
import { useProfile } from '~/composables/useProfile'

const DEFAULT_CURRENCY = 'BRL'
const LOCALE = 'pt-BR'

/**
 * useCurrency - Moeda preferida do usuário e formatação
 * Reflete a preferência "Moeda padrão" da aba Preferências do perfil em todo o app.
 */
export function useCurrency() {
  const { profile } = useProfile()

  const preferredCurrency = computed(() => {
    return profile.value?.preferred_currency || DEFAULT_CURRENCY
  })

  function formatCurrency(value: number): string {
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
