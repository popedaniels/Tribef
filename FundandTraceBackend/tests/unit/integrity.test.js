const { balanceFindings } = require("../../services/integrity");
const { tick } = require("../../services/scheduler");

describe("balanceFindings", () => {
  const since = new Date("2026-11-01");
  const c = (id, balance, createdAt = "2026-11-10") => ({ _id: id, createdAt, funding: { availableBalance: balance, currency: "NGN" } });

  it("passes when the escrow balance equals the ledger sum", () => {
    expect(balanceFindings([c("a", 150)], new Map([["a", 150]]), new Set(), since)).toEqual([]);
  });

  it("flags a mismatch as critical", () => {
    const [f] = balanceFindings([c("a", 200)], new Map([["a", 150]]), new Set(), since);
    expect(f).toMatchObject({ severity: "critical", code: "balance_mismatch", diff: 50 });
  });

  it("downgrades a mismatch to a warning while a payout or refund is in flight", () => {
    const [f] = balanceFindings([c("a", 100)], new Map([["a", 150]]), new Set(["a"]), since);
    expect(f).toMatchObject({ severity: "warning", code: "balance_mismatch_in_flight", diff: -50 });
  });

  it("skips campaigns created before the ledger existed, but still catches negative balances", () => {
    const out = balanceFindings([c("old", -5, "2026-01-01")], new Map(), new Set(), since);
    expect(out).toEqual([expect.objectContaining({ severity: "critical", code: "negative_balance" })]);
  });

  it("ignores sub-cent rounding", () => {
    expect(balanceFindings([c("a", 0.1 + 0.2)], new Map([["a", 0.3]]), new Set(), since)).toEqual([]);
  });
});

describe("scheduler.tick", () => {
  it("does nothing while the database is down", async () => {
    expect(await tick(new Date("2026-11-22T05:00:00Z"))).toEqual([]);
  });
});
