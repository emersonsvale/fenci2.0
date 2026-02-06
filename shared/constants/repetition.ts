/**
 * Constantes e helpers para templates de repetição de lançamentos.
 * Usado nos modais de entrada, saída e cartão.
 */

export type RepetitionFrequency = 'weekly' | 'monthly' | 'quarterly' | 'semiannually' | 'annually'

export const REPETITION_FREQUENCIES: { value: RepetitionFrequency; label: string }[] = [
  { value: 'weekly', label: 'Semanal' },
  { value: 'monthly', label: 'Mensal' },
  { value: 'quarterly', label: 'Trimestral' },
  { value: 'semiannually', label: 'Semestral' },
  { value: 'annually', label: 'Anual' },
]

/**
 * Retorna a data da parcela `index` (0-based) a partir da data inicial,
 * conforme a frequência de repetição.
 */
export function getInstallmentDate(startDate: string, index: number, frequency: RepetitionFrequency): string {
  const date = new Date(startDate)
  if (index === 0) return startDate

  switch (frequency) {
    case 'weekly':
      date.setDate(date.getDate() + 7 * index)
      break
    case 'monthly':
      date.setMonth(date.getMonth() + index)
      break
    case 'quarterly':
      date.setMonth(date.getMonth() + 3 * index)
      break
    case 'semiannually':
      date.setMonth(date.getMonth() + 6 * index)
      break
    case 'annually':
      date.setFullYear(date.getFullYear() + index)
      break
    default:
      date.setMonth(date.getMonth() + index)
  }

  return date.toISOString().split('T')[0]
}
