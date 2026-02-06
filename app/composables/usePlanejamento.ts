import { computed, ref, toValue, type MaybeRefOrGetter } from 'vue'
import { useSupabaseClient } from '#imports'
import type {
  Database,
  Planning,
  PlanningCategory,
  PlanningEntry,
  PlanningInstallment,
  PlanningSaving,
} from '../../shared/types/database.types'

export type PlanningPhase = 'before' | 'during' | 'after'

export type PlanningCategoryFormData = {
  name: string
  icon?: string | null
  color?: string | null
}

export type EntryFormData = {
  planning_category_id: string
  phase: PlanningPhase
  description?: string | null
  amount_planned: number
  amount_actual?: number | null
  entry_date: string
  /** Quando false, o lançamento fica visível mas é excluído dos totais do dashboard. */
  is_active?: boolean
}

export type InstallmentFormData = {
  description?: string | null
  installment_number: number
  total_installments: number
  amount: number
  due_date: string
}

export type SavingFormData = {
  amount: number
  saved_at: string
  description?: string | null
}

/**
 * usePlanejamento - Composable para um planejamento específico (detalhe)
 * Escopo: planejamento, categorias, lançamentos, parcelas; CRUD e totais para dashboard
 */
export function usePlanejamento(planningId: MaybeRefOrGetter<string | null>) {
  const supabase = useSupabaseClient<Database>()

  const planning = ref<Planning | null>(null)
  const categories = ref<PlanningCategory[]>([])
  const entries = ref<PlanningEntry[]>([])
  const installments = ref<PlanningInstallment[]>([])
  const savings = ref<PlanningSaving[]>([])
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  const id = computed(() => toValue(planningId))

  async function getUserId(): Promise<string | null> {
    const { data: { user: authUser } } = await supabase.auth.getUser()
    return authUser?.id ?? null
  }

  async function fetchPlanejamento() {
    const pid = id.value
    const userId = await getUserId()
    if (!pid || !userId) return

    isLoading.value = true
    error.value = null
    try {
      const { data, error: err } = await supabase
        .from('plannings')
        .select('*')
        .eq('id', pid)
        .eq('user_id', userId)
        .single()

      if (err) throw err
      planning.value = data
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Erro ao carregar planejamento'
      planning.value = null
    } finally {
      isLoading.value = false
    }
  }

  async function fetchCategories() {
    const pid = id.value
    const userId = await getUserId()
    if (!pid || !userId) return

    try {
      const { data, error: err } = await supabase
        .from('planning_categories')
        .select('*')
        .eq('planning_id', pid)
        .eq('user_id', userId)
        .order('name', { ascending: true })

      if (err) throw err
      categories.value = data ?? []
    } catch (e) {
      categories.value = []
    }
  }

  async function fetchEntries() {
    const pid = id.value
    const userId = await getUserId()
    if (!pid || !userId) return

    try {
      const { data, error: err } = await supabase
        .from('planning_entries')
        .select('*')
        .eq('planning_id', pid)
        .eq('user_id', userId)
        .order('entry_date', { ascending: false })

      if (err) throw err
      entries.value = data ?? []
    } catch (e) {
      entries.value = []
    }
  }

  async function fetchInstallments() {
    const pid = id.value
    const userId = await getUserId()
    if (!pid || !userId) return

    try {
      const { data, error: err } = await supabase
        .from('planning_installments')
        .select('*')
        .eq('planning_id', pid)
        .eq('user_id', userId)
        .order('installment_number', { ascending: true })

      if (err) throw err
      installments.value = data ?? []
    } catch (e) {
      installments.value = []
    }
  }

  async function fetchSavings() {
    const pid = id.value
    const userId = await getUserId()
    if (!pid || !userId) return

    try {
      const { data, error: err } = await supabase
        .from('planning_savings')
        .select('*')
        .eq('planning_id', pid)
        .eq('user_id', userId)
        .order('saved_at', { ascending: false })

      if (err) throw err
      savings.value = data ?? []
    } catch (e) {
      savings.value = []
    }
  }

  async function fetchAll() {
    await Promise.all([
      fetchPlanejamento(),
      fetchCategories(),
      fetchEntries(),
      fetchInstallments(),
      fetchSavings(),
    ])
  }

  // --- Categories CRUD ---
  async function createCategory(payload: PlanningCategoryFormData) {
    const pid = id.value
    const userId = await getUserId()
    if (!pid || !userId) return { data: null as PlanningCategory | null, error: 'Não autenticado' }

    try {
      const { data, error: err } = await supabase
        .from('planning_categories')
        .insert({
          planning_id: pid,
          user_id: userId,
          name: payload.name,
          icon: payload.icon ?? null,
          color: payload.color ?? null,
        })
        .select()
        .single()

      if (err) throw err
      if (data) categories.value = [...categories.value, data as PlanningCategory]
      return { data: data as PlanningCategory, error: null }
    } catch (e) {
      return { data: null, error: e instanceof Error ? e.message : 'Erro ao criar categoria' }
    }
  }

  async function updateCategory(categoryId: string, payload: Partial<PlanningCategoryFormData>) {
    const userId = await getUserId()
    if (!userId) return { data: null as PlanningCategory | null, error: 'Não autenticado' }

    try {
      const { data, error: err } = await supabase
        .from('planning_categories')
        .update({ ...payload, updated_at: new Date().toISOString() })
        .eq('id', categoryId)
        .eq('user_id', userId)
        .select()
        .single()

      if (err) throw err
      if (data) {
        const idx = categories.value.findIndex((c) => c.id === categoryId)
        if (idx >= 0) {
          const next = [...categories.value]
          next[idx] = data as PlanningCategory
          categories.value = next
        }
      }
      return { data: data as PlanningCategory, error: null }
    } catch (e) {
      return { data: null, error: e instanceof Error ? e.message : 'Erro ao atualizar categoria' }
    }
  }

  async function deleteCategory(categoryId: string) {
    const userId = await getUserId()
    if (!userId) return { error: 'Não autenticado' }

    try {
      const { error: err } = await supabase
        .from('planning_categories')
        .delete()
        .eq('id', categoryId)
        .eq('user_id', userId)

      if (err) throw err
      categories.value = categories.value.filter((c) => c.id !== categoryId)
      return { error: null }
    } catch (e) {
      return { error: e instanceof Error ? e.message : 'Erro ao excluir categoria' }
    }
  }

  // --- Entries CRUD ---
  async function createEntry(payload: EntryFormData) {
    const pid = id.value
    const userId = await getUserId()
    if (!pid || !userId) return { data: null as PlanningEntry | null, error: 'Não autenticado' }

    try {
      const { data, error: err } = await supabase
        .from('planning_entries')
        .insert({
          planning_id: pid,
          user_id: userId,
          planning_category_id: payload.planning_category_id,
          phase: payload.phase,
          description: payload.description ?? null,
          amount_planned: payload.amount_planned,
          amount_actual: payload.amount_actual ?? null,
          entry_date: payload.entry_date,
          is_active: payload.is_active ?? true,
        })
        .select()
        .single()

      if (err) throw err
      if (data) entries.value = [data as PlanningEntry, ...entries.value]
      return { data: data as PlanningEntry, error: null }
    } catch (e) {
      return { data: null, error: e instanceof Error ? e.message : 'Erro ao criar lançamento' }
    }
  }

  async function updateEntry(entryId: string, payload: Partial<EntryFormData>) {
    const userId = await getUserId()
    if (!userId) return { data: null as PlanningEntry | null, error: 'Não autenticado' }

    try {
      const { data, error: err } = await supabase
        .from('planning_entries')
        .update({ ...payload, updated_at: new Date().toISOString() })
        .eq('id', entryId)
        .eq('user_id', userId)
        .select()
        .single()

      if (err) throw err
      if (data) {
        const idx = entries.value.findIndex((e) => e.id === entryId)
        if (idx >= 0) {
          const next = [...entries.value]
          next[idx] = data as PlanningEntry
          entries.value = next
        }
      }
      return { data: data as PlanningEntry, error: null }
    } catch (e) {
      return { data: null, error: e instanceof Error ? e.message : 'Erro ao atualizar lançamento' }
    }
  }

  async function deleteEntry(entryId: string) {
    const userId = await getUserId()
    if (!userId) return { error: 'Não autenticado' }

    try {
      const { error: err } = await supabase
        .from('planning_entries')
        .delete()
        .eq('id', entryId)
        .eq('user_id', userId)

      if (err) throw err
      entries.value = entries.value.filter((e) => e.id !== entryId)
      return { error: null }
    } catch (e) {
      return { error: e instanceof Error ? e.message : 'Erro ao excluir lançamento' }
    }
  }

  // --- Installments CRUD ---
  async function createInstallment(payload: InstallmentFormData) {
    const pid = id.value
    const userId = await getUserId()
    if (!pid || !userId) return { data: null as PlanningInstallment | null, error: 'Não autenticado' }

    try {
      const { data, error: err } = await supabase
        .from('planning_installments')
        .insert({
          planning_id: pid,
          user_id: userId,
          description: payload.description ?? null,
          installment_number: payload.installment_number,
          total_installments: payload.total_installments,
          amount: payload.amount,
          due_date: payload.due_date,
        })
        .select()
        .single()

      if (err) throw err
      if (data) installments.value = [...installments.value, data as PlanningInstallment].sort((a, b) => a.installment_number - b.installment_number)
      return { data: data as PlanningInstallment, error: null }
    } catch (e) {
      return { data: null, error: e instanceof Error ? e.message : 'Erro ao criar parcela' }
    }
  }

  async function updateInstallment(installmentId: string, payload: Partial<InstallmentFormData> & { paid_at?: string | null }) {
    const userId = await getUserId()
    if (!userId) return { data: null as PlanningInstallment | null, error: 'Não autenticado' }

    try {
      const { data, error: err } = await supabase
        .from('planning_installments')
        .update({ ...payload, updated_at: new Date().toISOString() })
        .eq('id', installmentId)
        .eq('user_id', userId)
        .select()
        .single()

      if (err) throw err
      if (data) {
        const idx = installments.value.findIndex((i) => i.id === installmentId)
        if (idx >= 0) {
          const next = [...installments.value]
          next[idx] = data as PlanningInstallment
          installments.value = next.sort((a, b) => a.installment_number - b.installment_number)
        }
      }
      return { data: data as PlanningInstallment, error: null }
    } catch (e) {
      return { data: null, error: e instanceof Error ? e.message : 'Erro ao atualizar parcela' }
    }
  }

  async function deleteInstallment(installmentId: string) {
    const userId = await getUserId()
    if (!userId) return { error: 'Não autenticado' }

    try {
      const { error: err } = await supabase
        .from('planning_installments')
        .delete()
        .eq('id', installmentId)
        .eq('user_id', userId)

      if (err) throw err
      installments.value = installments.value.filter((i) => i.id !== installmentId)
      return { error: null }
    } catch (e) {
      return { error: e instanceof Error ? e.message : 'Erro ao excluir parcela' }
    }
  }

  async function markInstallmentPaid(installmentId: string, paid: boolean) {
    return updateInstallment(installmentId, { paid_at: paid ? new Date().toISOString() : null })
  }

  // --- Savings (valor guardado) CRUD ---
  async function createSaving(payload: SavingFormData) {
    const pid = id.value
    const userId = await getUserId()
    if (!pid || !userId) return { data: null as PlanningSaving | null, error: 'Não autenticado' }

    try {
      const { data, error: err } = await supabase
        .from('planning_savings')
        .insert({
          planning_id: pid,
          user_id: userId,
          amount: payload.amount,
          saved_at: payload.saved_at,
          description: payload.description ?? null,
        })
        .select()
        .single()

      if (err) throw err
      if (data) savings.value = [data as PlanningSaving, ...savings.value]
      return { data: data as PlanningSaving, error: null }
    } catch (e) {
      return { data: null, error: e instanceof Error ? e.message : 'Erro ao registrar valor guardado' }
    }
  }

  async function updateSaving(savingId: string, payload: Partial<SavingFormData>) {
    const userId = await getUserId()
    if (!userId) return { data: null as PlanningSaving | null, error: 'Não autenticado' }

    try {
      const { data, error: err } = await supabase
        .from('planning_savings')
        .update({ ...payload, updated_at: new Date().toISOString() })
        .eq('id', savingId)
        .eq('user_id', userId)
        .select()
        .single()

      if (err) throw err
      if (data) {
        const idx = savings.value.findIndex((s) => s.id === savingId)
        if (idx >= 0) {
          const next = [...savings.value]
          next[idx] = data as PlanningSaving
          savings.value = next.sort((a, b) => (b.saved_at > a.saved_at ? 1 : -1))
        }
      }
      return { data: data as PlanningSaving, error: null }
    } catch (e) {
      return { data: null, error: e instanceof Error ? e.message : 'Erro ao atualizar valor guardado' }
    }
  }

  async function deleteSaving(savingId: string) {
    const userId = await getUserId()
    if (!userId) return { error: 'Não autenticado' }

    try {
      const { error: err } = await supabase
        .from('planning_savings')
        .delete()
        .eq('id', savingId)
        .eq('user_id', userId)

      if (err) throw err
      savings.value = savings.value.filter((s) => s.id !== savingId)
      return { error: null }
    } catch (e) {
      return { error: e instanceof Error ? e.message : 'Erro ao excluir valor guardado' }
    }
  }

  // --- Totals for dashboard (só lançamentos ativos / incluídos nos totais) ---
  const activeEntries = computed(() => entries.value.filter((e) => e.is_active !== false))

  const totalsByPhase = computed(() => {
    const phases: Record<PlanningPhase, { planned: number; actual: number }> = {
      before: { planned: 0, actual: 0 },
      during: { planned: 0, actual: 0 },
      after: { planned: 0, actual: 0 },
    }
    for (const e of activeEntries.value) {
      const p = e.phase as PlanningPhase
      if (p in phases) {
        phases[p].planned += Number(e.amount_planned)
        phases[p].actual += Number(e.amount_actual ?? 0)
      }
    }
    return phases
  })

  const totalsByCategory = computed(() => {
    const map: Record<string, { name: string; planned: number; actual: number }> = {}
    for (const e of activeEntries.value) {
      const cat = categories.value.find((c) => c.id === e.planning_category_id)
      const name = cat?.name ?? 'Sem categoria'
      if (!map[e.planning_category_id]) {
        map[e.planning_category_id] = { name, planned: 0, actual: 0 }
      }
      map[e.planning_category_id].planned += Number(e.amount_planned)
      map[e.planning_category_id].actual += Number(e.amount_actual ?? 0)
    }
    return Object.values(map)
  })

  const totalPlanned = computed(() => activeEntries.value.reduce((s, e) => s + Number(e.amount_planned), 0))
  const totalActual = computed(() => activeEntries.value.reduce((s, e) => s + Number(e.amount_actual ?? 0), 0))
  const installmentsTotal = computed(() => installments.value.reduce((s, i) => s + Number(i.amount), 0))
  const installmentsPaidTotal = computed(() =>
    installments.value.filter((i) => i.paid_at).reduce((s, i) => s + Number(i.amount), 0)
  )
  const totalSaved = computed(() => savings.value.reduce((s, i) => s + Number(i.amount), 0))

  return {
    planning,
    categories,
    entries,
    installments,
    savings,
    isLoading,
    error,
    id,
    fetchPlanejamento,
    fetchCategories,
    fetchEntries,
    fetchInstallments,
    fetchSavings,
    fetchAll,
    createCategory,
    updateCategory,
    deleteCategory,
    createEntry,
    updateEntry,
    deleteEntry,
    createInstallment,
    updateInstallment,
    deleteInstallment,
    markInstallmentPaid,
    createSaving,
    updateSaving,
    deleteSaving,
    totalsByPhase,
    totalsByCategory,
    totalPlanned,
    totalActual,
    totalSaved,
    installmentsTotal,
    installmentsPaidTotal,
  }
}
