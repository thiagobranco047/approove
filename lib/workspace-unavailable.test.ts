import { describe, expect, it } from "vitest";
import { WORKSPACE_UNAVAILABLE_CODE, WORKSPACE_UNAVAILABLE_MESSAGE } from "./workspace-unavailable";

describe("public workspace copy", () => {
  it("does not expose billing or Stripe language", () => {
    expect(WORKSPACE_UNAVAILABLE_CODE).toBe("WORKSPACE_UNAVAILABLE");
    expect(WORKSPACE_UNAVAILABLE_MESSAGE.toLowerCase()).not.toMatch(
      /stripe|cartão|assinatura|pagamento|cobrança|subscription|billing|card/
    );
  });
});
