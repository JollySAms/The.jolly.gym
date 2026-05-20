import { mutation, query, QueryCtx } from "./_generated/server";
import { v } from "convex/values";
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
  if (!DATE_RE.test(date)) throw new Error("Invalid date format — expected YYYY-MM-DD");
  if (!TIME_RE.test(time)) throw new Error("Invalid time format — expected HH:MM");
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

// Trainer only — soft delete a session
export const cancel = mutation({
  args: { id: v.id("sessions") },
  handler: async (ctx, args) => {
    await requireTrainer(ctx);
    await ctx.db.patch(args.id, { cancelled: true });
  },
});

// Internal helper — joins session with its group and attendance count
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function enrichSession(ctx: QueryCtx, session: any) {
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
