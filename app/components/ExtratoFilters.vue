<script setup lang="ts">
import { ref } from 'vue'
import type { ExtratoTab, ExtratoStatus, DateFilter } from '../composables/useExtrato'
import DateRangeFilter from './DateRangeFilter.vue'

/**
 * ExtratoFilters - Filtros da página de extratos
 * Contém abas, busca, filtros de status e filtro de data
 */

export interface ExtratoFiltersProps {
  activeTab: ExtratoTab
  searchQuery: string
  activeStatusFilters: ExtratoStatus[]
  /** Tags disponíveis para filtrar (ex.: existingTags do useExtrato) */
  availableTags: string[]
  /** Tags atualmente selecionadas no filtro */
  activeTagFilters: string[]
  dateFilter: DateFilter
}

const props = withDefaults(defineProps<ExtratoFiltersProps>(), {
  availableTags: () => [],
  activeTagFilters: () => [],
})

const emit = defineEmits<{
  'update:activeTab': [tab: ExtratoTab]
  'update:searchQuery': [query: string]
  'toggle-status': [status: ExtratoStatus]
  'toggle-tag': [tag: string]
  'update:dateFilter': [filter: DateFilter]
}>()

const tabs: { id: ExtratoTab; label: string }[] = [
  { id: 'recorrentes', label: 'Recorrentes' },
  { id: 'por_data', label: 'Por data' },
  { id: 'hoje', label: 'Hoje' },
  { id: 'ver_tudo', label: 'Ver tudo' },
]

const statusFilters: { id: ExtratoStatus; label: string; color: string; activeClass: string }[] = [
  { id: 'entrada', label: 'Entradas', color: 'bg-success/10 text-success border-success/20 hover:bg-success/20', activeClass: 'bg-success text-white border-success shadow-sm' },
  { id: 'saida', label: 'Saídas', color: 'bg-error/10 text-error border-error/20 hover:bg-error/20', activeClass: 'bg-error text-white border-error shadow-sm' },
  { id: 'pago', label: 'Pago', color: 'bg-success/10 text-success border-success/20 hover:bg-success/20', activeClass: 'bg-success text-white border-success shadow-sm' },
  { id: 'atrasado', label: 'Atrasado', color: 'bg-error/10 text-error border-error/20 hover:bg-error/20', activeClass: 'bg-error text-white border-error shadow-sm' },
  { id: 'aguardando', label: 'Aguardando', color: 'bg-warning/10 text-warning border-warning/20 hover:bg-warning/20', activeClass: 'bg-warning text-white border-warning shadow-sm' },
]

function isStatusActive(status: ExtratoStatus): boolean {
  return props.activeStatusFilters.includes(status)
}

function getStatusClass(filter: typeof statusFilters[0]): string {
  return isStatusActive(filter.id) ? filter.activeClass : filter.color
}

function isTagActive(tag: string): boolean {
  return props.activeTagFilters.includes(tag)
}

const isTagFilterOpen = ref(false)
const filtersExpanded = ref(true)

function toggleFiltersExpanded() {
  filtersExpanded.value = !filtersExpanded.value
}
</script>

<template>
  <div id="extrato-filters" class="space-y-4">
    <!-- Tabs + seta para ocultar/mostrar filtros -->
    <div class="flex items-center gap-1 border-b border-default">
      <button
        v-for="tab in tabs"
        :key="tab.id"
        type="button"
        class="relative px-4 py-3 text-body-sm font-medium transition-all rounded-t-lg"
        :class="activeTab === tab.id 
          ? 'text-content-main bg-surface-overlay/50' 
          : 'text-content-subtle hover:text-content-muted hover:bg-surface-overlay/30'"
        @click="emit('update:activeTab', tab.id)"
      >
        {{ tab.label }}
        <!-- Active indicator -->
        <span
          v-if="activeTab === tab.id"
          class="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full"
        />
      </button>
      <div class="flex-1 min-w-2" />
      <button
        type="button"
        class="p-2 rounded-lg text-content-subtle hover:bg-surface-overlay hover:text-content-main transition-colors"
        :title="filtersExpanded ? 'Ocultar filtros' : 'Mostrar filtros'"
        aria-label="Ocultar ou mostrar filtros"
        @click="toggleFiltersExpanded"
      >
        <span
          class="material-symbols-outlined text-xl transition-transform"
          :class="filtersExpanded ? '' : 'rotate-180'"
        >
          expand_more
        </span>
      </button>
    </div>

    <!-- Área de filtros (busca, data, status, tags) — recolhível -->
    <Transition
      enter-active-class="transition-all duration-200 ease-out"
      enter-from-class="opacity-0 -translate-y-2"
      enter-to-class="opacity-100 translate-y-0"
      leave-active-class="transition-all duration-150 ease-in"
      leave-from-class="opacity-100 translate-y-0"
      leave-to-class="opacity-0 -translate-y-2"
    >
      <div v-show="filtersExpanded" class="space-y-4">
        <!-- Search + Date Filter + Status Filters -->
        <div class="flex items-center gap-3 flex-wrap">
      <!-- Search Input -->
      <div class="relative min-w-[180px] max-w-xs">
        <span class="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-content-subtle text-lg">
          search
        </span>
        <input
          type="text"
          :value="searchQuery"
          placeholder="Buscar..."
          class="w-full pl-10 pr-4 py-2 bg-surface-overlay rounded-lg border border-transparent text-body-sm text-content-main placeholder:text-content-subtle focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-all"
          @input="emit('update:searchQuery', ($event.target as HTMLInputElement).value)"
        />
      </div>

      <!-- Date Range Filter -->
      <DateRangeFilter
        :model-value="dateFilter"
        @update:model-value="emit('update:dateFilter', $event)"
      />

      <!-- Separador visual -->
      <div class="w-px h-6 bg-border-default-subtle hidden sm:block" />

      <!-- Status Filter Tags -->
      <div class="flex items-center gap-2 flex-wrap">
        <button
          v-for="filter in statusFilters"
          :key="filter.id"
          type="button"
          class="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-caption font-medium border transition-all active:scale-95"
          :class="getStatusClass(filter)"
          @click="emit('toggle-status', filter.id)"
        >
          {{ filter.label }}
          <span 
            v-if="isStatusActive(filter.id)"
            class="material-symbols-outlined text-sm"
          >
            check
          </span>
          <span 
            v-else
            class="material-symbols-outlined text-sm opacity-60"
          >
            add
          </span>
        </button>
      </div>
    </div>

    <!-- Trigger: Filtro por Tags (oculto até clicar) -->
    <div v-if="availableTags.length > 0" class="flex items-center gap-2 flex-wrap">
      <button
        type="button"
        class="inline-flex items-center gap-2 px-3 py-2 rounded-xl text-caption font-medium border transition-all"
        :class="activeTagFilters.length > 0
          ? 'bg-primary/15 text-primary border-primary shadow-sm hover:bg-primary/25'
          : 'bg-surface-overlay/50 text-content-subtle border-default-subtle hover:bg-surface-overlay hover:text-content-main'"
        @click="isTagFilterOpen = !isTagFilterOpen"
      >
        <span class="material-symbols-outlined text-lg">label</span>
        <span>Tags</span>
        <span
          v-if="activeTagFilters.length > 0"
          class="min-w-[20px] h-5 px-1.5 flex items-center justify-center rounded-full bg-primary text-primary-contrast text-[11px] font-bold leading-none"
        >
          {{ activeTagFilters.length }}
        </span>
        <span class="material-symbols-outlined text-lg transition-transform" :class="isTagFilterOpen ? 'rotate-180' : ''">
          expand_more
        </span>
      </button>

      <!-- Lista de tags (visível ao expandir) -->
      <Transition
        enter-active-class="transition-all duration-200 ease-out"
        enter-from-class="opacity-0 -translate-y-1"
        enter-to-class="opacity-100 translate-y-0"
        leave-active-class="transition-all duration-150 ease-in"
        leave-from-class="opacity-100 translate-y-0"
        leave-to-class="opacity-0 -translate-y-1"
      >
        <div
          v-show="isTagFilterOpen"
          class="w-full flex items-center gap-2 flex-wrap pt-1"
        >
          <span class="text-caption text-content-subtle w-full shrink-0">Selecione as tags:</span>
          <button
            v-for="tag in availableTags"
            :key="tag"
            type="button"
            class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-caption font-medium border-2 transition-all active:scale-95"
            :class="isTagActive(tag)
              ? 'bg-primary text-primary-contrast border-primary shadow-sm ring-2 ring-primary/30'
              : 'bg-surface-overlay/50 text-content-muted border-default-subtle hover:bg-surface-overlay hover:border-default hover:text-content-main'"
            @click="emit('toggle-tag', tag)"
          >
            <span v-if="isTagActive(tag)" class="material-symbols-outlined text-sm">check_circle</span>
            {{ tag }}
          </button>
        </div>
      </Transition>
    </div>
      </div>
    </Transition>
  </div>
</template>
