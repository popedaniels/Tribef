import { getDualCurrencyEstimate } from "../helperFunctions";

describe("approximate amount in another currency", () => {
  it("converts via USD using the display rates", () => {
    const est = getDualCurrencyEstimate(100000, "NGN", "GBP");
    expect(est.currency).toBe("GBP");
    expect(Number(String(est.amount).replace(/[^0-9.]/g, ""))).toBeGreaterThan(0);
  });

  it("gives no estimate for an unknown currency instead of treating it as USD", () => {
    expect(getDualCurrencyEstimate(50000, "XYZ", "GBP")).toBeNull();
    expect(getDualCurrencyEstimate(50000, "NGN", "QQQ")).toBeNull();
  });

  it("knows the corridor currencies", () => {
    for (const c of ["UGX", "TZS", "RWF", "XOF", "KES", "GHS"]) expect(getDualCurrencyEstimate(1000, c, "GBP")).not.toBeNull();
  });
});
