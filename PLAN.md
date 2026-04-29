# PLAN.md — The Jolly Gym

## Project Overview

The Jolly Gym is a private, mobile-first Progressive Web App built exclusively for Jolmer, an independent personal trainer, and his ~34 clients across 4 training groups. It replaces three disconnected tools — Trainerize (workouts), SuperSaas (scheduling), and WhatsApp (communication) — with one unified real-time app. Jolmer plans sessions, assigns workouts to groups, and tracks client progression. Clients get a clean mobile screen to confirm attendance and log their sets, reps, and weight. All changes sync instantly between trainer and clients. Target running cost: €0/month.

---

## Problem Statement

Jolmer spends significant time every week bouncing between three tools that don't talk to each other. He has to chase clients on WhatsApp to confirm attendance, has no real-time view of who's coming, and can't easily track how each client is progressing on the same group workout. His clients, meanwhile, find existing apps clunky and don't use them — they only respond to direct WhatsApp messages. The core loop of "plan workout → assign to session → client confirms → trainer sees attendance → client logs workout → trainer sees progression" does not exist in any single product today.

---

## Target Users

### Jolmer (Trainer)
- Plans 4 group sessions per week across 4 client groups
- Needs a weekly calendar overview with sessions, assigned workouts, and RSVP counts
- Needs to build and reuse workouts (exercise name, sets, reps, weight)
- Needs to see, in real-time, who is coming to each session and who is not
- Needs to track progression per client — how weight, sets, and reps change over time
- Uses app on both mobile and desktop — trainer views must work well on desktop

### Clients (e.g. Poelie)
- Attend 1–2 sessions per week, mostly non-tech-savvy
- Need a single-tap RSVP experience — "coming" or "can't make it"
- Need to see their next upcoming session and the workout on the home screen
- Need to log their sets, reps, and weight after each session
- Should be able to RSVP to any session (not just their own group)
- Must never see other clients' progression data
- Will not pay — client access must be frictionless and free

---

## Core Features

### MVP — Must Have Before Launch

1. **Workout Builder** — Jolmer creates and saves reusable workouts with exercises, sets, reps, and target weight. Exercises can be added, reordered, and edited.

2. **Session Calendar** — Jolmer schedules sessions by date/time, assigns a group and a workout to each session. Calendar view by week.

3. **Client Home Screen** — Mobile-first screen showing the client's next upcoming session and the assigned workout. Falls back to their group's next session if no RSVP exists yet.

4. **Client Agenda** — Full list of all sessions across all groups. Client can RSVP to any session from here. Cross-group RSVPs appear on the home screen.

5. **Client RSVP** — Single-tap attendance confirmation: "Coming" or "Can't Make It." Status updates in real-time on Jolmer's dashboard.

6. **Attendance Dashboard** — Jolmer sees all sessions for the current week, with a live count and list of who has confirmed, who has declined, and who has not yet responded.

7. **Progression Tracking** — Clients log sets, reps, and weight per exercise. They can add exercises (e.g. injury substitutions) or adjust sets/reps — changes apply only to their own log, never the master workout. Jolmer can view progression per client per exercise in real-time.

8. **Push Notifications** — Attendance prompt sent via OneSignal: 24h before a session (to all group members with no RSVP yet), and again 1h before if still unanswered. Not sent to clients who already responded.

### Should Have — Week 1–2 After Launch

9. **No-Show Tracking** — Jolmer can mark a client as a no-show after a session. Stored in attendance history per client.

10. **Session Notes** — Jolmer can add notes to a session (e.g. "focus on form"). Clients can log a short feedback note after completing their workout log.

### Nice to Have — Future Versions

11. **Trainerize Data Import** — One-time CSV import tool to migrate client profiles, groups, and workout history from Trainerize into Convex. Useful at launch to avoid manual re-entry for 34 clients.

12. **Progression Charts** — Visual history of weight/reps progression per exercise per client.

13. **Group Management** — Jolmer can add or remove clients from groups directly in the app.

14. **Custom Branding** — Logo, color palette, and name displayed consistently throughout the app.

---

## Technical Architecture

| Layer | Technology | Why |
|---|---|---|
| Framework | Next.js 15 (App Router) | File-based routing, server components, easy Vercel deploy |
| Language | TypeScript | Catches errors early; better for beginners long-term |
| Styling | Tailwind CSS + shadcn/ui | Fast, consistent UI without writing raw CSS |
| Auth | Clerk | Handles invite links, roles, and sessions with minimal setup |
| Database | Convex | Real-time reactive queries — no polling needed; free tier covers 35 users comfortably |
| PWA | next-pwa | Makes app installable on phone home screen |
| Push | OneSignal | Free up to 10,000 subscribers; easier than raw Web Push API |
| Animations | Framer Motion | Smooth transitions for mobile feel |
| Deployment | Vercel (Hobby) | Free, instant deploys from GitHub |

**Route structure:**
- `app/(trainer)/` — workout builder, session calendar, attendance dashboard, group management
- `app/(client)/` — home screen, agenda, workout log, progression view
- `convex/` — all database queries and mutations

**Core data entities:** Group · Workout · Session · Attendance · WorkoutLog

**Key rules:**
- Real-time by default — Convex reactive queries only, never polling
- Soft-delete only — use `cancelled: true` / `archived: true` flags, never hard-delete
- All trainer mutations must verify caller has the trainer role

---

## MVP Scope

The app is "done" for v1 when:

- Jolmer can log in and see a weekly calendar of sessions
- Jolmer can create a workout with exercises and assign it to a session
- Clients receive a push notification 24h before their session
- Clients can tap "Coming" or "Can't Make It" from the notification or the app
- Jolmer sees live RSVP status for all clients across the week
- Clients can log their sets, reps, and weight after each session
- Jolmer can view a client's progression history per exercise
- App is installable on mobile (PWA) and works on Android and iOS

**Build order:**
1. Workout builder
2. Session calendar
3. Client home screen and agenda
4. Client RSVP
5. Attendance dashboard
6. Progression tracking
7. Push notifications

---

## Out of Scope (v1)

| Not Building | Reason |
|---|---|
| Reschedule requests from clients | Adds coordination complexity; WhatsApp handles edge cases for now |
| Payments / Stripe | Jolmer invoices separately; not needed at this scale |
| Nutrition tracking | Out of Jolmer's scope as a trainer |
| Multi-trainer support | This is a private tool for one trainer |
| In-app messaging / chat | WhatsApp continues to handle direct communication |
| Waitlists or session capacity limits | Not a current pain point |
| Progression charts (visual) | Nice to have post-launch |
| Group management UI | Jolmer manages groups via admin for now |
| Custom branding | Design created from scratch, branding is post-MVP polish |

---

## Success Metrics

| Metric | Target |
|---|---|
| Jolmer stops using Trainerize and SuperSaas | Within 2 weeks of launch |
| Client RSVP rate via app (vs WhatsApp) | >80% of sessions confirmed in-app |
| Running cost | €0/month (free tiers only) |
| Client onboarding time | <2 minutes from invite link to first RSVP |
| No-show surprises | Jolmer knows attendance >1h before every session |
| Progression logged | >50% of attending clients log their workout the same day |

---

*Built by Casper for Jolmer — Claude Code Masterclass Barcelona 2026*
