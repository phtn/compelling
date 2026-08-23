import { ConvexClient } from 'convex/browser'

import { api } from '../../convex/_generated/api'
import type { Id } from '../../convex/_generated/dataModel'

const STORAGE_KEY = 'compelling.canvas.identity.v1'

export interface CanvasSession {
  sessionId: Id<'canvasSessions'>
  nickname: string
  expiresAt: number
  resumeSecret: string
}

export interface CanvasRoomUser {
  sessionId: Id<'canvasSessions'>
  nickname: string
  joinedAt: number
}

export interface CanvasRoom {
  users: CanvasRoomUser[]
  expiresAt: number
  maxUsers: number
}

interface StoredCanvasIdentity {
  sessionId: Id<'canvasSessions'>
  resumeSecret: string
  expiresAt: number
}

let client: ConvexClient | undefined

const getClient = () => {
  const deploymentUrl = import.meta.env.VITE_CONVEX_URL
  if (!deploymentUrl) {
    throw new Error('VITE_CONVEX_URL is not configured.')
  }
  client ??= new ConvexClient(deploymentUrl)
  return client
}

const generateResumeSecret = () => {
  const bytes = new Uint8Array(16)
  crypto.getRandomValues(bytes)
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join(
    ''
  )
}

const readStoredIdentity = (): StoredCanvasIdentity | null => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw === null) return null
    const parsed = JSON.parse(raw) as Partial<StoredCanvasIdentity>
    if (
      typeof parsed.sessionId !== 'string' ||
      typeof parsed.resumeSecret !== 'string' ||
      typeof parsed.expiresAt !== 'number' ||
      parsed.expiresAt <= Date.now()
    ) {
      localStorage.removeItem(STORAGE_KEY)
      return null
    }
    return parsed as StoredCanvasIdentity
  } catch {
    return null
  }
}

const storeIdentity = (identity: StoredCanvasIdentity) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(identity))
  } catch {
    // The lease still works when storage is unavailable; it simply cannot resume.
  }
}

export const acquireCanvasSession = async (): Promise<CanvasSession> => {
  const storedIdentity = readStoredIdentity()
  const resumeSecret = storedIdentity?.resumeSecret ?? generateResumeSecret()
  const result = await getClient().mutation(api.canvasSessions.acquire, {
    existingSessionId: storedIdentity?.sessionId,
    resumeSecret
  })
  const session = { ...result.session, resumeSecret }
  storeIdentity(session)
  return session
}

export const updateCanvasNickname = async (
  session: CanvasSession,
  nickname: string
): Promise<CanvasSession> => {
  const updated = await getClient().mutation(
    api.canvasSessions.updateNickname,
    {
      sessionId: session.sessionId,
      resumeSecret: session.resumeSecret,
      nickname
    }
  )
  const nextSession = { ...updated, resumeSecret: session.resumeSecret }
  storeIdentity(nextSession)
  return nextSession
}

export const watchCanvasRoom = (
  onUpdate: (room: CanvasRoom) => void,
  onError: (error: Error) => void
) => getClient().onUpdate(api.canvasSessions.listCurrent, {}, onUpdate, onError)
