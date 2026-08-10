# The Jolly Gym — Developer Guide for Jolmer

This is everything you need to know to maintain, fix, and improve The Jolly Gym app on your own. Read it once, then keep it nearby.

Casper built this app with Claude Code. You will maintain and improve it the same way. You don't need to understand the code — but you do need to understand how to work with Claude effectively. That is what this guide is about.

---

## The One Rule

**Never deploy by clicking a button anywhere. Always deploy through Claude.**

When you're happy with a change, just tell Claude: **"Push this to production."** Claude will handle the git commit and push. Vercel picks it up automatically, builds the app, and deploys it to jollygym.nl. Keep vercel.com open in a tab so you can watch it happen and catch problems early.

Never click a deploy button in Vercel or Convex. Never run deploy commands yourself. Let Claude handle it.

---

## Starting a Work Session

Every single session, without exception:

1. Open Terminal
2. Run: `cd ~/Documents/the-jolly-gym && claude`
3. Say this to Claude: **"Read CHANGES.md and CLAUDE.md and tell me what's pending"**

Claude will read both files and know exactly where things stand. This one habit prevents 90% of confusion.

Ending a session:
- Say: **"Update CHANGES.md with what we did today"**
- Then say: **"Push this to production"** if any code changed

---

## How to Work With Claude

### The mindset

You are the Engineering Lead. Claude is your developer. You make decisions, Claude writes the code. You don't need to understand what the code does — but you do need to stay on top of *what* Claude is doing and *why*.

The biggest mistake Casper made was not making sure they were on the same page before Claude started building. Don't make that mistake. Before Claude writes a single line of code, make sure you both agree on exactly what is being built.

### Before Claude starts any feature or fix

Always ask these before saying "go ahead":

- "What are you going to do, step by step?"
- "What files will you change?"
- "Will this affect anything else in the app?"
- "Is there anything that could go wrong?"

If the plan makes sense, say go. If anything is unclear, ask again. This takes 2 minutes and saves hours of going in circles.

### The starting message

At the end of every session, ask Claude:

> "Write me a starting message for the next session that gives a new Claude full context on what we're building, what we just did, and what's next."

Copy that message. Use it to start your next session. This is how you keep Claude sharp across sessions — it doesn't remember previous conversations, so you give it the memory.

### Keep sessions focused

One thing per session. If you came in to fix a bug, fix the bug — don't also start a new feature. If you came in to build a feature, finish it — don't let Claude start refactoring other things along the way. Claude will sometimes suggest "while we're here, I could also..." — it's okay to say no.

### When you're going in circles

This happens. Claude thinks it fixed something, but it didn't. Then it tries again, and still doesn't fix it. Signs you're in a loop:
- Claude says "that should be fixed now" but the problem persists
- The same error keeps coming back
- You've been on the same issue for more than 30 minutes

When this happens, **stop and restart the approach**. Say:

> "Let's stop. Forget everything you tried. Explain to me in plain English what you think is causing this problem and why. Then propose a completely different approach."

This forces Claude to think from scratch instead of iterating on a broken fix. If it still can't solve it after that, try a fresh Claude session with the starting message and describe the problem from the beginning.

### Model choice matters

For anything complex — auth, database changes, major new features — use **Claude Opus** if you have the option. For small UI tweaks and bug fixes, Sonnet is fine. The Clerk to Convex Auth migration took a long time partly because of model choice. When something is complicated and important, use the best model available.

### Context window

Claude has a limited memory within a single session. When you see the context filling up (there's an indicator), start a fresh session with the starting message. Don't try to squeeze more into a session that's almost full — Claude starts making mistakes when context is high.

---

## How to Build a New Feature

1. **Start the session** — read CHANGES.md, tell Claude what you want to build
2. **Get a plan first** — "Before you write any code, describe exactly what you're going to build and how"
3. **Approve the plan** — make sure it matches what you had in mind
4. **Build one thing at a time** — Claude builds it, you test it locally
5. **Test it** — actually use the feature on localhost:3000 before pushing (see Testing section below)
6. **Push** — tell Claude "push this to production", watch Vercel, check jollygym.nl

Never push something you haven't tested locally first.

---

## How to Fix a Bug

1. **Describe the bug precisely** — "When I do X, Y happens. I expect Z to happen instead."
2. **Tell Claude where** — which page, which button, which user role (trainer or client)
3. **Ask for the diagnosis first** — "What do you think is causing this? Don't fix it yet, just explain."
4. **Approve the fix** — "Does fixing this affect anything else?"
5. **Test it** — confirm the bug is gone on localhost before pushing (see Testing section below)
6. **Push** — tell Claude "push this to production"

If something breaks in production and needs an immediate fix:
- Go to vercel.com → your project → Deployments → click the last working deployment → "Promote to Production"
- This instantly reverts the live app. Then fix it properly on localhost and push again.

---

## The Codebase — What to Be Careful About

### Things that are solid — don't touch unless you have a reason
- The auth flow (`convex/auth.ts`, `convex/ResendOTP.ts`, `middleware.ts`) — it works and it's not simple. Don't change it without a very specific reason.
- The workout snapshot system — workouts are frozen at the moment they're assigned to a session. This is intentional. Don't change how this works.
- Soft-deletes — nothing is ever permanently deleted. `cancelled`, `archived`, and `deleted` flags are used everywhere. Keep this pattern.

### Things that need care
- **Database schema** (`convex/schema.ts`) — always ask Claude before changing this. A wrong schema change can break queries on existing data. Tell Claude: "I want to add X — is this a schema change? What's the risk?"
- **The `userId` fields** — in the `attendance`, `workoutLogs`, `sessions`, and `workouts` tables, `userId` is stored as a plain string, not a typed ID. This was an intentional decision after a migration. Don't change these to `v.id("users")` without asking Claude to handle the migration properly.
- **The `EnrichedSession` type** — this TypeScript type is defined in 5 different files. If you add a new field to a session query, you may need to update all 5. Claude knows about this — just tell it you're adding a field and let it handle it.

### Two Convex databases — never confuse them
| Name | What it is | Used by |
|---|---|---|
| `robust-hornet-740` | **PRODUCTION** — real client data | jollygym.nl (via Vercel) |
| `academic-cat-468` | **DEV** — test sandbox | localhost:3000 only |

The live app always uses `robust-hornet-740`. Your local dev uses `academic-cat-468`. Telling Claude to push is the only safe path to production — Vercel is configured correctly and handles this automatically.

---

## Useful Claude Skills (Slash Commands)

Type these in Claude Code to trigger specific workflows:

| Command | When to use it |
|---|---|
| `/fix-errors` | Something is broken and you want Claude to diagnose and fix it |
| `/code-review` | Before pushing a big change — have Claude check it |
| `/debug` | When you're stuck on a bug and need a fresh approach |
| `/qa-agent` | Have Claude test the app and find bugs before your clients do |
| `/next` | Move to the next item on the todo list |
| `/progress` | See where you are in the feature backlog |

---

## The Accounts You Own

| Service | What it does | Login |
|---|---|---|
| GitHub | Stores the code | github.com — JollySAms account |
| Vercel | Hosts and deploys the app | vercel.com |
| Convex | The database | convex.dev |
| Resend | Sends login code emails | resend.com |
| Hostnet | The jollygym.nl domain | hostnet.nl |

If a client says they're not receiving their login code, check **Resend → Emails** first. It will show whether the email was delivered or bounced.

If jollygym.nl is suddenly unreachable, check Vercel first (failed build?), then Hostnet (domain expired?).

---

## The Feature & Bug List

Everything that needs doing is in `CHANGES.md` in this folder. Open it at the start of every session. Update it at the end. It is the single source of truth for what's done and what's next.

Current pending features (as of handover):
- **#1** — Drag to reorder exercises in workout builder and log
- **#3** — Exercise substitution flow review
- **#16** — Pre-fill workout log from previous session
- **#17** — Clients can see past sessions in their agenda
- **#4, #10, #11** — Bigger features, plan these separately with Claude before starting

---

## When You're Unsure

Ask yourself: **"Do I understand what Claude is about to do?"**

If no — ask Claude to explain it differently. Keep asking until you do understand. It's okay to say "explain this like I've never seen code before." Don't approve something you don't understand.

If something feels wrong — it probably is. Trust that feeling. Say "this doesn't feel right, let's step back" before Claude goes further.

If Claude seems very confident but something still doesn't work — that's the most dangerous situation. Claude can be confidently wrong. When a fix doesn't work after two attempts, stop and ask for a completely different approach.

---

## Testing Locally

Before anything goes live, test it on your own machine first. This is your safety net — changes here never affect real clients.

**Start the local app:**

Just tell Claude: **"Start the local app"** — Claude will start it in the background.

Then open your browser and go to **localhost:3000**. You'll see the app running locally with test data, completely separate from what clients see.

You can sign in with your trainer account (`jolmer@jolmer.com`) — the OTP code will arrive in your inbox as normal.

**Stop the local app when you're done:**

Tell Claude: **"Stop the local app"** — Claude will shut it down cleanly.

If you forget to stop it, it keeps running in the background but won't cause any problems. It stops automatically when you restart your Mac.

---

## Quick Reference

**Start a session:**
```
cd ~/Documents/the-jolly-gym && claude
```
Then say: *"Read CHANGES.md and CLAUDE.md and tell me what's pending"*

**Start local testing:**
Tell Claude: *"Start the local app"* — then open localhost:3000

**Stop local testing:**
Tell Claude: *"Stop the local app"*

**Deploy to production:**
Tell Claude: *"Push this to production"*

**Roll back if something breaks:**
vercel.com → Deployments → click previous working deploy → "Promote to Production"

---

*Built by Casper for Jolmer — The Jolly Gym 2026*
