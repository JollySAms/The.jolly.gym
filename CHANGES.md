# The Jolly Gym — Change Tracker

> Single source of truth for all improvements to the live app.
> Updated at the end of every work session. Read at the start of every new session.

## How to use this file
- `[ ]` = todo
- `[~]` = in progress
- `[x]` = done, deployed to production

---

## 🔴 Bugs / Urgent (fix first — affects real users now)

- [ ] **#6 — Sessie timeout** — Na een tijdje wordt je uitgelogd, moet altijd ingelogd blijven. Fix via Clerk session settings (extend session lifetime). No code change needed.

---

## 🟡 Quick Wins (low risk, fast to ship — batch these)

- [x] **#7 — Geen workout note** — Als er nog geen workout aan een sessie is toegevoegd, toon een note: "Nog geen workout toegevoegd".
- [x] **#14 — Bottom bar groter** — Onderste navigatiebar (Progressie + Agenda knoppen) iets groter en iets hoger. CSS tweak in client layout.
- [x] **#15 — Opslaan bevestiging** — Toon "Goed gedaan! 👍" bevestiging na het opslaan van een workout log.
- [ ] **#9 — Push notificatie timing** — Alleen 1 dag van tevoren sturen, NIET ook 1 uur van tevoren. Aanpassen in Convex cron.

---

## 🔵 Feature Changes (existing features, change behavior)

- [ ] **#2 — Exercise verwijderen** — Exercise moet verwijderd kunnen worden uit een workout (in builder én in log).
- [ ] **#5 — Niet aanwezig knop** — Naast inschrijven ook een "Niet aanwezig" knop voor clients. Attendance status uitbreiden.
- [ ] **#8 — Trainer past aanwezigheid aan** — Jolmer kan aanwezigheid van klanten handmatig aanpassen (aanwezig/afwezig zetten).
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

---

## Notes & Decisions

- Always check with Jolmer before making UI-facing design changes
- App is live at the-jolly-gym.vercel.app — real clients are using it
- Dutch language used throughout client-facing UI
- #6 (session timeout) is purely a Clerk dashboard setting — no code needed
- #3 (exercise vervangen) needs code review first to assess current substitute flow
