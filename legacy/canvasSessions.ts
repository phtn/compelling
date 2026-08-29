// import { ConvexError, v } from 'convex/values'

// import { internalMutation, mutation, query } from '../convex/_generated/server'
// import {
//   defaultNickname,
//   normalizeNickname,
//   validateResumeSecret
// } from '../convex/canvas/sessions/v'
// import { currentHourStartedAt } from '../convex/canvas/strokes/v'

// const HOUR_MS = 60 * 60 * 1000
// const MAX_USERS = 100

// const canvasSessionValidator = v.object({
//   sessionId: v.id('canvasSessions'),
//   nickname: v.string(),
//   expiresAt: v.number()
// })

// const roomUserValidator = v.object({
//   sessionId: v.id('canvasSessions'),
//   nickname: v.string(),
//   joinedAt: v.number()
// })

// export const acquire = mutation({
//   args: {
//     existingSessionId: v.optional(v.id('canvasSessions')),
//     resumeSecret: v.string()
//   },
//   returns: v.object({
//     session: canvasSessionValidator,
//     activeUserCount: v.number(),
//     maxUsers: v.number(),
//     reused: v.boolean()
//   }),
//   handler: async (ctx, args) => {
//     validateResumeSecret(args.resumeSecret)

//     const now = Date.now()
//     const hourStartedAt = currentHourStartedAt(now)
//     const expiresAt = hourStartedAt + HOUR_MS
//     const activeSessions = await ctx.db
//       .query('canvasSessions')
//       .withIndex('by_hourStartedAt', (q) =>
//         q.eq('hourStartedAt', hourStartedAt)
//       )
//       .take(MAX_USERS)

//     if (args.existingSessionId !== undefined) {
//       const existingSession = await ctx.db.get(
//         'canvasSessions',
//         args.existingSessionId
//       )
//       if (
//         existingSession !== null &&
//         existingSession.resumeSecret === args.resumeSecret &&
//         existingSession.hourStartedAt === hourStartedAt &&
//         existingSession.expiresAt > now
//       ) {
//         return {
//           session: {
//             sessionId: existingSession._id,
//             nickname: existingSession.nickname,
//             expiresAt: existingSession.expiresAt
//           },
//           activeUserCount: activeSessions.length,
//           maxUsers: MAX_USERS,
//           reused: true
//         }
//       }
//     }

//     if (activeSessions.length >= MAX_USERS) {
//       throw new ConvexError({
//         code: 'CANVAS_FULL',
//         message:
//           'This hourly canvas is full. A new room opens at the top of the hour.'
//       })
//     }

//     const expiredSessions = await ctx.db
//       .query('canvasSessions')
//       .withIndex('by_expiresAt', (q) => q.lte('expiresAt', now))
//       .take(MAX_USERS)
//     for (const expiredSession of expiredSessions) {
//       await ctx.db.delete('canvasSessions', expiredSession._id)
//     }

//     const sessionId = await ctx.db.insert('canvasSessions', {
//       hourStartedAt,
//       expiresAt,
//       resumeSecret: args.resumeSecret,
//       nickname: '',
//       updatedAt: now
//     })
//     const nickname = defaultNickname(sessionId)
//     await ctx.db.patch('canvasSessions', sessionId, { nickname })

//     return {
//       session: { sessionId, nickname, expiresAt },
//       activeUserCount: activeSessions.length + 1,
//       maxUsers: MAX_USERS,
//       reused: false
//     }
//   }
// })

// export const removeExpired = internalMutation({
//   args: {},
//   returns: v.number(),
//   handler: async (ctx) => {
//     const expiredSessions = await ctx.db
//       .query('canvasSessions')
//       .withIndex('by_expiresAt', (q) => q.lte('expiresAt', Date.now()))
//       .take(MAX_USERS)

//     for (const expiredSession of expiredSessions) {
//       await ctx.db.delete('canvasSessions', expiredSession._id)
//     }
//     return expiredSessions.length
//   }
// })

// export const updateNickname = mutation({
//   args: {
//     sessionId: v.id('canvasSessions'),
//     resumeSecret: v.string(),
//     nickname: v.string()
//   },
//   returns: canvasSessionValidator,
//   handler: async (ctx, args) => {
//     validateResumeSecret(args.resumeSecret)

//     const now = Date.now()
//     const session = await ctx.db.get('canvasSessions', args.sessionId)
//     if (
//       session === null ||
//       session.resumeSecret !== args.resumeSecret ||
//       session.hourStartedAt !== currentHourStartedAt(now) ||
//       session.expiresAt <= now
//     ) {
//       throw new ConvexError({
//         code: 'SESSION_EXPIRED',
//         message: 'This canvas identity has expired. Refresh to get a new one.'
//       })
//     }

//     const nickname = normalizeNickname(args.nickname, session._id)
//     await ctx.db.patch('canvasSessions', session._id, {
//       nickname,
//       updatedAt: now
//     })

//     return {
//       sessionId: session._id,
//       nickname,
//       expiresAt: session.expiresAt
//     }
//   }
// })

// export const listCurrent = query({
//   args: {},
//   returns: v.object({
//     users: v.array(roomUserValidator),
//     expiresAt: v.number(),
//     maxUsers: v.number()
//   }),
//   handler: async (ctx) => {
//     const now = Date.now()
//     const hourStartedAt = currentHourStartedAt(now)
//     const sessions = await ctx.db
//       .query('canvasSessions')
//       .withIndex('by_hourStartedAt', (q) =>
//         q.eq('hourStartedAt', hourStartedAt)
//       )
//       .take(MAX_USERS)

//     return {
//       users: sessions.map((session) => ({
//         sessionId: session._id,
//         nickname: session.nickname,
//         joinedAt: session._creationTime
//       })),
//       expiresAt: hourStartedAt + HOUR_MS,
//       maxUsers: MAX_USERS
//     }
//   }
// })
