-- Additive: approval event history. Does not modify existing tables.
CREATE TABLE "PostStatusEvent" (
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

CREATE INDEX "PostStatusEvent_postItemId_createdAt_idx" ON "PostStatusEvent"("postItemId", "createdAt");
CREATE INDEX "PostStatusEvent_actorUserId_idx" ON "PostStatusEvent"("actorUserId");
CREATE INDEX "PostStatusEvent_actorReviewerId_idx" ON "PostStatusEvent"("actorReviewerId");
