<script setup lang="ts">
import { ref, computed } from 'vue'
import type { PlanningCategory } from 'shared/types/database.types'
import type { PlanningEntry } from 'shared/types/database.types'
import PlanejamentoEntryModal from './PlanejamentoEntryModal.vue'
import ConfirmDeleteModal from './ConfirmDeleteModal.vue'
import type { EntryFormData, PlanningPhase } from '../composables/usePlanejamento'

const props = defineProps<{
  entries: PlanningEntry[]
  categories: PlanningCategory[]
  isLoading?: boolean
  phaseFilter?: PlanningPhase | null
}>()

const emit = defineEmits<{
  create: [data: EntryFormData]
  update: [id: string, data: Partial<EntryFormData>]
  delete: [id: string]
}>()

const phaseLabels: Record<PlanningPhase, string> = {
  before: 'Antes',
  during: 'Durante',
  after: 'Depois',
}

const isModalOpen = ref(false)
const isDeleteModalOpen = ref(false)
const editingEntry = ref<PlanningEntry | null>(null)
const entryToDelete = ref<PlanningEntry | null>(null)

const filteredEntries = computed(() => {
  if (!props.phaseFilter) return props.entries
  return props.entries.filter((e) => e.phase === props.phaseFilter)
})

function getCategoryName(categoryId: string) {
  return props.categories.find((c) => c.id === categoryId)?.name ?? '—'
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
}

function formatDate(dateStr: string) {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

function openCreate() {
  editingEntry.value = null
  isModalOpen.value = true
}

function openEdit(entry: PlanningEntry) {
  editingEntry.value = entry
  isModalOpen.value = true
}

function closeModal() {
  isModalOpen.value = false
  editingEntry.value = null
}

function handleSubmit(data: EntryFormData) {
  if (editingEntry.value) {
    emit('update', editingEntry.value.id, data)
  } else {
    emit('create', data)
  }
  closeModal()
}

function openDelete(entry: PlanningEntry) {
  entryToDelete.value = entry
  isDeleteModalOpen.value = true
}

function closeDeleteModal() {
  isDeleteModalOpen.value = false
  entryToDelete.value = null
}

function confirmDelete() {
  if (entryToDelete.value) {
    emit('delete', entryToDelete.value.id)
    closeDeleteModal()
  }
}

function toggleIncludeInTotals(entry: PlanningEntry) {
  const next = entry.is_active === false
  emit('update', entry.id, { is_active: next })
}
</script>

<template>
  <div class="space-y-4">
    <div class="flex items-center justify-between">
      <h4 class="text-body-md font-medium text-content-main">
        Lançamentos
      </h4>
      <button
        type="button"
        class="btn btn-outline !w-auto text-body-sm"
        :disabled="categories.length === 0"
        title="Crie uma categoria antes"
        @click="openCreate"
      >
        <span class="material-symbols-outlined text-lg">add</span>
        Novo lançamento
      </button>
    </div>
    <div v-if="isLoading" class="flex justify-center py-6">
      <span class="material-symbols-outlined animate-spin text-2xl text-content-tertiary">progress_activity</span>
    </div>
    <p v-else-if="categories.length === 0" class="text-body-sm text-content-subtle">
      Crie pelo menos uma categoria para adicionar lançamentos.
    </p>
    <ul v-else-if="filteredEntries.length === 0" class="rounded-xl border border-default bg-surface-elevated p-6 text-center text-body-sm text-content-subtle">
      Nenhum lançamento{{ phaseFilter ? ` na fase "${phaseLabels[phaseFilter]}"` : '' }}.
    </ul>
    <ul v-else class="space-y-2">
      <li
        v-for="entry in filteredEntries"
        :key="entry.id"
        class="flex items-center justify-between gap-4 rounded-lg border border-default bg-surface-elevated px-4 py-3"
        :class="{ 'opacity-60': entry.is_active === false }"
      >
        <div class="min-w-0 flex-1">
          <div class="flex items-center gap-2">
            <p class="text-body-sm font-medium text-content-main truncate">
              {{ entry.description || getCategoryName(entry.planning_category_id) }}
            </p>
            <span
              v-if="entry.is_active === false"
              class="shrink-0 rounded px-2 py-0.5 text-caption font-medium bg-content-tertiary/20 text-content-subtle"
            >
              Excluído dos totais
            </span>
          </div>
          <p class="text-caption text-content-subtle">
            {{ getCategoryName(entry.planning_category_id) }} · {{ phaseLabels[entry.phase as PlanningPhase] }} · {{ formatDate(entry.entry_date) }}
          </p>
        </div>
        <div class="flex items-center gap-3 shrink-0">
          <div class="text-right">
            <p class="text-body-sm font-medium text-content-main">
              {{ formatCurrency(Number(entry.amount_planned)) }} previsto
            </p>
            <p v-if="entry.amount_actual != null" class="text-caption text-content-subtle">
              {{ formatCurrency(Number(entry.amount_actual)) }} realizado
            </p>
          </div>
          <div class="flex items-center gap-1">
            <button
              type="button"
              class="p-2 rounded-lg transition-colors"
              :class="entry.is_active === false ? 'bg-primary/15 text-primary' : 'hover:bg-surface-overlay text-content-subtle'"
              :title="entry.is_active === false ? 'Incluir nos totais' : 'Excluir dos totais'"
              @click="toggleIncludeInTotals(entry)"
            >
              <span class="material-symbols-outlined text-lg">
                {{ entry.is_active === false ? 'visibility' : 'visibility_off' }}
              </span>
            </button>
            <button
              type="button"
              class="p-2 rounded-lg hover:bg-surface-overlay text-content-subtle"
              title="Editar"
              @click="openEdit(entry)"
            >
              <span class="material-symbols-outlined text-lg">edit</span>
            </button>
            <button
              type="button"
              class="p-2 rounded-lg hover:bg-error/10 text-content-subtle hover:text-error"
              title="Excluir"
              @click="openDelete(entry)"
            >
              <span class="material-symbols-outlined text-lg">delete</span>
            </button>
          </div>
        </div>
      </li>
    </ul>

    <PlanejamentoEntryModal
      :is-open="isModalOpen"
      :categories="categories"
      :editing-entry="editingEntry"
      @close="closeModal"
      @submit="handleSubmit"
    />
    <ConfirmDeleteModal
      :is-open="isDeleteModalOpen"
      title="Excluir lançamento"
      message="Tem certeza que deseja excluir este lançamento?"
      @confirm="confirmDelete"
      @cancel="closeDeleteModal"
    />
  </div>
</template>
