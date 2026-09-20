// Unit tests for helper utility functions (currency formatting, days remaining, fee estimation)
const {
  addCommaToNumber,
  getCurrency,
  getDaysRemaining,
  getPresetDonationAmounts,
  getProcessorFeeEstimate,
  getDualCurrencyEstimate,
  formatCurrencyAmount,
} = require("./helperFunctions");

describe("helperFunctions", () => {
  describe("addCommaToNumber", () => {
    it("should format thousands with commas", () => {
      expect(addCommaToNumber(1000)).toBe("1,000");
      expect(addCommaToNumber(1000000)).toBe("1,000,000");
    });

    it("should return the number as a string for < 1000", () => {
      expect(addCommaToNumber(999)).toBe("999");
      expect(addCommaToNumber(0)).toBe("0");
    });

    it("should handle strings", () => {
      expect(addCommaToNumber("2500")).toBe("2,500");
    });
  });

  describe("getCurrency", () => {
    it("should return the currency symbol for a known code", () => {
      expect(getCurrency("NGN")).toBe("\u20A6");
      expect(getCurrency("USD")).toBe("$");
      expect(getCurrency("GBP")).toBe("\u00A3");
    });

    it("should be case-insensitive", () => {
      expect(getCurrency("ngn")).toBe("\u20A6");
    });

    it("should default to $ when missing", () => {
      expect(getCurrency(null)).toBe("$");
      expect(getCurrency(undefined)).toBe("$");
    });
  });

  describe("getDaysRemaining", () => {
    const now = Date.now();
    const day = 86400000;

    it("should compute days remaining from createdAt + duration", () => {
      const campaign = {
        createdAt: new Date(now - 5 * day).toISOString(),
        basicInformation: { duration: 30 },
      };
      expect(getDaysRemaining(campaign)).toBe(25);
    });

    it("should return 0 for expired campaigns", () => {
      const campaign = {
        createdAt: new Date(now - 40 * day).toISOString(),
        basicInformation: { duration: 30 },
      };
      expect(getDaysRemaining(campaign)).toBe(0);
    });

    it("should return planned duration for drafts without createdAt", () => {
      expect(getDaysRemaining({ basicInformation: { duration: 30 } })).toBe(30);
    });

    it("should return 0 for null campaign", () => {
      expect(getDaysRemaining(null)).toBe(0);
    });

    it("should default duration to 30 when missing", () => {
      expect(getDaysRemaining({ createdAt: new Date(now - 2 * day).toISOString() })).toBe(28);
    });
  });

  describe("getPresetDonationAmounts", () => {
    it("should return preset amounts for a currency", () => {
      const presets = getPresetDonationAmounts("NGN");
      expect(Array.isArray(presets)).toBe(true);
      expect(presets.length).toBeGreaterThan(0);
      expect(presets).toEqual([5000, 15000, 50000, 100000]);
    });

    it("should default to GBP amounts", () => {
      expect(getPresetDonationAmounts()).toEqual([10, 25, 50, 100]);
    });
  });

  describe("getProcessorFeeEstimate", () => {
    it("should return a fee breakdown object for Paystack NGN", () => {
      const fee = getProcessorFeeEstimate(10000, "NGN", "paystack");
      expect(fee).toHaveProperty("platformFee");
      expect(fee).toHaveProperty("processorFee");
      expect(fee).toHaveProperty("total");
      expect(fee.total).toBeGreaterThan(10000);
    });

    it("should return zeroed breakdown for invalid amounts", () => {
      const fee = getProcessorFeeEstimate(0, "USD", "stripe");
      expect(fee).toEqual({ platformFee: 0, processorFee: 0, total: 0 });
    });

    it("should estimate a positive Stripe fee for USD", () => {
      const fee = getProcessorFeeEstimate(100, "USD", "stripe");
      expect(fee.processorFee).toBeGreaterThan(0);
      expect(fee.total).toBeCloseTo(100 + fee.processorFee, 2);
    });
  });

  describe("getDualCurrencyEstimate", () => {
    it("should return a conversion estimate", () => {
      const estimate = getDualCurrencyEstimate(10000, "NGN", "USD");
      expect(estimate).toHaveProperty("symbol");
      expect(estimate).toHaveProperty("amount");
      expect(estimate).toHaveProperty("currency");
      expect(estimate.currency).toBe("USD");
    });

    it("should return null when base equals target", () => {
      expect(getDualCurrencyEstimate(100, "USD", "USD")).toBeNull();
    });
  });

  describe("formatCurrencyAmount", () => {
    it("should return a formatted string", () => {
      const formatted = formatCurrencyAmount(10000, "USD");
      expect(typeof formatted).toBe("string");
      expect(formatted.length).toBeGreaterThan(0);
    });

    it("should not show decimals for zero-decimal currencies", () => {
      expect(formatCurrencyAmount(10000, "NGN")).toBe("10,000");
    });
  });
});