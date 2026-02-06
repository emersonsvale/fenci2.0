<script setup lang="ts">
import { ref } from 'vue'
import type { PlanningCategory } from 'shared/types/database.types'
import PlanejamentoCategoryModal from './PlanejamentoCategoryModal.vue'
import ConfirmDeleteModal from './ConfirmDeleteModal.vue'
import type { PlanningCategoryFormData } from '../composables/usePlanejamento'

/**
 * PlanejamentoCategoryList - Lista e CRUD de categorias do planejamento
 */

const props = defineProps<{
  categories: PlanningCategory[]
  isLoading?: boolean
}>()

const emit = defineEmits<{
  create: [data: PlanningCategoryFormData]
  update: [id: string, data: Partial<PlanningCategoryFormData>]
  delete: [id: string]
}>()

const isModalOpen = ref(false)
const isDeleteModalOpen = ref(false)
const editingCategory = ref<PlanningCategory | null>(null)
const categoryToDelete = ref<PlanningCategory | null>(null)

function openCreate() {
  editingCategory.value = null
  isModalOpen.value = true
}

function openEdit(cat: PlanningCategory) {
  editingCategory.value = cat
  isModalOpen.value = true
}

function closeModal() {
  isModalOpen.value = false
  editingCategory.value = null
}

function handleSubmit(data: PlanningCategoryFormData) {
  if (editingCategory.value) {
    emit('update', editingCategory.value.id, data)
  } else {
    emit('create', data)
  }
  closeModal()
}

function openDelete(cat: PlanningCategory) {
  categoryToDelete.value = cat
  isDeleteModalOpen.value = true
}

function closeDeleteModal() {
  isDeleteModalOpen.value = false
  categoryToDelete.value = null
}

function confirmDelete() {
  if (categoryToDelete.value) {
    emit('delete', categoryToDelete.value.id)
    closeDeleteModal()
  }
}
</script>

<template>
  <div class="space-y-4">
    <div class="flex items-center justify-between">
      <h4 class="text-body-md font-medium text-content-main">
        Categorias
      </h4>
      <button
        type="button"
        class="btn btn-outline !w-auto text-body-sm"
        @click="openCreate"
      >
        <span class="material-symbols-outlined text-lg">add</span>
        Nova categoria
      </button>
    </div>
    <div v-if="isLoading" class="flex justify-center py-6">
      <span class="material-symbols-outlined animate-spin text-2xl text-content-tertiary">progress_activity</span>
    </div>
    <ul v-else-if="categories.length === 0" class="rounded-xl border border-default bg-surface-elevated p-6 text-center text-body-sm text-content-subtle">
      Nenhuma categoria. Crie uma para classificar os lançamentos.
    </ul>
    <ul v-else class="space-y-2">
      <li
        v-for="cat in categories"
        :key="cat.id"
        class="flex items-center justify-between rounded-lg border border-default bg-surface-elevated px-4 py-3"
      >
        <div class="flex items-center gap-2 min-w-0">
          <span
            v-if="cat.color"
            class="w-3 h-3 rounded-full shrink-0"
            :style="{ backgroundColor: cat.color }"
          />
          <span class="text-body-sm font-medium text-content-main truncate">{{ cat.name }}</span>
        </div>
        <div class="flex items-center gap-1 shrink-0">
          <button
            type="button"
            class="p-2 rounded-lg hover:bg-surface-overlay text-content-subtle"
            title="Editar"
            @click="openEdit(cat)"
          >
            <span class="material-symbols-outlined text-lg">edit</span>
          </button>
          <button
            type="button"
            class="p-2 rounded-lg hover:bg-error/10 text-content-subtle hover:text-error"
            title="Excluir"
            @click="openDelete(cat)"
          >
            <span class="material-symbols-outlined text-lg">delete</span>
          </button>
        </div>
      </li>
    </ul>

    <PlanejamentoCategoryModal
      :is-open="isModalOpen"
      :editing-category="editingCategory"
      @close="closeModal"
      @submit="handleSubmit"
    />
    <ConfirmDeleteModal
      :is-open="isDeleteModalOpen"
      title="Excluir categoria"
      :message="`Excluir a categoria “${categoryToDelete?.name}”? Lançamentos vinculados precisarão de outra categoria.`"
      @confirm="confirmDelete"
      @cancel="closeDeleteModal"
    />
  </div>
</template>
