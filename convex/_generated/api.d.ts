/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as ResendOTP from "../ResendOTP.js";
import type * as attendance from "../attendance.js";
import type * as auth from "../auth.js";
import type * as exercises from "../exercises.js";
import type * as groups from "../groups.js";
import type * as http from "../http.js";
import type * as lib from "../lib.js";
import type * as migrations from "../migrations.js";
import type * as sessions from "../sessions.js";
import type * as users from "../users.js";
import type * as workoutLogs from "../workoutLogs.js";
import type * as workouts from "../workouts.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  ResendOTP: typeof ResendOTP;
  attendance: typeof attendance;
  auth: typeof auth;
  exercises: typeof exercises;
  groups: typeof groups;
  http: typeof http;
  lib: typeof lib;
  migrations: typeof migrations;
  sessions: typeof sessions;
  users: typeof users;
  workoutLogs: typeof workoutLogs;
  workouts: typeof workouts;
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

export declare const components: {};
