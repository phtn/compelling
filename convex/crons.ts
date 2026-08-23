import { cronJobs } from 'convex/server'

import { internal } from './_generated/api'

const crons = cronJobs()

crons.cron(
  'reset expired canvas identities',
  '0 * * * *',
  internal.canvasSessions.removeExpired,
  {}
)

crons.cron(
  'reset expired canvas strokes',
  '0 * * * *',
  internal.canvasStrokes.removeExpired,
  {}
)

export default crons
