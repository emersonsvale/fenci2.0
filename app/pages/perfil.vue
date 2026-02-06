<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useProfile } from '~/composables/useProfile'
import ProfileHeader from '~/components/ProfileHeader.vue'
import ProfileTabs from '~/components/ProfileTabs.vue'
import ProfilePersonalInfo from '~/components/ProfilePersonalInfo.vue'
import ProfilePreferences from '~/components/ProfilePreferences.vue'
import ProfileNotifications from '~/components/ProfileNotifications.vue'
import ProfileSecurity from '~/components/ProfileSecurity.vue'
import ProfileSubscription from '~/components/ProfileSubscription.vue'
import ProfileDangerZone from '~/components/ProfileDangerZone.vue'

/**
 * Página de Perfil - Gerenciamento completo da conta do usuário
 */

definePageMeta({
  layout: 'dashboard'
})

const route = useRoute()
const { loadAll, isLoading } = useProfile()

const tabIds = ['personal', 'preferences', 'notifications', 'security', 'subscription', 'account'] as const
const activeTab = ref<'personal' | 'preferences' | 'notifications' | 'security' | 'subscription' | 'account'>('personal')

const tabs = [
  { id: 'personal', label: 'Dados pessoais', icon: 'person' },
  { id: 'preferences', label: 'Preferências', icon: 'tune' },
  { id: 'notifications', label: 'Notificações', icon: 'notifications' },
  { id: 'security', label: 'Segurança', icon: 'lock' },
  { id: 'subscription', label: 'Assinatura', icon: 'card_membership' },
  { id: 'account', label: 'Conta', icon: 'manage_accounts' }
]

watch(
  () => route.query.tab,
  (tab) => {
    if (tab && tabIds.includes(tab as typeof tabIds[number])) {
      activeTab.value = tab as typeof tabIds[number]
    }
  },
  { immediate: true }
)

onMounted(async () => {
  await loadAll()
})
</script>

<template>
  <div id="perfil-page" class="max-w-4xl mx-auto">
    <!-- Page Header -->
    <div class="mb-6">
      <h1 class="text-2xl font-bold text-content-primary dark:text-content-primary-dark">
        Meu Perfil
      </h1>
      <p class="text-content-secondary dark:text-content-secondary-dark mt-1">
        Gerencie suas informações e preferências
      </p>
    </div>

    <!-- Loading State -->
    <div 
      v-if="isLoading && !activeTab" 
      class="flex items-center justify-center py-12"
    >
      <div class="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
    </div>

    <!-- Content -->
    <div v-else class="space-y-6">
      <!-- Profile Header -->
      <ProfileHeader />

      <!-- Tabs Navigation -->
      <ProfileTabs v-model="activeTab" :tabs="tabs" />

      <!-- Tab Content -->
      <div class="py-6">
        <Transition name="fade" mode="out-in">
          <!-- Dados Pessoais -->
          <ProfilePersonalInfo v-if="activeTab === 'personal'" key="personal" />

          <!-- Preferências -->
          <ProfilePreferences v-else-if="activeTab === 'preferences'" key="preferences" />

          <!-- Notificações -->
          <ProfileNotifications v-else-if="activeTab === 'notifications'" key="notifications" />

          <!-- Segurança -->
          <ProfileSecurity v-else-if="activeTab === 'security'" key="security" />

          <!-- Assinatura -->
          <ProfileSubscription v-else-if="activeTab === 'subscription'" key="subscription" />

          <!-- Conta / Danger Zone -->
          <ProfileDangerZone v-else-if="activeTab === 'account'" key="account" />
        </Transition>
      </div>
    </div>
  </div>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.15s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
