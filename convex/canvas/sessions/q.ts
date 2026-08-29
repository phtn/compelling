import { v } from 'convex/values'
import { query } from '../../_generated/server'
import {
  currentHourStartedAt,
  HOUR_MS,
  MAX_USERS,
  roomUserValidator
} from './v'

export const listCurrent = query({
  args: {},
  returns: v.object({
    users: v.array(roomUserValidator),
    expiresAt: v.number(),
    maxUsers: v.number()
  }),
  handler: async (ctx) => {
    const now = Date.now()
    const hourStartedAt = currentHourStartedAt(now)
    const sessions = await ctx.db
      .query('canvasSessions')
      .withIndex('by_hourStartedAt', (q) =>
        q.eq('hourStartedAt', hourStartedAt)
      )
      .take(MAX_USERS)

    return {
      users: sessions.map((session) => ({
        sessionId: session._id,
        nickname: session.nickname,
        joinedAt: session._creationTime
      })),
      expiresAt: hourStartedAt + HOUR_MS,
      maxUsers: MAX_USERS
    }
  }
})
