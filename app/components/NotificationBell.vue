<script setup lang="ts">
import { ref, watch, onMounted, onUnmounted } from 'vue'
import { useSupabaseClient, useSupabaseUser } from '#imports'
import { useNotifications } from '~/composables/useNotifications'
import type { Notification } from 'shared/types/database.types'

/**
 * NotificationBell - Ícone de sino com contador de não lidas e dropdown com lista de notificações.
 * Usado na sidebar do dashboard.
 */

const props = withDefaults(
  defineProps<{
    collapsed?: boolean
  }>(),
  { collapsed: false }
)

const { notifications, unreadCount, fetchNotifications, markAsRead, markAllAsRead } = useNotifications()
const user = useSupabaseUser()
const supabase = useSupabaseClient()

const isOpen = ref(false)
const panelRef = ref<HTMLElement | null>(null)

function formatTime(createdAt: string) {
  const d = new Date(createdAt)
  const now = new Date()
  const diffMs = now.getTime() - d.getTime()
  const diffM = Math.floor(diffMs / 60000)
  const diffH = Math.floor(diffMs / 3600000)
  const diffD = Math.floor(diffMs / 86400000)
  if (diffM < 1) return 'Agora'
  if (diffM < 60) return `${diffM} min`
  if (diffH < 24) return `${diffH}h`
  if (diffD < 7) return `${diffD}d`
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
}

function closePanel() {
  isOpen.value = false
}

function togglePanel() {
  isOpen.value = !isOpen.value
  if (isOpen.value) void fetchNotifications()
}

async function onSelectNotification(n: Notification) {
  if (!n.read_at) await markAsRead(n.id)
  closePanel()
}

onMounted(() => {
  if (user.value) void fetchNotifications()
})
watch(user, (u) => {
  if (u) void fetchNotifications()
}, { immediate: true })

// Realtime: novas notificações (quando o backend insere)
let realtimeChannel: ReturnType<typeof supabase.channel> | null = null
onMounted(() => {
  const uid = user.value?.id
  if (!uid) return
  realtimeChannel = supabase
    .channel('notifications')
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${uid}` },
      () => void fetchNotifications()
    )
    .subscribe()
})
onUnmounted(() => {
  if (realtimeChannel) supabase.removeChannel(realtimeChannel)
})
</script>

<template>
  <div class="notification-bell relative">
    <button
      type="button"
      class="sidebar-action"
      aria-label="Notificações"
      title="Notificações"
      @click="togglePanel"
    >
      <span class="material-symbols-outlined text-lg shrink-0 relative">
        notifications
        <span
          v-if="unreadCount > 0"
          class="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 flex items-center justify-center rounded-full bg-error text-white text-[10px] font-semibold"
        >
          {{ unreadCount > 99 ? '99+' : unreadCount }}
        </span>
      </span>
      <span class="truncate" :class="{ 'sr-only': collapsed }">Notificações</span>
    </button>

    <!-- Dropdown -->
    <Teleport to="body">
      <div
        v-show="isOpen"
        ref="panelRef"
        class="notification-panel fixed z-dropdown bg-surface-elevated border border-default rounded-xl shadow-lg overflow-hidden"
        style="min-width: 320px; max-width: 380px; max-height: 70vh;"
        :style="{
          top: '56px',
          right: '24px',
        }"
      >
        <div class="p-3 border-b border-default flex items-center justify-between">
          <h3 class="text-body-sm font-semibold text-content-main">Notificações</h3>
          <button
            v-if="unreadCount > 0"
            type="button"
            class="text-caption text-primary hover:underline"
            @click="markAllAsRead"
          >
            Marcar todas como lidas
          </button>
        </div>
        <div class="overflow-y-auto" style="max-height: 60vh;">
          <template v-if="notifications.length === 0">
            <p class="p-4 text-body-sm text-content-subtle text-center">Nenhuma notificação.</p>
          </template>
          <template v-else>
            <button
              v-for="n in notifications"
              :key="n.id"
              type="button"
              class="notification-item w-full text-left px-4 py-3 border-b border-default last:border-b-0 hover:bg-surface-overlay transition-colors"
              :class="{ 'bg-surface-overlay/50': !n.read_at }"
              @click="onSelectNotification(n)"
            >
              <p class="text-body-sm font-medium text-content-main">{{ n.title }}</p>
              <p class="text-caption text-content-subtle mt-0.5">{{ n.body }}</p>
              <p class="text-caption text-content-subtle mt-1">{{ formatTime(n.created_at) }}</p>
            </button>
          </template>
        </div>
      </div>
    </Teleport>

    <!-- Overlay para fechar ao clicar fora -->
    <div
      v-show="isOpen"
      class="fixed inset-0 z-[calc(var(--z-dropdown)-1)]"
      aria-hidden="true"
      @click="closePanel"
    />
  </div>
</template>

<style scoped>
.sidebar-action {
  @apply flex items-center gap-3 w-full px-3 py-2 rounded-lg
         text-body-sm text-content-secondary dark:text-content-secondary-dark
         transition-colors duration-200
         hover:bg-surface-light-tertiary dark:hover:bg-surface-dark-tertiary
         hover:text-content-primary dark:hover:text-content-primary-dark;
}
</style>
