<script setup lang="ts">
import { useSidebar } from '~/composables/useSidebar'

/**
 * DashboardLayout - Layout principal para área logada
 * Inclui sidebar de navegação (minimizável) e área de conteúdo
 */
const { width: sidebarWidth } = useSidebar()
</script>

<template>
  <div id="dashboard-layout" class="min-h-screen bg-surface">
    <!-- Sidebar (fixed) -->
    <AppSidebar />

    <!-- Main Content Area -->
    <main class="min-h-screen transition-[padding-left] duration-200 ease-smooth" :style="{ paddingLeft: `${sidebarWidth}px` }">
      <div class="p-6 lg:p-8 max-w-[1400px] mx-auto">
        <slot />
      </div>
    </main>
  </div>
</template>
