# The Jolly Gym — Project Instructions

## What This App Is

A private, mobile-friendly web app for Jolmer (personal trainer) and his ~34 clients. It replaces Trainerize + SuperSaas + WhatsApp with one tool.

**This is not a SaaS product.** It is built exclusively for one trainer and his fixed group of clients.

---

## The Two Users

**Jolmer (Trainer)**
- Plans sessions in a calendar, assigns workouts to groups
- Creates and edits workouts (exercises, sets, reps, weight)
- Sees who is coming to each session (attendance dashboard)
- Tracks progression per client in real-time
- Manages 4 groups of 4–9 clients each (~34 clients total)

**Clients (e.g. Poelie)**
- See upcoming sessions and assigned workouts on their phone
- Confirm or cancel attendance with one tap
- Log their sets, reps, and weight per exercise
- See their own progression over time

Changes made by clients (attendance, logged weights) must be visible to Jolmer instantly, and vice versa.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 15 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS |
| UI Components | shadcn/ui |
| Auth | Clerk (Jolmer = trainer role, clients invited via link) |
| Database | Convex (real-time sync between trainer and clients) |
| Animations | Framer Motion |
| Deployment | Vercel (free hobby plan) |

---

## Cost Target

**€0/month.** All services run on free tiers. Do not suggest paid services or add-ons unless absolutely necessary. At 35 users, free tier limits will never be reached.

---

## Design

- No existing branding — design will be created from scratch
- Mobile-first: both Jolmer and clients use this primarily on their phones
- Clean, simple, fast — clients are not tech-savvy
- Avoid the generic AI aesthetic (gradients, glassmorphism, floating blobs)
- Build a design system as we go — ask before introducing new colors or fonts

---

## Key Principles

- **Ask before changing the database schema** — always confirm with the developer first
- **Never delete Convex data without explicit confirmation** — destructive operations are irreversible
- **Never install an npm package without asking first** — explain what it is and why it's needed before adding it
- **Mobile-first** — every screen must work well on a phone before worrying about desktop
- **Real-time by default** — use Convex's reactive queries; never use polling
- **Keep it simple** — no feature creep; check the MVP list before adding anything new
- **Explain your decisions** — the developer is a complete beginner; briefly explain why you're doing something, not just what
- **Always test on mobile viewport** before marking a feature done

---

## MVP Build Order

1. Workout builder (exercises, sets, reps, weight)
2. Session calendar (schedule sessions, assign workouts to groups)
3. Client RSVP (attendance confirmation)
4. Attendance dashboard (Jolmer sees who's coming)
5. Progression tracking (clients log weights; Jolmer sees history)

---

## Preferred Libraries

- **Dates:** `date-fns` — not moment.js (outdated and heavy)
- **Notifications/toasts:** `sonner` (already included in shadcn)
- **File storage:** Convex built-in storage if ever needed — not S3 or external services
- **Environment variables:** `.env.local` only — never hardcode API keys in code

---

## What NOT to Build

- Reschedule requests from clients (attendance only)
- Stripe or payment features
- Nutrition tracking
- Multi-trainer support
- Anything not in the MVP list above without explicit approval

---

## Auth Model

- Jolmer has a single trainer account with full access
- Clients are invited via a link (Clerk invite flow)
- Clients only see their own data and their group's sessions
- No client can see another client's progression

---

*Built by Casper for Jolmer — Claude Code Masterclass 2026*
