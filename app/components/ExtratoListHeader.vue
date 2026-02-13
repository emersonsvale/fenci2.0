<script setup lang="ts">
import { useCurrency } from '~/composables/useCurrency'

/**
 * ExtratoListHeader - Cabeçalho acima da lista de extrato
 * Permite selecionar todos / desmarcar todos e exibe somas (lista e seleção)
 */

const { formatCurrency } = useCurrency()

export interface ExtratoListHeaderProps {
  /** Há itens na lista (exibe botões de seleção) */
  hasItems: boolean
  /** Há itens selecionados */
  hasSelection: boolean
  /** Quantidade de itens selecionados */
  selectedCount: number
  /** Soma (valor absoluto) dos selecionados */
  selectionSoma: number
  /** Valor líquido dos selecionados */
  selectionValorLiquido: number
  /** Total de entradas (amount > 0) da lista visível */
  listTotalEntradas: number
  /** Total de saídas (|amount| quando amount < 0) da lista visível */
  listTotalSaidas: number
  /** Valor líquido (entradas - saídas) da lista visível */
  listValorLiquido: number
  /** Todos os itens visíveis estão selecionados (para texto do botão) */
  allSelected?: boolean
}

const props = withDefaults(defineProps<ExtratoListHeaderProps>(), {
  allSelected: false,
})

const emit = defineEmits<{
  'select-all': []
  'clear-selection': []
}>()
</script>

<template>
  <div
    id="extrato-list-header"
    class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4 py-2 border-b border-default-subtle"
  >
    <!-- Ações de seleção -->
    <div class="flex items-center gap-2">
      <template v-if="hasItems">
        <button
          v-if="!allSelected"
          type="button"
          class="inline-flex items-center gap-1.5 rounded-lg border border-default-subtle bg-surface-elevated px-3 py-2 text-body-sm font-medium text-content-main shadow-xs transition-colors hover:bg-surface-overlay"
          @click="emit('select-all')"
        >
          <span class="material-symbols-outlined text-lg">checklist</span>
          Selecionar todos
        </button>
        <button
          v-else
          type="button"
          class="inline-flex items-center gap-1.5 rounded-lg border border-default-subtle bg-surface-elevated px-3 py-2 text-body-sm font-medium text-content-main shadow-xs transition-colors hover:bg-surface-overlay"
          @click="emit('clear-selection')"
        >
          <span class="material-symbols-outlined text-lg">checklist_rtl</span>
          Desmarcar todos
        </button>
      </template>
    </div>

    <!-- Somas -->
    <div class="flex flex-wrap items-center gap-x-6 gap-y-1 text-body-sm">
      <!-- Total da lista: entradas, saídas, líquido -->
      <div class="flex flex-wrap items-center gap-x-4 gap-y-1 text-body-sm">
        <span class="text-content-subtle">Entradas:</span>
        <span class="font-semibold text-success">{{ formatCurrency(listTotalEntradas) }}</span>
        <span class="text-content-subtle">·</span>
        <span class="text-content-subtle">Saídas:</span>
        <span class="font-semibold text-error">{{ formatCurrency(listTotalSaidas) }}</span>
        <span class="text-content-subtle">·</span>
        <span class="text-content-subtle">Líquido:</span>
        <span
          class="font-semibold"
          :class="listValorLiquido >= 0 ? 'text-success' : 'text-error'"
        >
          {{ formatCurrency(listValorLiquido) }}
        </span>
      </div>

      <!-- Soma dos selecionados (quando há seleção) -->
      <div
        v-if="hasSelection"
        class="flex flex-wrap items-baseline gap-x-2 rounded-lg bg-primary/10 px-2 py-1"
      >
        <span class="text-content-subtle">{{ selectedCount }} selecionado(s):</span>
        <span class="font-semibold text-content-main">{{ formatCurrency(selectionSoma) }}</span>
        <span class="text-content-subtle">·</span>
        <span
          class="font-semibold"
          :class="selectionValorLiquido >= 0 ? 'text-success' : 'text-error'"
        >
          {{ formatCurrency(selectionValorLiquido) }}
        </span>
        <span class="text-content-subtle text-caption">líquido</span>
      </div>
    </div>
  </div>
</template>
