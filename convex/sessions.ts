import { mutation, query, QueryCtx } from "./_generated/server";
import { v } from "convex/values";
import { Doc } from "./_generated/dataModel";
import { requireAuth, requireTrainer } from "./lib";

// Returns all active sessions for a given month with group info + attendance count.
// Used to render calendar dots and the day session list.
export const listByMonth = query({
  args: {
    year: v.number(),
    month: v.number(), // 1–12
  },
  handler: async (ctx, args) => {
    await requireAuth(ctx);

    const mm = String(args.month).padStart(2, "0");
    const startDate = `${args.year}-${mm}-01`;
    const endDate = `${args.year}-${mm}-31`; // safe upper bound for any month

    const sessions = await ctx.db
      .query("sessions")
      .withIndex("by_cancelled_and_date", (q) =>
        q.eq("cancelled", false).gte("date", startDate).lte("date", endDate)
      )
      .take(200);

    return await Promise.all(sessions.map((s) => enrichSession(ctx, s)));
  },
});

// Returns active sessions for a specific date with group info + attendance count.
export const listByDate = query({
  args: {
    date: v.string(), // "2026-05-20"
  },
  handler: async (ctx, args) => {
    await requireAuth(ctx);

    const sessions = await ctx.db
      .query("sessions")
      .withIndex("by_cancelled_and_date", (q) =>
        q.eq("cancelled", false).eq("date", args.date)
      )
      .take(20);

    return await Promise.all(sessions.map((s) => enrichSession(ctx, s)));
  },
});

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const TIME_RE = /^\d{2}:\d{2}$/;

function validateDateAndTime(date: string, time: string) {
  if (!DATE_RE.test(date)) throw new Error("Ongeldig datumformaat — verwacht JJJJ-MM-DD");
  if (!TIME_RE.test(time)) throw new Error("Ongeldig tijdformaat — verwacht UU:MM");
}

// Trainer only — create a session
export const create = mutation({
  args: {
    date: v.string(),
    time: v.string(),
    groupId: v.id("groups"),
  },
  handler: async (ctx, args) => {
    validateDateAndTime(args.date, args.time);
    const trainer = await requireTrainer(ctx);
    return await ctx.db.insert("sessions", {
      date: args.date,
      time: args.time,
      groupId: args.groupId,
      capacity: 14,
      cancelled: false,
      createdBy: trainer.tokenIdentifier,
    });
  },
});

// Trainer only — edit a session
export const update = mutation({
  args: {
    id: v.id("sessions"),
    date: v.string(),
    time: v.string(),
    groupId: v.id("groups"),
  },
  handler: async (ctx, args) => {
    validateDateAndTime(args.date, args.time);
    await requireTrainer(ctx);
    await ctx.db.patch(args.id, {
      date: args.date,
      time: args.time,
      groupId: args.groupId,
    });
  },
});

// Trainer only — create multiple sessions on the same weekday for N consecutive weeks.
// Skips any week where a session with the same date + time + group already exists.
// Returns the number of sessions actually created.
export const createBatch = mutation({
  args: {
    date: v.string(),    // start date "YYYY-MM-DD"
    time: v.string(),
    groupId: v.id("groups"),
    weeks: v.number(),   // 1–52
  },
  handler: async (ctx, args) => {
    validateDateAndTime(args.date, args.time);
    const trainer = await requireTrainer(ctx);

    if (args.weeks < 1 || args.weeks > 52) {
      throw new Error("Aantal weken moet tussen 1 en 52 liggen");
    }

    // Parse start date as UTC midnight to avoid timezone drift
    const [y, m, d] = args.date.split("-").map(Number);
    const start = Date.UTC(y, m - 1, d);
    const MS_PER_WEEK = 7 * 24 * 60 * 60 * 1000;

    let created = 0;
    for (let i = 0; i < args.weeks; i++) {
      const ts = start + i * MS_PER_WEEK;
      const dateStr = new Date(ts).toISOString().slice(0, 10);

      // Skip if a session already exists for this date + time + group
      const existing = await ctx.db
        .query("sessions")
        .withIndex("by_cancelled_and_date", (q) =>
          q.eq("cancelled", false).eq("date", dateStr)
        )
        .filter((q) =>
          q.and(
            q.eq(q.field("time"), args.time),
            q.eq(q.field("groupId"), args.groupId)
          )
        )
        .first();

      if (existing) continue;

      await ctx.db.insert("sessions", {
        date: dateStr,
        time: args.time,
        groupId: args.groupId,
        capacity: 14,
        cancelled: false,
        createdBy: trainer.tokenIdentifier,
      });
      created++;
    }

    return created;
  },
});

// Trainer only — soft delete a session
export const cancel = mutation({
  args: { id: v.id("sessions") },
  handler: async (ctx, args) => {
    await requireTrainer(ctx);
    await ctx.db.patch(args.id, { cancelled: true });
  },
});

// Internal helper — joins session with its group and attendance count
async function enrichSession(ctx: QueryCtx, session: Doc<"sessions">) {
  const group = await ctx.db.get(session.groupId);
  const coming = await ctx.db
    .query("attendance")
    .withIndex("by_session_and_status", (q) =>
      q.eq("sessionId", session._id).eq("status", "coming")
    )
    .take(15);

  return {
    ...session,
    group,
    attendanceCount: coming.length,
  };
}
