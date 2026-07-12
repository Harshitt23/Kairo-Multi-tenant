# Deployment runbook

Free-tier production deploy of Kairo. Everything below has a $0 tier.

| Layer | Service | Free tier reality |
|---|---|---|
| Web (Next.js) | **Vercel** | Always-on, no cold start, custom domain |
| API (NestJS) | **Render** | Sleeps after ~15 min idle, cold-starts ~30–50s on next request |
| Postgres | **Neon** | Auto-suspends when idle, resumes in ~1s; project never expires |
| Redis | **Upstash** | Serverless, TLS (`rediss://`), free command allowance |
| File storage | **Cloudflare R2** | 10 GB, no egress fees, S3-compatible |

The one non-negotiable tradeoff of the free tier: the **API cold-starts** after
idle. First request after a nap takes ~30–50s; everything after is instant until
it idles again. Paying ~$5/mo on Render (or Railway/Fly) removes this.

Deploy order matters: **DB + Redis + R2 first** (the API needs their URLs),
**then the API**, **then the web** (needs the API URL), then set the API's
`WEB_ORIGIN` back to the web URL.

---

## 1. Postgres — Neon

1. Sign up at <https://neon.tech> (GitHub login).
2. **Create project** → name `kairo`, region near you, Postgres 16.
3. Copy the **pooled** connection string from the dashboard. It looks like:
   `postgresql://USER:PASS@ep-xxx-pooler.REGION.aws.neon.tech/neondb?sslmode=require`
4. Save it — this is `DATABASE_URL`.

> Migrations create a `kairo_app` role and RLS policies. Neon's default role has the
> privileges for this. If `migrate deploy` ever fails on the `app_role`
> migration, it's non-fatal to the app (RLS is defense-in-depth) — tell me and
> I'll make it conditional.

## 2. Redis — Upstash

1. Sign up at <https://upstash.com>.
2. **Create Database** → Redis → name `kairo`, region near your Render region,
   type **Regional** (free).
3. Copy the connection string in **`rediss://…`** form (the TLS one, port 6379).
   On the DB page: *Details → "Redis" connect → `ioredis`* shows it, or copy the
   `UPSTASH_REDIS_URL`-style `rediss://default:PASSWORD@host:6379`.
4. Save it — this is `REDIS_URL`. (The API auto-enables TLS for `rediss://`.)

## 3. Object storage — Cloudflare R2

1. Sign up at <https://dash.cloudflare.com> → **R2** (needs a card on file for
   verification, but the 10 GB tier is free).
2. **Create bucket** → name `kairo-attachments`.
3. **Manage R2 API Tokens → Create API Token** → *Object Read & Write*, scoped to
   the bucket. Copy **Access Key ID** and **Secret Access Key** (shown once).
4. Note your account's **S3 API endpoint**:
   `https://<ACCOUNT_ID>.r2.cloudflarestorage.com`
5. Save these:
   - `S3_ENDPOINT` = the endpoint above
   - `S3_BUCKET` = `kairo-attachments`
   - `S3_ACCESS_KEY` = access key id
   - `S3_SECRET_KEY` = secret access key
   - `S3_REGION` = `auto`
   - `S3_FORCE_PATH_STYLE` = `true`

## 4. API — Render (via Blueprint)

The repo has `render.yaml`, so Render provisions the service for you.

1. Sign up at <https://render.com> (GitHub login) and grant access to the
   `Harshitt23/Ai-saas-multi-tenant` repo.
2. **New → Blueprint** → pick the repo → Render reads `render.yaml` and shows the
   `kairo-api` service. Apply.
3. When prompted, fill the `sync: false` env vars from steps 1–3:
   `DATABASE_URL`, `REDIS_URL`, `S3_ENDPOINT`, `S3_BUCKET`, `S3_ACCESS_KEY`,
   `S3_SECRET_KEY`. Leave `WEB_ORIGIN` as a placeholder for now (e.g.
   `https://example.com`) — we set it after the web deploys. `JWT_*` secrets are
   auto-generated; `S3_REGION=auto`, `S3_FORCE_PATH_STYLE=true` are preset.
4. Deploy. Build takes a few minutes (installs, Prisma generate, Nest build).
   The start command runs `prisma migrate deploy` automatically.
5. Once live, note the URL: `https://kairo-api-XXXX.onrender.com`. Check
   `https://kairo-api-XXXX.onrender.com/health` → `{"status":"ok","db":"up"}`.

### Seed the demo data (one time)

Render free web services have a **Shell** tab. Open it and run:

```bash
pnpm --filter @kairo/db exec tsx prisma/seed.ts
```

Demo logins (all password `password123`): `owner@acme.test`, `alice@acme.test`,
`bob@acme.test`; org slug `acme`.

## 5. Web — Vercel

1. Sign up at <https://vercel.com> (GitHub login), import the repo.
2. **Root Directory → `apps/web`** (important — it's a monorepo). Vercel detects
   Next.js + pnpm workspace automatically.
3. Environment variables:
   - `NEXT_PUBLIC_API_URL` = `https://kairo-api-XXXX.onrender.com`
   - `NEXT_PUBLIC_WS_URL` = `https://kairo-api-XXXX.onrender.com`
4. Deploy. Note the URL: `https://kairo-web-XXXX.vercel.app`.

## 6. Close the loop — CORS

1. Back in Render → `kairo-api` → Environment → set
   `WEB_ORIGIN` = `https://kairo-web-XXXX.vercel.app` (exact, no trailing slash).
2. Save → Render redeploys. Cross-origin auth cookies (`SameSite=None; Secure`)
   and the WebSocket handshake now accept the web origin.

## 7. Verify

- Open the Vercel URL → sign in as `owner@acme.test` / `password123`.
- Org list shows **Acme Inc.** → open project **Platform** → the seeded board
  loads with issues in columns.
- Drag an issue between columns — it persists (reload confirms) and, in a second
  browser tab, moves live (realtime).
- (First load after the API has been idle is slow — that's the cold start.)

---

## Env var reference

| Var | Where | Example |
|---|---|---|
| `DATABASE_URL` | Render | `postgresql://…-pooler…neon.tech/neondb?sslmode=require` |
| `REDIS_URL` | Render | `rediss://default:pw@host.upstash.io:6379` |
| `WEB_ORIGIN` | Render | `https://kairo-web-XXXX.vercel.app` |
| `S3_ENDPOINT` | Render | `https://ACCT.r2.cloudflarestorage.com` |
| `S3_BUCKET` / `S3_ACCESS_KEY` / `S3_SECRET_KEY` | Render | from R2 token |
| `S3_REGION` / `S3_FORCE_PATH_STYLE` | Render | `auto` / `true` |
| `JWT_ACCESS_SECRET` / `JWT_REFRESH_SECRET` | Render | auto-generated |
| `NEXT_PUBLIC_API_URL` / `NEXT_PUBLIC_WS_URL` | Vercel | `https://kairo-api-XXXX.onrender.com` |

## Keeping the API warm (optional)

To hide cold starts, ping `/health` every ~10 min with a free uptime monitor
(UptimeRobot, cron-job.org). Note: this keeps the free instance busy and will
consume its monthly hours faster — fine for a demo, not a substitute for a paid
always-on plan.
