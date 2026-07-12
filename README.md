# Kairo — Multi-Tenant Project Management

A production-shaped, multi-tenant project-management app (Linear/Jira-lite):
workspaces → teams → projects → issues, RBAC, a real-time drag-and-drop board
with live presence, queue-backed notifications, Stripe billing, and an audit
trail.

> Read [`ARCHITECTURE.md`](./ARCHITECTURE.md) for the design and trade-offs.

## Stack

| Layer | Tech |
|---|---|
| Frontend | Next.js (App Router), TypeScript, Tailwind, React Query, dnd-kit, Socket.io client |
| Backend | NestJS, Prisma, Socket.io gateway, BullMQ |
| Data | PostgreSQL, Redis | 
| Auth | JWT access + rotating refresh tokens, RBAC |
| Storage | S3 / MinIO (presigned URLs) |
| Infra | Turborepo + pnpm, Docker Compose, GitHub Actions |

## Layout

```
apps/
  web/    Next.js frontend
  api/    NestJS backend (REST + WebSocket + workers)
packages/
  db/     Prisma schema, client, migrations, seed
  types/  Zod schemas, RBAC matrix, LexoRank, realtime contract
```

## Quick start

```bash
# 0. prerequisites: Node 20+, pnpm, Docker
cp .env.example .env

# 1. infra (postgres, redis, minio + bucket)
pnpm infra:up

# 2. install
pnpm install

# 3. database: generate client + apply schema + seed demo data
pnpm db:generate
pnpm --filter @kairo/db migrate -- --name init
pnpm db:seed

# 4. run everything (api on :4000, web on :3000)
pnpm dev
```

Seed logins (org slug `acme`): `owner@acme.test`, `alice@acme.test`,
`bob@acme.test` — all password `password123`.

Then open http://localhost:3000, sign in, open the **acme → PM → Board**, and
drag cards. Open a second browser to see live sync + presence.

## Useful scripts

| Command | What |
|---|---|
| `pnpm dev` | Run web + api (+ package watchers) via Turbo |
| `pnpm build` | Build all packages and apps |
| `pnpm typecheck` | Type-check the whole monorepo |
| `pnpm test` | Run unit tests |
| `pnpm db:studio` | Prisma Studio |
| `pnpm db:seed` | Re-seed demo data |
| `pnpm infra:down` | Stop Docker services |

## API surface (selected)

```
POST   /api/auth/register | login | refresh | logout      (public)
GET    /api/auth/me
GET    /api/orgs                                           list my orgs
POST   /api/orgs                                           create org (tenant)
GET    /api/orgs/:slug/members
POST   /api/orgs/:slug/members                             member:invite
GET    /api/orgs/:slug/projects
POST   /api/orgs/:slug/projects                            project:create
GET    /api/orgs/:slug/projects/:key/issues               board / filters
POST   /api/orgs/:slug/projects/:key/issues               issue:create
PATCH  /api/orgs/:slug/projects/:key/issues/:id/move      drag/drop reorder
POST   /api/orgs/:slug/billing/checkout                   org:manage_billing
POST   /api/billing/webhook                               Stripe (public, signed)
GET    /health
```

