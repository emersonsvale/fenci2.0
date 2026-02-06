<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import type { LancamentoType } from '../composables/useLancamento'

/**
 * LancamentoDropdown - Menu dropdown para escolher tipo de lançamento
 */

defineProps<{
  isOpen: boolean
}>()

const emit = defineEmits<{
  close: []
  select: [type: LancamentoType]
}>()

const dropdownRef = ref<HTMLElement | null>(null)

function handleClickOutside(event: MouseEvent) {
  if (dropdownRef.value && !dropdownRef.value.contains(event.target as Node)) {
    emit('close')
  }
}

function handleKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape') {
    emit('close')
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
  document.addEventListener('keydown', handleKeydown)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
  document.removeEventListener('keydown', handleKeydown)
})

function selectOption(type: LancamentoType) {
  emit('select', type)
}
</script>

<template>
  <Transition
    enter-active-class="transition ease-out duration-100"
    enter-from-class="transform opacity-0 scale-95"
    enter-to-class="transform opacity-100 scale-100"
    leave-active-class="transition ease-in duration-75"
    leave-from-class="transform opacity-100 scale-100"
    leave-to-class="transform opacity-0 scale-95"
  >
    <div
      v-if="isOpen"
      id="lancamento-dropdown"
      ref="dropdownRef"
      class="absolute right-0 top-full mt-2 w-52 rounded-xl bg-surface-elevated shadow-xl border border-default z-dropdown"
    >
      <div class="p-2 flex flex-col gap-1">
        <!-- Nova Saída -->
        <button
          type="button"
          class="flex items-center justify-between w-full px-4 py-3 rounded-lg text-content-primary dark:text-content-primary-dark hover:bg-surface-overlay transition-colors text-left"
          @click="selectOption('saida')"
        >
          <span class="text-sm font-medium">Nova Saída</span>
          <span class="material-symbols-outlined text-error">south_west</span>
        </button>

        <!-- Nova Entrada -->
        <button
          type="button"
          class="flex items-center justify-between w-full px-4 py-3 rounded-lg text-content-primary dark:text-content-primary-dark hover:bg-surface-overlay transition-colors text-left"
          @click="selectOption('entrada')"
        >
          <span class="text-sm font-medium">Nova Entrada</span>
          <span class="material-symbols-outlined text-success">north_east</span>
        </button>

        <!-- Cartão de Crédito -->
        <button
          type="button"
          class="flex items-center justify-between w-full px-4 py-3 rounded-lg text-content-primary dark:text-content-primary-dark hover:bg-surface-overlay transition-colors text-left"
          @click="selectOption('cartao')"
        >
          <span class="text-sm font-medium">Cartão de crédito</span>
          <span class="material-symbols-outlined text-content-subtle">credit_card</span>
        </button>
      </div>
    </div>
  </Transition>
</template>
