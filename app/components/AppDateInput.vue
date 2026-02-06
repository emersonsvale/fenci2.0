<script setup lang="ts">
/**
 * Input de data com calendário integrado.
 * - Input editável em dd/mm/yyyy com máscara
 * - Ícone de calendário à direita que abre o picker nativo
 */

import { ref, watch, nextTick } from 'vue'

const props = withDefaults(
  defineProps<{
    modelValue: string
    id?: string
    placeholder?: string
    disabled?: boolean
    inputClass?: string
    showIcon?: boolean
  }>(),
  { placeholder: 'DD/MM/AAAA', disabled: false, inputClass: '', showIcon: true }
)

const emit = defineEmits<{ 'update:modelValue': [value: string] }>()

const dateInputRef = ref<HTMLInputElement | null>(null)
const textValue = ref('')

// Converte YYYY-MM-DD para DD/MM/YYYY
function toDisplay(iso: string): string {
  if (!iso || !/^\d{4}-\d{2}-\d{2}/.test(iso)) return ''
  const [y, m, d] = iso.split('T')[0].split('-')
  return `${d}/${m}/${y}`
}

// Converte DD/MM/YYYY para YYYY-MM-DD
function toIso(display: string): string {
  const clean = display.replace(/\D/g, '')
  if (clean.length !== 8) return ''
  const d = clean.slice(0, 2)
  const m = clean.slice(2, 4)
  const y = clean.slice(4, 8)
  const day = parseInt(d, 10)
  const month = parseInt(m, 10)
  if (month < 1 || month > 12 || day < 1 || day > 31) return ''
  return `${y}-${m}-${d}`
}

// Aplica máscara DD/MM/YYYY enquanto digita
function applyMask(value: string): string {
  const nums = value.replace(/\D/g, '').slice(0, 8)
  let result = ''
  if (nums.length > 0) result += nums.slice(0, 2)
  if (nums.length > 2) result += '/' + nums.slice(2, 4)
  if (nums.length > 4) result += '/' + nums.slice(4, 8)
  return result
}

// Sync do modelValue para o texto
watch(() => props.modelValue, (v) => {
  textValue.value = toDisplay(v)
}, { immediate: true })

// Bloqueia teclas não numéricas (exceto navegação)
function onKeyPress(e: KeyboardEvent) {
  if (!/\d/.test(e.key)) {
    e.preventDefault()
  }
}

// Trata paste - remove não-numéricos
function onPaste(e: ClipboardEvent) {
  e.preventDefault()
  const paste = e.clipboardData?.getData('text') || ''
  const nums = paste.replace(/\D/g, '')
  const input = e.target as HTMLInputElement
  
  // Insere os números no ponto atual do cursor
  const start = input.selectionStart || 0
  const end = input.selectionEnd || 0
  const current = textValue.value.replace(/\D/g, '')
  const before = current.slice(0, start)
  const after = current.slice(end)
  const newValue = (before + nums + after).slice(0, 8)
  
  textValue.value = applyMask(newValue)
}

function onTextInput(e: Event) {
  const input = e.target as HTMLInputElement
  const masked = applyMask(input.value)
  textValue.value = masked
  // Força o valor formatado de volta no input
  nextTick(() => {
    input.value = masked
  })
}

function onTextBlur() {
  const iso = toIso(textValue.value)
  if (iso) {
    emit('update:modelValue', iso)
  } else if (textValue.value) {
    textValue.value = toDisplay(props.modelValue)
  }
}

function onDatePick(e: Event) {
  const value = (e.target as HTMLInputElement).value
  if (value) {
    emit('update:modelValue', value)
  }
}

function openCalendar() {
  dateInputRef.value?.showPicker()
}

defineExpose({ openCalendar })
</script>

<template>
  <div class="date-input-wrapper" :class="[inputClass, disabled && 'opacity-50 cursor-not-allowed']">
    <input
      :id="id"
      type="text"
      :value="textValue"
      :placeholder="placeholder"
      :disabled="disabled"
      maxlength="10"
      inputmode="numeric"
      autocomplete="off"
      class="date-text-input"
      @keypress="onKeyPress"
      @paste="onPaste"
      @input="onTextInput"
      @blur="onTextBlur"
      @keydown.enter="onTextBlur"
    />
    <button
      v-if="showIcon"
      type="button"
      class="calendar-btn"
      :disabled="disabled"
      title="Abrir calendário"
      @click="openCalendar"
    >
      <span class="material-symbols-outlined">calendar_today</span>
    </button>
    <input
      ref="dateInputRef"
      type="date"
      :value="modelValue"
      :disabled="disabled"
      class="date-native"
      @input="onDatePick"
    />
  </div>
</template>

<style scoped>
.date-input-wrapper {
  position: relative;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.date-text-input {
  flex: 1;
  background: transparent;
  border: none;
  outline: none;
  font-size: inherit;
  color: inherit;
  padding: 0;
  min-width: 0;
  width: 100%;
}

.date-text-input::placeholder {
  color: #9ca3af;
}

.date-text-input:disabled {
  cursor: not-allowed;
}

.calendar-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: none;
  cursor: pointer;
  padding: 0;
  color: #9ca3af;
  transition: color 0.15s;
  flex-shrink: 0;
}

.calendar-btn:hover:not(:disabled) {
  color: var(--color-primary, #10b981);
}

.calendar-btn:disabled {
  cursor: not-allowed;
  opacity: 0.5;
}

.calendar-btn .material-symbols-outlined {
  font-size: 1.25rem;
}

.date-native {
  position: absolute;
  opacity: 0;
  width: 0;
  height: 0;
  pointer-events: none;
}
</style>
