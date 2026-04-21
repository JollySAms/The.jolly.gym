# Product Discovery: The.Jolly.Gym

## Should You Build This?

**Verdict: YES**

Jolmer currently juggles Trainerize, SuperSaas, and WhatsApp to manage 4 groups of clients. No single app connects workout planning, session scheduling, attendance confirmation, and progression tracking. This app replaces all three tools with one — built specifically for Jolmer and his ~34 clients.

---

## The Opportunity

**Problem:** Jolmer manages workouts, scheduling, and client communication across 3 disconnected tools (Trainerize + SuperSaas + WhatsApp), while his clients have no easy way to confirm attendance or track their own progression.

**Solution:** A private app for Jolmer and his ~34 clients where Jolmer plans sessions, assigns workouts to groups, and tracks client progression — and clients get a clean mobile view to confirm attendance and log their sets, reps, and weight. Changes sync in real-time between Jolmer and his clients.

**This is not a SaaS product.** It is a private tool built exclusively for Jolmer, with a target running cost of €0/month using free tiers (Vercel + Convex + Clerk).

---

## MVP Feature Set

### Must Have (Day 1)
1. **Workout builder** — Jolmer creates and saves reusable workouts with exercises, sets, reps, and weight
2. **Session calendar** — schedule sessions per group, assign a workout to each session
3. **Client app** — clean mobile view: upcoming session + assigned workout + RSVP button (Coming / Can't Make It)
4. **Attendance dashboard** — Jolmer sees RSVP status for all clients across the week at a glance
5. **Progression tracking** — clients log sets, reps, and weight per exercise; Jolmer sees progression per client in real-time
6. **Automated reminders** — push notification 24h and 1h before session with RSVP prompt

### Should Have (Week 1–2)
1. **No-show tracking** — Jolmer can mark no-shows; history per client
2. **Session notes** — Jolmer can add notes to sessions; clients can log feedback

### Nice to Have (Later)
1. Progression charts and history visualisation
2. Group management (add/remove clients from groups)
3. Custom branding for The Jolly Gym

---

## Cost Strategy

**Target: €0/month running costs.** This is a private app — no subscription, no per-user pricing.

| Service | Plan | Cost |
|---|---|---|
| Vercel | Hobby (free) | €0 |
| Convex | Free tier (1M calls/month, 1GB storage) | €0 |
| Clerk | Free tier (up to 10,000 MAU) | €0 |
| Next.js | Open source | €0 |
| Custom domain | Optional, ~€12/year | €1/mo |

Jolmer pays once for the build. No ongoing software costs for a private app at this scale (1 trainer + ~34 clients).

---

## Risks

1. **Client adoption** — Mitigation: Client experience must be near-zero friction; onboarding via invite link, minimal steps to RSVP and log workouts
2. **Free tier limits** — Mitigation: At 35 users, Convex and Clerk free tiers are very unlikely to be exceeded; monitor if usage grows
3. **Switching friction for Jolmer** — Mitigation: Build alongside existing tools; migrate data from Trainerize once core features are stable

---

## Competitors Analyzed
- Trainerize (market leader, most complaints)
- TrueCoach (iOS-only, no scheduling)
- PT Distinction (feature-heavy, expensive)
- Wodify (gym operators, not 1:1 trainers)
- Everfit (complex pricing, bloated)

See `competitors.md` for full analysis.

---

## Next Steps

1. Create `PLAN.md` and run `/epic-create` to turn this into an actionable development plan
2. Define auth model: Jolmer has trainer role, clients invited via link (Clerk)
3. Stack confirmed: Next.js + Convex (real-time sync) + Clerk (auth)
4. Build MVP in order: workout builder → session calendar → client RSVP → attendance dashboard → progression tracking
