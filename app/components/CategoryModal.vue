<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import EmojiPicker from './EmojiPicker.vue'

/**
 * CategoryModal - Modal para criar/editar categorias
 * Design limpo com seletor de emoji em modal separado
 */

export interface CategoryModalProps {
  isOpen: boolean
  type: 'income' | 'expense'
  editingCategory?: {
    id: string
    name: string
    icon?: string | null
  } | null
  isLoading?: boolean
}

const props = withDefaults(defineProps<CategoryModalProps>(), {
  editingCategory: null,
  isLoading: false,
})

const emit = defineEmits<{
  close: []
  submit: [data: CategoryFormData]
  delete: [id: string]
}>()

export interface CategoryFormData {
  name: string
  icon: string
  type: 'income' | 'expense'
}

// Form state
const name = ref('')
const selectedEmoji = ref('💰')
const isEmojiPickerOpen = ref(false)
const isConfirmingDelete = ref(false)

// Título baseado no tipo
const modalTitle = computed(() => {
  if (props.editingCategory) {
    return props.type === 'income' ? 'Editar categoria de entrada' : 'Editar categoria de saída'
  }
  return props.type === 'income' ? 'Nova categoria de entrada' : 'Nova categoria de saída'
})

// Preview do nome
const previewName = computed(() => {
  return name.value.trim() || 'Nome da categoria'
})

// Reset form when modal opens/closes
watch(
  () => props.isOpen,
  (isOpen) => {
    if (isOpen) {
      if (props.editingCategory) {
        name.value = props.editingCategory.name
        selectedEmoji.value = props.editingCategory.icon || '💰'
      } else {
        resetForm()
      }
    }
    isEmojiPickerOpen.value = false
    isConfirmingDelete.value = false
  }
)

function resetForm() {
  name.value = ''
  selectedEmoji.value = props.type === 'income' ? '💰' : '💸'
  isEmojiPickerOpen.value = false
  isConfirmingDelete.value = false
}

function openEmojiPicker() {
  isEmojiPickerOpen.value = true
}

function handleEmojiSelect(emoji: string) {
  selectedEmoji.value = emoji
  isEmojiPickerOpen.value = false
}

function handleSubmit() {
  if (!name.value.trim()) return

  emit('submit', {
    name: name.value.trim(),
    icon: selectedEmoji.value,
    type: props.type,
  })
}

function handleClose() {
  emit('close')
}

function handleDelete() {
  if (!props.editingCategory) return
  
  if (!isConfirmingDelete.value) {
    isConfirmingDelete.value = true
    return
  }
  
  emit('delete', props.editingCategory.id)
}

function cancelDelete() {
  isConfirmingDelete.value = false
}
</script>

<template>
  <Teleport to="body">
    <Transition
      enter-active-class="transition ease-out duration-200"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition ease-in duration-150"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div
        v-if="isOpen"
        id="category-modal-overlay"
        class="fixed inset-0 bg-black/60 backdrop-blur-sm z-modal flex items-end sm:items-center justify-center sm:p-4"
        @click.self="handleClose"
      >
        <Transition
          enter-active-class="transition ease-out duration-200"
          enter-from-class="opacity-0 scale-95"
          enter-to-class="opacity-100 scale-100"
          leave-active-class="transition ease-in duration-150"
          leave-from-class="opacity-100 scale-100"
          leave-to-class="opacity-0 scale-95"
        >
          <div
            v-if="isOpen"
            id="category-modal-content"
            class="bg-surface-elevated shadow-2xl w-full overflow-hidden max-h-[100dvh] rounded-none sm:rounded-2xl sm:max-w-2xl sm:max-h-[90vh]"
          >
            <!-- Header -->
            <div class="flex items-center justify-between px-6 py-5 border-b border-default">
              <div class="flex items-center gap-3">
                <span class="material-symbols-outlined text-primary text-xl">north_east</span>
                <h2 class="text-xl font-semibold text-content-main">
                  {{ modalTitle }}
                </h2>
              </div>
              <button
                type="button"
                class="p-2 rounded-lg hover:bg-surface-elevated-tertiary transition-colors text-content-subtle"
                @click="handleClose"
              >
                <span class="material-symbols-outlined text-xl">close</span>
              </button>
            </div>

            <!-- Body -->
            <div class="px-6 py-5 space-y-5">
              <!-- Ícone -->
              <div>
                <label class="label-dark">Ícone</label>
                <button
                  type="button"
                  class="w-full px-5 py-3 bg-surface-elevated-secondary border border-default rounded-full text-content-main focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent flex items-center justify-between hover:border-default-secondary transition-colors"
                  @click="openEmojiPicker"
                >
                  <div class="flex items-center gap-3">
                    <span class="text-xl">{{ selectedEmoji }}</span>
                    <span class="text-content-subtle text-sm">Selecione um ícone</span>
                  </div>
                  <span class="material-symbols-outlined text-content-subtle">
                    chevron_right
                  </span>
                </button>
              </div>

              <!-- Nome da Categoria -->
              <div>
                <label class="label-dark">Nome da categoria</label>
                <input
                  v-model="name"
                  type="text"
                  placeholder="Ex. Alimentação, Transporte"
                  class="w-full px-5 py-3 bg-surface-elevated border border-default rounded-full text-content-main placeholder:text-content-subtle focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  @keydown.enter="handleSubmit"
                />
              </div>

              <!-- Preview -->
              <div>
                <label class="label-dark">Preview</label>
                <div class="flex items-center gap-3 px-5 py-3 bg-surface-elevated-secondary border border-default rounded-full">
                  <span class="text-xl">{{ selectedEmoji }}</span>
                  <span class="text-content-main">{{ previewName }}</span>
                </div>
              </div>
            </div>

            <!-- Footer -->
            <div class="px-6 py-4 border-t border-default">
              <!-- Confirmação de exclusão -->
              <div v-if="isConfirmingDelete" class="mb-4 p-4 bg-error/10 border border-error/30 rounded-xl">
                <p class="text-sm text-content-main mb-3">
                  Tem certeza que deseja excluir esta categoria? Esta ação não pode ser desfeita.
                </p>
                <div class="flex gap-3">
                  <button
                    type="button"
                    class="flex-1 py-2 rounded-full border border-default text-content-muted hover:bg-surface-elevated-tertiary transition-colors text-sm"
                    @click="cancelDelete"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    class="flex-1 py-2 rounded-full bg-error text-white font-medium hover:brightness-110 transition-all text-sm"
                    :disabled="isLoading"
                    @click="handleDelete"
                  >
                    {{ isLoading ? 'Excluindo...' : 'Confirmar exclusão' }}
                  </button>
                </div>
              </div>

              <!-- Botões principais -->
              <div v-else class="flex gap-3">
                <button
                  v-if="editingCategory"
                  type="button"
                  class="px-6 py-3 rounded-full border border-error text-error font-medium hover:bg-error/10 transition-all"
                  @click="handleDelete"
                >
                  <span class="material-symbols-outlined text-lg align-middle mr-1">delete</span>
                  Excluir
                </button>
                <button
                  type="button"
                  class="flex-1 py-3 rounded-full bg-primary text-white font-semibold hover:brightness-110 hover:shadow-primary transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  :disabled="!name.trim() || isLoading"
                  @click="handleSubmit"
                >
                  {{ isLoading ? 'Salvando...' : 'Salvar' }}
                </button>
              </div>
            </div>
          </div>
        </Transition>
      </div>
    </Transition>
  </Teleport>

  <!-- Emoji Picker Modal -->
  <EmojiPicker
    :is-open="isEmojiPickerOpen"
    :selected-emoji="selectedEmoji"
    @close="isEmojiPickerOpen = false"
    @select="handleEmojiSelect"
  />
</template>
