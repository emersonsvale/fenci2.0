<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import { usePlanejamento, type PlanningPhase, type PlanningCategoryFormData } from '../../composables/usePlanejamento'
import PlanejamentoDashboard from '../../components/PlanejamentoDashboard.vue'
import PlanejamentoCategoryList from '../../components/PlanejamentoCategoryList.vue'
import PlanejamentoEntryList from '../../components/PlanejamentoEntryList.vue'
import PlanejamentoInstallmentList from '../../components/PlanejamentoInstallmentList.vue'
import PlanejamentoInstallmentModal from '../../components/PlanejamentoInstallmentModal.vue'
import PlanejamentoSavingModal from '../../components/PlanejamentoSavingModal.vue'
import type { PlanningSaving } from 'shared/types/database.types'
import type { SavingFormData } from '../../composables/usePlanejamento'
import { useCurrency } from '../../composables/useCurrency'

/**
 * Planejamento detalhe - Dashboard, categorias, lançamentos e parcelas do planejamento
 */

definePageMeta({
  layout: 'dashboard',
})

const { formatCurrency } = useCurrency()
const route = useRoute()
const planningId = computed(() => (route.params.id as string) ?? null)

const {
  planning,
  categories,
  entries,
  installments,
  isLoading,
  error,
  fetchAll,
  createCategory,
  updateCategory,
  deleteCategory,
  createEntry,
  updateEntry,
  deleteEntry,
  createInstallment,
  updateInstallment,
  deleteInstallment,
  markInstallmentPaid,
  totalsByPhase,
  totalsByCategory,
  totalPlanned,
  totalActual,
  savings,
  totalSaved,
  createSaving,
  updateSaving,
  deleteSaving,
  installmentsTotal,
  installmentsPaidTotal,
} = usePlanejamento(planningId)

const activeTab = ref<'dashboard' | 'categorias' | 'lancamentos' | 'parcelas'>('dashboard')
const entryPhaseFilter = ref<PlanningPhase | null>(null)
const isInstallmentModalOpen = ref(false)
const isSavingModalOpen = ref(false)
const editingSaving = ref<PlanningSaving | null>(null)
const entryError = ref<string | null>(null)
const savingError = ref<string | null>(null)

onMounted(() => {
  fetchAll()
})

watch(planningId, () => {
  fetchAll()
})

const notFound = computed(() => !isLoading.value && !planning.value && planningId.value)

function formatDate(dateStr: string | null) {
  if (!dateStr) return '—'
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}


const statusLabel: Record<string, string> = {
  rascunho: 'Rascunho',
  em_planejamento: 'Em planejamento',
  em_andamento: 'Em andamento',
  concluido: 'Concluído',
  cancelado: 'Cancelado',
}

async function handleCreateCategory(data: PlanningCategoryFormData) {
  await createCategory(data)
}

async function handleUpdateCategory(id: string, data: Partial<PlanningCategoryFormData>) {
  await updateCategory(id, data)
}

async function handleDeleteCategory(id: string) {
  await deleteCategory(id)
}

async function handleCreateEntry(data: Parameters<typeof createEntry>[0]) {
  entryError.value = null
  const { error: err } = await createEntry(data)
  if (err) entryError.value = err
}

async function handleUpdateEntry(id: string, data: Parameters<typeof updateEntry>[1]) {
  entryError.value = null
  const { error: err } = await updateEntry(id, data)
  if (err) entryError.value = err
}

async function handleDeleteEntry(id: string) {
  await deleteEntry(id)
}

async function handleCreateInstallment(data: Parameters<typeof createInstallment>[0]) {
  await createInstallment(data)
  isInstallmentModalOpen.value = false
}

async function handleMarkInstallmentPaid(id: string, paid: boolean) {
  await markInstallmentPaid(id, paid)
}

async function handleDeleteInstallment(id: string) {
  await deleteInstallment(id)
}

function openSavingModal(saving?: PlanningSaving | null) {
  editingSaving.value = saving ?? null
  isSavingModalOpen.value = true
  savingError.value = null
}

function closeSavingModal() {
  isSavingModalOpen.value = false
  editingSaving.value = null
  savingError.value = null
}

async function handleSubmitSaving(data: SavingFormData) {
  savingError.value = null
  if (editingSaving.value) {
    const { error: err } = await updateSaving(editingSaving.value.id, data)
    if (err) savingError.value = err
    else closeSavingModal()
  } else {
    const { error: err } = await createSaving(data)
    if (err) savingError.value = err
    else closeSavingModal()
  }
}

async function handleDeleteSaving(id: string) {
  await deleteSaving(id)
  if (editingSaving.value?.id === id) closeSavingModal()
}
</script>

<template>
  <div id="planejamento-detail-page" class="flex flex-col gap-6 w-full max-w-[1200px] mx-auto">
    <div v-if="notFound" class="rounded-xl border border-default bg-surface-elevated p-12 text-center">
      <p class="text-body-md text-content-subtle mb-4">
        Planejamento não encontrado.
      </p>
      <NuxtLink to="/planejamentos" class="btn btn-primary !w-auto">
        Voltar aos planejamentos
      </NuxtLink>
    </div>

    <template v-else>
      <header class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <NuxtLink
            to="/planejamentos"
            class="inline-flex items-center gap-1 text-body-sm text-content-subtle hover:text-content-main mb-2"
          >
            <span class="material-symbols-outlined text-lg">arrow_back</span>
            Planejamentos
          </NuxtLink>
          <h1 class="text-heading-lg text-content-main">
            {{ planning?.name ?? 'Carregando...' }}
          </h1>
          <div v-if="planning" class="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1 text-body-sm text-content-subtle">
            <span>{{ statusLabel[planning.status ?? ''] ?? planning.status ?? '—' }}</span>
            <span v-if="planning.date_start || planning.date_end">
              {{ formatDate(planning.date_start) }}
              <template v-if="planning.date_end"> – {{ formatDate(planning.date_end) }}</template>
            </span>
          </div>
        </div>
      </header>

      <div v-if="error" class="text-body-sm text-error">
        {{ error }}
      </div>

      <nav class="flex flex-wrap gap-2 border-b border-default pb-2">
        <button
          type="button"
          class="px-4 py-2 rounded-full text-body-sm font-medium transition-colors"
          :class="activeTab === 'dashboard' ? 'bg-primary text-white' : 'bg-surface-elevated text-content-subtle hover:bg-surface-overlay'"
          @click="activeTab = 'dashboard'"
        >
          Resumo
        </button>
        <button
          type="button"
          class="px-4 py-2 rounded-full text-body-sm font-medium transition-colors"
          :class="activeTab === 'categorias' ? 'bg-primary text-white' : 'bg-surface-elevated text-content-subtle hover:bg-surface-overlay'"
          @click="activeTab = 'categorias'"
        >
          Categorias
        </button>
        <button
          type="button"
          class="px-4 py-2 rounded-full text-body-sm font-medium transition-colors"
          :class="activeTab === 'lancamentos' ? 'bg-primary text-white' : 'bg-surface-elevated text-content-subtle hover:bg-surface-overlay'"
          @click="activeTab = 'lancamentos'"
        >
          Lançamentos
        </button>
        <button
          type="button"
          class="px-4 py-2 rounded-full text-body-sm font-medium transition-colors"
          :class="activeTab === 'parcelas' ? 'bg-primary text-white' : 'bg-surface-elevated text-content-subtle hover:bg-surface-overlay'"
          @click="activeTab = 'parcelas'"
        >
          Parcelas
        </button>
      </nav>

      <div v-if="isLoading" class="flex justify-center py-12">
        <span class="material-symbols-outlined animate-spin text-4xl text-content-tertiary">progress_activity</span>
      </div>

      <template v-else-if="planning">
        <section v-show="activeTab === 'dashboard'" class="space-y-8">
          <PlanejamentoDashboard
            :totals-by-phase="totalsByPhase"
            :totals-by-category="totalsByCategory"
            :total-planned="totalPlanned"
            :total-actual="totalActual"
            :total-saved="totalSaved"
            :budget-total="planning.budget_total"
          />
          <div class="space-y-4">
            <div class="flex items-center justify-between">
              <h4 class="text-body-md font-medium text-content-main">
                Valor guardado
              </h4>
              <button
                type="button"
                class="btn btn-outline !w-auto text-body-sm"
                @click="openSavingModal()"
              >
                <span class="material-symbols-outlined text-lg">add</span>
                Adicionar valor guardado
              </button>
            </div>
            <p v-if="savingError" class="text-body-sm text-error">
              {{ savingError }}
            </p>
            <div
              v-if="savings.length === 0"
              class="rounded-xl border border-default bg-surface-elevated p-6 text-center text-body-sm text-content-subtle"
            >
              Nenhum valor guardado registrado. Adicione aportes que você está reservando para este objetivo.
            </div>
            <ul v-else class="rounded-xl border border-default bg-surface-elevated divide-y divide-default">
              <li
                v-for="s in savings"
                :key="s.id"
                class="flex flex-wrap items-center justify-between gap-3 px-4 py-3"
              >
                <div class="flex-1 min-w-0">
                  <span class="font-medium text-content-main">{{ formatCurrency(Number(s.amount)) }}</span>
                  <span class="text-body-sm text-content-subtle ml-2">{{ formatDate(s.saved_at) }}</span>
                  <p v-if="s.description" class="text-body-sm text-content-subtle mt-0.5 truncate">
                    {{ s.description }}
                  </p>
                </div>
                <div class="flex items-center gap-2">
                  <button
                    type="button"
                    class="p-2 rounded-full hover:bg-surface-overlay text-content-subtle hover:text-content-main"
                    aria-label="Editar"
                    @click="openSavingModal(s)"
                  >
                    <span class="material-symbols-outlined text-lg">edit</span>
                  </button>
                  <button
                    type="button"
                    class="p-2 rounded-full hover:bg-surface-overlay text-content-subtle hover:text-error"
                    aria-label="Excluir"
                    @click="handleDeleteSaving(s.id)"
                  >
                    <span class="material-symbols-outlined text-lg">delete</span>
                  </button>
                </div>
              </li>
            </ul>
          </div>
          <div class="space-y-4">
            <p v-if="entryError" class="text-body-sm text-error">
              {{ entryError }}
            </p>
            <PlanejamentoEntryList
              :entries="entries"
              :categories="categories"
              :phase-filter="null"
              @create="handleCreateEntry"
              @update="handleUpdateEntry"
              @delete="handleDeleteEntry"
            />
          </div>
        </section>

        <section v-show="activeTab === 'categorias'">
          <PlanejamentoCategoryList
            :categories="categories"
            :is-loading="false"
            @create="handleCreateCategory"
            @update="handleUpdateCategory"
            @delete="handleDeleteCategory"
          />
        </section>

        <section v-show="activeTab === 'lancamentos'" class="space-y-4">
          <p v-if="entryError" class="text-body-sm text-error mb-2">
            {{ entryError }}
          </p>
          <div class="flex flex-wrap items-center gap-2">
            <span class="text-body-sm text-content-subtle">Filtro por fase:</span>
            <button
              type="button"
              class="px-3 py-1 rounded-full text-caption font-medium"
              :class="entryPhaseFilter === null ? 'bg-primary text-white' : 'bg-surface-elevated text-content-subtle hover:bg-surface-overlay'"
              @click="entryPhaseFilter = null"
            >
              Todas
            </button>
            <button
              type="button"
              class="px-3 py-1 rounded-full text-caption font-medium"
              :class="entryPhaseFilter === 'before' ? 'bg-primary text-white' : 'bg-surface-elevated text-content-subtle hover:bg-surface-overlay'"
              @click="entryPhaseFilter = 'before'"
            >
              Antes
            </button>
            <button
              type="button"
              class="px-3 py-1 rounded-full text-caption font-medium"
              :class="entryPhaseFilter === 'during' ? 'bg-primary text-white' : 'bg-surface-elevated text-content-subtle hover:bg-surface-overlay'"
              @click="entryPhaseFilter = 'during'"
            >
              Durante
            </button>
            <button
              type="button"
              class="px-3 py-1 rounded-full text-caption font-medium"
              :class="entryPhaseFilter === 'after' ? 'bg-primary text-white' : 'bg-surface-elevated text-content-subtle hover:bg-surface-overlay'"
              @click="entryPhaseFilter = 'after'"
            >
              Depois
            </button>
          </div>
          <PlanejamentoEntryList
            :entries="entries"
            :categories="categories"
            :phase-filter="entryPhaseFilter"
            @create="handleCreateEntry"
            @update="handleUpdateEntry"
            @delete="handleDeleteEntry"
          />
        </section>

        <section v-show="activeTab === 'parcelas'" class="space-y-4">
          <div class="flex items-center justify-between">
            <p v-if="installments.length > 0" class="text-body-sm text-content-subtle">
              Total: {{ formatCurrency(installmentsPaidTotal) }} de {{ formatCurrency(installmentsTotal) }} pagas
            </p>
            <button
              type="button"
              class="btn btn-outline !w-auto text-body-sm"
              @click="isInstallmentModalOpen = true"
            >
              <span class="material-symbols-outlined text-lg">add</span>
              Nova parcela
            </button>
          </div>
          <PlanejamentoInstallmentList
            :installments="installments"
            @mark-paid="handleMarkInstallmentPaid"
            @delete="handleDeleteInstallment"
          />
        </section>
      </template>
    </template>

    <PlanejamentoInstallmentModal
      :is-open="isInstallmentModalOpen"
      @close="isInstallmentModalOpen = false"
      @submit="handleCreateInstallment"
    />
    <PlanejamentoSavingModal
      :is-open="isSavingModalOpen"
      :editing-saving="editingSaving"
      @close="closeSavingModal"
      @submit="handleSubmitSaving"
    />
  </div>
</template>
