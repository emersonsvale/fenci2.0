import { ref, computed } from 'vue'
import { useSupabaseClient, useSupabaseUser } from '#imports'
import type { Database } from '~/shared/types/database.types'
import type { 
  Profile, 
  ProfileUpdate, 
  NotificationPreferences,
  NotificationPreferencesUpdate 
} from '~/shared/types/database.types'

/**
 * useProfile - Composable para gerenciamento do perfil do usuário
 * Inclui: dados pessoais, preferências, notificações, avatar, segurança
 */

// Estado compartilhado
const profile = ref<Profile | null>(null)
const notificationPreferences = ref<NotificationPreferences | null>(null)
const isLoading = ref(false)
const error = ref<string | null>(null)

export function useProfile() {
  const supabase = useSupabaseClient<Database>()
  const user = useSupabaseUser()

  // ============================================
  // HELPER - Obter userId de forma segura
  // ============================================
  
  async function getAuthUserId(): Promise<string | null> {
    // Primeiro tenta do composable
    if (user.value?.id) {
      return user.value.id
    }
    // Fallback: busca diretamente do Supabase Auth
    const { data: { user: authUser } } = await supabase.auth.getUser()
    return authUser?.id || null
  }

  // ============================================
  // COMPUTED
  // ============================================

  const userId = computed(() => user.value?.id)
  const userEmail = computed(() => user.value?.email)
  const isGoogleUser = computed(() => {
    return user.value?.app_metadata?.provider === 'google'
  })
  
  const subscriptionStatusLabel = computed(() => {
    const status = profile.value?.subscription_status
    const labels: Record<string, string> = {
      trial: 'Período de teste',
      active: 'Ativo',
      cancelled: 'Cancelado',
      expired: 'Expirado'
    }
    return labels[status || 'trial'] || 'Desconhecido'
  })

  const trialDaysRemaining = computed(() => {
    if (!profile.value?.trial_ends_at) return 0
    const trialEnd = new Date(profile.value.trial_ends_at)
    const now = new Date()
    const diff = trialEnd.getTime() - now.getTime()
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)))
  })

  const avatarUrl = computed(() => {
    // Prioriza avatar do profile, depois do user metadata (Google)
    return profile.value?.avatar_url || user.value?.user_metadata?.avatar_url || null
  })

  // ============================================
  // CARREGAR DADOS
  // ============================================

  async function loadProfile(): Promise<void> {
    const currentUserId = await getAuthUserId()
    if (!currentUserId) return

    isLoading.value = true
    error.value = null

    try {
      const { data, error: fetchError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', currentUserId)
        .single()

      if (fetchError) throw fetchError
      profile.value = data
    } catch (err) {
      console.error('Erro ao carregar perfil:', err)
      error.value = 'Erro ao carregar dados do perfil'
    } finally {
      isLoading.value = false
    }
  }

  async function loadNotificationPreferences(): Promise<void> {
    const currentUserId = await getAuthUserId()
    if (!currentUserId) return

    try {
      const { data, error: fetchError } = await supabase
        .from('notification_preferences')
        .select('*')
        .eq('user_id', currentUserId)
        .single()

      if (fetchError) {
        // Se não existe, cria com valores padrão
        if (fetchError.code === 'PGRST116') {
          const { data: newData, error: insertError } = await supabase
            .from('notification_preferences')
            .insert({ user_id: currentUserId })
            .select()
            .single()
          
          if (insertError) throw insertError
          notificationPreferences.value = newData
          return
        }
        throw fetchError
      }

      notificationPreferences.value = data
    } catch (err) {
      console.error('Erro ao carregar preferências de notificação:', err)
    }
  }

  async function loadAll(): Promise<void> {
    await Promise.all([
      loadProfile(),
      loadNotificationPreferences()
    ])
  }

  // ============================================
  // ATUALIZAR PERFIL
  // ============================================

  async function updateProfile(updates: ProfileUpdate): Promise<boolean> {
    const currentUserId = await getAuthUserId()
    
    if (!currentUserId) {
      error.value = 'Usuário não autenticado'
      return false
    }

    isLoading.value = true
    error.value = null

    try {
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', currentUserId)
        .select()

      if (updateError) throw updateError

      // Atualiza o estado local
      if (profile.value) {
        profile.value = { ...profile.value, ...updates }
      }

      return true
    } catch (err) {
      console.error('Erro ao atualizar perfil:', err)
      error.value = 'Erro ao salvar alterações'
      return false
    } finally {
      isLoading.value = false
    }
  }

  // ============================================
  // AVATAR
  // ============================================

  async function uploadAvatar(file: File): Promise<string | null> {
    const currentUserId = await getAuthUserId()
    if (!currentUserId) return null

    isLoading.value = true
    error.value = null

    try {
      // Valida o arquivo
      const maxSize = 5 * 1024 * 1024 // 5MB
      if (file.size > maxSize) {
        throw new Error('Arquivo muito grande. Máximo: 5MB')
      }

      const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
      if (!allowedTypes.includes(file.type)) {
        throw new Error('Formato não suportado. Use: JPG, PNG, WebP ou GIF')
      }

      // Gera nome único
      const fileExt = file.name.split('.').pop()
      const fileName = `${currentUserId}/avatar-${Date.now()}.${fileExt}`

      // Remove avatar antigo se existir
      if (profile.value?.avatar_url) {
        const oldPath = profile.value.avatar_url.split('/').slice(-2).join('/')
        await supabase.storage.from('avatars').remove([oldPath])
      }

      // Faz upload
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: true
        })

      if (uploadError) throw uploadError

      // Obtém URL pública
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName)

      // Atualiza perfil com nova URL
      await updateProfile({ avatar_url: publicUrl })

      return publicUrl
    } catch (err: unknown) {
      console.error('Erro ao fazer upload do avatar:', err)
      error.value = err instanceof Error ? err.message : 'Erro ao fazer upload'
      return null
    } finally {
      isLoading.value = false
    }
  }

  async function removeAvatar(): Promise<boolean> {
    const currentUserId = await getAuthUserId()
    if (!currentUserId || !profile.value?.avatar_url) return false

    isLoading.value = true
    error.value = null

    try {
      // Remove do storage
      const oldPath = profile.value.avatar_url.split('/').slice(-2).join('/')
      await supabase.storage.from('avatars').remove([oldPath])

      // Atualiza perfil
      await updateProfile({ avatar_url: null })

      return true
    } catch (err) {
      console.error('Erro ao remover avatar:', err)
      error.value = 'Erro ao remover avatar'
      return false
    } finally {
      isLoading.value = false
    }
  }

  // ============================================
  // NOTIFICAÇÕES
  // ============================================

  async function updateNotificationPreferences(
    updates: NotificationPreferencesUpdate
  ): Promise<boolean> {
    const currentUserId = await getAuthUserId()
    if (!currentUserId) return false

    isLoading.value = true
    try {
      const { error: updateError } = await supabase
        .from('notification_preferences')
        .update(updates)
        .eq('user_id', currentUserId)

      if (updateError) throw updateError

      // Atualiza estado local
      if (notificationPreferences.value) {
        notificationPreferences.value = { 
          ...notificationPreferences.value, 
          ...updates 
        }
      }

      return true
    } catch (err) {
      console.error('Erro ao atualizar preferências:', err)
      return false
    } finally {
      isLoading.value = false
    }
  }

  // ============================================
  // SEGURANÇA
  // ============================================

  async function updatePassword(
    currentPassword: string,
    newPassword: string
  ): Promise<{ success: boolean; message: string }> {
    try {
      // Verifica senha atual fazendo login
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: userEmail.value || '',
        password: currentPassword
      })

      if (signInError) {
        return { success: false, message: 'Senha atual incorreta' }
      }

      // Atualiza para nova senha
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword
      })

      if (updateError) {
        return { success: false, message: 'Erro ao atualizar senha' }
      }

      return { success: true, message: 'Senha alterada com sucesso!' }
    } catch (err) {
      console.error('Erro ao alterar senha:', err)
      return { success: false, message: 'Erro inesperado ao alterar senha' }
    }
  }

  // ============================================
  // STRIPE / ASSINATURA
  // ============================================

  async function openStripePortal(): Promise<string | null> {
    // TODO: Implementar quando Stripe estiver configurado
    // Por hora retorna null indicando que não há integração
    if (!profile.value?.stripe_customer_id) {
      console.log('Stripe não configurado ainda')
      return null
    }

    // Quando implementado, chamará uma Edge Function para criar
    // uma sessão do portal do cliente Stripe
    // const { data } = await supabase.functions.invoke('create-portal-session')
    // return data?.url

    return null
  }

  // ============================================
  // EXPORTAR DADOS
  // ============================================

  async function exportUserData(): Promise<Blob | null> {
    const currentUserId = await getAuthUserId()
    if (!currentUserId) return null

    isLoading.value = true
    error.value = null

    try {
      // Busca todos os dados do usuário
      const [
        { data: profileData },
        { data: accountsData },
        { data: categoriesData },
        { data: transactionsData },
        { data: creditCardsData },
        { data: goalsData },
        { data: budgetsData }
      ] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', currentUserId).single(),
        supabase.from('accounts').select('*').eq('user_id', currentUserId),
        supabase.from('categories').select('*').eq('user_id', currentUserId),
        supabase.from('transactions').select('*').eq('user_id', currentUserId),
        supabase.from('credit_cards').select('*').eq('user_id', currentUserId),
        supabase.from('goals').select('*').eq('user_id', currentUserId),
        supabase.from('budgets').select('*').eq('user_id', currentUserId)
      ])

      const exportData = {
        exportedAt: new Date().toISOString(),
        profile: profileData,
        accounts: accountsData,
        categories: categoriesData,
        transactions: transactionsData,
        creditCards: creditCardsData,
        goals: goalsData,
        budgets: budgetsData
      }

      const blob = new Blob(
        [JSON.stringify(exportData, null, 2)], 
        { type: 'application/json' }
      )

      return blob
    } catch (err) {
      console.error('Erro ao exportar dados:', err)
      error.value = 'Erro ao exportar dados'
      return null
    } finally {
      isLoading.value = false
    }
  }

  // ============================================
  // EXCLUIR CONTA
  // ============================================

  async function deleteAccount(): Promise<{ success: boolean; message: string }> {
    const currentUserId = await getAuthUserId()
    if (!currentUserId) {
      return { success: false, message: 'Usuário não autenticado' }
    }

    isLoading.value = true
    error.value = null

    try {
      const { data, error: fnError } = await supabase.functions.invoke<{ success: boolean; message?: string }>('delete-account', {
        method: 'POST'
      })

      if (fnError) {
        console.error('Erro ao chamar delete-account:', fnError)
        return { success: false, message: fnError.message || 'Erro ao processar exclusão' }
      }

      if (!data?.success) {
        return { success: false, message: data?.message || 'Erro ao excluir conta' }
      }

      await supabase.auth.signOut()
      return { success: true, message: data.message || 'Conta excluída com sucesso.' }
    } catch (err) {
      console.error('Erro ao excluir conta:', err)
      return { success: false, message: 'Erro ao processar solicitação' }
    } finally {
      isLoading.value = false
    }
  }

  // ============================================
  // RETURN
  // ============================================

  return {
    // Estado
    profile,
    notificationPreferences,
    isLoading,
    error,

    // Computed
    userId,
    userEmail,
    isGoogleUser,
    subscriptionStatusLabel,
    trialDaysRemaining,
    avatarUrl,

    // Métodos - Carregar
    loadProfile,
    loadNotificationPreferences,
    loadAll,

    // Métodos - Perfil
    updateProfile,

    // Métodos - Avatar
    uploadAvatar,
    removeAvatar,

    // Métodos - Notificações
    updateNotificationPreferences,

    // Métodos - Segurança
    updatePassword,

    // Métodos - Stripe
    openStripePortal,

    // Métodos - Dados
    exportUserData,
    deleteAccount
  }
}
