import { prisma } from "@/lib/prisma";
import { randomToken, sha256 } from "@/lib/crypto-tokens";

const TOKEN_TTL_MS = 60 * 60 * 1000; // 1 hora

/** Gera o token do e-mail. Só o hash vai para o banco; links anteriores deixam de valer. */
export async function createPasswordResetToken(userId: string) {
  const token = randomToken(32);

  await prisma.$transaction([
    prisma.passwordResetToken.deleteMany({ where: { userId, usedAt: null } }),
    prisma.passwordResetToken.create({
      data: {
        tokenHash: sha256(token),
        userId,
        expiresAt: new Date(Date.now() + TOKEN_TTL_MS),
      },
    }),
  ]);

  return token;
}

export async function getValidPasswordResetToken(token: string) {
  const record = await prisma.passwordResetToken.findUnique({
    where: { tokenHash: sha256(token) },
  });

  if (!record || record.usedAt || record.expiresAt < new Date()) {
    return null;
  }

  return record;
}

/**
 * Consome o token e troca a senha de forma atômica: dois envios simultâneos do
 * mesmo link não passam. Também derruba todas as sessões abertas do usuário.
 */
export async function resetPasswordWithToken(token: string, passwordHash: string) {
  const record = await getValidPasswordResetToken(token);
  if (!record) return false;

  return prisma.$transaction(async (tx) => {
    const consumed = await tx.passwordResetToken.updateMany({
      where: { id: record.id, usedAt: null, expiresAt: { gt: new Date() } },
      data: { usedAt: new Date() },
    });
    if (consumed.count !== 1) return false;

    await tx.user.update({
      where: { id: record.userId },
      data: {
        password: passwordHash,
        // O link chegou no e-mail: a posse do endereço está provada.
        emailVerified: new Date(),
        sessionVersion: { increment: 1 },
      },
    });
    await tx.passwordResetToken.deleteMany({
      where: { userId: record.userId, usedAt: null },
    });
    return true;
  });
}
