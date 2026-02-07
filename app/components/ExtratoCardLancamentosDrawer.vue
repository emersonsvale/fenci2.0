<script setup lang="ts">
import { computed, onMounted, onUnmounted, watch } from 'vue'
import type { ExtratoCreditCard } from '../composables/useExtrato'
import { useCurrency } from '~/composables/useCurrency'

/**
 * ExtratoCardLancamentosDrawer - Drawer que exibe os lançamentos de um cartão de crédito
 * Abre ao clicar em um cartão na sidebar da página de extratos.
 */

const { formatCurrency } = useCurrency()

interface TransactionWithDate {
  id: string
  description: string
  amount: number
  installmentInfo: string | null
  transactionDate: string
  category: {
    id: string
    name: string
    icon: string | null
    color: string | null
  } | null
}

interface DateGroup {
  dateKey: string
  formattedDate: string
  transactions: TransactionWithDate[]
}

const props = defineProps<{
  isOpen: boolean
  card: ExtratoCreditCard | null
}>()

const emit = defineEmits<{
  close: []
  add: []
  edit: [transactionId: string]
  delete: [transactionId: string]
}>()


/** Formata YYYY-MM-DD para exibição no item (ex: "15 jan.") */
function formatTransactionDate(isoDate: string): string {
  const [y, m, d] = isoDate.split('-').map(Number)
  if (!d || !m) return isoDate
  const date = new Date(y, (m ?? 1) - 1, d)
  return new Intl.DateTimeFormat('pt-BR', {
    day: 'numeric',
    month: 'short',
  }).format(date)
}

/** Formata YYYY-MM-DD para cabeçalho de grupo (ex: "Domingo, 15 jan.") */
function formatDateGroupHeader(isoDate: string): string {
  const [y, m, d] = isoDate.split('-').map(Number)
  if (!d || !m) return isoDate
  const date = new Date(y, (m ?? 1) - 1, d)
  const formatted = new Intl.DateTimeFormat('pt-BR', {
    weekday: 'long',
    day: 'numeric',
    month: 'short',
  }).format(date)
  return formatted.charAt(0).toUpperCase() + formatted.slice(1)
}

/** Lançamentos agrupados por data (data mais recente primeiro) */
const transactionsByDate = computed<DateGroup[]>(() => {
  const card = props.card
  if (!card?.transactions?.length) return []

  const byDate = new Map<string, TransactionWithDate[]>()
  for (const tx of card.transactions) {
    const key = tx.transactionDate
    if (!byDate.has(key)) byDate.set(key, [])
    byDate.get(key)!.push(tx)
  }

  const sortedKeys = [...byDate.keys()].sort((a, b) => b.localeCompare(a))
  return sortedKeys.map((dateKey) => ({
    dateKey,
    formattedDate: formatDateGroupHeader(dateKey),
    transactions: byDate.get(dateKey) ?? [],
  }))
})

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
        id="extrato-card-drawer-overlay"
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
        v-if="isOpen && card"
        id="extrato-card-drawer-panel"
        class="fixed top-0 right-0 bottom-0 w-full max-w-md bg-surface-elevated shadow-xl z-modal flex flex-col border-l border-default-subtle"
        role="dialog"
        aria-modal="true"
        :aria-label="`Lançamentos do cartão ${card?.name ?? ''}`"
      >
        <!-- Header -->
        <div class="flex items-center justify-between px-5 py-4 border-b border-default-subtle shrink-0">
          <div class="flex items-center gap-3 min-w-0">
            <div class="min-w-0">
              <h2 class="text-lg font-semibold text-content-main truncate">
                {{ card.name }}
              </h2>
              <p class="text-caption text-content-muted">
                Total: {{ formatCurrency(card.totalAmount) }}
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

        <!-- Botão adicionar (abaixo do header) -->
        <div class="px-5 pt-3 pb-1 shrink-0 border-b border-default-subtle">
          <button
            type="button"
            class="w-full flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-primary/10 text-primary hover:bg-primary/20 transition-colors text-body-sm font-medium"
            @click="emit('add')"
          >
            <span class="material-symbols-outlined text-lg">add</span>
            Adicionar lançamento
          </button>
        </div>

        <!-- Lista de lançamentos -->
        <div class="flex-1 min-h-0 overflow-y-auto px-5 py-4">
          <p class="text-body-sm font-medium text-content-muted mb-3">
            Lançamentos ({{ card.transactions.length }})
          </p>

          <div v-if="card.transactions.length === 0" class="py-12 text-center text-content-subtle">
            <span class="material-symbols-outlined text-4xl mb-3 block">
              receipt_long
            </span>
            <p class="text-body-sm">Nenhum lançamento neste período</p>
          </div>

          <div v-else class="space-y-5">
            <section
              v-for="group in transactionsByDate"
              :key="group.dateKey"
              class="space-y-1"
            >
              <h3 class="text-caption font-semibold text-content-muted uppercase tracking-wide sticky top-0 bg-surface-elevated py-2 -mx-1 px-1 border-b border-default-subtle mb-2">
                {{ group.formattedDate }}
              </h3>
              <ul class="space-y-1">
                <li
                  v-for="(tx, index) in group.transactions"
                  :key="tx.id"
                  class="flex items-center justify-between gap-2 py-2.5 px-3 rounded-xl hover:bg-surface-overlay transition-colors group"
                >
                  <div class="min-w-0 flex-1">
                    <span
                      class="text-body-sm text-content-main block truncate"
                      :title="`${tx.installmentInfo || ''} ${tx.description}`.trim()"
                    >
                      {{ tx.installmentInfo ? `${tx.installmentInfo} ` : '' }}{{ tx.description }}
                    </span>
                    <span
                      v-if="tx.category"
                      class="text-caption text-content-muted block mt-0.5 truncate"
                      :title="tx.category.name"
                    >
                      {{ tx.category.name }}
                    </span>
                  </div>
                  <div class="flex items-center gap-0.5 flex-shrink-0">
                    <span class="text-body-sm font-medium text-content-main mr-1">
                      {{ formatCurrency(tx.amount) }}
                    </span>
                    <button
                      type="button"
                      class="p-1.5 rounded-lg text-content-subtle hover:bg-surface-overlay hover:text-content-main transition-colors"
                      aria-label="Editar lançamento"
                      @click="emit('edit', tx.id)"
                    >
                      <span class="material-symbols-outlined text-lg">edit</span>
                    </button>
                    <button
                      type="button"
                      class="p-1.5 rounded-lg text-content-subtle hover:text-error hover:bg-surface-overlay transition-colors"
                      aria-label="Excluir lançamento"
                      @click="emit('delete', tx.id)"
                    >
                      <span class="material-symbols-outlined text-lg">delete</span>
                    </button>
                  </div>
                </li>
              </ul>
            </section>
          </div>
        </div>
      </aside>
    </Transition>
  </Teleport>
</template>
