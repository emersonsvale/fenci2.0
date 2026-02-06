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
      enter-active-class="transition ease-out duration-200"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition ease-in duration-150"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div
        v-if="isOpen"
        id="base-modal-overlay"
        class="fixed inset-0 bg-black/60 backdrop-blur-sm z-modal flex items-center justify-center p-4"
        @click.self="emit('close')"
      >
        <Transition
          enter-active-class="transition ease-out duration-200"
          enter-from-class="opacity-0 scale-95"
          enter-to-class="opacity-100 scale-100"
          leave-active-class="transition ease-in duration-150"
          leave-from-class="opacity-100 scale-100"
          leave-to-class="opacity-0 scale-95"
        >
          <div
            v-if="isOpen"
            id="base-modal-content"
            class="bg-surface-elevated rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col border border-default"
          >
            <!-- Header -->
            <div class="flex items-center justify-between px-6 py-5 border-b border-default">
              <div>
                <h2 class="text-xl font-semibold text-content-main">
                  {{ title }}
                </h2>
                <p v-if="subtitle" class="text-sm text-content-subtle mt-0.5">
                  {{ subtitle }}
                </p>
              </div>
              <button
                type="button"
                class="p-2 rounded-lg hover:bg-surface-overlay transition-colors text-content-subtle"
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
            <div class="px-6 py-4 border-t border-default">
              <slot name="footer" />
            </div>
          </div>
        </Transition>
      </div>
    </Transition>
  </Teleport>
</template>
