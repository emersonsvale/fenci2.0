<script setup lang="ts">
import { computed } from 'vue'
import { useCurrency } from '~/composables/useCurrency'

const { formatCurrency } = useCurrency()

/**
 * ProviderCard - Card de provedor/fornecedor
 * Exibe informações de um provedor com valor associado
 */

export interface Provider {
  id: string
  name: string
  type: string
  value: number
  icon?: string
  color?: string
}

export interface ProviderCardProps {
  providers: Provider[]
  loading?: boolean
  maxItems?: number
}

const props = withDefaults(defineProps<ProviderCardProps>(), {
  loading: false,
  maxItems: 4,
})

const emit = defineEmits<{
  'view-all': []
  'item-click': [provider: Provider]
}>()

const displayedProviders = computed(() => {
  return props.providers.slice(0, props.maxItems)
})

const hasMore = computed(() => props.providers.length > props.maxItems)

</script>

<template>
  <div id="provider-card" class="space-y-3">
    <!-- Loading State -->
    <template v-if="loading">
      <div v-for="i in 4" :key="i" class="bg-surface-elevated rounded-xl p-3 shadow-xs">
        <div class="flex items-center gap-3">
          <div class="skeleton w-9 h-9 rounded-full" />
          <div class="flex-1 space-y-1">
            <div class="skeleton h-3 w-16 rounded" />
            <div class="skeleton h-4 w-20 rounded" />
          </div>
          <div class="text-right space-y-1">
            <div class="skeleton h-4 w-14 rounded" />
            <div class="skeleton h-3 w-10 rounded" />
          </div>
        </div>
      </div>
    </template>

    <!-- Provider Items -->
    <template v-else>
      <div
        v-for="provider in displayedProviders"
        :key="provider.id"
        class="bg-surface-elevated rounded-xl p-3 shadow-xs hover:shadow-sm cursor-pointer transition-shadow"
        @click="emit('item-click', provider)"
      >
        <div class="flex items-center gap-3">
          <!-- Icon/Avatar -->
          <div
            class="w-9 h-9 rounded-full flex items-center justify-center text-white font-medium text-sm"
            :style="{ backgroundColor: provider.color || '#9CA3AF' }"
          >
            <span v-if="provider.icon" class="material-symbols-outlined text-lg">{{ provider.icon }}</span>
            <span v-else>{{ provider.name.charAt(0) }}</span>
          </div>

          <!-- Info -->
          <div class="flex-1 min-w-0">
            <p class="text-caption text-content-subtle">Provedor</p>
            <p class="text-body-sm font-medium text-content-main truncate">{{ provider.name }}</p>
          </div>

          <!-- Value -->
          <div class="text-right">
            <p class="text-body-sm font-semibold text-error">{{ formatCurrency(provider.value) }}</p>
            <p class="text-caption text-content-subtle">{{ provider.type }}</p>
          </div>
        </div>

        <!-- Action text -->
        <p class="text-caption text-content-subtle mt-2 text-right">Enviar notificação</p>
      </div>

      <!-- View All Button -->
      <button
        v-if="hasMore || providers.length > 0"
        type="button"
        class="w-full py-3 rounded-xl bg-primary text-white font-medium text-body-sm hover:bg-primary-600 transition-colors"
        @click="emit('view-all')"
      >
        Ver mais
      </button>

      <!-- Empty State -->
      <div
        v-if="providers.length === 0"
        class="text-center py-6 bg-surface-elevated rounded-xl shadow-xs text-content-subtle"
      >
        <span class="material-symbols-outlined text-3xl mb-2 block">store</span>
        <p class="text-body-sm">Nenhum provedor cadastrado</p>
      </div>
    </template>
  </div>
</template>
