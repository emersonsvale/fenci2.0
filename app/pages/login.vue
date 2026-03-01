<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useSupabaseClient } from '#imports'
import { useTheme } from '~/composables/useTheme'
import AppInput from '../components/AppInput.vue'
import AppButton from '../components/AppButton.vue'

const supabase = useSupabaseClient()

const email = ref('')
const password = ref('')
const isLoading = ref(false)
const errorMessage = ref('')

/** Se já estiver logado (ex.: voltou para /login), redireciona para o dashboard. */
onMounted(async () => {
  if (!import.meta.client) return
  const { data: { session } } = await supabase.auth.getSession()
  if (session) {
    window.location.replace('/dashboard')
  }
})

/** Aguarda a sessão aparecer no client (até ~2,5s) após login. */
async function waitForSession (): Promise<boolean> {
  for (let i = 0; i < 50; i++) {
    const { data: { session } } = await supabase.auth.getSession()
    if (session) return true
    await new Promise(r => setTimeout(r, 50))
  }
  return false
}

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

    // Garante que a sessão está no client antes de recarregar em /dashboard
    const hasSession = await waitForSession()
    if (import.meta.client) {
      if (hasSession) {
        window.location.href = '/dashboard'
      } else {
        // Fallback: força mesmo assim; o middleware vai tentar getSession com retry
        window.location.href = '/dashboard'
      }
    } else {
      await navigateTo('/dashboard', { replace: true })
    }
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
      class="hidden lg:flex lg:w-[45%] bg-brand-teal relative items-start justify-start p-12 overflow-hidden"
    >
      <!-- Subtle gradient overlay -->
      <div class="absolute inset-0 bg-gradient-to-br from-brand-teal via-brand-teal-dark to-brand-teal opacity-90" />
      
      <!-- Animated glow orbs -->
      <div class="absolute top-1/4 left-1/4 w-64 h-64 bg-primary/10 rounded-full blur-3xl animate-float" />
      <div class="absolute bottom-1/3 right-1/4 w-48 h-48 bg-primary/8 rounded-full blur-3xl animate-float" style="animation-delay: 3s;" />
      
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
        <p class="text-white/60 text-body-sm leading-relaxed max-w-xs">
          Controle financeiro inteligente para quem quer ir além.
        </p>
      </div>
    </div>

    <!-- Right Panel - Login Form -->
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
        <img 
          src="/logotipo.png" 
          alt="Fenci" 
          class="h-10 w-auto dark:brightness-0 dark:invert"
        />
      </div>

      <div class="w-full max-w-[400px]">
        <!-- Header -->
        <div class="mb-10 animate-fade-in">
          <h1 class="text-display-sm lg:text-display-md text-content-main mb-3 tracking-tight">
            Bem-vindo!
          </h1>
          <p class="text-content-muted text-body-sm lg:text-body-md leading-relaxed">
            Organize suas finanças com um app que funciona de verdade
          </p>
        </div>

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

        <!-- Login Form -->
        <form class="space-y-5 animate-fade-in-up" style="animation-delay: 0.1s" @submit.prevent="handleLogin">
          <AppInput
            id="email"
            v-model="email"
            label="E-mail"
            type="email"
            placeholder="seu@email.com"
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
              class="text-body-sm text-content-subtle hover:text-primary transition-colors duration-300"
            >
              Esqueci minha senha
            </NuxtLink>
          </div>

          <div class="pt-1 space-y-3">
            <AppButton
              type="submit"
              :loading="isLoading"
              loading-label="Entrando..."
            >
              Entrar
            </AppButton>

            <div class="divider-text text-content-subtle">ou</div>

            <AppButton
              variant="outline"
              full-width
              @click="handleGoogleLogin"
            >
              <template #icon>
                <svg class="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
              </template>
              <span class="text-content-main">Entrar com Google</span>
            </AppButton>
          </div>
        </form>

        <!-- Register Link -->
        <div class="mt-8 text-center animate-fade-in" style="animation-delay: 0.2s">
          <NuxtLink
            to="/cadastro"
            class="text-primary hover:text-primary-600 font-semibold text-body-sm transition-colors duration-300"
          >
            Criar minha conta
          </NuxtLink>
        </div>

        <!-- Footer Links -->
        <div class="mt-10 text-center text-caption text-content-subtle space-x-1">
          <NuxtLink to="/termos" class="hover:text-primary transition-colors duration-300">
            Termos de uso
          </NuxtLink>
          <span>&middot;</span>
          <NuxtLink to="/privacidade" class="hover:text-primary transition-colors duration-300">
            Privacidade
          </NuxtLink>
        </div>
      </div>
    </div>
  </div>
</template>
