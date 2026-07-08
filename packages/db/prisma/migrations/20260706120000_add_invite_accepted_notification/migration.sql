-- Add INVITE_ACCEPTED to the NotificationType enum so that accepting an invite
-- can notify whoever sent it (see OrgsService.acceptInvite). Additive only;
-- ADD VALUE is safe inside the migration transaction on Postgres 12+ because the
-- new value is not referenced until a later statement/migration.
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'INVITE_ACCEPTED';
