import { serverSupabaseUser, serverSupabaseClient } from '#supabase/server'
import type { Database } from 'shared/types/database.types'
import { buildFinanceContext } from '../../utils/financeContext'

const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions'

const SYSTEM_PROMPT = `Você se chama Fê e é uma especialista em finanças pessoais. Seu papel é analisar os dados financeiros do usuário, dar insights, recomendações e também ajudar a CADASTRAR LANÇAMENTOS (entradas e saídas).

## Formatação (OBRIGATÓRIO — toda resposta deve ser legível e bem formatada)
- SEMPRE entregue o texto de forma legível e formatada corretamente. O usuário lê suas respostas em um chat com espaço limitado.
- Use markdown em TODAS as respostas:
  - **negrito** para valores, nomes de seções e destaques (ex.: **R$ 1.500,00**, **Entradas e Saídas**).
  - ### para títulos de seção (ex.: ### Receitas e Despesas, ### Considerações Finais).
  - Listas: um item por linha. Para marcadores use "- " no início da linha; para numerada use "1. ", "2. ", etc. Nunca coloque vários itens na mesma linha.
- Parágrafos curtos: deixe uma linha em branco (dupla quebra) entre parágrafos. Evite blocos únicos de texto longo.
- Quebre naturalmente: se uma frase for longa, use vírgulas e pontos; não grude muitas informações numa só linha.

Regras de conteúdo:
- Responda sempre em português brasileiro.
- SEMPRE se dirija ao usuário pelo nome dele (seção "Perfil (profiles)", "Nome do usuário:").
- Se houver "Período de referência" no contexto, responda sobre valores/orçamento/transações para ESSE mês/ano.
- Use APENAS dados das tabelas do contexto. Não invente números.
- Ao falar de gastos, considere despesas fixas/recorrentes e variáveis/avulsas.
- Seja objetiva e acolhedora. Sugira ações concretas quando fizer sentido.
- Se não tiver a informação, diga e indique onde ver ou cadastrar no app.

## Cadastro de lançamentos (OBRIGATÓRIO quando o usuário quiser adicionar lançamento)
- Quando o usuário disser que quer "adicionar um lançamento", "lançar", "registrar uma despesa/receita", "cadastrar gasto" ou enviar extrato (imagem ou arquivo) para lançar, você DEVE:
  1. Fazer perguntas para preencher: tipo (entrada ou saída), valor, data, descrição, conta (escolher pelo nome da lista de contas do contexto e usar o id correspondente), categoria (escolher pelo nome da lista de categorias e usar o id correspondente).
  2. SEMPRE perguntar e confirmar os dados antes de sugerir o registro, para evitar erros e duplicidade. Ex.: "Só para confirmar: é uma saída de R$ 150 no dia 15/03, Supermercado, conta Nubank, categoria Alimentação. Posso lançar?"
  3. Quando tiver TODOS os dados e o usuário confirmar (ou você estiver pedindo confirmação final), inclua na sua resposta uma ÚNICA linha no formato exato:
     TRANSACTION_JSON: {"type":"income" ou "expense","amount":número,"transaction_date":"AAAA-MM-DD","description":"texto","account_id":"uuid da conta","category_id":"uuid da categoria"}
  - type: apenas "income" ou "expense" (para transferência, oriente o usuário a fazer duas operações ou apenas uma entrada/saída por vez).
  - amount: número positivo (ex.: 150.50). O sistema converte para negativo em saída.
  - transaction_date: sempre AAAA-MM-DD.
  - account_id e category_id: use os ids exatos da seção Contas e Categorias do contexto (não invente UUIDs).
- Se o usuário enviar imagem de extrato ou arquivo de extrato: analise os dados extraídos (quando disponíveis), faça perguntas sobre cada lançamento (valor, data, descrição, conta, categoria) para confirmar e evitar duplicidade, e só então sugira o TRANSACTION_JSON para cada lançamento confirmado, um por vez.
- NUNCA invente account_id ou category_id. Se o usuário citar uma conta ou categoria que não existir no contexto, peça para ele escolher uma da lista ou cadastrar no app primeiro.`

export interface SuggestedTransaction {
  type: 'income' | 'expense'
  amount: number
  transaction_date: string
  description: string
  account_id: string
  category_id: string | null
}

const TRANSACTION_JSON_PREFIX = 'TRANSACTION_JSON:'

function parseSuggestedTransaction(content: string): { text: string; suggested: SuggestedTransaction | null } {
  const idx = content.indexOf(TRANSACTION_JSON_PREFIX)
  if (idx === -1) return { text: content.trim(), suggested: null }
  const after = content.slice(idx + TRANSACTION_JSON_PREFIX.length).trim()
  const endOfLine = after.indexOf('\n')
  const jsonStr = endOfLine === -1 ? after : after.slice(0, endOfLine)
  const text = (content.slice(0, idx).trim() + (endOfLine >= 0 ? after.slice(endOfLine) : '')).trim()
  try {
    const obj = JSON.parse(jsonStr) as unknown
    if (obj && typeof obj === 'object' && 'type' in obj && 'amount' in obj && 'transaction_date' in obj && 'description' in obj && 'account_id' in obj) {
      const t = obj as Record<string, unknown>
      const type = t.type === 'income' || t.type === 'expense' ? t.type : 'expense'
      const amount = Number(t.amount)
      if (!Number.isFinite(amount) || amount <= 0) return { text, suggested: null }
      const transaction_date = String(t.transaction_date ?? '')
      const description = String(t.description ?? '').trim()
      const account_id = String(t.account_id ?? '').trim()
      const category_id = t.category_id != null ? String(t.category_id).trim() : null
      if (!transaction_date || !description || !account_id) return { text, suggested: null }
      return {
        text,
        suggested: {
          type,
          amount,
          transaction_date,
          description,
          account_id,
          category_id: category_id || null,
        },
      }
    }
  } catch {
    // ignore invalid JSON
  }
  return { text, suggested: null }
}

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

  const body = await readBody<{
    messages: Array<{ role: 'user' | 'assistant' | 'system'; content: string }>
    month?: number
    year?: number
    imageBase64?: string
    imageMime?: string
    fileBase64?: string
    fileName?: string
  }>(event)
  const messages = body?.messages
  if (!Array.isArray(messages) || messages.length === 0) {
    throw createError({ statusCode: 400, statusMessage: 'Envie um array de messages com role e content' })
  }

  const period =
    typeof body?.month === 'number' && typeof body?.year === 'number'
      ? { month: body.month, year: body.year }
      : undefined

  const financeContext = await buildFinanceContext(user.id, supabase, period)

  const systemContent = `${SYSTEM_PROMPT}\n\n## Dados financeiros do usuário (use para personalizar suas respostas):\n\n${financeContext}`

  const history = messages
    .filter((m) => m.role === 'user' || m.role === 'assistant')
    .map((m) => ({ role: m.role as 'user' | 'assistant', content: m.content }))
    .slice(-24)

  // Se houver arquivo de texto (txt/csv), decodificar e anexar ao texto da última mensagem do usuário
  const lastHistoryItem = history[history.length - 1]
  let lastUserContent = lastHistoryItem && lastHistoryItem.role === 'user' ? lastHistoryItem.content : ''
  if (body?.fileBase64 && body?.fileName) {
    const fileBase64 = body.fileBase64
    const fileName = body.fileName
    try {
      const decoded = Buffer.from(fileBase64, 'base64').toString('utf-8')
      const isText = /\.(txt|csv|ofx)$/i.test(fileName) || decoded.length < 50000
      if (isText) {
        lastUserContent += `\n\n[Conteúdo do arquivo anexado: ${fileName}]\n${decoded.slice(0, 30000)}`
      } else {
        lastUserContent += `\n\n[O usuário anexou o arquivo: ${fileName}. Peça para descrever os lançamentos ou enviar uma imagem do extrato para analisar.]`
      }
    } catch {
      lastUserContent += `\n\n[Arquivo anexado: ${fileName} (não foi possível ler o conteúdo).]`
    }
  }

  type ContentPart = { type: 'text'; text: string } | { type: 'image_url'; image_url: { url: string } }
  const openaiMessages: Array<
    { role: 'system'; content: string } | { role: 'user' | 'assistant'; content: string | ContentPart[] }
  > = [
    { role: 'system', content: systemContent },
    ...history.slice(0, -1),
  ]

  const hasImage = Boolean(body?.imageBase64?.trim())
  if (history.length > 0) {
    const last = history[history.length - 1]!
    if (last.role === 'user') {
      const textContent = lastUserContent || last.content
      if (hasImage && body?.imageBase64) {
        const mime = body.imageMime ?? 'image/jpeg'
        const url = `data:${mime};base64,${body.imageBase64.trim()}`
        openaiMessages.push({
          role: 'user',
          content: [
            { type: 'text', text: textContent },
            { type: 'image_url', image_url: { url } },
          ],
        })
      } else {
        openaiMessages.push({ role: 'user', content: textContent })
      }
    } else {
      openaiMessages.push({ role: last.role, content: last.content })
    }
  }

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
      model: hasImage ? 'gpt-4o-mini' : 'gpt-4o-mini',
      messages: openaiMessages,
      max_tokens: 1024,
      temperature: 0.7,
    }),
  })

  if (!response.ok) {
    const errText = await response.text()
    throw createError({
      statusCode: response.status,
      statusMessage: `OpenAI: ${response.statusText}. ${errText.slice(0, 200)}`,
    })
  }

  const data = (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>
  }
  const rawContent = data.choices?.[0]?.message?.content ?? 'Não foi possível gerar uma resposta.'
  const { text: content, suggested: suggestedTransaction } = parseSuggestedTransaction(rawContent)

  return { content, suggestedTransaction: suggestedTransaction ?? undefined }
})
