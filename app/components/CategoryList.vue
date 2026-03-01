<script setup lang="ts">
import { computed } from 'vue'
import { useCurrency } from '~/composables/useCurrency'

/**
 * CategoryList - Lista de gastos por categoria
 * Exibe as categorias com maior gasto do mês
 */

const { formatCurrency } = useCurrency()

export interface CategoryItem {
  id: string
  name: string
  icon?: string
  color: string
  value: number
  percentage: number
}

export interface CategoryListProps {
  categories: CategoryItem[]
  loading?: boolean
  maxItems?: number
}

const props = withDefaults(defineProps<CategoryListProps>(), {
  loading: false,
  maxItems: 5,
})

const emit = defineEmits<{
  'item-click': [category: CategoryItem]
}>()

const displayedCategories = computed(() => {
  return props.categories.slice(0, props.maxItems)
})

/** Material Symbols usa nomes como "directions_car"; emojis são outros caracteres. */
function isMaterialIcon(icon: string): boolean {
  return /^[a-z0-9_]+$/i.test(icon.trim())
}
</script>

<template>
  <div id="category-list" class="card p-6">
    <!-- Header -->
    <h3 class="text-heading-sm font-semibold text-content-main mb-4">
      Gastos por categoria
    </h3>

    <!-- Loading State -->
    <div v-if="loading" class="space-y-4">
      <div v-for="i in 5" :key="i" class="flex items-center gap-3">
        <div class="skeleton w-8 h-8 rounded-full" />
        <div class="flex-1 space-y-2">
          <div class="skeleton h-3 w-24 rounded" />
          <div class="skeleton h-2 w-full rounded-full" />
        </div>
        <div class="skeleton h-4 w-16 rounded" />
      </div>
    </div>

    <!-- Category Items -->
    <div v-else class="space-y-4">
      <div
        v-for="category in displayedCategories"
        :key="category.id"
        class="category-item"
        @click="emit('item-click', category)"
      >
        <!-- Icon (emoji ou Material Symbol) -->
        <div
          class="category-item-icon w-8 h-8 rounded-full flex items-center justify-center text-sm shrink-0"
          :style="{ color: category.color }"
        >
          <span
            v-if="category.icon"
            class="inline-flex items-center justify-center leading-none text-lg w-full h-full"
            :class="isMaterialIcon(category.icon) ? 'material-symbols-outlined' : ''"
          >{{ category.icon }}</span>
          <span v-else class="inline-flex items-center justify-center leading-none">{{ category.name.charAt(0) }}</span>
        </div>

        <!-- Info -->
        <div class="flex-1 min-w-0">
          <div class="flex items-center justify-between mb-1">
            <span class="text-body-sm text-content-main truncate">{{ category.name }}</span>
            <span class="text-body-sm font-semibold text-content-main">{{ formatCurrency(category.value) }}</span>
          </div>
          <!-- Progress Bar -->
          <div class="h-1.5 bg-surface-overlay rounded-full overflow-hidden">
            <div
              class="h-full rounded-full transition-all duration-500"
              :style="{ width: `${category.percentage}%`, backgroundColor: category.color }"
            />
          </div>
        </div>
      </div>

      <!-- Empty State -->
      <div
        v-if="categories.length === 0"
        class="flex items-center justify-center py-8 text-content-subtle"
      >
        <div class="text-center">
          <div class="w-14 h-14 rounded-2xl bg-primary/8 flex items-center justify-center mx-auto mb-3">
            <span class="material-symbols-outlined text-2xl text-primary/60">category</span>
          </div>
          <p class="text-body-sm font-medium text-content-muted">Nenhum gasto registrado</p>
          <p class="text-caption text-content-subtle mt-1">Os gastos aparecerão aqui</p>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.category-item {
  @apply flex items-center gap-3 p-2.5 -mx-2 rounded-xl cursor-pointer
         transition-all duration-200;
}

/* Hover: suave no claro, bem sutil no escuro para não quebrar o tema */
.category-item:hover {
  @apply scale-[1.01];
  background-color: rgb(243 244 246 / 0.8);
}
:global(.dark) .category-item:hover {
  background-color: rgb(255 255 255 / 0.06);
}

/* Círculo do ícone: fundo neutro em ambos os temas */
.category-item-icon {
  @apply rounded-xl;
  background-color: #F3F4F6;
  border: 1px solid rgb(229 231 235 / 0.6);
}
:global(.dark) .category-item-icon {
  background-color: rgb(255 255 255 / 0.08);
  border-color: rgb(255 255 255 / 0.10);
}
</style>
