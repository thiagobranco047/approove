import { describe, expect, it } from "vitest";
import {
  isViewingLatestApprovalPackage,
  resolveViewedVersionIndex,
} from "@/lib/viewed-approval-package";

const feed = {
  id: "feed",
  versions: [{ version: 1 }, { version: 2 }, { version: 3 }],
};

const stories = {
  id: "stories",
  versions: [{ version: 1 }, { version: 2 }],
};

describe("viewed approval package", () => {
  it("defaults missing indexes to latest", () => {
    expect(resolveViewedVersionIndex(3, undefined)).toBe(2);
  });

  it("allows approval when every attachment is on latest", () => {
    expect(
      isViewingLatestApprovalPackage([feed, stories], {
        feed: 2,
        stories: 1,
      })
    ).toBe(true);
  });

  it("blocks approval when any attachment is on a previous version", () => {
    expect(
      isViewingLatestApprovalPackage([feed, stories], {
        feed: 1,
        stories: 1,
      })
    ).toBe(false);
  });

  it("allows approval again after returning to latest", () => {
    const viewed = { feed: 0, stories: 0 };
    expect(isViewingLatestApprovalPackage([feed, stories], viewed)).toBe(false);
    viewed.feed = 2;
    viewed.stories = 1;
    expect(isViewingLatestApprovalPackage([feed, stories], viewed)).toBe(true);
  });

  it("allows approval when there is no historical version", () => {
    expect(
      isViewingLatestApprovalPackage(
        [{ id: "only", versions: [{ version: 1 }] }],
        {}
      )
    ).toBe(true);
    expect(isViewingLatestApprovalPackage([], {})).toBe(true);
  });
});
