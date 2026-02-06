<script setup lang="ts">
import { ref } from 'vue'
import { useProfile } from '~/composables/useProfile'
import AppInput from './AppInput.vue'
import AppButton from './AppButton.vue'

/**
 * ProfileSecurity - Seção de segurança do perfil
 */

const { isGoogleUser, updatePassword, isLoading } = useProfile()

const currentPassword = ref('')
const newPassword = ref('')
const confirmPassword = ref('')
const successMessage = ref('')
const localError = ref('')

async function handleChangePassword(): Promise<void> {
  successMessage.value = ''
  localError.value = ''

  // Validações
  if (!currentPassword.value || !newPassword.value || !confirmPassword.value) {
    localError.value = 'Preencha todos os campos'
    return
  }

  if (newPassword.value.length < 6) {
    localError.value = 'A nova senha deve ter pelo menos 6 caracteres'
    return
  }

  if (newPassword.value !== confirmPassword.value) {
    localError.value = 'As senhas não coincidem'
    return
  }

  const result = await updatePassword(currentPassword.value, newPassword.value)

  if (result.success) {
    successMessage.value = result.message
    currentPassword.value = ''
    newPassword.value = ''
    confirmPassword.value = ''
    setTimeout(() => { successMessage.value = '' }, 5000)
  } else {
    localError.value = result.message
  }
}
</script>

<template>
  <div id="profile-security" class="space-y-8">
    <div>
      <h2 class="text-lg font-semibold text-content-primary dark:text-content-primary-dark mb-1">
        Segurança
      </h2>
      <p class="text-sm text-content-secondary dark:text-content-secondary-dark">
        Gerencie a segurança da sua conta
      </p>
    </div>

    <!-- Alterar Senha -->
    <div class="p-6 rounded-xl bg-surface-light-secondary dark:bg-surface-dark-secondary border border-border-light dark:border-border-dark">
      <h3 class="font-medium text-content-primary dark:text-content-primary-dark mb-4">
        Alterar senha
      </h3>

      <!-- Google User Warning -->
      <div 
        v-if="isGoogleUser" 
        class="p-4 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 mb-4"
      >
        <div class="flex items-start gap-3">
          <span class="material-symbols-outlined text-amber-600 dark:text-amber-400">info</span>
          <div>
            <p class="text-sm text-amber-700 dark:text-amber-300 font-medium">
              Conta vinculada ao Google
            </p>
            <p class="text-sm text-amber-600 dark:text-amber-400 mt-1">
              Você fez login com o Google, então a senha é gerenciada pela sua conta Google.
            </p>
          </div>
        </div>
      </div>

      <!-- Change Password Form -->
      <form 
        v-if="!isGoogleUser" 
        class="space-y-4 max-w-md" 
        @submit.prevent="handleChangePassword"
      >
        <AppInput
          id="current-password"
          v-model="currentPassword"
          type="password"
          label="Senha atual"
          placeholder="Digite sua senha atual"
          required
        />

        <AppInput
          id="new-password"
          v-model="newPassword"
          type="password"
          label="Nova senha"
          placeholder="Mínimo 6 caracteres"
          required
          :minlength="6"
        />

        <AppInput
          id="confirm-password"
          v-model="confirmPassword"
          type="password"
          label="Confirmar nova senha"
          placeholder="Digite novamente"
          required
          :minlength="6"
        />

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
          loading-label="Alterando..."
        >
          Alterar senha
        </AppButton>
      </form>
    </div>
  </div>
</template>
