import { cronJobs } from 'convex/server'

import { internal } from './_generated/api'

const crons = cronJobs()

crons.hourly(
  'reset expired canvas identities',
  { minuteUTC: 0 },
  internal.canvasSessions.removeExpired
)

export default crons
