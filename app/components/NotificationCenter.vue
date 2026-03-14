<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useToast, type ToastVariant } from '../composables/useToast'
import { useNotifications } from '../composables/useNotifications'
import type { Notification } from 'shared/types/database.types'

/**
 * NotificationCenter - Ícone de sino + dropdown com notificações do banco e histórico de toasts.
 * Contador (badge) usa estado global do useNotifications, carregado no layout assim que o user está disponível.
 */

const { notificationHistory, clearNotificationHistory } = useToast()
const {
  notifications,
  unreadCount,
  fetchNotifications,
  markAsRead,
  markAllAsRead,
} = useNotifications()

const isOpen = ref(false)
const panelRef = ref<HTMLElement | null>(null)
const buttonRef = ref<HTMLElement | null>(null)

const hasNotifications = computed(
  () => notifications.value.length > 0 || notificationHistory.value.length > 0
)
const countLabel = computed(() => {
  const n = unreadCount.value
  if (n === 0 && notificationHistory.value.length === 0) return ''
  const total = n > 0 ? n : notificationHistory.value.length
  if (total > 99) return '99+'
  return String(total)
})

const iconByVariant: Record<ToastVariant, string> = {
  info: 'info',
  success: 'check_circle',
  warning: 'warning',
  error: 'error',
}

const bgClassByVariant: Record<ToastVariant, string> = {
  info: 'bg-primary/10 text-primary',
  success: 'bg-success/10 text-success',
  warning: 'bg-warning/10 text-warning',
  error: 'bg-error/10 text-error',
}

function getIcon(variant: ToastVariant): string {
  return iconByVariant[variant] ?? 'info'
}

function getClasses(variant: ToastVariant): string {
  return bgClassByVariant[variant] ?? bgClassByVariant.info
}

function formatTime(createdAt: number): string {
  const d = new Date(createdAt)
  const now = new Date()
  const diffMs = now.getTime() - d.getTime()
  const diffMin = Math.floor(diffMs / 60000)
  if (diffMin < 1) return 'Agora'
  if (diffMin < 60) return `${diffMin} min atrás`
  const diffHour = Math.floor(diffMin / 60)
  if (diffHour < 24) return `${diffHour}h atrás`
  const diffDay = Math.floor(diffHour / 24)
  if (diffDay === 1) return 'Ontem'
  if (diffDay < 7) return `${diffDay} dias atrás`
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })
}

function formatTimeDb(createdAt: string): string {
  return formatTime(new Date(createdAt).getTime())
}

function toggle() {
  isOpen.value = !isOpen.value
  if (isOpen.value) void fetchNotifications()
}

async function onSelectDbNotification(n: Notification) {
  if (!n.read_at) await markAsRead(n.id)
}

function close() {
  isOpen.value = false
}

function handleClear() {
  clearNotificationHistory()
  close()
}

function handleClickOutside(event: MouseEvent) {
  const target = event.target as Node
  if (panelRef.value?.contains(target) || buttonRef.value?.contains(target)) return
  close()
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})
</script>

<template>
  <div id="notification-center" class="relative">
    <button
      ref="buttonRef"
      type="button"
      class="relative p-2.5 rounded-xl text-content-muted hover:bg-surface-overlay hover:text-content-main transition-colors"
      :aria-label="hasNotifications ? `${countLabel} notificações` : 'Notificações'"
      @click="toggle"
    >
      <span class="material-symbols-outlined text-xl">notifications</span>
      <span
        v-if="countLabel"
        class="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] flex items-center justify-center rounded-full bg-primary text-white text-caption font-bold px-1"
      >
        {{ countLabel }}
      </span>
    </button>

    <Transition
      enter-active-class="transition ease-out duration-150"
      enter-from-class="opacity-0 scale-95"
      enter-to-class="opacity-100 scale-100"
      leave-active-class="transition ease-in duration-100"
      leave-from-class="opacity-100 scale-100"
      leave-to-class="opacity-0 scale-95"
    >
      <div
        v-if="isOpen"
        ref="panelRef"
        class="fixed sm:absolute right-2 left-2 sm:left-auto sm:right-0 top-16 sm:top-full sm:mt-2 w-auto sm:w-[360px] max-h-[420px] flex flex-col rounded-2xl border border-default bg-surface-elevated shadow-xl z-[90] overflow-hidden"
      >
        <div class="flex items-center justify-between px-4 py-3 border-b border-default">
          <h3 class="text-body-sm font-semibold text-content-main">Notificações</h3>
          <div class="flex items-center gap-2">
            <button
              v-if="unreadCount > 0"
              type="button"
              class="text-caption text-primary hover:underline"
              @click="markAllAsRead"
            >
              Marcar todas como lidas
            </button>
            <button
              v-if="notificationHistory.length > 0"
              type="button"
              class="text-caption text-content-subtle hover:underline"
              @click="handleClear"
            >
              Limpar alertas
            </button>
          </div>
        </div>
        <div class="overflow-y-auto flex-1 min-h-0">
          <template v-if="notifications.length > 0">
            <ul class="divide-y divide-default">
              <li
                v-for="n in notifications"
                :key="n.id"
                class="flex items-start gap-3 px-4 py-3 hover:bg-surface-overlay/50 transition-colors cursor-pointer"
                :class="{ 'bg-primary/5': !n.read_at }"
                @click="onSelectDbNotification(n)"
              >
                <span class="material-symbols-outlined flex-shrink-0 mt-0.5 text-content-subtle">notifications</span>
                <div class="min-w-0 flex-1">
                  <p class="text-body-sm font-medium text-content-main">{{ n.title }}</p>
                  <p class="text-body-sm text-content-muted">{{ n.body }}</p>
                  <p class="text-caption text-content-subtle mt-0.5">{{ formatTimeDb(n.created_at) }}</p>
                </div>
              </li>
            </ul>
          </template>
          <template v-if="notificationHistory.length > 0">
            <p class="px-4 py-2 text-caption font-medium text-content-subtle border-t border-default">
              Alertas recentes
            </p>
            <ul class="divide-y divide-default">
              <li
                v-for="item in notificationHistory"
                :key="item.id"
                class="flex items-start gap-3 px-4 py-3 hover:bg-surface-overlay/50 transition-colors"
              >
                <span
                  class="material-symbols-outlined flex-shrink-0 mt-0.5 rounded-full p-1"
                  :class="getClasses(item.variant)"
                >
                  {{ getIcon(item.variant) }}
                </span>
                <div class="min-w-0 flex-1">
                  <p class="text-body-sm text-content-main">{{ item.message }}</p>
                  <p class="text-caption text-content-subtle mt-0.5">{{ formatTime(item.createdAt) }}</p>
                </div>
              </li>
            </ul>
          </template>
          <div
            v-if="notifications.length === 0 && notificationHistory.length === 0"
            class="px-4 py-8 text-center"
          >
            <span class="material-symbols-outlined text-4xl text-content-subtle opacity-50">notifications_none</span>
            <p class="text-body-sm text-content-muted mt-2">Nenhuma notificação</p>
            <p class="text-caption text-content-subtle mt-1">Os alertas e lembretes aparecerão aqui</p>
          </div>
        </div>
        <div class="px-4 py-2 border-t border-default bg-surface">
          <NuxtLink
            to="/perfil?tab=notifications"
            class="text-caption text-primary hover:underline block text-center py-1"
            @click="close"
          >
            Configurar notificações
          </NuxtLink>
        </div>
      </div>
    </Transition>
  </div>
</template>
