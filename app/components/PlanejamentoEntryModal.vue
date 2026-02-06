<script setup lang="ts">
import { ref, watch } from 'vue'
import { useCurrency } from '~/composables/useCurrency'
import BaseModal from './BaseModal.vue'
import AppButton from './AppButton.vue'
import AppInput from './AppInput.vue'
import AppDateInput from './AppDateInput.vue'
import type { PlanningCategory } from 'shared/types/database.types'
import type { PlanningEntry } from 'shared/types/database.types'
import type { EntryFormData, PlanningPhase } from '../composables/usePlanejamento'

const { formatCurrency } = useCurrency()

const props = defineProps<{
  isOpen: boolean
  categories: PlanningCategory[]
  editingEntry?: PlanningEntry | null
}>()

const emit = defineEmits<{
  close: []
  submit: [data: EntryFormData]
}>()

const PHASES: { value: PlanningPhase; label: string }[] = [
  { value: 'before', label: 'Antes' },
  { value: 'during', label: 'Durante' },
  { value: 'after', label: 'Depois' },
]

const planningCategoryId = ref('')
const phase = ref<PlanningPhase>('before')
const description = ref('')
const amountPlanned = ref(0)
const amountPlannedDisplay = ref('')
const amountActual = ref<number | null>(null)
const amountActualDisplay = ref('')
const entryDate = ref('')

watch(
  () => [props.isOpen, props.editingEntry],
  () => {
    if (props.isOpen) {
      if (props.editingEntry) {
        planningCategoryId.value = props.editingEntry.planning_category_id
        phase.value = props.editingEntry.phase as PlanningPhase
        description.value = props.editingEntry.description ?? ''
        amountPlanned.value = Number(props.editingEntry.amount_planned)
        amountPlannedDisplay.value = formatCurrencyDisplay(amountPlanned.value)
        amountActual.value = props.editingEntry.amount_actual != null ? Number(props.editingEntry.amount_actual) : null
        amountActualDisplay.value = amountActual.value != null ? formatCurrencyDisplay(amountActual.value) : ''
        entryDate.value = props.editingEntry.entry_date
      } else {
        resetForm()
      }
    }
  }
)

function resetForm() {
  planningCategoryId.value = props.categories[0]?.id ?? ''
  phase.value = 'before'
  description.value = ''
  amountPlanned.value = 0
  amountPlannedDisplay.value = ''
  amountActual.value = null
  amountActualDisplay.value = ''
  entryDate.value = new Date().toISOString().slice(0, 10)
}

function formatCurrencyDisplay(value: number): string {
  if (value === 0) return ''
  return formatCurrency(value)
}

function handlePlannedInput(event: Event) {
  const input = event.target as HTMLInputElement
  const numbers = input.value.replace(/\D/g, '')
  const numValue = parseInt(numbers || '0', 10) / 100
  amountPlanned.value = numValue
  amountPlannedDisplay.value = numValue > 0 ? formatCurrencyDisplay(numValue) : ''
}

function handleActualInput(event: Event) {
  const input = event.target as HTMLInputElement
  const numbers = input.value.replace(/\D/g, '')
  const numValue = parseInt(numbers || '0', 10) / 100
  amountActual.value = numValue > 0 ? numValue : null
  amountActualDisplay.value = numValue > 0 ? formatCurrencyDisplay(numValue) : ''
}

function handleSubmit() {
  if (!planningCategoryId.value || amountPlanned.value <= 0 || !entryDate.value) return
  emit('submit', {
    planning_category_id: planningCategoryId.value,
    phase: phase.value,
    description: description.value.trim() || null,
    amount_planned: amountPlanned.value,
    amount_actual: amountActual.value ?? undefined,
    entry_date: entryDate.value,
  })
}

function handleClose() {
  emit('close')
}
</script>

<template>
  <BaseModal
    :is-open="isOpen"
    :title="editingEntry ? 'Editar lançamento' : 'Novo lançamento'"
    @close="handleClose"
  >
    <div class="space-y-4">
      <div>
        <label for="entry-category" class="label-dark block mb-1">Categoria</label>
        <select
          id="entry-category"
          v-model="planningCategoryId"
          class="w-full px-5 py-3 bg-surface-elevated border border-default rounded-full text-content-main focus:outline-none focus:ring-2 focus:ring-primary"
        >
          <option value="">Selecione</option>
          <option v-for="c in categories" :key="c.id" :value="c.id">
            {{ c.name }}
          </option>
        </select>
      </div>
      <div>
        <label for="entry-phase" class="label-dark block mb-1">Fase</label>
        <select
          id="entry-phase"
          v-model="phase"
          class="w-full px-5 py-3 bg-surface-elevated border border-default rounded-full text-content-main focus:outline-none focus:ring-2 focus:ring-primary"
        >
          <option v-for="p in PHASES" :key="p.value" :value="p.value">
            {{ p.label }}
          </option>
        </select>
      </div>
      <AppInput
        v-model="description"
        label="Descrição (opcional)"
        placeholder="Ex.: Passagem aérea"
      />
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label for="entry-planned" class="label-dark block mb-1">Valor previsto (R$)</label>
          <input
            id="entry-planned"
            :value="amountPlannedDisplay"
            type="text"
            inputmode="numeric"
            placeholder="0,00"
            class="w-full px-5 py-3 bg-surface-elevated border border-default rounded-full text-content-main placeholder:text-content-subtle focus:outline-none focus:ring-2 focus:ring-primary"
            @input="handlePlannedInput"
          />
        </div>
        <div>
          <label for="entry-actual" class="label-dark block mb-1">Valor realizado (R$, opcional)</label>
          <input
            id="entry-actual"
            :value="amountActualDisplay"
            type="text"
            inputmode="numeric"
            placeholder="0,00"
            class="w-full px-5 py-3 bg-surface-elevated border border-default rounded-full text-content-main placeholder:text-content-subtle focus:outline-none focus:ring-2 focus:ring-primary"
            @input="handleActualInput"
          />
        </div>
      </div>
      <AppDateInput
        v-model="entryDate"
        label="Data"
        id="entry-date"
      />
    </div>
    <template #footer>
      <div class="flex justify-end gap-3">
        <AppButton variant="secondary" @click="handleClose">Cancelar</AppButton>
        <AppButton
          variant="primary"
          :disabled="!planningCategoryId || amountPlanned <= 0 || !entryDate"
          @click="handleSubmit"
        >
          {{ editingEntry ? 'Salvar' : 'Adicionar' }}
        </AppButton>
      </div>
    </template>
  </BaseModal>
</template>
