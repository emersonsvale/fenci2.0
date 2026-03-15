/**
 * Responde a GET /_nuxt e GET /_nuxt/ para evitar 404 não tratado no dev.
 * Alguém (browser, PWA ou prefetch) pode requisitar esse path sem arquivo.
 */
export default defineEventHandler(() => {
  setResponseStatus(204)
  return null
})
