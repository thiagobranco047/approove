-- Security hardening (auditoria 2026-10-21).
-- Só ADD/RENAME COLUMN e índices: nenhuma tabela é recriada, então nenhum
-- DROP TABLE pode disparar cascatas. Aplicar com:
--   npm run db:migrate:turso -- prisma/migrations/security-hardening/migration.sql

-- Sessões revogáveis e trial por usuário
ALTER TABLE "User" ADD COLUMN "sessionVersion" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "User" ADD COLUMN "trialClaimedAt" DATETIME;

-- Convites de equipe exigem aceite; membros atuais já contam como aceitos
ALTER TABLE "Membership" ADD COLUMN "acceptedAt" DATETIME;
UPDATE "Membership" SET "acceptedAt" = "createdAt" WHERE "acceptedAt" IS NULL;

-- Tipo explícito de link: token de convite sem convite passa a ser negado
ALTER TABLE "ShareToken" ADD COLUMN "kind" TEXT NOT NULL DEFAULT 'agency';
ALTER TABLE "ShareToken" ADD COLUMN "revokedAt" DATETIME;
UPDATE "ShareToken" SET "kind" = 'invite' WHERE "id" IN (SELECT "shareTokenId" FROM "ClientInvite");

-- Reset de senha passa a guardar só o hash; tokens antigos (texto puro) são descartados
DELETE FROM "PasswordResetToken";
DROP INDEX "PasswordResetToken_token_key";
ALTER TABLE "PasswordResetToken" RENAME COLUMN "token" TO "tokenHash";
CREATE UNIQUE INDEX "PasswordResetToken_tokenHash_key" ON "PasswordResetToken"("tokenHash");

-- Códigos de login com hash e contador de tentativas; códigos antigos são descartados
CREATE TABLE "LoginCode" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "codeHash" TEXT NOT NULL,
    "expiresAt" DATETIME NOT NULL,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE UNIQUE INDEX "LoginCode_email_key" ON "LoginCode"("email");
DELETE FROM "VerificationToken";

-- Rate limiting compartilhado entre instâncias
CREATE TABLE "RateLimit" (
    "key" TEXT NOT NULL PRIMARY KEY,
    "count" INTEGER NOT NULL,
    "resetAt" BIGINT NOT NULL
);

-- Quem já abriu uma agência com trial não ganha outro
UPDATE "User" SET "trialClaimedAt" = (
    SELECT MIN(COALESCE(o."trialUsedAt", o."createdAt"))
    FROM "Membership" m JOIN "Organization" o ON o."id" = m."organizationId"
    WHERE m."userId" = "User"."id" AND m."role" = 'owner'
      AND (o."trialUsedAt" IS NOT NULL OR o."trialEndsAt" IS NOT NULL)
) WHERE "trialClaimedAt" IS NULL;

-- E-mails passam a ser comparados em minúsculas. Em colisão, a linha já em
-- minúsculas mantém o e-mail e a outra fica como está.
UPDATE "User" SET "email" = lower(trim("email"))
WHERE "email" <> lower(trim("email"))
  AND NOT EXISTS (SELECT 1 FROM "User" u2 WHERE u2."email" = lower(trim("User"."email")));
