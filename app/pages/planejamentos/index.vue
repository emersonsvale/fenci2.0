<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useSupabaseUser } from '#imports'
import { usePlanejamentos, type PlanningFormData } from '../../composables/usePlanejamentos'
import { useProfile } from '../../composables/useProfile'
import PageHeader from '../../components/PageHeader.vue'
import PlanejamentoCard from '../../components/PlanejamentoCard.vue'
import PlanejamentoFormModal from '../../components/PlanejamentoFormModal.vue'
import type { Planning } from 'shared/types/database.types'

/**
 * Planejamentos - Lista de planejamentos financeiros
 * Cada item leva ao detalhe em /planejamentos/[id]
 */

definePageMeta({
  layout: 'dashboard',
})

const { avatarUrl, profile, loadProfile } = useProfile()
const user = useSupabaseUser()
const userName = computed(() => {
  const u = user.value
  if (!u) return 'Usuário'
  return profile.value?.full_name || u.user_metadata?.full_name?.split(' ')[0] || u.email?.split('@')[0] || 'Usuário'
})

const {
  list,
  isLoading,
  error: composableError,
  fetchPlanejamentos,
  createPlanejamento,
  updatePlanejamento,
  deletePlanejamento,
} = usePlanejamentos()

const isFormModalOpen = ref(false)
const editingPlanning = ref<Planning | null>(null)
const isSubmitting = ref(false)
const formError = ref<string | null>(null)

onMounted(() => {
  loadProfile()
  fetchPlanejamentos()
})

function openCreateModal() {
  editingPlanning.value = null
  formError.value = null
  isFormModalOpen.value = true
}

function openEditModal(planning: Planning) {
  editingPlanning.value = planning
  formError.value = null
  isFormModalOpen.value = true
}

function closeFormModal() {
  isFormModalOpen.value = false
  editingPlanning.value = null
  formError.value = null
}

async function handleFormSubmit(data: PlanningFormData) {
  isSubmitting.value = true
  formError.value = null
  if (editingPlanning.value) {
    const { error } = await updatePlanejamento(editingPlanning.value.id, data)
    if (error) formError.value = error
    else closeFormModal()
  } else {
    const { error } = await createPlanejamento(data)
    if (error) formError.value = error
    else closeFormModal()
  }
  isSubmitting.value = false
}
</script>

<template>
  <div id="planejamentos-page" class="flex flex-col gap-6 w-full max-w-[1200px] mx-auto">
    <PageHeader
      :user-name="userName"
      :quote="{ text: 'Planeje seus gastos antes, durante e depois dos seus objetivos.', author: 'Fenci' }"
    >
      <template #actions>
        <button
          type="button"
          class="btn btn-primary !w-auto px-6 py-2.5 rounded-full inline-flex items-center gap-2"
          @click="openCreateModal"
        >
          <span class="material-symbols-outlined text-lg">add</span>
          Novo planejamento
        </button>
      </template>
    </PageHeader>

    <section class="flex flex-col gap-4">
      <h2 class="text-heading-md text-content-main">
        Seus planejamentos
      </h2>
      <p v-if="composableError" class="text-body-sm text-error">
        {{ composableError }}
      </p>
      <div v-if="isLoading" class="flex items-center justify-center py-12">
        <span class="material-symbols-outlined animate-spin text-4xl text-content-tertiary">progress_activity</span>
      </div>
      <div v-else-if="list.length === 0" class="rounded-xl border border-default bg-surface-elevated p-12 text-center">
        <span class="material-symbols-outlined text-5xl text-content-tertiary mb-3 block">savings</span>
        <p class="text-body-md text-content-subtle mb-4">
          Nenhum planejamento ainda. Crie um para organizar viagens, compras e outros objetivos.
        </p>
        <button
          type="button"
          class="btn btn-primary !w-auto"
          @click="openCreateModal"
        >
          Criar primeiro planejamento
        </button>
      </div>
      <ul v-else class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <li v-for="planning in list" :key="planning.id">
          <PlanejamentoCard :planning="planning" />
        </li>
      </ul>
    </section>

    <PlanejamentoFormModal
      :is-open="isFormModalOpen"
      :editing-planning="editingPlanning"
      :is-submitting="isSubmitting"
      :error="formError"
      @close="closeFormModal"
      @submit="handleFormSubmit"
    />
  </div>
</template>
