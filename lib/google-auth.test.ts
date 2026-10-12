import { describe, expect, it } from "vitest";
import { googleAuthErrorMessage } from "./google-auth";

const tr = (portuguese: string) => portuguese;

describe("googleAuthErrorMessage", () => {
  it("explains an unverified Google email", () => {
    expect(googleAuthErrorMessage("AccessDenied", tr)).toContain("Google");
  });

  it("explains a missing OAuth client", () => {
    expect(googleAuthErrorMessage("Configuration", tr)).toContain("configurado");
  });

  it("falls back for unknown codes", () => {
    expect(googleAuthErrorMessage("OAuthCallbackError", tr)).toContain("Tente novamente");
  });
});
