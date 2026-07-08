-- AlterTable
ALTER TABLE "users" ADD COLUMN     "emailOnAssigned" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "emailOnComment" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "emailOnMentioned" BOOLEAN NOT NULL DEFAULT true;
