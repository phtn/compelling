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

export interface CanvasStrokePoint {
  x: number
  y: number
}

export type CanvasStrokeColor =
  | '#e7e7e7'
  | '#d7d0fe'
  | 'oklch(0.9 0.072 338.8)'
  | '#ffecba'
  | 'oklch(0.68 0.16 319.98)'
  | '#3a9df6'
  | '#5cffad'
  | '#fe7672'
  | '#525152'

export type CanvasStrokeTool = 'pen-bold' | 'pencil-bold' | 'eraser'

export interface CanvasLiveStroke {
  strokeId: string
  color: CanvasStrokeColor
  size: number
  tool: CanvasStrokeTool
  points: CanvasStrokePoint[]
}

export interface CanvasStroke extends CanvasLiveStroke {
  sessionId: Id<'canvasSessions'>
}

export interface CanvasPointer {
  sessionId: Id<'canvasSessions'>
  nickname: string
  x: number
  y: number
  liveStroke?: CanvasLiveStroke
}

export interface CanvasPresenceConnection {
  roomToken: string
  sessionToken: string
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

export const createCanvasPresenceConnectionId = () =>
  `canvas-${generateResumeSecret()}`

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

export const heartbeatCanvasPresence = (
  session: CanvasSession,
  connectionId: string
): Promise<CanvasPresenceConnection> =>
  getClient().mutation(api.canvasPresence.heartbeat, {
    sessionId: session.sessionId,
    resumeSecret: session.resumeSecret,
    connectionId
  })

export const updateCanvasPointer = (
  session: CanvasSession,
  x: number,
  y: number,
  liveStroke?: CanvasLiveStroke
) =>
  getClient().mutation(api.canvasPresence.updatePointer, {
    sessionId: session.sessionId,
    resumeSecret: session.resumeSecret,
    x,
    y,
    ...(liveStroke === undefined ? {} : { liveStroke })
  })

export const clearCanvasPointer = (session: CanvasSession) =>
  getClient().mutation(api.canvasPresence.clearPointer, {
    sessionId: session.sessionId,
    resumeSecret: session.resumeSecret
  })

export const disconnectCanvasPresence = (sessionToken: string) =>
  getClient().mutation(api.canvasPresence.disconnect, { sessionToken })

export const watchCanvasPointers = (
  roomToken: string,
  onUpdate: (pointers: CanvasPointer[]) => void,
  onError: (error: Error) => void
) =>
  getClient().onUpdate(
    api.canvasPresence.listPointers,
    { roomToken },
    onUpdate,
    onError
  )

export const commitCanvasStroke = (
  session: CanvasSession,
  stroke: CanvasLiveStroke
) =>
  getClient().mutation(api.canvasStrokes.commit, {
    sessionId: session.sessionId,
    resumeSecret: session.resumeSecret,
    ...stroke
  })

export const undoLastCanvasStroke = (session: CanvasSession) =>
  getClient().mutation(api.canvasStrokes.undoLast, {
    sessionId: session.sessionId,
    resumeSecret: session.resumeSecret
  })

export const clearCanvasStrokes = (session: CanvasSession) =>
  getClient().mutation(api.canvasStrokes.clear, {
    sessionId: session.sessionId,
    resumeSecret: session.resumeSecret
  })

export const watchCanvasStrokes = (
  session: CanvasSession,
  onUpdate: (strokes: CanvasStroke[]) => void,
  onError: (error: Error) => void
) =>
  getClient().onUpdate(
    api.canvasStrokes.list,
    { hourStartedAt: session.expiresAt - 60 * 60 * 1000 },
    (strokes) =>
      onUpdate(
        strokes.map((stroke) => ({
          strokeId: stroke.strokeId,
          sessionId: stroke.sessionId,
          color: stroke.color,
          size: stroke.size,
          tool: stroke.tool,
          points: stroke.points
        }))
      ),
    onError
  )
