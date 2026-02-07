<script setup lang="ts">
import { usePwaInstall } from '~/composables/usePwaInstall'

/**
 * PwaInstallBanner - Banner flutuante para instalação do PWA
 * Aparece apenas quando o app pode ser instalado e o usuário não dispensou
 */

const { isInstallable, install, dismiss } = usePwaInstall()

async function handleInstall(): Promise<void> {
  await install()
}
</script>

<template>
  <Transition
    enter-active-class="transition-all duration-300 ease-out"
    enter-from-class="opacity-0 translate-y-4"
    enter-to-class="opacity-100 translate-y-0"
    leave-active-class="transition-all duration-200 ease-in"
    leave-from-class="opacity-100 translate-y-0"
    leave-to-class="opacity-0 translate-y-4"
  >
    <div
      v-if="isInstallable"
      class="fixed bottom-20 lg:bottom-6 left-4 right-4 sm:left-auto sm:right-6 sm:max-w-sm z-[210] bg-surface-elevated rounded-2xl shadow-xl border border-default p-4"
    >
      <div class="flex items-start gap-3">
        <!-- Icon -->
        <div class="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
          <span class="material-symbols-outlined text-xl text-primary">install_mobile</span>
        </div>

        <!-- Content -->
        <div class="flex-1 min-w-0">
          <p class="text-body-sm font-semibold text-content-main">Instalar Fenci</p>
          <p class="text-caption text-content-subtle mt-0.5">
            Adicione à tela inicial para acesso rápido e experiência nativa.
          </p>

          <!-- Actions -->
          <div class="flex items-center gap-2 mt-3">
            <button
              type="button"
              class="px-4 py-1.5 rounded-lg bg-primary text-white text-caption font-medium hover:bg-primary-600 transition-colors"
              @click="handleInstall"
            >
              Instalar
            </button>
            <button
              type="button"
              class="px-3 py-1.5 rounded-lg text-caption text-content-subtle hover:text-content-main hover:bg-surface-overlay transition-colors"
              @click="dismiss"
            >
              Agora não
            </button>
          </div>
        </div>

        <!-- Close -->
        <button
          type="button"
          class="p-1 rounded-lg text-content-subtle hover:text-content-main hover:bg-surface-overlay transition-colors"
          aria-label="Fechar"
          @click="dismiss"
        >
          <span class="material-symbols-outlined text-lg">close</span>
        </button>
      </div>
    </div>
  </Transition>
</template>
