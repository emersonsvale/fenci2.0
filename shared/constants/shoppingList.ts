/**
 * Constantes para o tipo de planejamento "Lista de Compras".
 * Status do item, prioridade e unidades de medida.
 */

export type ShoppingListItemStatus = 'a_comprar' | 'no_carrinho' | 'comprado' | 'faltou_mercado'
export type ShoppingListPriority = 'alta' | 'media' | 'baixa'

export const SHOPPING_LIST_STATUS: { value: ShoppingListItemStatus; label: string }[] = [
  { value: 'a_comprar', label: 'A Comprar' },
  { value: 'no_carrinho', label: 'No Carrinho' },
  { value: 'comprado', label: 'Comprado' },
  { value: 'faltou_mercado', label: 'Faltou no Mercado' },
]

export const SHOPPING_LIST_PRIORITY: { value: ShoppingListPriority; label: string }[] = [
  { value: 'alta', label: 'Alta' },
  { value: 'media', label: 'Média' },
  { value: 'baixa', label: 'Baixa' },
]

export const SHOPPING_LIST_UNITS = [
  'Unidades',
  'Kg',
  'Gramas',
  'Litros',
  'Caixas',
  'Pacotes',
  'Latas',
  'Garrafas',
] as const

export type ShoppingListUnit = (typeof SHOPPING_LIST_UNITS)[number]
