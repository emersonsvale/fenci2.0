<script setup lang="ts">
import { computed } from 'vue'
import { useCurrency } from '~/composables/useCurrency'

/**
 * ContasCategorySection - Seção de categorias (entrada ou saída)
 * Lista categorias com ícone/emoji, permite adicionar novas
 */

export interface CategoryItem {
  id: string
  name: string
  icon: string | null
  color: string
  totalAmount?: number
}

export interface ContasCategorySectionProps {
  title: string
  categories: CategoryItem[]
  loading?: boolean
  maxItems?: number
}

const props = withDefaults(defineProps<ContasCategorySectionProps>(), {
  loading: false,
  maxItems: 5,
})

const emit = defineEmits<{
  add: []
  'view-all': []
  'item-click': [category: CategoryItem]
}>()

const displayedCategories = computed(() => {
  return props.categories.slice(0, props.maxItems)
})

const hasMore = computed(() => props.categories.length > props.maxItems)

// Verifica se é um emoji (caracteres especiais unicode)
function isEmoji(str: string | null): boolean {
  if (!str) return false
  // Regex para detectar emojis
  const emojiRegex = /[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]|[\u{1F600}-\u{1F64F}]|[\u{1F680}-\u{1F6FF}]/u
  return emojiRegex.test(str)
}

// Ícone padrão baseado no nome da categoria (para categorias sem emoji)
function getMaterialIcon(category: CategoryItem): string {
  // Ícones padrão baseados em nomes comuns
  const iconMap: Record<string, string> = {
    salário: 'payments',
    salario: 'payments',
    freelancer: 'work',
    dividendos: 'trending_up',
    'dividendos fii': 'trending_up',
    outros: 'more_horiz',
    'vale apps': 'smartphone',
    educação: 'school',
    educacao: 'school',
    farmácia: 'local_pharmacy',
    farmacia: 'local_pharmacy',
    casa: 'home',
    transporte: 'directions_car',
    investimentos: 'savings',
    alimentação: 'restaurant',
    alimentacao: 'restaurant',
    lazer: 'sports_esports',
    saúde: 'favorite',
    saude: 'favorite',
  }

  const nameLower = category.name.toLowerCase()
  return iconMap[nameLower] || 'category'
}

const { formatCurrency } = useCurrency()
</script>

<template>
  <div
    id="contas-category-section"
    class="bg-surface-elevated rounded-xl p-5 shadow-xs border border-default-subtle h-full min-h-0 flex flex-col"
  >
    <!-- Header (sempre visível) -->
    <div class="flex items-center justify-between mb-4 shrink-0">
      <h3 class="text-body-md font-semibold text-content-main">
        {{ title }}
      </h3>
      <button
        type="button"
        class="p-1.5 rounded-lg hover:bg-surface-overlay transition-colors"
        @click="emit('add')"
      >
        <span class="material-symbols-outlined text-content-tertiary text-lg">add_circle</span>
      </button>
    </div>

    <!-- Área rolável: só a lista (categorias ou loading) -->
    <div class="flex-1 min-h-0 overflow-auto">
      <!-- Loading State -->
      <div v-if="loading" class="space-y-3">
        <div v-for="i in 5" :key="i" class="flex items-center gap-3">
          <div class="skeleton w-8 h-8 rounded-full" />
          <div class="skeleton h-4 w-24 rounded" />
        </div>
      </div>

      <!-- Categories List -->
      <div v-else class="space-y-2">
        <button
          v-for="category in displayedCategories"
          :key="category.id"
          type="button"
          class="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-surface-overlay transition-colors text-left"
          @click="emit('item-click', category)"
        >
          <!-- Icon/Emoji -->
          <div
            class="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 bg-white"
          >
            <!-- Emoji -->
            <span v-if="isEmoji(category.icon)" class="text-lg">
              {{ category.icon }}
            </span>
            <!-- Material Icon -->
            <span
              v-else
              class="material-symbols-outlined text-base"
              :style="{ color: category.color }"
            >
              {{ category.icon || getMaterialIcon(category) }}
            </span>
          </div>

          <!-- Name and Total -->
          <div class="flex-1 flex items-center justify-between min-w-0">
            <span class="text-body-sm text-content-main truncate">
              {{ category.name }}
            </span>
            <span class="text-body-sm text-content-muted ml-2 flex-shrink-0">
              {{ formatCurrency(category.totalAmount ?? 0) }}
            </span>
          </div>
        </button>

        <!-- Empty State -->
        <div
          v-if="categories.length === 0"
          class="py-6 text-center text-content-subtle"
        >
          <span class="material-symbols-outlined text-3xl mb-2 block">category</span>
          <p class="text-body-sm">Nenhuma categoria cadastrada</p>
        </div>
      </div>
    </div>

    <!-- Ver mais (sempre visível no rodapé do card) -->
    <button
      v-if="hasMore || categories.length > 0"
      type="button"
      class="w-full mt-4 py-2 text-body-sm text-content-subtle hover:text-content-muted transition-colors shrink-0"
      @click="emit('view-all')"
    >
      Ver mais
    </button>
  </div>
</template>
