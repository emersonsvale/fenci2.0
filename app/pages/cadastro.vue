<script setup lang="ts">
import { ref } from 'vue'
import { useSupabaseClient } from '#imports'
import { useTheme } from '~/composables/useTheme'


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
      class="hidden lg:flex lg:w-[45%] bg-brand-teal relative items-start justify-start p-12 overflow-hidden"
    >
      <div class="absolute inset-0 bg-gradient-to-br from-brand-teal via-brand-teal-dark to-brand-teal opacity-90" />
      <div class="absolute top-1/3 right-1/4 w-64 h-64 bg-primary/10 rounded-full blur-3xl animate-float" />
      <div class="absolute bottom-1/4 left-1/3 w-48 h-48 bg-primary/8 rounded-full blur-3xl animate-float" style="animation-delay: 3s;" />
      
      <div class="relative z-10">
        <img src="/logotipo.png" alt="Fenci" class="h-12 w-auto" />
      </div>
      <BrandPattern />
      
      <div class="absolute bottom-12 left-12 right-12 z-10">
        <p class="text-white/60 text-body-sm leading-relaxed max-w-xs">
          Junte-se a milhares de pessoas que já organizam suas finanças com o Fenci.
        </p>
      </div>
    </div>

    <!-- Right Panel - Register Form -->
    <div 
      class="w-full lg:w-[55%] flex flex-col items-center justify-center p-8 lg:p-16 bg-surface transition-colors duration-500 relative"
    >
      <!-- Theme Toggle -->
      <button
        type="button"
        class="absolute top-6 right-6 p-2.5 rounded-xl hover:bg-surface-overlay transition-all duration-300 group"
        @click="toggleTheme"
        aria-label="Alternar tema"
      >
        <span class="material-symbols-outlined text-xl text-content-subtle group-hover:text-content-main transition-colors">
          {{ isDark ? 'light_mode' : 'dark_mode' }}
        </span>
      </button>

      <!-- Mobile Logo -->
      <div class="lg:hidden mb-10 animate-fade-in">
        <img src="/logotipo.png" alt="Fenci" class="h-10 w-auto dark:brightness-0 dark:invert" />
      </div>

      <div class="w-full max-w-[400px]">
        <!-- Header -->
        <div class="mb-8 animate-fade-in">
          <h1 class="text-display-sm lg:text-display-md text-content-main mb-3 tracking-tight">
            Crie sua conta
          </h1>
          <p class="text-content-muted text-body-sm lg:text-body-md leading-relaxed">
            Comece a organizar suas finanças agora mesmo
          </p>
        </div>

        <!-- Success Message -->
        <Transition name="slide-up">
          <div 
            v-if="successMessage" 
            class="mb-6 p-4 bg-success/5 dark:bg-success/10 border border-success/20 rounded-2xl flex items-start gap-3"
          >
            <span class="material-symbols-outlined text-success text-lg mt-0.5">check_circle</span>
            <p class="text-body-sm text-success-dark dark:text-success flex-1">{{ successMessage }}</p>
          </div>
        </Transition>

        <!-- Error Message -->
        <Transition name="slide-up">
          <div 
            v-if="errorMessage" 
            class="mb-6 p-4 bg-error/5 dark:bg-error/10 border border-error/20 rounded-2xl flex items-start gap-3"
          >
            <span class="material-symbols-outlined text-error text-lg mt-0.5">error</span>
            <p class="text-body-sm text-error flex-1">{{ errorMessage }}</p>
          </div>
        </Transition>

        <!-- Register Form -->
        <form class="space-y-4 animate-fade-in-up" style="animation-delay: 0.1s" @submit.prevent="handleRegister">
          <div>
            <label for="name" class="block text-body-sm font-medium text-content-main mb-2">Nome completo</label>
            <input id="name" v-model="name" type="text" placeholder="Seu nome" required class="input-field" />
          </div>

          <div>
            <label for="email" class="block text-body-sm font-medium text-content-main mb-2">E-mail</label>
            <input id="email" v-model="email" type="email" placeholder="seu@email.com" required class="input-field" />
          </div>

          <div>
            <label for="password" class="block text-body-sm font-medium text-content-main mb-2">Senha</label>
            <div class="relative">
              <input id="password" v-model="password" :type="showPassword ? 'text' : 'password'" placeholder="min 6 caracteres" required minlength="6" class="input-field pr-12" />
              <button type="button" class="absolute right-4 top-1/2 -translate-y-1/2 text-content-subtle hover:text-content-main transition-colors" @click="togglePasswordVisibility" aria-label="Mostrar/ocultar senha">
                <span class="material-symbols-outlined text-xl">{{ showPassword ? 'visibility_off' : 'visibility' }}</span>
              </button>
            </div>
          </div>

          <div>
            <label for="confirmPassword" class="block text-body-sm font-medium text-content-main mb-2">Confirmar senha</label>
            <div class="relative">
              <input id="confirmPassword" v-model="confirmPassword" :type="showConfirmPassword ? 'text' : 'password'" placeholder="Digite novamente" required minlength="6" class="input-field pr-12" />
              <button type="button" class="absolute right-4 top-1/2 -translate-y-1/2 text-content-subtle hover:text-content-main transition-colors" @click="toggleConfirmPasswordVisibility" aria-label="Mostrar/ocultar senha">
                <span class="material-symbols-outlined text-xl">{{ showConfirmPassword ? 'visibility_off' : 'visibility' }}</span>
              </button>
            </div>
          </div>

          <!-- Terms Checkbox -->
          <label for="terms" class="flex items-start gap-3 cursor-pointer group">
            <input id="terms" v-model="acceptTerms" type="checkbox" class="mt-0.5 w-4.5 h-4.5 text-primary bg-transparent border-default-subtle rounded-md focus:ring-primary focus:ring-2 transition-colors" />
            <span class="text-body-sm text-content-muted group-hover:text-content-main transition-colors">
              Li e aceito os 
              <NuxtLink to="/termos" class="text-primary hover:underline">termos de uso</NuxtLink>
              e 
              <NuxtLink to="/privacidade" class="text-primary hover:underline">políticas de privacidade</NuxtLink>
            </span>
          </label>

          <div class="pt-1 space-y-3">
            <button type="submit" :disabled="isLoading" class="btn-primary disabled:opacity-50 disabled:cursor-not-allowed">
              <span v-if="isLoading">Criando conta...</span>
              <span v-else>Criar conta</span>
            </button>

            <div class="divider-text text-content-subtle">ou</div>

            <button type="button" class="btn-outline flex items-center justify-center gap-3" @click="handleGoogleRegister">
              <svg class="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
              <span class="text-content-main">Cadastrar com Google</span>
            </button>
          </div>
        </form>

        <!-- Login Link -->
        <div class="mt-8 text-center animate-fade-in" style="animation-delay: 0.2s">
          <span class="text-content-muted text-body-sm">Já tem uma conta? </span>
          <NuxtLink to="/login" class="text-primary hover:text-primary-600 font-semibold text-body-sm transition-colors duration-300">Fazer login</NuxtLink>
        </div>

        <!-- Footer -->
        <div class="mt-10 text-center text-caption text-content-subtle space-x-1">
          <NuxtLink to="/termos" class="hover:text-primary transition-colors duration-300">Termos de uso</NuxtLink>
          <span>&middot;</span>
          <NuxtLink to="/privacidade" class="hover:text-primary transition-colors duration-300">Privacidade</NuxtLink>
        </div>
      </div>
    </div>
  </div>
</template>