import { ConvexError, v } from 'convex/values'

export const HOUR_MS = 60 * 60 * 1000
export const MAX_USERS = 100
export const MAX_NICKNAME_LENGTH = 24
export const RESUME_SECRET_PATTERN = /^[a-f0-9]{32}$/

export const currentHourStartedAt = (now: number) =>
  Math.floor(now / HOUR_MS) * HOUR_MS

export const defaultNickname = (sessionId: string) =>
  `Guest ${sessionId.slice(-6).toUpperCase()}`

export const normalizeNickname = (nickname: string, sessionId: string) => {
  const normalized = nickname.trim().replace(/\s+/g, ' ')
  if (Array.from(normalized).length > MAX_NICKNAME_LENGTH) {
    throw new ConvexError({
      code: 'NICKNAME_TOO_LONG',
      message: `Nicknames can be at most ${MAX_NICKNAME_LENGTH} characters.`
    })
  }
  return normalized || defaultNickname(sessionId)
}

export const validateResumeSecret = (resumeSecret: string) => {
  if (!RESUME_SECRET_PATTERN.test(resumeSecret)) {
    throw new ConvexError({
      code: 'INVALID_RESUME_SECRET',
      message: 'The canvas resume secret is invalid.'
    })
  }
}
export const sessionSchema = v.object({
  hourStartedAt: v.number(),
  expiresAt: v.number(),
  resumeSecret: v.string(),
  nickname: v.string(),
  updatedAt: v.number()
})
export const canvasSessionValidator = v.object({
  sessionId: v.id('canvasSessions'),
  nickname: v.string(),
  expiresAt: v.number()
})

export const roomUserValidator = v.object({
  sessionId: v.id('canvasSessions'),
  nickname: v.string(),
  joinedAt: v.number()
})
