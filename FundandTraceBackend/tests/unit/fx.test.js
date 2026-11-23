const fx = require("../../services/fx");
const { convertToPounds } = require("../../currencyConverter");

describe("display FX rates", () => {
  it("parses the default provider (units per USD) into USD per unit", () => {
    const parsed = fx.parseProvider({ base_code: "USD", time_last_update_unix: 1763856000, rates: { USD: 1, GBP: 0.8, NGN: 1500, KES: 130 } });
    expect(parsed.ratesToUsd.GBP).toBeCloseTo(1.25);
    expect(parsed.ratesToUsd.NGN).toBeCloseTo(1 / 1500);
    expect(parsed.asOf).toBe("2025-11-23");
  });

  it("handles a non-USD base and rejects junk", () => {
    const p = fx.parseProvider({ base: "GBP", rates: { GBP: 1, USD: 1.25, NGN: 1875 } });
    expect(p.ratesToUsd.NGN).toBeCloseTo(1.25 / 1875);
    expect(fx.parseProvider({ rates: { EUR: 1 } })).toBeNull();
    expect(fx.parseProvider("<html>")).toBeNull();
  });

  it("refresh keeps the previous rates when the provider fails", async () => {
    fx._set({ GBP: 1.3 }, "2026-11-20");
    const http = { get: jest.fn(async () => { throw new Error("down"); }) };
    await fx.refresh({ http, force: true });
    expect(fx.snapshot()).toMatchObject({ asOf: "2026-11-20", source: "live" });
    expect(fx.snapshot().ratesToUsd.GBP).toBe(1.3);
  });

  it("refresh adopts live rates", async () => {
    const http = { get: jest.fn(async () => ({ data: { base_code: "USD", time_last_update_unix: 1763942400, rates: { USD: 1, GBP: 0.75, NGN: 1600 } } })) };
    await fx.refresh({ http, force: true });
    expect(fx.snapshot().ratesToUsd.GBP).toBeCloseTo(1 / 0.75);
    expect(fx.snapshot().asOf).toBe("2025-11-24");
  });

  it("converts between any two known currencies, null for unknown", () => {
    fx._set({ GBP: 1.25, NGN: 1 / 1600, KES: 1 / 130 });
    expect(fx.convert(1600, "NGN", "GBP")).toBeCloseTo(0.8);
    expect(fx.convert(130, "kes", "usd")).toBeCloseTo(1);
    expect(fx.convert(10, "XYZ", "GBP")).toBeNull();
  });
});

describe("convertToPounds (dashboards)", () => {
  beforeAll(() => fx._set({ GBP: 1.25, NGN: 1 / 1600, KES: 1 / 130, GHS: 1 / 15 }));

  it("covers currencies the old table didn't (was undefined → NaN totals)", () => {
    const total = [convertToPounds(16000, "NGN"), convertToPounds(13000, "KES"), convertToPounds(1500, "GHS"), convertToPounds(100, "GBP")].reduce((a, b) => a + b, 0);
    expect(Number.isNaN(total)).toBe(false);
    expect(total).toBe(8 + 80 + 80 + 100);
  });

  it("treats a missing currency as NGN and an unknown one as 0, never NaN", () => {
    expect(convertToPounds(16000)).toBe(8);
    expect(convertToPounds(100, "XYZ")).toBe(0);
  });
});
