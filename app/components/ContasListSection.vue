<script setup lang="ts">
import { computed } from 'vue'

/**
 * ContasListSection - Seção de lista (cartões ou contas bancárias)
 * Lista items com ícone, nome e identificador
 */

export interface ListItem {
  id: string
  name: string
  identifier: string
  icon?: string | null
  color?: string
}

export interface ContasListSectionProps {
  title: string
  items: ListItem[]
  loading?: boolean
  maxItems?: number
  addIcon?: string
  variant?: 'card' | 'bank'
}

const props = withDefaults(defineProps<ContasListSectionProps>(), {
  loading: false,
  maxItems: 4,
  addIcon: 'add',
  variant: 'card',
})

const emit = defineEmits<{
  add: []
  'view-all': []
  'item-click': [item: ListItem]
  edit: [item: ListItem]
}>()

const displayedItems = computed(() => {
  return props.items.slice(0, props.maxItems)
})

const hasMore = computed(() => props.items.length > props.maxItems)

// Ícone baseado na bandeira do cartão ou banco
function getItemIcon(item: ListItem): string {
  if (item.icon) return item.icon

  if (props.variant === 'card') {
    // Ícones de bandeira de cartão
    return 'credit_card'
  }

  // Ícones de banco baseados no nome
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

// Cor baseada no banco ou cartão
function getItemColor(item: ListItem): string {
  if (item.color) return item.color

  // Cores de bancos conhecidos
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

// Ícone do header baseado no tipo
const headerIcon = computed(() => {
  return props.variant === 'card' ? 'credit_card' : 'account_balance'
})
</script>

<template>
  <div
    id="contas-list-section"
    class="bg-surface-elevated rounded-xl p-5 shadow-xs border border-default-subtle h-full min-h-0 flex flex-col"
  >
    <!-- Header (sempre visível) -->
    <div class="flex items-center justify-between mb-4 shrink-0">
      <h3 class="text-body-md font-semibold text-content-main">
        {{ title }}
      </h3>
      <button
        type="button"
        class="p-1.5 rounded-lg hover:bg-surface-overlay transition-colors"
        @click="emit('add')"
      >
        <span class="material-symbols-outlined text-content-subtle text-lg">
          {{ headerIcon }}
        </span>
      </button>
    </div>

    <!-- Área rolável: lista ou loading -->
    <div class="flex-1 min-h-0 overflow-auto">
      <!-- Loading State -->
      <div v-if="loading" class="space-y-3">
        <div v-for="i in 4" :key="i" class="flex items-center justify-between">
          <div class="flex items-center gap-3">
            <div class="skeleton w-8 h-8 rounded-full" />
            <div class="skeleton h-4 w-24 rounded" />
          </div>
          <div class="skeleton h-4 w-16 rounded" />
        </div>
      </div>

      <!-- Items List -->
      <div v-else class="space-y-2">
        <button
          v-for="item in displayedItems"
          :key="item.id"
          type="button"
          class="w-full flex items-center justify-between p-2 rounded-lg hover:bg-surface-overlay transition-colors text-left gap-2"
          @click="emit('item-click', item)"
        >
          <div class="flex items-center gap-3 min-w-0 flex-1">
            <div
              class="w-8 h-8 rounded-full flex items-center justify-center text-white flex-shrink-0"
              :style="{ backgroundColor: getItemColor(item) }"
            >
              <span class="material-symbols-outlined text-base">
                {{ getItemIcon(item) }}
              </span>
            </div>
            <span class="text-body-sm text-content-main truncate">
              {{ item.name }}
            </span>
          </div>
          <div class="flex items-center gap-1 flex-shrink-0">
            <button
              type="button"
              class="p-1.5 rounded-md hover:bg-surface-overlay transition-colors text-content-subtle hover:text-content-main"
              aria-label="Editar"
              @click.stop="emit('edit', item)"
            >
              <span class="material-symbols-outlined text-lg">edit</span>
            </button>
            <span class="text-body-sm text-content-subtle font-mono">
              {{ item.identifier }}
            </span>
          </div>
        </button>

        <div
          v-if="items.length === 0"
          class="py-6 text-center text-content-subtle"
        >
          <span class="material-symbols-outlined text-3xl mb-2 block">
            {{ variant === 'card' ? 'credit_card_off' : 'account_balance' }}
          </span>
          <p class="text-body-sm">
            {{ variant === 'card' ? 'Nenhum cartão cadastrado' : 'Nenhuma conta cadastrada' }}
          </p>
        </div>
      </div>
    </div>

    <!-- Ver mais (sempre visível no rodapé) -->
    <button
      v-if="hasMore || items.length > 0"
      type="button"
      class="w-full mt-4 py-2 text-body-sm text-content-subtle hover:text-content-muted transition-colors shrink-0"
      @click="emit('view-all')"
    >
      Ver mais
    </button>
  </div>
</template>
