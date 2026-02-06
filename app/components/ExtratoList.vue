<script setup lang="ts">
import { computed } from 'vue'
import type { ExtratoTransaction } from '../composables/useExtrato'
import ExtratoItem from './ExtratoItem.vue'

/**
 * ExtratoList - Lista de transações do extrato
 * Renderiza os itens de transação com loading e empty states
 */

export interface ExtratoListProps {
  transactions: ExtratoTransaction[]
  loading?: boolean
  /** IDs dos lançamentos selecionados (para seleção múltipla) */
  selectedIds?: Set<string> | string[]
}

const props = withDefaults(defineProps<ExtratoListProps>(), {
  loading: false,
  selectedIds: () => new Set<string>(),
})

const emit = defineEmits<{
  'mark-paid': [id: string]
  'mark-unpaid': [id: string]
  'edit': [id: string]
  'delete': [id: string]
  'edit-renda': [recurringId: string]
  'edit-saida': [recurringId: string]
  'mark-renda-received': [payload: { recurringId: string; transactionDate: string }]
  'toggle-select': [id: string]
  'pay-invoice': [payload: { creditCardId: string; invoiceId?: string; referenceMonth?: string; amount: number; dueDate?: string }]
}>()

const selectedSet = computed(() =>
  props.selectedIds instanceof Set ? props.selectedIds : new Set(props.selectedIds)
)
function isSelected(id: string): boolean {
  return selectedSet.value.has(id)
}
</script>

<template>
  <div id="extrato-list" class="space-y-3">
    <!-- Loading State -->
    <template v-if="loading">
      <div
        v-for="i in 5"
        :key="i"
        class="bg-surface-elevated rounded-xl p-4 flex items-center gap-4 animate-pulse shadow-xs border border-default-subtle"
        :style="{ animationDelay: `${i * 100}ms` }"
      >
        <!-- Icon skeleton -->
        <div class="w-11 h-11 rounded-xl bg-surface-overlay/70" />
        
        <!-- Content skeleton -->
        <div class="flex-1 space-y-2.5">
          <div class="h-4 w-44 bg-surface-overlay/70 rounded" />
          <div class="h-3 w-28 bg-surface-overlay/50 rounded" />
        </div>
        
        <!-- Date skeleton -->
        <div class="w-20 space-y-1.5">
          <div class="h-3 w-14 bg-surface-overlay/50 rounded ml-auto" />
          <div class="h-3 w-18 bg-surface-overlay/50 rounded ml-auto" />
        </div>
        
        <!-- Status skeleton -->
        <div class="h-8 w-24 bg-surface-overlay/60 rounded-lg" />
        
        <!-- Amount skeleton -->
        <div class="w-28">
          <div class="h-5 w-24 bg-surface-overlay/70 rounded ml-auto" />
        </div>
        
        <!-- Menu skeleton -->
        <div class="w-9 h-9 bg-surface-overlay/40 rounded-lg" />
      </div>
    </template>

    <!-- Transaction Items -->
    <template v-else-if="transactions.length > 0">
      <TransitionGroup
        name="list"
        tag="div"
        class="space-y-3"
      >
        <ExtratoItem
          v-for="transaction in transactions"
          :key="transaction.id"
          :transaction="transaction"
          :selected="isSelected(transaction.id)"
          @mark-paid="emit('mark-paid', $event)"
          @mark-unpaid="emit('mark-unpaid', $event)"
          @edit="emit('edit', $event)"
          @delete="emit('delete', $event)"
          @edit-renda="emit('edit-renda', $event)"
          @edit-saida="emit('edit-saida', $event)"
          @mark-renda-received="emit('mark-renda-received', $event)"
          @toggle-select="emit('toggle-select', $event)"
          @pay-invoice="emit('pay-invoice', $event)"
        />
      </TransitionGroup>
    </template>

    <!-- Empty State -->
    <div
      v-else
      class="bg-surface-elevated rounded-xl p-10 flex flex-col items-center justify-center text-center shadow-xs border border-default-subtle"
    >
      <div class="w-20 h-20 rounded-2xl bg-surface-overlay/50 flex items-center justify-center mb-5">
        <span class="material-symbols-outlined text-4xl text-content-subtle">receipt_long</span>
      </div>
      <h3 class="text-body-lg font-semibold text-content-main mb-2">
        Nenhuma transação encontrada
      </h3>
      <p class="text-body-sm text-content-subtle max-w-sm leading-relaxed">
        Não há transações para os filtros selecionados. Tente ajustar os filtros ou adicione uma nova transação.
      </p>
    </div>
  </div>
</template>

<style scoped>
.list-enter-active,
.list-leave-active {
  transition: all 0.3s ease;
}
.list-enter-from {
  opacity: 0;
  transform: translateY(-10px);
}
.list-leave-to {
  opacity: 0;
  transform: translateX(20px);
}
</style>
