import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

export type ClientInviteRole = "viewer" | "reviewer" | "approver";

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

function isTokenActive(
  expiresAt: Date | null | undefined,
  inviteStatus: string | null | undefined
): boolean {
  if (inviteStatus === "revoked") return false;
  if (expiresAt && expiresAt < new Date()) return false;
  return true;
}

/** Prefer legacy (non-invite) tokens for agency share links. */
export async function findAgencyShareToken(
  calendarVersionId: string
): Promise<string | null> {
  const tokens = await prisma.shareToken.findMany({
    where: { calendarVersionId },
    include: { invite: true },
    orderBy: { createdAt: "asc" },
  });

  const legacy = tokens.filter((t) => !t.invite);
  const pool = legacy.length > 0 ? legacy : tokens;

  for (const t of pool) {
    const expiresAt = t.invite?.expiresAt ?? t.expiresAt;
    if (isTokenActive(expiresAt, t.invite?.status)) {
      return t.token;
    }
  }

  return null;
}

export async function authorizeCalendarView(
  token: string | undefined,
  clientSlug: string,
  versionId: string
): Promise<
  | { ok: true; isAgency: boolean; access: ShareAccessContext | null; calendarVersionId: string }
  | { ok: false; error: string; status: number }
> {
  const session = await auth();
  if (session?.user?.id) {
    const membership = await prisma.membership.findFirst({
      where: { userId: session.user.id },
      orderBy: { createdAt: "asc" },
    });

    if (membership) {
      const version = await prisma.calendarVersion.findFirst({
        where: {
          version: versionId,
          client: { slug: clientSlug, organizationId: membership.organizationId },
        },
      });

      if (version) {
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
): Promise<{ ok: true; access: ShareAccessContext } | { ok: false; error: string; status: number }> {
  const shareToken = await prisma.shareToken.findUnique({
    where: { token },
    include: {
      calendarVersion: {
        include: {
          client: true,
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

  if (!shareToken) {
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
      },
    };
  }

  // Legacy token without invite — full client access
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
  | { ok: false; error: string; status: number }
> {
  const session = await auth();
  if (session?.user?.id) {
    const membership = await prisma.membership.findFirst({
      where: { userId: session.user.id },
      orderBy: { createdAt: "asc" },
    });

    if (membership) {
      const ownsCalendar = await prisma.calendarVersion.findFirst({
        where: {
          id: calendarVersionId,
          client: { organizationId: membership.organizationId },
        },
        select: { id: true },
      });

      if (ownsCalendar) {
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
