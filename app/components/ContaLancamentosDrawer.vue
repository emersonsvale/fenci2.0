<script setup lang="ts">
import { onMounted, onUnmounted, watch } from 'vue'
import { useCurrency } from '~/composables/useCurrency'
import type { AccountTransaction } from '~/composables/useContas'

/**
 * ContaLancamentosDrawer - Drawer com lançamentos da conta no período selecionado
 * Abre ao clicar em uma conta bancária na lista da página Contas.
 */

const { formatCurrency } = useCurrency()

const props = defineProps<{
  isOpen: boolean
  account: {
    id: string
    name: string
    identifier: string
    color?: string
    icon?: string | null
  } | null
  balance: number
  transactions: AccountTransaction[]
  loading?: boolean
}>()

const emit = defineEmits<{
  close: []
}>()

function formatTransactionDate(isoDate: string): string {
  const [y, m, d] = isoDate.split('-').map(Number)
  if (!d || !m) return isoDate
  const date = new Date(y, (m ?? 1) - 1, d)
  return new Intl.DateTimeFormat('pt-BR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(date)
}

function amountClass(tx: AccountTransaction): string {
  if (tx.type === 'income') return 'text-success'
  if (tx.type === 'expense') return 'text-error'
  return 'text-content-main'
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
        id="conta-lancamentos-drawer-overlay"
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
        id="conta-lancamentos-drawer-panel"
        class="fixed top-0 right-0 bottom-0 w-full max-w-md bg-surface-elevated shadow-xl z-modal flex flex-col border-l border-default-subtle"
        role="dialog"
        aria-modal="true"
        :aria-label="account ? `Lançamentos: ${account.name}` : 'Lançamentos da conta'"
      >
        <!-- Header -->
        <div class="flex items-center justify-between px-5 py-4 border-b border-default-subtle shrink-0">
          <div class="min-w-0 flex-1 flex items-center gap-3">
            <div
              v-if="account"
              class="w-10 h-10 rounded-full flex items-center justify-center text-white flex-shrink-0"
              :style="{ backgroundColor: account.color || '#6B7280' }"
            >
              <span class="material-symbols-outlined text-xl">
                {{ account.icon || 'account_balance' }}
              </span>
            </div>
            <div class="min-w-0">
              <h2 class="text-lg font-semibold text-content-main truncate">
                {{ account ? account.name : 'Conta' }}
              </h2>
              <p v-if="account" class="text-caption text-content-subtle">
                {{ account.identifier }}
              </p>
              <p class="text-body-sm font-semibold text-content-main mt-1">
                Saldo: {{ formatCurrency(balance) }}
              </p>
            </div>
          </div>
          <button
            type="button"
            class="p-2 rounded-lg hover:bg-surface-overlay transition-colors text-content-subtle flex-shrink-0"
            aria-label="Fechar"
            @click="emit('close')"
          >
            <span class="material-symbols-outlined text-xl">close</span>
          </button>
        </div>

        <!-- Lista de lançamentos -->
        <div class="flex-1 min-h-0 overflow-y-auto px-5 py-4">
          <p v-if="loading" class="text-body-sm text-content-subtle">
            Carregando lançamentos...
          </p>
          <template v-else>
            <p class="text-body-sm font-medium text-content-muted mb-3">
              Lançamentos do mês ({{ transactions.length }})
            </p>
            <ul v-if="transactions.length > 0" class="space-y-2">
              <li
                v-for="tx in transactions"
                :key="tx.id"
                class="flex items-center justify-between gap-2 py-2.5 px-3 rounded-xl hover:bg-surface-overlay transition-colors border border-transparent hover:border-default-subtle"
              >
                <div class="min-w-0 flex-1">
                  <span class="text-body-sm font-medium text-content-main block truncate">
                    {{ tx.description }}
                  </span>
                  <span class="text-caption text-content-muted block mt-0.5">
                    {{ formatTransactionDate(tx.transactionDate) }}
                    <span v-if="tx.categoryName" class="ml-1">· {{ tx.categoryName }}</span>
                  </span>
                </div>
                <span
                  class="text-body-sm font-medium flex-shrink-0"
                  :class="amountClass(tx)"
                >
                  {{ tx.amount >= 0 ? '+' : '' }}{{ formatCurrency(tx.amount) }}
                </span>
              </li>
            </ul>
            <p v-else class="text-body-sm text-content-subtle py-4 text-center">
              Nenhum lançamento neste mês.
            </p>
          </template>
        </div>
      </aside>
    </Transition>
  </Teleport>
</template>
