# Kairo

**A production-shaped, multi-tenant project-management SaaS** — think Linear
or Jira, built to see what it actually takes to ship one properly.

Workspaces → teams → projects → issues. Drag-and-drop board with live sync
and presence. RBAC enforced identically on client and server. Stripe billing.
An append-only audit trail. All on a $0/month infra stack.

> [`ARCHITECTURE.md`](./ARCHITECTURE.md) — design + trade-offs.
> [`DEPLOYMENT.md`](./DEPLOYMENT.md) — free-tier production runbook.

---

## What's actually interesting here

### Tenant isolation, one choke point
A single `TenantGuard` resolves the org, checks membership, and stamps scope
onto every request. Postgres **row-level security** backs it up — a missed
`WHERE` clause still can't leak a row across tenants.

### Auth that assumes tokens get stolen
Access JWTs live in memory, never `localStorage`. Refresh tokens rotate per
use and belong to a *family* — replaying a stolen one revokes the whole
family. RBAC is one shared matrix, enforced identically server + client.

### An optimistic, real-time board
Drags compute a fractional rank between neighbors, so reordering touches
one row, not a column. React Query applies it optimistically; Socket.io
(Redis-backed) syncs every other tab instantly.

### Slow work happens off the request path
Notifications/email run through **BullMQ on Redis** — enqueue and return.
Attachments upload client → S3/R2 directly via presigned URLs.

### Billing that degrades gracefully — currently building
Stripe Checkout + signed webhooks reconcile billing state. No Stripe keys?
The app just runs everyone on FREE instead of breaking.

### Easy to skip, didn't
Append-only audit log · rate limits on auth routes · per-user notification
prefs · hashed invite tokens · Sentry error tracking · one shared
`@kairo/types` package so API and client can never drift.

### CI that actually proves it works
Every push runs lint → typecheck → tests → build against real Postgres +
Redis, then a second job runs Playwright e2e against a live server.

### A marketing site, not just an app
Landing, pricing, blog, docs, changelog, careers — built with a custom
Framer Motion system, because a SaaS needs somewhere to land first.

---

## Features

- Multi-tenant workspaces → teams → projects → issues, RBAC (4 roles)
- Real-time Kanban board — drag/drop, optimistic UI, live presence
- JWT auth with rotating refresh tokens + reuse/theft detection
- Stripe billing (Checkout + webhooks), graceful FREE-plan fallback
- Background jobs via BullMQ (notifications, email)
- S3/R2 file attachments via presigned uploads
- Comments, @mentions, labels, per-user notification prefs
- Token-based org invites
- Append-only audit trail on every mutation
- Postgres RLS as a second layer of tenant isolation
- Sentry error tracking + rate limiting on auth routes
- Full marketing site (landing, pricing, blog, docs, changelog, careers)
- CI: lint, typecheck, unit tests, Playwright e2e against live infra

---

## Stack

| Layer | Tech |
|---|---|
| Frontend | Next.js 14, TypeScript, Tailwind, React Query, Zustand, Framer Motion, dnd-kit, Radix, Socket.io client |
| Backend | NestJS, Prisma, Socket.io gateway, BullMQ, Passport/JWT |
| Data | PostgreSQL (Neon), Redis (Upstash) |
| Storage | S3-compatible (Cloudflare R2 / MinIO), presigned URLs |
| Billing | Stripe Checkout + webhooks |
| Infra | Turborepo + pnpm, Docker Compose (local), Vercel + Render (prod) |
| Testing | Jest + Vitest, Playwright e2e, GitHub Actions CI |

```
apps/
  web/    Next.js frontend — marketing site + the authenticated app
  api/    NestJS backend — REST + WebSocket gateway + queue workers
packages/
  db/     Prisma schema, migrations, seed data
  types/  Zod schemas, RBAC matrix, LexoRank, realtime event contract
```

---

## Quick start

```bash
cp .env.example .env
pnpm infra:up && pnpm install
pnpm db:generate && pnpm --filter @kairo/db migrate -- --name init && pnpm db:seed
pnpm dev   # api :4000, web :3000
```

Seed logins (org `acme`, password `password123`): `owner@acme.test`,
`alice@acme.test`, `bob@acme.test`. Sign in, open a board, drag a card, then
open a second tab and watch it sync live.

Free-tier production deploy (Vercel + Render + Neon + Upstash + R2) is
documented in [`DEPLOYMENT.md`](./DEPLOYMENT.md).

---

## Honest state of things

Not presented as finished — `ARCHITECTURE.md` tracks what's shipped vs. a
follow-up (making RLS always-on in prod, moving socket presence into Redis).


FUTURE CHANGES --
Every visitor waits for that /auth/refresh round-trip to resolve (a 401 for signed-out people) before anything renders. Combine that with your Render free tier spinning down when idle, and a recruiter clicking your GitHub link at 2am gets "Loading workspace…" for ~30–50 seconds while the API cold-starts — before they see a single pixel of marketing.

Two fixes, both worth doing:
- Don't gate public routes on the refresh. Render the landing page immediately and let the session restore happen in the background — only the authed routes need to wait.
- Add a keep-warm cron (ping /health every ~14 min) so the API is rarely cold.

SEO: Google currently sees an empty page

app/page.tsx:1 is 'use client', so your served HTML is just the splash div — I saw this in the very first curl today. All that hero copy, pricing, and FAQ is invisible to crawlers and link previews. Making the marketing page a server component (or splitting marketing from app) would fix SEO and the blank-screen problem above in one move.

Portfolio polish (cheap, high leverage)

- README has no live demo link. The only link is in GitHub's About sidebar, which people miss. Put a demo URL + the demo credentials + a screenshot or GIF of the board in the first screen of the README.
- DEPLOYMENT.md still has 9 XXXX placeholders (lines 78–131). Filling in your real URLs makes it read as a finished runbook instead of a template.

Feature depth

Your README says billing is "currently building" — finishing Stripe end-to-end (checkout → webhook → seat enforcement) is the kind of thing that separates a demo from a product. And the description promises "AI-powered" while the Assistant is fairly 

                                                                                                                         