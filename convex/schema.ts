import { defineSchema, defineTable } from 'convex/server'
import { v } from 'convex/values'

export default defineSchema({
  canvasSessions: defineTable({
    hourStartedAt: v.number(),
    expiresAt: v.number(),
    resumeSecret: v.string(),
    nickname: v.string(),
    updatedAt: v.number()
  })
    .index('by_hourStartedAt', ['hourStartedAt'])
    .index('by_expiresAt', ['expiresAt'])
})
