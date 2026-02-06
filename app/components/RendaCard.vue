<script setup lang="ts">
import { ref } from 'vue'

/**
 * RendaCard - Card individual de renda recorrente
 * Exibe informações de uma fonte de renda com menu de opções
 */

export interface RendaCardProps {
  id: string
  provedor: string
  valor: number
  diaRecebimento: number
  loading?: boolean
}

const props = withDefaults(defineProps<RendaCardProps>(), {
  loading: false,
})

const emit = defineEmits<{
  edit: [id: string]
  delete: [id: string]
}>()

const isMenuOpen = ref(false)

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value)
}

function formatDiaRecebimento(dia: number): string {
  if (dia === 1) return '1 de todo mês'
  return `${dia} de todo mês`
}

function toggleMenu() {
  isMenuOpen.value = !isMenuOpen.value
}

function closeMenu() {
  isMenuOpen.value = false
}

function handleEdit() {
  closeMenu()
  emit('edit', props.id)
}

function handleDelete() {
  closeMenu()
  emit('delete', props.id)
}
</script>

<template>
  <div
    id="renda-card"
    class="bg-surface-elevated rounded-xl p-4 relative"
  >
    <!-- Loading State -->
    <div v-if="loading" class="space-y-2">
      <div class="skeleton h-3 w-16 rounded" />
      <div class="skeleton h-4 w-20 rounded" />
      <div class="skeleton h-3 w-24 rounded" />
    </div>

    <!-- Content -->
    <div v-else>
      <!-- Header com menu -->
      <div class="flex items-start justify-between">
        <div class="flex-1">
          <p class="text-caption text-content-subtle mb-0.5">Provedor</p>
          <p class="text-body-sm font-medium text-content-main truncate">
            {{ provedor }}
          </p>
        </div>

        <!-- Menu Button -->
        <div class="relative">
          <button
            type="button"
            class="p-1 rounded-lg hover:bg-surface-tertiary transition-colors"
            @click.stop="toggleMenu"
          >
            <span class="material-symbols-outlined text-content-subtle text-lg">more_horiz</span>
          </button>

          <!-- Dropdown Menu -->
          <Transition name="fade">
            <div
              v-if="isMenuOpen"
              class="absolute right-0 top-full mt-1 w-32 bg-surface rounded-lg shadow-lg border border-default z-10"
            >
              <button
                type="button"
                class="w-full px-3 py-2 text-left text-body-sm text-content-main hover:bg-surface-elevated transition-colors flex items-center gap-2"
                @click="handleEdit"
              >
                <span class="material-symbols-outlined text-sm">edit</span>
                Editar
              </button>
              <button
                type="button"
                class="w-full px-3 py-2 text-left text-body-sm text-error hover:bg-surface-elevated transition-colors flex items-center gap-2"
                @click="handleDelete"
              >
                <span class="material-symbols-outlined text-sm">delete</span>
                Excluir
              </button>
            </div>
          </Transition>
        </div>
      </div>

      <!-- Valor -->
      <div class="mt-3">
        <p class="text-caption text-content-subtle mb-0.5">Valor</p>
        <p class="text-body-md font-semibold text-success">
          {{ formatCurrency(valor) }}
        </p>
      </div>

      <!-- Dia de recebimento -->
      <div class="mt-2 flex items-center justify-end">
        <p class="text-caption text-content-subtle">
          Dia do recebimento
        </p>
        <p class="text-caption text-content-main font-medium ml-2">
          {{ formatDiaRecebimento(diaRecebimento) }}
        </p>
      </div>
    </div>

    <!-- Overlay para fechar menu -->
    <div
      v-if="isMenuOpen"
      class="fixed inset-0 z-0"
      @click="closeMenu"
    />
  </div>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.15s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
