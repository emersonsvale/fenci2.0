<script setup lang="ts">
import { ref, watch, onMounted } from 'vue'
import { useProfile } from '~/composables/useProfile'
import AppInput from './AppInput.vue'
import AppButton from './AppButton.vue'
import AvatarUploader from './AvatarUploader.vue'

/**
 * ProfilePersonalInfo - Seção de dados pessoais do perfil
 */

const { profile, userEmail, updateProfile, loadProfile, isLoading } = useProfile()

const fullName = ref('')
const successMessage = ref('')
const localError = ref('')

// Sincroniza com profile
watch(profile, (newProfile) => {
  if (newProfile) {
    fullName.value = newProfile.full_name || ''
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
    full_name: fullName.value.trim() || null
  })

  if (success) {
    successMessage.value = 'Dados salvos com sucesso!'
    setTimeout(() => { successMessage.value = '' }, 3000)
  } else {
    localError.value = 'Erro ao salvar dados'
  }
}
</script>

<template>
  <div id="profile-personal-info" class="space-y-8">
    <div>
      <h2 class="text-lg font-semibold text-content-primary dark:text-content-primary-dark mb-1">
        Dados pessoais
      </h2>
      <p class="text-sm text-content-secondary dark:text-content-secondary-dark">
        Gerencie suas informações pessoais
      </p>
    </div>

    <!-- Avatar -->
    <AvatarUploader />

    <!-- Form -->
    <form class="space-y-6 max-w-md" @submit.prevent="handleSave">
      <AppInput
        id="profile-full-name"
        v-model="fullName"
        label="Nome completo"
        placeholder="Digite seu nome"
      />

      <div>
        <label class="block text-sm font-medium text-content-primary dark:text-content-primary-dark mb-2">
          E-mail
        </label>
        <div class="input-field bg-surface-light-tertiary dark:bg-surface-dark-tertiary cursor-not-allowed opacity-75">
          {{ userEmail }}
        </div>
        <p class="mt-1 text-xs text-content-tertiary dark:text-content-tertiary-dark">
          O e-mail não pode ser alterado
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
        Salvar alterações
      </AppButton>
    </form>
  </div>
</template>
