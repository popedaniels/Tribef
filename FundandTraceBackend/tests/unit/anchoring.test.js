const mockState = { heads: [], verify: {}, anchors: [], created: null, evidence: null, evidenceVerify: null };

jest.mock("../../models/ledgerEntryModel", () => ({
  LedgerEntry: { aggregate: jest.fn(async () => mockState.heads.map((h) => ({ _id: h.campaignId, seq: h.seq, head: h.head }))) },
}));
jest.mock("../../services/ledger", () => ({
  GENESIS: "0".repeat(64),
  verifyCampaign: jest.fn(async (id) => mockState.verify[id] || { valid: true, headHash: mockState.heads.find((h) => h.campaignId === id)?.head }),
}));
jest.mock("../../models/evidenceModel", () => ({
  EvidenceRecord: { findOne: jest.fn(() => ({ sort: () => ({ select: () => ({ lean: async () => mockState.evidence }) }) })) },
}));
jest.mock("../../services/evidence", () => ({
  EVIDENCE_LEAF_ID: "evidence",
  verifyStoredChain: jest.fn(async () => mockState.evidenceVerify || { valid: true, headHash: mockState.evidence?.hash, headSeq: mockState.evidence?.seq }),
}));
jest.mock("../../models/ledgerAnchorModel", () => {
  const q = (v) => ({ sort: () => ({ lean: async () => v }), lean: async () => v, then: (r) => r(v) });
  return {
    LedgerAnchor: {
      findOne: jest.fn((filter) => {
        if (filter && filter.date && typeof filter.date === "string") return Promise.resolve(mockState.anchors.find((a) => a.date === filter.date) || null);
        const prev = [...mockState.anchors].sort((a, b) => (a.date < b.date ? 1 : -1))[0] || null;
        return q(prev);
      }),
      create: jest.fn(async (doc) => {
        mockState.created = { ...doc, save: jest.fn(async () => {}) };
        return mockState.created;
      }),
    },
  };
});

const a = require("../../services/anchoring");

const h = (s) => a.sha256(s);

describe("Merkle tree", () => {
  it("empty tree is the genesis hash; one leaf is its own root", () => {
    expect(a.merkleRoot([])).toBe("0".repeat(64));
    expect(a.merkleRoot([h("x")])).toBe(h("x"));
  });

  it("produces a valid proof for every leaf, for every tree size 1..13", () => {
    for (let n = 1; n <= 13; n += 1) {
      const leaves = Array.from({ length: n }, (_, i) => h(`leaf${i}`));
      const root = a.merkleRoot(leaves);
      leaves.forEach((leaf, i) => expect(a.verifyProof(leaf, a.merkleProof(leaves, i), root)).toBe(true));
    }
  });

  it("rejects a proof for a changed leaf or a wrong root", () => {
    const leaves = ["a", "b", "c", "d", "e"].map(h);
    const root = a.merkleRoot(leaves);
    const proof = a.merkleProof(leaves, 2);
    expect(a.verifyProof(h("C"), proof, root)).toBe(false);
    expect(a.verifyProof(leaves[2], proof, h("other"))).toBe(false);
  });

  it("separates leaf and node hashing", () => {
    const l = a.leafHash({ campaignId: "c1", seq: 3, head: "ab" });
    expect(l).toBe(h("ft-leaf:v1:c1:3:ab"));
    expect(a.nodeHash("x", "y")).toBe(h("ft-node:v1:xy"));
  });
});

describe("createAnchor", () => {
  beforeEach(() => {
    mockState.heads = [
      { campaignId: "c2", seq: 4, head: h("c2-4") },
      { campaignId: "c1", seq: 9, head: h("c1-9") },
    ];
    mockState.verify = {};
    mockState.anchors = [{ date: "2026-11-20", digest: h("prev-digest") }];
    mockState.created = null;
    mockState.evidence = null;
    mockState.evidenceVerify = null;
  });

  it("commits to every campaign head, chains to the previous anchor and publishes", async () => {
    const publisher = jest.fn(async () => ({ target: "test", ok: true, ref: "ref-1" }));
    const anchor = await a.createAnchor("2026-11-21", { publishers: [publisher] });
    const sorted = [mockState.heads[1], mockState.heads[0]];
    expect(anchor.root).toBe(a.merkleRoot(sorted.map(a.leafHash)));
    expect(anchor.prevDigest).toBe(h("prev-digest"));
    expect(anchor.digest).toBe(h(anchor.message));
    expect(anchor.message).toContain(`root: ${anchor.root}`);
    expect(anchor.leaves.map((l) => l.campaignId)).toEqual(["c1", "c2"]);
    expect(publisher).toHaveBeenCalled();
    expect(anchor.publications.map((p) => p.target)).toEqual(["log", "test"]);
  });

  it("records a failed publication without failing the anchor", async () => {
    const bad = async function publishBroken() {
      throw new Error("network down");
    };
    const anchor = await a.createAnchor("2026-11-21", { publishers: [bad] });
    expect(anchor.publications[1]).toMatchObject({ target: "broken", ok: false, error: "network down" });
  });

  it("refuses to anchor when any chain fails verification", async () => {
    mockState.verify.c2 = { valid: false, brokenAt: 3, reason: "entry content does not match its hash" };
    await expect(a.createAnchor("2026-11-21", { publishers: [] })).rejects.toThrow(/Refusing to anchor/);
    expect(mockState.created).toBeNull();
  });

  it("keeps the original message format when there is no evidence chain", async () => {
    const anchor = await a.createAnchor("2026-11-21", { publishers: [] });
    expect(anchor.message).toContain("campaigns: 2\n");
    expect(anchor.message).not.toContain("evidence");
  });

  it("includes the sealed-evidence chain head as one more leaf", async () => {
    mockState.evidence = { seq: 7, hash: h("ev-7") };
    const anchor = await a.createAnchor("2026-11-21", { publishers: [] });
    expect(anchor.leaves.map((l) => l.campaignId)).toEqual(["c1", "c2", "evidence"]);
    expect(anchor.leaves[2]).toMatchObject({ seq: 7, head: h("ev-7") });
    expect(anchor.message).toContain("campaigns: 2\nevidence records: 7");
  });

  it("refuses to anchor when the evidence chain is broken", async () => {
    mockState.evidence = { seq: 7, hash: h("ev-7") };
    mockState.evidenceVerify = { valid: false, brokenAt: 5, reason: "link does not match its hash" };
    await expect(a.createAnchor("2026-11-21", { publishers: [] })).rejects.toThrow(/Refusing to anchor/);
  });

  it("is idempotent per date", async () => {
    mockState.anchors.push({ date: "2026-11-21", digest: "already" });
    const anchor = await a.createAnchor("2026-11-21", { publishers: [] });
    expect(anchor.digest).toBe("already");
  });
});

describe("publishers", () => {
  const anchor = { date: "2026-11-21", root: "r", prevDigest: "p", digest: h("m"), message: "m", leaves: [] };

  it("GitHub publishing is off without config, and writes .txt + .json when configured", async () => {
    delete process.env.ANCHOR_GITHUB_REPO;
    expect(await a.publishGithub(anchor, { put: jest.fn() })).toBeNull();
    process.env.ANCHOR_GITHUB_REPO = "org/anchors";
    process.env.ANCHOR_GITHUB_TOKEN = "t";
    const put = jest.fn(async () => ({ data: { commit: { html_url: "https://github.com/org/anchors/commit/1" } } }));
    const out = await a.publishGithub(anchor, { put });
    expect(put.mock.calls.map((c) => c[0])).toEqual([
      "https://api.github.com/repos/org/anchors/contents/anchors/2026-11-21.txt",
      "https://api.github.com/repos/org/anchors/contents/anchors/2026-11-21.json",
    ]);
    expect(Buffer.from(put.mock.calls[0][1].content, "base64").toString()).toBe("m");
    expect(out).toMatchObject({ target: "github", ok: true });
    delete process.env.ANCHOR_GITHUB_REPO;
    delete process.env.ANCHOR_GITHUB_TOKEN;
  });

  it("OpenTimestamps produces a detached .ots file for the message digest", async () => {
    process.env.ANCHOR_OPENTIMESTAMPS = "true";
    const post = jest.fn(async () => ({ data: Buffer.from([0xf0, 0x10]) }));
    const out = await a.publishOpenTimestamps(anchor, { post });
    const ots = Buffer.from(out.proof, "base64");
    expect(ots.subarray(0, 31).toString("latin1")).toContain("OpenTimestamps");
    expect(ots[31]).toBe(0x01); // major version
    expect(ots[32]).toBe(0x08); // sha256 file hash op
    expect(ots.subarray(33, 65).toString("hex")).toBe(anchor.digest);
    expect(post.mock.calls[0][1].toString("hex")).toBe(anchor.digest);
    delete process.env.ANCHOR_OPENTIMESTAMPS;
  });
});
