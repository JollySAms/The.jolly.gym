import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { requireAuth, requireTrainer } from "./lib";

const setValidator = v.object({ reps: v.number(), weight: v.number() });

// Client — get my own log entries for a specific session (excludes deleted)
export const getMyLog = query({
  args: { sessionId: v.id("sessions") },
  handler: async (ctx, args) => {
    const userId = await requireAuth(ctx);
    return await ctx.db
      .query("workoutLogs")
      .withIndex("by_session_and_user", (q) =>
        q.eq("sessionId", args.sessionId).eq("userId", userId)
      )
      .filter((q) => q.neq(q.field("deleted"), true))
      .take(50);
  },
});

// Client — get all log entries including soft-deleted (used by WorkoutLogSheet to detect removed exercises)
export const getMyRawLog = query({
  args: { sessionId: v.id("sessions") },
  handler: async (ctx, args) => {
    const userId = await requireAuth(ctx);
    return await ctx.db
      .query("workoutLogs")
      .withIndex("by_session_and_user", (q) =>
        q.eq("sessionId", args.sessionId).eq("userId", userId)
      )
      .take(50);
  },
});

// Client — get progression history for a specific exercise (own data only)
export const getMyProgressionForExercise = query({
  args: { exerciseId: v.id("exercises") },
  handler: async (ctx, args) => {
    const userId = await requireAuth(ctx);
    const logs = await ctx.db
      .query("workoutLogs")
      .withIndex("by_user_and_exercise", (q) =>
        q.eq("userId", userId).eq("exerciseId", args.exerciseId)
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
    clientId: v.string(),
  },
  handler: async (ctx, args) => {
    await requireTrainer(ctx);
    const logs = await ctx.db
      .query("workoutLogs")
      .withIndex("by_user_and_exercise", (q) =>
        q.eq("userId", args.clientId).eq("exerciseId", args.exerciseId)
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
    const userId = await requireAuth(ctx);
    const entries = await Promise.all(
      args.exerciseIds.map(async (exerciseId) => {
        const last = await ctx.db
          .query("workoutLogs")
          .withIndex("by_user_and_exercise", (q) =>
            q.eq("userId", userId).eq("exerciseId", exerciseId)
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
// Returns PR detection results: new exercise flag + any personal records broken.
export const saveLog = mutation({
  args: {
    sessionId: v.id("sessions"),
    exerciseId: v.id("exercises"),
    exerciseName: v.string(),
    sets: v.array(setValidator),
    isSubstitute: v.boolean(),
  },
  handler: async (ctx, args) => {
    const userId = await requireAuth(ctx);

    // Validate the session exists and is not cancelled
    const session = await ctx.db.get(args.sessionId);
    if (!session || session.cancelled) throw new Error("Sessie niet gevonden");

    const user = await ctx.db.get(userId);

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
          userName: user?.name ?? "Unknown",
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

    let logId;
    if (existing) {
      await ctx.db.patch(existing._id, {
        sets: args.sets,
        isSubstitute: args.isSubstitute,
        exerciseName: args.exerciseName,
      });
      logId = existing._id;
    } else {
      logId = await ctx.db.insert("workoutLogs", {
        sessionId: args.sessionId,
        userId,
        exerciseId: args.exerciseId,
        exerciseName: args.exerciseName,
        sets: args.sets,
        isSubstitute: args.isSubstitute,
      });
    }

    // --- PR Detection ---
    // Fetch all previous logs for this user+exercise, excluding current session
    const previousLogs = await ctx.db
      .query("workoutLogs")
      .withIndex("by_user_and_exercise", (q) =>
        q.eq("userId", userId).eq("exerciseId", args.exerciseId)
      )
      .filter((q) =>
        q.and(
          q.neq(q.field("sessionId"), args.sessionId),
          q.neq(q.field("deleted"), true)
        )
      )
      .take(200);

    // No history = new exercise
    if (previousLogs.length === 0) {
      return {
        logId,
        isNewExercise: true,
        exerciseName: args.exerciseName,
        prs: [],
      };
    }

    // Determine if this is a bodyweight exercise (all weights are 0)
    const currentSets = args.sets.filter((s) => s.reps > 0);
    const isBodyweight = currentSets.length > 0 && currentSets.every((s) => s.weight === 0);

    const prs: { type: string; value: number; previousBest: number }[] = [];

    if (isBodyweight) {
      // Max reps PR (bodyweight only)
      const currentMaxReps = Math.max(...currentSets.map((s) => s.reps));
      let historicalMaxReps = 0;
      for (const log of previousLogs) {
        for (const s of log.sets) {
          if (s.weight === 0 && s.reps > historicalMaxReps) {
            historicalMaxReps = s.reps;
          }
        }
      }
      if (currentMaxReps > historicalMaxReps) {
        prs.push({ type: "maxReps", value: currentMaxReps, previousBest: historicalMaxReps });
      }
    } else if (currentSets.some((s) => s.weight > 0)) {
      // Weighted exercise: check 3 PR types

      // 1. Max weight
      const currentMaxWeight = Math.max(...currentSets.map((s) => s.weight));
      let historicalMaxWeight = 0;
      for (const log of previousLogs) {
        for (const s of log.sets) {
          if (s.weight > historicalMaxWeight) historicalMaxWeight = s.weight;
        }
      }
      if (currentMaxWeight > historicalMaxWeight) {
        prs.push({ type: "maxWeight", value: currentMaxWeight, previousBest: historicalMaxWeight });
      }

      // 2. Max set volume (single set: reps x weight)
      const currentMaxSetVol = Math.max(...currentSets.map((s) => s.reps * s.weight));
      let historicalMaxSetVol = 0;
      for (const log of previousLogs) {
        for (const s of log.sets) {
          const vol = s.reps * s.weight;
          if (vol > historicalMaxSetVol) historicalMaxSetVol = vol;
        }
      }
      if (currentMaxSetVol > historicalMaxSetVol) {
        prs.push({ type: "maxSetVolume", value: currentMaxSetVol, previousBest: historicalMaxSetVol });
      }

      // 3. Max total volume (sum of all sets in one session)
      const currentTotalVol = currentSets.reduce((sum, s) => sum + s.reps * s.weight, 0);
      let historicalMaxTotalVol = 0;
      for (const log of previousLogs) {
        const totalVol = log.sets.reduce((sum, s) => sum + s.reps * s.weight, 0);
        if (totalVol > historicalMaxTotalVol) historicalMaxTotalVol = totalVol;
      }
      if (currentTotalVol > historicalMaxTotalVol) {
        prs.push({ type: "maxTotalVolume", value: currentTotalVol, previousBest: historicalMaxTotalVol });
      }
    }

    return {
      logId,
      isNewExercise: false,
      exerciseName: args.exerciseName,
      prs,
    };
  },
});

// Client — delete their log for one exercise in a session (when they skip it)
export const deleteLog = mutation({
  args: {
    sessionId: v.id("sessions"),
    exerciseId: v.id("exercises"),
  },
  handler: async (ctx, args) => {
    const userId = await requireAuth(ctx);
    const existing = await ctx.db
      .query("workoutLogs")
      .withIndex("by_session_and_user", (q) =>
        q.eq("sessionId", args.sessionId).eq("userId", userId)
      )
      .filter((q) => q.eq(q.field("exerciseId"), args.exerciseId))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, { deleted: true });
    } else {
      // Create a deleted placeholder so the exercise stays removed on reopen
      await ctx.db.insert("workoutLogs", {
        sessionId: args.sessionId,
        userId,
        exerciseId: args.exerciseId,
        exerciseName: "",
        sets: [],
        isSubstitute: false,
        deleted: true,
      });
    }
  },
});
