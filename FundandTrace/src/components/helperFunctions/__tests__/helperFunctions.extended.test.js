// Extended edge-case tests for helperFunctions - complements helperFunctions.test.js
const {
  addCommaToNumber,
  getCurrency,
  getDaysRemaining,
  getPresetDonationAmounts,
  getProcessorFeeEstimate,
  getDualCurrencyEstimate,
  formatCurrencyAmount,
  selectPaymentRail,
  grabErrorMessage,
  grabErrorStatus,
  getTimeDiff,
} = require("../helperFunctions");

describe("helperFunctions (extended)", () => {
  describe("getCurrency edge cases", () => {
    it("returns upper-cased code for unknown currencies", () => {
      expect(getCurrency("JPY")).toBe("JPY");
      expect(getCurrency("jpy")).toBe("JPY");
      expect(getCurrency("XYZ")).toBe("XYZ");
    });

    it("trims whitespace before lookup", () => {
      expect(getCurrency("  ngn  ")).toBe("₦");
      expect(getCurrency(" USD ")).toBe("$");
    });

    it("returns $ for empty string and falsy values", () => {
      expect(getCurrency("")).toBe("$");
      expect(getCurrency(null)).toBe("$");
      expect(getCurrency(undefined)).toBe("$");
      expect(getCurrency(0)).toBe("$");
    });

    it("returns symbols for African currencies", () => {
      expect(getCurrency("KES")).toBe("KSh ");
      expect(getCurrency("GHS")).toBe("GH₵");
      expect(getCurrency("ZAR")).toBe("R ");
    });
  });

  describe("formatCurrencyAmount edge cases", () => {
    it("formats NGN as zero-decimal (no fraction)", () => {
      expect(formatCurrencyAmount(10000, "NGN")).toBe("10,000");
      expect(formatCurrencyAmount(10000.99, "NGN")).toBe("10,001");
    });

    it("formats JPY and KES as zero-decimal", () => {
      expect(formatCurrencyAmount(5000, "JPY")).toBe("5,000");
      expect(formatCurrencyAmount(2500.6, "KES")).toBe("2,501");
    });

    it("formats USD with up to 2 decimals", () => {
      expect(formatCurrencyAmount(10000.5, "USD")).toBe("10,000.5");
      expect(formatCurrencyAmount(10000.567, "USD")).toBe("10,000.57");
      expect(formatCurrencyAmount(100, "USD")).toBe("100");
    });

    it("handles zero and invalid amounts", () => {
      expect(formatCurrencyAmount(0, "USD")).toBe("0");
      expect(formatCurrencyAmount("abc", "USD")).toBe("0");
      expect(formatCurrencyAmount(null, "USD")).toBe("0");
      expect(formatCurrencyAmount(undefined, "GBP")).toBe("0");
    });

    it("handles large numbers", () => {
      expect(formatCurrencyAmount(1000000, "USD")).toBe("1,000,000");
    });
  });

  describe("getDualCurrencyEstimate edge cases", () => {
    it("returns null for zero or negative amounts", () => {
      expect(getDualCurrencyEstimate(0, "NGN", "USD")).toBeNull();
      expect(getDualCurrencyEstimate(-10, "USD", "GBP")).toBeNull();
      expect(getDualCurrencyEstimate("0", "USD", "EUR")).toBeNull();
    });

    it("returns null when base or target missing", () => {
      expect(getDualCurrencyEstimate(100, null, "USD")).toBeNull();
      expect(getDualCurrencyEstimate(100, "USD", null)).toBeNull();
      expect(getDualCurrencyEstimate(100, "", "USD")).toBeNull();
    });

    it("returns null case-insensitively when base equals target", () => {
      expect(getDualCurrencyEstimate(100, "usd", "USD")).toBeNull();
      expect(getDualCurrencyEstimate(100, "NGN", "ngn")).toBeNull();
    });

    it("converts NGN to USD using approximate rate", () => {
      const est = getDualCurrencyEstimate(10000, "NGN", "USD");
      expect(est).not.toBeNull();
      expect(est.currency).toBe("USD");
      expect(est.symbol).toBe("$");
      // 10000 *0.00065 = 6.5
      expect(est.amount).toBe("6.5");
    });

    it("falls back to rate 1.0 for unknown currencies", () => {
      const est = getDualCurrencyEstimate(100, "XYZ", "ABC");
      expect(est).not.toBeNull();
      expect(est.currency).toBe("ABC");
      // both rates fallback to 1.0, so inTarget = 100*1/1 =100
      expect(est.amount).toBe("100");
    });
  });

  describe("getProcessorFeeEstimate edge cases", () => {
    it("caps Paystack NGN fee at 2000", () => {
      const fee = getProcessorFeeEstimate(200000, "NGN", "paystack");
      expect(fee.processorFee).toBe(2000);
      expect(fee.total).toBe(202000);
    });

    it("computes Paystack international 3.9%", () => {
      const fee = getProcessorFeeEstimate(100, "USD", "paystack");
      expect(fee.processorFee).toBeCloseTo(3.9, 2);
      expect(fee.total).toBeCloseTo(103.9, 2);
    });

    it("caps Flutterwave NGN at 2000", () => {
      const fee = getProcessorFeeEstimate(200000, "NGN", "flutterwave");
      expect(fee.processorFee).toBe(2000);
    });

    it("computes Flutterwave non-NGN 1.4%", () => {
      const fee = getProcessorFeeEstimate(100, "USD", "flutterwave");
      expect(fee.processorFee).toBeCloseTo(1.4, 2);
    });

    it("computes Stripe GBP 1.4% + 0.20", () => {
      const fee = getProcessorFeeEstimate(100, "GBP", "stripe");
      // 100*0.014=1.4 +0.20=1.6
      expect(fee.processorFee).toBeCloseTo(1.6, 2);
      expect(fee.total).toBeCloseTo(101.6, 2);
    });

    it("computes Stripe EUR 1.4% + 0.25", () => {
      const fee = getProcessorFeeEstimate(100, "EUR", "stripe");
      expect(fee.processorFee).toBeCloseTo(1.65, 2);
    });

    it("computes Stripe USD 2.9% + 0.30", () => {
      const fee = getProcessorFeeEstimate(100, "USD", "stripe");
      expect(fee.processorFee).toBeCloseTo(3.2, 2);
    });

    it("defaults to Stripe for unknown paymentMethod", () => {
      const fee = getProcessorFeeEstimate(100, "USD", "unknown");
      expect(fee.processorFee).toBeCloseTo(3.2, 2);
    });

    it("returns zeroed for negative and zero amounts", () => {
      expect(getProcessorFeeEstimate(0, "USD", "stripe")).toEqual({ platformFee: 0, processorFee: 0, total: 0 });
      expect(getProcessorFeeEstimate(-50, "NGN", "paystack")).toEqual({ platformFee: 0, processorFee: 0, total: 0 });
    });

    it("always has platformFee 0", () => {
      expect(getProcessorFeeEstimate(1000, "NGN", "paystack").platformFee).toBe(0);
      expect(getProcessorFeeEstimate(100, "GBP", "stripe").platformFee).toBe(0);
    });
  });

  describe("getPresetDonationAmounts edge cases", () => {
    it("returns KES presets", () => {
      expect(getPresetDonationAmounts("KES")).toEqual([1000, 3000, 10000, 25000]);
    });

    it("returns GHS presets", () => {
      expect(getPresetDonationAmounts("GHS")).toEqual([100, 250, 500, 1000]);
    });

    it("returns EUR presets", () => {
      expect(getPresetDonationAmounts("EUR")).toEqual([10, 30, 75, 150]);
    });

    it("returns USD presets", () => {
      expect(getPresetDonationAmounts("USD")).toEqual([15, 50, 100, 250]);
    });

    it("is case-insensitive", () => {
      expect(getPresetDonationAmounts("ngn")).toEqual([5000, 15000, 50000, 100000]);
      expect(getPresetDonationAmounts("kes")).toEqual([1000, 3000, 10000, 25000]);
    });

    it("defaults to USD for unknown currency", () => {
      expect(getPresetDonationAmounts("XYZ")).toEqual([15, 50, 100, 250]);
    });
  });

  describe("addCommaToNumber edge cases", () => {
    it("formats decimals with up to 2 places", () => {
      expect(addCommaToNumber(1234.5)).toBe("1,234.5");
      expect(addCommaToNumber(1234.567)).toBe("1,234.57");
    });

    it("handles zero and negatives", () => {
      expect(addCommaToNumber(0)).toBe("0");
      expect(addCommaToNumber(-1000)).toBe("-1,000");
    });

    it("handles numeric strings and large numbers", () => {
      expect(addCommaToNumber("1000000")).toBe("1,000,000");
      expect(addCommaToNumber(1000000)).toBe("1,000,000");
    });
  });

  describe("getDaysRemaining edge cases", () => {
    it("returns duration for invalid createdAt", () => {
      expect(getDaysRemaining({ createdAt: "invalid-date", basicInformation: { duration: 20 } })).toBe(20);
    });

    it("returns 30 when duration missing", () => {
      const campaign = { createdAt: new Date(Date.now() - 1000).toISOString() };
      expect(getDaysRemaining(campaign)).toBe(30);
    });

    it("reads duration from top-level when basicInformation missing", () => {
      const campaign = {
        createdAt: new Date(Date.now() - 2 * 86400000).toISOString(),
        duration: 10,
      };
      expect(getDaysRemaining(campaign)).toBe(8);
    });

    it("handles just-launched campaign (0 days elapsed)", () => {
      const campaign = {
        createdAt: new Date().toISOString(),
        basicInformation: { duration: 30 },
      };
      expect(getDaysRemaining(campaign)).toBe(30);
    });
  });

  describe("grabErrorMessage / grabErrorStatus", () => {
    it("extracts error message and status from axios error", () => {
      const err = { response: { data: { error: "Not found" }, status: 404 } };
      expect(grabErrorMessage(err)).toBe("Not found");
      expect(grabErrorStatus(err)).toBe(404);
    });

    it("returns undefined for missing response", () => {
      expect(grabErrorMessage(null)).toBeUndefined();
      expect(grabErrorMessage({})).toBeUndefined();
      expect(grabErrorStatus(null)).toBeUndefined();
      expect(grabErrorStatus({})).toBeUndefined();
    });
  });

  describe("getTimeDiff", () => {
    it("returns minutes for <1 hour ago", () => {
      const ts = Date.now() - 30 * 60 * 1000;
      expect(getTimeDiff(ts)).toMatch(/^\d+m$/);
    });

    it("returns hours for <24h ago", () => {
      const ts = Date.now() - 5 * 60 * 60 * 1000;
      expect(getTimeDiff(ts)).toBe("5h");
    });

    it("returns days for >=24h ago", () => {
      const ts = Date.now() - 3 * 24 * 60 * 60 * 1000;
      expect(getTimeDiff(ts)).toBe("3d");
    });

    it("handles string timestamps", () => {
      const ts = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();
      expect(getTimeDiff(ts)).toBe("2h");
    });
  });

  describe("selectPaymentRail edge cases", () => {
    it("trims whitespace and is case-insensitive", () => {
      expect(selectPaymentRail(" Nigeria ")).toBe("paystack");
      expect(selectPaymentRail("  GHANA ")).toBe("flutterwave");
      expect(selectPaymentRail("tanzania")).toBe("flutterwave");
    });

    it("routes non-African to stripe", () => {
      expect(selectPaymentRail("Brazil")).toBe("stripe");
      expect(selectPaymentRail("Japan")).toBe("stripe");
    });
  });
});
