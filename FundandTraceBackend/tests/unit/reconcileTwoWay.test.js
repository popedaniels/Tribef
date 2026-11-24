const mockStore = { donations: [], campaigns: [], reports: [] };
jest.mock("../../models/donationsModel", () => ({
  Donations: { find: () => ({ select: () => ({ lean: () => ({ maxTimeMS: async () => mockStore.donations }) }) }) },
}));
jest.mock("../../models/campaignModel", () => ({ Campaign: { find: () => ({ select: () => ({ lean: async () => mockStore.campaigns }) }) } }));
jest.mock("../../models/reconciliationReportModel", () => ({ ReconciliationReport: { create: async (r) => mockStore.reports.push(r) } }));
const { reconcileGateway, runReconciliation } = require("../../services/reconciliation");

const now = Date.now();
const hrs = (h) => new Date(now - h * 36e5);
const window = { from: hrs(48), to: new Date(now) };

describe("two-way gateway reconciliation", () => {
  const donations = [
    { _id: "d1", campaignId: "c1", amount: 10000, tip: 0, processingFee: 253.81, transactionId: "ref-1", transactionRef: "ref-1", createdAt: hrs(5) },
    { _id: "d2", campaignId: "c1", amount: 5000, tip: 500, processingFee: 0, transactionId: "ref-2", transactionRef: "ref-2", createdAt: hrs(6) },
    { _id: "d3", campaignId: "c1", amount: 7000, tip: 0, processingFee: 0, transactionId: "ref-3", transactionRef: "ref-3", createdAt: hrs(7) }, // phantom
  ];
  const currencyOf = () => "NGN";

  it("matches Paystack by reference and compares the full charged total (donation + tip + fee)", () => {
    const tx = [
      { id: "4099260516", ref: "ref-1", amount: 10253.81, currency: "NGN", at: hrs(5) },
      { id: "4099260517", ref: "ref-2", amount: 5500, currency: "NGN", at: hrs(6) },
    ];
    const r = reconcileGateway(tx, donations.slice(0, 2), { ...window, currencyOf });
    expect(r.discrepancies).toBe(0);
    expect(r.totals.NGN).toMatchObject({ gatewayCharged: 15753.81, recordedCharged: 15753.81, donated: 15000, tips: 500, fees: 253.81, count: 2 });
  });

  it("finds lost webhooks, phantom credits, wrong amounts and wrong currencies", () => {
    const tx = [
      { id: "1", ref: "ref-1", amount: 10000, currency: "NGN", at: hrs(5) }, // fee not charged
      { id: "2", ref: "ref-2", amount: 5500, currency: "GHS", at: hrs(6) }, // wrong currency
      { id: "9", ref: "ref-9", amount: 2000, currency: "NGN", at: hrs(3) }, // charged, never recorded
    ];
    const r = reconcileGateway(tx, donations, { ...window, currencyOf });
    expect(r.missingInDb.map((m) => m.ref)).toEqual(["ref-9"]);
    expect(r.creditedWithoutPayment.map((m) => m.donationId)).toEqual(["d3"]);
    expect(r.amountMismatches.map((m) => m.donationId)).toEqual(["d1"]);
    expect(r.currencyMismatches.map((m) => m.donationId)).toEqual(["d2"]);
    expect(r.discrepancies).toBe(4);
  });

  it("ignores records near the window edges (webhook lag)", () => {
    const tx = [{ id: "9", ref: "late", amount: 1, currency: "NGN", at: new Date(now - 5 * 60 * 1000) }];
    const fresh = [{ _id: "d9", campaignId: "c1", amount: 1, transactionId: "x", createdAt: new Date(now - 10 * 60 * 1000) }];
    expect(reconcileGateway(tx, fresh, { ...window, currencyOf }).discrepancies).toBe(0);
  });

  it("runs end to end, stores the report and skips unconfigured gateways", async () => {
    mockStore.donations = donations.slice(0, 2);
    mockStore.campaigns = [{ _id: "c1", funding: { currency: "NGN" } }];
    const report = await runReconciliation({
      days: 2,
      notify: false,
      fetchers: {
        stripe: async () => null,
        flutterwave: async () => null,
        paystack: async () => [
          { id: "1", ref: "ref-1", amount: 10253.81, currency: "NGN", at: hrs(5) },
          { id: "2", ref: "ref-2", amount: 5500, currency: "NGN", at: hrs(6) },
        ],
      },
    });
    expect(Object.keys(report.gateways)).toEqual(["paystack"]);
    expect(report.discrepancies).toBe(0);
    expect(mockStore.reports).toHaveLength(1);
  });

  it("reports a gateway it couldn't reach instead of calling it clean", async () => {
    const report = await runReconciliation({ notify: false, fetchers: { stripe: async () => null, flutterwave: async () => null, paystack: async () => { throw new Error("503"); } } });
    expect(report.errors).toEqual([{ gateway: "paystack", error: "503" }]);
  });
});
