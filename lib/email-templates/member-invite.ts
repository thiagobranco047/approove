import { absoluteUrl } from "@/lib/app-url";

export interface MemberInviteEmailParams {
  memberEmail: string;
  memberName: string;
  organizationName: string;
  role: "admin" | "member";
  invitedByName?: string | null;
}

const ROLE_LABELS: Record<string, string> = {
  admin: "Administrador",
  member: "Membro",
};

export function buildMemberInviteEmail(params: MemberInviteEmailParams): {
  subject: string;
  html: string;
  text: string;
} {
  const loginUrl = absoluteUrl(`/invite?email=${encodeURIComponent(params.memberEmail)}`);
  const roleLabel = ROLE_LABELS[params.role] || "Membro";
  const inviterLine = params.invitedByName
    ? `${escapeHtml(params.invitedByName)} convidou você para fazer parte da equipe <strong>${escapeHtml(params.organizationName)}</strong> no Approove.`
    : `Você foi convidado para fazer parte da equipe <strong>${escapeHtml(params.organizationName)}</strong> no Approove.`;

  const subject = `${params.organizationName} — convite para a equipe`;

  const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="utf-8" /></head>
<body style="margin:0;padding:24px;background:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <div style="max-width:520px;margin:0 auto;background:#ffffff;border-radius:12px;padding:32px;border:1px solid #e4e4e7;">
    <p style="margin:0 0 8px;font-size:12px;font-weight:600;letter-spacing:0.05em;text-transform:uppercase;color:#71717a;">Approove</p>
    <h1 style="margin:0 0 16px;font-size:22px;line-height:1.3;color:#18181b;">Olá, ${escapeHtml(params.memberName)}</h1>
    <p style="margin:0 0 16px;color:#52525b;font-size:14px;line-height:1.5;">
      ${inviterLine}
    </p>
    <table style="width:100%;border-collapse:collapse;margin:0 0 24px;font-size:14px;">
      <tr>
        <td style="padding:8px 0;color:#71717a;vertical-align:top;">Organização</td>
        <td style="padding:8px 0;color:#18181b;font-weight:500;">${escapeHtml(params.organizationName)}</td>
      </tr>
      <tr>
        <td style="padding:8px 0;color:#71717a;vertical-align:top;">Seu papel</td>
        <td style="padding:8px 0;color:#18181b;">${escapeHtml(roleLabel)}</td>
      </tr>
    </table>
    <a href="${loginUrl}" style="display:inline-block;background:#18181b;color:#ffffff;text-decoration:none;font-weight:600;font-size:14px;padding:12px 20px;border-radius:8px;">
      Entrar com código de acesso
    </a>
    <p style="margin:24px 0 0;font-size:12px;color:#a1a1aa;line-height:1.5;word-break:break-all;">
      Ou copie este link: <a href="${loginUrl}" style="color:#52525b;">${loginUrl}</a>
    </p>
    <p style="margin:16px 0 0;font-size:12px;color:#a1a1aa;line-height:1.5;">
      Ao clicar, você receberá um código de 6 dígitos no seu e-mail para fazer login. Se você não esperava este convite, ignore este e-mail.
    </p>
  </div>
</body>
</html>`;

  const text = [
    `Olá, ${params.memberName}`,
    "",
    params.invitedByName
      ? `${params.invitedByName} convidou você para fazer parte da equipe ${params.organizationName} no Approove.`
      : `Você foi convidado para fazer parte da equipe ${params.organizationName} no Approove.`,
    "",
    `Organização: ${params.organizationName}`,
    `Papel: ${roleLabel}`,
    "",
    `Acessar: ${loginUrl}`,
    "",
    "Ao clicar, você receberá um código de 6 dígitos no seu e-mail para fazer login.",
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
