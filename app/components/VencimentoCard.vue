<script setup lang="ts">
import { computed } from 'vue'
import { useCurrency } from '~/composables/useCurrency'

/**
 * VencimentoCard - Card de próximos vencimentos
 * Exibe lista de contas a vencer com opção de pagar
 */

const { formatCurrency } = useCurrency()

export interface Vencimento {
  id: string
  descricao: string
  tipo: string
  vencimento: Date | string
  valor: number
  pago: boolean
}

export interface VencimentoCardProps {
  vencimentos: Vencimento[]
  loading?: boolean
  maxItems?: number
}

const props = withDefaults(defineProps<VencimentoCardProps>(), {
  loading: false,
  maxItems: 3,
})

const emit = defineEmits<{
  'view-all': []
  'item-click': [vencimento: Vencimento]
}>()

const displayedVencimentos = computed(() => {
  return props.vencimentos.slice(0, props.maxItems)
})


function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
}
</script>

<template>
  <div id="vencimento-card" class="card p-6">
    <!-- Header -->
    <div class="flex items-center justify-between mb-4">
      <h3 class="text-heading-sm font-semibold text-content-main">Próximos vencimentos</h3>
      <button
        type="button"
        class="text-body-sm text-primary font-medium hover:text-primary-600 transition-colors"
        @click="emit('view-all')"
      >
        Ver todos
      </button>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="space-y-3">
      <div v-for="i in 3" :key="i" class="p-3 rounded-lg bg-surface-overlay">
        <div class="flex items-center justify-between">
          <div class="space-y-2">
            <div class="skeleton h-4 w-24 rounded" />
            <div class="skeleton h-3 w-16 rounded" />
          </div>
          <div class="skeleton h-8 w-16 rounded-full" />
        </div>
      </div>
    </div>

    <!-- Vencimento Items -->
    <div v-else class="space-y-2">
      <div
        v-for="vencimento in displayedVencimentos"
        :key="vencimento.id"
        class="p-3 rounded-xl bg-surface-light-tertiary/60 dark:bg-surface-dark-tertiary/60 hover:bg-surface-overlay transition-all duration-200 cursor-pointer group"
      >
        <div class="flex items-start justify-between gap-3">
          <!-- Info -->
          <div class="flex-1 min-w-0">
            <p class="text-body-sm font-medium text-content-main group-hover:text-primary transition-colors">{{ vencimento.descricao }}</p>
            <p class="text-caption text-content-subtle">{{ vencimento.tipo }}</p>
            <div class="flex items-center gap-2 mt-1">
              <span class="material-symbols-outlined text-xs text-content-subtle">calendar_today</span>
              <span class="text-caption font-medium text-content-muted">{{ formatDate(vencimento.vencimento) }}</span>
            </div>
          </div>

          <!-- Value and Status -->
          <div class="flex flex-col items-end gap-1.5">
            <span class="text-body-sm font-bold text-content-main tabular-nums">{{ formatCurrency(vencimento.valor) }}</span>
            <span
              v-if="vencimento.pago"
              class="text-[10px] font-medium text-success flex items-center gap-0.5 bg-success/8 px-1.5 py-0.5 rounded-md"
            >
              <span class="material-symbols-outlined text-xs">check_circle</span>
              Pago
            </span>
            <span
              v-else
              class="text-[10px] font-medium text-warning flex items-center gap-0.5 bg-warning/8 px-1.5 py-0.5 rounded-md"
            >
              <span class="material-symbols-outlined text-xs">schedule</span>
              Pendente
            </span>
          </div>
        </div>
      </div>

      <!-- Empty State -->
      <div
        v-if="vencimentos.length === 0"
        class="text-center py-8 text-content-subtle"
      >
        <div class="w-14 h-14 rounded-2xl bg-success/8 flex items-center justify-center mx-auto mb-3">
          <span class="material-symbols-outlined text-2xl text-success/60">event_available</span>
        </div>
        <p class="text-body-sm font-medium text-content-muted">Nenhum vencimento próximo</p>
        <p class="text-caption text-content-subtle mt-1">Suas contas a pagar aparecerão aqui</p>
      </div>
    </div>
  </div>
</template>

