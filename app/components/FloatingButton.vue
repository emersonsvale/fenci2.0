<script setup lang="ts">
import { computed } from 'vue'

/**
 * Botão flutuante com imagem customizada (Elipse.png).
 * Posição fixa na tela, ideal para ação principal (ex: adicionar lançamento).
 */

export type FloatingButtonPosition = 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left'

export interface FloatingButtonProps {
  /** Posição do botão na tela */
  position?: FloatingButtonPosition
  /** Texto acessível para leitores de tela */
  ariaLabel?: string
  /** Classes CSS adicionais no container */
  class?: string
  /** Quando true, botão não usa position fixed (fica dentro de um container, ex.: junto do chat) */
  embedded?: boolean
}

const props = withDefaults(defineProps<FloatingButtonProps>(), {
  position: 'bottom-right',
  ariaLabel: 'Ação principal',
  class: '',
  embedded: false,
})

const emit = defineEmits<{
  click: []
}>()

const positionClasses = {
  'bottom-right': 'bottom-6 right-6',
  'bottom-left': 'bottom-6 left-6',
  'top-right': 'top-6 right-6',
  'top-left': 'top-6 left-6',
} as const

const positionClass = computed(() => positionClasses[props.position])
</script>

<template>
  <button
    id="floating-button"
    type="button"
    class="flex size-14 shrink-0 items-center justify-center rounded-full shadow-lg transition-transform hover:scale-105 active:scale-95 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
    :class="[
      !props.embedded && 'fixed z-50',
      !props.embedded && positionClass,
      props.class,
    ]"
    :aria-label="ariaLabel"
    @click="emit('click')"
  >
    <img
      src="/Elipse.png"
      alt=""
      class="size-full rounded-full object-cover"
      width="56"
      height="56"
    />
  </button>
</template>
