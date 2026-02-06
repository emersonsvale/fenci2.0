<script setup lang="ts">
import { ref, computed, watch } from 'vue'

/**
 * EmojiPicker - Seletor de emoji completo
 * Com categorias, busca e grid de emojis
 */

const props = defineProps<{
  isOpen: boolean
  selectedEmoji?: string
}>()

const emit = defineEmits<{
  close: []
  select: [emoji: string]
}>()

const searchQuery = ref('')
const activeCategory = ref('finance')

// Categorias de emojis
const categories = [
  { id: 'finance', icon: '💰', name: 'Finanças' },
  { id: 'smileys', icon: '😀', name: 'Rostos' },
  { id: 'objects', icon: '💡', name: 'Objetos' },
  { id: 'food', icon: '🍔', name: 'Comida' },
  { id: 'travel', icon: '🚗', name: 'Viagem' },
  { id: 'animals', icon: '🐶', name: 'Animais' },
  { id: 'activities', icon: '⚽', name: 'Atividades' },
  { id: 'symbols', icon: '❤️', name: 'Símbolos' },
]

// Emojis por categoria (reduzido para melhor performance)
const emojisByCategory: Record<string, string[]> = {
  finance: [
    '💰', '💵', '💴', '💶', '💷', '💸', '💳', '🏦', '🏧', '💹', '📈', '📉', '🪙', '💎',
    '💼', '🏢', '📊', '📋', '📝', '💻', '🖥️', '📱', '🏠', '🏡', '🔑', '🚗', '✈️', '🎓',
    '💊', '🛒', '🛍️', '🎁', '🏆', '⭐', '❤️', '✨', '🔥', '💡', '🔔', '📅', '✅', '❌',
    '⚠️', '🔒', '📌', '💲', '🤑', '🏛️', '⚖️', '📑', '🗂️', '📁', '🎯', '🚀', '💫', '🌟',
  ],
  smileys: [
    '😀', '😃', '😄', '😁', '😆', '😅', '🤣', '😂', '🙂', '😊', '😇', '🥰', '😍', '🤩',
    '😘', '😗', '😚', '😙', '🥲', '😋', '😛', '😜', '🤪', '😝', '🤑', '🤗', '🤔', '🤐',
    '😐', '😑', '😶', '😏', '😒', '🙄', '😬', '😌', '😔', '😪', '😴', '😷', '🤒', '🤕',
    '🤢', '🤮', '🥵', '🥶', '🥴', '😵', '🤯', '🤠', '🥳', '😎', '🤓', '🧐', '😤', '😠',
  ],
  objects: [
    '💡', '🔦', '📱', '💻', '🖥️', '⌨️', '🖱️', '💾', '💿', '📷', '📹', '🎥', '📺', '📻',
    '⏰', '⌚', '📞', '☎️', '📟', '📠', '🔋', '🔌', '💉', '💊', '🩺', '🔬', '🔭', '📡',
    '🔧', '🔨', '⚒️', '🛠️', '⚙️', '🔩', '⛓️', '🔪', '🗡️', '⚔️', '🔫', '🛡️', '🚬', '⚰️',
    '📦', '📫', '📬', '📭', '📮', '🗳️', '✏️', '✒️', '🖋️', '🖊️', '🖌️', '🖍️', '📝', '💼',
  ],
  food: [
    '🍏', '🍎', '🍐', '🍊', '🍋', '🍌', '🍉', '🍇', '🍓', '🫐', '🍈', '🍒', '🍑', '🥭',
    '🍍', '🥥', '🥝', '🍅', '🍆', '🥑', '🥦', '🥬', '🥒', '🌶️', '🌽', '🥕', '🧄', '🧅',
    '🍔', '🍟', '🍕', '🌭', '🥪', '🌮', '🌯', '🥗', '🍜', '🍝', '🍣', '🍱', '🍩', '🍪',
    '🎂', '🍰', '🧁', '🍫', '🍬', '🍭', '☕', '🍵', '🥤', '🍺', '🍷', '🥂', '🍾', '🧊',
  ],
  travel: [
    '🚗', '🚕', '🚙', '🚌', '🚎', '🏎️', '🚓', '🚑', '🚒', '🚐', '🛻', '🚚', '🚛', '🚜',
    '🏍️', '🛵', '🚲', '🛴', '🚏', '⛽', '🚨', '🚥', '🚦', '⚓', '⛵', '🚤', '🛳️', '⛴️',
    '✈️', '🛩️', '🛫', '🛬', '🚁', '🚀', '🛸', '🏠', '🏡', '🏢', '🏣', '🏤', '🏥', '🏦',
    '🏨', '🏩', '🏪', '🏫', '🏬', '🏭', '🏯', '🏰', '💒', '🗼', '🗽', '⛪', '🕌', '🛕',
  ],
  animals: [
    '🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼', '🐨', '🐯', '🦁', '🐮', '🐷', '🐸',
    '🐵', '🙈', '🙉', '🙊', '🐒', '🐔', '🐧', '🐦', '🐤', '🐣', '🦆', '🦅', '🦉', '🦇',
    '🐺', '🐗', '🐴', '🦄', '🐝', '🐛', '🦋', '🐌', '🐞', '🐜', '🦟', '🕷️', '🦂', '🐢',
    '🐍', '🦎', '🐙', '🦑', '🦐', '🦞', '🦀', '🐡', '🐠', '🐟', '🐬', '🐳', '🐋', '🦈',
  ],
  activities: [
    '⚽', '🏀', '🏈', '⚾', '🥎', '🎾', '🏐', '🏉', '🥏', '🎱', '🏓', '🏸', '🏒', '🥊',
    '🥋', '🎽', '🛹', '🛷', '⛸️', '🥌', '🎿', '⛷️', '🏂', '🏋️', '🤼', '🤸', '⛹️', '🤾',
    '🏌️', '🏇', '🧘', '🏄', '🏊', '🤽', '🚣', '🧗', '🚵', '🚴', '🎮', '🕹️', '🎲', '🧩',
    '🎯', '🎳', '🎰', '🎨', '🎭', '🎪', '🎬', '🎤', '🎧', '🎼', '🎹', '🥁', '🎷', '🎸',
  ],
  symbols: [
    '❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔', '❣️', '💕', '💞', '💓',
    '💗', '💖', '💘', '💝', '💟', '☮️', '✝️', '☪️', '🕉️', '☸️', '✡️', '🔯', '🕎', '☯️',
    '⭐', '🌟', '✨', '💫', '⚡', '🔥', '💥', '☀️', '🌈', '☁️', '❄️', '💧', '🌊', '🎉',
    '🎊', '🎈', '🎁', '🏆', '🥇', '🥈', '🥉', '🏅', '🎖️', '📣', '📢', '🔔', '🔕', '🎵',
  ],
}

// Mapeamento de palavras-chave para emojis
const keywordMap: Record<string, string[]> = {
  'dinheiro': ['💰', '💵', '💴', '💶', '💷', '💸', '💳', '🪙', '🤑', '💲'],
  'money': ['💰', '💵', '💴', '💶', '💷', '💸', '💳', '🪙', '🤑', '💲'],
  'banco': ['🏦', '🏧', '💳', '💰'],
  'bank': ['🏦', '🏧', '💳', '💰'],
  'cartao': ['💳', '🏧'],
  'card': ['💳', '🏧'],
  'casa': ['🏠', '🏡', '🔑'],
  'home': ['🏠', '🏡', '🔑'],
  'comida': ['🍔', '🍕', '🍟', '🍜', '🍱', '🥗', '🍰'],
  'food': ['🍔', '🍕', '🍟', '🍜', '🍱', '🥗', '🍰'],
  'cafe': ['☕', '🍵'],
  'coffee': ['☕', '🍵'],
  'carro': ['🚗', '🚕', '🚙', '🏎️'],
  'car': ['🚗', '🚕', '🚙', '🏎️'],
  'trabalho': ['💼', '🏢', '👔', '💻', '📊'],
  'work': ['💼', '🏢', '👔', '💻', '📊'],
  'escola': ['🏫', '📚', '✏️', '🎒', '🎓'],
  'school': ['🏫', '📚', '✏️', '🎒', '🎓'],
  'saude': ['💊', '🏥', '🩺', '❤️', '💪'],
  'health': ['💊', '🏥', '🩺', '❤️', '💪'],
  'pet': ['🐶', '🐱', '🐰', '🐹', '🐦', '🐠', '🐾'],
  'compras': ['🛒', '🛍️', '🏪', '🏬'],
  'shopping': ['🛒', '🛍️', '🏪', '🏬'],
  'jogo': ['🎮', '🕹️', '🎲', '🎯'],
  'game': ['🎮', '🕹️', '🎲', '🎯'],
  'musica': ['🎵', '🎶', '🎤', '🎧', '🎸', '🎹'],
  'music': ['🎵', '🎶', '🎤', '🎧', '🎸', '🎹'],
  'esporte': ['⚽', '🏀', '🏈', '⚾', '🎾'],
  'sport': ['⚽', '🏀', '🏈', '⚾', '🎾'],
  'estrela': ['⭐', '🌟', '✨', '💫'],
  'star': ['⭐', '🌟', '✨', '💫'],
  'coracao': ['❤️', '💕', '💖', '💗', '💓', '💞'],
  'heart': ['❤️', '💕', '💖', '💗', '💓', '💞'],
  'feliz': ['😀', '😃', '😄', '😁', '😊', '🥳'],
  'happy': ['😀', '😃', '😄', '😁', '😊', '🥳'],
  'investimento': ['📈', '💹', '📊', '💰', '🏦'],
  'salario': ['💰', '💵', '💸', '🤑'],
  'educacao': ['📚', '🎓', '✏️', '📖'],
  'transporte': ['🚗', '🚌', '🚇', '✈️', '🚲'],
  'lazer': ['🎮', '🎬', '🎭', '🎨', '🎪'],
  'alimentacao': ['🍔', '🍕', '🍜', '🥗', '☕'],
  'farmacia': ['💊', '🏥', '💉'],
}

// Busca de emojis
const filteredEmojis = computed(() => {
  if (!searchQuery.value.trim()) {
    return emojisByCategory[activeCategory.value] || []
  }

  const query = searchQuery.value.toLowerCase().trim()
  const results: string[] = []

  for (const [keyword, emojis] of Object.entries(keywordMap)) {
    if (keyword.includes(query) || query.includes(keyword)) {
      results.push(...emojis)
    }
  }

  return [...new Set(results)]
})

// Reset quando fecha
watch(
  () => props.isOpen,
  (isOpen) => {
    if (!isOpen) {
      searchQuery.value = ''
      activeCategory.value = 'finance'
    }
  }
)

function selectEmoji(emoji: string) {
  emit('select', emoji)
}

function handleClose() {
  emit('close')
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
        class="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
        style="z-index: 9999;"
        @click.self="handleClose"
      >
        <div
          class="bg-surface-elevated rounded-2xl shadow-2xl w-[500px] max-w-[90vw] overflow-hidden"
          @click.stop
        >
          <!-- Header -->
          <div class="flex items-center justify-between px-4 py-3 border-b border-default">
            <h2 class="text-base font-semibold text-content-main">Selecione um ícone</h2>
            <button
              type="button"
              class="p-1.5 rounded-lg hover:bg-surface-elevated-tertiary transition-colors text-content-subtle"
              @click="handleClose"
            >
              <span class="material-symbols-outlined text-xl">close</span>
            </button>
          </div>

          <!-- Category Tabs -->
          <div class="flex items-center gap-1 px-3 py-2 border-b border-default overflow-x-auto">
            <button
              v-for="cat in categories"
              :key="cat.id"
              type="button"
              class="flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-full text-xl transition-colors"
              :class="activeCategory === cat.id ? 'bg-surface-elevated-tertiary ring-2 ring-primary' : 'hover:bg-surface-elevated-secondary'"
              :title="cat.name"
              @click="activeCategory = cat.id; searchQuery = ''"
            >
              {{ cat.icon }}
            </button>
          </div>

          <!-- Search -->
          <div class="px-3 py-2 border-b border-default">
            <div class="relative">
              <span class="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-content-subtle text-lg">search</span>
              <input
                v-model="searchQuery"
                type="text"
                placeholder="Buscar emoji..."
                class="w-full pl-10 pr-4 py-2 bg-surface-elevated-secondary border border-default rounded-lg text-content-main text-sm placeholder:text-content-subtle focus:outline-none focus:border-primary"
              />
            </div>
          </div>

          <!-- Emoji Grid -->
          <div class="p-3 h-[280px] overflow-y-auto">
            <div
              v-if="filteredEmojis.length > 0"
              class="grid gap-1"
              style="grid-template-columns: repeat(8, 1fr);"
            >
              <button
                v-for="(emoji, index) in filteredEmojis"
                :key="index"
                type="button"
                class="aspect-square flex items-center justify-center rounded-lg hover:bg-surface-elevated-tertiary transition-colors text-2xl"
                :class="{ 'bg-primary/20 ring-2 ring-primary': selectedEmoji === emoji }"
                @click="selectEmoji(emoji)"
              >
                {{ emoji }}
              </button>
            </div>
            <div v-else class="flex flex-col items-center justify-center h-full text-content-subtle">
              <span class="material-symbols-outlined text-4xl mb-2">search_off</span>
              <p class="text-sm">Nenhum emoji encontrado</p>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>
