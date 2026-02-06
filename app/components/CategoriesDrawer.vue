<script setup lang="ts">
import { onMounted, onUnmounted, watch } from 'vue'
import { useCurrency } from '~/composables/useCurrency'

/**
 * CategoriesDrawer - Drawer que exibe a lista completa de categorias (entradas ou saídas)
 * Abre ao clicar em "Ver mais" nas seções de categorias da página Contas.
 */

const { formatCurrency } = useCurrency()

export interface CategoryItemDrawer {
  id: string
  name: string
  icon: string | null
  color: string
  type?: 'income' | 'expense'
  totalAmount?: number
}

const props = defineProps<{
  isOpen: boolean
  title: string
  categories: CategoryItemDrawer[]
  loading?: boolean
}>()

const emit = defineEmits<{
  close: []
  add: []
  'item-click': [category: CategoryItemDrawer]
}>()

function isEmoji(str: string | null): boolean {
  if (!str) return false
  const emojiRegex = /[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]|[\u{1F600}-\u{1F64F}]|[\u{1F680}-\u{1F6FF}]/u
  return emojiRegex.test(str)
}

function getMaterialIcon(category: CategoryItemDrawer): string {
  const iconMap: Record<string, string> = {
    salário: 'payments',
    salario: 'payments',
    freelancer: 'work',
    dividendos: 'trending_up',
    'dividendos fii': 'trending_up',
    outros: 'more_horiz',
    'vale apps': 'smartphone',
    educação: 'school',
    educacao: 'school',
    farmácia: 'local_pharmacy',
    farmacia: 'local_pharmacy',
    casa: 'home',
    transporte: 'directions_car',
    investimentos: 'savings',
    alimentação: 'restaurant',
    alimentacao: 'restaurant',
    lazer: 'sports_esports',
    saúde: 'favorite',
    saude: 'favorite',
  }
  const nameLower = category.name.toLowerCase()
  return iconMap[nameLower] || 'category'
}


function handleKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape') emit('close')
}

function lockBodyScroll() {
  document.body.style.overflow = 'hidden'
}

function unlockBodyScroll() {
  document.body.style.overflow = ''
}

onMounted(() => {
  document.addEventListener('keydown', handleKeydown)
  if (props.isOpen) lockBodyScroll()
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeydown)
  unlockBodyScroll()
})

watch(
  () => props.isOpen,
  (isOpen) => {
    if (isOpen) lockBodyScroll()
    else unlockBodyScroll()
  }
)
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
        id="categories-drawer-overlay"
        class="fixed inset-0 bg-black/50 backdrop-blur-sm z-modal"
        aria-hidden="true"
        @click.self="emit('close')"
      />
    </Transition>

    <Transition
      enter-active-class="transition ease-out duration-250"
      enter-from-class="translate-x-full"
      enter-to-class="translate-x-0"
      leave-active-class="transition ease-in duration-200"
      leave-from-class="translate-x-0"
      leave-to-class="translate-x-full"
    >
      <aside
        v-if="isOpen"
        id="categories-drawer-panel"
        class="fixed top-0 right-0 bottom-0 w-full max-w-md bg-surface-elevated shadow-xl z-modal flex flex-col border-l border-default"
        role="dialog"
        aria-modal="true"
        :aria-label="title"
      >
        <!-- Header -->
        <div class="flex items-center justify-between px-5 py-4 border-b border-default shrink-0">
          <h2 class="text-lg font-semibold text-content-main">
            {{ title }}
          </h2>
          <div class="flex items-center gap-1">
            <button
              type="button"
              class="p-2 rounded-lg hover:bg-surface-overlay transition-colors text-content-subtle"
              aria-label="Adicionar categoria"
              @click="emit('add')"
            >
              <span class="material-symbols-outlined text-xl">add_circle</span>
            </button>
            <button
              type="button"
              class="p-2 rounded-lg hover:bg-surface-overlay transition-colors text-content-subtle"
              aria-label="Fechar"
              @click="emit('close')"
            >
              <span class="material-symbols-outlined text-xl">close</span>
            </button>
          </div>
        </div>

        <!-- Lista completa de categorias -->
        <div class="flex-1 min-h-0 overflow-y-auto px-5 py-4">
          <div v-if="loading" class="space-y-3">
            <div v-for="i in 8" :key="i" class="flex items-center gap-3">
              <div class="skeleton w-8 h-8 rounded-full" />
              <div class="skeleton h-4 flex-1 rounded" />
            </div>
          </div>

          <div v-else class="space-y-1">
            <button
              v-for="category in categories"
              :key="category.id"
              type="button"
              class="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-surface-overlay transition-colors text-left"
              @click="emit('item-click', category)"
            >
              <div
                class="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 bg-white border border-default-subtle"
              >
                <span v-if="isEmoji(category.icon)" class="text-xl">
                  {{ category.icon }}
                </span>
                <span
                  v-else
                  class="material-symbols-outlined text-lg"
                  :style="{ color: category.color }"
                >
                  {{ category.icon || getMaterialIcon(category) }}
                </span>
              </div>
              <div class="flex-1 flex items-center justify-between min-w-0">
                <span class="text-body-sm font-medium text-content-main truncate">
                  {{ category.name }}
                </span>
                <span class="text-body-sm text-content-muted ml-2 flex-shrink-0">
                  {{ formatCurrency(category.totalAmount ?? 0) }}
                </span>
              </div>
              <span class="material-symbols-outlined text-content-tertiary text-lg flex-shrink-0">
                chevron_right
              </span>
            </button>

            <div
              v-if="categories.length === 0"
              class="py-12 text-center text-content-subtle"
            >
              <span class="material-symbols-outlined text-4xl mb-3 block">category</span>
              <p class="text-body-sm">Nenhuma categoria cadastrada</p>
              <button
                type="button"
                class="mt-4 text-body-sm text-primary hover:underline"
                @click="emit('add')"
              >
                Adicionar categoria
              </button>
            </div>
          </div>
        </div>
      </aside>
    </Transition>
  </Teleport>
</template>
