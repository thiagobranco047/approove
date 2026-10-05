import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";
import { CLIENT_VISIBLE_PRODUCTION_STAGE } from "@/lib/client-content-boundary";
import type { ShareAccessContext } from "@/lib/share-access";
import {
  type CreativeAttachmentSnapshot,
  type InvalidationReason,
  type PostStatusEventType,
} from "@/lib/approval-types";

export type ApprovalActorType = "agency" | "client" | "system";

export interface ApprovalActor {
  actorType: ApprovalActorType;
  actorUserId?: string | null;
  actorReviewerId?: string | null;
  actorNameSnapshot: string;
}

const snapshotInclude = {
  attachments: {
    orderBy: { order: "asc" as const },
    include: {
      versions: {
        orderBy: { version: "desc" as const },
        take: 1,
        include: {
          slides: { orderBy: { order: "asc" as const } },
        },
      },
    },
  },
} satisfies Prisma.PostItemInclude;

export function buildCreativesSnapshotFromPost(post: {
  attachments: Array<{
    id: string;
    type: string;
    label: string | null;
    versions: Array<{
      id: string;
      url: string;
      version: number;
      slides: Array<{
        id: string;
        order: number;
        url: string;
        mediaType: string;
        label: string | null;
      }>;
    }>;
  }>;
}): CreativeAttachmentSnapshot[] {
  return post.attachments.map((attachment) => {
    const version = attachment.versions[0] ?? null;
    return {
      attachmentId: attachment.id,
      type: attachment.type,
      label: attachment.label,
      versionId: version?.id ?? null,
      versionNumber: version?.version ?? null,
      url: version?.url ?? null,
      slides: (version?.slides ?? []).map((slide) => ({
        slideId: slide.id,
        order: slide.order,
        url: slide.url,
        mediaType: slide.mediaType,
        label: slide.label,
      })),
    };
  });
}

export async function loadCreativesSnapshot(postItemId: string): Promise<CreativeAttachmentSnapshot[]> {
  const post = await prisma.postItem.findUnique({
    where: { id: postItemId },
    include: snapshotInclude,
  });
  if (!post) return [];
  return buildCreativesSnapshotFromPost(post);
}

export function actorFromAuth(params: {
  isAgency: boolean;
  access: ShareAccessContext | null;
  user?: { id: string; name?: string | null; email?: string | null } | null;
}): ApprovalActor {
  if (params.isAgency) {
    return {
      actorType: "agency",
      actorUserId: params.user?.id ?? null,
      actorNameSnapshot:
        params.user?.name?.trim() || params.user?.email?.trim() || "Agência",
    };
  }

  return {
    actorType: "client",
    actorReviewerId: params.access?.reviewer?.id ?? null,
    actorNameSnapshot:
      params.access?.reviewer?.name?.trim() ||
      (params.access?.isLegacy ? "Cliente (link compartilhado)" : "Cliente"),
  };
}

export const SYSTEM_ACTOR: ApprovalActor = {
  actorType: "system",
  actorNameSnapshot: "Approove",
};

interface RecordEventInput {
  postItemId: string;
  type: PostStatusEventType;
  fromStatus?: string | null;
  toStatus?: string | null;
  actor: ApprovalActor;
  visibility?: "client" | "agency";
  invalidationReason?: InvalidationReason | null;
  copySnapshot?: string | null;
  titleSnapshot?: string | null;
  channelSnapshot?: string | null;
  scheduledAtSnapshot?: Date | null;
  creativesSnapshot?: CreativeAttachmentSnapshot[] | null;
}

export async function recordPostStatusEvent(
  input: RecordEventInput,
  tx: Prisma.TransactionClient | typeof prisma = prisma
) {
  return tx.postStatusEvent.create({
    data: {
      postItemId: input.postItemId,
      type: input.type,
      fromStatus: input.fromStatus ?? null,
      toStatus: input.toStatus ?? null,
      actorType: input.actor.actorType,
      actorUserId: input.actor.actorUserId ?? null,
      actorReviewerId: input.actor.actorReviewerId ?? null,
      actorNameSnapshot: input.actor.actorNameSnapshot,
      visibility: input.visibility ?? "client",
      invalidationReason: input.invalidationReason ?? null,
      copySnapshot: input.copySnapshot ?? null,
      titleSnapshot: input.titleSnapshot ?? null,
      channelSnapshot: input.channelSnapshot ?? null,
      scheduledAtSnapshot: input.scheduledAtSnapshot ?? null,
      creativesSnapshot: input.creativesSnapshot
        ? JSON.stringify(input.creativesSnapshot)
        : null,
    },
  });
}

export function shouldRecordSubmittedForReview(previousStage: string, nextStage: string) {
  return (
    nextStage === CLIENT_VISIBLE_PRODUCTION_STAGE &&
    previousStage !== CLIENT_VISIBLE_PRODUCTION_STAGE
  );
}

export async function recordSubmittedForReview(params: {
  postItemId: string;
  previousStage: string;
  nextStage: string;
  actor: ApprovalActor;
}) {
  if (!shouldRecordSubmittedForReview(params.previousStage, params.nextStage)) return;

  const post = await prisma.postItem.findUnique({
    where: { id: params.postItemId },
    select: { status: true },
  });

  await recordPostStatusEvent({
    postItemId: params.postItemId,
    type: "submitted_for_review",
    fromStatus: post?.status ?? null,
    toStatus: post?.status ?? null,
    actor: params.actor,
  });
}

export async function approvePost(params: {
  postId: string;
  actor: ApprovalActor;
}) {
  return prisma.$transaction(async (tx) => {
    const post = await tx.postItem.findUnique({
      where: { id: params.postId },
      include: snapshotInclude,
    });
    if (!post) return null;
    if (post.status === "approved") return post;

    const creatives = buildCreativesSnapshotFromPost(post);

    await tx.postItem.update({
      where: { id: params.postId },
      data: { status: "approved" },
    });

    await recordPostStatusEvent(
      {
        postItemId: params.postId,
        type: "approved",
        fromStatus: post.status,
        toStatus: "approved",
        actor: params.actor,
        copySnapshot: post.copyText,
        titleSnapshot: post.title,
        channelSnapshot: post.channel,
        scheduledAtSnapshot: post.scheduledAt,
        creativesSnapshot: creatives,
      },
      tx
    );

    return tx.postItem.findUnique({ where: { id: params.postId } });
  });
}

export async function requestChanges(params: {
  postId: string;
  actor: ApprovalActor;
}) {
  return prisma.$transaction(async (tx) => {
    const post = await tx.postItem.findUnique({ where: { id: params.postId } });
    if (!post) return null;
    if (post.status === "adjustments") return post;

    await tx.postItem.update({
      where: { id: params.postId },
      data: { status: "adjustments" },
    });

    await recordPostStatusEvent(
      {
        postItemId: params.postId,
        type: "changes_requested",
        fromStatus: post.status,
        toStatus: "adjustments",
        actor: params.actor,
      },
      tx
    );

    return tx.postItem.findUnique({ where: { id: params.postId } });
  });
}

export async function invalidateApprovalIfNeeded(params: {
  postId: string;
  reason: InvalidationReason;
  actor?: ApprovalActor;
}) {
  return prisma.$transaction(async (tx) => {
    const post = await tx.postItem.findUnique({ where: { id: params.postId } });
    if (!post || post.status !== "approved") return post;

    await tx.postItem.update({
      where: { id: params.postId },
      data: { status: "pending" },
    });

    await recordPostStatusEvent(
      {
        postItemId: params.postId,
        type: "approval_invalidated",
        fromStatus: "approved",
        toStatus: "pending",
        actor: params.actor ?? SYSTEM_ACTOR,
        invalidationReason: params.reason,
      },
      tx
    );

    return tx.postItem.findUnique({ where: { id: params.postId } });
  });
}

export function resolveClientStatusAction(status: string): "approve" | "request_changes" | null {
  if (status === "approved") return "approve";
  if (status === "adjustments") return "request_changes";
  return null;
}
