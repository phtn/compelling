import presence from '@convex-dev/presence/convex.config'
import mux from '@mux/convex/convex.config.js'
import { defineApp } from 'convex/server'

const app = defineApp()
app.use(presence)
app.use(mux, { name: 'mux' })

export default app
