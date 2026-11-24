const fees = require("../../services/fees");

// After the processor takes its fee from the TOTAL, the campaign must get the base exactly.
const processorTake = (total, r) => {
  const p = (r.pct + (r.fx || 0)) / 100;
  let f = p * total + (r.waiveFixedBelow && total < r.waiveFixedBelow ? 0 : r.fixed || 0);
  if (r.cap) f = Math.min(f, r.cap);
  return f;
};

describe("processing fee gross-up", () => {
  const ng = fees.RULES.paystack.NGN;
  it.each([1000, 2400, 5000, 50000, 150000, 2000000])("Paystack NGN %d: campaign receives the full gift", (base) => {
    const fee = fees.grossUp(base, ng);
    const net = base + fee - processorTake(base + fee, ng);
    expect(net).toBeGreaterThanOrEqual(base - 0.01);
    expect(net - base).toBeLessThan(1); // never meaningfully over-collected
  });

  it("applies Paystack's ₦2,000 cap and the waived ₦100 under ₦2,500", () => {
    expect(fees.grossUp(2000000, ng)).toBe(2000);
    expect(fees.grossUp(1000, ng)).toBeCloseTo(15.23, 2); // 1.5% only, no ₦100
    expect(fees.grossUp(10000, ng)).toBeCloseTo(253.81, 2); // (10000+100)/0.985 − 10000
  });

  it("Stripe UK card: 1.5% + 20p; EEA and international donors use their rates", () => {
    const uk = fees.quote({ rail: "stripe", currency: "GBP", base: 50, coverFee: true, donorCountry: "GB" });
    expect(uk.fee).toBe(Math.ceil(((50 + 0.2) / 0.985 - 50) * 100) / 100); // rounded UP to the penny
    const de = fees.quote({ rail: "stripe", currency: "GBP", base: 50, coverFee: true, donorCountry: "DE" });
    expect(de.rule.pct).toBe(2.5);
    const us = fees.quote({ rail: "stripe", currency: "GBP", base: 50, coverFee: true, donorCountry: "US" });
    expect(us.rule.pct).toBe(3.25);
  });

  it("M-PESA uses its own (lower) rate", () => {
    expect(fees.quote({ rail: "paystack", currency: "KES", base: 1000, method: "mpesa" }).rule.pct).toBe(1.5);
    expect(fees.quote({ rail: "paystack", currency: "KES", base: 1000 }).rule.pct).toBe(2.9);
  });
});

describe("who pays", () => {
  afterEach(() => {
    delete process.env.FEE_MODE_STRIPE;
    delete process.env.FEE_MODE_PAYSTACK;
  });

  it("adds the fee on African rails by default", () => {
    const q = fees.quote({ rail: "paystack", currency: "NGN", base: 10000 });
    expect(q.mode).toBe("required");
    expect(q.fee).toBeGreaterThan(0);
  });

  it("UK/EU cards: opt-in only (surcharge ban; no pre-ticked extras)", () => {
    expect(fees.quote({ rail: "stripe", currency: "GBP", base: 50 }).fee).toBe(0);
    expect(fees.quote({ rail: "stripe", currency: "GBP", base: 50, coverFee: true }).fee).toBeGreaterThan(0);
    expect(fees.quote({ rail: "stripe", currency: "GBP", base: 50 }).offered).toBeGreaterThan(0);
  });

  it("modes are configurable per rail", () => {
    process.env.FEE_MODE_PAYSTACK = "off";
    expect(fees.quote({ rail: "paystack", currency: "NGN", base: 10000 }).fee).toBe(0);
    process.env.FEE_MODE_STRIPE = "nonsense";
    expect(fees.modeFor("stripe")).toBe("optional");
  });

  it("rejects a client total that doesn't match the server's fee", () => {
    const ok = fees.quote({ rail: "paystack", currency: "NGN", base: 10000 }).fee;
    expect(fees.checkClientFee({ rail: "paystack", currency: "NGN", base: 10000, clientFee: ok })).toBe(ok);
    expect(() => fees.checkClientFee({ rail: "paystack", currency: "NGN", base: 10000, clientFee: 0 })).toThrow(/card fee changed/);
    expect(() => fees.checkClientFee({ rail: "stripe", currency: "GBP", base: 50, clientFee: 0.5 })).toThrow(/card fee/); // didn't opt in
  });
});

describe("splitting a verified total", () => {
  it("credits the campaign the donation only", () => {
    expect(fees.splitTotal({ total: 10353.81, donation: 10000, tip: 100, fee: 253.81 })).toMatchObject({ ok: true, donation: 10000 });
    expect(fees.splitTotal({ total: 10353.81, tip: 100, fee: 253.81 })).toMatchObject({ ok: true, donation: 10000 });
  });
  it("refuses totals that don't add up", () => {
    expect(fees.splitTotal({ total: 10000, donation: 10000, tip: 100, fee: 0 }).ok).toBe(false);
    expect(fees.splitTotal({ total: 100, tip: 60, fee: 50 }).ok).toBe(false);
  });
});
