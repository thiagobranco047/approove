import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { consumePasswordResetToken, getValidPasswordResetToken } from "@/lib/password-reset";
import { databaseUnavailableResponse, isDatabaseUnavailable } from "@/lib/api-error";

const resetPasswordSchema = z.object({
  token: z.string().min(1, "Token obrigatório"),
  password: z.string().min(6, "Senha deve ter pelo menos 6 caracteres"),
});

export async function GET(request: NextRequest) {
  try {
    const token = request.nextUrl.searchParams.get("token");

    if (!token) {
      return NextResponse.json({ valid: false }, { status: 400 });
    }

    const record = await getValidPasswordResetToken(token);
    return NextResponse.json({ valid: !!record });
  } catch (error) {
    if (isDatabaseUnavailable(error)) {
      const { json, status } = databaseUnavailableResponse();
      return NextResponse.json(json, { status });
    }
    console.error("Error validating reset token:", error);
    return NextResponse.json({ valid: false }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { token, password } = resetPasswordSchema.parse(await request.json());

    const record = await getValidPasswordResetToken(token);

    if (!record) {
      return NextResponse.json(
        { error: "Link inválido ou expirado. Solicite uma nova redefinição." },
        { status: 400 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    await prisma.user.update({
      where: { id: record.userId },
      data: { password: hashedPassword },
    });

    await consumePasswordResetToken(record.id);

    return NextResponse.json({ message: "Senha redefinida com sucesso" });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0]?.message ?? "Dados inválidos" },
        { status: 400 }
      );
    }

    if (isDatabaseUnavailable(error)) {
      const { json, status } = databaseUnavailableResponse();
      return NextResponse.json(json, { status });
    }

    console.error("Error resetting password:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
