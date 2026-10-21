import { PrismaClient } from "@prisma/client";
import { PrismaLibSQL } from "@prisma/adapter-libsql";
import { createClient } from "@libsql/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

/**
 * Fora de produção, um banco remoto (libsql://) só é usado com ALLOW_REMOTE_DB=1.
 * Assim `npm run dev`, testes e seed nunca escrevem no Turso de produção por acidente.
 */
export function resolveDatabaseUrl(env: Record<string, string | undefined> = process.env) {
  const url =
    env.TURSO_DATABASE_URL && env.TURSO_DATABASE_URL.length > 0
      ? env.TURSO_DATABASE_URL
      : env.DATABASE_URL?.startsWith("libsql://")
        ? env.DATABASE_URL
        : undefined;

  if (!url) return undefined;

  const isRemote = !url.startsWith("file:");
  if (isRemote && env.NODE_ENV !== "production" && env.ALLOW_REMOTE_DB !== "1") {
    throw new Error(
      `Banco remoto (${url.split("?")[0]}) bloqueado fora de produção. ` +
        "Use um SQLite local (npm run db:local:reset) ou defina ALLOW_REMOTE_DB=1 conscientemente."
    );
  }

  return url;
}

function createPrismaClient(): PrismaClient {
  const url = resolveDatabaseUrl();

  if (url) {
    const libsql = createClient({
      url,
      authToken: process.env.TURSO_AUTH_TOKEN,
    });
    const adapter = new PrismaLibSQL(libsql);
    return new PrismaClient({ adapter });
  }

  return new PrismaClient();
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
