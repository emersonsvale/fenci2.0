/**
 * Middleware global de autenticação.
 * - Usuário logado em página de visitante (ex: /login) → redireciona para /dashboard.
 * - Usuário deslogado em rota protegida → redireciona para /login.
 * Executa apenas no client para evitar inconsistências com useSupabaseUser no SSR.
 */

const ROTAS_PUBLICAS = ['/', '/login', '/cadastro', '/esqueci-senha', '/reset-senha', '/confirm']

export default defineNuxtRouteMiddleware((to) => {
  if (import.meta.server) return

  const user = useSupabaseUser()
  const path = to.path

  // Logado em rota de visitante → dashboard
  if (user.value && ROTAS_PUBLICAS.includes(path)) {
    return navigateTo('/dashboard', { replace: true })
  }

  // Deslogado em rota protegida → login
  if (!user.value && !ROTAS_PUBLICAS.includes(path)) {
    return navigateTo('/login', { replace: true })
  }
})
