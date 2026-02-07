<script setup lang="ts">
import { computed } from 'vue'
import { useSidebar } from '~/composables/useSidebar'
import { useSwipeGesture } from '~/composables/useSwipeGesture'
import AppSidebar from '~/components/AppSidebar.vue'
import PwaInstallBanner from '~/components/PwaInstallBanner.vue'

/**
 * DashboardLayout - Layout principal para área logada
 * Desktop: sidebar fixa com padding-left
 * Mobile: sem sidebar fixa, header com hamburger, bottom nav bar
 * Swipe: Gesto de swipe da borda esquerda para abrir a sidebar
 */
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

    <!-- Mobile Top Bar -->
    <header
      v-if="isMobile"
      id="mobile-top-bar"
      class="fixed top-0 left-0 right-0 h-14 bg-surface-elevated border-b border-default z-sticky flex items-center justify-between px-4 safe-top"
    >
      <button
        type="button"
        class="p-2 -ml-2 rounded-lg hover:bg-surface-overlay transition-colors"
        aria-label="Abrir menu"
        @click="openMobile"
      >
        <span class="material-symbols-outlined text-xl text-content-main">menu</span>
      </button>
      <NuxtLink to="/dashboard">
        <img
          src="/logotipo.png"
          alt="Fenci"
          class="h-7 w-auto dark:brightness-0 dark:invert"
        />
      </NuxtLink>
      <div class="w-9" />
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
