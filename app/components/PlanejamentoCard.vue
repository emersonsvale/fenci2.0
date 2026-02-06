<script setup lang="ts">
import { computed } from 'vue'
import type { Planning } from 'shared/types/database.types'

/**
 * PlanejamentoCard - Card de um planejamento na listagem
 * Exibe nome, tipo, status, datas e link para o detalhe
 */

const props = defineProps<{
  planning: Planning
}>()

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

function formatCurrency(value: number | null) {
  if (value == null) return '—'
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
}
</script>

<template>
  <NuxtLink
    :to="`/planejamentos/${planning.id}`"
    class="block rounded-xl border border-default bg-surface-elevated p-5 transition-colors hover:border-primary/40 hover:bg-surface-overlay"
  >
    <div class="flex items-start justify-between gap-3">
      <div class="min-w-0 flex-1">
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
      </div>
      <span class="material-symbols-outlined text-content-tertiary shrink-0">arrow_forward</span>
    </div>
  </NuxtLink>
</template>
