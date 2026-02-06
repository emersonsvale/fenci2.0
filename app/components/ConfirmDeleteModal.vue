<script setup lang="ts">
import { ref } from 'vue'

/**
 * ConfirmDeleteModal - Modal de confirmação de exclusão
 */

export interface ConfirmDeleteModalProps {
  isOpen: boolean
  title?: string
  message?: string
  itemName?: string
  isDeleting?: boolean
}

const props = withDefaults(defineProps<ConfirmDeleteModalProps>(), {
  title: 'Confirmar exclusão',
  message: 'Tem certeza que deseja excluir este item? Esta ação não pode ser desfeita.',
  itemName: '',
  isDeleting: false,
})

const emit = defineEmits<{
  'confirm': []
  'cancel': []
}>()

function handleConfirm() {
  emit('confirm')
}

function handleCancel() {
  if (!props.isDeleting) {
    emit('cancel')
  }
}
</script>

<template>
  <Teleport to="body">
    <Transition
      enter-active-class="transition-opacity duration-200 ease-out"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition-opacity duration-150 ease-in"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div
        v-if="isOpen"
        id="confirm-delete-modal"
        class="fixed inset-0 z-modal flex items-center justify-center p-4"
      >
        <!-- Backdrop -->
        <div 
          class="absolute inset-0 bg-black/60 backdrop-blur-sm"
          @click="handleCancel"
        />

        <!-- Modal Content -->
        <Transition
          enter-active-class="transition-all duration-200 ease-out"
          enter-from-class="opacity-0 scale-95"
          enter-to-class="opacity-100 scale-100"
          leave-active-class="transition-all duration-150 ease-in"
          leave-from-class="opacity-100 scale-100"
          leave-to-class="opacity-0 scale-95"
        >
          <div
            v-if="isOpen"
            class="relative bg-surface-elevated rounded-2xl shadow-xl max-w-md w-full p-6 border border-default-subtle"
          >
            <!-- Icon -->
            <div class="flex justify-center mb-4">
              <div class="w-16 h-16 rounded-full bg-error/10 flex items-center justify-center">
                <span class="material-symbols-outlined text-4xl text-error">delete_forever</span>
              </div>
            </div>

            <!-- Title -->
            <h2 class="text-heading-md font-bold text-content-main text-center mb-2">
              {{ title }}
            </h2>

            <!-- Message -->
            <p class="text-body-sm text-content-muted text-center mb-2">
              {{ message }}
            </p>

            <!-- Item Name -->
            <p v-if="itemName" class="text-body-md font-semibold text-content-main text-center mb-6">
              "{{ itemName }}"
            </p>

            <!-- Actions -->
            <div class="flex gap-3 mt-6">
              <button
                type="button"
                class="flex-1 px-4 py-3 rounded-xl text-body-sm font-semibold bg-surface-overlay text-content-main hover:bg-surface-overlay/80 transition-colors disabled:opacity-50"
                :disabled="isDeleting"
                @click="handleCancel"
              >
                Cancelar
              </button>
              <button
                type="button"
                class="flex-1 px-4 py-3 rounded-xl text-body-sm font-semibold bg-error text-white hover:bg-error/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                :disabled="isDeleting"
                @click="handleConfirm"
              >
                <span v-if="isDeleting" class="material-symbols-outlined animate-spin text-lg">progress_activity</span>
                {{ isDeleting ? 'Excluindo...' : 'Excluir' }}
              </button>
            </div>
          </div>
        </Transition>
      </div>
    </Transition>
  </Teleport>
</template>
