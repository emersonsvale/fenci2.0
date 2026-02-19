<script setup lang="ts">
import { computed } from 'vue'
import type { Planning } from 'shared/types/database.types'
import { useCurrency } from '~/composables/useCurrency'
import type { PlanningTotals } from '~/composables/usePlanejamentos'

/**
 * PlanejamentoCard - Card de um planejamento na listagem
 * Exibe nome, tipo, status, datas, totais (previsto/realizado/guardado), link para o detalhe e menu (editar/excluir)
 */

const { formatCurrency: formatCurrencyBase } = useCurrency()

function formatCurrency(value: number | null): string {
  if (value == null) return '—'
  return formatCurrencyBase(value)
}

const props = defineProps<{
  planning: Planning
  totals?: PlanningTotals | null
}>()

const emit = defineEmits<{
  edit: []
  delete: []
}>()

function handleEdit() {
  emit('edit')
}

function handleDelete() {
  emit('delete')
}

const statusLabel: Record<string, string> = {
  rascunho: 'Rascunho',
  em_planejamento: 'Em planejamento',
  em_andamento: 'Em andamento',
  concluido: 'Concluído',
  cancelado: 'Cancelado',
}

const typeLabel: Record<string, string> = {
  viagem: 'Viagem',
  carro: 'Carro',
  casamento: 'Casamento',
  reforma: 'Reforma',
  mudanca: 'Mudança',
  outro: 'Outro',
}

const statusText = computed(() => statusLabel[props.planning.status ?? ''] ?? props.planning.status ?? '—')
const typeText = computed(() => typeLabel[props.planning.type ?? ''] ?? props.planning.type ?? '—')

function formatDate(dateStr: string | null) {
  if (!dateStr) return '—'
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

</script>

<template>
  <div
    id="planejamento-card"
    class="block rounded-xl border border-default bg-surface-elevated p-5 transition-colors hover:border-primary/40 hover:bg-surface-overlay"
  >
    <div class="flex items-start justify-between gap-3">
      <NuxtLink
        :to="`/planejamentos/${planning.id}`"
        class="min-w-0 flex-1"
      >
        <h3 class="text-body-lg font-semibold text-content-main truncate">
          {{ planning.name }}
        </h3>
        <div class="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-body-sm text-content-subtle">
          <span class="inline-flex items-center gap-1">
            <span class="material-symbols-outlined text-base">category</span>
            {{ typeText }}
          </span>
          <span class="inline-flex items-center gap-1">
            <span class="material-symbols-outlined text-base">info</span>
            {{ statusText }}
          </span>
          <span v-if="planning.date_start || planning.date_end" class="inline-flex items-center gap-1">
            <span class="material-symbols-outlined text-base">event</span>
            {{ formatDate(planning.date_start) }}
            <template v-if="planning.date_end"> – {{ formatDate(planning.date_end) }}</template>
          </span>
          <span v-if="planning.budget_total != null && planning.budget_total > 0">
            {{ formatCurrency(planning.budget_total) }}
          </span>
        </div>
        <div v-if="totals" class="mt-4 grid grid-cols-3 gap-3 border-t border-default pt-4 text-body-sm">
          <div>
            <p class="text-content-subtle">Total previsto</p>
            <p class="font-semibold text-content-main">{{ formatCurrency(totals.totalPlanned) }}</p>
          </div>
          <div>
            <p class="text-content-subtle">Total realizado</p>
            <p class="font-semibold text-content-main">{{ formatCurrency(totals.totalActual) }}</p>
          </div>
          <div>
            <p class="text-content-subtle">
              Total guardado
            </p>
            <p class="font-semibold text-content-main">{{ formatCurrency(totals.totalSaved) }}</p>
          </div>
        </div>
      </NuxtLink>
      <div class="flex shrink-0 flex-row items-center gap-1">
        <button
          type="button"
          class="inline-flex shrink-0 p-1.5 rounded-lg hover:bg-surface-tertiary transition-colors"
          aria-label="Editar planejamento"
          @click.stop="handleEdit"
        >
          <span class="material-symbols-outlined text-content-subtle text-lg">edit</span>
        </button>
        <button
          type="button"
          class="inline-flex shrink-0 p-1.5 rounded-lg hover:bg-surface-tertiary transition-colors hover:text-error"
          aria-label="Excluir planejamento"
          @click.stop="handleDelete"
        >
          <span class="material-symbols-outlined text-content-subtle text-lg">delete</span>
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
</style>
