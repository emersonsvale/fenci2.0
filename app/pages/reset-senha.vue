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
      class="hidden lg:flex lg:w-[45%] bg-brand-teal relative items-start justify-start p-12 overflow-hidden"
    >
      <!-- Animated glow orbs -->
      <div class="absolute top-1/4 left-1/4 w-64 h-64 bg-primary/20 rounded-full blur-3xl animate-float" />
      <div class="absolute bottom-1/3 right-1/4 w-48 h-48 bg-white/10 rounded-full blur-2xl animate-float" style="animation-delay: -3s;" />

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

      <!-- Bottom tagline -->
      <div class="absolute bottom-12 left-12 right-12 z-10">
        <p class="text-white/80 text-body-lg font-medium">
          Crie uma senha segura para proteger sua conta
        </p>
      </div>
    </div>

    <!-- Right Panel - New Password Form -->
    <div 
      class="w-full lg:w-[55%] flex flex-col items-center justify-center p-8 lg:p-16 bg-surface transition-colors duration-300 relative"
    >
      <!-- Theme Toggle -->
      <button
        type="button"
        class="absolute top-6 right-6 p-2.5 rounded-xl hover:bg-surface-overlay transition-all duration-200"
        @click="toggleTheme"
        aria-label="Alternar tema"
      >
        <span class="material-symbols-outlined text-xl text-content-subtle">
          {{ isDark ? 'light_mode' : 'dark_mode' }}
        </span>
      </button>

      <!-- Mobile Logo -->
      <div class="lg:hidden mb-8">
        <img 
          src="/logotipo.png" 
          alt="Fenci" 
          class="h-10 w-auto dark:brightness-0 dark:invert"
        />
      </div>

      <div class="w-full max-w-md animate-fade-in-up">
        <!-- Success State -->
        <div v-if="resetSuccess" class="text-center animate-fade-in-up">
          <!-- Success Icon -->
          <div class="w-20 h-20 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <span class="material-symbols-outlined text-4xl text-primary">check_circle</span>
          </div>

          <h1 class="text-display-sm text-content-main mb-3">
            Senha redefinida!
          </h1>
          <p class="text-content-muted text-body-sm mb-8">
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
          <div class="mb-8">
            <h1 class="text-display-sm text-content-main mb-3">
              Nova senha
            </h1>
            <p class="text-content-muted text-body-sm">
              Digite sua nova senha abaixo para recuperar o acesso à sua conta.
            </p>
          </div>

          <!-- Error Message -->
          <Transition
            enter-active-class="transition-all duration-300 ease-out"
            enter-from-class="opacity-0 -translate-y-2"
            leave-active-class="transition-all duration-200 ease-in"
            leave-to-class="opacity-0 -translate-y-2"
          >
            <div 
              v-if="errorMessage" 
              class="mb-4 p-4 bg-error/8 border border-error/20 rounded-xl flex items-center gap-3"
            >
              <span class="material-symbols-outlined text-error text-lg">error</span>
              <p class="text-body-sm text-error">{{ errorMessage }}</p>
            </div>
          </Transition>

          <!-- Reset Password Form -->
          <form class="space-y-5" @submit.prevent="handleResetPassword">
            <!-- New Password Field -->
            <div>
              <label 
                for="password" 
                class="block text-body-sm font-medium text-content-muted mb-2"
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
                  class="absolute right-4 top-1/2 -translate-y-1/2 text-content-subtle hover:text-content-muted transition-colors"
                  @click="togglePasswordVisibility"
                  aria-label="Mostrar/ocultar senha"
                >
                  <span class="material-symbols-outlined text-xl">
                    {{ showPassword ? 'visibility_off' : 'visibility' }}
                  </span>
                </button>
              </div>
            </div>

            <!-- Confirm Password Field -->
            <div>
              <label 
                for="confirmPassword" 
                class="block text-body-sm font-medium text-content-muted mb-2"
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
                  class="absolute right-4 top-1/2 -translate-y-1/2 text-content-subtle hover:text-content-muted transition-colors"
                  @click="toggleConfirmPasswordVisibility"
                  aria-label="Mostrar/ocultar senha"
                >
                  <span class="material-symbols-outlined text-xl">
                    {{ showConfirmPassword ? 'visibility_off' : 'visibility' }}
                  </span>
                </button>
              </div>
            </div>

            <!-- Password Requirements -->
            <div class="text-caption text-content-subtle">
              <p class="mb-2 font-medium text-content-muted">Sua senha deve conter:</p>
              <ul class="space-y-1.5">
                <li class="flex items-center gap-2">
                  <span 
                    class="material-symbols-outlined text-sm transition-colors duration-200"
                    :class="password.length >= 6 ? 'text-primary' : 'text-content-subtle/40'"
                  >
                    {{ password.length >= 6 ? 'check_circle' : 'radio_button_unchecked' }}
                  </span>
                  <span :class="password.length >= 6 ? 'text-content-muted' : ''">
                    Mínimo de 6 caracteres
                  </span>
                </li>
                <li class="flex items-center gap-2">
                  <span 
                    class="material-symbols-outlined text-sm transition-colors duration-200"
                    :class="password && confirmPassword && password === confirmPassword ? 'text-primary' : 'text-content-subtle/40'"
                  >
                    {{ password && confirmPassword && password === confirmPassword ? 'check_circle' : 'radio_button_unchecked' }}
                  </span>
                  <span :class="password && confirmPassword && password === confirmPassword ? 'text-content-muted' : ''">
                    Senhas coincidem
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
              <span v-if="isLoading" class="inline-flex items-center gap-2">
                <span class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Redefinindo...
              </span>
              <span v-else>Redefinir senha</span>
            </button>
          </form>

          <!-- Back to Login Link -->
          <div class="mt-6 text-center">
            <NuxtLink
              to="/login"
              class="text-content-subtle hover:text-primary text-body-sm transition-colors"
            >
              Voltar para o login
            </NuxtLink>
          </div>
        </template>

        <!-- Version Badge -->
        <div class="mt-8 text-center">
          <span class="text-caption text-content-subtle/60">
            Versão beta
          </span>
        </div>
      </div>
    </div>
  </div>
</template>
