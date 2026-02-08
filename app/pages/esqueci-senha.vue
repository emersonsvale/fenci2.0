<script setup lang="ts">
import { ref } from 'vue'
import { useSupabaseClient } from '#imports'
import { useTheme } from '~/composables/useTheme'


const supabase = useSupabaseClient()

const email = ref('')
const isLoading = ref(false)
const emailSent = ref(false)
const errorMessage = ref('')
const { isDark, toggleTheme } = useTheme()

const handleResetRequest = async (): Promise<void> => {
  errorMessage.value = ''
  isLoading.value = true
  
  try {
    const { error } = await supabase.auth.resetPasswordForEmail(email.value, {
      redirectTo: `${window.location.origin}/reset-senha`,
    })

    if (error) {
      errorMessage.value = error.message
      return
    }

    // Sucesso - mostra mensagem de e-mail enviado
    emailSent.value = true
  } catch (error) {
    console.error('Reset password error:', error)
    errorMessage.value = 'Ocorreu um erro ao enviar o e-mail. Tente novamente.'
  } finally {
    isLoading.value = false
  }
}
</script>

<template>
  <div id="esqueci-senha-page" class="min-h-screen flex">
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

    <!-- Right Panel - Reset Password Form -->
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
        <div v-if="emailSent" class="text-center">
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
                d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
              />
            </svg>
          </div>

          <h1 class="text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white mb-3">
            E-mail enviado!
          </h1>
          <p class="text-gray-600 dark:text-gray-400 text-sm lg:text-base mb-8">
            Enviamos um link de recuperação para<br />
            <span class="font-medium text-gray-900 dark:text-white">{{ email }}</span>
          </p>

          <p class="text-sm text-gray-500 dark:text-gray-400 mb-6">
            Não recebeu o e-mail? Verifique sua caixa de spam ou
            <button 
              type="button"
              class="text-primary hover:underline font-medium"
              @click="emailSent = false"
            >
              tente novamente
            </button>
          </p>

          <NuxtLink
            to="/login"
            class="btn-primary inline-flex items-center justify-center"
          >
            Voltar para o login
          </NuxtLink>
        </div>

        <!-- Form State -->
        <template v-else>
          <!-- Back Button -->
          <NuxtLink 
            to="/login"
            class="inline-flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-primary transition-colors mb-8"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
            </svg>
            Voltar para o login
          </NuxtLink>

          <!-- Header -->
          <div class="text-center mb-8">
            <h1 class="text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white mb-3">
              Esqueceu sua senha?
            </h1>
            <p class="text-gray-600 dark:text-gray-400 text-sm lg:text-base">
              Sem problemas! Digite seu e-mail e enviaremos<br />
              um link para redefinir sua senha
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

          <!-- Reset Form -->
          <form class="space-y-5" @submit.prevent="handleResetRequest">
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
                placeholder="Digite seu e-mail cadastrado"
                required
                class="input-field"
              />
            </div>

            <!-- Submit Button -->
            <button
              type="submit"
              :disabled="isLoading"
              class="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span v-if="isLoading">Enviando...</span>
              <span v-else>Enviar link de recuperação</span>
            </button>
          </form>

          <!-- Register Link -->
          <div class="mt-6 text-center">
            <span class="text-gray-600 dark:text-gray-400">Não tem uma conta? </span>
            <NuxtLink
              to="/cadastro"
              class="text-primary hover:text-primary-500 font-medium transition-colors"
            >
              Criar conta
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
