import { Prisma } from "@prisma/client";

export function isDatabaseUnavailable(error: unknown): boolean {
  if (error instanceof Prisma.PrismaClientInitializationError) return true;
  if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P1001") {
    return true;
  }
  if (error instanceof Error && error.message.includes("Can't reach database")) {
    return true;
  }
  return false;
}

export function databaseUnavailableResponse() {
  return {
    json: {
      error:
        "Banco de dados indisponível. Se você usa Neon, abra o projeto no console para reativá-lo e tente novamente.",
    },
    status: 503 as const,
  };
}
