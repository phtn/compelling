import { ConvexError, v } from 'convex/values'

import { internal } from './_generated/api'
import type { Id } from './_generated/dataModel'
import {
  internalMutation,
  mutation,
  query,
  type MutationCtx
} from './_generated/server'
import schema, {
  canvasPointValidator,
  canvasStrokeColorValidator,
  canvasStrokeToolValidator
} from './schema'

const HOUR_MS = 60 * 60 * 1000
const CANVAS_WIDTH = 1400
const CANVAS_HEIGHT = 800
const MAX_POINTS_PER_STROKE = 2048
const MAX_VISIBLE_STROKES = 500
const DELETE_BATCH_SIZE = 200
const RESUME_SECRET_PATTERN = /^[a-f0-9]{32}$/
const STROKE_ID_PATTERN = /^[a-z0-9_-]{1,64}$/i

const strokeInputValidator = v.object({
  strokeId: v.string(),
  color: canvasStrokeColorValidator,
  size: v.number(),
  tool: canvasStrokeToolValidator,
  points: v.array(canvasPointValidator)
})

const currentHourStartedAt = (now: number) =>
  Math.floor(now / HOUR_MS) * HOUR_MS

const requireCurrentSession = async (
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

const normalizeStroke = (stroke: {
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
  if (
    !Number.isFinite(stroke.size) ||
    stroke.size < 1 ||
    stroke.size > 64
  ) {
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

export const commit = mutation({
  args: {
    sessionId: v.id('canvasSessions'),
    resumeSecret: v.string(),
    ...strokeInputValidator.fields
  },
  returns: v.id('canvasStrokes'),
  handler: async (ctx, args) => {
    const session = await requireCurrentSession(
      ctx,
      args.sessionId,
      args.resumeSecret
    )
    const stroke = normalizeStroke(args)
    const existing = await ctx.db
      .query('canvasStrokes')
      .withIndex('by_hourStartedAt_and_strokeId', (q) =>
        q
          .eq('hourStartedAt', session.hourStartedAt)
          .eq('strokeId', stroke.strokeId)
      )
      .unique()

    if (existing !== null) {
      if (existing.sessionId !== session._id) {
        throw new ConvexError({
          code: 'STROKE_ID_CONFLICT',
          message: 'That stroke ID is already in use.'
        })
      }
      await ctx.db.replace('canvasStrokes', existing._id, {
        hourStartedAt: session.hourStartedAt,
        expiresAt: session.expiresAt,
        sessionId: session._id,
        createdAt: existing.createdAt,
        ...stroke
      })
      return existing._id
    }

    return await ctx.db.insert('canvasStrokes', {
      hourStartedAt: session.hourStartedAt,
      expiresAt: session.expiresAt,
      sessionId: session._id,
      createdAt: Date.now(),
      ...stroke
    })
  }
})

export const list = query({
  args: { hourStartedAt: v.number() },
  returns: v.array(schema.doc('canvasStrokes')),
  handler: async (ctx, args) => {
    const strokes = await ctx.db
      .query('canvasStrokes')
      .withIndex('by_hourStartedAt', (q) =>
        q.eq('hourStartedAt', args.hourStartedAt)
      )
      .order('desc')
      .take(MAX_VISIBLE_STROKES)
    return strokes.reverse()
  }
})

export const undoLast = mutation({
  args: {
    sessionId: v.id('canvasSessions'),
    resumeSecret: v.string()
  },
  returns: v.union(v.string(), v.null()),
  handler: async (ctx, args) => {
    const session = await requireCurrentSession(
      ctx,
      args.sessionId,
      args.resumeSecret
    )
    const stroke = await ctx.db
      .query('canvasStrokes')
      .withIndex('by_hourStartedAt_and_sessionId', (q) =>
        q
          .eq('hourStartedAt', session.hourStartedAt)
          .eq('sessionId', session._id)
      )
      .order('desc')
      .first()
    if (stroke === null) return null
    await ctx.db.delete('canvasStrokes', stroke._id)
    return stroke.strokeId
  }
})

export const clearHourBatch = internalMutation({
  args: { hourStartedAt: v.number(), clearBefore: v.number() },
  returns: v.number(),
  handler: async (ctx, args): Promise<number> => {
    const strokes = await ctx.db
      .query('canvasStrokes')
      .withIndex('by_hourStartedAt_and_createdAt', (q) =>
        q
          .eq('hourStartedAt', args.hourStartedAt)
          .lte('createdAt', args.clearBefore)
      )
      .take(DELETE_BATCH_SIZE)
    for (const stroke of strokes) {
      await ctx.db.delete('canvasStrokes', stroke._id)
    }
    if (strokes.length === DELETE_BATCH_SIZE) {
      await ctx.scheduler.runAfter(0, internal.canvasStrokes.clearHourBatch, {
        hourStartedAt: args.hourStartedAt,
        clearBefore: args.clearBefore
      })
    }
    return strokes.length
  }
})

export const clear = mutation({
  args: {
    sessionId: v.id('canvasSessions'),
    resumeSecret: v.string()
  },
  returns: v.number(),
  handler: async (ctx, args) => {
    const session = await requireCurrentSession(
      ctx,
      args.sessionId,
      args.resumeSecret
    )
    const clearBefore = Date.now()
    const strokes = await ctx.db
      .query('canvasStrokes')
      .withIndex('by_hourStartedAt_and_createdAt', (q) =>
        q
          .eq('hourStartedAt', session.hourStartedAt)
          .lte('createdAt', clearBefore)
      )
      .take(DELETE_BATCH_SIZE)
    for (const stroke of strokes) {
      await ctx.db.delete('canvasStrokes', stroke._id)
    }
    if (strokes.length === DELETE_BATCH_SIZE) {
      await ctx.scheduler.runAfter(0, internal.canvasStrokes.clearHourBatch, {
        hourStartedAt: session.hourStartedAt,
        clearBefore
      })
    }
    return strokes.length
  }
})

export const removeExpired = internalMutation({
  args: {},
  returns: v.number(),
  handler: async (ctx): Promise<number> => {
    const strokes = await ctx.db
      .query('canvasStrokes')
      .withIndex('by_expiresAt', (q) => q.lte('expiresAt', Date.now()))
      .take(DELETE_BATCH_SIZE)
    for (const stroke of strokes) {
      await ctx.db.delete('canvasStrokes', stroke._id)
    }
    if (strokes.length === DELETE_BATCH_SIZE) {
      await ctx.scheduler.runAfter(0, internal.canvasStrokes.removeExpired, {})
    }
    return strokes.length
  }
})
