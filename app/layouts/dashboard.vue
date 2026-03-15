<script setup lang="ts">
import { computed, watch, onMounted, onUnmounted } from 'vue'
import { useSupabaseUser } from '#imports'
import { useSidebar } from '~/composables/useSidebar'
import { useSwipeGesture } from '~/composables/useSwipeGesture'
import { useNotifications } from '~/composables/useNotifications'
import AppSidebar from '~/components/AppSidebar.vue'
import PwaInstallBanner from '~/components/PwaInstallBanner.vue'

const BASE_TITLE = 'Fenci - Gestão Financeira Pessoal'

function buildTitle(unread: number): string {
  return unread > 0 ? `Fenci (${unread}) - Gestão Financeira Pessoal` : BASE_TITLE
}

/**
 * DashboardLayout - Layout principal para área logada
 * Desktop: sidebar fixa com padding-left
 * Mobile: sem sidebar fixa, header com hamburger, bottom nav bar
 * Swipe: Gesto de swipe da borda esquerda para abrir a sidebar
 */
const user = useSupabaseUser()
const { unreadCount, loadWhenSessionReady } = useNotifications()
useHead(() => ({
  title: buildTitle(unreadCount.value),
}))

// Carrega notificações assim que o usuário estiver disponível (reativo)
watch(
  () => user.value?.id,
  (uid) => {
    if (uid) void loadWhenSessionReady()
  },
  { immediate: true }
)

let sessionLoadTimeout: ReturnType<typeof setTimeout> | null = null
onMounted(() => {
  // Carrega notificações no cliente usando getSession() (useSupabaseUser pode ainda não ter resolvido)
  sessionLoadTimeout = setTimeout(() => {
    void loadWhenSessionReady()
    sessionLoadTimeout = null
  }, 150)
  const updateTitle = () => {
    document.title = buildTitle(unreadCount.value)
  }
  updateTitle()
  watch(unreadCount, updateTitle)
})
onUnmounted(() => {
  if (sessionLoadTimeout) clearTimeout(sessionLoadTimeout)
})

const { width: sidebarWidth, isMobile, isMobileOpen, openMobile, closeMobile } = useSidebar()

// Gesture: swipe da borda esquerda para abrir sidebar, swipe para esquerda para fechar
const swipeEnabled = computed(() => isMobile.value)
useSwipeGesture({
  enabled: swipeEnabled,
  onSwipeRight: () => {
    if (!isMobileOpen.value) openMobile()
  },
  onSwipeLeft: () => {
    if (isMobileOpen.value) closeMobile()
  },
})
</script>

<template>
  <div id="dashboard-layout" class="min-h-screen bg-surface">
    <!-- Sidebar (fixed no desktop, drawer no mobile) -->
    <AppSidebar />

    <!-- Mobile Top Bar (sem botão menu — navegação pela bottom bar; sidebar abre por swipe) -->
    <header
      v-if="isMobile"
      id="mobile-top-bar"
      class="fixed top-0 left-0 right-0 h-14 bg-surface-elevated/90 backdrop-blur-xl border-b border-default-subtle z-sticky flex items-center justify-center px-4 safe-top"
    >
      <NuxtLink to="/dashboard">
        <img
          src="/logotipo.png"
          alt="Fenci"
          class="h-7 w-auto dark:brightness-0 dark:invert"
        />
      </NuxtLink>
    </header>

    <!-- Main Content Area -->
    <main
      class="min-h-screen transition-[padding-left] duration-200 ease-smooth"
      :style="{ paddingLeft: isMobile ? '0px' : `${sidebarWidth}px` }"
      :class="isMobile ? 'pt-14 pb-16' : ''"
    >
      <div class="p-4 lg:p-8 max-w-[1400px] mx-auto">
        <slot />
      </div>
    </main>

    <!-- PWA Install Banner -->
    <PwaInstallBanner />
  </div>
</template>
