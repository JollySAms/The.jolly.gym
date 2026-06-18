import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { requireAuth, requireTrainer } from "./lib";

const setValidator = v.object({ reps: v.number(), weight: v.number() });

// Client — get my own log entries for a specific session
export const getMyLog = query({
  args: { sessionId: v.id("sessions") },
  handler: async (ctx, args) => {
    const identity = await requireAuth(ctx);
    return await ctx.db
      .query("workoutLogs")
      .withIndex("by_session_and_user", (q) =>
        q.eq("sessionId", args.sessionId).eq("userId", identity.tokenIdentifier)
      )
      .filter((q) => q.neq(q.field("deleted"), true))
      .take(50);
  },
});

// Client — get progression history for a specific exercise (own data only)
export const getMyProgressionForExercise = query({
  args: { exerciseId: v.id("exercises") },
  handler: async (ctx, args) => {
    const identity = await requireAuth(ctx);
    const logs = await ctx.db
      .query("workoutLogs")
      .withIndex("by_user_and_exercise", (q) =>
        q.eq("userId", identity.tokenIdentifier).eq("exerciseId", args.exerciseId)
      )
      .filter((q) => q.neq(q.field("deleted"), true))
      .take(50);

    const enriched = await Promise.all(
      logs.map(async (log) => {
        const session = await ctx.db.get(log.sessionId);
        return { ...log, sessionDate: session?.date ?? null };
      })
    );

    return enriched.sort((a, b) => {
      if (!a.sessionDate) return 1;
      if (!b.sessionDate) return -1;
      return b.sessionDate.localeCompare(a.sessionDate);
    });
  },
});

// Trainer — get all logs for a specific exercise for a specific client
export const getForExercise = query({
  args: {
    exerciseId: v.id("exercises"),
    clientTokenIdentifier: v.string(),
  },
  handler: async (ctx, args) => {
    await requireTrainer(ctx);
    const logs = await ctx.db
      .query("workoutLogs")
      .withIndex("by_user_and_exercise", (q) =>
        q.eq("userId", args.clientTokenIdentifier).eq("exerciseId", args.exerciseId)
      )
      .filter((q) => q.neq(q.field("deleted"), true))
      .take(50);

    const enriched = await Promise.all(
      logs.map(async (log) => {
        const session = await ctx.db.get(log.sessionId);
        return { ...log, sessionDate: session?.date ?? null };
      })
    );

    return enriched.sort((a, b) => {
      if (!a.sessionDate) return 1;
      if (!b.sessionDate) return -1;
      return b.sessionDate.localeCompare(a.sessionDate);
    });
  },
});

// Client — get the most recently saved sets for each given exercise.
// Used to show last-used reps/weight as placeholders in the workout log sheet.
export const getMyLastLogs = query({
  args: { exerciseIds: v.array(v.id("exercises")) },
  handler: async (ctx, args) => {
    const identity = await requireAuth(ctx);
    const entries = await Promise.all(
      args.exerciseIds.map(async (exerciseId) => {
        const last = await ctx.db
          .query("workoutLogs")
          .withIndex("by_user_and_exercise", (q) =>
            q.eq("userId", identity.tokenIdentifier).eq("exerciseId", exerciseId)
          )
          .filter((q) => q.neq(q.field("deleted"), true))
          .order("desc")
          .first();
        return [exerciseId, last?.sets ?? null] as const;
      })
    );
    return Object.fromEntries(entries);
  },
});

// Client — save (upsert) their log for one exercise in a session.
// If a log already exists for this (session + user + exercise), it is replaced.
// Also auto-RSVPs the client to the session if they don't have a "coming" record yet.
export const saveLog = mutation({
  args: {
    sessionId: v.id("sessions"),
    exerciseId: v.id("exercises"),
    exerciseName: v.string(),
    sets: v.array(setValidator),
    isSubstitute: v.boolean(),
  },
  handler: async (ctx, args) => {
    const identity = await requireAuth(ctx);
    const userId = identity.tokenIdentifier;

    // Validate the session exists and is not cancelled
    const session = await ctx.db.get(args.sessionId);
    if (!session || session.cancelled) throw new Error("Sessie niet gevonden");

    // Auto-RSVP: ensure a "coming" attendance record exists before saving the log
    const existingAttendance = await ctx.db
      .query("attendance")
      .withIndex("by_session_and_user", (q) =>
        q.eq("sessionId", args.sessionId).eq("userId", userId)
      )
      .unique();

    if (!existingAttendance || existingAttendance.status !== "coming") {
      if (existingAttendance) {
        // Previously cancelled — reactivate
        await ctx.db.patch(existingAttendance._id, {
          status: "coming",
          signedUpAt: Date.now(),
        });
      } else {
        // No record yet — create one
        await ctx.db.insert("attendance", {
          sessionId: args.sessionId,
          userId,
          userName: identity.name ?? identity.email ?? "Unknown",
          status: "coming",
          signedUpAt: Date.now(),
        });
      }
    }

    // Check for existing log entry (upsert)
    const existing = await ctx.db
      .query("workoutLogs")
      .withIndex("by_session_and_user", (q) =>
        q.eq("sessionId", args.sessionId).eq("userId", userId)
      )
      .filter((q) =>
        q.and(
          q.eq(q.field("exerciseId"), args.exerciseId),
          q.neq(q.field("deleted"), true)
        )
      )
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        sets: args.sets,
        isSubstitute: args.isSubstitute,
        exerciseName: args.exerciseName,
      });
      return existing._id;
    }

    return await ctx.db.insert("workoutLogs", {
      sessionId: args.sessionId,
      userId,
      exerciseId: args.exerciseId,
      exerciseName: args.exerciseName,
      sets: args.sets,
      isSubstitute: args.isSubstitute,
    });
  },
});

// Client — delete their log for one exercise in a session (when they skip it)
export const deleteLog = mutation({
  args: {
    sessionId: v.id("sessions"),
    exerciseId: v.id("exercises"),
  },
  handler: async (ctx, args) => {
    const identity = await requireAuth(ctx);
    const existing = await ctx.db
      .query("workoutLogs")
      .withIndex("by_session_and_user", (q) =>
        q.eq("sessionId", args.sessionId).eq("userId", identity.tokenIdentifier)
      )
      .filter((q) => q.eq(q.field("exerciseId"), args.exerciseId))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, { deleted: true });
    }
  },
});
