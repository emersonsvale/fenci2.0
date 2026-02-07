<script setup lang="ts">
import { ref } from 'vue'
import { useCurrency } from '~/composables/useCurrency'

/**
 * ExtratoSelectionSummary - Painel sobreposto com soma e valor líquido dos lançamentos selecionados
 * Exibe botão "Mais" para ações em massa (marcar pago, não pago, excluir)
 */

const { formatCurrency } = useCurrency()

export interface ExtratoSelectionSummaryProps {
  soma: number
  valorLiquido: number
  selectedCount: number
}

const props = defineProps<ExtratoSelectionSummaryProps>()

const emit = defineEmits<{
  'close': []
  'mark-paid': []
  'mark-unpaid': []
  'delete': []
}>()

const isMoreOpen = ref(false)


function closeMore() {
  isMoreOpen.value = false
}

function handleMarkPaid() {
  closeMore()
  emit('mark-paid')
}

function handleMarkUnpaid() {
  closeMore()
  emit('mark-unpaid')
}

function handleDelete() {
  closeMore()
  emit('delete')
}
</script>

<template>
  <div
    id="extrato-selection-summary"
    class="fixed bottom-20 lg:bottom-6 left-4 right-4 sm:left-auto sm:right-6 z-popover flex items-center gap-3 lg:gap-4 rounded-2xl border border-default-subtle bg-surface-elevated px-3 lg:px-4 py-3 shadow-lg"
  >
    <button
      type="button"
      class="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full text-content-subtle transition-colors hover:bg-surface-overlay hover:text-content-main"
      aria-label="Fechar e desmarcar seleção"
      @click="emit('close')"
    >
      <span class="material-symbols-outlined text-xl">close</span>
    </button>

    <div class="flex flex-col gap-0.5 py-1">
      <p class="text-caption text-content-subtle">
        Soma: <span class="font-semibold text-content-main">{{ formatCurrency(soma) }}</span>
      </p>
      <p class="text-caption text-content-subtle">
        Valor Líquido:
        <span
          class="font-semibold"
          :class="valorLiquido >= 0 ? 'text-success' : 'text-error'"
        >
          {{ formatCurrency(valorLiquido) }}
        </span>
      </p>
    </div>

    <div class="relative flex-shrink-0">
      <button
        type="button"
        class="flex items-center gap-1.5 rounded-xl bg-primary px-3 py-2 text-body-sm font-medium text-primary-contrast shadow-sm transition-colors hover:bg-primary/90"
        @click="isMoreOpen = !isMoreOpen"
      >
        <span class="material-symbols-outlined text-lg">more_horiz</span>
        Mais
      </button>

      <Teleport to="body">
        <div
          v-if="isMoreOpen"
          class="fixed inset-0 z-dropdown"
          @click="closeMore"
        />
      </Teleport>

      <Transition
        enter-active-class="transition-all duration-200 ease-out"
        enter-from-class="opacity-0 scale-95 translate-y-1"
        enter-to-class="opacity-100 scale-100 translate-y-0"
        leave-active-class="transition-all duration-150 ease-in"
        leave-from-class="opacity-100 scale-100 translate-y-0"
        leave-to-class="opacity-0 scale-95 translate-y-1"
      >
        <div
          v-if="isMoreOpen"
          class="absolute right-0 bottom-full mb-2 w-52 rounded-lg border border-default bg-surface-elevated py-1 shadow-lg z-popover"
        >
          <button
            type="button"
            class="flex w-full items-center gap-2 px-3 py-2 text-left text-body-sm text-content-main hover:bg-surface-overlay"
            @click="handleMarkPaid"
          >
            <span class="material-symbols-outlined text-lg text-success">check_circle</span>
            Marcar como pago
          </button>
          <button
            type="button"
            class="flex w-full items-center gap-2 px-3 py-2 text-left text-body-sm text-content-main hover:bg-surface-overlay"
            @click="handleMarkUnpaid"
          >
            <span class="material-symbols-outlined text-lg text-warning">cancel</span>
            Marcar como não pago
          </button>
          <button
            type="button"
            class="flex w-full items-center gap-2 px-3 py-2 text-left text-body-sm text-error hover:bg-surface-overlay"
            @click="handleDelete"
          >
            <span class="material-symbols-outlined text-lg">delete</span>
            Excluir selecionados
          </button>
        </div>
      </Transition>
    </div>
  </div>
</template>
