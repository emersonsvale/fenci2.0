import { useState } from '#imports'

export interface AppPeriod {
  month: number // 0-11 (JavaScript)
  year: number
}

const defaultPeriod = (): AppPeriod => {
  const d = new Date()
  return { month: d.getMonth(), year: d.getFullYear() }
}

/**
 * Período (mês/ano) selecionado globalmente para a Fê e outras telas.
 * O dashboard (e outras com PeriodSelector) deve sincronizar ao mudar o período.
 */
export function useAppPeriod() {
  const period = useState<AppPeriod>('app-period', defaultPeriod)

  function setPeriod(value: AppPeriod) {
    period.value = { month: value.month, year: value.year }
  }

  /** Mês no calendário (1-12) para enviar à API */
  const monthCalendar = () => period.value.month + 1

  return { period, setPeriod, monthCalendar }
}
