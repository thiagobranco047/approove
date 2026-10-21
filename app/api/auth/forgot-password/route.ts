import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { createPasswordResetToken } from "@/lib/password-reset";
import { sendEmail } from "@/lib/email";
import { buildPasswordResetEmail } from "@/lib/email-templates/password-reset";
import { apiErrorResponse } from "@/lib/api-error";
import { emailSchema } from "@/lib/email-address";
import { clientIp, enforceRateLimit } from "@/lib/rate-limit";

const forgotPasswordSchema = z.object({
  email: emailSchema,
});

// Mensagem genérica sempre - evita revelar se um e-mail está cadastrado.
const GENERIC_MESSAGE =
  "Se este e-mail estiver cadastrado, enviamos um link para redefinir a senha.";

export async function POST(request: NextRequest) {
  try {
    const { email } = forgotPasswordSchema.parse(await request.json());

    await enforceRateLimit("forgotIp", clientIp(request.headers));
    await enforceRateLimit("forgotEmail", email);

    const user = await prisma.user.findUnique({ where: { email } });

    // Também vale para contas sem senha (convite, Google): definir a senha pelo
    // link do e-mail prova a posse do endereço.
    if (user) {
      const token = await createPasswordResetToken(user.id);
      const { subject, html, text } = buildPasswordResetEmail({
        name: user.name,
        resetPath: `/reset-password?token=${token}`,
      });

      await sendEmail({ to: user.email, subject, html, text });
    }

    return NextResponse.json({ message: GENERIC_MESSAGE });
  } catch (error) {
    const handled = apiErrorResponse(error);
    if (handled) return handled;
    console.error("Error requesting password reset:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
