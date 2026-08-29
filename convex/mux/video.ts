import { v } from 'convex/values'
import { components } from '../_generated/api'
import { query } from '../_generated/server'

export const listAssets = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    return await ctx.runQuery(components.mux.catalog.listAssets, {
      limit: args.limit ?? 50
    })
  }
})

export const getAsset = query({
  args: { muxAssetId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.runQuery(components.mux.catalog.getAssetByMuxId, {
      muxAssetId: args.muxAssetId
    })
  }
})
