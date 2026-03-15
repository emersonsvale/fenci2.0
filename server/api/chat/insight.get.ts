import { serverSupabaseUser, serverSupabaseClient } from '#supabase/server'
import type { Database } from 'shared/types/database.types'
import { buildFinanceContext } from '../../utils/financeContext'

const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions'

const INSIGHT_SYSTEM_PROMPT = `Você é a Fê, uma assistente de finanças pessoais. Sua tarefa é gerar UMA ÚNICA frase curta e impactante (máximo 1 ou 2 frases) como mensagem de insight para o usuário, baseada nos dados financeiros fornecidos.

Regras:
- SEMPRE use o nome do usuário (primeiro nome, sobrenome ou nome completo conforme o contexto).
- Responda SOMENTE com a frase de insight, sem markdown, sem listas, sem explicações adicionais.
- A frase deve ser direta, no estilo da Fê: acolhedora, objetiva e pessoal ("a gente", "nosso", "nosso gráfico").
- Escolha o tom conforme a situação financeira do período:
  - Comemoração quando estiver positivo: "Pedro, esse mês a gente venceu!"
  - Alerta se estourou orçamento/limite: "Vai com calma! Você já estourou o nosso teto!"
  - Reflexão após mês apertado: "Ufa! Esse mês foi apertado! Mas essa já foi!"
  - Lembrete fim de mês: "Fim de mês! Hora de checar nosso gráfico!"
  - Preocupação quando precisar atenção: "Jansen, a gente precisa conversar! Não está fácil!"
  - Conselho gentil sobre gasto alto: "Oi Pedro! Essa compra foi um pouco alta!"
- Use APENAS os dados do contexto. Não invente números. Se não houver dados suficientes, dê uma mensagem genérica acolhedora usando o nome do usuário.`

/**
 * GET /api/chat/insight
 * Query: month (1-12), year (opcional; default = ano atual)
 * Header: Authorization Bearer <token> (recomendado quando sessão não vem por cookie)
 * Retorna um insight curto da Fê para exibir na tela ao carregar (ex.: dashboard).
 */
export default defineEventHandler(async (event) => {
  const serverUser = await serverSupabaseUser(event)
  let user: { id: string } | undefined = serverUser?.id ? { id: serverUser.id } : undefined
  let supabase = await serverSupabaseClient<Database>(event)
  const authHeader = getHeader(event, 'authorization')
  const token = authHeader?.replace(/^Bearer\s+/i, '').trim()

  if (!user?.id && token) {
    const { data: { user: userFromToken } } = await supabase.auth.getUser(token)
    user = userFromToken?.id ? { id: userFromToken.id } : undefined
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

  const query = getQuery(event)
  const month = typeof query.month === 'string' ? parseInt(query.month, 10) : undefined
  const year = typeof query.year === 'string' ? parseInt(query.year, 10) : undefined
  const now = new Date()
  const period =
    Number.isFinite(month) && month >= 1 && month <= 12 && Number.isFinite(year)
      ? { month, year }
      : { month: now.getMonth() + 1, year: now.getFullYear() }

  const financeContext = await buildFinanceContext(user.id, supabase, period)

  const systemContent = `${INSIGHT_SYSTEM_PROMPT}\n\n## Dados financeiros do usuário:\n\n${financeContext}`

  const apiKey = useRuntimeConfig().openaiApiKey as string | undefined
  if (!apiKey) {
    throw createError({
      statusCode: 500,
      statusMessage: 'OpenAI API key não configurada (OPENAI_API_KEY)',
    })
  }

  const response = await fetch(OPENAI_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemContent },
        { role: 'user', content: 'Gere apenas a única frase de insight para exibir na tela inicial, usando o nome do usuário e o tom adequado à situação.' },
      ],
      max_tokens: 120,
      temperature: 0.8,
    }),
  })

  if (!response.ok) {
    const errText = await response.text()
    throw createError({
      statusCode: response.status,
      statusMessage: `OpenAI: ${response.statusText}. ${errText.slice(0, 200)}`,
    })
  }

  const data = (await response.json()) as { choices?: Array<{ message?: { content?: string } }> }
  const insight = (data.choices?.[0]?.message?.content ?? '').trim() || 'Olá! Confira como está sua saúde financeira este mês.'

  return { insight }
})
