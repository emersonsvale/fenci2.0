import { ref, computed, watch } from 'vue'
import { useSupabaseClient, useSupabaseUser } from '#imports'
import type { Database, Notification } from 'shared/types/database.types'

const POLL_INTERVAL_MS = 60_000

let realtimeChannel: { unsubscribe: () => void } | null = null
let pollTimer: ReturnType<typeof setInterval> | null = null
let watchRegistered = false

/**
 * useNotifications - Carrega e gerencia notificações do usuário (lembretes, vencimentos, novos lançamentos).
 * Estado compartilhado via useState para o badge sempre refletir não lidas, mesmo antes de abrir o painel.
 */
export function useNotifications() {
  const supabase = useSupabaseClient<Database>()
  const user = useSupabaseUser()

  const notifications = useState<Notification[]>('notifications', () => [])
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  const unreadCount = computed(() => notifications.value.filter((n) => !n.read_at).length)

  function cleanupRealtime() {
    if (realtimeChannel && typeof realtimeChannel.unsubscribe === 'function') {
      realtimeChannel.unsubscribe()
    }
    realtimeChannel = null
  }

  function stopPolling() {
    if (pollTimer) {
      clearInterval(pollTimer)
      pollTimer = null
    }
  }

  async function fetchNotifications(limit = 50) {
    isLoading.value = true
    error.value = null
    const { data, error: e } = await supabase
      .from('notifications')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit)
    isLoading.value = false
    if (e) {
      error.value = e.message
      return
    }
    notifications.value = (data ?? []) as Notification[]
  }

  /** Carrega notificações usando getSession() quando useSupabaseUser ainda não resolveu (ex.: ao carregar a página). */
  async function loadWhenSessionReady() {
    if (user.value?.id) {
      void fetchNotifications()
      setupRealtimeAndPolling(user.value.id)
      return
    }
    const { data: { session } } = await supabase.auth.getSession()
    const uid = session?.user?.id
    if (uid) {
      void fetchNotifications()
      setupRealtimeAndPolling(uid)
    }
  }

  function setupRealtimeAndPolling(uid: string) {
    cleanupRealtime()
    realtimeChannel = supabase
      .channel(`notification-center-${uid}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${uid}` },
        () => void fetchNotifications()
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'notifications', filter: `user_id=eq.${uid}` },
        () => void fetchNotifications()
      )
      .subscribe()
    stopPolling()
    pollTimer = setInterval(() => void fetchNotifications(), POLL_INTERVAL_MS)
  }

  if (!watchRegistered) {
    watchRegistered = true
    watch(
      () => user.value?.id,
      (uid) => {
        if (!uid) {
          notifications.value = []
          cleanupRealtime()
          stopPolling()
          return
        }
        void fetchNotifications()
        setupRealtimeAndPolling(uid)
      },
      { immediate: true }
    )
  }

  async function markAsRead(id: string) {
    const { error: e } = await supabase
      .from('notifications')
      .update({ read_at: new Date().toISOString() })
      .eq('id', id)
    if (!e) {
      const n = notifications.value.find((x) => x.id === id)
      if (n) n.read_at = new Date().toISOString()
    }
  }

  async function markAllAsRead() {
    await supabase
      .from('notifications')
      .update({ read_at: new Date().toISOString() })
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
    loadWhenSessionReady,
    markAsRead,
    markAllAsRead,
  }
}
