// Regression for the load-test finding: with many concurrent webhooks on one
// campaign, appendEntry lost ~1 in 3 entries (retries exhausted on seq
// collisions) while balances were still credited. Every entry must land,
// in one valid chain, even with a second "instance" racing for seqs.
const mockDb = { entries: [], outbox: [] };
const tick = () => new Promise((r) => setImmediate(r));
const dup = () => Object.assign(new Error("E11000 duplicate key"), { code: 11000 });

jest.mock("../../models/ledgerEntryModel", () => ({
  LedgerEntry: {
    findOne: (q) => {
      const rows = () => mockDb.entries.filter((e) => String(e.campaignId) === String(q.campaignId) && (!q.refId || (e.refId === q.refId && e.type === q.type)));
      const p = (async () => { await tick(); return q.refId ? rows()[0] || null : null; })();
      p.sort = async () => { await tick(); return rows().sort((a, b) => b.seq - a.seq)[0] || null; };
      return p;
    },
    create: async (e) => {
      await tick();
      const same = mockDb.entries.filter((x) => String(x.campaignId) === String(e.campaignId));
      if (same.some((x) => x.seq === e.seq) || same.some((x) => x.refId === e.refId && x.type === e.type)) throw dup();
      mockDb.entries.push({ ...e });
      return e;
    },
  },
}));
jest.mock("../../models/ledgerOutboxModel", () => ({
  LedgerOutbox: {
    find: () => ({ sort: () => ({ limit: () => ({ lean: async () => mockDb.outbox.filter(Boolean) }) }) }),
    updateOne: async (q, u) => { if (!mockDb.outbox.find((o) => o.refId === q.refId)) mockDb.outbox.push({ _id: q.refId, ...q, ...u.$setOnInsert }); },
    deleteOne: async (q) => { mockDb.outbox = mockDb.outbox.filter((o) => o._id !== q._id); },
  },
}));

const ledger = require("../../services/ledger");

beforeEach(() => {
  mockDb.entries = [];
  mockDb.outbox = [];
});

it("records every one of 200 concurrent credits (3 deliveries each) exactly once, in a valid chain", async () => {
  const calls = [];
  for (let i = 0; i < 200; i += 1) for (let k = 0; k < 3; k += 1) calls.push(ledger.appendEntry({ campaignId: "c1", type: "credit", amount: 10 + (i % 5), currency: "NGN", refId: `paystack:r${i}` }));
  await Promise.all(calls);
  const chain = mockDb.entries.filter((e) => e.campaignId === "c1").sort((a, b) => a.seq - b.seq);
  expect(chain).toHaveLength(200);
  expect(ledger.verifyEntries(chain).valid).toBe(true);
  expect(mockDb.outbox).toHaveLength(0);
});

it("survives another instance writing to the same chain at the same time", async () => {
  // Simulate a second process: it appends directly, outside this process's queue.
  const other = (async () => {
    for (let i = 0; i < 40; i += 1) {
      const last = mockDb.entries.filter((e) => e.campaignId === "c2").sort((a, b) => b.seq - a.seq)[0];
      const e = { campaignId: "c2", seq: last ? last.seq + 1 : 1, type: "credit", amount: 1, currency: "NGN", refId: `other:${i}`, memo: "", at: new Date(), prevHash: last ? last.hash : ledger.GENESIS };
      e.hash = ledger.hashEntry(e);
      if (!mockDb.entries.some((x) => x.campaignId === "c2" && x.seq === e.seq)) mockDb.entries.push(e);
      await tick();
    }
  })();
  const mine = Array.from({ length: 60 }, (_, i) => ledger.appendEntry({ campaignId: "c2", type: "credit", amount: 2, currency: "NGN", refId: `mine:${i}` }));
  await Promise.all([other, ...mine]);
  await ledger.drainOutbox();
  const chain = mockDb.entries.filter((e) => e.campaignId === "c2").sort((a, b) => a.seq - b.seq);
  expect(chain.filter((e) => e.refId.startsWith("mine:"))).toHaveLength(60);
  expect(ledger.verifyEntries(chain).valid).toBe(true);
});
