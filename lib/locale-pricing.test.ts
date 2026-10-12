import { describe, expect, it } from "vitest";
import { localeFromRequest } from "./locale";
import { currencyForLocale, PLAN_AMOUNTS, planPrice } from "./pricing";

describe("BRL checkout locale", () => {
  it("uses pt-BR and BRL amounts when the request is from Brazil", () => {
    const locale = localeFromRequest({ country: "BR", acceptLanguage: "en-US" });
    expect(locale).toBe("pt-BR");
    expect(currencyForLocale(locale)).toBe("brl");
    expect(planPrice("solo", locale).price).toContain("97");
    expect(planPrice("starter", locale).price).toContain("197");
    expect(planPrice("pro", locale).price).toContain("397");
    expect(planPrice("studio", locale).price).toContain("797");
    expect(PLAN_AMOUNTS.pro.brl).toBe(39700);
    expect(PLAN_AMOUNTS.studio.brl).toBe(79700);
  });
});
