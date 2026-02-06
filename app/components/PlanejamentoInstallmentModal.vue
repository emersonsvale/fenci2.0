<script setup lang="ts">
import { ref, watch } from 'vue'
import { useCurrency } from '~/composables/useCurrency'
import BaseModal from './BaseModal.vue'
import AppButton from './AppButton.vue'
import AppInput from './AppInput.vue'
import AppDateInput from './AppDateInput.vue'
import type { InstallmentFormData } from '../composables/usePlanejamento'

const { formatCurrency } = useCurrency()

const props = defineProps<{
  isOpen: boolean
}>()

const emit = defineEmits<{
  close: []
  submit: [data: InstallmentFormData]
}>()

const description = ref('')
const installmentNumber = ref(1)
const totalInstallments = ref(1)
const amount = ref(0)
const amountDisplay = ref('')
const dueDate = ref('')

watch(
  () => props.isOpen,
  (isOpen) => {
    if (isOpen) {
      description.value = ''
      installmentNumber.value = 1
      totalInstallments.value = 1
      amount.value = 0
      amountDisplay.value = ''
      dueDate.value = new Date().toISOString().slice(0, 10)
    }
  }
)

function formatCurrencyDisplay(value: number): string {
  if (value === 0) return ''
  return formatCurrency(value)
}

function handleAmountInput(event: Event) {
  const input = event.target as HTMLInputElement
  const numbers = input.value.replace(/\D/g, '')
  const numValue = parseInt(numbers || '0', 10) / 100
  amount.value = numValue
  amountDisplay.value = numValue > 0 ? formatCurrencyDisplay(numValue) : ''
}

function handleSubmit() {
  if (amount.value <= 0 || totalInstallments.value < 1 || !dueDate.value) return
  emit('submit', {
    description: description.value.trim() || null,
    installment_number: installmentNumber.value,
    total_installments: totalInstallments.value,
    amount: amount.value,
    due_date: dueDate.value,
  })
}

function handleClose() {
  emit('close')
}
</script>

<template>
  <BaseModal
    :is-open="isOpen"
    title="Nova parcela"
    subtitle="Registre uma parcela do planejamento"
    @close="handleClose"
  >
    <div class="space-y-4">
      <AppInput
        v-model="description"
        label="Descrição (opcional)"
        placeholder="Ex.: Parcela financiamento"
      />
      <div class="grid grid-cols-2 gap-4">
        <div>
          <label for="inst-number" class="label-dark block mb-1">Número da parcela</label>
          <input
            id="inst-number"
            v-model.number="installmentNumber"
            type="number"
            min="1"
            class="w-full px-5 py-3 bg-surface-elevated border border-default rounded-full text-content-main focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
        <div>
          <label for="inst-total" class="label-dark block mb-1">Total de parcelas</label>
          <input
            id="inst-total"
            v-model.number="totalInstallments"
            type="number"
            min="1"
            class="w-full px-5 py-3 bg-surface-elevated border border-default rounded-full text-content-main focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
      </div>
      <div>
        <label for="inst-amount" class="label-dark block mb-1">Valor (R$)</label>
        <input
          id="inst-amount"
          :value="amountDisplay"
          type="text"
          inputmode="numeric"
          placeholder="0,00"
          class="w-full px-5 py-3 bg-surface-elevated border border-default rounded-full text-content-main placeholder:text-content-subtle focus:outline-none focus:ring-2 focus:ring-primary"
          @input="handleAmountInput"
        />
      </div>
      <AppDateInput
        v-model="dueDate"
        label="Vencimento"
        id="inst-due-date"
      />
    </div>
    <template #footer>
      <div class="flex justify-end gap-3">
        <AppButton variant="secondary" @click="handleClose">Cancelar</AppButton>
        <AppButton
          variant="primary"
          :disabled="amount <= 0 || totalInstallments < 1 || !dueDate"
          @click="handleSubmit"
        >
          Adicionar parcela
        </AppButton>
      </div>
    </template>
  </BaseModal>
</template>
