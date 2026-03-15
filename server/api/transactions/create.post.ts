import { serverSupabaseUser, serverSupabaseClient } from '#supabase/server'
import type { Database } from 'shared/types/database.types'

/**
 * Cria um lançamento (entrada ou saída) a partir da sugestão da Fê.
 * Autenticação: cookie de sessão ou header Authorization Bearer.
 */
export default defineEventHandler(async (event) => {
  let user = await serverSupabaseUser(event)
  let supabase = await serverSupabaseClient<Database>(event)
  const authHeader = getHeader(event, 'authorization')
  const token = authHeader?.replace(/^Bearer\s+/i, '').trim()

  if (!user?.id && token) {
    const { data: { user: userFromToken } } = await supabase.auth.getUser(token)
    user = userFromToken ?? undefined
    if (user?.id) {
      const config = useRuntimeConfig()
      const url = (config.public as { supabase?: { url?: string } }).supabase?.url ?? process.env.SUPABASE_URL
      const key = (config.public as { supabase?: { key?: string } }).supabase?.key ?? process.env.SUPABASE_KEY
      if (url && key) {
        const { createClient } = await import('@supabase/supabase-js')
        supabase = createClient<Database>(url, key, {
          global: { headers: { Authorization: `Bearer ${token}` } },
        })
      }
    }
  }

  if (!user?.id) {
    throw createError({ statusCode: 401, statusMessage: 'Não autorizado' })
  }

  const body = await readBody<{
    type: 'income' | 'expense'
    amount: number
    transaction_date: string
    description: string
    account_id: string
    category_id?: string | null
  }>(event)

  if (!body || body.type !== 'income' && body.type !== 'expense') {
    throw createError({ statusCode: 400, statusMessage: 'Body inválido: type (income|expense), amount, transaction_date, description, account_id obrigatórios' })
  }

  const amount = Number(body.amount)
  if (!Number.isFinite(amount) || amount <= 0) {
    throw createError({ statusCode: 400, statusMessage: 'amount deve ser um número positivo' })
  }

  const transaction_date = String(body.transaction_date ?? '').trim()
  const description = String(body.description ?? '').trim()
  const account_id = String(body.account_id ?? '').trim()
  const category_id = body.category_id != null ? String(body.category_id).trim() || null : null

  if (!transaction_date || !description || !account_id) {
    throw createError({ statusCode: 400, statusMessage: 'transaction_date, description e account_id são obrigatórios' })
  }

  const value = body.type === 'expense' ? -Math.abs(amount) : Math.abs(amount)

  const { error } = await supabase.from('transactions').insert({
    user_id: user.id,
    account_id,
    category_id,
    description,
    amount: value,
    transaction_date,
    type: body.type,
    is_paid: true,
    status: 'confirmed',
  })

  if (error) {
    throw createError({
      statusCode: 500,
      statusMessage: error.message ?? 'Erro ao criar lançamento',
    })
  }

  return { ok: true }
})
