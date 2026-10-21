import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";
import { z } from "zod";

/** Erro com status HTTP. Lançar em helpers; `apiErrorResponse` converte na rota. */
export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public code?: string,
    public extra?: Record<string, unknown>,
    public headers?: Record<string, string>
  ) {
    super(message);
  }
}

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
    json: { error: "Banco de dados indisponível. Tente novamente em instantes." },
    status: 503 as const,
  };
}

/** Resposta para erros conhecidos; `null` quando a rota deve tratar/logar como 500. */
export function apiErrorResponse(error: unknown): NextResponse | null {
  if (error instanceof ApiError) {
    return NextResponse.json(
      { error: error.message, ...(error.code && { code: error.code }), ...error.extra },
      { status: error.status, headers: error.headers }
    );
  }
  if (error instanceof z.ZodError) {
    return NextResponse.json(
      { error: error.issues[0]?.message ?? "Dados inválidos" },
      { status: 400 }
    );
  }
  if (error instanceof SyntaxError) {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }
  if (error instanceof Error && error.message === "Unauthorized") {
    return NextResponse.json({ error: "Faça login para continuar" }, { status: 401 });
  }
  if (error instanceof Error && error.message === "No organization") {
    return NextResponse.json(
      { error: "Nenhuma organização vinculada à sua conta" },
      { status: 403 }
    );
  }
  if (isDatabaseUnavailable(error)) {
    const { json, status } = databaseUnavailableResponse();
    return NextResponse.json(json, { status });
  }
  return null;
}
