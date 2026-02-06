<script setup lang="ts">
import { computed } from 'vue'
import { useToast, type Toast, type ToastVariant } from '../composables/useToast'

/**
 * ToastContainer - Container global de toasts
 * Exibe notificações no canto superior direito
 */

const { toasts, remove } = useToast()

const iconByVariant: Record<ToastVariant, string> = {
  info: 'info',
  success: 'check_circle',
  warning: 'warning',
  error: 'error',
}

const bgClassByVariant: Record<ToastVariant, string> = {
  info: 'bg-primary/10 border-primary/30 text-primary',
  success: 'bg-success/10 border-success/30 text-success',
  warning: 'bg-warning/10 border-warning/30 text-warning',
  error: 'bg-error/10 border-error/30 text-error',
}

function getClasses(variant: ToastVariant): string {
  return bgClassByVariant[variant] ?? bgClassByVariant.info
}

function getIcon(variant: ToastVariant): string {
  return iconByVariant[variant] ?? 'info'
}
</script>

<template>
  <div
    id="toast-container"
    class="fixed top-4 right-4 z-[100] flex flex-col gap-2 max-w-[380px] w-full pointer-events-none"
    aria-live="polite"
  >
    <TransitionGroup
      name="toast"
      tag="div"
      class="flex flex-col gap-2"
    >
      <div
        v-for="toast in toasts"
        :key="toast.id"
        class="pointer-events-auto rounded-xl border shadow-lg p-4 flex items-start gap-3 animate-fade-in"
        :class="getClasses(toast.variant)"
      >
        <span class="material-symbols-outlined flex-shrink-0 mt-0.5" aria-hidden="true">
          {{ getIcon(toast.variant) }}
        </span>
        <p class="text-body-sm flex-1 min-w-0">
          {{ toast.message }}
        </p>
        <button
          type="button"
          class="p-1 rounded hover:opacity-80 transition-opacity flex-shrink-0"
          :aria-label="'Fechar notificação'"
          @click="remove(toast.id)"
        >
          <span class="material-symbols-outlined text-lg">close</span>
        </button>
      </div>
    </TransitionGroup>
  </div>
</template>

<style scoped>
.toast-enter-active,
.toast-leave-active {
  transition: all 0.25s ease;
}
.toast-enter-from,
.toast-leave-to {
  opacity: 0;
  transform: translateX(1rem);
}
.toast-move {
  transition: transform 0.25s ease;
}
</style>
