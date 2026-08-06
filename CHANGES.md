# The Jolly Gym — Change Tracker

> Single source of truth for all improvements to the live app.
> Updated at the end of every work session. Read at the start of every new session.

## How to use this file
- `[ ]` = todo
- `[~]` = in progress
- `[x]` = done, deployed to production

---

## 🔴 Bugs / Urgent (fix first — affects real users now)

- [x] **#6 — Sessie timeout** — Opgelost. Clerk gemigreerd van Development naar Production mode. App live op jollygym.nl. Auto-migratie van gebruikersdata werkt via Clerk API.

---

## 🟡 Quick Wins (low risk, fast to ship — batch these)

- [x] **#7 — Geen workout note** — Als er nog geen workout aan een sessie is toegevoegd, toon een note: "Nog geen workout toegevoegd".
- [x] **#14 — Bottom bar groter** — Onderste navigatiebar (Progressie + Agenda knoppen) iets groter en iets hoger. CSS tweak in client layout.
- [x] **#15 — Opslaan bevestiging** — Toon "Goed gedaan! 👍" bevestiging na het opslaan van een workout log.
- [x] **#9 — Push notificatie timing** — Alleen 1 dag van tevoren sturen, NIET ook 1 uur van tevoren. Beslissing vastgelegd in CLAUDE.md — geen cron gebouwd dus geen code change nodig.

---

## 🔵 Feature Changes (existing features, change behavior)

- [x] **#2 — Exercise verwijderen** — Exercise moet verwijderd kunnen worden uit een workout (in builder én in log). Builder had dit al; log nu ook — inclusief soft-delete placeholder zodat verwijderde exercises niet terugkomen.
- [x] **#5 — Niet aanwezig knop** — Altijd 2 knoppen: "Inschrijven" (toont "Ingeschreven ✓" als aangemeld) en "Niet aanwezig". Werkt op home én agenda.
- [x] **#8 — Trainer past aanwezigheid aan** — Jolmer kan aanwezigheid van klanten handmatig aanpassen. Tappable status buttons op attendance page en agenda session detail.
- [ ] **#1 — Volgorde wisselen** — Drag-to-reorder exercises tijdens workout aanmaken én tijdens loggen. Vereist een reorder UI (drag handles of up/down knoppen).
- [ ] **#3 — Exercise vervangen** — Exercise moet makkelijk vervangen kunnen worden. Controleren of huidige substitute flow goed genoeg is of verbeterd moet worden.
- [ ] **#16 — Pre-fill vorige keer** — Optie om workout log automatisch in te vullen met waarden van de vorige keer. "Laad vorige sessie" knop in WorkoutLogSheet.
- [ ] **#17 — Eerdere sessies zien** — Clients kunnen eerdere (verleden) sessies terugzien op hun agenda. Nu toont listUpcoming alleen toekomstige sessies.

---

## 🟣 Bigger Features (need more planning, build one at a time)

- [ ] **#4 — Workout aan meerdere sessies toevoegen** — Workout toevoegen aan meerdere bestaande sessies tegelijk. Multi-select sessies in de agenda, dan workout kiezen.
- [ ] **#10 — Sessie-specifieke workout aanpassen** — Jolmer kan de workout van één sessie aanpassen zonder andere sessies of de bibliotheek te raken. Override de frozen snapshot per sessie.
- [ ] **#11 — Workout dupliceren** — Workout dupliceren in de bibliotheek, daarna naam aanpassen. Eenvoudige copy+rename flow in /workouts.
- [ ] **#12 — Progressie graph** — Grafiek met gewicht en geschatte 1RM (Epley: weight × (1 + reps÷30)) per sessie over tijd. Al gepland als post-MVP feature.
- [ ] **#13 — Achievements** — Max gewicht en max volume voor een set. Al gepland als post-MVP feature.

---

## ⚫ New / Complex Features (scope separately)

- [ ] **#18 — Klant eigen workout starten** — Clients kunnen zelf een workout beginnen: een voorgemaakte van Jolmer kiezen of zelf een workout opbouwen. Grote nieuwe feature — apart plannen.

---

## Session Log

| Date | What was done | Who |
|------|--------------|-----|
| 2026-06-18 | CHANGES.md created + full list categorized | Casper + Claude |
| 2026-06-18 | #7, #14, #15 implemented | Casper + Claude |
| 2026-08-04 | Migrated auth from Clerk to Convex Auth (email OTP via Resend) | Casper + Claude |
| 2026-08-06 | Data migration: all userId fields migrated from Clerk tokenIdentifier to Convex user _id | Casper + Claude |
| 2026-08-06 | Post-migration cleanup: sign-out buttons (trainer + client nav), resend code button (sign-in), removed ensureUser calls, renamed clientTokenIdentifier→clientId, removed `as any` casts, cleaned auth.ts (throw on missing email, removed full-table scan fallback), updated schema comments, .env.local.example, OTP email now says "15 minuten geldig" | Casper + Claude |
| 2026-08-06 | Bottom bar + sign-out UX: removed sign-out from mobile bottom nav (both roles), added subtle sign-out to client /home and trainer /agenda (mobile), added confirmation dialog everywhere, enlarged client bottom bar (icons 26px, text-sm, py-5), slightly enlarged trainer bottom bar (py-5) | Casper + Claude |

---

## Notes & Decisions

- Always check with Jolmer before making UI-facing design changes
- App is live at jollygym.nl — real clients are using it
- Dutch language used throughout client-facing UI
- #6 (session timeout) — resolved by switching from Clerk to Convex Auth (1-year session / 90-day inactive timeout)
- #3 (exercise vervangen) needs code review first to assess current substitute flow
