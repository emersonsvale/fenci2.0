<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { useSupabaseClient } from '#imports'
import { useAppPeriod } from '../composables/useAppPeriod'

/**
 * Card de insight da Fê exibido ao carregar a tela.
 * Mostra avatar + balão de mensagem com uma frase gerada pela IA.
 * Quando embedded, fica compacto junto ao botão flutuante (FloatingChatWidget).
 */

const props = withDefaults(
  defineProps<{ embedded?: boolean }>(),
  { embedded: false }
)

const insight = ref<string | null>(null)
const isLoading = ref(true)
const error = ref<string | null>(null)
const dismissed = ref(false)

const { period, monthCalendar } = useAppPeriod()

async function fetchInsight() {
  const supabase = useSupabaseClient()
  const { data: { session } } = await supabase.auth.getSession()
  const token = session?.access_token
  if (!token) {
    isLoading.value = false
    return
  }

  isLoading.value = true
  error.value = null
  try {
    const { insight: text } = await $fetch<{ insight: string }>('/api/chat/insight', {
      query: {
        month: monthCalendar(),
        year: period.value.year,
      },
      headers: {
        Authorization: `Bearer ${token}`,
      },
      credentials: 'include',
    })
    insight.value = text?.trim() || null
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Não foi possível carregar o insight.'
  } finally {
    isLoading.value = false
  }
}

function dismiss() {
  dismissed.value = true
}

onMounted(() => {
  fetchInsight()
})

// Atualiza o insight ao mudar o período
watch(
  () => [period.value.month, period.value.year],
  () => {
    if (!dismissed.value && insight.value) {
      fetchInsight()
    }
  }
)
</script>

<template>
  <Transition
    enter-active-class="transition ease-out duration-300"
    enter-from-class="opacity-0 translate-y-2"
    enter-to-class="opacity-100 translate-y-0"
    leave-active-class="transition ease-in duration-200"
    leave-from-class="opacity-100 translate-y-0"
    leave-to-class="opacity-0 translate-y-2"
  >
    <div
      v-if="!dismissed && (insight || isLoading || error)"
      id="fe-insight-card"
      class="flex items-start gap-2 rounded-2xl border border-primary-200 bg-primary-50/90 dark:border-primary-800 dark:bg-primary-950/60"
      :class="props.embedded ? 'p-3' : 'gap-3 p-4'"
      role="status"
      aria-live="polite"
    >
      <!-- Avatar Fê -->
      <div
        class="flex shrink-0 overflow-hidden rounded-full border-2 border-primary-200 dark:border-primary-700"
        :class="props.embedded ? 'size-10' : 'size-12'"
      >
        <img
          src="/Elipse.png"
          alt=""
          class="size-full object-cover"
          width="48"
          height="48"
        >
      </div>

      <!-- Balão de mensagem -->
      <div class="min-w-0 flex-1">
        <div
          class="relative rounded-xl bg-primary-100 dark:bg-primary-900/80"
          :class="props.embedded ? 'px-3 py-2' : 'px-4 py-3'"
        >
          <!-- Rabo do balão (apontando para o avatar) -->
          <div
            class="fe-bubble-tail absolute left-0 border-[6px] border-transparent border-r-primary-100 dark:border-r-primary-900"
            :class="props.embedded ? 'top-2' : 'top-4'"
            aria-hidden
          />
          <p
            v-if="isLoading"
            class="text-body-sm text-primary-800 dark:text-primary-200"
            :class="props.embedded ? 'text-[13px]' : ''"
          >
            <span class="inline-block size-4 animate-pulse rounded bg-primary-300 dark:bg-primary-600" />
            Fê está pensando...
          </p>
          <p
            v-else-if="error"
            class="text-body-sm text-red-600 dark:text-red-400"
            :class="props.embedded ? 'text-[13px]' : ''"
          >
            {{ error }}
          </p>
          <p
            v-else-if="insight"
            class="text-body-sm font-medium leading-relaxed text-primary-900 dark:text-primary-100"
            :class="props.embedded ? 'text-[13px]' : ''"
          >
            {{ insight }}
          </p>
        </div>
        <p
          class="text-caption text-primary-600 dark:text-primary-400"
          :class="props.embedded ? 'mt-0.5 text-[11px]' : 'mt-1'"
        >
          Fê · Assistente Financeira
        </p>
      </div>

      <!-- Fechar -->
      <button
        type="button"
        class="shrink-0 rounded-lg p-1.5 text-primary-600 transition-colors hover:bg-primary-200/50 hover:text-primary-800 dark:text-primary-400 dark:hover:bg-primary-800/50 dark:hover:text-primary-200"
        aria-label="Fechar mensagem"
        @click="dismiss"
      >
        <span class="material-symbols-outlined text-xl">close</span>
      </button>
    </div>
  </Transition>
</template>

<style scoped>
.fe-bubble-tail {
  width: 0;
  height: 0;
  margin-left: -6px;
  border-top-width: 6px;
  border-bottom-width: 6px;
  border-right-width: 8px;
}
</style>
