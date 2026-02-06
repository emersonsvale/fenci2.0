<script setup lang="ts">
import { ref } from 'vue'
import type { PlanningInstallment } from 'shared/types/database.types'
import { useCurrency } from '~/composables/useCurrency'
import ConfirmDeleteModal from './ConfirmDeleteModal.vue'

const { formatCurrency } = useCurrency()

const props = defineProps<{
  installments: PlanningInstallment[]
  isLoading?: boolean
}>()

const emit = defineEmits<{
  markPaid: [id: string, paid: boolean]
  delete: [id: string]
}>()

const isDeleteModalOpen = ref(false)
const installmentToDelete = ref<PlanningInstallment | null>(null)


function formatDate(dateStr: string) {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

function togglePaid(inst: PlanningInstallment) {
  emit('markPaid', inst.id, !inst.paid_at)
}

function openDelete(inst: PlanningInstallment) {
  installmentToDelete.value = inst
  isDeleteModalOpen.value = true
}

function closeDeleteModal() {
  isDeleteModalOpen.value = false
  installmentToDelete.value = null
}

function confirmDelete() {
  if (installmentToDelete.value) {
    emit('delete', installmentToDelete.value.id)
    closeDeleteModal()
  }
}
</script>

<template>
  <div class="space-y-4">
    <h4 class="text-body-md font-medium text-content-main">
      Parcelas
    </h4>
    <div v-if="isLoading" class="flex justify-center py-6">
      <span class="material-symbols-outlined animate-spin text-2xl text-content-tertiary">progress_activity</span>
    </div>
    <ul v-else-if="installments.length === 0" class="rounded-xl border border-default bg-surface-elevated p-6 text-center text-body-sm text-content-subtle">
      Nenhuma parcela cadastrada.
    </ul>
    <ul v-else class="space-y-2">
      <li
        v-for="inst in installments"
        :key="inst.id"
        class="flex items-center justify-between gap-4 rounded-lg border border-default bg-surface-elevated px-4 py-3"
        :class="{ 'opacity-70': inst.paid_at }"
      >
        <div class="min-w-0 flex-1">
          <p class="text-body-sm font-medium text-content-main">
            {{ inst.description || `Parcela ${inst.installment_number}/${inst.total_installments}` }}
          </p>
          <p class="text-caption text-content-subtle">
            Vencimento: {{ formatDate(inst.due_date) }}
          </p>
        </div>
        <div class="flex items-center gap-3 shrink-0">
          <span class="text-body-sm font-medium text-content-main">
            {{ formatCurrency(Number(inst.amount)) }}
          </span>
          <button
            type="button"
            :title="inst.paid_at ? 'Marcar como não pago' : 'Marcar como pago'"
            class="p-2 rounded-lg transition-colors"
            :class="inst.paid_at ? 'bg-success/20 text-success' : 'hover:bg-surface-overlay text-content-subtle'"
            @click="togglePaid(inst)"
          >
            <span class="material-symbols-outlined text-lg">
              {{ inst.paid_at ? 'check_circle' : 'radio_button_unchecked' }}
            </span>
          </button>
          <button
            type="button"
            class="p-2 rounded-lg hover:bg-error/10 text-content-subtle hover:text-error"
            title="Excluir"
            @click="openDelete(inst)"
          >
            <span class="material-symbols-outlined text-lg">delete</span>
          </button>
        </div>
      </li>
    </ul>

    <ConfirmDeleteModal
      :is-open="isDeleteModalOpen"
      title="Excluir parcela"
      message="Tem certeza que deseja excluir esta parcela?"
      @confirm="confirmDelete"
      @cancel="closeDeleteModal"
    />
  </div>
</template>
