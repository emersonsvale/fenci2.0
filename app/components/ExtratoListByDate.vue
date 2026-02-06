<script setup lang="ts">
import { computed } from 'vue'
import type { TransactionDateGroup } from '../composables/useExtrato'
import { useCurrency } from '~/composables/useCurrency'
import ExtratoItem from './ExtratoItem.vue'

/**
 * ExtratoListByDate - Lista de transações agrupadas por data
 * Exibe as transações organizadas por dia com saldo diário
 */

const { formatCurrency: formatCurrencyBase } = useCurrency()

export interface ExtratoListByDateProps {
  groups: TransactionDateGroup[]
  loading?: boolean
  /** IDs dos lançamentos selecionados (para seleção múltipla) */
  selectedIds?: Set<string> | string[]
}

const props = withDefaults(defineProps<ExtratoListByDateProps>(), {
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

// Formatação de moeda (com sinal para saldo do dia)
function formatCurrency(value: number): string {
  const formatted = formatCurrencyBase(Math.abs(value))
  return value >= 0 ? formatted : `- ${formatted}`
}

// Verificar se é um novo mês (para exibir o header do mês)
function isNewMonth(index: number): boolean {
  if (index === 0) return true
  return props.groups[index].monthName !== props.groups[index - 1].monthName
}
</script>

<template>
  <div id="extrato-list-by-date" class="space-y-6">
    <!-- Loading State -->
    <template v-if="loading">
      <div v-for="i in 3" :key="i" class="space-y-3">
        <!-- Header skeleton -->
        <div class="animate-pulse">
          <div class="h-6 w-24 bg-surface-overlay/70 rounded mb-2" />
          <div class="flex items-center justify-between py-2 border-b border-default-subtle">
            <div class="h-4 w-64 bg-surface-overlay/50 rounded" />
            <div class="flex gap-16">
              <div class="h-4 w-12 bg-surface-overlay/50 rounded" />
              <div class="h-4 w-12 bg-surface-overlay/50 rounded" />
            </div>
          </div>
        </div>
        <!-- Items skeleton -->
        <div
          v-for="j in 2"
          :key="j"
          class="bg-surface-elevated rounded-xl p-4 flex items-center gap-4 animate-pulse"
        >
          <div class="w-11 h-11 rounded-xl bg-surface-overlay/70" />
          <div class="flex-1 space-y-2">
            <div class="h-4 w-40 bg-surface-overlay/70 rounded" />
            <div class="h-3 w-24 bg-surface-overlay/50 rounded" />
          </div>
          <div class="h-8 w-24 bg-surface-overlay/60 rounded-lg" />
          <div class="w-24 h-5 bg-surface-overlay/70 rounded" />
        </div>
      </div>
    </template>

    <!-- Grouped Transactions -->
    <template v-else-if="groups.length > 0">
      <div v-for="(group, index) in groups" :key="group.dateKey" class="space-y-3">
        <!-- Month Header (quando muda o mês) -->
        <h2
          v-if="isNewMonth(index)"
          class="text-heading-lg font-bold text-content-main pt-4 first:pt-0"
        >
          {{ group.monthName }}
        </h2>

        <!-- Date Group Header -->
        <div class="flex items-center justify-between py-3 px-2 bg-surface-overlay/30 rounded-lg">
          <div class="flex items-center gap-2">
            <span class="text-body-sm text-content-muted capitalize">
              {{ group.dayOfWeek }}, {{ group.formattedDate }}
            </span>
            <span class="text-body-sm text-content-subtle">-</span>
            <span class="text-body-sm font-semibold" :class="group.dailyBalance >= 0 ? 'text-success' : 'text-error'">
              Saldo do dia: {{ formatCurrency(group.dailyBalance) }}
            </span>
          </div>
          <div class="flex items-center gap-16 text-caption font-medium text-content-subtle">
            <span>Valor</span>
            <span>Ações</span>
          </div>
        </div>

        <!-- Transactions in this group -->
        <div class="space-y-2 pl-1">
          <ExtratoItem
            v-for="transaction in group.transactions"
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
        </div>
      </div>
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
