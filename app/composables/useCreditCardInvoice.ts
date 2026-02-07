import { ref } from 'vue'
import { useSupabaseClient } from '#imports'
import type { Database } from 'shared/types/database.types'

/**
 * useCreditCardInvoice - Pagamento de faturas de cartão de crédito
 */
export function useCreditCardInvoice() {
  const supabase = useSupabaseClient<Database>()
  const error = ref<string | null>(null)
  const isSubmitting = ref(false)

  /**
   * Registra o pagamento de uma fatura: cria transaction de saída, atualiza fatura e limite do cartão.
   */
  async function payInvoice(
    invoiceId: string | null,
    creditCardId: string,
    accountId: string,
    amount: number,
    paymentDate: string,
    referenceMonth?: string
  ): Promise<boolean> {
    console.log('[useCreditCardInvoice] payInvoice chamado:', { invoiceId, creditCardId, accountId, amount, paymentDate, referenceMonth })
    const { data: authData } = await supabase.auth.getUser()
    const userId = authData?.user?.id
    if (!userId) {
      error.value = 'Usuário não autenticado'
      return false
    }

    isSubmitting.value = true
    error.value = null

    try {
      const referenceMonthDate = referenceMonth ? `${referenceMonth}-01` : null
      const invById = invoiceId
        ? await supabase.from('credit_card_invoices').select('id, credit_card_id, total_amount, paid_amount, status').eq('id', invoiceId).single()
        : { data: null, error: null }
      const invByRef =
        !invoiceId && referenceMonthDate
          ? await supabase
              .from('credit_card_invoices')
              .select('id, credit_card_id, total_amount, paid_amount, status')
              .eq('credit_card_id', creditCardId)
              .eq('reference_month', referenceMonthDate)
              .maybeSingle()
          : { data: null, error: null }

      const inv = invoiceId ? invById.data : invByRef.data
      if (invById.error) {
        console.error('Erro ao buscar fatura por id:', invById.error)
        error.value = 'Fatura não encontrada'
        return false
      }
      if (!invoiceId && invByRef.error) {
        console.error('Erro ao buscar fatura por mês:', invByRef.error)
        error.value = 'Fatura não encontrada'
        return false
      }
      if (!inv) {
        error.value = 'Fatura não encontrada'
        return false
      }

      if (inv.status === 'paid') {
        error.value = 'Esta fatura já está paga.'
        return false
      }

      const paidSoFar = inv.paid_amount ?? 0
      const newPaidAmount = paidSoFar + amount
      const totalAmount = inv.total_amount ?? 0
      const status = newPaidAmount >= totalAmount ? 'paid' : 'partial'

      const { error: txError } = await supabase.from('transactions').insert({
        user_id: userId,
        account_id: accountId,
        description: 'Pagamento fatura cartão',
        amount: -Math.abs(amount),
        transaction_date: paymentDate,
        type: 'expense',
        invoice_id: inv.id,
      })

      if (txError) {
        console.error('Erro ao inserir transação de pagamento:', txError)
        throw txError
      }

      const { error: updateInvError } = await supabase
        .from('credit_card_invoices')
        .update({ paid_amount: newPaidAmount, status })
        .eq('id', inv.id)

      if (updateInvError) {
        console.error('Erro ao atualizar fatura:', updateInvError)
        error.value = 'Erro ao atualizar status da fatura. Tente novamente.'
        return false
      }

      const { data: card, error: cardError } = await supabase.from('credit_cards').select('available_limit').eq('id', inv.credit_card_id).single()
      if (cardError) {
        console.error('Erro ao buscar limite do cartão:', cardError)
        // Pagamento e fatura já foram registrados; só o limite não atualizou
        return true
      }
      const currentLimit = card?.available_limit ?? 0
      const { error: updateCardError } = await supabase
        .from('credit_cards')
        .update({ available_limit: currentLimit + amount })
        .eq('id', inv.credit_card_id)
      if (updateCardError) {
        console.error('Erro ao atualizar limite do cartão:', updateCardError)
      }
      // Pagamento e fatura já foram atualizados com sucesso

      return true
    } catch (err: unknown) {
      console.error('Erro ao pagar fatura:', err)
      error.value = 'Erro ao registrar pagamento da fatura'
      return false
    } finally {
      isSubmitting.value = false
    }
  }

  function clearError() {
    error.value = null
  }

  return {
    error,
    isSubmitting,
    payInvoice,
    clearError,
  }
}
