import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { authTables } from "@convex-dev/auth/server";

// Shared validator for a single exercise entry inside a workout template or snapshot
const workoutExerciseValidator = v.object({
  exerciseId: v.id("exercises"),
  name: v.string(),  // cached so the name is readable even if exercise is later archived
  sets: v.number(),
});

export default defineSchema({
  ...authTables,
  // Override the default authTables users table with our custom fields
  users: defineTable({
    // Convex Auth fields (optional — managed by the auth library)
    name: v.optional(v.string()),
    image: v.optional(v.string()),
    email: v.optional(v.string()),
    emailVerificationTime: v.optional(v.number()),
    phone: v.optional(v.string()),
    phoneVerificationTime: v.optional(v.number()),
    isAnonymous: v.optional(v.boolean()),
    // Custom fields
    tokenIdentifier: v.optional(v.string()), // legacy identity key, updated on login
    role: v.optional(v.union(v.literal("trainer"), v.literal("client"))),
  })
    .index("email", ["email"])
    .index("by_token", ["tokenIdentifier"])
    .index("by_role", ["role"]),

  // Training groups (e.g. "Fitte mannen") — each has a color and member list
  groups: defineTable({
    name: v.string(),
    color: v.string(), // hex color e.g. "#3B82F6"
    cancelled: v.boolean(),
    memberIds: v.optional(v.array(v.id("users"))), // optional: existing groups have no members yet
  }),

  // Exercise library — Jolmer builds this over time from within the workout builder
  exercises: defineTable({
    name: v.string(),     // e.g. "Deadlift"
    archived: v.boolean(),
  }).index("by_archived", ["archived"]),

  // Reusable workout templates — Jolmer creates these, then assigns them to sessions
  workouts: defineTable({
    name: v.string(),                              // e.g. "Leg Day A"
    exercises: v.array(workoutExerciseValidator),  // ordered list of exercises + sets
    archived: v.boolean(),
    createdBy: v.string(),                         // tokenIdentifier of trainer
  }).index("by_archived", ["archived"]),

  // Sessions created by Jolmer — one session per group per time slot
  sessions: defineTable({
    date: v.string(),        // ISO date string "2026-05-20" (sorts lexicographically)
    time: v.string(),        // "09:00" (24h format)
    groupId: v.id("groups"),
    capacity: v.number(),    // always 14
    cancelled: v.boolean(),
    createdBy: v.string(),   // tokenIdentifier of trainer
    // Workout assignment — snapshot is frozen at assignment time so past sessions are unaffected
    workoutId: v.optional(v.id("workouts")),              // reference to the template (for display)
    workoutSnapshot: v.optional(v.array(workoutExerciseValidator)), // frozen copy of exercises + sets
  })
    .index("by_cancelled_and_date", ["cancelled", "date"])
    .index("by_group", ["groupId"]),

  // RSVP records — one per (session, user) pair
  attendance: defineTable({
    sessionId: v.id("sessions"),
    userId: v.string(),       // tokenIdentifier
    userName: v.string(),     // cached display name for attendee list
    status: v.union(v.literal("coming"), v.literal("cancelled")),
    signedUpAt: v.number(),   // timestamp for "Gemaakt op" column
    deleted: v.optional(v.boolean()), // soft-delete: true = record undone, treat as no_response
  })
    .index("by_session_and_status", ["sessionId", "status"])
    .index("by_user", ["userId"])
    .index("by_session_and_user", ["sessionId", "userId"]),

  // Workout logs — one row per (client + session + exercise)
  // Clients log their actual sets/reps/weight. isSubstitute=true means they replaced a prescribed exercise.
  workoutLogs: defineTable({
    sessionId: v.id("sessions"),
    userId: v.string(),          // tokenIdentifier of the client
    exerciseId: v.id("exercises"),
    exerciseName: v.string(),    // cached for display even if exercise is archived
    sets: v.array(v.object({ reps: v.number(), weight: v.number() })), // weight in kg
    isSubstitute: v.boolean(),   // true if client added this to replace a prescribed exercise
    deleted: v.optional(v.boolean()), // soft-delete flag
  })
    .index("by_session_and_user", ["sessionId", "userId"])
    .index("by_user_and_exercise", ["userId", "exerciseId"])
    .index("by_session", ["sessionId"]),
});
