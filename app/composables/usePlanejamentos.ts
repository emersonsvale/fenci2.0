import { useSupabaseClient } from '#imports'
import type { Database, Planning } from 'shared/types/database.types'

export type PlanningFormData = {
  name: string
  type?: string | null
  status?: string | null
  date_start?: string | null
  date_end?: string | null
  budget_total?: number | null
  notes?: string | null
}

export type PlanningTotals = {
  totalPlanned: number
  totalActual: number
  totalSaved: number
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
  const totalsByPlanningId = useState<Record<string, PlanningTotals>>('planejamentos-totalsByPlanningId', () => ({}))

  async function fetchTotalsForPlannings(planningIds: string[], userId: string) {
    if (planningIds.length === 0) return
    const map: Record<string, PlanningTotals> = {}
    for (const id of planningIds) {
      map[id] = { totalPlanned: 0, totalActual: 0, totalSaved: 0 }
    }
    const { data: entriesData } = await supabase
      .from('planning_entries')
      .select('planning_id, amount_planned, amount_actual, is_active')
      .in('planning_id', planningIds)
      .eq('user_id', userId)
    const activeEntries = (entriesData ?? []).filter((e) => e.is_active !== false)
    for (const e of activeEntries) {
      map[e.planning_id].totalPlanned += Number(e.amount_planned)
      map[e.planning_id].totalActual += Number(e.amount_actual ?? 0)
    }
    const { data: savingsData } = await supabase
      .from('planning_savings')
      .select('planning_id, amount')
      .in('planning_id', planningIds)
      .eq('user_id', userId)
    for (const s of savingsData ?? []) {
      map[s.planning_id].totalSaved += Number(s.amount)
    }
    totalsByPlanningId.value = { ...totalsByPlanningId.value, ...map }
  }

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
      await fetchTotalsForPlannings(
        list.value.map((p) => p.id),
        userId,
      )
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Erro ao carregar planejamentos'
      list.value = []
      totalsByPlanningId.value = {}
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
      if (data) {
        list.value = [data, ...list.value]
        totalsByPlanningId.value = { ...totalsByPlanningId.value, [data.id]: { totalPlanned: 0, totalActual: 0, totalSaved: 0 } }
      }
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
      const next = { ...totalsByPlanningId.value }
      delete next[id]
      totalsByPlanningId.value = next
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
    totalsByPlanningId,
    fetchPlanejamentos,
    createPlanejamento,
    updatePlanejamento,
    deletePlanejamento,
  }
}
