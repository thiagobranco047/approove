import type { ClientInviteRole } from "@/lib/share-access";
import { absoluteUrl } from "@/lib/app-url";

const ROLE_LABELS: Record<ClientInviteRole, string> = {
  viewer: "Visualizador — só visualiza o calendário",
  reviewer: "Revisor — comenta e anota nas artes",
  approver: "Aprovador — comenta, anota e aprova publicações",
};

export interface ReviewerInviteEmailParams {
  reviewerName: string;
  organizationName: string;
  clientNames: string[];
  role: ClientInviteRole;
  calendarVersion: string;
  sharePath: string;
  invitedByName?: string | null;
}

export function buildReviewerInviteEmail(params: ReviewerInviteEmailParams): {
  subject: string;
  html: string;
  text: string;
} {
  const shareUrl = absoluteUrl(params.sharePath);
  const clientsLine =
    params.clientNames.length === 1
      ? params.clientNames[0]
      : params.clientNames.join(", ");
  const roleLabel = ROLE_LABELS[params.role];
  const inviterLine = params.invitedByName
    ? `<p style="margin:0 0 16px;color:#52525b;font-size:14px;line-height:1.5;">
        ${escapeHtml(params.invitedByName)} da <strong>${escapeHtml(params.organizationName)}</strong> convidou você para revisar conteúdo no Approove.
      </p>`
    : `<p style="margin:0 0 16px;color:#52525b;font-size:14px;line-height:1.5;">
        <strong>${escapeHtml(params.organizationName)}</strong> convidou você para revisar conteúdo no Approove.
      </p>`;

  const subject = `${params.organizationName} — convite para revisar ${clientsLine}`;

  const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="utf-8" /></head>
<body style="margin:0;padding:24px;background:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <div style="max-width:520px;margin:0 auto;background:#ffffff;border-radius:12px;padding:32px;border:1px solid #e4e4e7;">
    <p style="margin:0 0 8px;font-size:12px;font-weight:600;letter-spacing:0.05em;text-transform:uppercase;color:#71717a;">Approove</p>
    <h1 style="margin:0 0 16px;font-size:22px;line-height:1.3;color:#18181b;">Olá, ${escapeHtml(params.reviewerName)}</h1>
    ${inviterLine}
    <table style="width:100%;border-collapse:collapse;margin:0 0 24px;font-size:14px;">
      <tr>
        <td style="padding:8px 0;color:#71717a;vertical-align:top;">Cliente(s)</td>
        <td style="padding:8px 0;color:#18181b;font-weight:500;">${escapeHtml(clientsLine)}</td>
      </tr>
      <tr>
        <td style="padding:8px 0;color:#71717a;vertical-align:top;">Calendário</td>
        <td style="padding:8px 0;color:#18181b;">${escapeHtml(params.calendarVersion)}</td>
      </tr>
      <tr>
        <td style="padding:8px 0;color:#71717a;vertical-align:top;">Seu papel</td>
        <td style="padding:8px 0;color:#18181b;">${escapeHtml(roleLabel)}</td>
      </tr>
    </table>
    <a href="${shareUrl}" style="display:inline-block;background:#18181b;color:#ffffff;text-decoration:none;font-weight:600;font-size:14px;padding:12px 20px;border-radius:8px;">
      Abrir calendário de aprovação
    </a>
    <p style="margin:24px 0 0;font-size:12px;color:#a1a1aa;line-height:1.5;word-break:break-all;">
      Ou copie este link: <a href="${shareUrl}" style="color:#52525b;">${shareUrl}</a>
    </p>
    <p style="margin:16px 0 0;font-size:12px;color:#a1a1aa;line-height:1.5;">
      Não é necessário criar conta — o link é pessoal. Se você não esperava este convite, ignore este e-mail.
    </p>
  </div>
</body>
</html>`;

  const text = [
    `Olá, ${params.reviewerName}`,
    "",
    params.invitedByName
      ? `${params.invitedByName} da ${params.organizationName} convidou você para revisar conteúdo no Approove.`
      : `${params.organizationName} convidou você para revisar conteúdo no Approove.`,
    "",
    `Cliente(s): ${clientsLine}`,
    `Calendário: ${params.calendarVersion}`,
    `Papel: ${roleLabel}`,
    "",
    `Abrir calendário: ${shareUrl}`,
    "",
    "Não é necessário criar conta — o link é pessoal.",
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
