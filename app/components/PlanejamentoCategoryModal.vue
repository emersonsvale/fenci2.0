<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import BaseModal from './BaseModal.vue'
import AppButton from './AppButton.vue'
import AppInput from './AppInput.vue'
import type { PlanningCategory } from 'shared/types/database.types'
import type { PlanningCategoryFormData } from '../composables/usePlanejamento'

const DEFAULT_HEX = '#22C55E'

function parseHex(val: string): string | null {
  const v = val.trim().replace(/^#/, '')
  if (/^[0-9A-Fa-f]{6}$/.test(v)) return '#' + v
  return null
}

const props = defineProps<{
  isOpen: boolean
  editingCategory?: PlanningCategory | null
}>()

const emit = defineEmits<{
  close: []
  submit: [data: PlanningCategoryFormData]
}>()

const name = ref('')
const color = ref('')

const colorPickerValue = computed(() => parseHex(color.value) ?? DEFAULT_HEX)

function onColorPickerInput(e: Event) {
  const hex = (e.target as HTMLInputElement).value
  color.value = hex
}

watch(
  () => [props.isOpen, props.editingCategory],
  () => {
    if (props.isOpen) {
      if (props.editingCategory) {
        name.value = props.editingCategory.name
        color.value = props.editingCategory.color ?? ''
      } else {
        name.value = ''
        color.value = ''
      }
    }
  }
)

function handleSubmit() {
  if (!name.value.trim()) return
  emit('submit', {
    name: name.value.trim(),
    color: color.value.trim() || null,
  })
}

function handleClose() {
  emit('close')
}
</script>

<template>
  <BaseModal
    :is-open="isOpen"
    :title="editingCategory ? 'Editar categoria' : 'Nova categoria'"
    @close="handleClose"
  >
    <div class="space-y-4">
      <AppInput
        id="planejamento-category-name"
        v-model="name"
        label="Nome"
        placeholder="Ex.: Passagens"
        required
      />
      <div>
        <label for="planejamento-category-color" class="label-dark block mb-1">Cor (opcional)</label>
        <div class="flex items-center gap-3">
          <input
            :value="colorPickerValue"
            type="color"
            class="planejamento-color-picker h-10 w-14 shrink-0 cursor-pointer rounded-lg border border-default bg-surface-elevated p-1"
            title="Escolher cor"
            @input="onColorPickerInput"
          />
          <input
            id="planejamento-category-color"
            v-model="color"
            type="text"
            placeholder="#22C55E"
            class="flex-1 px-5 py-3 bg-surface-elevated border border-default rounded-full text-content-main placeholder:text-content-subtle focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
      </div>
    </div>
    <template #footer>
      <div class="flex justify-end gap-3">
        <AppButton variant="secondary" @click="handleClose">Cancelar</AppButton>
        <AppButton variant="primary" :disabled="!name.trim()" @click="handleSubmit">
          {{ editingCategory ? 'Salvar' : 'Criar' }}
        </AppButton>
      </div>
    </template>
  </BaseModal>
</template>

<style scoped>
.planejamento-color-picker {
  -webkit-appearance: none;
  appearance: none;
}
.planejamento-color-picker::-webkit-color-swatch-wrapper {
  padding: 2px;
}
.planejamento-color-picker::-webkit-color-swatch {
  border: none;
  border-radius: 6px;
}
.planejamento-color-picker::-moz-color-swatch {
  border: none;
  border-radius: 6px;
}
</style>
