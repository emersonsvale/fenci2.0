<script setup lang="ts">
import { computed, ref } from 'vue'
import type { ExtratoTransaction } from '../composables/useExtrato'
import { useCurrency } from '~/composables/useCurrency'
import ProgressBar from './ProgressBar.vue'

const { formatCurrency } = useCurrency()

/**
 * ExtratoItem - Item individual da lista de extratos
 * Exibe informações de uma transação com ações
 */

export interface ExtratoItemProps {
  transaction: ExtratoTransaction
  loading?: boolean
  /** Se o item está selecionado (seleção múltipla no extrato) */
  selected?: boolean
}

const props = withDefaults(defineProps<ExtratoItemProps>(), {
  loading: false,
  selected: false,
})

const emit = defineEmits<{
  'mark-paid': [id: string]
  'mark-unpaid': [id: string]
  'edit': [id: string]
  'delete': [id: string]
  'edit-renda': [recurringId: string]
  'edit-saida': [recurringId: string]
  'mark-renda-received': [payload: { recurringId: string; transactionDate: string }]
  'toggle-select': [id: string]
  'pay-invoice': [payload: { creditCardId: string; invoiceId?: string; referenceMonth?: string; amount: number; dueDate?: string }]
}>()

const isRendaRecorrente = computed(() => props.transaction.isRendaRecorrente === true)
/** Saída recorrente: tanto virtual (ainda não lançada) quanto transação real com isRecurring */
const isSaidaRecorrente = computed(
  () => props.transaction.type === 'expense' && props.transaction.isRecurring === true
)
/** Saída recorrente virtual = ainda não lançada no mês (não deve marcar como pago pelo id) */
const isSaidaRecorrenteVirtual = computed(() => props.transaction.isSaidaRecorrente === true)
/** Linha de resumo da fatura do cartão (não editar como transação única; ação "Pagar fatura") */
const isFaturaSummary = computed(() => props.transaction.isFaturaSummary === true)

// Menu de ações
const isMenuOpen = ref(false)
// Hover no ícone (para mostrar seletor apenas ao passar o mouse no ícone)
const isIconHovered = ref(false)

function toggleMenu() {
  isMenuOpen.value = !isMenuOpen.value
}

function closeMenu() {
  isMenuOpen.value = false
}

// Formatação (valor exibido em valor absoluto)
function formatAmount(value: number): string {
  return formatCurrency(Math.abs(value))
}

function formatDate(date: Date): string {
  const day = date.getDate()
  const month = date.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '')
  const year = date.getFullYear()
  return `${day} ${month}\n${year} 21:00`
}

// Status badge (fatura = "Fatura" ou "Pago" se paga; renda/saída recorrente = "Renda"/"Saída" ou "Pago" quando pago)
const statusConfig = computed(() => {
  if (isFaturaSummary.value) {
    if (props.transaction.isPaid) {
      return {
        label: 'Pago',
        icon: 'check_circle',
        class: 'bg-success/10 text-success border-success/30',
      }
    }
    return {
      label: 'Fatura',
      icon: 'credit_card',
      class: 'bg-primary/10 text-primary border-primary/30',
    }
  }
  // Recorrentes (renda ou saída): sinalizar quando estiver pago
  const paidRecurringConfig = {
    label: 'Pago',
    icon: 'check_circle',
    class: 'bg-success/10 text-success border-success/30',
  }
  if (props.transaction.isRendaRecorrente) {
    if (props.transaction.isPaid) return paidRecurringConfig
    return {
      label: 'Renda',
      icon: 'repeat',
      class: 'bg-primary/10 text-primary border-primary/30',
    }
  }
  if (isSaidaRecorrente.value) {
    if (props.transaction.isPaid) return paidRecurringConfig
    return {
      label: 'Saída',
      icon: 'repeat',
      class: 'bg-error/10 text-error border-error/30',
    }
  }
  const configs = {
    pago: {
      label: 'Pago',
      icon: 'check_circle',
      class: 'bg-success/10 text-success border-success/30',
    },
    atrasado: {
      label: 'Atrasado',
      icon: 'warning',
      class: 'bg-error/10 text-error border-error/30',
    },
    aguardando: {
      label: 'Aguardando',
      icon: 'schedule',
      class: 'bg-warning/10 text-warning border-warning/30',
    },
  }
  return configs[props.transaction.status]
})

// Ícone da categoria (fatura = credit_card)
const categoryIcon = computed(() => {
  if (isFaturaSummary.value) return 'credit_card'
  return props.transaction.category?.icon || '💰'
})

// Cor de fundo do ícone
const iconBgColor = computed(() => {
  const color = props.transaction.category?.color
  if (!color) return 'bg-surface-overlay'
  return `bg-[${color}]/10`
})

// Valor com sinal
const displayAmount = computed(() => {
  const isIncome = props.transaction.type === 'income'
  const value = formatAmount(props.transaction.amount)
  return isIncome ? `+ ${value}` : value
})

const amountClass = computed(() => {
  return props.transaction.type === 'income' ? 'text-success' : 'text-content-main'
})

// Handlers
function handleMarkPaid() {
  closeMenu()
  emit('mark-paid', props.transaction.id)
}

function handleEdit() {
  closeMenu()
  if (props.transaction.isRendaRecorrente && props.transaction.recurringId) {
    emit('edit-renda', props.transaction.recurringId)
  } else if (isSaidaRecorrenteVirtual.value && props.transaction.recurringId) {
    emit('edit-saida', props.transaction.recurringId)
  } else {
    emit('edit', props.transaction.id)
  }
}

function handleMarkRendaReceived() {
  closeMenu()
  if (!props.transaction.recurringId) return
  const d = props.transaction.date
  const transactionDate = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
  emit('mark-renda-received', { recurringId: props.transaction.recurringId, transactionDate })
}

function handleMarkUnpaid() {
  closeMenu()
  emit('mark-unpaid', props.transaction.id)
}

function handleDelete() {
  closeMenu()
  emit('delete', props.transaction.id)
}

function handleToggleSelect() {
  if (isFaturaSummary.value) return
  emit('toggle-select', props.transaction.id)
}

function handlePayInvoice() {
  if (!props.transaction.creditCardId) return
  emit('pay-invoice', {
    creditCardId: props.transaction.creditCardId,
    invoiceId: props.transaction.invoiceId,
    referenceMonth: props.transaction.referenceMonth,
    amount: Math.abs(props.transaction.amount),
    dueDate: props.transaction.dueDate,
  })
  closeMenu()
}
</script>

<template>
  <div
    id="extrato-item"
    class="bg-surface-elevated rounded-xl p-4 flex items-center justify-between gap-4 hover:bg-surface-elevated/80 hover:shadow-md transition-all group shadow-xs border border-transparent hover:border-default-subtle"
  >
    <!-- Category Icon / Seletor (hover = mostra seletor; clique = toggle seleção) -->
    <button
      type="button"
      class="extrato-item-icon-wrapper w-11 h-11 rounded-xl flex items-center justify-center text-xl flex-shrink-0 shadow-sm transition-all cursor-pointer border-2 border-transparent hover:border-primary/50 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
      :class="[
        selected ? 'bg-success/20 border-success' : '',
        !selected && transaction.category?.color ? '' : !selected ? 'bg-surface-overlay' : ''
      ]"
      :style="!selected && transaction.category?.color ? { backgroundColor: `${transaction.category.color}25` } : {}"
      :aria-label="selected ? 'Desmarcar lançamento' : 'Selecionar lançamento'"
      @click.stop="handleToggleSelect"
      @mouseenter="isIconHovered = true"
      @mouseleave="isIconHovered = false"
    >
      <!-- Selecionado: ícone de check -->
      <span
        v-if="selected"
        class="material-symbols-outlined text-success text-2xl font-bold"
        aria-hidden="true"
      >
        check_circle
      </span>
      <!-- Não selecionado + hover no ícone: círculo vazio (seletor) -->
      <span
        v-else-if="!isFaturaSummary && isIconHovered"
        class="material-symbols-outlined text-primary text-2xl rounded-full border-2 border-primary bg-surface-elevated flex items-center justify-center"
        aria-hidden="true"
      >
        radio_button_unchecked
      </span>
      <!-- Fatura: ícone de cartão -->
      <span
        v-else-if="isFaturaSummary"
        class="material-symbols-outlined text-primary text-2xl"
        aria-hidden="true"
      >
        credit_card
      </span>
      <!-- Não selecionado: ícone da categoria -->
      <span
        v-else
        aria-hidden="true"
      >
        {{ categoryIcon }}
      </span>
    </button>

    <!-- Info -->
    <div class="flex-1 min-w-0">
      <!-- Title -->
      <div class="flex items-center gap-2">
        <p class="text-body-sm font-semibold text-content-main truncate">
          {{ transaction.description }}
        </p>
      </div>
      
      <!-- Category + Type -->
      <div class="flex items-center gap-2 mt-1">
        <span class="text-caption text-content-subtle">
          {{ isFaturaSummary ? 'Fatura do cartão' : (transaction.category?.name || 'Sem categoria') }}
        </span>
        <span class="w-1 h-1 rounded-full bg-content-subtle/50" />
        <span 
          class="text-caption font-medium"
          :class="transaction.type === 'income' ? 'text-success' : 'text-error/70'"
        >
          {{ transaction.type === 'income' ? 'Entrada' : 'Saída' }}
        </span>
      </div>
      <!-- Tags -->
      <div v-if="transaction.tags?.length" class="flex flex-wrap gap-1 mt-1.5">
        <span
          v-for="tag in transaction.tags"
          :key="tag"
          class="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] leading-tight bg-primary/10 text-primary border border-primary/20"
        >
          {{ tag }}
        </span>
      </div>
    </div>

    <!-- Date -->
    <div class="text-right flex-shrink-0 w-20">
      <p class="text-caption text-content-muted whitespace-pre-line leading-tight">
        {{ formatDate(transaction.date) }}
      </p>
    </div>

    <!-- Installment Progress: percentual já pago do lançamento parcelado (current/total parcelas) -->
    <div
      v-if="transaction.installmentInfo"
      class="flex flex-shrink-0 w-24 flex-col items-center justify-center"
      role="progressbar"
      :aria-valuenow="transaction.installmentInfo.current"
      :aria-valuemin="0"
      :aria-valuemax="transaction.installmentInfo.total"
      :aria-label="`Parcelado: ${transaction.installmentInfo.percentage}% pago (${transaction.installmentInfo.current} de ${transaction.installmentInfo.total} parcelas)`"
    >
      <div class="text-center mb-1">
        <span class="text-caption font-medium text-content-muted">
          {{ transaction.installmentInfo.percentage }}%
        </span>
      </div>
      <ProgressBar
        :value="transaction.installmentInfo.current"
        :max="transaction.installmentInfo.total"
        size="sm"
        :color="transaction.installmentInfo.percentage >= 100 ? '#22C55E' : '#F59E0B'"
      />
      <div class="text-center mt-0.5">
        <span class="text-caption text-content-subtle">
          {{ transaction.installmentInfo.current }}/{{ transaction.installmentInfo.total }}
        </span>
      </div>
    </div>

    <!-- Status Badge -->
    <div class="flex-shrink-0">
      <span
        class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-caption font-medium border shadow-sm"
        :class="statusConfig.class"
      >
        {{ statusConfig.label }}
        <span class="material-symbols-outlined text-sm">{{ statusConfig.icon }}</span>
      </span>
    </div>

    <!-- Amount -->
    <div class="flex-shrink-0 w-28 text-right">
      <p class="text-body-md font-bold" :class="amountClass">
        {{ displayAmount }}
      </p>
    </div>

    <!-- Actions Menu -->
    <div class="relative flex-shrink-0">
      <button
        type="button"
        class="p-2 rounded-lg hover:bg-surface-overlay text-content-subtle hover:text-content-main transition-all"
        @click.stop="toggleMenu"
      >
        <span class="material-symbols-outlined">more_vert</span>
      </button>

      <!-- Dropdown Menu -->
      <Teleport to="body">
        <div
          v-if="isMenuOpen"
          class="fixed inset-0 z-dropdown"
          @click="closeMenu"
        />
      </Teleport>
      
      <Transition
        enter-active-class="transition-all duration-200 ease-out"
        enter-from-class="opacity-0 scale-95 translate-y-1"
        enter-to-class="opacity-100 scale-100 translate-y-0"
        leave-active-class="transition-all duration-150 ease-in"
        leave-from-class="opacity-100 scale-100 translate-y-0"
        leave-to-class="opacity-0 scale-95 translate-y-1"
      >
        <div
          v-if="isMenuOpen"
          class="absolute right-0 top-full mt-1 w-48 bg-surface-elevated rounded-lg shadow-lg border border-default z-popover py-1"
        >
          <button
            :id="`btn-pagar-fatura-${transaction.id}`"
            v-if="isFaturaSummary && !transaction.isPaid"
            type="button"
            class="w-full px-3 py-2 text-left text-body-sm text-content-main hover:bg-surface-overlay flex items-center gap-2"
            @click.stop="handlePayInvoice"
          >
            <span class="material-symbols-outlined text-lg text-primary">credit_card</span>
            Pagar fatura
          </button>
          <button
            v-if="isRendaRecorrente && !isFaturaSummary"
            type="button"
            class="w-full px-3 py-2 text-left text-body-sm text-content-main hover:bg-surface-overlay flex items-center gap-2"
            @click="handleMarkRendaReceived"
          >
            <span class="material-symbols-outlined text-lg text-success">check_circle</span>
            Marcar como recebida
          </button>
          <button
            v-if="!isFaturaSummary && !isRendaRecorrente && !isSaidaRecorrenteVirtual && !transaction.isPaid"
            type="button"
            class="w-full px-3 py-2 text-left text-body-sm text-content-main hover:bg-surface-overlay flex items-center gap-2"
            @click="handleMarkPaid"
          >
            <span class="material-symbols-outlined text-lg text-success">check_circle</span>
            Marcar como pago
          </button>
          <button
            v-if="!isFaturaSummary && !isRendaRecorrente && !isSaidaRecorrenteVirtual && transaction.isPaid"
            type="button"
            class="w-full px-3 py-2 text-left text-body-sm text-content-main hover:bg-surface-overlay flex items-center gap-2"
            @click="handleMarkUnpaid"
          >
            <span class="material-symbols-outlined text-lg text-warning">cancel</span>
            {{ transaction.type === 'income' ? 'Não recebeu' : 'Não pagou' }}
          </button>
          <button
            v-if="!isFaturaSummary"
            type="button"
            class="w-full px-3 py-2 text-left text-body-sm text-content-main hover:bg-surface-overlay flex items-center gap-2"
            @click="handleEdit"
          >
            <span class="material-symbols-outlined text-lg">{{ isRendaRecorrente || isSaidaRecorrenteVirtual ? 'account_balance' : 'edit' }}</span>
            {{ isRendaRecorrente || isSaidaRecorrenteVirtual ? 'Ver em Contas' : 'Editar' }}
          </button>
          <button
            v-if="!isFaturaSummary && !isRendaRecorrente && !isSaidaRecorrenteVirtual"
            type="button"
            class="w-full px-3 py-2 text-left text-body-sm text-error hover:bg-surface-overlay flex items-center gap-2"
            @click="handleDelete"
          >
            <span class="material-symbols-outlined text-lg">delete</span>
            Excluir
          </button>
        </div>
      </Transition>
    </div>
  </div>
</template>
