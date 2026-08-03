# The Jolly Gym — Jolmer's Guide

This is your guide for working on the app. You don't need to understand everything — Claude handles the code. You just need to know how to have a conversation with it and how to safely deploy your changes.

---

## The one rule

**Never deploy manually. Always use git push.**

The full workflow is:
1. Tell Claude what you want to build or fix
2. Claude makes the changes
3. You run `git push` in the terminal
4. Vercel automatically deploys to the live app — done

That's it. Never run `npx convex deploy` yourself. Never click "deploy" anywhere manually. Just `git push`.

---

## Starting a work session

1. Open **Claude Code** (the terminal app)
2. Navigate to the project folder:
   ```
   cd ~/Documents/the-jolly-gym
   ```
3. Start Claude Code:
   ```
   claude
   ```
4. Start your session by telling Claude: **"Read CHANGES.md and tell me what's next"**

Claude will read the bug/feature list and suggest where to start.

---

## Ending a work session

Before closing, ask Claude: **"Update CHANGES.md with what we did today"**

This keeps the change log up to date so the next session picks up where you left off.

---

## Deploying to the live app

Once Claude has made changes and you're happy with them:

```
git add .
git commit -m "short description of what changed"
git push
```

Then go to `vercel.com` → your project → watch the build complete (takes ~2 minutes). Once it says "Ready", the live app is updated.

---

## Checking the live app vs local

- **Live app (what clients see):** `jollygym.nl`
- **Local dev (your test environment):** `localhost:3000` — run with `npm run dev` in the terminal

Changes you make locally are NOT live until you `git push`.

---

## If something breaks in production

Don't panic. Tell Claude: **"Something broke in production — [describe what's wrong]"**

Claude will diagnose and fix it. If it's urgent and you need to roll back:
- Go to `vercel.com` → your project → Deployments → click a previous working deployment → "Promote to Production"

This instantly reverts the live app to the previous version without touching code.

---

## The accounts you own

After the handover, you own all of these:

| Service | What it does | Website |
|---|---|---|
| GitHub | Stores the code | github.com |
| Vercel | Hosts the live app | vercel.com |
| Convex | The database | convex.dev |
| Clerk | User login/auth | clerk.com |
| Hostnet | jollygym.nl domain | hostnet.nl |

---

## Critical: two Convex environments

There are two separate databases — **never confuse them:**

| Name | What it is | Used by |
|---|---|---|
| `robust-hornet-740` | **PRODUCTION** — real client data | Live app (Vercel) |
| Your dev instance | **DEV** — fake test data | Local dev only |

The live app always uses `robust-hornet-740`. Your local dev uses a separate sandbox. This is why `git push` is the only safe deploy path — Vercel is configured to always deploy to the right one.

---

## The bug/feature list

Everything that needs doing is in `CHANGES.md` in this folder. Open it any time to see what's pending, in progress, or done.

Start every session by reading it. End every session by updating it.

---

## Getting help

- **Claude can't figure it out:** Ask Casper
- **Something is broken for clients right now:** Roll back in Vercel first (see above), then fix it properly
- **You're not sure if something is safe to do:** Ask before doing it

---

*Built by Casper for Jolmer — The Jolly Gym 2026*
