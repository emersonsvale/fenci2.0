<script setup lang="ts">
import { ref, watch } from 'vue'
import BaseModal from './BaseModal.vue'
import AppButton from './AppButton.vue'
import AppInput from './AppInput.vue'
import AppDateInput from './AppDateInput.vue'
import type { Planning } from 'shared/types/database.types'
import type { PlanningFormData } from '../composables/usePlanejamentos'

/**
 * PlanejamentoFormModal - Modal para criar ou editar planejamento
 */

const props = defineProps<{
  isOpen: boolean
  editingPlanning?: Planning | null
  isSubmitting: boolean
  error: string | null
}>()

const emit = defineEmits<{
  close: []
  submit: [data: PlanningFormData]
}>()

const PLANNING_TYPES = [
  { value: 'viagem', label: 'Viagem' },
  { value: 'carro', label: 'Carro' },
  { value: 'casamento', label: 'Casamento' },
  { value: 'reforma', label: 'Reforma' },
  { value: 'mudanca', label: 'Mudança' },
  { value: 'outro', label: 'Outro' },
]

const PLANNING_STATUSES = [
  { value: 'rascunho', label: 'Rascunho' },
  { value: 'em_planejamento', label: 'Em planejamento' },
  { value: 'em_andamento', label: 'Em andamento' },
  { value: 'concluido', label: 'Concluído' },
  { value: 'cancelado', label: 'Cancelado' },
]

const name = ref('')
const type = ref('')
const status = ref('rascunho')
const dateStart = ref('')
const dateEnd = ref('')
const budgetTotal = ref(0)
const budgetDisplay = ref('')
const notes = ref('')

watch(
  () => [props.isOpen, props.editingPlanning],
  () => {
    if (props.isOpen) {
      if (props.editingPlanning) {
        name.value = props.editingPlanning.name
        type.value = props.editingPlanning.type ?? ''
        status.value = props.editingPlanning.status ?? 'rascunho'
        dateStart.value = props.editingPlanning.date_start ?? ''
        dateEnd.value = props.editingPlanning.date_end ?? ''
        budgetTotal.value = props.editingPlanning.budget_total ?? 0
        budgetDisplay.value = formatCurrency(props.editingPlanning.budget_total ?? 0)
        notes.value = props.editingPlanning.notes ?? ''
      } else {
        resetForm()
      }
    }
  }
)

function resetForm() {
  name.value = ''
  type.value = ''
  status.value = 'rascunho'
  dateStart.value = ''
  dateEnd.value = ''
  budgetTotal.value = 0
  budgetDisplay.value = ''
  notes.value = ''
}

function formatCurrency(value: number): string {
  if (value === 0) return ''
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
}

function handleBudgetInput(event: Event) {
  const input = event.target as HTMLInputElement
  const numbers = input.value.replace(/\D/g, '')
  const numValue = parseInt(numbers || '0', 10) / 100
  budgetTotal.value = numValue
  budgetDisplay.value = numValue > 0 ? formatCurrency(numValue) : ''
}

function handleSubmit() {
  if (!name.value.trim()) return
  emit('submit', {
    name: name.value.trim(),
    type: type.value || null,
    status: status.value || 'rascunho',
    date_start: dateStart.value || null,
    date_end: dateEnd.value || null,
    budget_total: budgetTotal.value > 0 ? budgetTotal.value : null,
    notes: notes.value.trim() || null,
  })
}

function handleClose() {
  emit('close')
}
</script>

<template>
  <BaseModal
    :is-open="isOpen"
    :title="editingPlanning ? 'Editar planejamento' : 'Novo planejamento'"
    subtitle="Preencha os dados do planejamento"
    @close="handleClose"
  >
    <div class="space-y-4">
      <AppInput
        id="planejamento-form-name"
        v-model="name"
        label="Nome"
        placeholder="Ex.: Viagem praia 2025"
        required
      />
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label for="planejamento-form-type" class="label-dark block mb-1">Tipo</label>
          <select
            id="planejamento-form-type"
            v-model="type"
            class="w-full px-5 py-3 bg-surface-elevated border border-default rounded-full text-content-main focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="">Selecione</option>
            <option v-for="opt in PLANNING_TYPES" :key="opt.value" :value="opt.value">
              {{ opt.label }}
            </option>
          </select>
        </div>
        <div>
          <label for="planejamento-form-status" class="label-dark block mb-1">Status</label>
          <select
            id="planejamento-form-status"
            v-model="status"
            class="w-full px-5 py-3 bg-surface-elevated border border-default rounded-full text-content-main focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option v-for="opt in PLANNING_STATUSES" :key="opt.value" :value="opt.value">
              {{ opt.label }}
            </option>
          </select>
        </div>
      </div>
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label for="planejamento-form-date-start" class="label-dark block mb-1">Data início</label>
          <AppDateInput
            v-model="dateStart"
            id="planejamento-form-date-start"
            input-class="w-full px-5 py-3 bg-surface-elevated border border-default rounded-full text-content-main placeholder:text-content-subtle focus-within:ring-2 focus-within:ring-primary focus-within:border-transparent"
          />
        </div>
        <div>
          <label for="planejamento-form-date-end" class="label-dark block mb-1">Data fim</label>
          <AppDateInput
            v-model="dateEnd"
            id="planejamento-form-date-end"
            input-class="w-full px-5 py-3 bg-surface-elevated border border-default rounded-full text-content-main placeholder:text-content-subtle focus-within:ring-2 focus-within:ring-primary focus-within:border-transparent"
          />
        </div>
      </div>
      <div>
        <label for="planejamento-form-budget" class="label-dark block mb-1">Orçamento total (opcional)</label>
        <input
          id="planejamento-form-budget"
          :value="budgetDisplay"
          type="text"
          inputmode="numeric"
          placeholder="0,00"
          class="w-full px-5 py-3 bg-surface-elevated border border-default rounded-full text-content-main placeholder:text-content-subtle focus:outline-none focus:ring-2 focus:ring-primary"
          :disabled="isSubmitting"
          @input="handleBudgetInput"
        />
      </div>
      <div>
        <label for="planejamento-form-notes" class="label-dark block mb-1">Observações</label>
        <textarea
          id="planejamento-form-notes"
          v-model="notes"
          rows="3"
          placeholder="Anotações sobre o planejamento"
          class="w-full px-5 py-3 bg-surface-elevated border border-default rounded-xl text-content-main placeholder:text-content-subtle focus:outline-none focus:ring-2 focus:ring-primary resize-none"
          :disabled="isSubmitting"
        />
      </div>
    </div>
    <p v-if="error" class="text-body-sm text-error mt-2">
      {{ error }}
    </p>

    <template #footer>
      <div class="flex justify-end gap-3">
        <AppButton variant="secondary" :disabled="isSubmitting" @click="handleClose">
          Cancelar
        </AppButton>
        <AppButton
          variant="primary"
          :loading="isSubmitting"
          :disabled="!name.trim()"
          @click="handleSubmit"
        >
          {{ editingPlanning ? 'Salvar' : 'Criar planejamento' }}
        </AppButton>
      </div>
    </template>
  </BaseModal>
</template>
