# The Jolly Gym — Change Tracker

> Single source of truth for all improvements to the live app.
> Updated at the end of every work session. Read at the start of every new session.

## How to use this file
- `[ ]` = todo
- `[~]` = in progress
- `[x]` = done, deployed to production

---

## 🔴 Bugs / Urgent (fix first — affects real users now)

- [x] **#6 — Sessie timeout** — Opgelost. Clerk→Convex Auth migratie + cookieConfig fix. Auth cookies waren session cookies (verdwenen bij app sluiten); nu persistent 90 dagen via `cookieConfig: { maxAge }` in middleware.ts.
- [~] **#23 — Aanwezigheid niet goed aangegeven** — Mogelijk opgelost door #26 (soft-deleted records werden meegeteld). Monitoren of het nog voorkomt.
- [x] **#24 — Trainer login dev omgeving** — Opgelost. Auth account en sessies in dev wezen naar een niet-bestaande user ID. Re-linked naar het bestaande trainer record. Oorzaak: Clerk→Convex Auth migratie had het auth account gekoppeld aan een verkeerd user ID.
- [ ] **#25 — Verkeerd homescherm** — Klant Ples zag de verkeerde training op zijn homescherm: een training werd getoond terwijl hij een andere training daartussenin had. Logica voor "volgende sessie" toont mogelijk niet de juiste eerstvolgende sessie.
- [x] **#26 — RSVP faalt bij vol tellen soft-deleted records** — Klant kon zich niet inschrijven als 13de terwijl max op 14 staat. Oorzaak: capacity check telde soft-deleted attendance records mee. Nu gefilterd. Foutmelding verbeterd: "Sessie is vol. App even met de trainer."

---

## 🟡 Quick Wins (low risk, fast to ship — batch these)

- [x] **#7 — Geen workout note** — Als er nog geen workout aan een sessie is toegevoegd, toon een note: "Nog geen workout toegevoegd".
- [x] **#14 — Bottom bar groter** — Onderste navigatiebar (Progressie + Agenda knoppen) iets groter en iets hoger. CSS tweak in client layout.
- [x] **#15 — Opslaan bevestiging** — Toon "Goed gedaan! 👍" bevestiging na het opslaan van een workout log.
- [x] **#9a — Push notificatie timing** — Beslissing: alleen 1 dag van tevoren sturen, NIET ook 1 uur van tevoren. Vastgelegd in CLAUDE.md.
- [ ] **#9b — Push notificaties bouwen** — De daadwerkelijke push notificaties moeten nog gebouwd worden (OneSignal + Convex crons). Timing: 24u van tevoren. Bericht: "Klopt het dat je komt?" Alleen naar klanten zonder attendance record.

---

## 🔵 Feature Changes (existing features, change behavior)

- [x] **#2 — Exercise verwijderen** — Exercise moet verwijderd kunnen worden uit een workout (in builder én in log). Builder had dit al; log nu ook — inclusief soft-delete placeholder zodat verwijderde exercises niet terugkomen.
- [x] **#5 — Niet aanwezig knop** — Altijd 2 knoppen: "Inschrijven" (toont "Ingeschreven ✓" als aangemeld) en "Niet aanwezig". Werkt op home én agenda.
- [x] **#8 — Trainer past aanwezigheid aan** — Jolmer kan aanwezigheid van klanten handmatig aanpassen. Tappable status buttons op attendance page en agenda session detail.
- [x] **#1 — Volgorde wisselen** — Drag-to-reorder in workout builder (trainer). Drag handles met @dnd-kit. Client-side loggen nog niet (apart oppakken als gewenst).
- [ ] **#3 — Exercise vervangen** — Exercise moet makkelijk vervangen kunnen worden. Controleren of huidige substitute flow goed genoeg is of verbeterd moet worden.
- [x] **#16 — Pre-fill vorige keer** — "Laad vorige sessie" knop in WorkoutLogSheet. Vult alleen lege velden in met waarden van de vorige keer per exercise. Knop disabled na gebruik.
- [ ] **#17 — Eerdere sessies zien** — Clients kunnen eerdere (verleden) sessies terugzien op hun agenda. Nu toont listUpcoming alleen toekomstige sessies.
- [ ] **#19 — Lettertype groter** — Lettertype door de hele app heen groter maken voor betere leesbaarheid (doelgroep: boomers).
- [ ] **#20 — Bevestigingen positiever en gevarieerder** — Na het loggen van een workout moeten de bevestigingsberichten positiever zijn en variëren (niet altijd hetzelfde). Denk aan korte motiverende zinnen die boomers leuk vinden.
- [ ] **#21 — Progressie automatisch tonen** — Feedback van Poelie: je zou automatisch je progressie moeten kunnen zien. Check bij aanvang wat hier precies mee bedoeld wordt (welke data, waar tonen, welk formaat).
- [ ] **#22 — Homescherm uitbreiden** — Feedback van Poelie: op het homescherm meer tonen dan alleen de agenda. Bijvoorbeeld hoeveel sessies iemand heeft gedaan, of andere motiverende info.

---

## 🟣 Bigger Features (need more planning, build one at a time)

- [x] **#4 — Workout aan meerdere sessies toevoegen** — Checkbox in sessie-bewerken: "Pas ook toe op volgende sessies van deze groep" + aantal sessies kiezen. Alleen toekomstige sessies.
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
| 2026-08-06 | Fix #6 (again): auth cookies were session cookies — added cookieConfig maxAge 90 days to middleware so refresh tokens persist when app is closed | Casper + Claude |
| 2026-08-10 | #16 implemented: "Laad vorige sessie" button in WorkoutLogSheet. Installed GitHub CLI (`gh`). Migrated user data for Michiel (vergouwen@dkva.nl) and Sebastián (sebastian-rojas@hotmail.com) in prod. Fixed duplicate memberIds in Sterruk groep. Convex CLI ingelogd. | Jolmer + Claude |
| 2026-09-06 | Exercise rename (pencil icon). Fixed #24 in dev. #1: drag-to-reorder (@dnd-kit). #4: workout toewijzen aan meerdere sessies. #26: RSVP capacity fix (soft-deleted records). | Jolmer + Claude |

---

## Notes & Decisions

- **Convex MCP** is geïnstalleerd als MCP server in Claude Code. Draait standaard tegen dev (academic-cat-468). Prod (robust-hornet-740) is **read-only** beschikbaar — Claude kan prod data bekijken en logs lezen, maar kan niks wijzigen in prod via de MCP. Schrijven naar prod gaat altijd via git push → Vercel. Config staat in `~/.claude/settings.json` onder `mcpServers.convex`.
- Always check with Jolmer before making UI-facing design changes
- App is live at jollygym.nl — real clients are using it
- Dutch language used throughout client-facing UI
- #6 (session timeout) — resolved by switching from Clerk to Convex Auth (1-year session / 90-day inactive timeout) + setting cookieConfig.maxAge to 90 days in middleware (without this, auth cookies were session-only and got cleared on app close)
- #3 (exercise vervangen) needs code review first to assess current substitute flow
- **Sessie afsluiten:** altijd testen → commit & push → localhost stoppen → CHANGES.md updaten (inclusief starting message hieronder). Bij grotere features optioneel `/code-review` en `/qa-agent` draaien.
- **Optie: Claude Mastery Starter omgeving** — Aanname van Casper: als de the-jolly-gym folder naar binnen de Claude Mastery Starter omgeving wordt verplaatst, kun je Control+E gebruiken voor uitleg bij toestemmingsprompts en de kosten per commando zien. Niet geverifieerd — als Jolmer hier behoefte aan heeft, met Casper afstemmen.

---

## Starting Message (voor volgende sessie)

> Vorige sessie (6 sep): Exercise rename feature gebouwd en gedeployed (pencil icon in exercise picker). Bug #24 gefixt in dev (trainer login werkt nu). Convex MCP had connectieproblemen met dev — CLI werkt wel betrouwbaar.
>
> Opruimen: oude user accounts (michielvergouwen70@gmail.com, sebas.rojas.2011@gmail.com) zijn al verwijderd uit prod.
>
> Open items om op te pakken: #3 (exercise vervangen beoordelen), #17 (eerdere sessies in agenda), #25 (verkeerd homescherm). Zie de volledige lijst hierboven.
