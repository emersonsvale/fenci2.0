<script setup lang="ts">
import { computed } from 'vue'

export type AppButtonVariant = 'primary' | 'outline' | 'secondary' | 'ghost' | 'danger'
export type AppButtonSize = 'sm' | 'md' | 'lg'

export interface AppButtonProps {
  type?: 'button' | 'submit' | 'reset'
  variant?: AppButtonVariant
  size?: AppButtonSize
  /** Botão ocupa 100% da largura */
  fullWidth?: boolean
  disabled?: boolean
  loading?: boolean
  /** Texto exibido quando loading=true (default: "Carregando...") */
  loadingLabel?: string
  /** Classes adicionais no botão */
  class?: string
}

const props = withDefaults(defineProps<AppButtonProps>(), {
  type: 'button',
  variant: 'primary',
  size: 'md',
  fullWidth: true,
  disabled: false,
  loading: false,
  loadingLabel: 'Carregando...',
  class: '',
})

const isDisabled = computed(() => props.disabled || props.loading)

const variantClass = computed(() => {
  const map: Record<AppButtonVariant, string> = {
    primary: 'btn-primary',
    outline: 'btn-outline',
    secondary: 'btn-secondary',
    ghost: 'btn-ghost',
    danger: 'btn-danger',
  }
  return map[props.variant]
})

const sizeClass = computed(() => {
  if (props.size === 'md') return ''
  const map: Record<AppButtonSize, string> = {
    sm: 'btn-sm',
    md: '',
    lg: 'btn-lg',
  }
  return map[props.size]
})

const buttonClasses = computed(() => {
  const width = props.fullWidth ? 'w-full' : ''
  return [variantClass.value, sizeClass.value, width, props.class]
    .filter(Boolean)
    .join(' ')
})
</script>

<template>
  <button
    :type="type"
    :class="buttonClasses"
    :disabled="isDisabled"
    class="disabled:opacity-50 disabled:cursor-not-allowed"
  >
    <span v-if="loading">{{ loadingLabel }}</span>
    <template v-else>
      <slot name="icon" />
      <span><slot /></span>
    </template>
  </button>
</template>
