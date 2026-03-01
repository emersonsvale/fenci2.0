<script setup lang="ts">
import { onMounted, onUnmounted, watch } from 'vue'

/**
 * BaseModal - Modal base reutilizável
 */

const props = defineProps<{
  isOpen: boolean
  title: string
  subtitle?: string
}>()

const emit = defineEmits<{
  close: []
}>()

function handleKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape') {
    emit('close')
  }
}

function lockBodyScroll() {
  document.body.style.overflow = 'hidden'
}

function unlockBodyScroll() {
  document.body.style.overflow = ''
}

onMounted(() => {
  document.addEventListener('keydown', handleKeydown)
  if (props.isOpen) {
    lockBodyScroll()
  }
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeydown)
  unlockBodyScroll()
})

watch(
  () => props.isOpen,
  (isOpen) => {
    if (isOpen) {
      lockBodyScroll()
    } else {
      unlockBodyScroll()
    }
  }
)
</script>

<template>
  <Teleport to="body">
    <Transition
      enter-active-class="transition ease-out duration-300"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition ease-in duration-200"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div
        v-if="isOpen"
        id="base-modal-overlay"
        class="fixed inset-0 bg-black/50 backdrop-blur-md z-modal flex items-end sm:items-center justify-center sm:p-4"
        @click.self="emit('close')"
      >
        <Transition
          enter-active-class="transition-all duration-300"
          enter-from-class="opacity-0 scale-95 translate-y-4 sm:translate-y-0"
          enter-to-class="opacity-100 scale-100 translate-y-0"
          leave-active-class="transition-all duration-200"
          leave-from-class="opacity-100 scale-100 translate-y-0"
          leave-to-class="opacity-0 scale-95 translate-y-4 sm:translate-y-0"
        >
          <div
            v-if="isOpen"
            id="base-modal-content"
            class="bg-surface-elevated shadow-2xl w-full overflow-hidden flex flex-col border border-default-subtle
                   max-h-[100dvh] rounded-t-2xl sm:rounded-2xl sm:max-w-2xl sm:max-h-[90vh]"
            style="transition-timing-function: cubic-bezier(0.34, 1.56, 0.64, 1);"
          >
            <!-- Header -->
            <div class="flex items-center justify-between px-6 py-5 border-b border-default-subtle">
              <div>
                <h2 class="text-heading-sm font-semibold text-content-main">
                  {{ title }}
                </h2>
                <p v-if="subtitle" class="text-caption text-content-subtle mt-0.5">
                  {{ subtitle }}
                </p>
              </div>
              <button
                type="button"
                class="p-2 rounded-xl hover:bg-surface-overlay transition-all duration-200 text-content-subtle hover:text-content-main hover:rotate-90"
                @click="emit('close')"
              >
                <span class="material-symbols-outlined text-xl">close</span>
              </button>
            </div>

            <!-- Body -->
            <div class="flex-1 overflow-y-auto px-6 py-5">
              <slot />
            </div>

            <!-- Footer -->
            <div class="px-6 py-4 border-t border-default-subtle">
              <slot name="footer" />
            </div>
          </div>
        </Transition>
      </div>
    </Transition>
  </Teleport>
</template>
