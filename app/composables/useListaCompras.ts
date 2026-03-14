import { computed, ref, toValue, type MaybeRefOrGetter } from 'vue'
import { useSupabaseClient } from '#imports'
import type { Database, ShoppingListItem, ShoppingListCategory } from 'shared/types/database.types'
import type { ShoppingListItemStatus } from 'shared/constants/shoppingList'

export type ShoppingListItemFormData = {
  product_name: string
  status?: ShoppingListItemStatus
  quantity?: number | null
  unit?: string | null
  category_id?: string | null
  priority?: string
  purchase_location?: string | null
  price_estimated?: number | null
  price_actual?: number | null
  notes?: string | null
  stock_current?: number | null
  stock_minimum?: number | null
  recipe_reference?: string | null
}

/**
 * useListaCompras - Composable para lista de compras (planejamento tipo lista_compras).
 * Carrega categorias (corredores), itens do planejamento, CRUD de itens e totais do carrinho.
 */
export function useListaCompras(planningId: MaybeRefOrGetter<string | null>) {
  const supabase = useSupabaseClient<Database>()

  const categories = ref<ShoppingListCategory[]>([])
  const items = ref<ShoppingListItem[]>([])
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  const id = computed(() => toValue(planningId))

  async function getUserId(): Promise<string | null> {
    const { data: { user } } = await supabase.auth.getUser()
    return user?.id ?? null
  }

  async function fetchCategories() {
    try {
      const { data, error: err } = await supabase
        .from('shopping_list_categories')
        .select('*')
        .order('sort_order', { ascending: true })

      if (err) throw err
      categories.value = data ?? []
    } catch (e) {
      categories.value = []
    }
  }

  function getErrorMessage(e: unknown): string {
    if (e instanceof Error) return e.message
    if (e && typeof e === 'object' && 'message' in e && typeof (e as { message: unknown }).message === 'string') {
      return (e as { message: string }).message
    }
    return 'Erro ao carregar itens'
  }

  async function fetchItems() {
    const pid = id.value
    const userId = await getUserId()
    if (!pid || !userId) {
      return
    }

    isLoading.value = true
    error.value = null
    try {
      const { data, error: err } = await supabase
        .from('shopping_list_items')
        .select('*')
        .eq('planning_id', pid)
        .eq('user_id', userId)
        .order('product_name', { ascending: true })

      if (err) throw err
      items.value = data ?? []
    } catch (e) {
      const msg = getErrorMessage(e)
      const isTableMissing =
        typeof msg === 'string' &&
        (msg.includes('does not exist') || msg.includes('não existe') || msg.includes('relation'))
      error.value = isTableMissing
        ? 'Tabelas da Lista de Compras não encontradas. Execute a migration no Supabase (20260314000000_create_shopping_list_tables.sql).'
        : msg
      items.value = []
    } finally {
      isLoading.value = false
    }
  }

  async function fetchAll() {
    await Promise.all([fetchCategories(), fetchItems()])
  }

  async function createItem(payload: ShoppingListItemFormData) {
    const pid = id.value
    const userId = await getUserId()
    if (!pid || !userId) return { data: null as ShoppingListItem | null, error: 'Não autenticado' }

    try {
      const { data, error: err } = await supabase
        .from('shopping_list_items')
        .insert({
          planning_id: pid,
          user_id: userId,
          product_name: payload.product_name,
          status: payload.status ?? 'a_comprar',
          quantity: payload.quantity ?? 1,
          unit: payload.unit ?? 'Unidades',
          category_id: payload.category_id ?? null,
          priority: payload.priority ?? 'media',
          purchase_location: payload.purchase_location ?? null,
          price_estimated: payload.price_estimated ?? null,
          price_actual: payload.price_actual ?? null,
          notes: payload.notes ?? null,
          stock_current: payload.stock_current ?? null,
          stock_minimum: payload.stock_minimum ?? null,
          recipe_reference: payload.recipe_reference ?? null,
        })
        .select()
        .single()

      if (err) throw err
      if (data) items.value = [data as ShoppingListItem, ...items.value]
      return { data: data as ShoppingListItem, error: null }
    } catch (e) {
      return { data: null, error: e instanceof Error ? e.message : 'Erro ao criar item' }
    }
  }

  async function updateItem(itemId: string, payload: Partial<ShoppingListItemFormData>) {
    const userId = await getUserId()
    if (!userId) return { data: null as ShoppingListItem | null, error: 'Não autenticado' }

    try {
      const { data, error: err } = await supabase
        .from('shopping_list_items')
        .update({ ...payload, updated_at: new Date().toISOString() })
        .eq('id', itemId)
        .eq('user_id', userId)
        .select()
        .single()

      if (err) throw err
      if (data) {
        const idx = items.value.findIndex((i) => i.id === itemId)
        if (idx >= 0) {
          const next = [...items.value]
          next[idx] = data as ShoppingListItem
          items.value = next
        }
      }
      return { data: data as ShoppingListItem, error: null }
    } catch (e) {
      return { data: null, error: e instanceof Error ? e.message : 'Erro ao atualizar item' }
    }
  }

  async function deleteItem(itemId: string) {
    const userId = await getUserId()
    if (!userId) return { error: 'Não autenticado' }

    try {
      const { error: err } = await supabase
        .from('shopping_list_items')
        .delete()
        .eq('id', itemId)
        .eq('user_id', userId)

      if (err) throw err
      items.value = items.value.filter((i) => i.id !== itemId)
      return { error: null }
    } catch (e) {
      return { error: e instanceof Error ? e.message : 'Erro ao excluir item' }
    }
  }

  /** Soma dos preços reais dos itens "No Carrinho" (calculadora antes do caixa) */
  const totalNoCarrinho = computed(() =>
    items.value
      .filter((i) => i.status === 'no_carrinho' && i.price_actual != null)
      .reduce((sum, i) => sum + Number(i.price_actual), 0)
  )

  /** Itens agrupados por categoria (ordem do corredor) para exibição */
  const itemsByCategory = computed(() => {
    const byCat: { category: ShoppingListCategory | null; items: ShoppingListItem[] }[] = []
    const categoryIds = categories.value.map((c) => c.id)
    const uncategorized: ShoppingListItem[] = []

    for (const cat of categories.value) {
      const catItems = items.value.filter((i) => i.category_id === cat.id)
      if (catItems.length > 0) byCat.push({ category: cat, items: catItems })
    }

    uncategorized.push(...items.value.filter((i) => !i.category_id || !categoryIds.includes(i.category_id)))
    if (uncategorized.length > 0) byCat.push({ category: null, items: uncategorized })

    return byCat
  })

  return {
    categories,
    items,
    isLoading,
    error,
    id,
    fetchCategories,
    fetchItems,
    fetchAll,
    createItem,
    updateItem,
    deleteItem,
    totalNoCarrinho,
    itemsByCategory,
  }
}
