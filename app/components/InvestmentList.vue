<script setup lang="ts">
import { computed } from 'vue'
import { useCurrency } from '~/composables/useCurrency'

/**
 * InvestmentList - Lista de investimentos
 * Exibe resumo dos investimentos com status e valores
 */

const { formatCurrency } = useCurrency()

export interface Investment {
  id: string
  name: string
  status: 'ativo' | 'inativo' | 'pendente'
  value: number
}

export interface InvestmentListProps {
  investments: Investment[]
  loading?: boolean
  maxItems?: number
}

const props = withDefaults(defineProps<InvestmentListProps>(), {
  loading: false,
  maxItems: 4,
})

const emit = defineEmits<{
  expand: []
  'item-click': [investment: Investment]
}>()

const displayedInvestments = computed(() => {
  return props.investments.slice(0, props.maxItems)
})

</script>

<template>
  <div id="investment-list" class="card p-6">
    <!-- Header -->
    <div class="flex items-center justify-between mb-4">
      <h3 class="text-heading-sm font-semibold text-content-main">Investimentos</h3>
      <button
        type="button"
        class="p-1.5 rounded-lg hover:bg-surface-overlay transition-colors"
        title="Expandir"
        @click="emit('expand')"
      >
        <span class="material-symbols-outlined text-lg text-content-subtle">open_in_full</span>
      </button>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="space-y-3">
      <div v-for="i in 4" :key="i" class="flex items-center justify-between py-3 px-3 rounded-lg bg-surface-overlay">
        <div class="flex items-center gap-3">
          <div class="skeleton w-8 h-8 rounded-full" />
          <div class="skeleton h-4 w-20 rounded" />
        </div>
        <div class="skeleton h-4 w-24 rounded" />
      </div>
    </div>

    <!-- Investment Items -->
    <div v-else class="space-y-2">
      <div
        v-for="investment in displayedInvestments"
        :key="investment.id"
        class="flex items-center justify-between py-3 px-3 rounded-lg bg-surface-overlay cursor-pointer hover:bg-surface-light-tertiary dark:hover:bg-surface-dark-tertiary transition-colors"
        @click="emit('item-click', investment)"
      >
        <div class="flex items-center gap-3">
          <div class="w-8 h-8 rounded-full bg-primary/15 flex items-center justify-center">
            <span class="material-symbols-outlined text-sm text-primary">trending_up</span>
          </div>
          <span class="text-body-sm font-medium text-content-main">{{ investment.name }}</span>
        </div>
        <span class="text-body-sm font-semibold text-success">{{ formatCurrency(investment.value) }}</span>
      </div>

      <!-- Empty State -->
      <div
        v-if="investments.length === 0"
        class="text-center py-8 text-content-subtle"
      >
        <span class="material-symbols-outlined text-4xl mb-2 block opacity-50">trending_up</span>
        <p class="text-body-sm">Nenhum investimento cadastrado</p>
        <p class="text-caption text-content-subtle mt-1">Adicione seus investimentos</p>
      </div>
    </div>
  </div>
</template>
