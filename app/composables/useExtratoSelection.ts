import { ref, computed } from 'vue'

/**
 * useExtratoSelection - Estado de seleção múltipla na página de extrato
 * Mantém os IDs selecionados e expõe helpers para toggle/limpar
 */

const SELECTION_STATE_KEY = 'extrato-selection-ids'

export function useExtratoSelection() {
  const selectedIds = useState<Set<string>>(SELECTION_STATE_KEY, () => new Set())

  const isSelected = (id: string): boolean => selectedIds.value.has(id)

  function toggle(id: string) {
    const next = new Set(selectedIds.value)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    selectedIds.value = next
  }

  function clear() {
    selectedIds.value = new Set()
  }

  const selectedCount = computed(() => selectedIds.value.size)
  const hasSelection = computed(() => selectedIds.value.size > 0)
  const selectedIdsList = computed(() => Array.from(selectedIds.value))

  return {
    selectedIds,
    selectedIdsList,
    selectedCount,
    hasSelection,
    isSelected,
    toggle,
    clear,
  }
}
