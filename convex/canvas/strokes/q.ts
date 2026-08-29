import { v } from 'convex/values'
import { query } from '../../_generated/server'
import { MAX_VISIBLE_STROKES, strokeSchema } from './v'

export const list = query({
  args: { hourStartedAt: v.number() },
  returns: v.array(strokeSchema),
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
