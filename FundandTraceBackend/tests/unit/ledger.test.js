const { verifyEntries, hashEntry, GENESIS } = require("../../services/ledger");

const build = (rows) => {
  let prevHash = GENESIS;
  return rows.map((r, i) => {
    const e = { campaignId: "c1", seq: i + 1, currency: "GBP", memo: "", at: new Date(Date.UTC(2026, 0, i + 1)), prevHash, ...r };
    e.hash = hashEntry(e);
    prevHash = e.hash;
    return e;
  });
};

const chain = () =>
  build([
    { type: "credit", amount: 100, refId: "stripe:cs_1" },
    { type: "credit", amount: 50, refId: "flw:2" },
    { type: "payout", amount: -120, refId: "payout:fr1:1" },
    { type: "refund", amount: -10, refId: "refund:d2" },
  ]);

describe("hash-chained ledger", () => {
  it("verifies an untouched chain and reports the escrow balance", () => {
    const result = verifyEntries(chain());
    expect(result).toMatchObject({ valid: true, length: 4, balance: 20 });
    expect(result.headHash).toMatch(/^[0-9a-f]{64}$/);
  });

  it("detects an edited amount", () => {
    const entries = chain();
    entries[1].amount = 5;
    expect(verifyEntries(entries)).toMatchObject({ valid: false, brokenAt: 2 });
  });

  it("detects a deleted entry", () => {
    const entries = chain();
    entries.splice(2, 1);
    expect(verifyEntries(entries).valid).toBe(false);
  });

  it("detects a re-hashed edit (later entries no longer link)", () => {
    const entries = chain();
    entries[0].amount = 1000;
    entries[0].hash = hashEntry(entries[0]);
    expect(verifyEntries(entries)).toMatchObject({ valid: false, brokenAt: 2 });
  });

  it("treats an empty chain as valid", () => {
    expect(verifyEntries([])).toMatchObject({ valid: true, length: 0, balance: 0 });
  });
});
