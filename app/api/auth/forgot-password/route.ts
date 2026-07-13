import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { createPasswordResetToken } from "@/lib/password-reset";
import { sendEmail } from "@/lib/email";
import { buildPasswordResetEmail } from "@/lib/email-templates/password-reset";
import { databaseUnavailableResponse, isDatabaseUnavailable } from "@/lib/api-error";

const forgotPasswordSchema = z.object({
  email: z.string().email("Email inválido"),
});

// Mensagem genérica sempre — evita revelar se um e-mail está cadastrado.
const GENERIC_MESSAGE =
  "Se este e-mail estiver cadastrado, enviamos um link para redefinir a senha.";

export async function POST(request: NextRequest) {
  try {
    const { email } = forgotPasswordSchema.parse(await request.json());

    const user = await prisma.user.findUnique({ where: { email } });

    // Só faz sentido redefinir senha de contas que têm senha (credentials).
    if (user?.password) {
      const token = await createPasswordResetToken(user.id);
      const { subject, html, text } = buildPasswordResetEmail({
        name: user.name,
        resetPath: `/reset-password?token=${token}`,
      });

      await sendEmail({ to: user.email, subject, html, text });
    }

    return NextResponse.json({ message: GENERIC_MESSAGE });
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

    console.error("Error requesting password reset:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
