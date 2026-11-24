process.env.TOKEN_SECRET = "test-secret";
process.env.MAINURL = "https://fundandtrace.example";
process.env.BACKENDURL = "https://api.fundandtrace.example";

const mockDb = { jobs: [], donors: [], optOuts: [], request: null, campaign: null };
jest.mock("../../models/donorUpdateModel", () => ({
  DonorUpdate: {
    updateOne: jest.fn(async (q, u) => {
      if (u.$setOnInsert) {
        if (!mockDb.jobs.find((j) => j.key === q.key)) mockDb.jobs.push({ _id: q.key, key: q.key, cursor: "", sent: 0, failed: 0, skippedOptOut: 0, ...u.$setOnInsert });
        return {};
      }
      const j = mockDb.jobs.find((x) => x._id === q._id);
      Object.assign(j, u.$set || {});
      for (const [k, v] of Object.entries(u.$inc || {})) j[k] += v;
      return {};
    }),
    findOneAndUpdate: jest.fn(async (q, u) => {
      const j = mockDb.jobs.find((x) => x.status === "queued");
      if (!j) return null;
      Object.assign(j, u.$set);
      return { ...j };
    }),
  },
  EmailOptOut: {
    distinct: jest.fn(async (_f, q) => mockDb.optOuts.filter((o) => q.email.$in.includes(o.email)).map((o) => o.email)),
    updateOne: jest.fn(async (q) => mockDb.optOuts.push(q)),
  },
}));
jest.mock("../../models/donationsModel", () => ({
  Donations: {
    aggregate: (pipeline) => ({
      option: async () => {
        const after = pipeline[2].$match._id.$gt;
        const limit = pipeline[4].$limit;
        return [...new Set(mockDb.donors.map((e) => e.trim().toLowerCase()))].sort().filter((e) => e > after).slice(0, limit).map((_id) => ({ _id }));
      },
    }),
  },
}));
jest.mock("../../models/fundingRequestModel", () => ({ FundingRequests: { findById: () => ({ lean: async () => mockDb.request }) } }));
jest.mock("../../models/campaignModel", () => ({ Campaign: { findById: () => ({ select: () => ({ lean: async () => mockDb.campaign }) }) } }));

const du = require("../../services/donorUpdates");
const CAMPAIGN = "64b000000000000000000001";

beforeEach(() => {
  mockDb.jobs = [];
  mockDb.optOuts = [];
  mockDb.donors = ["b@x.com", "A@x.com", "a@x.com ", "c@x.com", "not-an-email"];
  mockDb.campaign = { _id: CAMPAIGN, basicInformation: { campaignTitle: "Clinic <roof>" }, funding: { currency: "NGN" } };
  mockDb.request = {
    _id: "fr1",
    amount: 250000,
    currency: "NGN",
    purposeOfFunding: "Roofing sheets & labour",
    disbursement: { amount: 250000, currency: "NGN", dateDisbursed: new Date(), providerStatus: "successful" },
    vendorDisbursement: { isDirectToVendor: true, vendorLegalName: "Ade Roofing Ltd" },
  };
});

describe("donor updates", () => {
  it("queues each event once however many times it is triggered", async () => {
    await du.enqueue("payout", "fr1", CAMPAIGN);
    await du.enqueue("payout", "fr1", CAMPAIGN);
    await du.enqueue("receipt", "fr1", CAMPAIGN);
    expect(mockDb.jobs.map((j) => j.key)).toEqual(["payout:fr1", "receipt:fr1"]);
  });

  it("emails each donor once (deduped, case-insensitive), skips opt-outs, and resumes from its cursor", async () => {
    mockDb.optOuts = [{ email: "c@x.com" }];
    await du.enqueue("payout", "fr1", CAMPAIGN);
    const sent = [];
    const send = async (m) => sent.push(m);
    const first = await du.drain({ batch: 1, send });
    expect(first).toMatchObject({ sent: 1, done: false });
    await du.drain({ batch: 1, send });
    const last = await du.drain({ batch: 5, send });
    expect(last).toMatchObject({ skipped: 1, done: true });
    expect(sent.map((m) => m.to)).toEqual(["a@x.com", "b@x.com"]);
    expect(mockDb.jobs[0]).toMatchObject({ status: "done", sent: 2, skippedOptOut: 1 });
    expect(await du.drain({ send })).toEqual({ idle: true });
  });

  it("writes a clear, escaped payout email with working unsubscribe links", async () => {
    const m = du.render("payout", { campaign: mockDb.campaign, request: mockDb.request, email: "a@x.com" });
    expect(m.subject).toMatch(/NGN\s250,000\.00/);
    expect(m.html).toContain("Clinic &lt;roof&gt;");
    expect(m.html).not.toContain("<roof>");
    expect(m.html).toContain("Ade Roofing Ltd");
    expect(m.html).toContain(`https://fundandtrace.example/campaign/${CAMPAIGN}/tracker`);
    expect(m.headers["List-Unsubscribe"]).toMatch(/^<https:\/\/api\.fundandtrace\.example\/api\/email\/unsubscribe\?/);
    const link = new URL(m.text.match(/campaign: (https:\S+)/)[1]);
    expect(link.origin + link.pathname).toBe("https://fundandtrace.example/unsubscribe");
    expect(du.verifyUnsubscribe(link.searchParams.get("e"), link.searchParams.get("s"), link.searchParams.get("t"))).toBe(true);
  });

  it("rejects forged or retargeted unsubscribe tokens", () => {
    const t = du.unsubscribeToken("a@x.com", CAMPAIGN);
    expect(du.verifyUnsubscribe("a@x.com", CAMPAIGN, t)).toBe(true);
    expect(du.verifyUnsubscribe("b@x.com", CAMPAIGN, t)).toBe(false);
    expect(du.verifyUnsubscribe("a@x.com", "all", t)).toBe(false);
    expect(du.verifyUnsubscribe("a@x.com", CAMPAIGN, "x")).toBe(false);
  });

  it("does not announce a payout that was reversed after being queued", async () => {
    mockDb.request.disbursement.providerStatus = "failed";
    await du.enqueue("payout", "fr1", CAMPAIGN);
    const send = jest.fn();
    const r = await du.drain({ send });
    expect(r.skipped).toBe("payout no longer disbursed");
    expect(send).not.toHaveBeenCalled();
  });

  it("counts a failed send without stopping the batch", async () => {
    await du.enqueue("receipt", "fr1", CAMPAIGN);
    const send = jest.fn(async (m) => {
      if (m.to === "a@x.com") throw new Error("smtp 421");
    });
    const r = await du.drain({ send });
    expect(r).toMatchObject({ sent: 2, failed: 1, done: true });
  });
});
