<script setup lang="ts">
import { ref, watch } from 'vue'
import { useCurrency } from '~/composables/useCurrency'
import BaseModal from './BaseModal.vue'
import AppButton from './AppButton.vue'
import AppInput from './AppInput.vue'

/**
 * LimitModal - Modal para definir/editar limite mensal de gastos
 */

const { formatCurrency } = useCurrency()

const props = defineProps<{
  isOpen: boolean
  currentLimit: number
  monthLabel: string
  isLoading: boolean
  isSubmitting: boolean
  error: string | null
}>()

const emit = defineEmits<{
  close: []
  save: [amount: number]
}>()

const amount = ref(0)
const amountDisplay = ref('')

function formatCurrencyInput(value: number): string {
  if (value === 0) return ''
  return formatCurrency(value)
}

function handleAmountInput(event: Event) {
  const input = event.target as HTMLInputElement
  const numbers = input.value.replace(/\D/g, '')
  const numValue = parseInt(numbers || '0', 10) / 100
  amount.value = numValue
  amountDisplay.value = numValue > 0 ? formatCurrencyInput(numValue) : ''
}

watch(
  () => props.isOpen,
  (isOpen) => {
    if (isOpen) {
      amount.value = props.currentLimit
      amountDisplay.value = props.currentLimit > 0 ? formatCurrencyInput(props.currentLimit) : ''
    }
  }
)

function handleSubmit() {
  if (amount.value <= 0) return
  emit('save', amount.value)
}

function handleClose() {
  emit('close')
}
</script>

<template>
  <BaseModal
    :is-open="isOpen"
    title="Limite mensal"
    :subtitle="monthLabel"
    @close="handleClose"
  >
    <div class="space-y-2">
      <label for="limit-modal-amount" class="label-dark">Valor do limite (R$)</label>
      <input
        id="limit-modal-amount"
        :value="amountDisplay"
        type="text"
        inputmode="numeric"
        placeholder="0,00"
        class="w-full px-5 py-3 bg-surface-elevated border border-default rounded-full text-content-main placeholder:text-content-subtle focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
        :disabled="isSubmitting"
        @input="handleAmountInput"
      />
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
          :disabled="amount <= 0"
          @click="handleSubmit"
        >
          Salvar limite
        </AppButton>
      </div>
    </template>
  </BaseModal>
</template>
