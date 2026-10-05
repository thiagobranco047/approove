import { isPostVisibleToClient } from "@/lib/client-content-boundary";
import { parseCreativesSnapshot } from "@/lib/approval-types";

type CommentAuthor = "agency" | "client";

interface PinLike {
  id: string;
  xPercent: number;
  yPercent: number;
  text: string;
  author: string;
  authorName?: string | null;
  resolved: boolean;
  createdAt: Date | string;
  attachmentSlideId?: string | null;
}

interface SlideLike {
  id: string;
  order: number;
  url: string;
  mediaType?: string | null;
  label?: string | null;
  pins?: PinLike[];
}

interface VersionLike {
  id: string;
  url: string;
  version: number;
  createdAt: Date | string;
  slides?: SlideLike[];
  pins?: PinLike[];
}

interface AttachmentLike {
  id: string;
  type: string;
  label?: string | null;
  order: number;
  versions: VersionLike[];
}

interface CommentLike {
  id: string;
  author: string;
  authorName?: string | null;
  text: string;
  createdAt: Date | string;
}

interface StatusEventLike {
  id: string;
  type: string;
  fromStatus?: string | null;
  toStatus?: string | null;
  actorType: string;
  actorNameSnapshot: string;
  visibility?: string | null;
  invalidationReason?: string | null;
  copySnapshot?: string | null;
  titleSnapshot?: string | null;
  channelSnapshot?: string | null;
  scheduledAtSnapshot?: Date | string | null;
  creativesSnapshot?: string | null;
  createdAt: Date | string;
}

interface UserLike {
  id: string;
  name?: string | null;
  email?: string | null;
}

export interface SerializablePost {
  id: string;
  scheduledAt: Date | string;
  channel: string;
  title?: string | null;
  copyText: string;
  status: string;
  productionStage?: string;
  assigneeId?: string | null;
  assignedAt?: Date | string | null;
  assignedById?: string | null;
  handoffNote?: string | null;
  comments?: CommentLike[];
  attachments?: AttachmentLike[];
  statusEvents?: StatusEventLike[];
  assignee?: UserLike | null;
  assignedBy?: UserLike | null;
}

function toIso(value: Date | string): string {
  return value instanceof Date ? value.toISOString() : value;
}

function serializePin(pin: PinLike) {
  return {
    id: pin.id,
    xPercent: pin.xPercent,
    yPercent: pin.yPercent,
    text: pin.text,
    author: pin.author as CommentAuthor,
    authorName: pin.authorName ?? null,
    resolved: pin.resolved,
    createdAt: toIso(pin.createdAt),
    attachmentSlideId: pin.attachmentSlideId ?? null,
  };
}

function serializeSlide(slide: SlideLike) {
  return {
    id: slide.id,
    order: slide.order,
    url: slide.url,
    mediaType: slide.mediaType ?? "image",
    label: slide.label ?? null,
    pins: (slide.pins ?? []).map(serializePin),
  };
}

function serializeVersion(version: VersionLike) {
  return {
    id: version.id,
    url: version.url,
    version: version.version,
    createdAt: toIso(version.createdAt),
    slides: (version.slides ?? []).map(serializeSlide),
    pins: (version.pins ?? []).map(serializePin),
  };
}

function serializeAttachment(attachment: AttachmentLike) {
  return {
    id: attachment.id,
    type: attachment.type,
    label: attachment.label ?? null,
    order: attachment.order,
    versions: [...attachment.versions]
      .sort((a, b) => a.version - b.version)
      .map(serializeVersion),
  };
}

function serializeComment(comment: CommentLike) {
  return {
    id: comment.id,
    author: comment.author as CommentAuthor,
    authorName: comment.authorName ?? null,
    text: comment.text,
    createdAt: toIso(comment.createdAt),
  };
}

function serializeActivityEvent(event: StatusEventLike) {
  return {
    id: event.id,
    type: event.type,
    fromStatus: event.fromStatus ?? null,
    toStatus: event.toStatus ?? null,
    actorType: event.actorType,
    actorNameSnapshot: event.actorNameSnapshot,
    createdAt: toIso(event.createdAt),
    invalidationReason: event.invalidationReason ?? null,
    copySnapshot: event.copySnapshot ?? null,
    titleSnapshot: event.titleSnapshot ?? null,
    channelSnapshot: event.channelSnapshot ?? null,
    scheduledAtSnapshot: event.scheduledAtSnapshot
      ? toIso(event.scheduledAtSnapshot)
      : null,
    creatives: parseCreativesSnapshot(event.creativesSnapshot),
  };
}

function serializePublicFields(post: SerializablePost, includeAgencyEvents: boolean) {
  const events = (post.statusEvents ?? []).filter((event) =>
    includeAgencyEvents ? true : event.visibility !== "agency"
  );

  return {
    id: post.id,
    scheduledAt: toIso(post.scheduledAt),
    channel: post.channel,
    title: post.title ?? "",
    copyText: post.copyText,
    status: post.status,
    comments: (post.comments ?? []).map(serializeComment),
    attachments: [...(post.attachments ?? [])]
      .sort((a, b) => a.order - b.order)
      .map(serializeAttachment),
    activity: events.map(serializeActivityEvent),
    legacyApproval:
      post.status === "approved" &&
      !(post.statusEvents ?? []).some((event) => event.type === "approved"),
  };
}

export function serializeClientPost(post: SerializablePost) {
  return serializePublicFields(post, false);
}

export function serializeAgencyPost(post: SerializablePost) {
  return {
    ...serializePublicFields(post, true),
    productionStage: post.productionStage ?? "draft_copy",
    assigneeId: post.assigneeId ?? null,
    assignedAt: post.assignedAt ? toIso(post.assignedAt) : null,
    assignedById: post.assignedById ?? null,
    handoffNote: post.handoffNote ?? null,
    assignee: post.assignee
      ? {
          id: post.assignee.id,
          name: post.assignee.name ?? null,
          email: post.assignee.email ?? null,
        }
      : null,
    assignedBy: post.assignedBy
      ? {
          id: post.assignedBy.id,
          name: post.assignedBy.name ?? null,
          email: post.assignedBy.email ?? null,
        }
      : null,
  };
}

export function serializeCalendarPosts(
  posts: SerializablePost[],
  isAgency: boolean
) {
  const visible = isAgency
    ? posts
    : posts.filter((post) => isPostVisibleToClient(post.productionStage ?? ""));

  return visible.map((post) =>
    isAgency ? serializeAgencyPost(post) : serializeClientPost(post)
  );
}

export const CLIENT_POST_INTERNAL_KEYS = [
  "productionStage",
  "assigneeId",
  "assignedAt",
  "assignedById",
  "handoffNote",
  "assignee",
  "assignedBy",
] as const;
