<script setup lang="ts">
import { computed } from 'vue'
import { useProfile } from '~/composables/useProfile'

/**
 * ProfileHeader - Cabeçalho do perfil com avatar e info principal
 */

const { 
  profile, 
  avatarUrl, 
  userEmail, 
  subscriptionStatusLabel, 
  trialDaysRemaining 
} = useProfile()

const displayName = computed(() => {
  return profile.value?.full_name || userEmail.value?.split('@')[0] || 'Usuário'
})

const initials = computed(() => {
  const name = displayName.value
  return name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()
})

const statusColor = computed(() => {
  const status = profile.value?.subscription_status
  const colors: Record<string, string> = {
    trial: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
    active: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
    cancelled: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    expired: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400'
  }
  return colors[status || 'trial'] || colors.trial
})
</script>

<template>
  <div id="profile-header" class="flex items-center gap-6 pb-6 border-b border-border-light dark:border-border-dark">
    <!-- Avatar -->
    <div class="relative">
      <div class="w-24 h-24 rounded-full overflow-hidden bg-surface-light-secondary dark:bg-surface-dark-secondary border-2 border-border-light dark:border-border-dark">
        <img 
          v-if="avatarUrl" 
          :src="avatarUrl" 
          :alt="displayName"
          class="w-full h-full object-cover"
        />
        <div 
          v-else 
          class="w-full h-full flex items-center justify-center bg-primary/10 text-primary text-2xl font-semibold"
        >
          {{ initials }}
        </div>
      </div>
    </div>

    <!-- Info -->
    <div class="flex-1">
      <h1 class="text-2xl font-bold text-content-primary dark:text-content-primary-dark">
        {{ displayName }}
      </h1>
      <p class="text-content-secondary dark:text-content-secondary-dark mt-1">
        {{ userEmail }}
      </p>
      
      <!-- Status Badge -->
      <div class="mt-3 flex items-center gap-2">
        <span 
          class="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium"
          :class="statusColor"
        >
          {{ subscriptionStatusLabel }}
        </span>
        <span 
          v-if="profile?.subscription_status === 'trial' && trialDaysRemaining > 0"
          class="text-sm text-content-tertiary dark:text-content-tertiary-dark"
        >
          {{ trialDaysRemaining }} dias restantes
        </span>
      </div>
    </div>
  </div>
</template>
