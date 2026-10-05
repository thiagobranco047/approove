import { describe, expect, it } from "vitest";
import { getPlanLimit, planAllows, PLAN_LIMITS, planLimitResponse } from "./plan-limits";

describe("plan limits v2", () => {
  it("makes reviewers unlimited on every paid plan and free/trial", () => {
    expect(PLAN_LIMITS.free.reviewers).toBeNull();
    expect(PLAN_LIMITS.starter.reviewers).toBeNull();
    expect(PLAN_LIMITS.pro.reviewers).toBeNull();
    expect(PLAN_LIMITS.studio.reviewers).toBeNull();
    expect(planAllows("starter", "reviewers", 10)).toBe(true);
    expect(planAllows("starter", "reviewers", 99)).toBe(true);
    expect(planAllows("pro", "reviewers", 100)).toBe(true);
    expect(planAllows("studio", "reviewers", 100)).toBe(true);
  });

  it("enforces Starter client and member caps", () => {
    expect(getPlanLimit("starter", "clients")).toBe(5);
    expect(getPlanLimit("starter", "members")).toBe(2);
    expect(planAllows("starter", "clients", 5)).toBe(false);
    expect(planAllows("starter", "clients", 4)).toBe(true);
    expect(planAllows("starter", "members", 2)).toBe(false);
    expect(planAllows("starter", "members", 1)).toBe(true);
  });

  it("enforces Pro and Studio scale caps", () => {
    expect(planAllows("pro", "clients", 15)).toBe(false);
    expect(planAllows("pro", "members", 5)).toBe(false);
    expect(planAllows("studio", "clients", 40)).toBe(false);
    expect(planAllows("studio", "members", 15)).toBe(false);
    expect(planAllows("pro", "clients", 14)).toBe(true);
    expect(planAllows("studio", "members", 14)).toBe(true);
  });

  it("returns a specific upgrade message for client limits", () => {
    const response = planLimitResponse("starter", "clients", 5);
    expect(response.code).toBe("PLAN_LIMIT_REACHED");
    expect(response.error).toContain("5");
    expect(response.error).toContain("Starter");
    expect(response.upgradePath).toBe("/dashboard/settings");
  });
});
