/**
 * formatCurrency coverage via helperFunctions utilities.
 * Validates formatCurrencyAmount, getCurrency and related currency helpers
 * that live in src/components/helperFunctions/helperFunctions.js.
 */
// helperFunctions is JS; import via require for babel interop
const {
  formatCurrencyAmount,
  getCurrency,
  getDualCurrencyEstimate,
  addCommaToNumber,
} = require("../../components/helperFunctions/helperFunctions");

describe("formatCurrency (utils wrapper)", () => {
  describe("formatCurrencyAmount", () => {
    it("formats USD without unnecessary decimals", () => {
      expect(formatCurrencyAmount(1000, "USD")).toBe("1,000");
      expect(formatCurrencyAmount(1000.5, "USD")).toBe("1,000.5");
    });

    it("formats NGN / KES / JPY as zero-decimal", () => {
      expect(formatCurrencyAmount(10000.99, "NGN")).toBe("10,001");
      expect(formatCurrencyAmount(5000, "KES")).toBe("5,000");
      expect(formatCurrencyAmount(5000, "JPY")).toBe("5,000");
    });

    it("handles zero and invalid inputs", () => {
      expect(formatCurrencyAmount(0, "USD")).toBe("0");
      expect(formatCurrencyAmount("invalid", "USD")).toBe("0");
    });

    it("respects en-US grouping", () => {
      expect(formatCurrencyAmount(1000000, "USD")).toBe("1,000,000");
    });
  });

  describe("getCurrency", () => {
    it("returns symbol for known codes", () => {
      expect(getCurrency("NGN")).toBe("₦");
      expect(getCurrency("USD")).toBe("$");
      expect(getCurrency("GBP")).toBe("£");
    });

    it("falls back to upper-cased code for unknown currencies", () => {
      expect(getCurrency("JPY")).toBe("JPY");
    });

    it("defaults to $ for falsy input", () => {
      expect(getCurrency(null)).toBe("$");
      expect(getCurrency(undefined)).toBe("$");
      expect(getCurrency("")).toBe("$");
    });
  });

  describe("addCommaToNumber parity", () => {
    it("adds commas via Intl.NumberFormat", () => {
      expect(addCommaToNumber(1000)).toBe("1,000");
      expect(addCommaToNumber(1000000)).toBe("1,000,000");
    });
  });

  describe("getDualCurrencyEstimate parity", () => {
    it("returns null when base equals target", () => {
      expect(getDualCurrencyEstimate(100, "USD", "USD")).toBeNull();
    });

    it("converts NGN->USD", () => {
      const est = getDualCurrencyEstimate(10000, "NGN", "USD");
      expect(est.currency).toBe("USD");
      expect(est.amount).toBe("6.5");
    });
  });
});
