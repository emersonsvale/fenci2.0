<script setup lang="ts">
/**
 * Página de confirmação de autenticação
 * Aguarda a confirmação do login via magic link ou OAuth
 */
import { useSupabaseUser } from '#imports'
import { useSupabaseCookieRedirect } from '#imports'

definePageMeta({
  layout: 'default',
})

const user = useSupabaseUser()
const redirectInfo = useSupabaseCookieRedirect()

// Aguarda o usuário ser autenticado e redireciona
watch(user, () => {
  if (user.value) {
    const path = redirectInfo.pluck() // Pega e limpa o cookie de redirecionamento
    return navigateTo(path || '/dashboard')
  }
}, { immediate: true })
</script>

<template>
  <div class="min-h-screen flex items-center justify-center bg-surface">
    <div class="text-center">
      <!-- Logo -->
      <div class="mb-8">
        <img
          src="/logotipo.png"
          alt="Fenci"
          class="h-12 mx-auto"
        />
      </div>

      <!-- Loading spinner -->
      <div class="flex flex-col items-center gap-4">
        <div class="w-12 h-12 border-4 border-primary-200 border-t-primary-500 rounded-full animate-spin" />
        <p class="text-content-muted text-body-md">
          Confirmando sua autenticação...
        </p>
      </div>
    </div>
  </div>
</template>
