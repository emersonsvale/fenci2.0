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
  <nav id="profile-tabs" class="flex gap-1 border-b border-default overflow-x-auto scrollbar-hide -mx-4 px-4 lg:mx-0 lg:px-0">
    <button
      v-for="tab in props.tabs"
      :key="tab.id"
      type="button"
      class="flex items-center gap-2 px-3 lg:px-4 py-3 text-body-sm font-medium border-b-2 transition-all duration-200 whitespace-nowrap shrink-0 rounded-t-lg"
      :class="props.modelValue === tab.id
        ? 'text-primary border-b-primary bg-primary/5'
        : 'text-content-subtle border-transparent hover:text-content-muted hover:bg-surface-overlay/50'"
      @click="selectTab(tab.id)"
    >
      <span class="material-symbols-outlined text-lg" :style="props.modelValue === tab.id ? 'font-variation-settings: \'FILL\' 1' : ''">{{ tab.icon }}</span>
      <span class="hidden sm:inline">{{ tab.label }}</span>
    </button>
  </nav>
</template>
