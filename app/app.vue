<script setup lang="ts">
import ToastContainer from './components/ToastContainer.vue'
import FloatingChatWidget from './components/FloatingChatWidget.vue'

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
    <FloatingChatWidget />
  </div>
</template>
