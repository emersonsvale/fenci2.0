<script setup lang="ts">
import { computed } from 'vue'
import { useCurrency } from '~/composables/useCurrency'
import SummaryCard from './SummaryCard.vue'
import PlanejamentoCategoryChart from './PlanejamentoCategoryChart.vue'
import type { PlanningPhase } from '../composables/usePlanejamento'

/**
 * PlanejamentoDashboard - Resumo do planejamento: por fase, por categoria, previsto x realizado
 */

const { formatCurrency } = useCurrency()

const props = defineProps<{
  totalsByPhase: Record<PlanningPhase, { planned: number; actual: number }>
  totalsByCategory: { name: string; planned: number; actual: number }[]
  totalPlanned: number
  totalActual: number
  totalSaved?: number
  budgetTotal: number | null
}>()

const phaseLabels: Record<PlanningPhase, string> = {
  before: 'Antes',
  during: 'Durante',
  after: 'Depois',
}


const hasBudget = computed(() => props.budgetTotal != null && props.budgetTotal > 0)
const budgetDiff = computed(() => {
  if (!hasBudget.value) return null
  return props.totalActual - (props.budgetTotal ?? 0)
})
</script>

<template>
  <div id="planejamento-dashboard" class="space-y-6">
    <h3 class="text-heading-sm font-semibold text-content-main">
      Resumo do planejamento
    </h3>

    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <SummaryCard
        label="Total previsto"
        :value="totalPlanned"
        variant="default"
        icon="neutral"
      />
      <SummaryCard
        label="Total realizado"
        :value="totalActual"
        :variant="totalActual > (budgetTotal ?? 0) && hasBudget ? 'danger' : 'success'"
        icon="down"
      />
      <SummaryCard
        label="Total guardado"
        :value="totalSaved ?? 0"
        variant="success"
        icon="up"
      />
      <SummaryCard
        v-if="hasBudget"
        label="Orçamento total"
        :value="budgetTotal ?? 0"
        variant="neutral"
      />
      <SummaryCard
        v-if="budgetDiff !== null"
        :label="budgetDiff >= 0 ? 'Acima do orçamento' : 'Abaixo do orçamento'"
        :value="Math.abs(budgetDiff)"
        :variant="budgetDiff > 0 ? 'danger' : 'success'"
      />
    </div>

    <div>
      <h4 class="text-body-md font-medium text-content-main mb-3">
        Por fase
      </h4>
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div
          v-for="(label, phaseKey) in phaseLabels"
          :key="phaseKey"
          class="rounded-xl border border-default bg-surface-elevated p-4"
        >
          <p class="text-caption text-content-subtle mb-1">
            {{ label }}
          </p>
          <p class="text-body-md font-semibold text-content-main">
            {{ formatCurrency(totalsByPhase[phaseKey as PlanningPhase].planned) }} previsto
          </p>
          <p class="text-body-sm text-content-subtle">
            {{ formatCurrency(totalsByPhase[phaseKey as PlanningPhase].actual) }} realizado
          </p>
        </div>
      </div>
    </div>

    <div v-if="totalsByCategory.length > 0">
      <h4 class="text-body-md font-medium text-content-main mb-3">
        Por categoria
      </h4>
      <PlanejamentoCategoryChart
        :data="totalsByCategory"
        :height="200"
      />
    </div>
  </div>
</template>
