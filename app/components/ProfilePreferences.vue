<script setup lang="ts">
import { ref, watch, onMounted } from 'vue'
import { useProfile } from '~/composables/useProfile'
import { useTheme } from '~/composables/useTheme'
import AppButton from './AppButton.vue'

/**
 * ProfilePreferences - Seção de preferências do perfil
 */

const { profile, updateProfile, loadProfile, isLoading } = useProfile()
const { isDark, toggleTheme } = useTheme()

const preferredCurrency = ref('BRL')
const successMessage = ref('')
const localError = ref('')

const currencies = [
  { value: 'BRL', label: 'Real Brasileiro (R$)' },
  { value: 'USD', label: 'Dólar Americano ($)' },
  { value: 'EUR', label: 'Euro (€)' },
  { value: 'GBP', label: 'Libra Esterlina (£)' }
]

// Sincroniza com profile
watch(profile, (newProfile) => {
  if (newProfile) {
    preferredCurrency.value = newProfile.preferred_currency || 'BRL'
  }
}, { immediate: true })

onMounted(async () => {
  if (!profile.value) {
    await loadProfile()
  }
})

async function handleSave(): Promise<void> {
  successMessage.value = ''
  localError.value = ''

  const success = await updateProfile({
    preferred_currency: preferredCurrency.value
  })

  if (success) {
    successMessage.value = 'Preferências salvas com sucesso!'
    setTimeout(() => { successMessage.value = '' }, 3000)
  } else {
    localError.value = 'Erro ao salvar preferências'
  }
}
</script>

<template>
  <div id="profile-preferences" class="space-y-8">
    <div>
      <h2 class="text-lg font-semibold text-content-primary dark:text-content-primary-dark mb-1">
        Preferências
      </h2>
      <p class="text-sm text-content-secondary dark:text-content-secondary-dark">
        Personalize sua experiência no Fenci
      </p>
    </div>

    <!-- Tema -->
    <div class="p-4 rounded-xl bg-surface-light-secondary dark:bg-surface-dark-secondary border border-border-light dark:border-border-dark">
      <div class="flex items-center justify-between">
        <div>
          <h3 class="font-medium text-content-primary dark:text-content-primary-dark">
            Tema
          </h3>
          <p class="text-sm text-content-secondary dark:text-content-secondary-dark mt-1">
            {{ isDark ? 'Modo escuro ativado' : 'Modo claro ativado' }}
          </p>
        </div>
        <button
          type="button"
          class="relative w-14 h-8 rounded-full transition-colors duration-300"
          :class="isDark ? 'bg-primary' : 'bg-gray-300 dark:bg-gray-600'"
          @click="toggleTheme"
        >
          <span 
            class="absolute top-1 w-6 h-6 rounded-full bg-white shadow transition-transform duration-300 flex items-center justify-center"
            :class="isDark ? 'translate-x-7' : 'translate-x-1'"
          >
            <span class="material-symbols-outlined text-sm text-gray-600">
              {{ isDark ? 'dark_mode' : 'light_mode' }}
            </span>
          </span>
        </button>
      </div>
    </div>

    <!-- Moeda -->
    <form class="space-y-6 max-w-md" @submit.prevent="handleSave">
      <div>
        <label 
          for="profile-currency"
          class="block text-sm font-medium text-content-primary dark:text-content-primary-dark mb-2"
        >
          Moeda padrão
        </label>
        <select
          id="profile-currency"
          v-model="preferredCurrency"
          class="input-field"
        >
          <option v-for="currency in currencies" :key="currency.value" :value="currency.value">
            {{ currency.label }}
          </option>
        </select>
        <p class="mt-1 text-xs text-content-tertiary dark:text-content-tertiary-dark">
          Usada para exibir valores em todo o sistema
        </p>
      </div>

      <!-- Messages -->
      <div 
        v-if="successMessage" 
        class="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800"
      >
        <p class="text-sm text-emerald-600 dark:text-emerald-400">{{ successMessage }}</p>
      </div>

      <div 
        v-if="localError" 
        class="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800"
      >
        <p class="text-sm text-red-600 dark:text-red-400">{{ localError }}</p>
      </div>

      <AppButton
        type="submit"
        :loading="isLoading"
        loading-label="Salvando..."
      >
        Salvar preferências
      </AppButton>
    </form>
  </div>
</template>
