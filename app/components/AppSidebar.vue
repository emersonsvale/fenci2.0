<script setup lang="ts">
import { computed, watch, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useSupabaseClient, useSupabaseUser } from '#imports'
import { useTheme } from '~/composables/useTheme'
import { useProfile } from '~/composables/useProfile'
import { useSidebar } from '~/composables/useSidebar'
import NotificationBell from '~/components/NotificationBell.vue'

/**
 * AppSidebar - Sidebar de navegação principal
 * Usado em todo o sistema para navegação entre módulos
 * Exibe avatar do usuário (profile ou user_metadata)
 */

interface NavItem {
  id: string
  label: string
  icon: string
  route: string
  badge?: number
}

const route = useRoute()
const supabase = useSupabaseClient()
const supabaseUser = useSupabaseUser()
const { avatarUrl, profile, loadProfile } = useProfile()

const navItems: NavItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: 'dashboard', route: '/dashboard' },
  { id: 'extratos', label: 'Extrato', icon: 'receipt', route: '/extratos' },
  { id: 'contas', label: 'Contas', icon: 'account_balance', route: '/contas' },
  { id: 'calendario', label: 'Calendário', icon: 'calendar_month', route: '/calendario' },
  { id: 'planejamentos', label: 'Planejamentos', icon: 'savings', route: '/planejamentos' },
]

const currentRoute = computed(() => route.path)

// Dados do usuário: nome e avatar (profile + auth)
const user = computed(() => {
  const u = supabaseUser.value
  if (!u) {
    return {
      name: 'Usuário',
      subtitle: 'Meu perfil',
      avatar: null as string | null,
    }
  }
  const name = profile.value?.full_name || u.user_metadata?.full_name || u.email?.split('@')[0] || 'Usuário'
  return {
    name,
    subtitle: 'Meu perfil',
    avatar: avatarUrl.value,
  }
})

// Carregar profile ao montar e quando o user existir para exibir avatar/nome
onMounted(() => {
  if (supabaseUser.value) void loadProfile()
})
watch(supabaseUser, (u) => {
  if (u) void loadProfile()
}, { immediate: true })

// Função de logout
const handleLogout = async (): Promise<void> => {
  try {
    await supabase.auth.signOut()
    await navigateTo('/login')
  } catch (error) {
    console.error('Erro ao fazer logout:', error)
  }
}

const { isDark, toggleTheme } = useTheme()
const { isCollapsed, toggle: toggleSidebar, width: sidebarWidth } = useSidebar()
</script>

<template>
  <aside
    id="app-sidebar"
    class="app-sidebar fixed left-0 top-0 h-screen bg-surface-elevated border-r border-default flex flex-col z-sticky transition-[width] duration-200 ease-smooth"
    :style="{ width: `${sidebarWidth}px` }"
  >
    <!-- Logo + Toggle -->
    <div class="flex items-center gap-2 p-4 pb-6 shrink-0" :class="isCollapsed ? 'justify-center px-3' : 'justify-between'">
      <NuxtLink v-if="!isCollapsed" to="/dashboard" class="block min-w-0 flex-1">
        <img
          src="/logotipo.png"
          alt="Fenci"
          class="h-8 w-auto dark:brightness-0 dark:invert"
        />
      </NuxtLink>
      <button
        type="button"
        class="sidebar-toggle shrink-0 p-2 rounded-lg text-content-secondary hover:bg-surface-light-tertiary hover:text-content-primary dark:text-content-secondary-dark dark:hover:bg-surface-dark-tertiary dark:hover:text-content-primary-dark transition-colors"
        :aria-label="isCollapsed ? 'Expandir menu' : 'Minimizar menu'"
        @click="toggleSidebar"
      >
        <span class="material-symbols-outlined text-xl">
          {{ isCollapsed ? 'menu_open' : 'menu' }}
        </span>
      </button>
    </div>

    <!-- Navigation -->
    <nav class="flex-1 px-3 min-w-0">
      <ul class="space-y-1">
        <li v-for="item in navItems" :key="item.id">
          <NuxtLink
            :to="item.route"
            class="nav-item"
            :class="{
              'nav-item-active': currentRoute === item.route || currentRoute.startsWith(item.route + '/'),
              'sidebar-collapsed': isCollapsed,
            }"
            :title="isCollapsed ? item.label : undefined"
          >
            <span class="material-symbols-outlined nav-icon shrink-0">{{ item.icon }}</span>
            <span class="nav-label truncate" :class="{ 'sr-only': isCollapsed }">{{ item.label }}</span>
          </NuxtLink>
        </li>
      </ul>
    </nav>

    <!-- User Profile Section -->
    <div class="p-3 mt-auto" :class="isCollapsed ? 'flex flex-col items-center' : ''">
      <!-- User Info -->
      <NuxtLink to="/perfil" class="sidebar-user-link" :class="isCollapsed ? 'justify-center p-2' : ''" :title="isCollapsed ? user.name : undefined">
        <div class="sidebar-avatar">
          <img v-if="user.avatar" :src="user.avatar" :alt="user.name" class="w-full h-full object-cover rounded-full" />
          <span v-else class="sidebar-avatar-initial">{{ user.name.charAt(0) }}</span>
        </div>
        <div v-if="!isCollapsed" class="flex-1 min-w-0">
          <p class="text-body-sm font-medium text-content-main truncate">{{ user.name }}</p>
          <p class="text-caption text-content-subtle">{{ user.subtitle }}</p>
        </div>
      </NuxtLink>

      <!-- Actions -->
      <div class="mt-2 space-y-0.5" :class="isCollapsed ? 'flex flex-col items-center w-full' : ''">
        <button
          type="button"
          class="sidebar-action"
          aria-label="Alternar modo escuro"
          :title="isDark ? 'Modo Claro' : 'Modo Escuro'"
          @click="toggleTheme"
        >
          <span class="material-symbols-outlined text-lg shrink-0">
            {{ isDark ? 'light_mode' : 'dark_mode' }}
          </span>
          <span class="truncate" :class="{ 'sr-only': isCollapsed }">{{ isDark ? 'Modo Claro' : 'Modo Escuro' }}</span>
        </button>
        <NotificationBell :collapsed="isCollapsed" />
        <button class="sidebar-action" title="Novo Aqui?">
          <span class="material-symbols-outlined text-lg shrink-0">help</span>
          <span class="truncate" :class="{ 'sr-only': isCollapsed }">Novo Aqui?</span>
        </button>
        <button class="sidebar-action sidebar-action-logout" title="Sair" @click="handleLogout">
          <span class="material-symbols-outlined text-lg shrink-0">logout</span>
          <span class="truncate" :class="{ 'sr-only': isCollapsed }">Sair</span>
        </button>
      </div>

      <!-- Version -->
      <p v-if="!isCollapsed" class="text-caption text-content-subtle mt-3 px-2 opacity-70">Versão 2.0</p>
    </div>
  </aside>
</template>

<style scoped>
.nav-item {
  @apply flex items-center gap-3 px-3 py-2 rounded-lg text-body-sm
         text-content-secondary dark:text-content-secondary-dark
         transition-all duration-200 ease-smooth
         hover:bg-surface-light-tertiary dark:hover:bg-surface-dark-tertiary
         hover:text-content-primary dark:hover:text-content-primary-dark;
}

.nav-item.sidebar-collapsed {
  @apply justify-center px-2;
}

.nav-item-active {
  @apply bg-primary text-white;
}

.nav-item-active .nav-icon {
  @apply text-white;
}

.nav-icon {
  @apply text-xl;
}

.nav-label {
  @apply flex-1;
}

.sidebar-user-link {
  @apply flex items-center gap-3 p-2 rounded-lg
         transition-colors duration-200
         hover:bg-surface-light-tertiary dark:hover:bg-surface-dark-tertiary;
}

.sidebar-avatar {
  @apply w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0
         bg-surface-light-tertiary dark:bg-surface-dark-tertiary;
}

.sidebar-avatar-initial {
  @apply text-body-sm font-medium text-content-primary dark:text-content-primary-dark;
}

.sidebar-action {
  @apply flex items-center gap-3 w-full px-3 py-2 rounded-lg
         text-body-sm text-content-secondary dark:text-content-secondary-dark
         transition-colors duration-200
         hover:bg-surface-light-tertiary dark:hover:bg-surface-dark-tertiary
         hover:text-content-primary dark:hover:text-content-primary-dark;
}

.sidebar-action-logout:hover {
  @apply text-error;
}
</style>
