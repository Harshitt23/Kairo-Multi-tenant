-- ============================================================================
-- FORCE row-level security on the tenant tables.
--
-- Postgres exempts a table's OWNER from its RLS policies unless FORCE is set.
-- Prisma connects as the owner (`pm`) in this setup, so without FORCE the
-- `tenant_isolation` policies were inert. FORCE makes them apply to the owner
-- too. This stays safe for the singleton client because the policy is
-- permissive when the `app.current_org_id` GUC is unset (app_current_org() IS
-- NULL) — normal queries are unaffected, while a query that *does* set a
-- mismatched org context is now correctly blocked at the database.
-- ============================================================================

DO $$
DECLARE
  t text;
  tenant_tables text[] := ARRAY[
    'organizations',
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
    EXECUTE format('ALTER TABLE %I FORCE ROW LEVEL SECURITY', t);
  END LOOP;
END $$;
