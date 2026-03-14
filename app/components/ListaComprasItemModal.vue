<script setup lang="ts">
import { ref, watch } from 'vue'
import { useCurrency } from '~/composables/useCurrency'
import BaseModal from './BaseModal.vue'
import AppButton from './AppButton.vue'
import AppInput from './AppInput.vue'
import type { ShoppingListItem, ShoppingListCategory } from 'shared/types/database.types'
import {
  SHOPPING_LIST_STATUS,
  SHOPPING_LIST_PRIORITY,
  SHOPPING_LIST_UNITS,
  type ShoppingListItemStatus,
} from 'shared/constants/shoppingList'
import type { ShoppingListItemFormData } from '../composables/useListaCompras'

const { formatCurrency } = useCurrency()

const props = defineProps<{
  isOpen: boolean
  categories: ShoppingListCategory[]
  editingItem?: ShoppingListItem | null
}>()

const emit = defineEmits<{
  close: []
  submit: [data: ShoppingListItemFormData]
}>()

const productName = ref('')
const status = ref<ShoppingListItemStatus>('a_comprar')
const quantity = ref<number | ''>(1)
const unit = ref('Unidades')
const categoryId = ref('')
const priority = ref('media')
const purchaseLocation = ref('')
const priceEstimated = ref<number | ''>('')
const priceEstimatedDisplay = ref('')
const priceActual = ref<number | ''>('')
const priceActualDisplay = ref('')
const notes = ref('')
const stockCurrent = ref<number | ''>('')
const stockMinimum = ref<number | ''>('')
const recipeReference = ref('')

watch(
  () => [props.isOpen, props.editingItem],
  () => {
    if (props.isOpen) {
      if (props.editingItem) {
        const i = props.editingItem
        productName.value = i.product_name
        status.value = (i.status as ShoppingListItemStatus) ?? 'a_comprar'
        quantity.value = i.quantity != null ? Number(i.quantity) : 1
        unit.value = i.unit ?? 'Unidades'
        categoryId.value = i.category_id ?? ''
        priority.value = i.priority ?? 'media'
        purchaseLocation.value = i.purchase_location ?? ''
        priceEstimated.value = i.price_estimated != null ? Number(i.price_estimated) : ''
        priceEstimatedDisplay.value = i.price_estimated != null ? formatCurrency(Number(i.price_estimated)) : ''
        priceActual.value = i.price_actual != null ? Number(i.price_actual) : ''
        priceActualDisplay.value = i.price_actual != null ? formatCurrency(Number(i.price_actual)) : ''
        notes.value = i.notes ?? ''
        stockCurrent.value = i.stock_current != null ? Number(i.stock_current) : ''
        stockMinimum.value = i.stock_minimum != null ? Number(i.stock_minimum) : ''
        recipeReference.value = i.recipe_reference ?? ''
      } else {
        resetForm()
      }
    }
  }
)

function resetForm() {
  productName.value = ''
  status.value = 'a_comprar'
  quantity.value = 1
  unit.value = 'Unidades'
  categoryId.value = props.categories[0]?.id ?? ''
  priority.value = 'media'
  purchaseLocation.value = ''
  priceEstimated.value = ''
  priceEstimatedDisplay.value = ''
  priceActual.value = ''
  priceActualDisplay.value = ''
  notes.value = ''
  stockCurrent.value = ''
  stockMinimum.value = ''
  recipeReference.value = ''
}

function formatCurrencyDisplay(value: number): string {
  if (value === 0) return ''
  return formatCurrency(value)
}

function handlePriceEstimatedInput(event: Event) {
  const input = event.target as HTMLInputElement
  const numbers = input.value.replace(/\D/g, '')
  const numValue = parseInt(numbers || '0', 10) / 100
  priceEstimated.value = numValue > 0 ? numValue : ''
  priceEstimatedDisplay.value = numValue > 0 ? formatCurrencyDisplay(numValue) : ''
}

function handlePriceActualInput(event: Event) {
  const input = event.target as HTMLInputElement
  const numbers = input.value.replace(/\D/g, '')
  const numValue = parseInt(numbers || '0', 10) / 100
  priceActual.value = numValue > 0 ? numValue : ''
  priceActualDisplay.value = numValue > 0 ? formatCurrencyDisplay(numValue) : ''
}

function handleSubmit() {
  if (!productName.value.trim()) return
  emit('submit', {
    product_name: productName.value.trim(),
    status: status.value,
    quantity: quantity.value === '' ? 1 : Number(quantity.value),
    unit: unit.value || 'Unidades',
    category_id: categoryId.value || null,
    priority: priority.value,
    purchase_location: purchaseLocation.value.trim() || null,
    price_estimated: priceEstimated.value === '' ? null : Number(priceEstimated.value),
    price_actual: priceActual.value === '' ? null : Number(priceActual.value),
    notes: notes.value.trim() || null,
    stock_current: stockCurrent.value === '' ? null : Number(stockCurrent.value),
    stock_minimum: stockMinimum.value === '' ? null : Number(stockMinimum.value),
    recipe_reference: recipeReference.value.trim() || null,
  })
}

function handleClose() {
  emit('close')
}
</script>

<template>
  <BaseModal
    :is-open="isOpen"
    :title="editingItem ? 'Editar item' : 'Novo item na lista'"
    subtitle="Preencha os dados do produto"
    @close="handleClose"
  >
    <div class="space-y-4 max-h-[70vh] overflow-y-auto">
      <AppInput
        id="lista-compras-product-name"
        v-model="productName"
        label="Nome do produto"
        placeholder="Ex.: Arroz, Detergente"
        required
      />
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label for="lista-compras-status" class="label-dark block mb-1">Status</label>
          <select
            id="lista-compras-status"
            v-model="status"
            class="w-full px-5 py-3 bg-surface-elevated border border-default rounded-full text-content-main focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option v-for="opt in SHOPPING_LIST_STATUS" :key="opt.value" :value="opt.value">
              {{ opt.label }}
            </option>
          </select>
        </div>
        <div>
          <label for="lista-compras-priority" class="label-dark block mb-1">Prioridade</label>
          <select
            id="lista-compras-priority"
            v-model="priority"
            class="w-full px-5 py-3 bg-surface-elevated border border-default rounded-full text-content-main focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option v-for="opt in SHOPPING_LIST_PRIORITY" :key="opt.value" :value="opt.value">
              {{ opt.label }}
            </option>
          </select>
        </div>
      </div>
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label for="lista-compras-quantity" class="label-dark block mb-1">Quantidade</label>
          <input
            id="lista-compras-quantity"
            v-model.number="quantity"
            type="number"
            min="0"
            step="0.001"
            class="w-full px-5 py-3 bg-surface-elevated border border-default rounded-full text-content-main focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
        <div>
          <label for="lista-compras-unit" class="label-dark block mb-1">Unidade</label>
          <select
            id="lista-compras-unit"
            v-model="unit"
            class="w-full px-5 py-3 bg-surface-elevated border border-default rounded-full text-content-main focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option v-for="u in SHOPPING_LIST_UNITS" :key="u" :value="u">
              {{ u }}
            </option>
          </select>
        </div>
      </div>
      <div>
        <label for="lista-compras-category" class="label-dark block mb-1">Categoria (corredor)</label>
        <select
          id="lista-compras-category"
          v-model="categoryId"
          class="w-full px-5 py-3 bg-surface-elevated border border-default rounded-full text-content-main focus:outline-none focus:ring-2 focus:ring-primary"
        >
          <option value="">Selecione</option>
          <option v-for="c in categories" :key="c.id" :value="c.id">
            {{ c.name }}
          </option>
        </select>
      </div>
      <AppInput
        id="lista-compras-purchase-location"
        v-model="purchaseLocation"
        label="Local de compra ideal"
        placeholder="Ex.: Atacadão, Feira, Padaria"
      />
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label for="lista-compras-price-est" class="label-dark block mb-1">Preço estimado (R$)</label>
          <input
            id="lista-compras-price-est"
            :value="priceEstimatedDisplay"
            type="text"
            inputmode="numeric"
            placeholder="0,00"
            class="w-full px-5 py-3 bg-surface-elevated border border-default rounded-full text-content-main placeholder:text-content-subtle focus:outline-none focus:ring-2 focus:ring-primary"
            @input="handlePriceEstimatedInput"
          />
        </div>
        <div>
          <label for="lista-compras-price-actual" class="label-dark block mb-1">Preço real (R$)</label>
          <input
            id="lista-compras-price-actual"
            :value="priceActualDisplay"
            type="text"
            inputmode="numeric"
            placeholder="0,00"
            class="w-full px-5 py-3 bg-surface-elevated border border-default rounded-full text-content-main placeholder:text-content-subtle focus:outline-none focus:ring-2 focus:ring-primary"
            @input="handlePriceActualInput"
          />
        </div>
      </div>
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label for="lista-compras-stock-current" class="label-dark block mb-1">Estoque atual</label>
          <input
            id="lista-compras-stock-current"
            v-model.number="stockCurrent"
            type="number"
            min="0"
            step="0.001"
            placeholder="—"
            class="w-full px-5 py-3 bg-surface-elevated border border-default rounded-full text-content-main placeholder:text-content-subtle focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
        <div>
          <label for="lista-compras-stock-min" class="label-dark block mb-1">Estoque mínimo</label>
          <input
            id="lista-compras-stock-min"
            v-model.number="stockMinimum"
            type="number"
            min="0"
            step="0.001"
            placeholder="—"
            class="w-full px-5 py-3 bg-surface-elevated border border-default rounded-full text-content-main placeholder:text-content-subtle focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
      </div>
      <AppInput
        id="lista-compras-notes"
        v-model="notes"
        label="Observações / Marca preferida"
        placeholder="Ex.: Comprar marca X ou em promoção"
      />
      <AppInput
        id="lista-compras-recipe"
        v-model="recipeReference"
        label="Receita (cardápio semanal)"
        placeholder="Ex.: Strogonoff de Quinta-feira"
      />
    </div>
    <template #footer>
      <div class="flex justify-end gap-3">
        <AppButton variant="secondary" @click="handleClose">
          Cancelar
        </AppButton>
        <AppButton
          variant="primary"
          :disabled="!productName.trim()"
          @click="handleSubmit"
        >
          {{ editingItem ? 'Salvar' : 'Adicionar' }}
        </AppButton>
      </div>
    </template>
  </BaseModal>
</template>
