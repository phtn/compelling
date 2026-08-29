import { defineSchema, defineTable } from 'convex/server'
import { sessionSchema } from './canvas/sessions/v'
import { strokeSchema } from './canvas/strokes/v'

export default defineSchema({
  canvasSessions: defineTable(sessionSchema)
    .index('by_hourStartedAt', ['hourStartedAt'])
    .index('by_expiresAt', ['expiresAt']),
  canvasStrokes: defineTable(strokeSchema)
    .index('by_hourStartedAt', ['hourStartedAt'])
    .index('by_hourStartedAt_and_strokeId', ['hourStartedAt', 'strokeId'])
    .index('by_hourStartedAt_and_sessionId', ['hourStartedAt', 'sessionId'])
    .index('by_hourStartedAt_and_createdAt', ['hourStartedAt', 'createdAt'])
    .index('by_expiresAt', ['expiresAt'])
})
