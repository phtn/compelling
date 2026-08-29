import { ConvexError, v } from 'convex/values'

import type { Id } from '../../_generated/dataModel'
import { type MutationCtx } from '../../_generated/server'

export const HOUR_MS = 60 * 60 * 1000
export const CANVAS_WIDTH = 1400
export const CANVAS_HEIGHT = 800
export const MAX_POINTS_PER_STROKE = 2048
export const MAX_VISIBLE_STROKES = 500
export const DELETE_BATCH_SIZE = 200
export const RESUME_SECRET_PATTERN = /^[a-f0-9]{32}$/
export const STROKE_ID_PATTERN = /^[a-z0-9_-]{1,64}$/i

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
export const strokeSchema = v.object({
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
export const strokeInputValidator = v.object({
  strokeId: v.string(),
  color: canvasStrokeColorValidator,
  size: v.number(),
  tool: canvasStrokeToolValidator,
  points: v.array(canvasPointValidator)
})

export const normalizeStroke = (stroke: {
  strokeId: string
  color:
    | '#e7e7e7'
    | '#d7d0fe'
    | 'oklch(0.9 0.072 338.8)'
    | '#ffecba'
    | 'oklch(0.68 0.16 319.98)'
    | '#3a9df6'
    | '#5cffad'
    | '#fe7672'
    | '#525152'
  size: number
  tool: 'pen-bold' | 'pencil-bold' | 'eraser'
  points: Array<{ x: number; y: number }>
}) => {
  if (!STROKE_ID_PATTERN.test(stroke.strokeId)) {
    throw new ConvexError({
      code: 'INVALID_STROKE_ID',
      message: 'The stroke ID is invalid.'
    })
  }
  if (!Number.isFinite(stroke.size) || stroke.size < 1 || stroke.size > 64) {
    throw new ConvexError({
      code: 'INVALID_STROKE_SIZE',
      message: 'Stroke size must be between 1 and 64.'
    })
  }
  if (
    stroke.points.length < 2 ||
    stroke.points.length > MAX_POINTS_PER_STROKE
  ) {
    throw new ConvexError({
      code: 'INVALID_STROKE_POINTS',
      message: `A stroke must contain between 2 and ${MAX_POINTS_PER_STROKE} points.`
    })
  }
  if (
    stroke.points.some(
      (point) => !Number.isFinite(point.x) || !Number.isFinite(point.y)
    )
  ) {
    throw new ConvexError({
      code: 'INVALID_STROKE_POINT',
      message: 'Stroke coordinates must be finite numbers.'
    })
  }

  return {
    strokeId: stroke.strokeId,
    color: stroke.color,
    size: stroke.size,
    tool: stroke.tool,
    points: stroke.points.map((point) => ({
      x: Math.max(0, Math.min(CANVAS_WIDTH, point.x)),
      y: Math.max(0, Math.min(CANVAS_HEIGHT, point.y))
    }))
  }
}

export const currentHourStartedAt = (now: number) =>
  Math.floor(now / HOUR_MS) * HOUR_MS

export const requireCurrentSession = async (
  ctx: MutationCtx,
  sessionId: Id<'canvasSessions'>,
  resumeSecret: string
) => {
  if (!RESUME_SECRET_PATTERN.test(resumeSecret)) {
    throw new ConvexError({
      code: 'INVALID_RESUME_SECRET',
      message: 'The canvas resume secret is invalid.'
    })
  }

  const now = Date.now()
  const session = await ctx.db.get('canvasSessions', sessionId)
  if (
    session === null ||
    session.resumeSecret !== resumeSecret ||
    session.hourStartedAt !== currentHourStartedAt(now) ||
    session.expiresAt <= now
  ) {
    throw new ConvexError({
      code: 'SESSION_EXPIRED',
      message: 'This canvas identity has expired.'
    })
  }
  return session
}
