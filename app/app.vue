<script setup lang="ts">
import ToastContainer from './components/ToastContainer.vue'

/**
 * App Root Component
 * Define o modo de cor e estrutura base do app
 */
</script>

<template>
  <div id="app">
    <NuxtRouteAnnouncer />
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
    <ToastContainer />
  </div>
</template>
