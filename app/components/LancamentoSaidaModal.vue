<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import type { Account, Category } from '../../shared/types/database.types'
import type { LancamentoFormData } from '../composables/useLancamento'
import { REPETITION_FREQUENCIES, type RepetitionFrequency } from '../../shared/constants/repetition'
import BaseModal from './BaseModal.vue'
import AppDateInput from './AppDateInput.vue'

/**
 * LancamentoSaidaModal - Modal para criar/editar saída (despesa)
 */

export interface EditTransactionData {
  id: string
  accountId: string
  categoryId: string
  description: string
  amount: number
  transactionDate: string
  isRecurring: boolean
  isPaid: boolean
  totalInstallments: number
  tags?: string[]
}

const props = withDefaults(
  defineProps<{
    isOpen: boolean
    accounts: Account[]
    categories: Category[]
    existingTags?: string[]
    isLoading: boolean
    isSubmitting: boolean
    error: string | null
    editData?: EditTransactionData | null
  }>(),
  { existingTags: () => [] }
)

const emit = defineEmits<{
  close: []
  submit: [data: LancamentoFormData, createAnother: boolean, editId?: string]
  'create-account': [name: string]
  'create-category': [name: string]
}>()

const editingId = ref<string | null>(null)

const form = ref<LancamentoFormData>({
  accountId: '',
  categoryId: '',
  description: '',
  amount: 0,
  transactionDate: new Date().toISOString().split('T')[0],
  isRecurring: false,
  isPaid: true,
  totalInstallments: 2,
  repetitionFrequency: 'monthly',
  tags: [],
})

const isEditing = computed(() => !!editingId.value)
const modalTitle = computed(() => isEditing.value ? 'Editar saída' : 'Nova saída')

const showNewAccount = ref(false)
const showNewCategory = ref(false)
const newAccountName = ref('')
const newCategoryName = ref('')
const isFixedRecurring = ref(false)
const tagInput = ref('')
const tagSuggestionsOpen = ref(false)
const tagSelectedIndex = ref(0)
/** Ref dedicado ao toggle "Marcar como pago" para garantir que o valor no submit seja o exibido (evita parcelas criadas como não pagas) */
const markAsPaid = ref(true)

const expenseCategories = computed(() => {
  return props.categories.filter((c) => c.type === 'expense')
})

// Sugestões de tags (autocomplete): tags já usadas que batem com o input e ainda não foram adicionadas
const tagSuggestions = computed(() => {
  const query = tagInput.value.trim().toLowerCase()
  if (!query) return []
  const current = (form.value.tags || []).map((t) => t.toLowerCase())
  return props.existingTags
    .filter((tag) => tag.toLowerCase().includes(query) && !current.includes(tag.toLowerCase()))
    .slice(0, 10)
})

const showTagDropdown = computed(() => tagSuggestionsOpen.value && tagSuggestions.value.length > 0)

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
    form.value.accountId &&
    form.value.description.trim() &&
    form.value.amount > 0 &&
    form.value.transactionDate
  )
})

function resetForm() {
  form.value = {
    accountId: '',
    categoryId: '',
    description: '',
    amount: 0,
    transactionDate: new Date().toISOString().split('T')[0],
    isRecurring: false,
    isPaid: true,
    totalInstallments: 2,
    repetitionFrequency: 'monthly',
    tags: [],
  }
  displayAmount.value = ''
  tagInput.value = ''
  tagSuggestionsOpen.value = false
  markAsPaid.value = true
  showNewAccount.value = false
  showNewCategory.value = false
  newAccountName.value = ''
  newCategoryName.value = ''
  isFixedRecurring.value = false
  editingId.value = null
}

function fillFormWithEditData(data: EditTransactionData) {
  editingId.value = data.id
  form.value = {
    accountId: data.accountId,
    categoryId: data.categoryId,
    description: data.description,
    amount: data.amount,
    transactionDate: data.transactionDate,
    isRecurring: data.isRecurring,
    isPaid: data.isPaid,
    totalInstallments: data.totalInstallments || 2,
    repetitionFrequency: 'monthly',
    tags: data.tags ? [...data.tags] : [],
  }
  tagInput.value = ''
  markAsPaid.value = data.isPaid
  isFixedRecurring.value = data.isRecurring
  displayAmount.value = data.amount.toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}

watch(() => props.isOpen, (isOpen) => {
  if (!isOpen) {
    resetForm()
  } else if (props.editData) {
    fillFormWithEditData(props.editData)
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
    isPaid: markAsPaid.value,
    isFixedRecurring: isFixedRecurring.value,
  }
  emit('submit', payload, createAnother, editingId.value || undefined)
  
  if (createAnother && !isEditing.value) {
    const accountId = form.value.accountId
    const categoryId = form.value.categoryId
    const tags = form.value.tags ? [...form.value.tags] : []
    resetForm()
    form.value.accountId = accountId
    form.value.categoryId = categoryId
    form.value.tags = tags
  }
}

function handleCreateAccount() {
  if (newAccountName.value.trim()) {
    emit('create-account', newAccountName.value.trim())
    newAccountName.value = ''
    showNewAccount.value = false
  }
}

function handleCreateCategory() {
  if (newCategoryName.value.trim()) {
    emit('create-category', newCategoryName.value.trim())
    newCategoryName.value = ''
    showNewCategory.value = false
  }
}

function ensureTagsArray() {
  if (!Array.isArray(form.value.tags)) form.value.tags = []
}

function addTag() {
  ensureTagsArray()
  const text = tagInput.value.trim().replace(/,/g, '')
  if (!text) return
  const normalized = text.toLowerCase()
  if (form.value.tags!.some((t) => t.toLowerCase() === normalized)) return
  form.value.tags!.push(text)
  tagInput.value = ''
  tagSuggestionsOpen.value = false
}

function addTagFromSuggestion(tag: string) {
  ensureTagsArray()
  const normalized = tag.toLowerCase()
  if (form.value.tags!.some((t) => t.toLowerCase() === normalized)) return
  form.value.tags!.push(tag)
  tagInput.value = ''
  tagSuggestionsOpen.value = false
}

function removeTag(index: number) {
  ensureTagsArray()
  form.value.tags!.splice(index, 1)
}

function onTagInputKeydown(event: KeyboardEvent) {
  const suggestions = tagSuggestions.value
  if (event.key === 'ArrowDown') {
    event.preventDefault()
    tagSuggestionsOpen.value = true
    tagSelectedIndex.value = Math.min(tagSelectedIndex.value + 1, suggestions.length - 1)
    return
  }
  if (event.key === 'ArrowUp') {
    event.preventDefault()
    tagSuggestionsOpen.value = true
    tagSelectedIndex.value = Math.max(tagSelectedIndex.value - 1, 0)
    return
  }
  if (event.key === 'Enter' || event.key === ',') {
    event.preventDefault()
    const idx = Math.min(tagSelectedIndex.value, suggestions.length - 1)
    if (showTagDropdown.value && idx >= 0 && suggestions[idx]) {
      addTagFromSuggestion(suggestions[idx])
    } else {
      addTag()
    }
    return
  }
  if (event.key === 'Escape') {
    tagSuggestionsOpen.value = false
  }
}

function onTagInputInput() {
  tagSuggestionsOpen.value = true
  tagSelectedIndex.value = 0
}

function onTagSuggestionMousedown(event: MouseEvent, tag: string) {
  event.preventDefault()
  addTagFromSuggestion(tag)
}

const MAX_INSTALLMENTS = 999

function incrementInstallments() {
  if (form.value.totalInstallments < MAX_INSTALLMENTS) form.value.totalInstallments++
}

function decrementInstallments() {
  if (form.value.totalInstallments > 2) form.value.totalInstallments--
}

function applyInstallmentsInput() {
  const n = Math.round(Number(form.value.totalInstallments))
  if (Number.isNaN(n) || n < 2) form.value.totalInstallments = 2
  else if (n > MAX_INSTALLMENTS) form.value.totalInstallments = MAX_INSTALLMENTS
  else form.value.totalInstallments = n
}
</script>

<template>
  <BaseModal :is-open="isOpen" :title="modalTitle" @close="emit('close')">
    <form id="lancamento-saida-form" class="space-y-5" @submit.prevent="handleSubmit(false)">
      <!-- Conta e Categoria -->
      <div class="grid grid-cols-2 gap-4">
        <!-- Conta -->
        <div>
          <label class="label-dark">Conta</label>
          <select
            v-model="form.accountId"
            class="w-full px-5 py-3 rounded-full bg-surface-elevated border border-default text-content-main text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent appearance-none cursor-pointer"
            :disabled="isLoading"
          >
            <option value="" class="bg-surface-elevated">Selecione</option>
            <option v-for="account in accounts" :key="account.id" :value="account.id" class="bg-surface-elevated">
              {{ account.name }}
            </option>
          </select>
          <button
            v-if="!showNewAccount"
            type="button"
            class="mt-1.5 text-xs text-primary hover:underline"
            @click="showNewAccount = true"
          >
            + Criar nova conta
          </button>
          <div v-else class="mt-2 flex gap-2">
            <input
              v-model="newAccountName"
              type="text"
              placeholder="Nome da conta"
              class="flex-1 px-4 py-2 rounded-full bg-surface-elevated border border-default text-content-main text-xs focus:outline-none focus:ring-2 focus:ring-primary"
              @keyup.enter="handleCreateAccount"
            />
            <button
              type="button"
              class="px-4 py-2 rounded-full bg-primary text-white text-xs font-medium"
              @click="handleCreateAccount"
            >
              OK
            </button>
          </div>
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
            Valor
            <span class="material-symbols-outlined text-xs cursor-help" title="Valor do lançamento">info</span>
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

      <!-- Tags -->
      <div class="relative">
        <label class="label-dark flex items-center gap-1">
          Tags
          <span class="material-symbols-outlined text-xs cursor-help" title="Adicione tags para organizar (ex: viagem, reembolso)">info</span>
        </label>
        <div class="flex flex-wrap gap-2 p-3 rounded-2xl bg-surface-elevated border border-default min-h-[52px]">
          <template v-for="(tag, index) in (form.tags || [])" :key="`tag-${index}-${tag}`">
            <span
              class="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-primary/15 text-primary text-xs font-medium"
            >
              {{ tag }}
              <button
                type="button"
                class="p-0.5 rounded-full hover:bg-primary/25 transition-colors"
                aria-label="Remover tag"
                @click="removeTag(index)"
              >
                <span class="material-symbols-outlined text-sm">close</span>
              </button>
            </span>
          </template>
          <input
            v-model="tagInput"
            type="text"
            placeholder="Digite e pressione Enter para adicionar"
            class="flex-1 min-w-[180px] px-2 py-1.5 bg-transparent text-content-main text-sm placeholder:text-content-subtle focus:outline-none border-0"
            autocomplete="off"
            @keydown="onTagInputKeydown"
            @input="onTagInputInput"
            @blur="addTag"
          />
        </div>
        <!-- Autocomplete: tags já usadas em outros lançamentos -->
        <div
          v-if="showTagDropdown"
          class="absolute left-0 right-0 top-full z-10 mt-1 max-h-48 overflow-auto rounded-xl border border-default bg-surface-elevated shadow-lg"
        >
          <button
            v-for="(tag, i) in tagSuggestions"
            :key="tag"
            type="button"
            class="block w-full px-4 py-2.5 text-left text-sm text-content-main hover:bg-surface-overlay transition-colors first:rounded-t-xl last:rounded-b-xl"
            :class="{ 'bg-primary/15 text-primary': i === tagSelectedIndex }"
            @mousedown.prevent="onTagSuggestionMousedown($event, tag)"
          >
            {{ tag }}
          </button>
        </div>
      </div>

      <!-- Data e Recorrente (fixa) -->
      <div class="grid grid-cols-2 gap-4">
        <!-- Data -->
        <div>
          <label class="label-dark flex items-center gap-1">
            Data
            <span class="material-symbols-outlined text-xs cursor-help" title="Data do vencimento">info</span>
          </label>
          <AppDateInput
            v-model="form.transactionDate"
            input-class="w-full px-5 py-3 rounded-full bg-surface-elevated border border-default text-content-main text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
          />
          <p class="mt-1 text-xs text-content-subtle">Dia do vencimento da cobrança</p>
        </div>

        <!-- Recorrente (fixa) -->
        <div>
          <label class="label-dark flex items-center gap-1">
            Recorrente (fixa)
            <span class="material-symbols-outlined text-xs cursor-help" title="Cobrança fixa mensal">info</span>
          </label>
          <div 
            class="p-3 rounded-2xl bg-surface-elevated border border-default cursor-pointer"
            @click="isFixedRecurring = !isFixedRecurring"
          >
            <div class="flex items-start gap-3">
              <div
                class="relative w-10 h-6 rounded-full transition-colors duration-200 flex-shrink-0 mt-0.5"
                :class="isFixedRecurring ? 'bg-primary' : 'bg-surface-overlay'"
              >
                <span
                  class="absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-transform duration-200"
                  :class="isFixedRecurring ? 'translate-x-5' : 'translate-x-1'"
                />
              </div>
              <div class="flex-1 min-w-0">
                <span class="text-xs text-content-main">Esta lançamento é uma cobrança fixa recorrente</span>
                <p class="text-xs text-content-subtle mt-0.5">
                  Todo mês no dia {{ new Date(form.transactionDate).getDate() || '[X]' }}, será gerado uma cobrança
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Repetir e Quantidade -->
      <div class="grid grid-cols-2 gap-4 items-start">
        <!-- Repetir -->
        <div>
          <label class="flex items-center gap-3 cursor-pointer" @click="form.isRecurring = !form.isRecurring">
            <div
              class="relative w-12 h-7 rounded-full transition-colors duration-200"
              :class="form.isRecurring ? 'bg-primary' : 'bg-surface-overlay'"
            >
              <span
                class="absolute top-1 w-5 h-5 rounded-full bg-white shadow transition-transform duration-200"
                :class="form.isRecurring ? 'translate-x-6' : 'translate-x-1'"
              />
            </div>
            <span class="text-sm text-content-main">Repetir lançamento</span>
          </label>
        </div>

        <!-- Frequência e quantidade (quando repetir ativo) -->
        <div v-if="form.isRecurring" class="space-y-3">
          <div>
            <label class="label-dark">Repetir</label>
            <div class="flex flex-wrap gap-2 mt-1">
              <button
                v-for="freq in REPETITION_FREQUENCIES"
                :key="freq.value"
                type="button"
                class="px-3 py-1.5 rounded-full text-sm font-medium transition-colors"
                :class="(form.repetitionFrequency ?? 'monthly') === freq.value
                  ? 'bg-primary text-white'
                  : 'bg-surface-elevated border border-default text-content-main hover:bg-surface-overlay'"
                @click="form.repetitionFrequency = freq.value as RepetitionFrequency"
              >
                {{ freq.label }}
              </button>
            </div>
          </div>
          <div>
            <label class="label-dark">Quantidade</label>
            <div class="flex items-center gap-3">
              <button
                type="button"
                class="w-10 h-10 rounded-full bg-surface-elevated border border-default text-content-main flex items-center justify-center hover:bg-surface-overlay transition-colors"
                @click="decrementInstallments"
              >
                <span class="material-symbols-outlined">remove</span>
              </button>
              <input
                v-model.number="form.totalInstallments"
                type="number"
                min="2"
                :max="MAX_INSTALLMENTS"
                class="w-14 text-center text-lg font-semibold text-content-main bg-surface-elevated border border-default rounded-full py-2 focus:outline-none focus:ring-2 focus:ring-primary [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                @blur="applyInstallmentsInput"
              />
              <button
                type="button"
                class="w-10 h-10 rounded-full bg-surface-elevated border border-default text-content-main flex items-center justify-center hover:bg-surface-overlay transition-colors"
                @click="incrementInstallments"
              >
                <span class="material-symbols-outlined">add</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Marcar como pago -->
      <div>
        <label class="flex items-center gap-3 cursor-pointer" @click="markAsPaid = !markAsPaid">
          <div
            class="relative w-12 h-7 rounded-full transition-colors duration-200"
            :class="markAsPaid ? 'bg-primary' : 'bg-surface-overlay'"
          >
            <span
              class="absolute top-1 w-5 h-5 rounded-full bg-white shadow transition-transform duration-200"
              :class="markAsPaid ? 'translate-x-6' : 'translate-x-1'"
            />
          </div>
          <span class="text-sm text-content-main">Marcar como pago</span>
        </label>
      </div>

      <!-- Erro -->
      <p v-if="error" class="text-sm text-error">{{ error }}</p>
    </form>

    <template #footer>
      <div class="flex items-center justify-end gap-3">
        <button
          v-if="!isEditing"
          type="button"
          class="px-5 py-3 text-primary font-medium text-sm hover:underline disabled:opacity-50"
          :disabled="isSubmitting || !isValid"
          @click="handleSubmit(true)"
        >
          Salvar e criar nova
        </button>
        <button
          type="submit"
          form="lancamento-saida-form"
          class="px-8 py-3 rounded-full bg-primary text-white font-semibold text-sm hover:brightness-110 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          :disabled="isSubmitting || !isValid"
        >
          {{ isSubmitting ? 'Salvando...' : (isEditing ? 'Atualizar' : 'Salvar') }}
        </button>
      </div>
    </template>
  </BaseModal>
</template>
