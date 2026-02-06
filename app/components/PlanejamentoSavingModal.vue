<script setup lang="ts">
import { ref, watch } from 'vue'
import BaseModal from './BaseModal.vue'
import AppButton from './AppButton.vue'
import AppInput from './AppInput.vue'
import AppDateInput from './AppDateInput.vue'
import type { PlanningSaving } from 'shared/types/database.types'
import type { SavingFormData } from '../composables/usePlanejamento'

const props = defineProps<{
  isOpen: boolean
  editingSaving?: PlanningSaving | null
}>()

const emit = defineEmits<{
  close: []
  submit: [data: SavingFormData]
}>()

const amount = ref(0)
const amountDisplay = ref('')
const savedAt = ref('')
const description = ref('')

watch(
  () => [props.isOpen, props.editingSaving],
  () => {
    if (props.isOpen) {
      if (props.editingSaving) {
        amount.value = Number(props.editingSaving.amount)
        amountDisplay.value = formatCurrency(amount.value)
        savedAt.value = props.editingSaving.saved_at
        description.value = props.editingSaving.description ?? ''
      } else {
        amount.value = 0
        amountDisplay.value = ''
        savedAt.value = new Date().toISOString().slice(0, 10)
        description.value = ''
      }
    }
  }
)

function formatCurrency(value: number): string {
  if (value === 0) return ''
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
}

function handleAmountInput(event: Event) {
  const input = event.target as HTMLInputElement
  const numbers = input.value.replace(/\D/g, '')
  const numValue = parseInt(numbers || '0', 10) / 100
  amount.value = numValue
  amountDisplay.value = numValue > 0 ? formatCurrency(numValue) : ''
}

function handleSubmit() {
  if (amount.value <= 0 || !savedAt.value) return
  emit('submit', {
    amount: amount.value,
    saved_at: savedAt.value,
    description: description.value.trim() || null,
  })
}

function handleClose() {
  emit('close')
}
</script>

<template>
  <BaseModal
    :is-open="isOpen"
    :title="editingSaving ? 'Editar valor guardado' : 'Adicionar valor guardado'"
    @close="handleClose"
  >
    <div class="space-y-4">
      <div>
        <label for="saving-amount" class="label-dark block mb-1">Valor (R$)</label>
        <input
          id="saving-amount"
          :value="amountDisplay"
          type="text"
          inputmode="numeric"
          placeholder="0,00"
          class="w-full px-5 py-3 bg-surface-elevated border border-default rounded-full text-content-main placeholder:text-content-subtle focus:outline-none focus:ring-2 focus:ring-primary"
          @input="handleAmountInput"
        />
      </div>
      <AppDateInput
        v-model="savedAt"
        label="Data"
        id="saving-date"
      />
      <AppInput
        v-model="description"
        label="Descrição (opcional)"
        placeholder="Ex.: Reserva da viagem"
      />
    </div>
    <template #footer>
      <div class="flex justify-end gap-3">
        <AppButton variant="secondary" @click="handleClose">Cancelar</AppButton>
        <AppButton
          variant="primary"
          :disabled="amount <= 0 || !savedAt"
          @click="handleSubmit"
        >
          {{ editingSaving ? 'Salvar' : 'Adicionar' }}
        </AppButton>
      </div>
    </template>
  </BaseModal>
</template>
