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
Every tenant-scoped table carries `organizationId`. A single `TenantGuard`
resolves the org, checks membership, and stamps scope onto the request —
every service downstream just trusts it. Defense in depth underneath:
Postgres **row-level security**, `FORCE`d, keyed on `SET app.current_org_id`,
under a least-privilege DB role — a missed `WHERE` clause still can't leak data.

### Auth that assumes tokens get stolen
Short-lived access JWTs live in memory (never `localStorage`). Refresh
tokens rotate on every use, stored only as a hash, grouped into a *family* —
replaying an already-rotated token revokes the whole family. RBAC
(`OWNER > ADMIN > MEMBER > GUEST`) is one shared permission matrix consumed
by both server guards and client UI, so they can't drift.

### An optimistic, real-time board
Reordering computes a fractional rank between two neighbors (`rankBetween`),
so a drag touches one row, not a whole column. React Query applies moves
optimistically and rolls back on rejection. Socket.io fans changes out to
`org:project` rooms, scaled across nodes via the Redis adapter.

### Slow work happens off the request path
Notifications/email run through **BullMQ on Redis** — enqueue and return,
retries handled by the queue. Attachments go client → S3/R2 directly via
presigned URLs; the API only ever sees a confirmation call.

### Billing that degrades gracefully — currently building
Stripe Checkout + a signature-verified webhook reconcile a local
`Subscription` row. If Stripe isn't configured (local dev), the app doesn't
break — it just runs everyone on FREE.

### Easy to skip, didn't
Append-only audit log on every mutation · tighter rate limits on auth routes
· per-user notification prefs · hashed invite tokens · Sentry error
reporting · a shared `@kairo/types` package (Zod schemas, RBAC matrix,
realtime contract) so the API and the client can never drift on validation.

### CI that actually proves it works
Every push boots real Postgres + Redis containers, runs lint → typecheck →
unit tests → a `prisma migrate deploy` check → build, then a second job
seeds the DB, starts the API, and runs Playwright e2e against a live server
— not mocks. Green means the login-to-drag-and-drop path actually works.

### A marketing site, not just an app
Landing, pricing, blog, changelog, docs, careers, security, legal — built
alongside the product with a custom Tailwind motion system (aurora
backgrounds, card-glow, command-palette entrance) via Framer Motion, because
a SaaS people can sign up for needs somewhere to land first.

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
