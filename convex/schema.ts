import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // Tracks all users — role "trainer" for Jolmer, "client" for everyone else
  users: defineTable({
    tokenIdentifier: v.string(), // stable Clerk identity key
    name: v.string(),
    email: v.string(),
    role: v.union(v.literal("trainer"), v.literal("client")),
  }).index("by_token", ["tokenIdentifier"]),

  // Training groups (e.g. "Fitte mannen") — each has a color and member list
  groups: defineTable({
    name: v.string(),
    color: v.string(), // hex color e.g. "#3B82F6"
    cancelled: v.boolean(),
    memberIds: v.optional(v.array(v.id("users"))), // optional: existing groups have no members yet
  }),

  // Sessions created by Jolmer — one session per group per time slot
  sessions: defineTable({
    date: v.string(),        // ISO date string "2026-05-20" (sorts lexicographically)
    time: v.string(),        // "09:00" (24h format)
    groupId: v.id("groups"),
    capacity: v.number(),    // always 14
    cancelled: v.boolean(),
    createdBy: v.string(),   // tokenIdentifier of trainer
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
  })
    .index("by_session_and_status", ["sessionId", "status"])
    .index("by_user", ["userId"])
    .index("by_session_and_user", ["sessionId", "userId"]),
});
