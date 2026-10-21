-- Produção (Turso) ficou sem PasswordResetToken e PostStatusEvent: as migrações
-- deles nunca rodaram/existiram. Idempotente (IF NOT EXISTS): no-op onde já existem.
-- Aplicar antes de 20261021-2-security-hardening.

CREATE TABLE IF NOT EXISTS "PasswordResetToken" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "token" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expiresAt" DATETIME NOT NULL,
    "usedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PasswordResetToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS "PostStatusEvent" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "postItemId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "fromStatus" TEXT,
    "toStatus" TEXT,
    "actorType" TEXT NOT NULL,
    "actorUserId" TEXT,
    "actorReviewerId" TEXT,
    "actorNameSnapshot" TEXT NOT NULL,
    "visibility" TEXT NOT NULL DEFAULT 'client',
    "invalidationReason" TEXT,
    "copySnapshot" TEXT,
    "titleSnapshot" TEXT,
    "channelSnapshot" TEXT,
    "scheduledAtSnapshot" DATETIME,
    "creativesSnapshot" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PostStatusEvent_postItemId_fkey" FOREIGN KEY ("postItemId") REFERENCES "PostItem" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "PostStatusEvent_actorUserId_fkey" FOREIGN KEY ("actorUserId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "PostStatusEvent_actorReviewerId_fkey" FOREIGN KEY ("actorReviewerId") REFERENCES "ClientReviewer" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS "PasswordResetToken_token_key" ON "PasswordResetToken"("token");

CREATE INDEX IF NOT EXISTS "PasswordResetToken_userId_idx" ON "PasswordResetToken"("userId");

CREATE INDEX IF NOT EXISTS "PostStatusEvent_postItemId_createdAt_idx" ON "PostStatusEvent"("postItemId", "createdAt");

CREATE INDEX IF NOT EXISTS "PostStatusEvent_actorUserId_idx" ON "PostStatusEvent"("actorUserId");

CREATE INDEX IF NOT EXISTS "PostStatusEvent_actorReviewerId_idx" ON "PostStatusEvent"("actorReviewerId");

