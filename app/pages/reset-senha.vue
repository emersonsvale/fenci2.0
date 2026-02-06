<script setup lang="ts">
import { ref } from 'vue'
import { useSupabaseClient } from '#imports'
import { useTheme } from '~/composables/useTheme'

const supabase = useSupabaseClient()

const password = ref('')
const confirmPassword = ref('')
const showPassword = ref(false)
const showConfirmPassword = ref(false)
const isLoading = ref(false)
const resetSuccess = ref(false)
const errorMessage = ref('')
const { isDark, toggleTheme } = useTheme()

const togglePasswordVisibility = (): void => {
  showPassword.value = !showPassword.value
}

const toggleConfirmPasswordVisibility = (): void => {
  showConfirmPassword.value = !showConfirmPassword.value
}

const handleResetPassword = async (): Promise<void> => {
  errorMessage.value = ''

  if (password.value !== confirmPassword.value) {
    errorMessage.value = 'As senhas não coincidem'
    return
  }

  isLoading.value = true
  
  try {
    const { error } = await supabase.auth.updateUser({
      password: password.value,
    })

    if (error) {
      errorMessage.value = error.message
      return
    }

    // Sucesso
    resetSuccess.value = true
  } catch (error) {
    console.error('Reset password error:', error)
    errorMessage.value = 'Ocorreu um erro ao redefinir a senha. Tente novamente.'
  } finally {
    isLoading.value = false
  }
}
</script>

<template>
  <div id="reset-senha-page" class="min-h-screen flex">
    <!-- Left Panel - Brand Section -->
    <div 
      class="hidden lg:flex lg:w-1/2 bg-brand-teal relative items-start justify-start p-12"
    >
      <!-- Logo -->
      <div class="relative z-10">
        <img 
          src="/logotipo.png" 
          alt="Fenci" 
          class="h-12 w-auto"
        />
      </div>
      
      <!-- Pattern decorativo -->
      <BrandPattern />
    </div>

    <!-- Right Panel - New Password Form -->
    <div 
      class="w-full lg:w-1/2 flex flex-col items-center justify-center p-8 lg:p-16 bg-surface transition-colors duration-300"
    >
      <!-- Theme Toggle -->
      <button
        type="button"
        class="absolute top-6 right-6 p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        @click="toggleTheme"
        aria-label="Alternar tema"
      >
        <svg
          v-if="isDark"
          class="w-6 h-6 text-gray-600 dark:text-gray-300"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
          />
        </svg>
        <svg
          v-else
          class="w-6 h-6 text-gray-600 dark:text-gray-300"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
          />
        </svg>
      </button>

      <!-- Mobile Logo -->
      <div class="lg:hidden mb-8">
        <img 
          src="/logotipo.png" 
          alt="Fenci" 
          class="h-10 w-auto"
        />
      </div>

      <div class="w-full max-w-md">
        <!-- Success State -->
        <div v-if="resetSuccess" class="text-center">
          <!-- Success Icon -->
          <div class="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg 
              class="w-10 h-10 text-primary" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path 
                stroke-linecap="round" 
                stroke-linejoin="round" 
                stroke-width="2" 
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>

          <h1 class="text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white mb-3">
            Senha redefinida!
          </h1>
          <p class="text-gray-600 dark:text-gray-400 text-sm lg:text-base mb-8">
            Sua senha foi alterada com sucesso.<br />
            Agora você pode fazer login com sua nova senha.
          </p>

          <NuxtLink
            to="/login"
            class="btn-primary inline-flex items-center justify-center"
          >
            Ir para o login
          </NuxtLink>
        </div>

        <!-- Form State -->
        <template v-else>
          <!-- Header -->
          <div class="text-center mb-8">
            <h1 class="text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white mb-3">
              Nova senha
            </h1>
            <p class="text-gray-600 dark:text-gray-400 text-sm lg:text-base">
              Digite sua nova senha abaixo
            </p>
          </div>

          <!-- Divider -->
          <div class="w-16 h-1 bg-primary mx-auto mb-8 rounded-full" />

          <!-- Error Message -->
          <div 
            v-if="errorMessage" 
            class="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg"
          >
            <p class="text-sm text-red-600 dark:text-red-400">{{ errorMessage }}</p>
          </div>

          <!-- Reset Password Form -->
          <form class="space-y-5" @submit.prevent="handleResetPassword">
            <!-- New Password Field -->
            <div>
              <label 
                for="password" 
                class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                Nova senha
              </label>
              <div class="relative">
                <input
                  id="password"
                  v-model="password"
                  :type="showPassword ? 'text' : 'password'"
                  placeholder="min 6 caracteres"
                  required
                  minlength="6"
                  class="input-field pr-12"
                />
                <button
                  type="button"
                  class="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                  @click="togglePasswordVisibility"
                  aria-label="Mostrar/ocultar senha"
                >
                  <svg
                    v-if="!showPassword"
                    class="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                    />
                  </svg>
                  <svg
                    v-else
                    class="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
                    />
                  </svg>
                </button>
              </div>
            </div>

            <!-- Confirm Password Field -->
            <div>
              <label 
                for="confirmPassword" 
                class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                Confirmar nova senha
              </label>
              <div class="relative">
                <input
                  id="confirmPassword"
                  v-model="confirmPassword"
                  :type="showConfirmPassword ? 'text' : 'password'"
                  placeholder="Digite a senha novamente"
                  required
                  minlength="6"
                  class="input-field pr-12"
                />
                <button
                  type="button"
                  class="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                  @click="toggleConfirmPasswordVisibility"
                  aria-label="Mostrar/ocultar senha"
                >
                  <svg
                    v-if="!showConfirmPassword"
                    class="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                    />
                  </svg>
                  <svg
                    v-else
                    class="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
                    />
                  </svg>
                </button>
              </div>
            </div>

            <!-- Password Requirements -->
            <div class="text-sm text-gray-500 dark:text-gray-400">
              <p class="mb-2">Sua senha deve conter:</p>
              <ul class="space-y-1 ml-4">
                <li class="flex items-center gap-2">
                  <svg 
                    :class="password.length >= 6 ? 'text-primary' : 'text-gray-300 dark:text-gray-600'"
                    class="w-4 h-4" 
                    fill="currentColor" 
                    viewBox="0 0 20 20"
                  >
                    <path 
                      fill-rule="evenodd" 
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" 
                      clip-rule="evenodd"
                    />
                  </svg>
                  <span :class="password.length >= 6 ? 'text-gray-700 dark:text-gray-300' : ''">
                    Mínimo de 6 caracteres
                  </span>
                </li>
              </ul>
            </div>

            <!-- Submit Button -->
            <button
              type="submit"
              :disabled="isLoading || password.length < 6"
              class="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span v-if="isLoading">Redefinindo...</span>
              <span v-else>Redefinir senha</span>
            </button>
          </form>

          <!-- Back to Login Link -->
          <div class="mt-6 text-center">
            <NuxtLink
              to="/login"
              class="text-gray-600 dark:text-gray-400 hover:text-primary transition-colors"
            >
              Voltar para o login
            </NuxtLink>
          </div>
        </template>

        <!-- Version Badge -->
        <div class="mt-8 text-center">
          <span class="text-xs text-gray-400 dark:text-gray-500">
            Versão beta [!]
          </span>
        </div>
      </div>
    </div>
  </div>
</template>
