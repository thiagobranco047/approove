import { prisma } from "@/lib/prisma";
import { generateLoginCode, safeEqual, sha256 } from "@/lib/crypto-tokens";

const CODE_TTL_MS = 10 * 60 * 1000;
export const MAX_CODE_ATTEMPTS = 5;

/** Cria (ou substitui) o código do e-mail. Só o hash é salvo. */
export async function issueLoginCode(email: string) {
  const code = generateLoginCode();
  const data = {
    codeHash: sha256(code),
    expiresAt: new Date(Date.now() + CODE_TTL_MS),
    attempts: 0,
  };

  await prisma.loginCode.upsert({
    where: { email },
    create: { email, ...data },
    update: data,
  });

  return code;
}

/**
 * Valida e consome o código. Cada erro conta uma tentativa; na quinta o código
 * é apagado, então adivinhar 6 dígitos deixa de ser viável.
 */
export async function consumeLoginCode(email: string, code: string) {
  const record = await prisma.loginCode.findUnique({ where: { email } });
  if (!record) return false;

  if (record.expiresAt < new Date() || record.attempts >= MAX_CODE_ATTEMPTS) {
    await prisma.loginCode.deleteMany({ where: { id: record.id } });
    return false;
  }

  if (!safeEqual(record.codeHash, sha256(code))) {
    // Incremento condicional: requisições paralelas não passam do limite.
    await prisma.loginCode.updateMany({
      where: { id: record.id, attempts: { lt: MAX_CODE_ATTEMPTS } },
      data: { attempts: { increment: 1 } },
    });
    await prisma.loginCode.deleteMany({
      where: { id: record.id, attempts: { gte: MAX_CODE_ATTEMPTS } },
    });
    return false;
  }

  // Só um consumidor vence a corrida pelo delete.
  const consumed = await prisma.loginCode.deleteMany({
    where: { id: record.id, attempts: { lt: MAX_CODE_ATTEMPTS } },
  });
  return consumed.count === 1;
}
