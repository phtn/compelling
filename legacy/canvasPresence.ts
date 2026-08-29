// import { Presence } from '@convex-dev/presence'
// import { ConvexError, v, type Infer } from 'convex/values'

// import { components } from './_generated/api'
// import type { Id } from './_generated/dataModel'
// import type { MutationCtx } from './_generated/server'
// import { mutation, query } from './_generated/server'
// import {
//   canvasPointValidator,
//   canvasStrokeColorValidator,
//   canvasStrokeToolValidator
// } from './canvas/strokes/v'

// const HOUR_MS = 60 * 60 * 1000
// const HEARTBEAT_INTERVAL_MS = 5000
// const MAX_USERS = 100
// const MAX_CONNECTION_ID_LENGTH = 128
// const MAX_LIVE_STROKE_POINTS = 512
// const STROKE_ID_PATTERN = /^[a-z0-9_-]{1,64}$/i
// const STROKE_COLORS = new Set([
//   '#e7e7e7',
//   '#d7d0fe',
//   'oklch(0.9 0.072 338.8)',
//   '#ffecba',
//   'oklch(0.68 0.16 319.98)',
//   '#3a9df6',
//   '#5cffad',
//   '#fe7672',
//   '#525152'
// ])
// const STROKE_TOOLS = new Set(['pen-bold', 'pencil-bold', 'eraser'])

// const presence = new Presence<string, Id<'canvasSessions'>>(components.presence)

// const liveStrokeValidator = v.object({
//   strokeId: v.string(),
//   color: canvasStrokeColorValidator,
//   size: v.number(),
//   tool: canvasStrokeToolValidator,
//   points: v.array(canvasPointValidator)
// })

// const pointerValidator = v.object({
//   sessionId: v.id('canvasSessions'),
//   nickname: v.string(),
//   x: v.number(),
//   y: v.number(),
//   liveStroke: v.optional(liveStrokeValidator)
// })

// type LiveStrokeData = Infer<typeof liveStrokeValidator>

// interface PointerData {
//   nickname: string
//   x: number
//   y: number
//   liveStroke?: LiveStrokeData
// }

// const currentHourStartedAt = (now: number) =>
//   Math.floor(now / HOUR_MS) * HOUR_MS

// const roomIdFor = (hourStartedAt: number) => `canvas:${hourStartedAt}`

// const isLiveStrokeData = (value: unknown): value is LiveStrokeData => {
//   if (typeof value !== 'object' || value === null) return false
//   const stroke = value as Record<string, unknown>
//   return (
//     typeof stroke.strokeId === 'string' &&
//     STROKE_ID_PATTERN.test(stroke.strokeId) &&
//     typeof stroke.color === 'string' &&
//     STROKE_COLORS.has(stroke.color) &&
//     typeof stroke.size === 'number' &&
//     Number.isFinite(stroke.size) &&
//     stroke.size >= 1 &&
//     stroke.size <= 64 &&
//     typeof stroke.tool === 'string' &&
//     STROKE_TOOLS.has(stroke.tool) &&
//     Array.isArray(stroke.points) &&
//     stroke.points.length <= MAX_LIVE_STROKE_POINTS &&
//     stroke.points.every((point) => {
//       if (typeof point !== 'object' || point === null) return false
//       const coordinate = point as Record<string, unknown>
//       return (
//         typeof coordinate.x === 'number' &&
//         Number.isFinite(coordinate.x) &&
//         typeof coordinate.y === 'number' &&
//         Number.isFinite(coordinate.y)
//       )
//     })
//   )
// }

// const requireCurrentSession = async (
//   ctx: MutationCtx,
//   sessionId: Id<'canvasSessions'>,
//   resumeSecret: string
// ) => {
//   const now = Date.now()
//   const session = await ctx.db.get('canvasSessions', sessionId)
//   if (
//     session === null ||
//     session.resumeSecret !== resumeSecret ||
//     session.hourStartedAt !== currentHourStartedAt(now) ||
//     session.expiresAt <= now
//   ) {
//     throw new ConvexError({
//       code: 'SESSION_EXPIRED',
//       message: 'This canvas identity has expired.'
//     })
//   }
//   return session
// }

// const isPointerData = (value: unknown): value is PointerData => {
//   if (typeof value !== 'object' || value === null) return false
//   const data = value as Record<string, unknown>
//   return (
//     typeof data.nickname === 'string' &&
//     typeof data.x === 'number' &&
//     Number.isFinite(data.x) &&
//     typeof data.y === 'number' &&
//     Number.isFinite(data.y) &&
//     (data.liveStroke === undefined || isLiveStrokeData(data.liveStroke))
//   )
// }

// export const heartbeat = mutation({
//   args: {
//     sessionId: v.id('canvasSessions'),
//     resumeSecret: v.string(),
//     connectionId: v.string()
//   },
//   returns: v.object({
//     roomToken: v.string(),
//     sessionToken: v.string()
//   }),
//   handler: async (ctx, args) => {
//     if (
//       args.connectionId.length === 0 ||
//       args.connectionId.length > MAX_CONNECTION_ID_LENGTH
//     ) {
//       throw new ConvexError({
//         code: 'INVALID_CONNECTION_ID',
//         message: 'The pointer connection ID is invalid.'
//       })
//     }

//     const session = await requireCurrentSession(
//       ctx,
//       args.sessionId,
//       args.resumeSecret
//     )
//     return await presence.heartbeat(
//       ctx,
//       roomIdFor(session.hourStartedAt),
//       session._id,
//       args.connectionId,
//       HEARTBEAT_INTERVAL_MS
//     )
//   }
// })

// export const updatePointer = mutation({
//   args: {
//     sessionId: v.id('canvasSessions'),
//     resumeSecret: v.string(),
//     x: v.number(),
//     y: v.number(),
//     liveStroke: v.optional(liveStrokeValidator)
//   },
//   returns: v.null(),
//   handler: async (ctx, args) => {
//     if (!Number.isFinite(args.x) || !Number.isFinite(args.y)) {
//       throw new ConvexError({
//         code: 'INVALID_POINTER',
//         message: 'Pointer coordinates must be finite numbers.'
//       })
//     }
//     if (
//       args.liveStroke !== undefined &&
//       (!STROKE_ID_PATTERN.test(args.liveStroke.strokeId) ||
//         !Number.isFinite(args.liveStroke.size) ||
//         args.liveStroke.size < 1 ||
//         args.liveStroke.size > 64 ||
//         args.liveStroke.points.length > MAX_LIVE_STROKE_POINTS ||
//         args.liveStroke.points.some(
//           (point) => !Number.isFinite(point.x) || !Number.isFinite(point.y)
//         ))
//     ) {
//       throw new ConvexError({
//         code: 'INVALID_LIVE_STROKE',
//         message: 'The live stroke payload is invalid.'
//       })
//     }
//     const session = await requireCurrentSession(
//       ctx,
//       args.sessionId,
//       args.resumeSecret
//     )
//     return await presence.updateRoomUser(
//       ctx,
//       roomIdFor(session.hourStartedAt),
//       session._id,
//       {
//         nickname: session.nickname,
//         x: Math.max(0, Math.min(100, args.x)),
//         y: Math.max(0, Math.min(100, args.y)),
//         ...(args.liveStroke === undefined
//           ? {}
//           : {
//               liveStroke: {
//                 ...args.liveStroke,
//                 points: args.liveStroke.points.map((point) => ({
//                   x: Math.max(0, Math.min(1400, point.x)),
//                   y: Math.max(0, Math.min(800, point.y))
//                 }))
//               }
//             })
//       }
//     )
//   }
// })

// export const clearPointer = mutation({
//   args: {
//     sessionId: v.id('canvasSessions'),
//     resumeSecret: v.string()
//   },
//   returns: v.null(),
//   handler: async (ctx, args) => {
//     const session = await requireCurrentSession(
//       ctx,
//       args.sessionId,
//       args.resumeSecret
//     )
//     return await presence.updateRoomUser(
//       ctx,
//       roomIdFor(session.hourStartedAt),
//       session._id,
//       undefined
//     )
//   }
// })

// export const listPointers = query({
//   args: { roomToken: v.string() },
//   returns: v.array(pointerValidator),
//   handler: async (ctx, args) => {
//     const users = await presence.list(ctx, args.roomToken, MAX_USERS)
//     return users.flatMap((user) => {
//       if (!user.online || !isPointerData(user.data)) return []
//       return [
//         {
//           sessionId: user.userId,
//           nickname: user.data.nickname,
//           x: user.data.x,
//           y: user.data.y,
//           ...(user.data.liveStroke === undefined
//             ? {}
//             : { liveStroke: user.data.liveStroke })
//         }
//       ]
//     })
//   }
// })

// export const disconnect = mutation({
//   args: { sessionToken: v.string() },
//   returns: v.null(),
//   handler: async (ctx, args) => {
//     return await presence.disconnect(ctx, args.sessionToken)
//   }
// })
