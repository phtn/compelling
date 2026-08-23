import { defineSchema, defineTable } from 'convex/server'
import { v } from 'convex/values'

export const canvasPointValidator = v.object({
  x: v.number(),
  y: v.number()
})

export const canvasStrokeToolValidator = v.union(
  v.literal('pen-bold'),
  v.literal('pencil-bold'),
  v.literal('eraser')
)

export const canvasStrokeColorValidator = v.union(
  v.literal('#e7e7e7'),
  v.literal('#d7d0fe'),
  v.literal('oklch(0.9 0.072 338.8)'),
  v.literal('#ffecba'),
  v.literal('oklch(0.68 0.16 319.98)'),
  v.literal('#3a9df6'),
  v.literal('#5cffad'),
  v.literal('#fe7672'),
  v.literal('#525152')
)

export default defineSchema({
  canvasSessions: defineTable({
    hourStartedAt: v.number(),
    expiresAt: v.number(),
    resumeSecret: v.string(),
    nickname: v.string(),
    updatedAt: v.number()
  })
    .index('by_hourStartedAt', ['hourStartedAt'])
    .index('by_expiresAt', ['expiresAt']),
  canvasStrokes: defineTable({
    hourStartedAt: v.number(),
    expiresAt: v.number(),
    strokeId: v.string(),
    sessionId: v.id('canvasSessions'),
    color: canvasStrokeColorValidator,
    size: v.number(),
    tool: canvasStrokeToolValidator,
    points: v.array(canvasPointValidator),
    createdAt: v.number()
  })
    .index('by_hourStartedAt', ['hourStartedAt'])
    .index('by_hourStartedAt_and_strokeId', ['hourStartedAt', 'strokeId'])
    .index('by_hourStartedAt_and_sessionId', [
      'hourStartedAt',
      'sessionId'
    ])
    .index('by_hourStartedAt_and_createdAt', ['hourStartedAt', 'createdAt'])
    .index('by_expiresAt', ['expiresAt'])
})
