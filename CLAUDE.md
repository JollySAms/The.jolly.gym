# The Jolly Gym — Project Instructions

## What This App Is

A private PWA (installable on phone and desktop) for Jolmer (personal trainer) and his ~34 clients. Replaces Trainerize + SuperSaas + WhatsApp with one tool. Not a SaaS product — built exclusively for one trainer and his fixed group of clients.

## The Two Users

**Jolmer (Trainer)** — plans sessions, assigns workouts to groups, tracks progression, manages 4 groups of 4–9 clients. Uses the app on phone and laptop — trainer views must work well on desktop.

**Clients (e.g. Poelie)** — home screen shows next upcoming session + assigned workout. Agenda view shows all gym sessions (all groups) and they can RSVP to any session. If a client RSVPs outside their group, that session appears on their home screen and they can log it as usual. Clients see only their own progression.

Changes (attendance, logged weights) must sync to Jolmer in real-time, and vice versa.

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 15 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS + shadcn/ui |
| Auth | Clerk (trainer role for Jolmer, clients invited via link) |
| Database | Convex (real-time sync) |
| PWA | `next-pwa` (installable, service worker) |
| Push notifications | OneSignal (free up to 10,000 subscribers) |
| Animations | Framer Motion |
| Deployment | Vercel (free hobby plan) |

## Cost Target

**€0/month.** Free tiers only. Never suggest paid add-ons — at 35 users, limits will never be reached.

## Design

- No existing branding — design created from scratch
- Client views: mobile-first. Trainer views: mobile-first but proper desktop layout (not a stretched phone screen)
- Clean, simple, fast — clients are not tech-savvy
- Avoid the generic AI aesthetic (gradients, glassmorphism, floating blobs)
- Ask before introducing new colors or fonts; document decisions below when made

**Design system:** Font: TBD · Primary colour: TBD · Border radius: TBD

## Key Principles

- **Ask before changing the database schema** — always confirm first
- **Soft-delete only** — never hard-delete Convex data; use `cancelled: true` / `archived: true` flags
- **Ask before installing any npm package** — explain what it is and why
- **Real-time by default** — Convex reactive queries only; never poll
- **No feature creep** — check the MVP list before adding anything new
- **Explain decisions** — the developer is a complete beginner; say why, not just what
- **Test on mobile viewport** before marking any feature done

## Group & Workout Structure

Sessions and workouts are assigned to a **group**, not to individuals. All clients in the group see the same workout for that session. Individual progression is tracked per client within the shared workout. Clients can RSVP to any session across all groups.

## Core Data Entities

Ask before adding, renaming, or restructuring any of these.

- **Group** — name, list of clientIds
- **Workout** — name, exercises (name, sets, reps, weight)
- **Session** — date/time, groupId, workoutId
- **Attendance** — sessionId, clientId, status (`coming` | `cancelled`)
- **WorkoutLog** — sessionId, clientId, exercises (each with: exerciseId (optional, null for client-added), name, sets, reps, weight logged). Clients can add custom exercises (no exerciseId) and override sets/reps on any exercise. Never modifies the master Workout.

## Push Notification Rules

Notifications are an **attendance prompt** ("will you attend?"), not a reminder. Send only to clients in the session's group who have no attendance record yet. Clients who answered yes or no — including voluntary cross-group RSVPs — do not receive a notification. Timing: 24h before, and again 1h before if still unanswered. Triggered via Convex `crons` + OneSignal.

## Client Home Screen

- **Home:** next upcoming session the client is attending (own group or cross-group RSVP) + assigned workout
- **Agenda:** all gym sessions across all groups — RSVP available from here
- Fallback: if no RSVP'd session exists, show the next session for their own group

## App Router Structure

- `app/(trainer)/` — calendar, workout builder, attendance dashboard, group management
- `app/(client)/` — home screen, agenda, workout log, progression
- `convex/` — all queries and mutations
- `components/` — shared UI

## MVP Build Order

1. ✅ Workout builder
2. ✅ Session calendar (assign workouts to groups)
3. ✅ Client home screen + agenda
4. ✅ Client RSVP
5. ✅ Attendance dashboard (Jolmer)
6. ✅ Progression tracking (+ search bars on progression pages)
7. ⬜ Push notifications (OneSignal + Convex crons)

**Deploy to Vercel for real-world testing** — can happen before or after push notifications.

## Future Features (post-MVP)

These are confirmed wants from Jolmer — do NOT build until the MVP list above is complete.

### Achievements
Clients can see personal bests (1RM, 5RM) per exercise, and a summary of how many PBs they hit in a session. Jolmer can also see this per client.

**Design notes for when this gets built:**
- PB detection should happen inside the `saveLog` mutation — compare the new weight against the client's history for that exercise and flag it automatically
- Will likely need either a `isPB: boolean` field on individual sets, or a separate `personalBests` table (ask before deciding)
- The `getMyProgressionForExercise` query already exists and can power the history comparison

### Progression Graph
Chart of progression over time per exercise, available on both `/progression` (client) and `/client-progress` (trainer). Two display modes:
- **Highest weight** — heaviest weight lifted in a session for that exercise
- **Calculated 1RM** — estimated one-rep max per session (formula: weight × (1 + reps/30))

**Design notes for when this gets built:**
- All data already exists in `workoutLogs` — no schema changes needed
- Will need a charting library (ask before installing)
- Toggle between the two modes within the same chart view

## Preferred Libraries

- **Dates:** `date-fns` (not moment.js)
- **Toasts:** `sonner` (included in shadcn)
- **Push:** OneSignal (not raw Web Push API, not Firebase)
- **Env vars:** `.env.local` only — never hardcode keys

## What NOT to Build

Reschedule requests · Stripe/payments · Nutrition tracking · Multi-trainer support · Reminder notifications (prompts only) · Anything outside the MVP list without explicit approval

## Auth & Permissions

- Jolmer: single trainer account, full access
- Clients: invited via Clerk link, see all sessions in agenda, only their own progression
- **Trainer-only** (clients must never access): creating/editing/deleting workout templates, creating/editing/cancelling sessions, managing groups. Clients can customize their own workout log per session (add/remove exercises, change sets/reps) — changes are personal and never affect the master workout or other clients.
- All Convex mutations for trainer actions must verify the caller has the trainer role. Never render trainer UI in client routes.

---

*Built by Casper for Jolmer — Claude Code Masterclass 2026*

<!-- convex-ai-start -->
This project uses [Convex](https://convex.dev) as its backend.

When working on Convex code, **always read `convex/_generated/ai/guidelines.md` first** for important guidelines on how to correctly use Convex APIs and patterns. The file contains rules that override what you may have learned about Convex from training data.

Convex agent skills for common tasks can be installed by running `npx convex ai-files install`.
<!-- convex-ai-end -->
