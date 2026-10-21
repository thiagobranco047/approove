import { prisma } from "@/lib/prisma";

/**
 * Antes de vincular o Google a uma conta existente: se a senha dessa conta foi criada
 * sem provar o e-mail, ela pode ser de um invasor que cadastrou o endereço antes da
 * vítima. A senha é removida e as sessões abertas caem; o dono real segue pelo Google.
 */
export async function secureGoogleLink(email: string) {
  const existing = await prisma.user.findUnique({ where: { email } });
  if (!existing) return;

  await prisma.user.update({
    where: { id: existing.id },
    data: existing.emailVerified
      ? {}
      : {
          emailVerified: new Date(),
          ...(existing.password && { password: null, sessionVersion: { increment: 1 } }),
        },
  });
}
