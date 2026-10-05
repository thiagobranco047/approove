-- Approove-owned trial end. Additive only; do not backfill dates.
ALTER TABLE "Organization" ADD COLUMN "trialEndsAt" DATETIME;
