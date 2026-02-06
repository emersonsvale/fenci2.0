<script setup lang="ts">
import { ref, watch, onMounted } from 'vue'
import { useProfile } from '~/composables/useProfile'
import AppButton from './AppButton.vue'

/**
 * ProfileNotifications - Seção de preferências de notificação
 */

const { 
  notificationPreferences, 
  updateNotificationPreferences, 
  loadNotificationPreferences,
  isLoading 
} = useProfile()

// Canais
const emailEnabled = ref(true)
const pushEnabled = ref(true)
const whatsappEnabled = ref(false)

// Tipos
const notifyDueDates = ref(true)
const notifyOverdue = ref(true)
const notifyLargeExpenses = ref(true)
const notifyBudgetAlerts = ref(true)
const notifyGoalProgress = ref(true)
const notifyWeeklySummary = ref(true)
const notifyMonthlyReport = ref(true)

// Configurações
const dueDateDaysBefore = ref(3)
const largeExpenseThreshold = ref(500)

const successMessage = ref('')
const localError = ref('')

// Sincroniza com preferências
watch(notificationPreferences, (prefs) => {
  if (prefs) {
    emailEnabled.value = prefs.email_enabled ?? true
    pushEnabled.value = prefs.push_enabled ?? true
    whatsappEnabled.value = prefs.whatsapp_enabled ?? false
    notifyDueDates.value = prefs.notify_due_dates ?? true
    notifyOverdue.value = prefs.notify_overdue ?? true
    notifyLargeExpenses.value = prefs.notify_large_expenses ?? true
    notifyBudgetAlerts.value = prefs.notify_budget_alerts ?? true
    notifyGoalProgress.value = prefs.notify_goal_progress ?? true
    notifyWeeklySummary.value = prefs.notify_weekly_summary ?? true
    notifyMonthlyReport.value = prefs.notify_monthly_report ?? true
    dueDateDaysBefore.value = prefs.due_date_days_before ?? 3
    largeExpenseThreshold.value = prefs.large_expense_threshold ?? 500
  }
}, { immediate: true })

onMounted(async () => {
  if (!notificationPreferences.value) {
    await loadNotificationPreferences()
  }
})

async function handleSave(): Promise<void> {
  successMessage.value = ''
  localError.value = ''

  const success = await updateNotificationPreferences({
    email_enabled: emailEnabled.value,
    push_enabled: pushEnabled.value,
    whatsapp_enabled: whatsappEnabled.value,
    notify_due_dates: notifyDueDates.value,
    notify_overdue: notifyOverdue.value,
    notify_large_expenses: notifyLargeExpenses.value,
    notify_budget_alerts: notifyBudgetAlerts.value,
    notify_goal_progress: notifyGoalProgress.value,
    notify_weekly_summary: notifyWeeklySummary.value,
    notify_monthly_report: notifyMonthlyReport.value,
    due_date_days_before: dueDateDaysBefore.value,
    large_expense_threshold: largeExpenseThreshold.value
  })

  if (success) {
    successMessage.value = 'Preferências de notificação salvas!'
    setTimeout(() => { successMessage.value = '' }, 3000)
  } else {
    localError.value = 'Erro ao salvar preferências'
  }
}
</script>

<template>
  <div id="profile-notifications" class="space-y-8">
    <div>
      <h2 class="text-lg font-semibold text-content-primary dark:text-content-primary-dark mb-1">
        Notificações
      </h2>
      <p class="text-sm text-content-secondary dark:text-content-secondary-dark">
        Configure como e quando deseja receber alertas
      </p>
    </div>

    <form class="space-y-8" @submit.prevent="handleSave">
      <!-- Canais de Notificação -->
      <div class="space-y-4">
        <h3 class="font-medium text-content-primary dark:text-content-primary-dark">
          Canais de notificação
        </h3>
        
        <div class="space-y-3">
          <label class="flex items-center justify-between gap-4 p-4 rounded-xl bg-surface-light-secondary dark:bg-surface-dark-secondary border border-border-light dark:border-border-dark cursor-pointer transition-colors duration-200 hover:border-primary/30">
            <div class="flex-1">
              <span class="font-medium">E-mail</span>
              <p class="text-sm text-content-tertiary dark:text-content-tertiary-dark">Receber notificações por e-mail</p>
            </div>
            <input v-model="emailEnabled" type="checkbox" class="toggle-input" />
          </label>

          <label class="flex items-center justify-between gap-4 p-4 rounded-xl bg-surface-light-secondary dark:bg-surface-dark-secondary border border-border-light dark:border-border-dark cursor-pointer transition-colors duration-200 hover:border-primary/30">
            <div class="flex-1">
              <span class="font-medium">Push</span>
              <p class="text-sm text-content-tertiary dark:text-content-tertiary-dark">Notificações no navegador</p>
            </div>
            <input v-model="pushEnabled" type="checkbox" class="toggle-input" />
          </label>

          <label class="flex items-center justify-between gap-4 p-4 rounded-xl bg-surface-light-secondary dark:bg-surface-dark-secondary border border-border-light dark:border-border-dark cursor-pointer transition-colors duration-200 opacity-60">
            <div class="flex-1">
              <span class="font-medium">WhatsApp</span>
              <p class="text-sm text-content-tertiary dark:text-content-tertiary-dark">Em breve</p>
            </div>
            <input v-model="whatsappEnabled" type="checkbox" class="toggle-input" disabled />
          </label>
        </div>
      </div>

      <!-- Tipos de Notificação -->
      <div class="space-y-4">
        <h3 class="font-medium text-content-primary dark:text-content-primary-dark">
          Tipos de notificação
        </h3>
        
        <div class="space-y-3">
          <label class="flex items-center justify-between gap-4 p-4 rounded-xl bg-surface-light-secondary dark:bg-surface-dark-secondary border border-border-light dark:border-border-dark cursor-pointer transition-colors duration-200 hover:border-primary/30">
            <div class="flex-1">
              <span class="font-medium">Vencimentos próximos</span>
              <p class="text-sm text-content-tertiary dark:text-content-tertiary-dark">Aviso de contas a vencer</p>
            </div>
            <input v-model="notifyDueDates" type="checkbox" class="toggle-input" />
          </label>

          <label class="flex items-center justify-between gap-4 p-4 rounded-xl bg-surface-light-secondary dark:bg-surface-dark-secondary border border-border-light dark:border-border-dark cursor-pointer transition-colors duration-200 hover:border-primary/30">
            <div class="flex-1">
              <span class="font-medium">Contas atrasadas</span>
              <p class="text-sm text-content-tertiary dark:text-content-tertiary-dark">Alerta de contas vencidas</p>
            </div>
            <input v-model="notifyOverdue" type="checkbox" class="toggle-input" />
          </label>

          <label class="flex items-center justify-between gap-4 p-4 rounded-xl bg-surface-light-secondary dark:bg-surface-dark-secondary border border-border-light dark:border-border-dark cursor-pointer transition-colors duration-200 hover:border-primary/30">
            <div class="flex-1">
              <span class="font-medium">Gastos grandes</span>
              <p class="text-sm text-content-tertiary dark:text-content-tertiary-dark">Aviso de despesas acima do limite</p>
            </div>
            <input v-model="notifyLargeExpenses" type="checkbox" class="toggle-input" />
          </label>

          <label class="flex items-center justify-between gap-4 p-4 rounded-xl bg-surface-light-secondary dark:bg-surface-dark-secondary border border-border-light dark:border-border-dark cursor-pointer transition-colors duration-200 hover:border-primary/30">
            <div class="flex-1">
              <span class="font-medium">Alertas de orçamento</span>
              <p class="text-sm text-content-tertiary dark:text-content-tertiary-dark">Quando atingir limite do orçamento</p>
            </div>
            <input v-model="notifyBudgetAlerts" type="checkbox" class="toggle-input" />
          </label>

          <label class="flex items-center justify-between gap-4 p-4 rounded-xl bg-surface-light-secondary dark:bg-surface-dark-secondary border border-border-light dark:border-border-dark cursor-pointer transition-colors duration-200 hover:border-primary/30">
            <div class="flex-1">
              <span class="font-medium">Progresso de metas</span>
              <p class="text-sm text-content-tertiary dark:text-content-tertiary-dark">Atualizações sobre suas metas</p>
            </div>
            <input v-model="notifyGoalProgress" type="checkbox" class="toggle-input" />
          </label>

          <label class="flex items-center justify-between gap-4 p-4 rounded-xl bg-surface-light-secondary dark:bg-surface-dark-secondary border border-border-light dark:border-border-dark cursor-pointer transition-colors duration-200 hover:border-primary/30">
            <div class="flex-1">
              <span class="font-medium">Resumo semanal</span>
              <p class="text-sm text-content-tertiary dark:text-content-tertiary-dark">Relatório semanal de gastos</p>
            </div>
            <input v-model="notifyWeeklySummary" type="checkbox" class="toggle-input" />
          </label>

          <label class="flex items-center justify-between gap-4 p-4 rounded-xl bg-surface-light-secondary dark:bg-surface-dark-secondary border border-border-light dark:border-border-dark cursor-pointer transition-colors duration-200 hover:border-primary/30">
            <div class="flex-1">
              <span class="font-medium">Relatório mensal</span>
              <p class="text-sm text-content-tertiary dark:text-content-tertiary-dark">Análise mensal completa</p>
            </div>
            <input v-model="notifyMonthlyReport" type="checkbox" class="toggle-input" />
          </label>
        </div>
      </div>

      <!-- Configurações -->
      <div class="space-y-4 max-w-md">
        <h3 class="font-medium text-content-primary dark:text-content-primary-dark">
          Configurações
        </h3>
        
        <div>
          <label 
            for="due-days" 
            class="block text-sm font-medium text-content-primary dark:text-content-primary-dark mb-2"
          >
            Dias de antecedência para vencimentos
          </label>
          <select id="due-days" v-model.number="dueDateDaysBefore" class="input-field">
            <option :value="1">1 dia antes</option>
            <option :value="2">2 dias antes</option>
            <option :value="3">3 dias antes</option>
            <option :value="5">5 dias antes</option>
            <option :value="7">7 dias antes</option>
          </select>
        </div>

        <div>
          <label 
            for="large-expense" 
            class="block text-sm font-medium text-content-primary dark:text-content-primary-dark mb-2"
          >
            Valor considerado gasto grande
          </label>
          <div class="relative">
            <span class="absolute left-4 top-1/2 -translate-y-1/2 text-content-tertiary dark:text-content-tertiary-dark">R$</span>
            <input
              id="large-expense"
              v-model.number="largeExpenseThreshold"
              type="number"
              min="0"
              step="50"
              class="input-field pl-10"
            />
          </div>
        </div>
      </div>

      <!-- Messages -->
      <div 
        v-if="successMessage" 
        class="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800"
      >
        <p class="text-sm text-emerald-600 dark:text-emerald-400">{{ successMessage }}</p>
      </div>

      <div 
        v-if="localError" 
        class="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800"
      >
        <p class="text-sm text-red-600 dark:text-red-400">{{ localError }}</p>
      </div>

      <AppButton
        type="submit"
        :loading="isLoading"
        loading-label="Salvando..."
        class="max-w-md"
      >
        Salvar preferências
      </AppButton>
    </form>
  </div>
</template>

<style scoped>
.toggle-input {
  width: 2.75rem;
  height: 1.5rem;
  border-radius: 9999px;
  appearance: none;
  cursor: pointer;
  background-color: #D1D5DB;
  position: relative;
  transition: background-color 0.3s;
}

.dark .toggle-input {
  background-color: #4B5563;
}

.toggle-input:checked {
  background-color: #22C55E;
}

.toggle-input::before {
  content: '';
  position: absolute;
  top: 0.25rem;
  left: 0.25rem;
  width: 1rem;
  height: 1rem;
  border-radius: 9999px;
  background-color: white;
  transition: transform 0.3s;
}

.toggle-input:checked::before {
  transform: translateX(1.25rem);
}

.toggle-input:disabled {
  cursor: not-allowed;
  opacity: 0.5;
}
</style>
