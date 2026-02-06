<script setup lang="ts">
import { ref } from 'vue'
import { useProfile } from '~/composables/useProfile'
import AppButton from './AppButton.vue'

/**
 * ProfileDangerZone - Seção de ações perigosas (exportar dados, excluir conta)
 */

const { exportUserData, deleteAccount, isLoading } = useProfile()

const showDeleteConfirm = ref(false)
const deleteConfirmText = ref('')
const localError = ref('')

async function handleExportData(): Promise<void> {
  localError.value = ''
  
  const blob = await exportUserData()
  if (blob) {
    // Cria link de download
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `fenci-dados-${new Date().toISOString().split('T')[0]}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  } else {
    localError.value = 'Erro ao exportar dados. Tente novamente.'
  }
}

async function handleDeleteAccount(): Promise<void> {
  if (deleteConfirmText.value !== 'EXCLUIR') {
    localError.value = 'Digite EXCLUIR para confirmar'
    return
  }

  const result = await deleteAccount()
  
  if (result.success) {
    await navigateTo('/login')
  } else {
    localError.value = result.message
  }
}

function cancelDelete(): void {
  showDeleteConfirm.value = false
  deleteConfirmText.value = ''
  localError.value = ''
}
</script>

<template>
  <div id="profile-danger-zone" class="space-y-8">
    <div>
      <h2 class="text-lg font-semibold text-content-primary dark:text-content-primary-dark mb-1">
        Gerenciamento de conta
      </h2>
      <p class="text-sm text-content-secondary dark:text-content-secondary-dark">
        Exportar dados e opções avançadas
      </p>
    </div>

    <!-- Exportar Dados -->
    <div class="p-6 rounded-xl bg-surface-light-secondary dark:bg-surface-dark-secondary border border-border-light dark:border-border-dark">
      <div class="flex items-start gap-4">
        <span class="material-symbols-outlined text-2xl text-primary">download</span>
        <div class="flex-1">
          <h3 class="font-medium text-content-primary dark:text-content-primary-dark">
            Exportar dados
          </h3>
          <p class="text-sm text-content-secondary dark:text-content-secondary-dark mt-1">
            Baixe todos os seus dados em formato JSON. Inclui transações, contas, categorias, metas e mais.
          </p>
          <AppButton
            variant="outline"
            class="mt-4"
            :loading="isLoading"
            @click="handleExportData"
          >
            <span class="material-symbols-outlined text-lg">file_download</span>
            Exportar meus dados
          </AppButton>
        </div>
      </div>
    </div>

    <!-- Zona de Perigo -->
    <div class="p-6 rounded-xl border-2 border-red-200 dark:border-red-900 bg-red-50/50 dark:bg-red-900/10">
      <div class="flex items-center gap-2 mb-4">
        <span class="material-symbols-outlined text-error">warning</span>
        <h3 class="font-semibold text-error">Zona de perigo</h3>
      </div>

      <!-- Excluir Conta -->
      <div v-if="!showDeleteConfirm">
        <p class="text-sm text-content-secondary dark:text-content-secondary-dark mb-4">
          A exclusão da conta é permanente. Todos os seus dados serão removidos e não poderão ser recuperados.
        </p>
        <button
          type="button"
          class="px-4 py-2 rounded-lg border-2 border-error text-error font-medium hover:bg-error hover:text-white transition-colors duration-200"
          @click="showDeleteConfirm = true"
        >
          Excluir minha conta
        </button>
      </div>

      <!-- Confirmação de Exclusão -->
      <div v-else class="space-y-4">
        <div class="p-4 rounded-lg bg-red-100 dark:bg-red-900/30 border border-red-200 dark:border-red-800">
          <p class="text-sm text-red-700 dark:text-red-300 font-medium">
            Você está prestes a excluir sua conta permanentemente.
          </p>
          <ul class="mt-2 text-sm text-red-600 dark:text-red-400 list-disc list-inside space-y-1">
            <li>Todas as suas transações serão apagadas</li>
            <li>Suas contas e cartões serão removidos</li>
            <li>Suas metas e orçamentos serão excluídos</li>
            <li>Esta ação não pode ser desfeita</li>
          </ul>
        </div>

        <div>
          <label 
            for="delete-confirm" 
            class="block text-sm font-medium text-content-primary dark:text-content-primary-dark mb-2"
          >
            Digite <strong>EXCLUIR</strong> para confirmar
          </label>
          <input
            id="delete-confirm"
            v-model="deleteConfirmText"
            type="text"
            class="input-field max-w-xs"
            placeholder="EXCLUIR"
          />
        </div>

        <!-- Error -->
        <div 
          v-if="localError" 
          class="p-3 rounded-lg bg-red-100 dark:bg-red-900/30 border border-red-200 dark:border-red-800"
        >
          <p class="text-sm text-red-600 dark:text-red-400">{{ localError }}</p>
        </div>

        <div class="flex items-center gap-3">
          <button
            type="button"
            class="px-4 py-2 rounded-lg bg-error text-white font-medium hover:bg-red-700 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            :disabled="isLoading || deleteConfirmText !== 'EXCLUIR'"
            @click="handleDeleteAccount"
          >
            <span v-if="isLoading">Excluindo...</span>
            <span v-else>Confirmar exclusão</span>
          </button>
          <button
            type="button"
            class="px-4 py-2 rounded-lg border border-border-light dark:border-border-dark text-content-secondary hover:bg-surface-light-tertiary dark:hover:bg-surface-dark-tertiary transition-colors duration-200"
            @click="cancelDelete"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
