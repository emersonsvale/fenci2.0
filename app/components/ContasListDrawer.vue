<script setup lang="ts">
import { computed, onMounted, onUnmounted, watch } from 'vue'

/**
 * ContasListDrawer - Drawer que exibe a lista completa de cartões de crédito ou contas bancárias
 * Abre ao clicar em "Ver mais" nas seções da página Contas.
 */

export interface ListItemDrawer {
  id: string
  name: string
  identifier: string
  icon?: string | null
  color?: string
}

const props = withDefaults(
  defineProps<{
    isOpen: boolean
    title: string
    items: ListItemDrawer[]
    loading?: boolean
    variant?: 'card' | 'bank'
  }>(),
  { loading: false, variant: 'card' }
)

const emit = defineEmits<{
  close: []
  add: []
  'item-click': [item: ListItemDrawer]
  edit: [item: ListItemDrawer]
}>()

function getItemIcon(item: ListItemDrawer): string {
  if (item.icon) return item.icon
  if (props.variant === 'card') return 'credit_card'
  const bankIconMap: Record<string, string> = {
    nubank: 'account_balance',
    inter: 'account_balance',
    'banco inter': 'account_balance',
    caixa: 'account_balance',
    itaú: 'account_balance',
    itau: 'account_balance',
    bradesco: 'account_balance',
    santander: 'account_balance',
    bb: 'account_balance',
    'banco do brasil': 'account_balance',
  }
  const nameLower = item.name.toLowerCase()
  return bankIconMap[nameLower] || 'account_balance'
}

function getItemColor(item: ListItemDrawer): string {
  if (item.color) return item.color
  const colorMap: Record<string, string> = {
    nubank: '#820AD1',
    inter: '#FF7A00',
    'banco inter': '#FF7A00',
    caixa: '#005CA9',
    itaú: '#003366',
    itau: '#003366',
    bradesco: '#CC092F',
    santander: '#EC0000',
    'mercado pago': '#009EE3',
  }
  const nameLower = item.name.toLowerCase()
  return colorMap[nameLower] || '#6B7280'
}

const headerIcon = computed(() =>
  props.variant === 'card' ? 'credit_card' : 'account_balance'
)

const emptyMessage = computed(() =>
  props.variant === 'card' ? 'Nenhum cartão cadastrado' : 'Nenhuma conta cadastrada'
)

const emptyIcon = computed(() =>
  props.variant === 'card' ? 'credit_card_off' : 'account_balance'
)

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
        id="contas-list-drawer-overlay"
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
        id="contas-list-drawer-panel"
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
              :aria-label="variant === 'card' ? 'Adicionar cartão' : 'Adicionar conta'"
              @click="emit('add')"
            >
              <span class="material-symbols-outlined text-xl">{{ headerIcon }}</span>
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

        <!-- Lista completa -->
        <div class="flex-1 min-h-0 overflow-y-auto px-5 py-4">
          <div v-if="loading" class="space-y-3">
            <div v-for="i in 8" :key="i" class="flex items-center gap-3">
              <div class="skeleton w-10 h-10 rounded-full" />
              <div class="skeleton h-4 flex-1 rounded" />
              <div class="skeleton h-4 w-16 rounded" />
            </div>
          </div>

          <div v-else class="space-y-1">
            <button
              v-for="item in items"
              :key="item.id"
              type="button"
              class="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-surface-overlay transition-colors text-left"
              @click="emit('item-click', item)"
            >
              <div
                class="w-10 h-10 rounded-full flex items-center justify-center text-white flex-shrink-0"
                :style="{ backgroundColor: getItemColor(item) }"
              >
                <span class="material-symbols-outlined text-lg">
                  {{ getItemIcon(item) }}
                </span>
              </div>
              <div class="flex-1 flex items-center justify-between min-w-0">
                <span class="text-body-sm font-medium text-content-main truncate">
                  {{ item.name }}
                </span>
                <span class="text-body-sm text-content-muted font-mono ml-2 flex-shrink-0">
                  {{ item.identifier }}
                </span>
              </div>
              <div class="flex items-center gap-1 flex-shrink-0">
                <button
                  v-if="variant === 'card'"
                  type="button"
                  class="p-2 rounded-lg hover:bg-surface-overlay transition-colors text-content-subtle hover:text-content-main"
                  aria-label="Editar cartão"
                  @click.stop="emit('edit', item)"
                >
                  <span class="material-symbols-outlined text-xl">edit</span>
                </button>
                <button
                  v-if="variant === 'bank'"
                  type="button"
                  class="p-2 rounded-lg hover:bg-surface-overlay transition-colors text-content-subtle hover:text-content-main"
                  aria-label="Editar conta"
                  @click.stop="emit('edit', item)"
                >
                  <span class="material-symbols-outlined text-xl">edit</span>
                </button>
                <span class="material-symbols-outlined text-content-tertiary text-lg">
                  chevron_right
                </span>
              </div>
            </button>

            <div
              v-if="items.length === 0"
              class="py-12 text-center text-content-subtle"
            >
              <span class="material-symbols-outlined text-4xl mb-3 block">
                {{ emptyIcon }}
              </span>
              <p class="text-body-sm">{{ emptyMessage }}</p>
              <button
                type="button"
                class="mt-4 text-body-sm text-primary hover:underline"
                @click="emit('add')"
              >
                {{ variant === 'card' ? 'Adicionar cartão' : 'Adicionar conta' }}
              </button>
            </div>
          </div>
        </div>
      </aside>
    </Transition>
  </Teleport>
</template>
