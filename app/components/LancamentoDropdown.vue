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
      class="absolute right-0 top-full mt-2 w-52 sm:w-56 rounded-2xl bg-surface-elevated shadow-xl border border-default-subtle z-dropdown backdrop-blur-xl"
    >
      <div class="p-2 flex flex-col gap-0.5">
        <!-- Nova Saída -->
        <button
          type="button"
          class="flex items-center gap-3 w-full px-4 py-3 rounded-xl text-content-main hover:bg-error/5 transition-all duration-200 text-left group"
          @click="selectOption('saida')"
        >
          <span class="w-8 h-8 rounded-lg bg-error/10 flex items-center justify-center">
            <span class="material-symbols-outlined text-error text-lg">south_west</span>
          </span>
          <span class="text-body-sm font-medium group-hover:text-error transition-colors">Nova Saída</span>
        </button>

        <!-- Nova Entrada -->
        <button
          type="button"
          class="flex items-center gap-3 w-full px-4 py-3 rounded-xl text-content-main hover:bg-success/5 transition-all duration-200 text-left group"
          @click="selectOption('entrada')"
        >
          <span class="w-8 h-8 rounded-lg bg-success/10 flex items-center justify-center">
            <span class="material-symbols-outlined text-success text-lg">north_east</span>
          </span>
          <span class="text-body-sm font-medium group-hover:text-success transition-colors">Nova Entrada</span>
        </button>

        <!-- Cartão de Crédito -->
        <button
          type="button"
          class="flex items-center gap-3 w-full px-4 py-3 rounded-xl text-content-main hover:bg-primary/5 transition-all duration-200 text-left group"
          @click="selectOption('cartao')"
        >
          <span class="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <span class="material-symbols-outlined text-primary text-lg">credit_card</span>
          </span>
          <span class="text-body-sm font-medium group-hover:text-primary transition-colors">Cartão de crédito</span>
        </button>
      </div>
    </div>
  </Transition>
</template>
