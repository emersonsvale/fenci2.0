/**
 * useLimitAlerts - Alertas dinâmicos de limite mensal
 * Notifica o usuário ao atingir 10%, 30%, 50%, 75%, 90% e 100% do limite de gastos.
 * Usa localStorage para não repetir o mesmo alerta no mesmo mês.
 */

import type { Ref } from 'vue'
import { watch } from 'vue'
import { useToast } from './useToast'

const STORAGE_KEY_PREFIX = 'fenci_limit_alerts'

const THRESHOLDS = [10, 30, 50, 75, 90, 100] as const

const MESSAGES: Record<number, string> = {
  10: 'Hey! Você já gastou 10% do seu limite mensal.',
  30: 'Atenção! Você já gastou 30% do seu limite mensal.',
  50: 'Você já utilizou metade do seu limite mensal (50%).',
  75: 'Cuidado! Você já gastou 75% do seu limite mensal.',
  90: 'Atenção! Você já gastou 90% do seu limite mensal.',
  100: 'Limite mensal atingido! Você gastou 100% do orçamento.',
}

function getStorageKey(userId: string, year: number, month: number): string {
  const mm = String(month).padStart(2, '0')
  return `${STORAGE_KEY_PREFIX}_${userId}_${year}-${mm}`
}

function getNotifiedThresholds(userId: string, year: number, month: number): number[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(getStorageKey(userId, year, month))
    if (!raw) return []
    const parsed = JSON.parse(raw) as unknown
    return Array.isArray(parsed) ? parsed.filter((n) => typeof n === 'number') : []
  } catch {
    return []
  }
}

function markThresholdNotified(userId: string, year: number, month: number, threshold: number): void {
  if (typeof window === 'undefined') return
  try {
    const key = getStorageKey(userId, year, month)
    const current = getNotifiedThresholds(userId, year, month)
    if (current.includes(threshold)) return
    const next = [...current, threshold].sort((a, b) => a - b)
    localStorage.setItem(key, JSON.stringify(next))
  } catch {
    // ignore
  }
}

export interface LimitData {
  limite: number
  gasto: number
}

export interface UseLimitAlertsOptions {
  /** Ref/Computed com limite e gasto atuais (reativo para o watch) */
  limiteDataRef: Ref<LimitData>
  /** Ref com ano e mês do período (month 1-12). Usado para chave do localStorage. */
  periodRef: Ref<{ year: number; month: number }>
  /** Ref que indica se alertas estão habilitados (ex.: preferência do usuário) */
  notifyEnabledRef: Ref<boolean>
  /** Ref com ID do usuário para chave do localStorage */
  userIdRef: Ref<string | null>
}

/**
 * Ativa o watcher de alertas de limite. Chame uma vez no componente (ex.: dashboard).
 */
export function useLimitAlerts(options: UseLimitAlertsOptions): void {
  const { limiteDataRef, periodRef, notifyEnabledRef, userIdRef } = options
  const toast = useToast()

  watch(
    [limiteDataRef, periodRef, notifyEnabledRef, userIdRef],
    () => {
      const uid = userIdRef.value
      if (!uid || !notifyEnabledRef.value) return

      const { limite, gasto } = limiteDataRef.value
      if (limite <= 0) return

      const percentage = Math.round((gasto / limite) * 100)
      const { year, month } = periodRef.value
      const notified = getNotifiedThresholds(uid, year, month)

      for (const threshold of THRESHOLDS) {
        if (percentage >= threshold && !notified.includes(threshold)) {
          const message = MESSAGES[threshold] ?? `Você já gastou ${threshold}% do seu limite mensal.`
          const variant = threshold >= 90 ? 'error' : threshold >= 50 ? 'warning' : 'info'
          toast.add(message, variant)
          markThresholdNotified(uid, year, month, threshold)
        }
      }
    },
    { immediate: true }
  )
}
