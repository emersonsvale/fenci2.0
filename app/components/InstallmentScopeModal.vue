<script setup lang="ts">
/**
 * InstallmentScopeModal - Pergunta se a edição deve aplicar só nesta parcela ou em todas.
 */

defineProps<{
  isOpen: boolean
  isSubmitting?: boolean
}>()

const emit = defineEmits<{
  'only-this': []
  'all-installments': []
  'cancel': []
}>()
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
        id="installment-scope-modal"
        class="fixed inset-0 z-modal flex items-center justify-center p-4"
      >
        <div
          class="absolute inset-0 bg-black/60 backdrop-blur-sm"
          @click="emit('cancel')"
        />
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
            <div class="flex justify-center mb-4">
              <div class="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center">
                <span class="material-symbols-outlined text-3xl text-primary">receipt_long</span>
              </div>
            </div>
            <h2 class="text-heading-md font-bold text-content-main text-center mb-2">
              Lançamento parcelado
            </h2>
            <p class="text-body-sm text-content-muted text-center mb-6">
              Deseja aplicar as alterações apenas nesta parcela ou em todas as parcelas deste lançamento?
            </p>
            <div class="flex flex-col gap-3">
              <button
                type="button"
                class="w-full px-4 py-3 rounded-xl text-body-sm font-semibold bg-primary text-white hover:bg-primary/90 transition-colors disabled:opacity-50"
                :disabled="isSubmitting"
                @click="emit('only-this')"
              >
                Apenas esta parcela
              </button>
              <button
                type="button"
                class="w-full px-4 py-3 rounded-xl text-body-sm font-semibold bg-surface-overlay text-content-main border border-default hover:bg-surface-overlay/80 transition-colors disabled:opacity-50"
                :disabled="isSubmitting"
                @click="emit('all-installments')"
              >
                Todas as parcelas
              </button>
              <button
                type="button"
                class="w-full px-4 py-2.5 rounded-xl text-body-sm text-content-muted hover:bg-surface-overlay/50 transition-colors disabled:opacity-50"
                :disabled="isSubmitting"
                @click="emit('cancel')"
              >
                Cancelar
              </button>
            </div>
          </div>
        </Transition>
      </div>
    </Transition>
  </Teleport>
</template>
