import { httpRouter } from 'convex/server'
import { internal } from '../_generated/api'
import { httpAction } from '../_generated/server'

export function registerMuxHttpRoutes(http: ReturnType<typeof httpRouter>) {
  http.route({
    path: '/mux/webhook',
    method: 'POST',
    handler: httpAction(async (ctx, request) => {
      const rawBody = await request.text()
      const headers: Record<string, string> = {}
      request.headers.forEach((value, key) => {
        headers[key] = value
      })

      const result = await ctx.runAction(internal.mux.webhook.ingestMuxWebhook, {
        rawBody,
        headers
      })

      return new Response(JSON.stringify(result), {
        headers: { 'content-type': 'application/json' }
      })
    })
  })
}
