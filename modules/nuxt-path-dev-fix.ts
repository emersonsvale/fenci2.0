import { addDevServerHandler, defineNuxtModule } from '@nuxt/kit'
import { defineEventHandler, getRequestURL, setResponseStatus } from 'h3'

/**
 * Módulo que evita o 404 "unhandled" no dev quando alguém requisita GET /_nuxt/.
 * Registra um handler que roda antes do Vite e responde 204 para /_nuxt e /_nuxt/.
 */
export default defineNuxtModule({
  meta: {
    name: 'nuxt-path-dev-fix',
    configKey: 'nuxtPathDevFix',
  },
  setup() {
    addDevServerHandler({
      route: '',
      handler: defineEventHandler((event) => {
        const path = getRequestURL(event).pathname
        if (path === '/_nuxt' || path === '/_nuxt/') {
          setResponseStatus(event, 204)
          return null
        }
      }),
    })
  },
})
