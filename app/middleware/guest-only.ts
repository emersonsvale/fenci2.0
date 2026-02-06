/**
 * Middleware para rotas exclusivas de visitantes (não logados).
 * Se o usuário estiver autenticado, redireciona para o dashboard.
 * Só verifica no client para evitar 500 no SSR (useSupabaseUser não é confiável no servidor).
 */
export default defineNuxtRouteMiddleware((_to, _from) => {
  if (import.meta.server) return
  const user = useSupabaseUser()
  if (user.value) {
    return navigateTo('/dashboard', { replace: true })
  }
})
