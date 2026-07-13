-- CreateTable
CREATE TABLE "Account" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,
    CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sessionToken" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expires" DATETIME NOT NULL,
    CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "VerificationToken" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "PasswordResetToken" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "token" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expiresAt" DATETIME NOT NULL,
    "usedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PasswordResetToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT,
    "email" TEXT NOT NULL,
    "emailVerified" DATETIME,
    "image" TEXT,
    "password" TEXT,
    "hasCompletedOnboarding" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Organization" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "stripeCustomerId" TEXT,
    "stripeSubscriptionId" TEXT,
    "stripePriceId" TEXT,
    "subscriptionStatus" TEXT,
    "plan" TEXT NOT NULL DEFAULT 'free',
    "currentPeriodEnd" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Membership" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'member',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Membership_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Membership_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Client" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "organizationId" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "cnpj" TEXT,
    "address" TEXT,
    "website" TEXT,
    "instagram" TEXT,
    "facebook" TEXT,
    "linkedin" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Client_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ClientReviewer" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "organizationId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ClientReviewer_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ClientReviewerClient" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "reviewerId" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ClientReviewerClient_reviewerId_fkey" FOREIGN KEY ("reviewerId") REFERENCES "ClientReviewer" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ClientReviewerClient_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "CalendarVersion" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "clientId" TEXT NOT NULL,
    "version" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "CalendarVersion_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "PostItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "calendarVersionId" TEXT NOT NULL,
    "scheduledAt" DATETIME NOT NULL,
    "channel" TEXT NOT NULL,
    "copyText" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "productionStage" TEXT NOT NULL DEFAULT 'draft_copy',
    "assigneeId" TEXT,
    "assignedAt" DATETIME,
    "assignedById" TEXT,
    "handoffNote" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "PostItem_calendarVersionId_fkey" FOREIGN KEY ("calendarVersionId") REFERENCES "CalendarVersion" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "PostItem_assigneeId_fkey" FOREIGN KEY ("assigneeId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "PostItem_assignedById_fkey" FOREIGN KEY ("assignedById") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "PostAttachment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "postItemId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "label" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PostAttachment_postItemId_fkey" FOREIGN KEY ("postItemId") REFERENCES "PostItem" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "AttachmentVersion" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "postAttachmentId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AttachmentVersion_postAttachmentId_fkey" FOREIGN KEY ("postAttachmentId") REFERENCES "PostAttachment" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "AttachmentSlide" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "attachmentVersionId" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "url" TEXT NOT NULL,
    "mediaType" TEXT NOT NULL DEFAULT 'image',
    "label" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AttachmentSlide_attachmentVersionId_fkey" FOREIGN KEY ("attachmentVersionId") REFERENCES "AttachmentVersion" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "AnnotationPin" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "attachmentVersionId" TEXT NOT NULL,
    "attachmentSlideId" TEXT,
    "xPercent" REAL NOT NULL,
    "yPercent" REAL NOT NULL,
    "text" TEXT NOT NULL,
    "author" TEXT NOT NULL,
    "authorName" TEXT,
    "reviewerId" TEXT,
    "resolved" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AnnotationPin_attachmentVersionId_fkey" FOREIGN KEY ("attachmentVersionId") REFERENCES "AttachmentVersion" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "AnnotationPin_attachmentSlideId_fkey" FOREIGN KEY ("attachmentSlideId") REFERENCES "AttachmentSlide" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "AnnotationPin_reviewerId_fkey" FOREIGN KEY ("reviewerId") REFERENCES "ClientReviewer" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Comment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "postItemId" TEXT NOT NULL,
    "author" TEXT NOT NULL,
    "authorName" TEXT,
    "reviewerId" TEXT,
    "text" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Comment_postItemId_fkey" FOREIGN KEY ("postItemId") REFERENCES "PostItem" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Comment_reviewerId_fkey" FOREIGN KEY ("reviewerId") REFERENCES "ClientReviewer" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ShareToken" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "token" TEXT NOT NULL,
    "calendarVersionId" TEXT NOT NULL,
    "expiresAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ShareToken_calendarVersionId_fkey" FOREIGN KEY ("calendarVersionId") REFERENCES "CalendarVersion" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ClientInvite" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "reviewerId" TEXT NOT NULL,
    "calendarVersionId" TEXT NOT NULL,
    "shareTokenId" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'approver',
    "status" TEXT NOT NULL DEFAULT 'active',
    "invitedByUserId" TEXT,
    "expiresAt" DATETIME,
    "lastAccessAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ClientInvite_reviewerId_fkey" FOREIGN KEY ("reviewerId") REFERENCES "ClientReviewer" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ClientInvite_calendarVersionId_fkey" FOREIGN KEY ("calendarVersionId") REFERENCES "CalendarVersion" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ClientInvite_shareTokenId_fkey" FOREIGN KEY ("shareTokenId") REFERENCES "ShareToken" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ClientInvite_invitedByUserId_fkey" FOREIGN KEY ("invitedByUserId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "Account_provider_providerAccountId_key" ON "Account"("provider", "providerAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "Session_sessionToken_key" ON "Session"("sessionToken");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_token_key" ON "VerificationToken"("token");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_identifier_token_key" ON "VerificationToken"("identifier", "token");

-- CreateIndex
CREATE UNIQUE INDEX "PasswordResetToken_token_key" ON "PasswordResetToken"("token");

-- CreateIndex
CREATE INDEX "PasswordResetToken_userId_idx" ON "PasswordResetToken"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Organization_slug_key" ON "Organization"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Organization_stripeCustomerId_key" ON "Organization"("stripeCustomerId");

-- CreateIndex
CREATE UNIQUE INDEX "Organization_stripeSubscriptionId_key" ON "Organization"("stripeSubscriptionId");

-- CreateIndex
CREATE INDEX "Membership_organizationId_idx" ON "Membership"("organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "Membership_userId_organizationId_key" ON "Membership"("userId", "organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "Client_slug_key" ON "Client"("slug");

-- CreateIndex
CREATE INDEX "Client_organizationId_idx" ON "Client"("organizationId");

-- CreateIndex
CREATE INDEX "ClientReviewer_organizationId_idx" ON "ClientReviewer"("organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "ClientReviewer_organizationId_email_key" ON "ClientReviewer"("organizationId", "email");

-- CreateIndex
CREATE INDEX "ClientReviewerClient_clientId_idx" ON "ClientReviewerClient"("clientId");

-- CreateIndex
CREATE INDEX "ClientReviewerClient_reviewerId_idx" ON "ClientReviewerClient"("reviewerId");

-- CreateIndex
CREATE UNIQUE INDEX "ClientReviewerClient_reviewerId_clientId_key" ON "ClientReviewerClient"("reviewerId", "clientId");

-- CreateIndex
CREATE UNIQUE INDEX "CalendarVersion_clientId_version_key" ON "CalendarVersion"("clientId", "version");

-- CreateIndex
CREATE INDEX "PostItem_calendarVersionId_scheduledAt_idx" ON "PostItem"("calendarVersionId", "scheduledAt");

-- CreateIndex
CREATE INDEX "PostItem_assigneeId_productionStage_idx" ON "PostItem"("assigneeId", "productionStage");

-- CreateIndex
CREATE INDEX "PostAttachment_postItemId_idx" ON "PostAttachment"("postItemId");

-- CreateIndex
CREATE INDEX "AttachmentVersion_postAttachmentId_idx" ON "AttachmentVersion"("postAttachmentId");

-- CreateIndex
CREATE UNIQUE INDEX "AttachmentVersion_postAttachmentId_version_key" ON "AttachmentVersion"("postAttachmentId", "version");

-- CreateIndex
CREATE INDEX "AttachmentSlide_attachmentVersionId_idx" ON "AttachmentSlide"("attachmentVersionId");

-- CreateIndex
CREATE UNIQUE INDEX "AttachmentSlide_attachmentVersionId_order_key" ON "AttachmentSlide"("attachmentVersionId", "order");

-- CreateIndex
CREATE INDEX "AnnotationPin_attachmentVersionId_idx" ON "AnnotationPin"("attachmentVersionId");

-- CreateIndex
CREATE INDEX "AnnotationPin_attachmentSlideId_idx" ON "AnnotationPin"("attachmentSlideId");

-- CreateIndex
CREATE INDEX "AnnotationPin_reviewerId_idx" ON "AnnotationPin"("reviewerId");

-- CreateIndex
CREATE INDEX "Comment_postItemId_createdAt_idx" ON "Comment"("postItemId", "createdAt");

-- CreateIndex
CREATE INDEX "Comment_reviewerId_idx" ON "Comment"("reviewerId");

-- CreateIndex
CREATE UNIQUE INDEX "ShareToken_token_key" ON "ShareToken"("token");

-- CreateIndex
CREATE INDEX "ShareToken_token_idx" ON "ShareToken"("token");

-- CreateIndex
CREATE UNIQUE INDEX "ClientInvite_shareTokenId_key" ON "ClientInvite"("shareTokenId");

-- CreateIndex
CREATE INDEX "ClientInvite_reviewerId_idx" ON "ClientInvite"("reviewerId");

-- CreateIndex
CREATE INDEX "ClientInvite_calendarVersionId_idx" ON "ClientInvite"("calendarVersionId");

-- CreateIndex
CREATE INDEX "ClientInvite_status_idx" ON "ClientInvite"("status");

