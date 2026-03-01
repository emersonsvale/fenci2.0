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
          Recupere o acesso à sua conta de forma segura
        </p>
      </div>
    </div>

    <!-- Right Panel - Reset Password Form -->
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
        <div v-if="emailSent" class="text-center animate-fade-in-up">
          <!-- Success Icon -->
          <div class="w-20 h-20 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <span class="material-symbols-outlined text-4xl text-primary">mark_email_read</span>
          </div>

          <h1 class="text-display-sm text-content-main mb-3">
            E-mail enviado!
          </h1>
          <p class="text-content-muted text-body-sm mb-8">
            Enviamos um link de recuperação para<br />
            <span class="font-semibold text-content-main">{{ email }}</span>
          </p>

          <p class="text-caption text-content-subtle mb-6">
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
            class="inline-flex items-center gap-2 text-content-muted hover:text-primary transition-colors mb-8 group"
          >
            <span class="material-symbols-outlined text-lg transition-transform group-hover:-translate-x-0.5">arrow_back</span>
            <span class="text-body-sm font-medium">Voltar para o login</span>
          </NuxtLink>

          <!-- Header -->
          <div class="mb-8">
            <h1 class="text-display-sm text-content-main mb-3">
              Esqueceu sua senha?
            </h1>
            <p class="text-content-muted text-body-sm">
              Sem problemas! Digite seu e-mail e enviaremos um link para redefinir sua senha.
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

          <!-- Reset Form -->
          <form class="space-y-5" @submit.prevent="handleResetRequest">
            <!-- Email Field -->
            <div>
              <label 
                for="email" 
                class="block text-body-sm font-medium text-content-muted mb-2"
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
              <span v-if="isLoading" class="inline-flex items-center gap-2">
                <span class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Enviando...
              </span>
              <span v-else>Enviar link de recuperação</span>
            </button>
          </form>

          <!-- Register Link -->
          <div class="mt-6 text-center">
            <span class="text-content-subtle text-body-sm">Não tem uma conta? </span>
            <NuxtLink
              to="/cadastro"
              class="text-primary hover:text-primary-600 font-semibold text-body-sm transition-colors"
            >
              Criar conta
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
