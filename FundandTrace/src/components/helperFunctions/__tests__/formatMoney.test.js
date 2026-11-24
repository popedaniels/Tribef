import { formatMoney, timeAgo } from "../helperFunctions";

describe("formatMoney", () => {
  it("uses the campaign's own currency symbol", () => {
    expect(formatMoney(12640000, "NGN")).toBe("₦12,640,000");
    expect(formatMoney(384000, "KES")).toBe("KSh 384,000");
    expect(formatMoney(71250, "GHS")).toBe("GH₵71,250");
    expect(formatMoney(11870, "usd")).toBe("$11,870");
  });
  it("keeps pence for small non-whole amounts", () => {
    expect(formatMoney(9.4, "GBP")).toBe("£9.40");
  });
  it("never renders NaN", () => {
    expect(formatMoney(undefined, "GBP")).toBe("£0");
    expect(formatMoney("abc", "NGN")).toBe("₦0");
    expect(formatMoney(5, undefined)).toBe("$5");
  });
  it("handles unknown codes, negatives and compact", () => {
    expect(formatMoney(10, "XOF")).toBe("XOF 10");
    expect(formatMoney(-6200000, "NGN")).toBe("−₦6,200,000");
    expect(formatMoney(12640000, "NGN", { compact: true })).toBe("₦12.6M");
  });
});

describe("timeAgo", () => {
  const now = new Date("2026-11-21T12:00:00Z").getTime();
  it("formats relative times", () => {
    expect(timeAgo(now - 20e3, now)).toBe("just now");
    expect(timeAgo(now - 5 * 60e3, now)).toBe("5m ago");
    expect(timeAgo(now - 3 * 3600e3, now)).toBe("3h ago");
    expect(timeAgo(now - 2 * 864e5, now)).toBe("2d ago");
    expect(timeAgo("nope", now)).toBe("");
  });
});

describe("currencyPrefix", () => {
  const { currencyPrefix } = require("../helperFunctions");
  it("uses the campaign's own currency, not ₦ for everything that isn't USD/GBP", () => {
    expect(currencyPrefix("KES")).toBe("KSh ");
    expect(currencyPrefix("GHS")).toBe("GH₵");
    expect(currencyPrefix("NGN")).toBe("₦");
    expect(currencyPrefix("usd")).toBe("$");
    expect(currencyPrefix("XOF")).toBe("XOF ");
  });
  it("keeps the historical ₦ default when a legacy campaign has no currency", () => {
    expect(currencyPrefix(undefined)).toBe("₦");
  });
});

describe("formatMoney exact", () => {
  it("keeps kobo on large charged amounts", () => {
    expect(formatMoney(10253.81, "NGN", { exact: true })).toBe("₦10,253.81");
    expect(formatMoney(10253.81, "NGN")).toBe("₦10,254");
    expect(formatMoney(10000, "NGN", { exact: true })).toBe("₦10,000");
  });
});
