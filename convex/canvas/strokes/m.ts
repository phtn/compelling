import { ConvexError, v } from 'convex/values'
import { internal } from '../../_generated/api'
import { internalMutation, mutation } from '../../_generated/server'
import {
  DELETE_BATCH_SIZE,
  normalizeStroke,
  requireCurrentSession,
  strokeInputValidator
} from './v'

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
      await ctx.scheduler.runAfter(
        0,
        internal.canvas.strokes.m.clearHourBatch,
        {
          hourStartedAt: args.hourStartedAt,
          clearBefore: args.clearBefore
        }
      )
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
      await ctx.scheduler.runAfter(
        0,
        internal.canvas.strokes.m.clearHourBatch,
        {
          hourStartedAt: session.hourStartedAt,
          clearBefore
        }
      )
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
      await ctx.scheduler.runAfter(
        0,
        internal.canvas.strokes.m.removeExpired,
        {}
      )
    }
    return strokes.length
  }
})
