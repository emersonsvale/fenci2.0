<script setup lang="ts">
/**
 * ProfileTabs - Navegação entre seções do perfil
 */

interface Tab {
  id: string
  label: string
  icon: string
}

interface Props {
  modelValue: string
  tabs: Tab[]
}

interface Emits {
  (e: 'update:modelValue', value: string): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

function selectTab(tabId: string): void {
  emit('update:modelValue', tabId)
}
</script>

<template>
  <nav id="profile-tabs" class="flex gap-1 border-b border-border-light dark:border-border-dark overflow-x-auto scrollbar-hide -mx-4 px-4 lg:mx-0 lg:px-0">
    <button
      v-for="tab in props.tabs"
      :key="tab.id"
      type="button"
      class="flex items-center gap-2 px-3 lg:px-4 py-3 text-sm font-medium text-content-secondary dark:text-content-secondary-dark border-b-2 border-transparent transition-colors duration-200 hover:text-content-primary dark:hover:text-content-primary-dark hover:bg-surface-light-tertiary dark:hover:bg-surface-dark-tertiary whitespace-nowrap shrink-0"
      :class="{ 'text-primary border-b-primary': props.modelValue === tab.id }"
      @click="selectTab(tab.id)"
    >
      <span class="material-symbols-outlined text-lg">{{ tab.icon }}</span>
      <span class="hidden sm:inline">{{ tab.label }}</span>
    </button>
  </nav>
</template>
