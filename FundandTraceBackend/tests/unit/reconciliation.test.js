// Reconciliation diff core — pure function coverage for missed/phantom credits.
process.env.NODE_ENV = "test";
const { diffTransactions } = require("../../services/reconciliation");

describe("Reconciliation — diffTransactions", () => {
  const dbDonations = [
    { _id: "d1", amount: 25, transactionId: "tx1", transactionRef: "ref1" },
    { _id: "d2", amount: 10.5, transactionId: "tx2", transactionRef: "ref2" },
  ];
  const opts = { idKey: "transactionId", refKey: "transactionRef" };

  it("detects gateway charges missing from the DB (lost webhooks)", () => {
    const gateway = [
      { id: "tx1", ref: "ref1", amount: 25 },
      { id: "tx9", ref: "ref9", amount: 99 },
    ];
    const result = diffTransactions(gateway, dbDonations, opts);
    expect(result.missingInDb).toHaveLength(1);
    expect(result.missingInDb[0].id).toBe("tx9");
    expect(result.amountMismatches).toHaveLength(0);
  });

  it("detects amount mismatches between gateway and DB", () => {
    const gateway = [{ id: "tx2", ref: "ref2", amount: 999 }];
    const result = diffTransactions(gateway, dbDonations, opts);
    expect(result.missingInDb).toHaveLength(0);
    expect(result.amountMismatches).toHaveLength(1);
    expect(result.amountMismatches[0].dbAmount).toBe(10.5);
  });

  it("matches on ref when id is absent (Paystack-style)", () => {
    const gateway = [{ id: "unknown-gateway-id", ref: "ref1", amount: 25 }];
    const result = diffTransactions(gateway, dbDonations, opts);
    expect(result.missingInDb).toHaveLength(0);
  });

  it("tolerates sub-penny rounding differences", () => {
    const gateway = [{ id: "tx2", ref: "ref2", amount: 10.500001 }];
    const result = diffTransactions(gateway, dbDonations, opts);
    expect(result.amountMismatches).toHaveLength(0);
  });

  it("handles empty inputs", () => {
    expect(diffTransactions([], [], opts)).toEqual({ missingInDb: [], amountMismatches: [] });
  });
});
