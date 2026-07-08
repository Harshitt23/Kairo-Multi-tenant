-- ============================================================================
-- Non-superuser application role for RLS enforcement.
--
-- RLS is bypassed by superusers and (without FORCE) by table owners. Migrations
-- run as the owner/superuser, but the *running app* should connect as a least-
-- privilege role that is subject to RLS. This migration creates `pm_app`:
--   * NOSUPERUSER NOBYPASSRLS  -> RLS policies apply to it
--   * CRUD on all tables + sequence usage -> the app can still function
--
-- To activate in any environment, point the app's DATABASE_URL at pm_app while
-- keeping migrations on the owner connection, e.g.:
--   DATABASE_URL="postgresql://pm_app:PmApp_Str0ng!2026@localhost:5433/pm?schema=public"
-- (Managed Postgres such as Neon enforces a password-strength policy on
-- CREATE ROLE, so the literal below is intentionally non-trivial.)
-- Then queries wrapped in PrismaService.runWithTenant(orgId, ...) are strictly
-- scoped at the database; unscoped queries remain permitted (permissive-unset).
-- ============================================================================

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'pm_app') THEN
    CREATE ROLE pm_app LOGIN PASSWORD 'PmApp_Str0ng!2026' NOSUPERUSER NOBYPASSRLS NOCREATEDB NOCREATEROLE;
  END IF;
END $$;

GRANT USAGE ON SCHEMA public TO pm_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO pm_app;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO pm_app;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO pm_app;

-- Apply the same grants to objects created by future migrations.
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO pm_app;
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT USAGE, SELECT ON SEQUENCES TO pm_app;
