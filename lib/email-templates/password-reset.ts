import { absoluteUrl } from "@/lib/app-url";

export interface PasswordResetEmailParams {
  name?: string | null;
  resetPath: string;
}

export function buildPasswordResetEmail(params: PasswordResetEmailParams): {
  subject: string;
  html: string;
  text: string;
} {
  const resetUrl = absoluteUrl(params.resetPath);
  const greeting = params.name ? `Olá, ${escapeHtml(params.name)}` : "Olá";

  const subject = "Approove — redefinição de senha";

  const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="utf-8" /></head>
<body style="margin:0;padding:24px;background:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <div style="max-width:520px;margin:0 auto;background:#ffffff;border-radius:12px;padding:32px;border:1px solid #e4e4e7;">
    <p style="margin:0 0 8px;font-size:12px;font-weight:600;letter-spacing:0.05em;text-transform:uppercase;color:#71717a;">Approove</p>
    <h1 style="margin:0 0 16px;font-size:22px;line-height:1.3;color:#18181b;">${greeting}</h1>
    <p style="margin:0 0 24px;color:#52525b;font-size:14px;line-height:1.5;">
      Recebemos um pedido para redefinir a senha da sua conta. Clique no botão abaixo para escolher uma nova senha. Este link expira em 1 hora.
    </p>
    <a href="${resetUrl}" style="display:inline-block;background:#18181b;color:#ffffff;text-decoration:none;font-weight:600;font-size:14px;padding:12px 20px;border-radius:8px;">
      Redefinir senha
    </a>
    <p style="margin:24px 0 0;font-size:12px;color:#a1a1aa;line-height:1.5;word-break:break-all;">
      Ou copie este link: <a href="${resetUrl}" style="color:#52525b;">${resetUrl}</a>
    </p>
    <p style="margin:16px 0 0;font-size:12px;color:#a1a1aa;line-height:1.5;">
      Se você não pediu essa redefinição, ignore este e-mail — sua senha continua a mesma.
    </p>
  </div>
</body>
</html>`;

  const text = [
    greeting,
    "",
    "Recebemos um pedido para redefinir a senha da sua conta. Use o link abaixo para escolher uma nova senha (expira em 1 hora):",
    "",
    resetUrl,
    "",
    "Se você não pediu essa redefinição, ignore este e-mail — sua senha continua a mesma.",
  ].join("\n");

  return { subject, html, text };
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
