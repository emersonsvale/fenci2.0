/**
 * useToast - Sistema de notificações toast in-app
 * Estado global (useState) para exibir mensagens temporárias e histórico no centro de notificações
 */

export type ToastVariant = 'info' | 'success' | 'warning' | 'error'

export interface Toast {
  id: string
  message: string
  variant: ToastVariant
  durationMs: number
  createdAt: number
}

/** Item do histórico do centro de notificações (mesmo formato do toast) */
export type NotificationItem = Pick<Toast, 'id' | 'message' | 'variant' | 'createdAt'>

const TOAST_DEFAULT_DURATION = 6000
const NOTIFICATION_HISTORY_MAX = 50

export function useToast() {
  const toasts = useState<Toast[]>('toasts', () => [])
  const notificationHistory = useState<NotificationItem[]>('notification-history', () => [])

  function add(message: string, variant: ToastVariant = 'info', durationMs: number = TOAST_DEFAULT_DURATION): string {
    const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
    const createdAt = Date.now()
    const toast: Toast = {
      id,
      message,
      variant,
      durationMs,
      createdAt,
    }
    toasts.value = [...toasts.value, toast]

    // Guardar no histórico para o centro de notificações
    const entry: NotificationItem = { id, message, variant, createdAt }
    notificationHistory.value = [entry, ...notificationHistory.value].slice(0, NOTIFICATION_HISTORY_MAX)

    if (durationMs > 0) {
      setTimeout(() => {
        remove(id)
      }, durationMs)
    }
    return id
  }

  function remove(id: string): void {
    toasts.value = toasts.value.filter((t) => t.id !== id)
  }

  function clearNotificationHistory(): void {
    notificationHistory.value = []
  }

  function info(message: string, durationMs?: number): string {
    return add(message, 'info', durationMs ?? TOAST_DEFAULT_DURATION)
  }

  function success(message: string, durationMs?: number): string {
    return add(message, 'success', durationMs ?? TOAST_DEFAULT_DURATION)
  }

  function warning(message: string, durationMs?: number): string {
    return add(message, 'warning', durationMs ?? TOAST_DEFAULT_DURATION)
  }

  function error(message: string, durationMs?: number): string {
    return add(message, 'error', durationMs ?? TOAST_DEFAULT_DURATION)
  }

  return {
    toasts,
    notificationHistory,
    add,
    remove,
    clearNotificationHistory,
    info,
    success,
    warning,
    error,
  }
}
