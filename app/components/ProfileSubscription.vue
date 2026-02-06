<script setup lang="ts">
import { computed } from 'vue'
import { useProfile } from '~/composables/useProfile'
import AppButton from './AppButton.vue'

/**
 * ProfileSubscription - Seção de assinatura do perfil
 */

const { 
  profile, 
  subscriptionStatusLabel, 
  trialDaysRemaining, 
  openStripePortal,
  isLoading 
} = useProfile()

const statusInfo = computed(() => {
  const status = profile.value?.subscription_status || 'trial'
  
  const info: Record<string, { icon: string; color: string; description: string }> = {
    trial: {
      icon: 'hourglass_empty',
      color: 'text-amber-600 dark:text-amber-400',
      description: `Você está no período de teste. Faltam ${trialDaysRemaining.value} dias.`
    },
    active: {
      icon: 'check_circle',
      color: 'text-emerald-600 dark:text-emerald-400',
      description: 'Sua assinatura está ativa. Obrigado por apoiar o Fenci!'
    },
    cancelled: {
      icon: 'cancel',
      color: 'text-red-600 dark:text-red-400',
      description: 'Sua assinatura foi cancelada. Você ainda tem acesso até o fim do período pago.'
    },
    expired: {
      icon: 'error',
      color: 'text-gray-600 dark:text-gray-400',
      description: 'Sua assinatura expirou. Renove para continuar usando o Fenci.'
    }
  }
  
  return info[status] || info.trial
})

const plans = [
  {
    id: 'free',
    name: 'Gratuito',
    price: 'R$ 0',
    period: '/mês',
    features: [
      'Controle de gastos básico',
      '1 conta bancária',
      '1 cartão de crédito',
      'Relatórios mensais'
    ],
    current: false,
    highlight: false
  },
  {
    id: 'premium',
    name: 'Premium',
    price: 'R$ 14,90',
    period: '/mês',
    features: [
      'Contas e cartões ilimitados',
      'Metas financeiras',
      'Investimentos',
      'Notificações avançadas',
      'Exportação de dados',
      'Suporte prioritário'
    ],
    current: true,
    highlight: true
  }
]

async function handleManageSubscription(): Promise<void> {
  const url = await openStripePortal()
  if (url) {
    window.open(url, '_blank')
  } else {
    // Por enquanto, mostra alerta informativo
    alert('Portal de assinatura em breve! Por enquanto, entre em contato conosco.')
  }
}
</script>

<template>
  <div id="profile-subscription" class="space-y-8">
    <div>
      <h2 class="text-lg font-semibold text-content-primary dark:text-content-primary-dark mb-1">
        Assinatura
      </h2>
      <p class="text-sm text-content-secondary dark:text-content-secondary-dark">
        Gerencie seu plano e faturamento
      </p>
    </div>

    <!-- Status Atual -->
    <div class="p-6 rounded-xl bg-surface-light-secondary dark:bg-surface-dark-secondary border border-border-light dark:border-border-dark">
      <div class="flex items-start gap-4">
        <span 
          class="material-symbols-outlined text-3xl"
          :class="statusInfo.color"
        >
          {{ statusInfo.icon }}
        </span>
        <div class="flex-1">
          <h3 class="font-semibold text-content-primary dark:text-content-primary-dark text-lg">
            {{ subscriptionStatusLabel }}
          </h3>
          <p class="text-content-secondary dark:text-content-secondary-dark mt-1">
            {{ statusInfo.description }}
          </p>
          
          <div class="mt-4 flex flex-wrap gap-3">
            <AppButton
              variant="outline"
              :loading="isLoading"
              @click="handleManageSubscription"
            >
              <span class="material-symbols-outlined text-lg">credit_card</span>
              Gerenciar assinatura
            </AppButton>
          </div>
        </div>
      </div>
    </div>

    <!-- Planos -->
    <div>
      <h3 class="font-medium text-content-primary dark:text-content-primary-dark mb-4">
        Planos disponíveis
      </h3>
      
      <div class="grid md:grid-cols-2 gap-4">
        <div 
          v-for="plan in plans" 
          :key="plan.id"
          class="p-6 rounded-xl border-2 transition-colors duration-200"
          :class="[
            plan.highlight 
              ? 'border-primary bg-primary/5' 
              : 'border-default bg-surface-elevated'
          ]"
        >
          <div class="flex items-center justify-between mb-4">
            <h4 class="text-lg font-semibold text-content-primary dark:text-content-primary-dark">
              {{ plan.name }}
            </h4>
            <span 
              v-if="plan.current" 
              class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary"
            >
              Atual
            </span>
          </div>
          
          <div class="mb-4">
            <span class="text-3xl font-bold text-content-primary dark:text-content-primary-dark">
              {{ plan.price }}
            </span>
            <span class="text-content-tertiary dark:text-content-tertiary-dark">{{ plan.period }}</span>
          </div>

          <ul class="space-y-2">
            <li 
              v-for="feature in plan.features" 
              :key="feature"
              class="flex items-center gap-2 text-sm text-content-secondary dark:text-content-secondary-dark"
            >
              <span class="material-symbols-outlined text-lg text-emerald-500">check</span>
              {{ feature }}
            </li>
          </ul>

          <button
            v-if="!plan.current"
            type="button"
            class="mt-6 w-full py-2 px-4 rounded-lg border-2 border-primary text-primary font-medium hover:bg-primary hover:text-white transition-colors duration-200"
          >
            Selecionar
          </button>
        </div>
      </div>
    </div>

    <!-- Info -->
    <div class="p-4 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
      <div class="flex items-start gap-3">
        <span class="material-symbols-outlined text-blue-600 dark:text-blue-400">info</span>
        <div class="text-sm text-blue-700 dark:text-blue-300">
          <p class="font-medium">Pagamentos seguros via Stripe</p>
          <p class="mt-1 text-blue-600 dark:text-blue-400">
            Seus dados de pagamento são processados de forma segura pela Stripe. 
            Não armazenamos dados do seu cartão.
          </p>
        </div>
      </div>
    </div>
  </div>
</template>
