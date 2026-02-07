<script setup lang="ts">
import { ref, watch } from 'vue'
import type { Account } from 'shared/types/database.types'
import BaseModal from './BaseModal.vue'
import AppDateInput from './AppDateInput.vue'

const props = defineProps<{
  isOpen: boolean
  accounts: Account[]
  initialAmount: number
  creditCardId: string
  invoiceId?: string
  referenceMonth?: string
  /** Data de vencimento da fatura (YYYY-MM-DD); usada como padrão no campo "Data do pagamento" */
  dueDate?: string
  error: string | null
  isSubmitting: boolean
}>()

const emit = defineEmits<{
  close: []
  submit: [payload: { accountId: string; amount: number; paymentDate: string }]
}>()

const accountId = ref('')
const amountDisplay = ref('')
const amount = ref(0)
const paymentDate = ref('')

function formatAmount(value: number) {
  return value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function handleAmountInput(event: Event) {
  const input = event.target as HTMLInputElement
  let value = input.value.replace(/\D/g, '')
  if (value === '') {
    amountDisplay.value = ''
    amount.value = 0
    return
  }
  const numValue = parseInt(value, 10) / 100
  amount.value = numValue
  amountDisplay.value = formatAmount(numValue)
}

const submitBlockReason = ref<string | null>(null)

function submit() {
  submitBlockReason.value = null
  if (!accountId.value) {
    submitBlockReason.value = 'Selecione uma conta para continuar.'
    console.warn('[PayInvoiceModal] Submit bloqueado: nenhuma conta selecionada')
    return
  }
  if (amount.value <= 0) {
    submitBlockReason.value = 'Informe o valor do pagamento.'
    console.warn('[PayInvoiceModal] Submit bloqueado: valor inválido', amount.value)
    return
  }
  if (!paymentDate.value) {
    submitBlockReason.value = 'Informe a data do pagamento.'
    console.warn('[PayInvoiceModal] Submit bloqueado: data não preenchida')
    return
  }
  console.log('[PayInvoiceModal] Enviando submit:', { accountId: accountId.value, amount: amount.value, paymentDate: paymentDate.value })
  emit('submit', {
    accountId: accountId.value,
    amount: amount.value,
    paymentDate: paymentDate.value,
  })
}

watch(
  () => props.isOpen,
  (open) => {
    if (open) {
      submitBlockReason.value = null
      amount.value = props.initialAmount
      amountDisplay.value = formatAmount(props.initialAmount)
      const due = props.dueDate?.slice(0, 10)
      paymentDate.value = due || new Date().toISOString().split('T')[0]
      accountId.value = props.accounts[0]?.id ?? ''
      console.log('[PayInvoiceModal] Modal aberto. Contas:', props.accounts?.length, 'conta pré-selecionada:', accountId.value || 'nenhuma')
    }
  }
)
</script>

<template>
  <BaseModal :is-open="isOpen" title="Pagar fatura" subtitle="Registrar pagamento da fatura do cartão" @close="emit('close')">
    <form id="pay-invoice-form" class="space-y-5" @submit.prevent="submit">
      <div>
        <label class="label-dark">Conta</label>
        <select
          v-model="accountId"
          class="w-full px-5 py-3 rounded-full bg-surface-elevated border border-default text-content-main text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          :disabled="isSubmitting"
          required
        >
          <option value="">Selecione</option>
          <option v-for="acc in accounts" :key="acc.id" :value="acc.id" class="bg-surface-elevated">
            {{ acc.name }}
          </option>
        </select>
      </div>
      <div>
        <label class="label-dark">Valor (R$)</label>
        <div class="relative">
          <span class="absolute left-5 top-1/2 -translate-y-1/2 text-content-subtle text-sm">R$</span>
          <input
            :value="amountDisplay"
            type="text"
            inputmode="numeric"
            placeholder="0,00"
            class="w-full pl-12 pr-5 py-3 rounded-full bg-surface-elevated border border-default text-content-main text-sm"
            :disabled="isSubmitting"
            @input="handleAmountInput"
          />
        </div>
      </div>
      <div>
        <label class="label-dark">Data do pagamento</label>
        <AppDateInput
          v-model="paymentDate"
          input-class="w-full px-5 py-3 rounded-full bg-surface-elevated border border-default text-content-main text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          :disabled="isSubmitting"
        />
      </div>
      <p v-if="submitBlockReason" class="text-sm text-warning">{{ submitBlockReason }}</p>
      <p v-if="error" class="text-sm text-error">{{ error }}</p>
    </form>
    <template #footer>
      <div class="flex justify-end gap-3">
        <button
          type="button"
          class="px-5 py-3 text-primary font-medium text-sm hover:underline"
          :disabled="isSubmitting"
          @click="emit('close')"
        >
          Cancelar
        </button>
        <button
          type="submit"
          form="pay-invoice-form"
          class="px-8 py-3 rounded-full bg-primary text-white font-semibold text-sm disabled:opacity-50"
          :disabled="isSubmitting || !accountId || amount <= 0 || !paymentDate"
        >
          {{ isSubmitting ? 'Salvando...' : 'Pagar fatura' }}
        </button>
      </div>
    </template>
  </BaseModal>
</template>
