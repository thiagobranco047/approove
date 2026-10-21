import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { getUserOrganization } from "@/lib/auth";
import { ensureProductAccess } from "@/lib/stripe-sync";
import {
  WORKSPACE_UNAVAILABLE_CODE,
  WORKSPACE_UNAVAILABLE_MESSAGE,
} from "@/lib/workspace-unavailable";

export type ClientInviteRole = "viewer" | "reviewer" | "approver";

function workspaceUnavailable() {
  return {
    ok: false as const,
    error: WORKSPACE_UNAVAILABLE_MESSAGE,
    status: 403,
    code: WORKSPACE_UNAVAILABLE_CODE,
  };
}

export interface ShareAccessContext {
  shareTokenId: string;
  calendarVersionId: string;
  clientId: string;
  clientSlug: string;
  calendarVersion: string;
  reviewer: {
    id: string;
    name: string;
    email: string;
    role: ClientInviteRole;
  } | null;
  permissions: {
    canComment: boolean;
    canPin: boolean;
    canApprove: boolean;
  };
  /** Link da agência (kind "agency"), sem revisor nomeado: permissões de aprovador. */
  isLegacy: boolean;
}

export function rolePermissions(role: ClientInviteRole) {
  switch (role) {
    case "viewer":
      return { canComment: false, canPin: false, canApprove: false };
    case "reviewer":
      return { canComment: true, canPin: true, canApprove: false };
    case "approver":
    default:
      return { canComment: true, canPin: true, canApprove: true };
  }
}

/** Link da agência mais recente e ativo. Links de revisor nunca entram aqui. */
export async function findAgencyShareToken(
  calendarVersionId: string
): Promise<string | null> {
  const token = await prisma.shareToken.findFirst({
    where: {
      calendarVersionId,
      kind: "agency",
      revokedAt: null,
      OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
    },
    orderBy: { createdAt: "desc" },
    select: { token: true },
  });

  return token?.token ?? null;
}

export async function authorizeCalendarView(
  token: string | undefined,
  clientSlug: string,
  versionId: string
): Promise<
  | { ok: true; isAgency: boolean; access: ShareAccessContext | null; calendarVersionId: string }
  | { ok: false; error: string; status: number; code?: string }
> {
  const session = await auth();
  if (session?.user?.id) {
    const membership = await getUserOrganization(session.user.id);

    if (membership) {
      const version = await prisma.calendarVersion.findFirst({
        where: {
          version: versionId,
          client: { slug: clientSlug, organizationId: membership.organizationId },
        },
      });

      if (version) {
        if (!(await ensureProductAccess(membership.organization))) {
          return workspaceUnavailable();
        }
        return {
          ok: true,
          isAgency: true,
          access: null,
          calendarVersionId: version.id,
        };
      }
    }
  }

  if (!token) {
    return { ok: false, error: "Token necessário", status: 401 };
  }

  const result = await validateShareToken(token, { clientSlug, versionId });
  if (!result.ok) {
    return result;
  }

  return {
    ok: true,
    isAgency: false,
    access: result.access,
    calendarVersionId: result.access.calendarVersionId,
  };
}

export async function validateShareToken(
  token: string,
  options?: { clientSlug?: string; versionId?: string }
): Promise<
  | { ok: true; access: ShareAccessContext }
  | { ok: false; error: string; status: number; code?: string }
> {
  const shareToken = await prisma.shareToken.findUnique({
    where: { token },
    include: {
      calendarVersion: {
        include: {
          client: { include: { organization: true } },
        },
      },
      invite: {
        include: {
          reviewer: {
            include: {
              clientLinks: true,
            },
          },
        },
      },
    },
  });

  if (!shareToken || shareToken.revokedAt) {
    return { ok: false, error: "Token inválido", status: 401 };
  }

  // Link de revisor sem convite (revisor removido) nunca vira link anônimo de aprovador.
  if (shareToken.kind !== "agency" && !shareToken.invite) {
    return { ok: false, error: "Token inválido", status: 401 };
  }

  const expiresAt = shareToken.invite?.expiresAt ?? shareToken.expiresAt;
  if (expiresAt && expiresAt < new Date()) {
    return { ok: false, error: "Token expirado", status: 401 };
  }

  if (shareToken.invite?.status === "revoked") {
    return { ok: false, error: "Convite revogado", status: 401 };
  }

  const { calendarVersion } = shareToken;
  const client = calendarVersion.client;

  if (!(await ensureProductAccess(client.organization))) {
    return workspaceUnavailable();
  }

  if (options?.clientSlug && client.slug !== options.clientSlug) {
    return { ok: false, error: "Token não corresponde ao cliente", status: 403 };
  }

  if (options?.versionId && calendarVersion.version !== options.versionId) {
    return { ok: false, error: "Token não corresponde à versão", status: 403 };
  }

  if (shareToken.invite) {
    const { reviewer } = shareToken.invite;
    const linkedToClient = reviewer.clientLinks.some((link) => link.clientId === client.id);
    if (!linkedToClient) {
      return { ok: false, error: "Reviewer not assigned to this client", status: 403 };
    }

    const role = shareToken.invite.role as ClientInviteRole;

    return {
      ok: true,
      access: {
        shareTokenId: shareToken.id,
        calendarVersionId: calendarVersion.id,
        clientId: client.id,
        clientSlug: client.slug,
        calendarVersion: calendarVersion.version,
        reviewer: {
          id: reviewer.id,
          name: reviewer.name,
          email: reviewer.email,
          role,
        },
        permissions: rolePermissions(role),
        isLegacy: false,
      },
    };
  }

  // Link da agência - acesso de aprovador, sem revisor nomeado.
  return {
    ok: true,
    access: {
      shareTokenId: shareToken.id,
      calendarVersionId: calendarVersion.id,
      clientId: client.id,
      clientSlug: client.slug,
      calendarVersion: calendarVersion.version,
      reviewer: null,
      permissions: rolePermissions("approver"),
      isLegacy: true,
    },
  };
}

export async function touchInviteAccess(shareTokenId: string) {
  const invite = await prisma.clientInvite.findUnique({
    where: { shareTokenId },
  });
  if (!invite) return;

  await prisma.clientInvite.update({
    where: { id: invite.id },
    data: {
      lastAccessAt: new Date(),
      status: invite.status === "pending" ? "active" : invite.status,
    },
  });
}

export async function isShareTokenAuthorized(
  token: string | undefined,
  calendarVersionId: string
): Promise<boolean> {
  if (!token) return false;

  const result = await validateShareToken(token);
  if (!result.ok) return false;

  return result.access.calendarVersionId === calendarVersionId;
}

export async function authorizeShareOrSession(
  token: string | undefined,
  calendarVersionId: string
): Promise<
  | { ok: true; isAgency: boolean; access: ShareAccessContext | null }
  | { ok: false; error: string; status: number; code?: string }
> {
  const session = await auth();
  if (session?.user?.id) {
    const membership = await getUserOrganization(session.user.id);

    if (membership) {
      const ownsCalendar = await prisma.calendarVersion.findFirst({
        where: {
          id: calendarVersionId,
          client: { organizationId: membership.organizationId },
        },
        select: { id: true },
      });

      if (ownsCalendar) {
        if (!(await ensureProductAccess(membership.organization))) {
          return workspaceUnavailable();
        }
        return { ok: true, isAgency: true, access: null };
      }
    }
  }

  if (!token) {
    return { ok: false, error: "Unauthorized", status: 401 };
  }

  const result = await validateShareToken(token);
  if (!result.ok) {
    return { ok: false, error: result.error, status: result.status };
  }

  if (result.access.calendarVersionId !== calendarVersionId) {
    return { ok: false, error: "Token não corresponde ao calendário", status: 403 };
  }

  await touchInviteAccess(result.access.shareTokenId);

  return { ok: true, isAgency: false, access: result.access };
}
