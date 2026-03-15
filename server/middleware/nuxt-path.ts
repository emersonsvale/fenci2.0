/**
 * Evita 404 não tratado quando alguém requisita GET /_nuxt/ (sem arquivo).
 * Responde 204 No Content para que o erro não seja logado como unhandled.
 */
export default defineEventHandler((event) => {
  const path = getRequestURL(event).pathname
  if (path === '/_nuxt' || path === '/_nuxt/') {
    setResponseStatus(event, 204)
    return null
  }
})
