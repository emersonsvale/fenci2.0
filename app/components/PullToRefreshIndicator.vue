<script setup lang="ts">
import { computed } from 'vue'

/**
 * PullToRefreshIndicator - Indicador visual de pull-to-refresh
 * Exibe um spinner/seta que aparece quando o usuário puxa a página para baixo
 */

interface Props {
  pullDistance: number
  isPulling: boolean
  isRefreshing: boolean
  threshold?: number
}

const props = withDefaults(defineProps<Props>(), {
  threshold: 80,
})

const progress = computed(() => Math.min(props.pullDistance / props.threshold, 1))
const rotation = computed(() => progress.value * 180)
const opacity = computed(() => Math.min(progress.value * 1.5, 1))
const isReady = computed(() => progress.value >= 1)
</script>

<template>
  <Transition
    enter-active-class="transition-all duration-200"
    enter-from-class="opacity-0 -translate-y-4"
    enter-to-class="opacity-100 translate-y-0"
    leave-active-class="transition-all duration-200"
    leave-from-class="opacity-100 translate-y-0"
    leave-to-class="opacity-0 -translate-y-4"
  >
    <div
      v-if="isPulling || isRefreshing"
      class="fixed left-1/2 -translate-x-1/2 z-[250] flex items-center justify-center"
      :style="{ top: `${Math.max(pullDistance + 56, 70)}px` }"
    >
      <div
        class="w-10 h-10 rounded-full bg-surface-elevated shadow-lg border border-default flex items-center justify-center transition-transform duration-100"
        :class="{ 'scale-110': isReady }"
      >
        <!-- Refreshing spinner -->
        <span
          v-if="isRefreshing"
          class="material-symbols-outlined text-xl text-primary animate-spin"
        >
          refresh
        </span>

        <!-- Pull arrow -->
        <span
          v-else
          class="material-symbols-outlined text-xl transition-all duration-100"
          :class="isReady ? 'text-primary' : 'text-content-subtle'"
          :style="{
            transform: `rotate(${rotation}deg)`,
            opacity: opacity,
          }"
        >
          arrow_downward
        </span>
      </div>
    </div>
  </Transition>
</template>
