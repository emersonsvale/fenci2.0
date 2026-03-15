<script setup lang="ts">
import { ref, watch, onUnmounted, computed } from 'vue'

/**
 * Chat flutuante com IA especialista em finanças pessoais.
 * Usa os dados financeiros do usuário logado para dar insights, recomendações e cadastro de lançamentos.
 * Permite envio de imagem de extrato ou arquivo de extrato para a Fê lançar (com perguntas para evitar duplicidade).
 */

interface SuggestedTransaction {
  type: 'income' | 'expense'
  amount: number
  transaction_date: string
  description: string
  account_id: string
  category_id: string | null
}

const props = defineProps<{
  isOpen: boolean
  title?: string
  /** Quando true, o chat não usa position fixed (fica dentro do widget junto do botão) */
  embedded?: boolean
}>()

const emit = defineEmits<{
  close: []
}>()

const message = ref('')
const messages = ref<Array<{ id: string; text: string; isUser: boolean; suggestedTransaction?: SuggestedTransaction | null }>>([])
const isLoading = ref(false)
const error = ref<string | null>(null)
/** Sugestão de lançamento pendente de confirmação (vinculada à última mensagem da Fê que a trouxe). */
const pendingSuggestion = ref<{ messageId: string; data: SuggestedTransaction } | null>(null)
const isConfirmingTransaction = ref(false)
/** Anexos para o próximo envio: imagem em base64 ou arquivo (nome + base64). */
const attachments = ref<Array<{ type: 'image' | 'file'; name: string; base64: string; mime?: string }>>([])
const attachmentInputRef = ref<HTMLInputElement | null>(null)

const PERGUNTAS_PREDEFINIDAS = [
  'Quanto falta pra pagar este mês?',
  'Como está meu orçamento este mês?',
  'Quais são minhas maiores despesas?',
  'Tenho alguma conta em atraso?',
  'Quanto posso guardar este mês?',
  'Me dá um resumo da minha saúde financeira.',
  'Quero adicionar um lançamento.',
]

const hasAttachments = computed(() => attachments.value.length > 0)

/** Escapa HTML para uso seguro em v-html. */
function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

/**
 * Converte markdown simples (###, **, -, 1.) em HTML seguro para exibir na bolha da Fê.
 */
function markdownToHtml(text: string): string {
  if (!text?.trim()) return ''
  let out = escapeHtml(text)
  // Negrito: **texto**
  out = out.replace(/\*\*([^*]+)\*\*/g, '<strong class="font-semibold">$1</strong>')
  // Títulos: ###, ##, #
  out = out.replace(/^### (.+)$/gm, '<h3 class="chat-h3">$1</h3>')
  out = out.replace(/^## (.+)$/gm, '<h2 class="chat-h2">$1</h2>')
  out = out.replace(/^# (.+)$/gm, '<h1 class="chat-h1">$1</h1>')
  // Lista com marcador: - item ou * item
  out = out.replace(/^[\-\*] (.+)$/gm, '<li class="chat-li">$1</li>')
  // Lista numerada: 1. item
  out = out.replace(/^\d+\. (.+)$/gm, '<li class="chat-li chat-li-num">$1</li>')
  // Envolver <li> consecutivos em <ul> ou <ol>
  out = out.replace(/(<li class="chat-li[^"]*">[^<]+<\/li>\s*)+/g, (match) => {
    const isNum = match.includes('chat-li-num')
    const tag = isNum ? 'ol' : 'ul'
    return `<${tag} class="chat-list">${match.replace(/\s+/g, '')}</${tag}>`
  })
  // Quebras de linha
  out = out.replace(/\n/g, '<br>')
  return out
}

function handleKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape') {
    emit('close')
  }
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value)
}

async function confirmTransaction() {
  const pending = pendingSuggestion.value
  if (!pending || isConfirmingTransaction.value) return

  const supabase = useSupabaseClient()
  const { data: { session } } = await supabase.auth.getSession()
  const token = session?.access_token
  if (!token) {
    error.value = 'Faça login para registrar o lançamento.'
    return
  }

  isConfirmingTransaction.value = true
  error.value = null
  try {
    await $fetch('/api/transactions/create', {
      method: 'POST',
      body: pending.data,
      headers: { Authorization: `Bearer ${token}` },
      credentials: 'include',
    })
    pendingSuggestion.value = null
    error.value = null
    messages.value.push({
      id: crypto.randomUUID(),
      text: `**Lançamento registrado!** ${pending.data.type === 'expense' ? 'Saída' : 'Entrada'} de ${formatCurrency(pending.data.amount)} em ${pending.data.description}.`,
      isUser: false,
    })
  } catch (e: unknown) {
    const errMsg =
      e && typeof e === 'object' && 'data' in e && e.data && typeof (e.data as { message?: string }).message === 'string'
        ? (e.data as { message: string }).message
        : e instanceof Error ? e.message : 'Erro ao criar lançamento.'
    error.value = errMsg
  } finally {
    isConfirmingTransaction.value = false
  }
}

function cancelSuggestion() {
  pendingSuggestion.value = null
  error.value = null
}

function removeAttachment(index: number) {
  attachments.value = attachments.value.filter((_, i) => i !== index)
}

function onAttachmentChange(event: Event) {
  const input = event.target as HTMLInputElement
  const files = input.files
  if (!files?.length) return
  const maxSize = 10 * 1024 * 1024 // 10 MB
  const imageTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
  const fileTypes = ['application/pdf', 'text/plain', 'text/csv', 'application/ofx']
  for (let i = 0; i < files.length; i++) {
    const file = files[i]
    if (file.size > maxSize) continue
    const isImage = imageTypes.includes(file.type)
    const isFile = fileTypes.includes(file.type) || file.name.toLowerCase().endsWith('.ofx')
    if (!isImage && !isFile) continue
    const reader = new FileReader()
    reader.onload = () => {
      const result = reader.result as string
      const base64 = result.includes(',') ? result.split(',')[1] : result
      if (!base64) return
      attachments.value = [...attachments.value, {
        type: isImage ? 'image' : 'file',
        name: file.name,
        base64,
        mime: file.type,
      }]
    }
    reader.readAsDataURL(file)
  }
  input.value = ''
}

async function sendMessage(textOverride?: string) {
  const text = (textOverride ?? message.value).trim()
  if ((!text && !attachments.value.length) || isLoading.value) return
  const textToSend = text || (attachments.value.length ? 'Segue extrato (imagem ou arquivo) para você analisar e me ajudar a lançar. Faça perguntas sobre cada lançamento para evitar erros ou duplicidade.' : '')
  if (!textToSend && !attachments.value.length) return
  if (!textOverride) message.value = ''

  const userMsgId = crypto.randomUUID()
  const userContent = textToSend + (attachments.value.length ? ` [Anexos: ${attachments.value.map(a => a.name).join(', ')}]` : '')
  messages.value.push({ id: userMsgId, text: userContent, isUser: true })
  const currentAttachments = [...attachments.value]
  attachments.value = []
  error.value = null
  pendingSuggestion.value = null
  isLoading.value = true

  const historyForApi = messages.value.map((m) => ({
    role: m.isUser ? ('user' as const) : ('assistant' as const),
    content: m.text,
  }))

  const supabase = useSupabaseClient()
  const { data: { session } } = await supabase.auth.getSession()
  const token = session?.access_token
  const { period } = useAppPeriod()

  try {
    const headers: Record<string, string> = {}
    if (token) headers.Authorization = `Bearer ${token}`

    const body: {
      messages: Array<{ role: 'user' | 'assistant'; content: string }>
      month: number
      year: number
      imageBase64?: string
      imageMime?: string
      fileBase64?: string
      fileName?: string
    } = {
      messages: historyForApi,
      month: period.value.month + 1,
      year: period.value.year,
    }
    const firstImage = currentAttachments.find(a => a.type === 'image')
    const firstFile = currentAttachments.find(a => a.type === 'file')
    if (firstImage) {
      body.imageBase64 = firstImage.base64
      body.imageMime = firstImage.mime ?? 'image/jpeg'
    }
    if (firstFile) {
      body.fileBase64 = firstFile.base64
      body.fileName = firstFile.name
    }

    const res = await $fetch<{ content: string; suggestedTransaction?: SuggestedTransaction }>('/api/chat/ai', {
      method: 'POST',
      body,
      headers,
      credentials: 'include',
    })

    const assistantId = crypto.randomUUID()
    messages.value.push({
      id: assistantId,
      text: res.content,
      isUser: false,
      suggestedTransaction: res.suggestedTransaction ?? null,
    })
    if (res.suggestedTransaction) {
      pendingSuggestion.value = { messageId: assistantId, data: res.suggestedTransaction }
    }
  } catch (e: unknown) {
    const errMsg =
      e && typeof e === 'object' && 'data' in e && e.data && typeof (e.data as { message?: string }).message === 'string'
        ? (e.data as { message: string }).message
        : e instanceof Error ? e.message : 'Erro ao falar com a IA. Tente de novo.'
    error.value = errMsg
    messages.value.push({
      id: crypto.randomUUID(),
      text: `Desculpe, não consegui responder agora: ${errMsg}`,
      isUser: false,
    })
  } finally {
    isLoading.value = false
  }
}

watch(
  () => props.isOpen,
  (open) => {
    if (open) {
      document.addEventListener('keydown', handleKeydown)
    } else {
      document.removeEventListener('keydown', handleKeydown)
    }
  },
  { immediate: true }
)

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeydown)
})
</script>

<template>
  <Teleport
    to="body"
    :disabled="props.embedded"
  >
    <Transition
      enter-active-class="transition ease-out duration-250"
      enter-from-class="opacity-0 translate-y-4 scale-95"
      enter-to-class="opacity-100 translate-y-0 scale-100"
      leave-active-class="transition ease-in duration-200"
      leave-from-class="opacity-100 translate-y-0 scale-100"
      leave-to-class="opacity-0 translate-y-4 scale-95"
    >
      <div
        v-if="isOpen"
        id="floating-chat-panel"
        class="flex w-full max-w-[360px] flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-xl dark:border-gray-700 dark:bg-gray-900"
        role="dialog"
        aria-label="Chat"
      >
        <!-- Header -->
        <div
          class="flex shrink-0 items-center justify-between border-b border-gray-200 px-4 py-3 dark:border-gray-700"
        >
          <h3 class="text-heading-sm font-semibold text-gray-900 dark:text-white">
            {{ title ?? 'Chat' }}
          </h3>
          <button
            type="button"
            class="rounded-lg p-2 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-200"
            aria-label="Fechar chat"
            @click="emit('close')"
          >
            <span class="material-symbols-outlined text-xl">close</span>
          </button>
        </div>

        <!-- Mensagens -->
        <div
          class="min-h-[200px] flex-1 overflow-y-auto p-4 scroll-smooth"
          style="max-height: 360px;"
        >
          <div
            v-if="messages.length === 0"
            class="flex min-h-[200px] flex-col items-center justify-center gap-4 py-2 text-center text-body-sm text-gray-500 dark:text-gray-400"
          >
            <span class="material-symbols-outlined text-4xl opacity-50">chat_bubble_outline</span>
            <p class="font-medium text-gray-700 dark:text-gray-300">Pergunte sobre suas finanças</p>
            <p class="text-caption text-gray-500 dark:text-gray-400">A Fê usa os dados do seu app para dar insights personalizados.</p>
            <div class="mt-2 flex w-full flex-col gap-2">
              <button
                v-for="(pergunta, idx) in PERGUNTAS_PREDEFINIDAS"
                :key="idx"
                type="button"
                class="rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-left text-body-sm text-gray-700 transition-colors hover:border-primary-300 hover:bg-primary-50 hover:text-primary-800 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200 dark:hover:border-primary-600 dark:hover:bg-primary-950 dark:hover:text-primary-200"
                @click="sendMessage(pergunta)"
              >
                {{ pergunta }}
              </button>
            </div>
          </div>
          <div v-else class="flex flex-col gap-3">
            <div
              v-for="m in messages"
              :key="m.id"
              class="flex min-w-0"
              :class="m.isUser ? 'justify-end' : 'justify-start'"
            >
              <!-- Mensagem do usuário: texto simples -->
              <span
                v-if="m.isUser"
                class="max-w-[85%] rounded-2xl px-5 py-3 text-[15px] leading-relaxed"
                :class="
                  m.isUser
                    ? 'bg-primary text-white'
                    : 'bg-gray-100 text-gray-900 dark:bg-gray-800 dark:text-gray-100'
               "
              >
                {{ m.text }}
              </span>
              <!-- Resposta da Fê: markdown renderizado (títulos, negrito, listas) -->
              <div
                v-else
                class="chat-message chat-prose min-w-0 max-w-[90%] rounded-2xl px-6 py-4 text-[15px] leading-relaxed break-words overflow-hidden"
                :class="
                  m.isUser
                    ? 'bg-primary text-white'
                    : 'bg-gray-100 text-gray-900 dark:bg-gray-800 dark:text-gray-100'
               "
                v-html="markdownToHtml(m.text)"
              />
            </div>
            <div
              v-if="isLoading"
              class="flex justify-start"
            >
              <span
                class="flex items-center gap-2 rounded-2xl bg-gray-100 px-6 py-4 text-[15px] leading-relaxed text-gray-500 dark:bg-gray-800 dark:text-gray-400"
              >
                <span class="material-symbols-outlined animate-spin text-lg">progress_activity</span>
                Analisando seus dados...
              </span>
            </div>
            <!-- Card de confirmação de lançamento sugerido pela Fê -->
            <div
              v-if="pendingSuggestion"
              class="flex justify-start"
            >
              <div
                class="max-w-[90%] rounded-2xl border border-primary-200 bg-primary-50/80 p-4 dark:border-primary-800 dark:bg-primary-950/50"
              >
                <p class="mb-2 text-body-sm font-medium text-gray-800 dark:text-gray-200">
                  {{ pendingSuggestion.data.type === 'expense' ? 'Saída' : 'Entrada' }} de {{ formatCurrency(pendingSuggestion.data.amount) }} — {{ pendingSuggestion.data.description }}
                </p>
                <p class="mb-3 text-caption text-gray-600 dark:text-gray-400">
                  {{ pendingSuggestion.data.transaction_date }} · Confirma o lançamento?
                </p>
                <div class="flex gap-2">
                  <button
                    type="button"
                    class="rounded-xl bg-primary px-4 py-2 text-body-sm font-medium text-white transition-colors hover:bg-primary-600 disabled:opacity-60"
                    :disabled="isConfirmingTransaction"
                    @click="confirmTransaction"
                  >
                    {{ isConfirmingTransaction ? 'Registrando...' : 'Confirmar e lançar' }}
                  </button>
                  <button
                    type="button"
                    class="rounded-xl border border-gray-300 bg-white px-4 py-2 text-body-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
                    :disabled="isConfirmingTransaction"
                    @click="cancelSuggestion"
                  >
                    Cancelar
                  </button>
                </div>
                <p
                  v-if="error"
                  class="mt-2 text-caption text-red-600 dark:text-red-400"
                >
                  {{ error }}
                </p>
              </div>
            </div>
          </div>
        </div>

        <!-- Input -->
        <div
          class="shrink-0 border-t border-gray-200 p-3 dark:border-gray-700"
        >
          <!-- Anexos (imagem ou arquivo de extrato) -->
          <div
            v-if="hasAttachments"
            class="mb-2 flex flex-wrap gap-2"
          >
            <span
              v-for="(att, idx) in attachments"
              :key="idx"
              class="inline-flex items-center gap-1 rounded-lg border border-gray-200 bg-gray-100 px-2 py-1 text-caption text-gray-700 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300"
            >
              <span class="material-symbols-outlined text-base">{{ att.type === 'image' ? 'image' : 'description' }}</span>
              {{ att.name }}
              <button
                type="button"
                class="rounded p-0.5 hover:bg-gray-200 dark:hover:bg-gray-600"
                aria-label="Remover anexo"
                @click="removeAttachment(idx)"
              >
                <span class="material-symbols-outlined text-sm">close</span>
              </button>
            </span>
          </div>
          <div class="flex gap-2">
            <input
              ref="attachmentInputRef"
              type="file"
              accept=".jpg,.jpeg,.png,.webp,.gif,.pdf,.txt,.csv,.ofx,image/*"
              class="hidden"
              @change="onAttachmentChange"
            >
            <button
              type="button"
              class="flex size-10 shrink-0 items-center justify-center rounded-xl border border-gray-200 bg-gray-50 text-gray-600 transition-colors hover:bg-gray-100 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700 disabled:opacity-60"
              aria-label="Anexar imagem ou extrato"
              :disabled="isLoading"
              @click="attachmentInputRef?.click()"
            >
              <span class="material-symbols-outlined text-xl">attach_file</span>
            </button>
            <input
              v-model="message"
              type="text"
              placeholder="Digite ou anexe extrato para lançar..."
              class="flex-1 rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-body-sm placeholder:text-gray-400 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 dark:border-gray-700 dark:bg-gray-800 dark:placeholder:text-gray-500 disabled:opacity-60"
              :disabled="isLoading"
              @keydown.enter.prevent="sendMessage"
            >
            <button
              type="button"
              class="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary text-white transition-colors hover:bg-primary-600 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed"
              aria-label="Enviar mensagem"
              :disabled="isLoading"
              @click="sendMessage"
            >
              <span
                v-if="isLoading"
                class="material-symbols-outlined text-xl animate-spin"
              >progress_activity</span>
              <span v-else class="material-symbols-outlined text-xl">send</span>
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.chat-message {
  overflow-wrap: break-word;
  word-break: break-word;
}
.chat-prose :deep(.chat-h1) {
  @apply mt-3 mb-1 text-base font-semibold break-words;
}
.chat-prose :deep(.chat-h2) {
  @apply mt-3 mb-1 text-[15px] font-semibold break-words;
}
.chat-prose :deep(.chat-h3) {
  @apply mt-2 mb-0.5 text-[15px] font-semibold break-words;
}
.chat-prose :deep(.chat-list) {
  @apply my-2 ml-2 list-disc space-y-0.5 break-words pr-1;
}
.chat-prose :deep(ol.chat-list) {
  list-style-type: decimal;
}
.chat-prose :deep(.chat-li) {
  @apply pl-0.5 break-words;
}
.chat-prose :deep(br) {
  @apply block;
  content: '';
  margin-top: 0.25rem;
}
</style>
