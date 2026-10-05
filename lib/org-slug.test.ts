import { describe, expect, it } from "vitest";
import { slugFromName } from "./org-slug";

describe("org slug", () => {
  it("normalizes names used by signup and Google org bootstrap", () => {
    expect(slugFromName("Agência Norte")).toBe("agencia-norte");
    expect(slugFromName("***")).toBe("org");
  });
});
