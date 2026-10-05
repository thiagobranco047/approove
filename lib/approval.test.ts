import { describe, expect, it } from "vitest";
import {
  buildCreativesSnapshotFromPost,
  resolveClientStatusAction,
  shouldRecordSubmittedForReview,
} from "@/lib/approval";
import { parseCreativesSnapshot } from "@/lib/approval-types";

describe("client status actions", () => {
  it("allows approve and request changes, not pending", () => {
    expect(resolveClientStatusAction("approved")).toBe("approve");
    expect(resolveClientStatusAction("adjustments")).toBe("request_changes");
    expect(resolveClientStatusAction("pending")).toBeNull();
  });
});

describe("submitted_for_review", () => {
  it("records when entering ready_for_client", () => {
    expect(shouldRecordSubmittedForReview("internal_review", "ready_for_client")).toBe(true);
    expect(shouldRecordSubmittedForReview("draft_copy", "ready_for_client")).toBe(true);
  });

  it("does not duplicate when already ready_for_client", () => {
    expect(shouldRecordSubmittedForReview("ready_for_client", "ready_for_client")).toBe(false);
  });
});

describe("creatives snapshot", () => {
  it("is self-contained with slide urls and ids", () => {
    const snapshot = buildCreativesSnapshotFromPost({
      attachments: [
        {
          id: "att-1",
          type: "carousel",
          label: "Carrossel",
          versions: [
            {
              id: "ver-3",
              url: "https://blob/cover.jpg",
              version: 3,
              slides: [
                {
                  id: "s1",
                  order: 0,
                  url: "https://blob/1.jpg",
                  mediaType: "image",
                  label: null,
                },
                {
                  id: "s2",
                  order: 1,
                  url: "https://blob/2.jpg",
                  mediaType: "image",
                  label: "Slide 2",
                },
              ],
            },
          ],
        },
      ],
    });

    expect(snapshot[0]).toMatchObject({
      attachmentId: "att-1",
      type: "carousel",
      versionId: "ver-3",
      versionNumber: 3,
    });
    expect(snapshot[0].slides[1]).toMatchObject({
      slideId: "s2",
      order: 1,
      url: "https://blob/2.jpg",
      mediaType: "image",
    });

    const roundTrip = parseCreativesSnapshot(JSON.stringify(snapshot));
    expect(roundTrip[0].slides).toHaveLength(2);
  });
});
