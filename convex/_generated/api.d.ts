/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as canvas_presence from "../canvas/presence.js";
import type * as canvas_sessions_m from "../canvas/sessions/m.js";
import type * as canvas_sessions_q from "../canvas/sessions/q.js";
import type * as canvas_sessions_v from "../canvas/sessions/v.js";
import type * as canvas_strokes_m from "../canvas/strokes/m.js";
import type * as canvas_strokes_q from "../canvas/strokes/q.js";
import type * as canvas_strokes_v from "../canvas/strokes/v.js";
import type * as crons from "../crons.js";
import type * as http from "../http.js";
import type * as mux_http from "../mux/http.js";
import type * as mux_migrations from "../mux/migrations.js";
import type * as mux_video from "../mux/video.js";
import type * as mux_webhook from "../mux/webhook.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  "canvas/presence": typeof canvas_presence;
  "canvas/sessions/m": typeof canvas_sessions_m;
  "canvas/sessions/q": typeof canvas_sessions_q;
  "canvas/sessions/v": typeof canvas_sessions_v;
  "canvas/strokes/m": typeof canvas_strokes_m;
  "canvas/strokes/q": typeof canvas_strokes_q;
  "canvas/strokes/v": typeof canvas_strokes_v;
  crons: typeof crons;
  http: typeof http;
  "mux/http": typeof mux_http;
  "mux/migrations": typeof mux_migrations;
  "mux/video": typeof mux_video;
  "mux/webhook": typeof mux_webhook;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {
  presence: import("@convex-dev/presence/_generated/component.js").ComponentApi<"presence">;
  mux: import("@mux/convex/_generated/component.js").ComponentApi<"mux">;
};
