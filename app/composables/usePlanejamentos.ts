import { useSupabaseClient } from '#imports'
import type { Database, Planning } from '../../shared/types/database.types'

export type PlanningFormData = {
  name: string
  type?: string | null
  status?: string | null
  date_start?: string | null
  date_end?: string | null
  budget_total?: number | null
  notes?: string | null
}

/**
 * usePlanejamentos - Composable para lista e CRUD de planejamentos
 * Usado na página de listagem e para criar/editar/excluir planejamentos
 */
export function usePlanejamentos() {
  const supabase = useSupabaseClient<Database>()

  const isLoading = useState<boolean>('planejamentos-isLoading', () => false)
  const error = useState<string | null>('planejamentos-error', () => null)
  const list = useState<Planning[]>('planejamentos-list', () => [])

  async function fetchPlanejamentos() {
    const { data: authData } = await supabase.auth.getUser()
    const userId = authData?.user?.id
    if (!userId) return

    isLoading.value = true
    error.value = null
    try {
      const { data, error: err } = await supabase
        .from('plannings')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })

      if (err) throw err
      list.value = data ?? []
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Erro ao carregar planejamentos'
      list.value = []
    } finally {
      isLoading.value = false
    }
  }

  async function createPlanejamento(payload: PlanningFormData) {
    const { data: authData } = await supabase.auth.getUser()
    const userId = authData?.user?.id
    if (!userId) return { data: null as Planning | null, error: 'Usuário não autenticado' }

    isLoading.value = true
    error.value = null
    try {
      const { data, error: err } = await supabase
        .from('plannings')
        .insert({
          user_id: userId,
          name: payload.name,
          type: payload.type ?? null,
          status: payload.status ?? 'rascunho',
          date_start: payload.date_start ?? null,
          date_end: payload.date_end ?? null,
          budget_total: payload.budget_total ?? null,
          notes: payload.notes ?? null,
        })
        .select()
        .single()

      if (err) throw err
      if (data) list.value = [data, ...list.value]
      return { data: data as Planning, error: null }
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Erro ao criar planejamento'
      error.value = msg
      return { data: null, error: msg }
    } finally {
      isLoading.value = false
    }
  }

  async function updatePlanejamento(id: string, payload: Partial<PlanningFormData>) {
    const { data: authData } = await supabase.auth.getUser()
    const userId = authData?.user?.id
    if (!userId) return { data: null as Planning | null, error: 'Usuário não autenticado' }

    isLoading.value = true
    error.value = null
    try {
      const { data, error: err } = await supabase
        .from('plannings')
        .update({
          ...payload,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .eq('user_id', userId)
        .select()
        .single()

      if (err) throw err
      if (data) {
        const idx = list.value.findIndex((p) => p.id === id)
        if (idx >= 0) {
          const next = [...list.value]
          next[idx] = data as Planning
          list.value = next
        }
      }
      return { data: data as Planning, error: null }
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Erro ao atualizar planejamento'
      error.value = msg
      return { data: null, error: msg }
    } finally {
      isLoading.value = false
    }
  }

  async function deletePlanejamento(id: string) {
    const { data: authData } = await supabase.auth.getUser()
    const userId = authData?.user?.id
    if (!userId) return { error: 'Usuário não autenticado' }

    isLoading.value = true
    error.value = null
    try {
      const { error: err } = await supabase
        .from('plannings')
        .delete()
        .eq('id', id)
        .eq('user_id', userId)

      if (err) throw err
      list.value = list.value.filter((p) => p.id !== id)
      return { error: null }
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Erro ao excluir planejamento'
      error.value = msg
      return { error: msg }
    } finally {
      isLoading.value = false
    }
  }

  return {
    list,
    isLoading,
    error,
    fetchPlanejamentos,
    createPlanejamento,
    updatePlanejamento,
    deletePlanejamento,
  }
}
