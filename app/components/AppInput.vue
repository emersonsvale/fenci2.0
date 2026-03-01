<script setup lang="ts">
import { computed, ref } from 'vue'

export interface AppInputProps {
  modelValue: string
  label?: string
  type?: 'text' | 'email' | 'password' | 'number' | 'search'
  placeholder?: string
  disabled?: boolean
  error?: string
  id?: string
  name?: string
  required?: boolean
  minlength?: number
  /** Exibe botão de mostrar/ocultar senha quando type="password" */
  showPasswordToggle?: boolean
  /** Classes adicionais no input (ex: pr-12 para espaço do ícone) */
  inputClass?: string
}

const props = withDefaults(defineProps<AppInputProps>(), {
  type: 'text',
  disabled: false,
  required: false,
  showPasswordToggle: true,
  inputClass: '',
})

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

const inputId = ref(props.id ?? `app-input-${Math.random().toString(36).slice(2, 11)}`)

const isPassword = computed(() => props.type === 'password')
const showPassword = ref(false)

const inputType = computed(() => {
  if (props.type !== 'password') return props.type
  return showPassword.value ? 'text' : 'password'
})

const togglePasswordVisibility = (): void => {
  showPassword.value = !showPassword.value
}
</script>

<template>
  <div id="app-input-wrapper" class="w-full">
    <label
      v-if="label"
      :for="inputId"
      class="block text-body-sm font-medium text-content-muted mb-2"
    >
      {{ label }}
    </label>
    <div class="relative">
      <input
        :id="inputId"
        :value="modelValue"
        :type="inputType"
        :placeholder="placeholder"
        :disabled="disabled"
        :required="required"
        :minlength="minlength"
        :name="name"
        :aria-invalid="!!error"
        :aria-describedby="error ? `${inputId}-error` : undefined"
        class="input-field"
        :class="[
          inputClass,
          isPassword && showPasswordToggle ? 'pr-12' : '',
          error ? 'input-error' : '',
        ]"
        @input="emit('update:modelValue', ($event.target as HTMLInputElement).value)"
      />
      <button
        v-if="isPassword && showPasswordToggle"
        type="button"
        class="absolute right-4 top-1/2 -translate-y-1/2 text-content-subtle hover:text-content-muted transition-colors"
        :aria-label="showPassword ? 'Ocultar senha' : 'Mostrar senha'"
        @click="togglePasswordVisibility"
      >
        <span class="material-symbols-outlined text-xl">
          {{ showPassword ? 'visibility_off' : 'visibility' }}
        </span>
      </button>
    </div>
    <p
      v-if="error"
      :id="`${inputId}-error`"
      class="mt-1.5 text-caption text-error flex items-center gap-1"
      role="alert"
    >
      <span class="material-symbols-outlined text-sm">error</span>
      {{ error }}
    </p>
  </div>
</template>
