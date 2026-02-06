<script setup lang="ts">
import { ref, computed } from 'vue'
import { useProfile } from '~/composables/useProfile'

/**
 * AvatarUploader - Componente para upload e remoção de avatar
 */

const { avatarUrl, uploadAvatar, removeAvatar, isLoading, error } = useProfile()

const fileInput = ref<HTMLInputElement | null>(null)
const dragActive = ref(false)

const displayInitials = computed(() => {
  return 'U' // Fallback
})

function triggerFileInput(): void {
  fileInput.value?.click()
}

async function handleFileSelect(event: Event): Promise<void> {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (file) {
    await uploadAvatar(file)
  }
  // Reset input
  if (input) input.value = ''
}

async function handleDrop(event: DragEvent): Promise<void> {
  dragActive.value = false
  const file = event.dataTransfer?.files?.[0]
  if (file && file.type.startsWith('image/')) {
    await uploadAvatar(file)
  }
}

function handleDragOver(event: DragEvent): void {
  event.preventDefault()
  dragActive.value = true
}

function handleDragLeave(): void {
  dragActive.value = false
}

async function handleRemove(): Promise<void> {
  if (confirm('Tem certeza que deseja remover seu avatar?')) {
    await removeAvatar()
  }
}
</script>

<template>
  <div id="avatar-uploader" class="space-y-4">
    <label class="block text-sm font-medium text-content-primary dark:text-content-primary-dark">
      Foto de perfil
    </label>

    <div class="flex items-center gap-6">
      <!-- Preview -->
      <div 
        class="relative w-20 h-20 rounded-full overflow-hidden bg-surface-elevated border-2 border-default cursor-pointer group"
        :class="{ 'border-primary border-dashed': dragActive }"
        @click="triggerFileInput"
        @drop.prevent="handleDrop"
        @dragover="handleDragOver"
        @dragleave="handleDragLeave"
      >
        <img 
          v-if="avatarUrl" 
          :src="avatarUrl" 
          alt="Avatar"
          class="w-full h-full object-cover"
        />
        <div 
          v-else 
          class="w-full h-full flex items-center justify-center bg-primary/10 text-primary text-xl font-semibold"
        >
          {{ displayInitials }}
        </div>
        
        <!-- Overlay -->
        <div 
          class="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <span class="material-symbols-outlined text-white text-2xl">photo_camera</span>
        </div>

        <!-- Loading -->
        <div 
          v-if="isLoading"
          class="absolute inset-0 bg-black/50 flex items-center justify-center"
        >
          <div class="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
        </div>
      </div>

      <!-- Actions -->
      <div class="space-y-2">
        <button
          type="button"
          class="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm bg-surface-light-secondary dark:bg-surface-dark-secondary border border-border-light dark:border-border-dark text-content-primary dark:text-content-primary-dark hover:bg-surface-light-tertiary dark:hover:bg-surface-dark-tertiary transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          :disabled="isLoading"
          @click="triggerFileInput"
        >
          <span class="material-symbols-outlined text-lg">upload</span>
          Enviar foto
        </button>
        
        <button
          v-if="avatarUrl"
          type="button"
          class="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm text-error hover:bg-error/10 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          :disabled="isLoading"
          @click="handleRemove"
        >
          <span class="material-symbols-outlined text-lg">delete</span>
          Remover
        </button>
      </div>

      <!-- Hidden Input -->
      <input
        ref="fileInput"
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        class="hidden"
        @change="handleFileSelect"
      />
    </div>

    <!-- Error -->
    <p v-if="error" class="text-sm text-error">
      {{ error }}
    </p>

    <!-- Help text -->
    <p class="text-xs text-content-subtle">
      JPG, PNG, WebP ou GIF. Máximo 5MB.
    </p>
  </div>
</template>

