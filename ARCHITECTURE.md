# Architecture

A multi-tenant project-management SaaS (Linear/Jira-lite). This document records
the design and the trade-offs behind it — the kind of thing worth being able to
defend in an interview.

## 1. System shape

```
┌────────────┐     HTTPS / WS      ┌──────────────────────────┐
│  Next.js    │ ─────────────────▶ │  NestJS API               │
│  (App Router│  REST + Socket.io  │  - REST controllers       │
│   React Q.) │ ◀───────────────── │  - Socket.io gateway      │
└────────────┘   live board sync   │  - BullMQ producers       │
                                    └───────┬──────────┬────────┘
                                            │          │
                                    ┌───────▼───┐  ┌───▼─────────┐
                                    │ Postgres  │  │ Redis        │
                                    │ (Prisma)  │  │ BullMQ +     │
                                    └───────────┘  │ pub/sub      │
                                                   └───┬──────────┘
                                                ┌──────▼───────┐
                                                │ Worker        │
                                                │ (notifications│
                                                │  email)       │
                                                └──────┬───────┘
                                                ┌──────▼───────┐
                                                │ S3 / MinIO    │
                                                │ (attachments) │
                                                └──────────────┘
```

Monorepo (Turborepo + pnpm):

- `apps/web` — Next.js App Router frontend, React Query, Socket.io client, dnd-kit board.
- `apps/api` — NestJS: REST + WebSocket gateway + queue producers/worker.
- `packages/db` — Prisma schema, client, migrations, seed.
- `packages/types` — Zod DTO schemas, the RBAC matrix, the LexoRank helper, the realtime event contract. Shared by **both** apps so the client and server can never drift on validation, permissions, or socket payloads.

## 2. Multi-tenancy — the core decision

**Model:** the `Organization` is the tenant boundary. Tenant-scoped rows carry
`organizationId` (the `Issue` table denormalizes it so a single indexed column
scopes every board query).

**Isolation is enforced at the request boundary, not per-query.**
`TenantGuard` (`apps/api/src/common/guards/tenant.guard.ts`) runs after auth:
it resolves the org from `:orgSlug`/`x-org-slug`, verifies the user has a
`Membership` in *that* org, and stamps `organizationId` + `role` on the request.
Services then scope every query by `req.organizationId`. One choke point, not
isolation logic sprinkled across call sites.

**Why tenant_id scoping over schema/db-per-tenant:**

| Option | Isolation | Ops cost | Cross-tenant queries | Verdict |
|---|---|---|---|---|
| DB per tenant | Strongest | High (N migrations, N pools) | Painful | Overkill at this stage |
| Schema per tenant | Strong | Medium | Awkward | Postgres connection/`search_path` overhead |
| **Shared schema + `organizationId`** | App-enforced | Low | Trivial | **Chosen** |

**Defence in depth:** the app-level guard is the primary control; Postgres
**row-level security** keyed on a `SET app.current_org` GUC is the recommended
second layer so a missed `where` clause can't leak data. (Guard shipped; RLS
policies are a documented follow-up.)

## 3. AuthN / AuthZ

- **AuthN:** email+password (bcrypt), short-lived **access JWT** (15 min) in the
  `Authorization` header, plus a **rotating refresh token** stored only as a
  SHA-256 hash. Refresh tokens belong to a *family*; rotating one revokes the old
  and mints a successor. Presenting an already-rotated token (reuse) revokes the
  whole family — the signal of a stolen token. Refresh token rides in an
  `httpOnly` cookie scoped to `/auth`; the access token stays in memory on the
  client (XSS-safer than localStorage).
- **AuthZ:** RBAC with four tiers (OWNER > ADMIN > MEMBER > GUEST). The
  permission matrix lives in `@pm/types` and is consumed by `RbacGuard` on the
  server and the UI on the client, so they enforce identical rules.
  `@RequirePermission('issue:create')` / `@Roles('ADMIN')` decorate routes;
  the guard checks them against the resolved role.

## 4. Realtime board

- Socket.io gateway authenticates on the handshake (access JWT), then gates
  `project:join` on org membership. Clients join `org:<id>:project:<id>` rooms.
- REST mutations are the source of truth; after a successful write the service
  calls `gateway.emitToProject(...)` to fan the change out. The originating
  client already applied it optimistically, so it ignores its own echo.
- **Optimistic UI:** dnd-kit drag computes a new LexoRank locally, React Query
  patches the cache immediately, and rolls back on server rejection
  (`useMoveIssue`).
- **Ordering:** issues carry a string `rank`. Reordering computes a value
  *between* two neighbours (`rankBetween`) so a drag updates **one row** instead
  of renumbering the column. Trade-off: ranks can lengthen over many moves; a
  periodic rebalance job is the mitigation.
- **Presence** is in-memory per node. Horizontal scale needs the socket.io
  **Redis adapter** so rooms/presence span instances — noted, not yet wired.

## 5. Background jobs

Email/in-app notifications run through **BullMQ on Redis**. Mutating services
*enqueue* a job and return immediately; a worker (`NotificationsProcessor`)
persists the in-app row and (TODO) sends email, with retries + exponential
backoff. Rationale: never block a user request on third-party email latency, and
get retries/observability for free.

## 6. Validation, rate limiting, audit

- **Validation:** Zod schemas in `@pm/types`, applied via a `ZodValidationPipe`.
  One schema validates the API DTO and types the client call.
- **Rate limiting:** `@nestjs/throttler` globally, with tighter per-route limits
  on auth endpoints.
- **Audit trail:** every mutation calls `AuditService.record(...)` writing an
  append-only `AuditLog` row (actor, action, entity, metadata). Best-effort by
  default; can be written inside the mutation's transaction for hard guarantees.

## 7. Billing

Stripe Checkout for upgrades; a signature-verified webhook reconciles the local
`Subscription` row on subscription lifecycle events. The app degrades to the FREE
plan and keeps working when Stripe isn't configured (local dev).

## 8. Testing & CI

- Unit (Vitest for `@pm/types`, Jest for API guards/services), integration
  against a real Postgres+Redis in CI, e2e with Playwright (planned).
- GitHub Actions: install → lint → typecheck → unit tests → `prisma migrate`
  check → build, with Postgres/Redis service containers.

## 9. Follow-ups

Delivered after the initial build:

- **Postgres RLS** — `tenant_isolation` policies on every tenant table keyed on
  `app.current_org_id` (GUC), `FORCE`d so the owner is subject to them, plus a
  least-privilege `pm_app` role they apply to. Permissive when the GUC is unset,
  so the app keeps working; `PrismaService.runWithTenant(orgId, …)` opts a
  transaction into strict DB-level scoping. Verified: a mismatched org context
  returns zero rows as `pm_app`. (Migrations `*_tenant_rls`, `*_app_role`.)
- **socket.io Redis adapter** — `RedisIoAdapter` (installed via
  `useWebSocketAdapter`) fans board broadcasts across API instances. Presence
  rosters remain per-node (documented caveat).
- **Email + notification prefs** — `MailService` (nodemailer; console transport
  when `SMTP_URL` is empty). The notifications worker sends per type, gated by
  per-user `emailOn*` prefs (`GET/PATCH /notifications/prefs`).
- **S3 attachments** — presign → direct PUT → confirm flow under
  `/orgs/:slug/issues/:id/attachments`; private bucket with short-lived
  download URLs. Web: `uploadAttachment` + `useAttachments` hooks.
- **Playwright e2e** — auth + board specs, own CI job (boots infra, seeds,
  starts API, runs against a fresh web server).
- **Sentry** — initialized when `SENTRY_DSN` is set; `SentryExceptionFilter`
  reports 5xx and normalizes the error envelope.
- **Invite-by-email** — tokened invites (hash stored, raw token emailed) +
  `POST /invites/accept` with an email-match check.

Remaining / production hardening:

- Point the app's `DATABASE_URL` at `pm_app` and wrap mutations in
  `runWithTenant` to make RLS enforcement always-on (currently opt-in; dev runs
  as the superuser `pm`, which bypasses RLS).
- Cross-node presence (move the in-memory roster into Redis).
- Web UI surfaces for attachments/invites/prefs (API + hooks exist; no
  dedicated issue-detail modal yet).
