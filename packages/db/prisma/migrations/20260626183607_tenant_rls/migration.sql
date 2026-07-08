-- ============================================================================
-- Row-Level Security: defense-in-depth tenant isolation.
--
-- The application already scopes every query by organizationId at the request
-- boundary (TenantGuard). RLS is a second wall: even a missing WHERE clause or
-- a SQL-injection foothold cannot read across tenants once the connection sets
-- the org context.
--
-- Enforcement model: each policy compares the row's organizationId against the
-- session GUC `app.current_org_id`. The policy is PERMISSIVE WHEN THE GUC IS
-- UNSET so the current singleton Prisma client (which doesn't set it) keeps
-- working — isolation is governed by the app layer until a request opts in via
-- PrismaService.runWithTenant(orgId, ...), which sets the GUC for that
-- transaction and makes RLS strict.
--
-- Production hardening (documented, not enabled here to avoid a breaking role
-- swap): connect Prisma as a NON-owner role and FORCE ROW LEVEL SECURITY so the
-- GUC is mandatory and the "unset = allow" escape hatch is removed.
-- ============================================================================

-- Helper: resolve the current tenant from the session, NULL when unset.
CREATE OR REPLACE FUNCTION app_current_org() RETURNS text
  LANGUAGE sql STABLE
  AS $$ SELECT NULLIF(current_setting('app.current_org_id', true), '') $$;

DO $$
DECLARE
  t text;
  tenant_tables text[] := ARRAY[
    'memberships',
    'invites',
    'teams',
    'projects',
    'issues',
    'labels',
    'notifications',
    'audit_logs'
  ];
BEGIN
  FOREACH t IN ARRAY tenant_tables LOOP
    -- Column names are Prisma's camelCase ("organizationId"); only table names
    -- are snake_case via @@map.
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format('DROP POLICY IF EXISTS tenant_isolation ON %I', t);
    EXECUTE format(
      'CREATE POLICY tenant_isolation ON %I USING (app_current_org() IS NULL OR "organizationId" = app_current_org())',
      t
    );
  END LOOP;
END $$;

-- `organizations` keys on its own id rather than an organizationId column.
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation ON organizations;
CREATE POLICY tenant_isolation ON organizations
  USING (app_current_org() IS NULL OR id = app_current_org());
