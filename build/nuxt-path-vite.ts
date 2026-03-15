import type { Plugin } from 'vite'

/**
 * Plugin Vite que responde 204 para GET /_nuxt e GET /_nuxt/ antes de qualquer
 * outro handler, evitando o 404 "unhandled" no dev.
 */
export default function nuxtPathVitePlugin(): Plugin {
  return {
    name: 'nuxt-path-dev-fix',
    enforce: 'pre',
    configureServer(server) {
      const handler = (req: import('http').IncomingMessage, res: import('http').ServerResponse, next: () => void) => {
        const url = req.url?.split('?')[0] ?? ''
        if (url === '/_nuxt' || url === '/_nuxt/') {
          res.statusCode = 204
          res.end()
          return
        }
        next()
      }
      const stack = (server.middlewares as unknown as { stack: Array<{ route: string; handle: () => void }> }).stack
      if (Array.isArray(stack)) {
        stack.unshift({ route: '', handle: handler })
      } else {
        server.middlewares.use(handler)
      }
    },
  }
}
