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
      let inv = invoiceId
        ? (await supabase.from('credit_card_invoices').select('id, credit_card_id, total_amount, paid_amount').eq('id', invoiceId).single()).data
        : referenceMonthDate
          ? (await supabase.from('credit_card_invoices').select('id, credit_card_id, total_amount, paid_amount').eq('credit_card_id', creditCardId).eq('reference_month', referenceMonthDate).maybeSingle()).data
          : null

      if (!inv) {
        error.value = 'Fatura não encontrada'
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

      if (txError) throw txError

      await supabase
        .from('credit_card_invoices')
        .update({ paid_amount: newPaidAmount, status })
        .eq('id', inv.id)

      const { data: card } = await supabase.from('credit_cards').select('available_limit').eq('id', inv.credit_card_id).single()
      const currentLimit = card?.available_limit ?? 0
      await supabase.from('credit_cards').update({ available_limit: currentLimit + amount }).eq('id', inv.credit_card_id)

      return true
    } catch (err: unknown) {
      console.error('Erro ao pagar fatura:', err)
      error.value = 'Erro ao registrar pagamento da fatura'
      return false
    } finally {
      isSubmitting.value = false
    }
  }

  return {
    error,
    isSubmitting,
    payInvoice,
  }
}
