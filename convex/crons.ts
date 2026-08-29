import { cronJobs } from 'convex/server'

import { internal } from './_generated/api'

const crons = cronJobs()

crons.cron(
  'reset expired canvas identities',
  '0 * * * *',
  internal.canvas.sessions.m.removeExpired,
  {}
)

crons.cron(
  'reset expired canvas strokes',
  '0 * * * *',
  internal.canvas.strokes.m.removeExpired,
  {}
)

export default crons
