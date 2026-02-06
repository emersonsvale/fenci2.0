<script setup lang="ts">
import { navigateTo } from '#imports'

// Redireciona para a página de login
navigateTo('/login')
</script>

<template>
  <div id="index-redirect" class="min-h-screen flex items-center justify-center">
    <p class="text-gray-500">Redirecionando...</p>
  </div>
</template>
