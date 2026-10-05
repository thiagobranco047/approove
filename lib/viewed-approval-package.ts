export function latestVersionIndex(versionsLength: number): number {
  return Math.max(versionsLength - 1, 0);
}

export function resolveViewedVersionIndex(
  versionsLength: number,
  storedIndex: number | undefined
): number {
  const latest = latestVersionIndex(versionsLength);
  if (versionsLength === 0) return 0;
  if (storedIndex === undefined) return latest;
  return Math.min(Math.max(storedIndex, 0), latest);
}

export interface AttachmentVersionView {
  id: string;
  versions: Array<{ version: number }>;
}

export function isViewingLatestApprovalPackage(
  attachments: AttachmentVersionView[],
  viewedIndexByAttachmentId: Record<string, number>
): boolean {
  return attachments.every((attachment) => {
    if (attachment.versions.length <= 1) return true;
    const viewed = resolveViewedVersionIndex(
      attachment.versions.length,
      viewedIndexByAttachmentId[attachment.id]
    );
    return viewed === latestVersionIndex(attachment.versions.length);
  });
}

export function getAttachmentVersionNumbers(
  attachment: AttachmentVersionView | null | undefined,
  viewedIndexByAttachmentId: Record<string, number>
): { viewing: number; current: number } | null {
  if (!attachment || attachment.versions.length === 0) return null;
  const viewedIdx = resolveViewedVersionIndex(
    attachment.versions.length,
    viewedIndexByAttachmentId[attachment.id]
  );
  const latestIdx = latestVersionIndex(attachment.versions.length);
  return {
    viewing: attachment.versions[viewedIdx]?.version ?? viewedIdx + 1,
    current: attachment.versions[latestIdx]?.version ?? latestIdx + 1,
  };
}

export function isViewingHistoricalAttachment(
  attachment: AttachmentVersionView | null | undefined,
  viewedIndexByAttachmentId: Record<string, number>
): boolean {
  const numbers = getAttachmentVersionNumbers(attachment, viewedIndexByAttachmentId);
  if (!numbers) return false;
  return numbers.viewing !== numbers.current;
}
