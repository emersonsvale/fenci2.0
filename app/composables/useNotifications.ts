import { ref, computed } from 'vue'
import { useSupabaseClient, useSupabaseUser } from '#imports'
import type { Database, Notification } from 'shared/types/database.types'

/**
 * useNotifications - Carrega e gerencia notificações do usuário (lembretes, vencimentos, novos lançamentos).
 * Notificações são geradas automaticamente pelo cron diário e por trigger em novos lançamentos.
 */
export function useNotifications() {
  const supabase = useSupabaseClient<Database>()
  const user = useSupabaseUser()

  const notifications = ref<Notification[]>([])
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  const unreadCount = computed(() => notifications.value.filter((n) => !n.read_at).length)

  async function fetchNotifications(limit = 50) {
    if (!user.value?.id) {
      notifications.value = []
      return
    }
    isLoading.value = true
    error.value = null
    const { data, error: e } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', user.value.id)
      .order('created_at', { ascending: false })
      .limit(limit)
    isLoading.value = false
    if (e) {
      error.value = e.message
      return
    }
    notifications.value = (data ?? []) as Notification[]
  }

  async function markAsRead(id: string) {
    const { error: e } = await supabase
      .from('notifications')
      .update({ read_at: new Date().toISOString() })
      .eq('id', id)
      .eq('user_id', user.value?.id)
    if (!e) {
      const n = notifications.value.find((x) => x.id === id)
      if (n) n.read_at = new Date().toISOString()
    }
  }

  async function markAllAsRead() {
    if (!user.value?.id) return
    await supabase
      .from('notifications')
      .update({ read_at: new Date().toISOString() })
      .eq('user_id', user.value.id)
      .is('read_at', null)
    notifications.value.forEach((n) => {
      if (!n.read_at) n.read_at = new Date().toISOString()
    })
  }

  return {
    notifications,
    isLoading,
    error,
    unreadCount,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
  }
}
