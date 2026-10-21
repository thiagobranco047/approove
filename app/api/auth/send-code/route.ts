import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/email";
import { buildLoginCodeEmail } from "@/lib/email-templates/login-code";
import { emailSchema } from "@/lib/email-address";
import { issueLoginCode } from "@/lib/login-code";
import { apiErrorResponse } from "@/lib/api-error";
import { clientIp, enforceRateLimit } from "@/lib/rate-limit";

const schema = z.object({
  email: emailSchema,
});

// Mesma resposta para e-mail cadastrado ou não: o endpoint não revela contas.
const GENERIC_RESPONSE = { success: true };

export async function POST(request: NextRequest) {
  try {
    const { email } = schema.parse(await request.json());

    await enforceRateLimit("sendCodeIp", clientIp(request.headers));
    await enforceRateLimit("sendCodeEmail", email);

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return NextResponse.json(GENERIC_RESPONSE);
    }

    const code = await issueLoginCode(email);

    const emailContent = buildLoginCodeEmail({
      name: user.name || email,
      code,
    });

    const result = await sendEmail({
      to: email,
      subject: emailContent.subject,
      html: emailContent.html,
      text: emailContent.text,
    });

    if (!result.ok && !result.skipped) {
      return NextResponse.json(
        { error: "Erro ao enviar o código. Tente novamente." },
        { status: 500 }
      );
    }

    return NextResponse.json(GENERIC_RESPONSE);
  } catch (error) {
    const handled = apiErrorResponse(error);
    if (handled) return handled;
    console.error("Error sending login code:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
