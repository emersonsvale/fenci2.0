<script setup lang="ts">
import { computed } from 'vue'

/**
 * VencimentoCard - Card de próximos vencimentos
 * Exibe lista de contas a vencer com opção de pagar
 */

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

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value)
}

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
    <div v-else class="space-y-3">
      <div
        v-for="vencimento in displayedVencimentos"
        :key="vencimento.id"
        class="p-3 rounded-lg bg-surface-overlay"
      >
        <div class="flex items-start justify-between gap-3">
          <!-- Info -->
          <div class="flex-1 min-w-0">
            <p class="text-body-sm font-medium text-content-main">{{ vencimento.descricao }}</p>
            <p class="text-caption text-content-subtle">{{ vencimento.tipo }}</p>
            <div class="flex items-center gap-2 mt-1">
              <span class="text-caption text-content-subtle">Vencimento</span>
              <span class="text-caption font-medium text-content-main">{{ formatDate(vencimento.vencimento) }}</span>
            </div>
          </div>

          <!-- Value and Status -->
          <div class="flex flex-col items-end gap-2">
            <span class="text-body-sm font-semibold text-content-main">{{ formatCurrency(vencimento.valor) }}</span>
            <span
              v-if="vencimento.pago"
              class="text-caption text-success flex items-center gap-1"
            >
              <span class="material-symbols-outlined text-sm">check_circle</span>
              Pago
            </span>
            <span
              v-else
              class="text-caption text-content-subtle flex items-center gap-1"
            >
              <span class="material-symbols-outlined text-sm">schedule</span>
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
        <span class="material-symbols-outlined text-4xl mb-2 block opacity-50">event_available</span>
        <p class="text-body-sm">Nenhum vencimento próximo</p>
        <p class="text-caption text-content-subtle mt-1">Suas contas a pagar aparecerão aqui</p>
      </div>
    </div>
  </div>
</template>

