<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import type { Account, Category } from 'shared/types/database.types'
import { useCurrency } from '~/composables/useCurrency'
import AppDateInput from './AppDateInput.vue'

/**
 * RendaModal - Modal para criar/editar rendas recorrentes
 * Segue o design system Fenci com campos organizados em grid
 */

const { formatCurrency } = useCurrency()

export interface RendaModalProps {
  isOpen: boolean
  accounts: Account[]
  categories: Category[]
  editingRenda?: {
    id: string
    provedor: string
    valor: number
    diaRecebimento: number
    accountId?: string
    categoryId?: string
    hasLimit?: boolean
    endDate?: string | null
  } | null
  isLoading?: boolean
}

const props = withDefaults(defineProps<RendaModalProps>(), {
  editingRenda: null,
  isLoading: false,
})

const emit = defineEmits<{
  close: []
  submit: [data: RendaFormData]
  'create-account': [name: string]
  'create-category': [name: string]
}>()

export interface RendaFormData {
  provedor: string
  valor: number
  diaRecebimento: number
  accountId: string
  categoryId?: string
  hasLimit: boolean
  endDate?: string
}

// Form state
const provedor = ref('')
const valor = ref(0)
const valorDisplay = ref('')
const diaRecebimento = ref(1)
const accountId = ref('')
const categoryId = ref('')
const hasLimit = ref(false)
const endDate = ref('')

// Estados para criar novo item inline
const isCreatingAccount = ref(false)
const isCreatingCategory = ref(false)
const newAccountName = ref('')
const newCategoryName = ref('')

// Computed: categorias de entrada apenas
const incomeCategories = computed(() => {
  return props.categories.filter((c) => c.type === 'income')
})

// Reset form when modal opens/closes or editing changes
watch(
  () => props.isOpen,
  (isOpen) => {
    if (isOpen) {
      if (props.editingRenda) {
        provedor.value = props.editingRenda.provedor
        valor.value = props.editingRenda.valor
        valorDisplay.value = formatCurrencyInput(props.editingRenda.valor)
        diaRecebimento.value = props.editingRenda.diaRecebimento
        accountId.value = props.editingRenda.accountId || props.accounts[0]?.id || ''
        categoryId.value = props.editingRenda.categoryId || ''
        hasLimit.value = props.editingRenda.hasLimit || false
        endDate.value = props.editingRenda.endDate || ''
      } else {
        resetForm()
      }
    }
  }
)

function resetForm() {
  provedor.value = ''
  valor.value = 0
  valorDisplay.value = ''
  diaRecebimento.value = 1
  accountId.value = props.accounts[0]?.id || ''
  categoryId.value = ''
  hasLimit.value = false
  endDate.value = ''
  isCreatingAccount.value = false
  isCreatingCategory.value = false
  newAccountName.value = ''
  newCategoryName.value = ''
}

function formatCurrencyInput(value: number): string {
  if (value === 0) return ''
  return formatCurrency(value)
}

function handleValorInput(event: Event) {
  const input = event.target as HTMLInputElement
  // Remove tudo exceto números
  const numbers = input.value.replace(/\D/g, '')
  const numValue = parseInt(numbers || '0', 10) / 100
  valor.value = numValue
  valorDisplay.value = numValue > 0 ? formatCurrencyInput(numValue) : ''
}

function handleSubmit() {
  if (!provedor.value || valor.value <= 0 || !accountId.value) return

  emit('submit', {
    provedor: provedor.value,
    valor: valor.value,
    diaRecebimento: diaRecebimento.value,
    accountId: accountId.value,
    categoryId: categoryId.value || undefined,
    hasLimit: hasLimit.value,
    endDate: hasLimit.value && endDate.value ? endDate.value : undefined,
  })
}

function handleCreateAccount() {
  if (newAccountName.value.trim()) {
    emit('create-account', newAccountName.value.trim())
    newAccountName.value = ''
    isCreatingAccount.value = false
  }
}

function handleCreateCategory() {
  if (newCategoryName.value.trim()) {
    emit('create-category', newCategoryName.value.trim())
    newCategoryName.value = ''
    isCreatingCategory.value = false
  }
}

function handleClose() {
  emit('close')
}

// Keyboard handlers para criação inline
function handleAccountKeydown(event: KeyboardEvent) {
  if (event.key === 'Enter') {
    handleCreateAccount()
  } else if (event.key === 'Escape') {
    isCreatingAccount.value = false
    newAccountName.value = ''
  }
}

function handleCategoryKeydown(event: KeyboardEvent) {
  if (event.key === 'Enter') {
    handleCreateCategory()
  } else if (event.key === 'Escape') {
    isCreatingCategory.value = false
    newCategoryName.value = ''
  }
}
</script>

<template>
  <Teleport to="body">
    <Transition
      enter-active-class="transition ease-out duration-200"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition ease-in duration-150"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div
        v-if="isOpen"
        id="renda-modal-overlay"
        class="fixed inset-0 bg-black/60 backdrop-blur-sm z-modal flex items-center justify-center p-4"
        @click.self="handleClose"
      >
        <Transition
          enter-active-class="transition ease-out duration-200"
          enter-from-class="opacity-0 scale-95"
          enter-to-class="opacity-100 scale-100"
          leave-active-class="transition ease-in duration-150"
          leave-from-class="opacity-100 scale-100"
          leave-to-class="opacity-0 scale-95"
        >
          <div
            v-if="isOpen"
            id="renda-modal-content"
            class="bg-surface-elevated rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden"
          >
            <!-- Header -->
            <div class="flex items-center justify-between px-6 py-5 border-b border-default">
              <div class="flex items-center gap-3">
                <span class="material-symbols-outlined text-content-main text-xl">north_east</span>
                <h2 class="text-xl font-semibold text-content-main">
                  {{ editingRenda ? 'Editar renda' : 'Nova renda' }}
                </h2>
              </div>
              <button
                type="button"
                class="p-2 rounded-lg hover:bg-surface-elevated-tertiary transition-colors text-content-subtle"
                @click="handleClose"
              >
                <span class="material-symbols-outlined text-xl">close</span>
              </button>
            </div>

            <!-- Body -->
            <div class="px-6 py-5 space-y-5">
              <!-- Row 1: Conta e Categoria -->
              <div class="grid grid-cols-2 gap-4">
                <!-- Conta -->
                <div>
                  <label class="label-dark">Conta</label>
                  <select
                    v-model="accountId"
                    class="w-full px-5 py-3 bg-surface-elevated border border-default rounded-full text-content-main focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent appearance-none cursor-pointer"
                    :disabled="isCreatingAccount"
                  >
                    <option value="" disabled>Selecione uma conta</option>
                    <option v-for="account in accounts" :key="account.id" :value="account.id">
                      {{ account.name }}
                    </option>
                  </select>
                  
                  <!-- Criar nova conta -->
                  <div v-if="isCreatingAccount" class="mt-2 flex gap-2">
                    <input
                      v-model="newAccountName"
                      type="text"
                      placeholder="Nome da conta"
                      class="flex-1 px-4 py-2 bg-surface-elevated border border-default rounded-full text-content-main text-sm placeholder:text-content-subtle focus:outline-none focus:ring-2 focus:ring-primary"
                      @keydown="handleAccountKeydown"
                    />
                    <button
                      type="button"
                      class="px-4 py-2 bg-primary text-white rounded-full text-sm hover:bg-primary-600"
                      @click="handleCreateAccount"
                    >
                      Criar
                    </button>
                  </div>
                  <button
                    v-else
                    type="button"
                    class="mt-2 text-sm text-primary hover:text-primary-400 transition-colors"
                    @click="isCreatingAccount = true"
                  >
                    + Criar nova conta
                  </button>
                </div>

                <!-- Categoria -->
                <div>
                  <label class="label-dark">Categoria</label>
                  <select
                    v-model="categoryId"
                    class="w-full px-5 py-3 bg-surface-elevated border border-default rounded-full text-content-main focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent appearance-none cursor-pointer"
                    :disabled="isCreatingCategory"
                  >
                    <option value="">Selecione uma categoria</option>
                    <option v-for="category in incomeCategories" :key="category.id" :value="category.id">
                      {{ category.name }}
                    </option>
                  </select>
                  
                  <!-- Criar nova categoria -->
                  <div v-if="isCreatingCategory" class="mt-2 flex gap-2">
                    <input
                      v-model="newCategoryName"
                      type="text"
                      placeholder="Nome da categoria"
                      class="flex-1 px-4 py-2 bg-surface-elevated border border-default rounded-full text-content-main text-sm placeholder:text-content-subtle focus:outline-none focus:ring-2 focus:ring-primary"
                      @keydown="handleCategoryKeydown"
                    />
                    <button
                      type="button"
                      class="px-4 py-2 bg-primary text-white rounded-full text-sm hover:bg-primary-600"
                      @click="handleCreateCategory"
                    >
                      Criar
                    </button>
                  </div>
                  <button
                    v-else
                    type="button"
                    class="mt-2 text-sm text-primary hover:text-primary-400 transition-colors"
                    @click="isCreatingCategory = true"
                  >
                    + Criar nova categoria
                  </button>
                </div>
              </div>

              <!-- Row 2: Provedor e Valor -->
              <div class="grid grid-cols-2 gap-4">
                <!-- Provedor -->
                <div>
                  <label class="label-dark">Provedor</label>
                  <input
                    v-model="provedor"
                    type="text"
                    placeholder="Ex. Sua empresa"
                    class="w-full px-5 py-3 bg-surface-elevated border border-default rounded-full text-content-main placeholder:text-content-subtle focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                </div>

                <!-- Valor -->
                <div>
                  <label class="label-dark">Valor</label>
                  <input
                    :value="valorDisplay"
                    type="text"
                    inputmode="numeric"
                    placeholder="R$ 0,00"
                    class="w-full px-5 py-3 bg-surface-elevated border border-default rounded-full text-content-main placeholder:text-content-subtle focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                    @input="handleValorInput"
                  />
                </div>
              </div>

              <!-- Row 3: Dia do recebimento e Toggle Limite -->
              <div class="grid grid-cols-2 gap-4 items-end">
                <!-- Dia do recebimento -->
                <div>
                  <label class="label-dark">Dia do recebimento</label>
                  <select
                    v-model.number="diaRecebimento"
                    class="w-full px-5 py-3 bg-surface-elevated border border-default rounded-full text-content-main focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent appearance-none cursor-pointer"
                  >
                    <option v-for="dia in 31" :key="dia" :value="dia">{{ dia }}</option>
                  </select>
                </div>

                <!-- Toggle Limite -->
                <div class="flex items-center gap-3 py-3">
                  <button
                    type="button"
                    class="relative w-12 h-6 rounded-full transition-colors duration-200 flex-shrink-0"
                    :class="hasLimit ? 'bg-primary' : 'bg-border-dark'"
                    @click="hasLimit = !hasLimit"
                  >
                    <span
                      class="absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform duration-200"
                      :class="hasLimit ? 'translate-x-6' : 'translate-x-0'"
                    />
                  </button>
                  <div>
                    <p class="text-sm text-content-main font-medium">Limite</p>
                    <p class="text-xs text-content-subtle">Tem data para não receber mais</p>
                  </div>
                </div>
              </div>

              <!-- Row 4: Data limite (aparece quando hasLimit é true) -->
              <div v-if="hasLimit" class="animate-fade-in">
                <label class="label-dark">Data final do recebimento</label>
                <AppDateInput
                  v-model="endDate"
                  input-class="w-full px-5 py-3 bg-surface-elevated border border-default rounded-full text-content-main focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                />
                <p class="mt-1.5 text-xs text-content-subtle">
                  Após essa data, a renda não será mais gerada automaticamente
                </p>
              </div>
            </div>

            <!-- Footer -->
            <div class="px-6 py-4 border-t border-default">
              <button
                type="button"
                class="w-full py-3 rounded-full bg-primary text-white font-semibold hover:brightness-110 hover:shadow-primary transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                :disabled="!provedor || valor <= 0 || !accountId || isLoading"
                @click="handleSubmit"
              >
                {{ isLoading ? 'Salvando...' : 'Salvar' }}
              </button>
            </div>
          </div>
        </Transition>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
/* Custom select arrow */
select {
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='%239CA3AF' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 12px center;
  background-size: 16px;
  padding-right: 40px;
}
</style>
