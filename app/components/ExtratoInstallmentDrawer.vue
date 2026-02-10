<script setup lang="ts">
import { computed, onMounted, onUnmounted, watch } from 'vue'
import type { ExtratoInstallmentGroupData } from '../composables/useExtrato'
import { useCurrency } from '~/composables/useCurrency'

/**
 * ExtratoInstallmentDrawer - Drawer que exibe as parcelas de um lançamento parcelado
 * Abre ao clicar em um item parcelado na lista do extrato.
 */

const { formatCurrency } = useCurrency()

const props = defineProps<{
  isOpen: boolean
  groupData: ExtratoInstallmentGroupData | null
}>()

/** Resumo: total, pago (quantidade + valor) e faltam (quantidade + valor) */
const paymentSummary = computed(() => {
  const data = props.groupData
  if (!data?.installments?.length) {
    return { totalCount: 0, totalAmount: 0, paidCount: 0, paidAmount: 0, remainingCount: 0, remainingAmount: 0 }
  }
  let paidAmount = 0
  let paidCount = 0
  for (const inst of data.installments) {
    if (inst.isPaid) {
      paidCount += 1
      paidAmount += inst.amount
    }
  }
  const totalCount = data.installments.length
  const totalAmount = data.totalAmount
  const remainingCount = totalCount - paidCount
  const remainingAmount = totalAmount - paidAmount
  return { totalCount, totalAmount, paidCount, paidAmount, remainingCount, remainingAmount }
})

const emit = defineEmits<{
  close: []
  edit: [transactionId: string]
  delete: [transactionId: string]
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
        id="extrato-installment-drawer-overlay"
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
        v-if="isOpen && groupData"
        id="extrato-installment-drawer-panel"
        class="fixed top-0 right-0 bottom-0 w-full max-w-md bg-surface-elevated shadow-xl z-modal flex flex-col border-l border-default-subtle"
        role="dialog"
        aria-modal="true"
        :aria-label="`Parcelas: ${groupData.description}`"
      >
        <!-- Header -->
        <div class="flex items-center justify-between px-5 py-4 border-b border-default-subtle shrink-0">
          <div class="flex items-center gap-3 min-w-0">
            <div class="min-w-0">
              <h2 class="text-lg font-semibold text-content-main truncate">
                {{ groupData.description }}
              </h2>
              <div class="text-caption text-content-muted space-y-0.5 mt-1">
                <p>
                  {{ paymentSummary.totalCount }} parcelas · Total: {{ formatCurrency(paymentSummary.totalAmount) }}
                </p>
                <p v-if="paymentSummary.paidCount > 0" class="text-success">
                  Pago: {{ paymentSummary.paidCount }} {{ paymentSummary.paidCount === 1 ? 'parcela' : 'parcelas' }} · {{ formatCurrency(paymentSummary.paidAmount) }}
                </p>
                <p v-if="paymentSummary.remainingCount > 0" class="text-warning">
                  Faltam: {{ paymentSummary.remainingCount }} {{ paymentSummary.remainingCount === 1 ? 'parcela' : 'parcelas' }} · {{ formatCurrency(paymentSummary.remainingAmount) }}
                </p>
              </div>
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

        <!-- Lista de parcelas -->
        <div class="flex-1 min-h-0 overflow-y-auto px-5 py-4">
          <p class="text-body-sm font-medium text-content-muted mb-3">
            Parcelas ({{ groupData.installments.length }})
          </p>

          <ul class="space-y-2">
            <li
              v-for="inst in groupData.installments"
              :key="inst.id"
              class="flex items-center justify-between gap-2 py-2.5 px-3 rounded-xl hover:bg-surface-overlay transition-colors group border border-transparent hover:border-default-subtle"
            >
              <div class="min-w-0 flex-1">
                <span class="text-body-sm font-medium text-content-main block">
                  Parcela {{ inst.installmentNumber }}/{{ inst.totalInstallments }}
                </span>
                <span class="text-caption text-content-muted block mt-0.5">
                  {{ formatTransactionDate(inst.transactionDate) }}
                  <span v-if="inst.category" class="ml-1">· {{ inst.category.name }}</span>
                </span>
              </div>
              <div class="flex items-center gap-2 flex-shrink-0">
                <span
                  class="text-body-sm font-medium"
                  :class="inst.isPaid ? 'text-success' : 'text-content-main'"
                >
                  {{ formatCurrency(inst.amount) }}
                  <span v-if="inst.isPaid" class="text-caption font-normal text-success">(pago)</span>
                </span>
                <button
                  type="button"
                  class="p-1.5 rounded-lg text-content-subtle hover:bg-surface-overlay hover:text-content-main transition-colors"
                  aria-label="Editar parcela"
                  @click="emit('edit', inst.id)"
                >
                  <span class="material-symbols-outlined text-lg">edit</span>
                </button>
                <button
                  type="button"
                  class="p-1.5 rounded-lg text-content-subtle hover:text-error hover:bg-surface-overlay transition-colors"
                  aria-label="Excluir parcela"
                  @click="emit('delete', inst.id)"
                >
                  <span class="material-symbols-outlined text-lg">delete</span>
                </button>
              </div>
            </li>
          </ul>
        </div>
      </aside>
    </Transition>
  </Teleport>
</template>
