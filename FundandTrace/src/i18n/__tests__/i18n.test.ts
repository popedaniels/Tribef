import { detectLocale, translate } from "..";
import { EN, MESSAGES } from "../messages";

describe("i18n", () => {
  it("substitutes placeholders and falls back to English per key", () => {
    expect(translate("fr", "donate.submit", { total: "₦10,253.81" })).toBe("Donner ₦10,253.81");
    expect(translate("sw", "donate.summary.total")).toBe("Jumla");
    expect(translate("fr", "lang.label")).toBe("Langue");
  });
  it("detects a saved choice, then the browser language, then English", () => {
    expect(detectLocale("a=1; ft_lang=sw", ["fr-FR"])).toBe("sw");
    expect(detectLocale("", ["fr-CI", "en"])).toBe("fr");
    expect(detectLocale("", ["yo-NG"])).toBe("en");
  });
  it("keeps every placeholder in every translation", () => {
    const vars = (s: string) => (s.match(/\{\w+\}/g) || []).sort().join(",");
    for (const [loc, msgs] of Object.entries(MESSAGES)) {
      for (const [k, v] of Object.entries(msgs)) {
        expect(`${loc}:${k}:${vars(v as string)}`).toBe(`${loc}:${k}:${vars(EN[k as keyof typeof EN])}`);
      }
    }
  });
});
