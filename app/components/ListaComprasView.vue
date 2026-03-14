<script setup lang="ts">
import { ref, computed } from 'vue'
import { useCurrency } from '~/composables/useCurrency'
import type { ShoppingListItem, ShoppingListCategory } from 'shared/types/database.types'
import { SHOPPING_LIST_STATUS, type ShoppingListItemStatus } from 'shared/constants/shoppingList'
import ListaComprasItemModal from './ListaComprasItemModal.vue'
import ConfirmDeleteModal from './ConfirmDeleteModal.vue'
import type { ShoppingListItemFormData } from '../composables/useListaCompras'

const { formatCurrency } = useCurrency()

const props = defineProps<{
  items: ShoppingListItem[]
  categories: ShoppingListCategory[]
  totalNoCarrinho: number
  isLoading: boolean
  error: string | null
}>()

const emit = defineEmits<{
  create: [data: ShoppingListItemFormData]
  update: [id: string, data: Partial<ShoppingListItemFormData>]
  updateStatus: [id: string, status: ShoppingListItemStatus]
  delete: [id: string]
  retry: []
}>()

const statusLabel: Record<string, string> = {
  a_comprar: 'A Comprar',
  no_carrinho: 'No Carrinho',
  comprado: 'Comprado',
  faltou_mercado: 'Faltou no Mercado',
}

const priorityLabel: Record<string, string> = {
  alta: 'Alta',
  media: 'Média',
  baixa: 'Baixa',
}

const isItemModalOpen = ref(false)
const isDeleteModalOpen = ref(false)
const editingItem = ref<ShoppingListItem | null>(null)
const itemToDelete = ref<ShoppingListItem | null>(null)

const deleteConfirmMessage = computed(() =>
  itemToDelete.value ? `Excluir "${itemToDelete.value.product_name}" da lista?` : ''
)

const itemsByCategory = computed(() => {
  const byCat: { category: ShoppingListCategory | null; items: ShoppingListItem[] }[] = []
  const categoryIds = props.categories.map((c) => c.id)

  for (const cat of props.categories) {
    const catItems = props.items.filter((i) => i.category_id === cat.id)
    if (catItems.length > 0) byCat.push({ category: cat, items: catItems })
  }

  const uncategorized = props.items.filter((i) => !i.category_id || !categoryIds.includes(i.category_id))
  if (uncategorized.length > 0) byCat.push({ category: null, items: uncategorized })

  return byCat
})

function getCategoryName(categoryId: string | null) {
  if (!categoryId) return 'Sem categoria'
  return props.categories.find((c) => c.id === categoryId)?.name ?? 'Sem categoria'
}

function openCreate() {
  editingItem.value = null
  isItemModalOpen.value = true
}

function openEdit(item: ShoppingListItem) {
  editingItem.value = item
  isItemModalOpen.value = true
}

function closeItemModal() {
  isItemModalOpen.value = false
  editingItem.value = null
}

function handleItemSubmit(data: ShoppingListItemFormData) {
  if (editingItem.value) {
    emit('update', editingItem.value.id, data)
  } else {
    emit('create', data)
  }
  closeItemModal()
}

function cycleStatus(item: ShoppingListItem) {
  const order: ShoppingListItemStatus[] = ['a_comprar', 'no_carrinho', 'comprado', 'faltou_mercado']
  const idx = order.indexOf(item.status as ShoppingListItemStatus)
  const next = order[(idx + 1) % order.length]
  emit('updateStatus', item.id, next)
}

function openDelete(item: ShoppingListItem) {
  itemToDelete.value = item
  isDeleteModalOpen.value = true
}

function closeDeleteModal() {
  isDeleteModalOpen.value = false
  itemToDelete.value = null
}

function confirmDelete() {
  if (itemToDelete.value) {
    emit('delete', itemToDelete.value.id)
    closeDeleteModal()
  }
}
</script>

<template>
  <div id="lista-compras-view" class="space-y-6">
    <div
      v-if="error"
      class="rounded-xl border border-error/30 bg-error/5 p-4 flex flex-wrap items-center justify-between gap-3"
    >
      <p class="text-body-sm text-error flex-1 min-w-0">
        {{ error }}
      </p>
      <button
        type="button"
        class="btn btn-outline !w-auto text-body-sm shrink-0"
        @click="emit('retry')"
      >
        Tentar novamente
      </button>
    </div>

    <!-- Calculadora: total dos itens No Carrinho -->
    <div
      v-if="totalNoCarrinho > 0"
      class="rounded-xl border border-default bg-surface-elevated p-4 flex items-center justify-between gap-4"
    >
      <span class="text-body-md text-content-subtle">
        Total no carrinho (preços reais)
      </span>
      <span class="text-heading-md font-semibold text-content-main">
        {{ formatCurrency(totalNoCarrinho) }}
      </span>
    </div>

    <div class="flex items-center justify-between gap-4">
      <h3 class="text-body-lg font-semibold text-content-main">
        Itens por corredor
      </h3>
      <button
        type="button"
        class="btn btn-primary !w-auto px-4 py-2 rounded-full inline-flex items-center gap-2 text-body-sm"
        @click="openCreate"
      >
        <span class="material-symbols-outlined text-lg">add</span>
        Adicionar item
      </button>
    </div>

    <div v-if="isLoading" class="flex justify-center py-12">
      <span class="material-symbols-outlined animate-spin text-4xl text-content-tertiary">progress_activity</span>
    </div>

    <div
      v-else-if="items.length === 0"
      class="rounded-xl border border-default bg-surface-elevated p-12 text-center"
    >
      <span class="material-symbols-outlined text-5xl text-content-tertiary mb-3 block">shopping_cart</span>
      <p class="text-body-md text-content-subtle mb-4">
        Nenhum item na lista. Adicione produtos para organizar suas compras por corredor.
      </p>
      <button type="button" class="btn btn-primary !w-auto" @click="openCreate">
        Adicionar primeiro item
      </button>
    </div>

    <div v-else class="space-y-8">
      <section
        v-for="group in itemsByCategory"
        :key="group.category?.id ?? 'uncategorized'"
        class="rounded-xl border border-default bg-surface-elevated overflow-hidden"
      >
        <h4
          class="px-4 py-3 bg-surface-overlay text-body-md font-medium text-content-main border-b border-default"
        >
          {{ group.category?.name ?? 'Sem categoria' }}
        </h4>
        <ul class="divide-y divide-default">
          <li
            v-for="item in group.items"
            :key="item.id"
            class="flex flex-wrap items-center gap-3 px-4 py-3 hover:bg-surface-overlay/50 transition-colors"
          >
            <button
              type="button"
              class="flex shrink-0 w-8 h-8 rounded-full border-2 border-default flex items-center justify-center transition-colors hover:border-primary"
              :class="{
                'bg-primary border-primary text-white': item.status === 'comprado',
                'bg-primary/20 border-primary': item.status === 'no_carrinho',
              }"
              :aria-label="`Status: ${statusLabel[item.status]}. Clique para alterar.`"
              @click="cycleStatus(item)"
            >
              <span
                v-if="item.status === 'comprado'"
                class="material-symbols-outlined text-lg"
              >check</span>
              <span v-else class="material-symbols-outlined text-lg opacity-50">remove</span>
            </button>
            <div class="min-w-0 flex-1">
              <p class="font-medium text-content-main truncate">
                {{ item.product_name }}
              </p>
              <div class="flex flex-wrap items-center gap-x-3 gap-y-1 mt-0.5 text-body-sm text-content-subtle">
                <span v-if="item.quantity != null && item.quantity !== 1">
                  {{ item.quantity }} {{ item.unit ?? 'un' }}
                </span>
                <span
                  class="inline-flex px-2 py-0.5 rounded-full text-caption font-medium"
                  :class="{
                    'bg-warning/20 text-warning': item.priority === 'alta',
                    'bg-content-subtle/20': item.priority === 'media',
                    'bg-content-tertiary/20 text-content-tertiary': item.priority === 'baixa',
                  }"
                >
                  {{ priorityLabel[item.priority] ?? item.priority }}
                </span>
                <span
                  class="inline-flex px-2 py-0.5 rounded-full text-caption"
                  :class="{
                    'bg-primary/20 text-primary': item.status === 'no_carrinho',
                    'bg-success/20 text-success': item.status === 'comprado',
                    'bg-content-subtle/20': item.status === 'a_comprar',
                    'bg-error/20 text-error': item.status === 'faltou_mercado',
                  }"
                >
                  {{ statusLabel[item.status] ?? item.status }}
                </span>
                <span v-if="item.price_actual != null && item.price_actual > 0">
                  {{ formatCurrency(Number(item.price_actual)) }}
                </span>
              </div>
            </div>
            <div class="flex items-center gap-1 shrink-0">
              <button
                type="button"
                class="p-2 rounded-lg hover:bg-surface-tertiary text-content-subtle hover:text-content-main transition-colors"
                aria-label="Editar item"
                @click="openEdit(item)"
              >
                <span class="material-symbols-outlined text-lg">edit</span>
              </button>
              <button
                type="button"
                class="p-2 rounded-lg hover:bg-surface-tertiary hover:text-error text-content-subtle transition-colors"
                aria-label="Excluir item"
                @click="openDelete(item)"
              >
                <span class="material-symbols-outlined text-lg">delete</span>
              </button>
            </div>
          </li>
        </ul>
      </section>
    </div>

    <ListaComprasItemModal
      :is-open="isItemModalOpen"
      :categories="categories"
      :editing-item="editingItem"
      @close="closeItemModal"
      @submit="handleItemSubmit"
    />
    <ConfirmDeleteModal
      :is-open="isDeleteModalOpen"
      title="Excluir item"
      :message="deleteConfirmMessage"
      @cancel="closeDeleteModal"
      @confirm="confirmDelete"
    />
  </div>
</template>
