<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import type { Category, CreditCard } from '../../shared/types/database.types'
import type { LancamentoFormData } from '../composables/useLancamento'
import BaseModal from './BaseModal.vue'
import AppDateInput from './AppDateInput.vue'

/**
 * LancamentoCartaoModal - Modal para criar/editar lançamento no cartão de crédito
 */

export interface EditCartaoTransactionData {
  id: string
  creditCardId: string
  categoryId: string
  description: string
  amount: number
  transactionDate: string
  isRecurring: boolean
  isPaid: boolean
  totalInstallments: number
}

const props = defineProps<{
  isOpen: boolean
  creditCards: CreditCard[]
  categories: Category[]
  isLoading: boolean
  isSubmitting: boolean
  error: string | null
  editData?: EditCartaoTransactionData | null
  /** Cartão pré-selecionado ao abrir para novo lançamento (ex.: vindo do drawer) */
  initialCreditCardId?: string | null
  /** Data pré-preenchida para novo lançamento (ex.: primeiro dia do mês da fatura) */
  initialTransactionDate?: string | null
}>()

const emit = defineEmits<{
  close: []
  submit: [data: LancamentoFormData, createAnother: boolean, editId?: string]
  'create-category': [name: string]
  'create-card': []
}>()

const editingId = ref<string | null>(null)

const form = ref<LancamentoFormData>({
  accountId: '',
  categoryId: '',
  creditCardId: '',
  description: '',
  amount: 0,
  transactionDate: new Date().toISOString().split('T')[0],
  isRecurring: false,
  isPaid: false,
  totalInstallments: 1,
  repetitionFrequency: 'monthly',
  isFixedRecurring: false,
})

const showNewCategory = ref(false)
const newCategoryName = ref('')
const isSubscription = ref(false)

const expenseCategories = computed(() => {
  return props.categories.filter((c) => c.type === 'expense')
})

/** Resumo parcelado: quando N parcelas, mostra valor por parcela (valor digitado é sempre o total) */
const parceladoSummary = computed(() => {
  if (form.value.totalInstallments < 2 || form.value.amount <= 0) return null
  const total = form.value.amount
  const n = form.value.totalInstallments
  const porParcela = Math.round((total / n) * 100) / 100
  const ultima = Math.round((total - porParcela * (n - 1)) * 100) / 100
  if (n === 2) return `${n}x de R$ ${porParcela.toFixed(2).replace('.', ',')}`
  return `${n - 1}x de R$ ${porParcela.toFixed(2).replace('.', ',')} + última de R$ ${ultima.toFixed(2).replace('.', ',')}`
})

const displayAmount = ref('')

function handleAmountInput(event: Event) {
  const input = event.target as HTMLInputElement
  let value = input.value.replace(/\D/g, '')
  
  if (value === '') {
    displayAmount.value = ''
    form.value.amount = 0
    return
  }

  const numValue = parseInt(value, 10) / 100
  form.value.amount = numValue

  displayAmount.value = numValue.toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}

const isValid = computed(() => {
  return (
    form.value.creditCardId &&
    form.value.description.trim() &&
    form.value.amount > 0 &&
    form.value.transactionDate
  )
})

function resetForm() {
  editingId.value = null
  form.value = {
    accountId: '',
    categoryId: '',
    creditCardId: '',
    description: '',
    amount: 0,
    transactionDate: new Date().toISOString().split('T')[0],
    isRecurring: false,
    isPaid: false,
    totalInstallments: 1,
    repetitionFrequency: 'monthly',
    isFixedRecurring: false,
  }
  displayAmount.value = ''
  showNewCategory.value = false
  newCategoryName.value = ''
  isSubscription.value = false
}

function fillFormWithEditData(data: EditCartaoTransactionData) {
  editingId.value = data.id
  form.value = {
    accountId: '',
    categoryId: data.categoryId,
    creditCardId: data.creditCardId,
    description: data.description,
    amount: data.amount,
    transactionDate: data.transactionDate,
    isRecurring: data.isRecurring,
    isPaid: data.isPaid,
    totalInstallments: data.totalInstallments || 1,
    repetitionFrequency: 'monthly',
    isFixedRecurring: false,
  }
  displayAmount.value = data.amount.toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}

const isEditing = computed(() => !!editingId.value)
const modalTitle = computed(() => (isEditing.value ? 'Editar lançamento' : 'Nova saída'))
const modalSubtitle = computed(() => (isEditing.value ? 'Cartão de crédito' : 'Cartão de crédito'))

watch(() => props.isOpen, (isOpen) => {
  if (!isOpen) {
    resetForm()
  } else if (props.editData) {
    fillFormWithEditData(props.editData)
  } else if (props.initialCreditCardId) {
    form.value.creditCardId = props.initialCreditCardId
    if (props.initialTransactionDate) {
      form.value.transactionDate = props.initialTransactionDate
    }
  }
})

watch(() => props.editData, (newEditData) => {
  if (props.isOpen && newEditData) {
    fillFormWithEditData(newEditData)
  }
}, { immediate: true })

function handleSubmit(createAnother: boolean = false) {
  if (!isValid.value) return
  const payload: LancamentoFormData = {
    ...form.value,
    isFixedRecurring: isSubscription.value,
    isRecurring: form.value.totalInstallments > 1,
    amountIsTotal: form.value.totalInstallments > 1,
  }
  emit('submit', payload, createAnother, editingId.value ?? undefined)

  if (createAnother) {
    const creditCardId = form.value.creditCardId
    const categoryId = form.value.categoryId
    resetForm()
    form.value.creditCardId = creditCardId
    form.value.categoryId = categoryId
    isSubscription.value = false
  }
}

function handleCreateCategory() {
  if (newCategoryName.value.trim()) {
    emit('create-category', newCategoryName.value.trim())
    newCategoryName.value = ''
    showNewCategory.value = false
  }
}

const MAX_INSTALLMENTS = 999

function incrementInstallments() {
  if (form.value.totalInstallments < MAX_INSTALLMENTS) form.value.totalInstallments++
}

function decrementInstallments() {
  if (form.value.totalInstallments > 1) form.value.totalInstallments--
}

function applyInstallmentsInput() {
  const n = Math.round(Number(form.value.totalInstallments))
  if (Number.isNaN(n) || n < 1) form.value.totalInstallments = 1
  else if (n > MAX_INSTALLMENTS) form.value.totalInstallments = MAX_INSTALLMENTS
  else form.value.totalInstallments = n
}
</script>

<template>
  <BaseModal :is-open="isOpen" :title="modalTitle" :subtitle="modalSubtitle" @close="emit('close')">
    <form id="lancamento-cartao-form" class="space-y-5" @submit.prevent="handleSubmit(false)">
      <!-- Cartão e Categoria -->
      <div class="grid grid-cols-2 gap-4">
        <!-- Cartão -->
        <div>
          <label class="label-dark">Cartão</label>
          <select
            v-model="form.creditCardId"
            class="w-full px-5 py-3 rounded-full bg-surface-elevated border border-default text-content-main text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent appearance-none cursor-pointer"
            :disabled="isLoading"
          >
            <option value="" class="bg-surface-elevated">Selecione</option>
            <option v-for="card in creditCards" :key="card.id" :value="card.id" class="bg-surface-elevated">
              {{ card.name }} {{ card.last_digits ? `•••• ${card.last_digits}` : '' }}
            </option>
          </select>
          <button type="button" class="mt-1.5 text-xs text-primary hover:underline" @click="emit('create-card')">
            + Criar novo cartão
          </button>
        </div>

        <!-- Categoria -->
        <div>
          <label class="label-dark">Categoria</label>
          <select
            v-model="form.categoryId"
            class="w-full px-5 py-3 rounded-full bg-surface-elevated border border-default text-content-main text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent appearance-none cursor-pointer"
            :disabled="isLoading"
          >
            <option value="" class="bg-surface-elevated">Selecione</option>
            <option v-for="category in expenseCategories" :key="category.id" :value="category.id" class="bg-surface-elevated">
              {{ category.name }}
            </option>
          </select>
          <button
            v-if="!showNewCategory"
            type="button"
            class="mt-1.5 text-xs text-primary hover:underline"
            @click="showNewCategory = true"
          >
            + Criar nova categoria
          </button>
          <div v-else class="mt-2 flex gap-2">
            <input
              v-model="newCategoryName"
              type="text"
              placeholder="Nome da categoria"
              class="flex-1 px-4 py-2 rounded-full bg-surface-elevated border border-default text-content-main text-xs focus:outline-none focus:ring-2 focus:ring-primary"
              @keyup.enter="handleCreateCategory"
            />
            <button
              type="button"
              class="px-4 py-2 rounded-full bg-primary text-white text-xs font-medium"
              @click="handleCreateCategory"
            >
              OK
            </button>
          </div>
        </div>
      </div>

      <!-- Descrição e Valor -->
      <div class="grid grid-cols-2 gap-4">
        <!-- Descrição -->
        <div>
          <label class="label-dark flex items-center gap-1">
            Sobre
            <span class="material-symbols-outlined text-xs cursor-help" title="Descreva o lançamento">info</span>
          </label>
          <input
            v-model="form.description"
            type="text"
            placeholder="Descreva seu lançamento"
            class="w-full px-5 py-3 rounded-full bg-surface-elevated border border-default text-content-main text-sm placeholder:text-content-subtle focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
          />
        </div>

        <!-- Valor -->
        <div>
          <label class="label-dark flex items-center gap-1">
            {{ form.totalInstallments > 1 ? 'Valor total' : 'Valor' }}
            <span class="material-symbols-outlined text-xs cursor-help" :title="form.totalInstallments > 1 ? 'Valor total a ser dividido nas parcelas' : 'Valor do lançamento'">info</span>
          </label>
          <div class="relative">
            <span class="absolute left-5 top-1/2 -translate-y-1/2 text-content-subtle text-sm">R$</span>
            <input
              :value="displayAmount"
              type="text"
              inputmode="numeric"
              placeholder="0,00"
              class="w-full pl-12 pr-5 py-3 rounded-full bg-surface-elevated border-2 border-primary text-content-main text-sm placeholder:text-content-subtle focus:outline-none focus:ring-2 focus:ring-primary"
              @input="handleAmountInput"
            />
          </div>
        </div>
      </div>

      <!-- Data da compra e Assinatura/Recorrente -->
      <div class="grid grid-cols-2 gap-4">
        <!-- Data da compra -->
        <div>
          <label class="label-dark flex items-center gap-1">
            Data da compra
            <span class="material-symbols-outlined text-xs cursor-help" title="Data em que a compra foi realizada">info</span>
          </label>
          <AppDateInput
            v-model="form.transactionDate"
            input-class="w-full px-5 py-3 rounded-full bg-surface-elevated border border-default text-content-main text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
          />
        </div>

        <!-- Assinatura/Recorrente -->
        <div>
          <label class="label-dark flex items-center gap-1">
            Assinatura/Recorrente
            <span class="material-symbols-outlined text-xs cursor-help" title="Marque se for uma assinatura mensal">info</span>
          </label>
          <div 
            class="p-3 rounded-2xl bg-surface-elevated border border-default cursor-pointer"
            @click="isSubscription = !isSubscription"
          >
            <div class="flex items-start gap-3">
              <div
                class="relative w-10 h-6 rounded-full transition-colors duration-200 flex-shrink-0 mt-0.5"
                :class="isSubscription ? 'bg-primary' : 'bg-border-dark'"
              >
                <span
                  class="absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-transform duration-200"
                  :class="isSubscription ? 'translate-x-5' : 'translate-x-1'"
                />
              </div>
              <div class="flex-1 min-w-0">
                <span class="text-xs text-content-main">Este lançamento é uma assinatura/recorrente</span>
                <p class="text-xs text-content-subtle mt-0.5">
                  Todo mês será gerado uma cobrança recorrente
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Parcelas -->
      <div>
        <label class="label-dark flex items-center gap-1">
          Parcelas
          <span class="material-symbols-outlined text-xs cursor-help" title="1 = à vista; 2 ou mais = valor total dividido nas parcelas (mensal)">info</span>
        </label>
        <div class="flex items-center gap-3">
          <button
            type="button"
            class="w-10 h-10 rounded-full bg-surface-elevated border border-default text-content-main flex items-center justify-center hover:bg-surface-overlay transition-colors disabled:opacity-50"
            :disabled="form.totalInstallments <= 1"
            @click="decrementInstallments"
          >
            <span class="material-symbols-outlined">remove</span>
          </button>
          <input
            v-model.number="form.totalInstallments"
            type="number"
            min="1"
            :max="MAX_INSTALLMENTS"
            class="w-14 text-center text-lg font-semibold text-content-main bg-surface-elevated border border-default rounded-full py-2 focus:outline-none focus:ring-2 focus:ring-primary [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            @blur="applyInstallmentsInput"
          />
          <button
            type="button"
            class="w-10 h-10 rounded-full bg-surface-elevated border border-default text-content-main flex items-center justify-center hover:bg-surface-overlay transition-colors disabled:opacity-50"
            :disabled="form.totalInstallments >= MAX_INSTALLMENTS"
            @click="incrementInstallments"
          >
            <span class="material-symbols-outlined">add</span>
          </button>
          <span class="text-sm text-content-subtle">
            {{ form.totalInstallments === 1 ? 'À vista' : `${form.totalInstallments}x (valor total ÷ ${form.totalInstallments})` }}
          </span>
        </div>
        <p v-if="form.totalInstallments >= 2 && form.amount > 0 && parceladoSummary" class="text-xs text-content-subtle mt-1.5">
          {{ parceladoSummary }}
        </p>
      </div>

      <!-- Erro -->
      <p v-if="error" class="text-sm text-error">{{ error }}</p>
    </form>

    <template #footer>
      <div class="flex items-center justify-end gap-3">
        <button
          type="button"
          class="px-5 py-3 text-primary font-medium text-sm hover:underline disabled:opacity-50"
          :disabled="isSubmitting || !isValid"
          @click="handleSubmit(true)"
        >
          Salvar e criar nova
        </button>
        <button
          type="submit"
          form="lancamento-cartao-form"
          class="px-8 py-3 rounded-full bg-primary text-white font-semibold text-sm hover:brightness-110 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          :disabled="isSubmitting || !isValid"
        >
          {{ isSubmitting ? 'Salvando...' : 'Salvar' }}
        </button>
      </div>
    </template>
  </BaseModal>
</template>
