import { Presence } from '@convex-dev/presence'
import { ConvexError, v } from 'convex/values'

import { components } from './_generated/api'
import type { Id } from './_generated/dataModel'
import { mutation, query } from './_generated/server'
import type { MutationCtx } from './_generated/server'

const HOUR_MS = 60 * 60 * 1000
const HEARTBEAT_INTERVAL_MS = 5000
const MAX_USERS = 100
const MAX_CONNECTION_ID_LENGTH = 128

const presence = new Presence<string, Id<'canvasSessions'>>(components.presence)

const pointerValidator = v.object({
  sessionId: v.id('canvasSessions'),
  nickname: v.string(),
  x: v.number(),
  y: v.number()
})

interface PointerData {
  nickname: string
  x: number
  y: number
}

const currentHourStartedAt = (now: number) =>
  Math.floor(now / HOUR_MS) * HOUR_MS

const roomIdFor = (hourStartedAt: number) => `canvas:${hourStartedAt}`

const requireCurrentSession = async (
  ctx: MutationCtx,
  sessionId: Id<'canvasSessions'>,
  resumeSecret: string
) => {
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

const isPointerData = (value: unknown): value is PointerData => {
  if (typeof value !== 'object' || value === null) return false
  const data = value as Record<string, unknown>
  return (
    typeof data.nickname === 'string' &&
    typeof data.x === 'number' &&
    Number.isFinite(data.x) &&
    typeof data.y === 'number' &&
    Number.isFinite(data.y)
  )
}

export const heartbeat = mutation({
  args: {
    sessionId: v.id('canvasSessions'),
    resumeSecret: v.string(),
    connectionId: v.string()
  },
  returns: v.object({
    roomToken: v.string(),
    sessionToken: v.string()
  }),
  handler: async (ctx, args) => {
    if (
      args.connectionId.length === 0 ||
      args.connectionId.length > MAX_CONNECTION_ID_LENGTH
    ) {
      throw new ConvexError({
        code: 'INVALID_CONNECTION_ID',
        message: 'The pointer connection ID is invalid.'
      })
    }

    const session = await requireCurrentSession(
      ctx,
      args.sessionId,
      args.resumeSecret
    )
    return await presence.heartbeat(
      ctx,
      roomIdFor(session.hourStartedAt),
      session._id,
      args.connectionId,
      HEARTBEAT_INTERVAL_MS
    )
  }
})

export const updatePointer = mutation({
  args: {
    sessionId: v.id('canvasSessions'),
    resumeSecret: v.string(),
    x: v.number(),
    y: v.number()
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    if (!Number.isFinite(args.x) || !Number.isFinite(args.y)) {
      throw new ConvexError({
        code: 'INVALID_POINTER',
        message: 'Pointer coordinates must be finite numbers.'
      })
    }
    const session = await requireCurrentSession(
      ctx,
      args.sessionId,
      args.resumeSecret
    )
    return await presence.updateRoomUser(
      ctx,
      roomIdFor(session.hourStartedAt),
      session._id,
      {
        nickname: session.nickname,
        x: Math.max(0, Math.min(100, args.x)),
        y: Math.max(0, Math.min(100, args.y))
      }
    )
  }
})

export const clearPointer = mutation({
  args: {
    sessionId: v.id('canvasSessions'),
    resumeSecret: v.string()
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const session = await requireCurrentSession(
      ctx,
      args.sessionId,
      args.resumeSecret
    )
    return await presence.updateRoomUser(
      ctx,
      roomIdFor(session.hourStartedAt),
      session._id,
      undefined
    )
  }
})

export const listPointers = query({
  args: { roomToken: v.string() },
  returns: v.array(pointerValidator),
  handler: async (ctx, args) => {
    const users = await presence.list(ctx, args.roomToken, MAX_USERS)
    return users.flatMap((user) => {
      if (!user.online || !isPointerData(user.data)) return []
      return [
        {
          sessionId: user.userId,
          nickname: user.data.nickname,
          x: user.data.x,
          y: user.data.y
        }
      ]
    })
  }
})

export const disconnect = mutation({
  args: { sessionToken: v.string() },
  returns: v.null(),
  handler: async (ctx, args) => {
    return await presence.disconnect(ctx, args.sessionToken)
  }
})
