<script setup lang="ts">
import { ref } from 'vue'
import { useSupabaseClient } from '#imports'
import { useTheme } from '~/composables/useTheme'

definePageMeta({
  middleware: ['guest-only'],
})

const supabase = useSupabaseClient()

const name = ref('')
const email = ref('')
const password = ref('')
const confirmPassword = ref('')
const showPassword = ref(false)
const showConfirmPassword = ref(false)
const acceptTerms = ref(false)
const isLoading = ref(false)
const errorMessage = ref('')
const successMessage = ref('')

const togglePasswordVisibility = (): void => {
  showPassword.value = !showPassword.value
}

const toggleConfirmPasswordVisibility = (): void => {
  showConfirmPassword.value = !showConfirmPassword.value
}

const handleRegister = async (): Promise<void> => {
  errorMessage.value = ''
  successMessage.value = ''

  if (password.value !== confirmPassword.value) {
    errorMessage.value = 'As senhas não coincidem'
    return
  }

  if (!acceptTerms.value) {
    errorMessage.value = 'Você precisa aceitar os termos de uso'
    return
  }

  isLoading.value = true
  
  try {
    const { error } = await supabase.auth.signUp({
      email: email.value,
      password: password.value,
      options: {
        data: {
          full_name: name.value,
        },
        emailRedirectTo: `${window.location.origin}/confirm`,
      },
    })

    if (error) {
      if (error.message.includes('already registered')) {
        errorMessage.value = 'Este e-mail já está cadastrado'
      } else {
        errorMessage.value = error.message
      }
      return
    }

    // Sucesso - mostra mensagem para verificar e-mail
    successMessage.value = 'Conta criada! Verifique seu e-mail para confirmar o cadastro.'
    
    // Limpa o formulário
    name.value = ''
    email.value = ''
    password.value = ''
    confirmPassword.value = ''
    acceptTerms.value = false
  } catch (error) {
    console.error('Register error:', error)
    errorMessage.value = 'Ocorreu um erro ao criar a conta. Tente novamente.'
  } finally {
    isLoading.value = false
  }
}

const handleGoogleRegister = async (): Promise<void> => {
  try {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/confirm`,
      },
    })

    if (error) {
      errorMessage.value = 'Erro ao conectar com o Google'
      console.error('Google register error:', error)
    }
  } catch (error) {
    console.error('Google register error:', error)
    errorMessage.value = 'Ocorreu um erro ao conectar com o Google'
  }
}

const { isDark, toggleTheme } = useTheme()
</script>

<template>
  <div id="cadastro-page" class="min-h-screen flex">
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

    <!-- Right Panel - Register Form -->
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
        <!-- Header -->
        <div class="text-center mb-8">
          <h1 class="text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white mb-3">
            Crie sua conta
          </h1>
          <p class="text-gray-600 dark:text-gray-400 text-sm lg:text-base">
            Comece a organizar suas finanças agora mesmo
          </p>
        </div>

        <!-- Divider -->
        <div class="w-16 h-1 bg-primary mx-auto mb-8 rounded-full" />

        <!-- Success Message -->
        <div 
          v-if="successMessage" 
          class="mb-4 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg"
        >
          <p class="text-sm text-green-600 dark:text-green-400">{{ successMessage }}</p>
        </div>

        <!-- Error Message -->
        <div 
          v-if="errorMessage" 
          class="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg"
        >
          <p class="text-sm text-red-600 dark:text-red-400">{{ errorMessage }}</p>
        </div>

        <!-- Register Form -->
        <form class="space-y-4" @submit.prevent="handleRegister">
          <!-- Name Field -->
          <div>
            <label 
              for="name" 
              class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
            >
              Nome completo
            </label>
            <input
              id="name"
              v-model="name"
              type="text"
              placeholder="Digite seu nome"
              required
              class="input-field"
            />
          </div>

          <!-- Email Field -->
          <div>
            <label 
              for="email" 
              class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
            >
              E-mail
            </label>
            <input
              id="email"
              v-model="email"
              type="email"
              placeholder="Digite seu e-mail"
              required
              class="input-field"
            />
          </div>

          <!-- Password Field -->
          <div>
            <label 
              for="password" 
              class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
            >
              Senha
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
              Confirmar senha
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

          <!-- Terms Checkbox -->
          <div class="flex items-start gap-3">
            <input
              id="terms"
              v-model="acceptTerms"
              type="checkbox"
              class="mt-1 w-4 h-4 text-primary bg-transparent border-gray-300 rounded focus:ring-primary focus:ring-2"
            />
            <label for="terms" class="text-sm text-gray-600 dark:text-gray-400">
              Li e aceito os 
              <NuxtLink to="/termos" class="text-primary hover:underline">termos de uso</NuxtLink>
              e 
              <NuxtLink to="/privacidade" class="text-primary hover:underline">políticas de privacidade</NuxtLink>
            </label>
          </div>

          <!-- Register Button -->
          <button
            type="submit"
            :disabled="isLoading"
            class="btn-primary disabled:opacity-50 disabled:cursor-not-allowed mt-2"
          >
            <span v-if="isLoading">Criando conta...</span>
            <span v-else>Criar conta</span>
          </button>

          <!-- Google Register Button -->
          <button
            type="button"
            class="btn-outline flex items-center justify-center gap-3"
            @click="handleGoogleRegister"
          >
            <svg class="w-5 h-5" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            <span class="text-primary">Cadastrar com Google</span>
          </button>
        </form>

        <!-- Login Link -->
        <div class="mt-6 text-center">
          <span class="text-gray-600 dark:text-gray-400">Já tem uma conta? </span>
          <NuxtLink
            to="/login"
            class="text-primary hover:text-primary-500 font-medium transition-colors"
          >
            Fazer login
          </NuxtLink>
        </div>

        <!-- Version Badge -->
        <div class="mt-4 text-center">
          <span class="text-xs text-gray-400 dark:text-gray-500">
            Versão beta [!]
          </span>
        </div>
      </div>
    </div>
  </div>
</template>
