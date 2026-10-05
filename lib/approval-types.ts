export const POST_STATUS_EVENT_TYPES = [
  "submitted_for_review",
  "changes_requested",
  "approved",
  "approval_invalidated",
] as const;

export type PostStatusEventType = (typeof POST_STATUS_EVENT_TYPES)[number];

export const INVALIDATION_REASONS = [
  "copy_changed",
  "title_changed",
  "creative_version_added",
  "attachment_added",
  "attachment_removed",
  "slide_added",
  "slide_changed",
  "slide_removed",
  "slide_reordered",
  "manual_reset",
] as const;

export type InvalidationReason = (typeof INVALIDATION_REASONS)[number];

export const INVALIDATION_REASON_COPY: Record<InvalidationReason, { pt: string; en: string }> = {
  copy_changed: {
    pt: "Aprovação invalidada porque a legenda foi editada.",
    en: "Approval invalidated because the caption was edited.",
  },
  title_changed: {
    pt: "Aprovação invalidada porque o título foi editado.",
    en: "Approval invalidated because the title was edited.",
  },
  creative_version_added: {
    pt: "Aprovação invalidada porque uma nova versão da arte foi enviada.",
    en: "Approval invalidated because a new creative version was uploaded.",
  },
  attachment_added: {
    pt: "Aprovação invalidada porque um novo material foi adicionado.",
    en: "Approval invalidated because a new asset was added.",
  },
  attachment_removed: {
    pt: "Aprovação invalidada porque um material foi removido.",
    en: "Approval invalidated because an asset was removed.",
  },
  slide_added: {
    pt: "Aprovação invalidada porque um slide foi adicionado.",
    en: "Approval invalidated because a slide was added.",
  },
  slide_changed: {
    pt: "Aprovação invalidada porque um slide foi alterado.",
    en: "Approval invalidated because a slide was changed.",
  },
  slide_removed: {
    pt: "Aprovação invalidada porque um slide foi removido.",
    en: "Approval invalidated because a slide was removed.",
  },
  slide_reordered: {
    pt: "Aprovação invalidada porque a ordem dos slides mudou.",
    en: "Approval invalidated because the slide order changed.",
  },
  manual_reset: {
    pt: "Aprovação invalidada e o conteúdo voltou para pendente.",
    en: "Approval invalidated and the content returned to pending.",
  },
};

export interface CreativeSlideSnapshot {
  slideId: string;
  order: number;
  url: string;
  mediaType: string;
  label: string | null;
}

export interface CreativeAttachmentSnapshot {
  attachmentId: string;
  type: string;
  label: string | null;
  versionId: string | null;
  versionNumber: number | null;
  url: string | null;
  slides: CreativeSlideSnapshot[];
}

export function parseCreativesSnapshot(raw: string | null | undefined): CreativeAttachmentSnapshot[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? (parsed as CreativeAttachmentSnapshot[]) : [];
  } catch {
    return [];
  }
}

export function latestVersionLabel(snapshot: CreativeAttachmentSnapshot[]): string | null {
  const numbers = snapshot
    .map((item) => item.versionNumber)
    .filter((value): value is number => typeof value === "number");
  if (numbers.length === 0) return null;
  return `v${Math.max(...numbers)}`;
}
