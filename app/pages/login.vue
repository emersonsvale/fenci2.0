<script setup lang="ts">
import { ref } from 'vue'
import { useSupabaseClient } from '#imports'
import { useTheme } from '~/composables/useTheme'
import AppInput from '../components/AppInput.vue'
import AppButton from '../components/AppButton.vue'

definePageMeta({
  middleware: ['guest-only'],
})

const supabase = useSupabaseClient()

const email = ref('')
const password = ref('')
const isLoading = ref(false)
const errorMessage = ref('')

const handleLogin = async (): Promise<void> => {
  errorMessage.value = ''
  isLoading.value = true
  
  try {
    const { error } = await supabase.auth.signInWithPassword({
      email: email.value,
      password: password.value,
    })

    if (error) {
      if (error.message === 'Invalid login credentials') {
        errorMessage.value = 'E-mail ou senha incorretos'
      } else if (error.message === 'Email not confirmed') {
        errorMessage.value = 'Confirme seu e-mail antes de fazer login'
      } else {
        errorMessage.value = error.message
      }
      return
    }

    // Redireciona para o dashboard após login bem-sucedido
    await navigateTo('/dashboard')
  } catch (error) {
    console.error('Login error:', error)
    errorMessage.value = 'Ocorreu um erro ao fazer login. Tente novamente.'
  } finally {
    isLoading.value = false
  }
}

const handleGoogleLogin = async (): Promise<void> => {
  try {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/confirm`,
      },
    })

    if (error) {
      errorMessage.value = 'Erro ao conectar com o Google'
      console.error('Google login error:', error)
    }
  } catch (error) {
    console.error('Google login error:', error)
    errorMessage.value = 'Ocorreu um erro ao conectar com o Google'
  }
}

const { isDark, toggleTheme } = useTheme()
</script>

<template>
  <div id="login-page" class="min-h-screen flex">
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

    <!-- Right Panel - Login Form -->
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
        <!-- Sun icon (light mode) -->
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
        <!-- Moon icon (dark mode) -->
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
            Bem-vindo!
          </h1>
          <p class="text-gray-600 dark:text-gray-400 text-sm lg:text-base">
            Vem com a gente organizar suas finanças<br />
            com um app que funciona de verdade
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

        <!-- Login Form -->
        <form class="space-y-5" @submit.prevent="handleLogin">
          <AppInput
            id="email"
            v-model="email"
            label="E-mail"
            type="email"
            placeholder="Digite seu e-mail"
            required
          />
          <AppInput
            id="password"
            v-model="password"
            label="Senha"
            type="password"
            placeholder="min 6 caracteres"
            required
            :minlength="6"
          />

          <!-- Forgot Password Link -->
          <div class="flex justify-end">
            <NuxtLink
              to="/esqueci-senha"
              class="text-sm text-gray-600 dark:text-gray-400 hover:text-primary dark:hover:text-primary transition-colors"
            >
              Esqueci minha senha
            </NuxtLink>
          </div>

          <AppButton
            type="submit"
            :loading="isLoading"
            loading-label="Entrando..."
          >
            Login
          </AppButton>

          <AppButton
            variant="outline"
            full-width
            @click="handleGoogleLogin"
          >
            <template #icon>
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
            </template>
            <span class="text-primary">Entrar com Google</span>
          </AppButton>
        </form>

        <!-- Register Link -->
        <div class="mt-6 text-center">
          <NuxtLink
            to="/cadastro"
            class="text-primary hover:text-primary-500 font-medium transition-colors"
          >
            Ainda não tenho uma conta
          </NuxtLink>
        </div>

        <!-- Footer Links -->
        <div class="mt-6 text-center text-sm text-gray-500 dark:text-gray-400">
          <NuxtLink to="/termos" class="underline hover:text-primary transition-colors">
            termos de uso
          </NuxtLink>
          <span class="mx-1">e</span>
          <NuxtLink to="/privacidade" class="underline hover:text-primary transition-colors">
            Políticas de privacidade
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
