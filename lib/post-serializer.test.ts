import { describe, expect, it } from "vitest";
import { isPostVisibleToClient } from "@/lib/client-content-boundary";
import {
  CLIENT_POST_INTERNAL_KEYS,
  serializeCalendarPosts,
  serializeClientPost,
} from "@/lib/post-serializer";

const basePost = {
  id: "post-1",
  scheduledAt: new Date("2026-10-14T17:00:00.000Z"),
  channel: "Instagram",
  title: "Feed",
  copyText: "Caption",
  status: "pending",
  productionStage: "draft_copy",
  assigneeId: "user-1",
  assignedAt: new Date("2026-09-30T12:00:00.000Z"),
  assignedById: "user-2",
  handoffNote: "ajustar KV",
  comments: [
    {
      id: "c1",
      author: "agency",
      authorName: "Ana",
      text: "ok",
      createdAt: new Date("2026-09-30T12:01:00.000Z"),
    },
  ],
  attachments: [],
  assignee: { id: "user-1", name: "Joao", email: "joao@ag.com" },
  assignedBy: { id: "user-2", name: "Maria", email: "maria@ag.com" },
};

describe("client content boundary", () => {
  it("hides internal production stages from clients", () => {
    expect(isPostVisibleToClient("draft_copy")).toBe(false);
    expect(isPostVisibleToClient("waiting_design")).toBe(false);
    expect(isPostVisibleToClient("internal_review")).toBe(false);
    expect(isPostVisibleToClient("ready_for_client")).toBe(true);
  });
});

describe("serializeClientPost", () => {
  it("omits internal agency fields", () => {
    const serialized = serializeClientPost(basePost);
    for (const key of CLIENT_POST_INTERNAL_KEYS) {
      expect(serialized).not.toHaveProperty(key);
    }
    expect(serialized.copyText).toBe("Caption");
    expect(serialized.comments).toHaveLength(1);
    expect(serialized).toHaveProperty("activity");
    expect(serialized.legacyApproval).toBe(false);
  });
});

describe("serializeCalendarPosts", () => {
  it("returns only ready_for_client posts for clients", () => {
    const posts = [
      { ...basePost, id: "a", productionStage: "draft_copy" },
      { ...basePost, id: "b", productionStage: "waiting_design" },
      { ...basePost, id: "c", productionStage: "internal_review" },
      { ...basePost, id: "d", productionStage: "ready_for_client", copyText: "visible" },
    ];

    const clientPosts = serializeCalendarPosts(posts, false);
    expect(clientPosts).toHaveLength(1);
    expect(clientPosts[0].id).toBe("d");
    expect(clientPosts[0]).not.toHaveProperty("handoffNote");

    const agencyPosts = serializeCalendarPosts(posts, true);
    expect(agencyPosts).toHaveLength(4);
    expect(agencyPosts[0]).toHaveProperty("handoffNote");
  });
});
