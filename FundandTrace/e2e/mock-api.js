// Mock of the public API for end-to-end tests (Playwright) and local UI work.
// Realistic campaigns, a real hash-chained ledger and anchor proofs (using
// the backend's own code), and the REAL fee schedule route, so the donate
// page is tested against the same fee rules the server enforces.
//   node e2e/mock-api.js            (port 5000, or E2E_API_PORT)
const path = require("path");
const http = require("http");
const B = path.resolve(__dirname, "../../FundandTraceBackend");
const express = require(path.join(B, "node_modules/express"));
const { hashEntry, GENESIS } = require(path.join(B, "services/ledger.js"));
const { computeTransparencyScore } = require(path.join(B, "services/transparency.js"));

const day = 864e5, now = Date.now();
const ago = (d) => new Date(now - d * day).toISOString();
const C = (id, o) => ({
  _id: id, launched: true, suspended: false, campaignType: "individual", createdAt: ago(o.age || 20),
  organizer: o.organizer, organizerId: "u" + id.slice(-6), category: o.category,
  basicInformation: { campaignTitle: o.title, campaignTagline: o.tagline, campaignImage: o.img, duration: 60, locationCountry: o.country, locationState: o.state },
  content: { story: o.story },
  funding: { currency: o.cur, amountExpected: o.goal, amountRaised: o.raised, availableBalance: o.raised - (o.paid || 0) },
  settings: { publicUpdates: true },
  updates: o.updates || [], comments: o.comments || [],
  disputeGovernance: { isLocked: !!o.frozen, lockReason: o.frozen ? "3 donor reports are being reviewed" : "", disputeCount: o.frozen ? 3 : 0 },
  donations: o.donations || [],
});
const donors = (cur, list) => list.map(([n, a, d]) => ({ donorName: n, amount: a, tip: 0, currency: cur, createdAt: ago(d), anonymous: n === "Anonymous" }));

const MAIN = "60f7117f2ee78d31b4de0f7d";
const campaigns = [
  C(MAIN, { title: "Theatre equipment for Ikeja Children's Ward", tagline: "Help Lagos State University Teaching Hospital replace its paediatric anaesthesia machine.", img: "/images/stories/medical_hope.jpg", category: "medical", organizer: "Dr. Amaka Okafor", country: "Nigeria", state: "Lagos", cur: "NGN", goal: 18500000, raised: 12640000, paid: 6200000, age: 34,
    story: ["Our paediatric theatre at LASUTH treats around 40 children a week. Since March, our only anaesthesia machine has failed three times mid-procedure, and we now refer complex cases to other hospitals — a 3-hour journey for many families.",
      "We are raising ₦18.5m for a refurbished Dräger Fabius machine, installation and two years of servicing. Money is held in escrow and paid in three stages directly to the supplier, Medserve Nigeria Ltd, against their invoices. You can follow every payment on the tracker.",
      "Stage 1 (deposit) has been paid and the invoice is published. Stage 2 is paid on delivery, Stage 3 after commissioning and staff training."],
    updates: [{ story: "Stage 1 deposit paid to Medserve. Invoice uploaded to the tracker. Delivery is scheduled for mid-December.", datePosted: ago(6) }, { story: "We've passed 50% — thank you! Medserve has confirmed the machine is reserved for us.", datePosted: ago(15) }],
    comments: [{ name: "Tunde A.", comment: "My son was treated here in 2023. The nurses are incredible. Glad to see the invoices.", time: ago(3) }, { name: "Grace E.", comment: "Shared with my church group 🙏", time: ago(9) }],
    donations: donors("NGN", [["Chinedu Eze", 250000, 0.2], ["Anonymous", 50000, 0.6], ["Folake Adeyemi", 100000, 1], ["Ibrahim Musa", 20000, 2], ["Ngozi Obi", 500000, 3], ["Anonymous", 15000, 4], ["Emeka Nwosu", 75000, 5]]) }),
  C("60f7117f2ee78d31b4de0f7e", { title: "Solar borehole for Mukono village school", tagline: "Clean water for 620 pupils at St. Kizito Primary, Uganda.", img: "/images/stories/water_story.jpg", category: "education", organizer: "Joseph Ssempa", country: "Uganda", state: "Mukono", cur: "USD", goal: 14000, raised: 11870, age: 41, story: ["Pupils currently walk 2 km to fetch water."], donations: donors("USD", [["Anna K.", 200, 1]]) }),
  C("60f7117f2ee78d31b4de0f7f", { title: "Laptops for the Kibera Girls Code Club", tagline: "20 refurbished laptops so 80 girls can learn to code after school.", img: "/images/stories/tech_girls.jpg", category: "education", organizer: "Wanjiru Kamau", country: "Kenya", state: "Nairobi", cur: "KES", goal: 1200000, raised: 384000, age: 12, story: ["We share 4 laptops between 80 girls."] }),
  C("60f7117f2ee78d31b4de0f80", { title: "Rebuild after the Accra floods", tagline: "Replace bedding, school kits and cookware for 45 displaced families.", img: "/images/oldStories.jpg", category: "emergency", organizer: "Kwame Mensah", country: "Ghana", state: "Greater Accra", cur: "GHS", goal: 90000, raised: 71250, age: 8, story: ["June's floods displaced 45 families in Kaneshie."] }),
  C("60f7117f2ee78d31b4de0f81", { title: "Solar panels for Hope Community Clinic", tagline: "Keep vaccines cold and lights on through power cuts.", img: "/images/stories/solar_eco.jpg", category: "nonprofit", organizer: "Hope Clinic Trust", country: "United Kingdom", state: "London", cur: "GBP", goal: 25000, raised: 9400, age: 27, frozen: false, story: ["Our partner clinic in Kaduna loses power 6 hours a day."] }),
  C("60f7117f2ee78d31b4de0f82", { title: "Mrs. Bello's kidney transplant", tagline: "Surgery is booked at Reddington Hospital for January.", img: "/images/master_hero.jpg", category: "medical", organizer: "Yusuf Bello", country: "Nigeria", state: "Abuja", cur: "NGN", goal: 32000000, raised: 7300000, age: 5, story: ["My mother needs a transplant."] }),
];
const VENDORS = [
  { id: "70f7117f2ee78d31b4de0a01", legalName: "Medserve Nigeria Limited", tradingName: "Medserve", category: "Supplier", country: "NG", city: "Lagos", website: "https://example.com", description: "Medical equipment supply, installation and servicing.", registrationNumber: "RC 482913", registryUrl: "https://search.cac.gov.ng", verifiedAt: ago(40), bank: { bankName: "GTBank", last4: "6789", currency: "NGN" }, stats: { payouts: 1, totals: { NGN: 6200000 } } },
  { id: "70f7117f2ee78d31b4de0a02", legalName: "Lagos State University Teaching Hospital", tradingName: "LASUTH", category: "Hospital / Healthcare Provider", country: "NG", city: "Ikeja", registrationNumber: "LSG/HB/0021", verifiedAt: ago(60), bank: { bankName: "Zenith Bank", last4: "1044", currency: "NGN" }, stats: { payouts: 0, totals: {} } },
  { id: "70f7117f2ee78d31b4de0a03", legalName: "Davis & Shirtliff Kenya Ltd", category: "Licensed Contractor", country: "KE", city: "Nairobi", registrationNumber: "C.12741", verifiedAt: ago(20), bank: { bankName: "KCB", last4: "2231", currency: "KES" }, stats: { payouts: 2, totals: { KES: 845000 } } },
];
const byId = Object.fromEntries(campaigns.map((c) => [c._id, c]));

const fundingRequests = [
  { _id: "fr1", campaignId: MAIN, requestId: "FR-0001", fundingType: "Third Party", amount: 6200000, currency: "NGN", status: "Approved", purposeOfFunding: "Stage 1 deposit (33%) to Medserve Nigeria Ltd for a refurbished Dräger Fabius GS anaesthesia machine.", createdAt: ago(10), thirdPartyAccountName: "Medserve Nigeria Ltd",
    disbursement: { amount: 6200000, currency: "NGN", dateDisbursed: ago(7), provider: "paystack", providerStatus: "successful", receipt: "https://res.cloudinary.com/demo/image/upload/sample.jpg", receiptUploadedAt: ago(6) } },
  { _id: "fr2", campaignId: MAIN, requestId: "FR-0002", fundingType: "Third Party", amount: 6200000, currency: "NGN", status: "Pending", purposeOfFunding: "Stage 2: payment on delivery of the machine to LASUTH.", createdAt: ago(1) },
];

// ledger with real hashes
function ledgerFor(c) {
  const out = []; let prev = GENESIS, seq = 0;
  const add = (type, amount, refId, memo, at) => { const e = { campaignId: c._id, seq: ++seq, type, amount, currency: c.funding.currency, refId, memo, at, prevHash: prev }; e.hash = hashEntry(e); prev = e.hash; out.push(e); };
  const ev = (c.donations || []).map((d, i) => ["credit", d.amount, `paystack:T${100200 + i}`, "Donation", d.createdAt]);
  if (c._id === MAIN) {
    // earlier donations that funded stage 1
    [["credit", 4200000, "paystack:T100100", "Donation", ago(30)], ["credit", 3300000, "paystack:T100101", "Donation", ago(21)], ["credit", 4130000, "flw:FLW-88213", "Donation", ago(12)]].forEach((e) => ev.push(e));
    ev.push(["payout", -6200000, "payout:fr1:1", "Stage 1 deposit to Medserve Nigeria Ltd", ago(7)]);
  }
  ev.sort((a, b) => new Date(a[4]) - new Date(b[4])).forEach((e) => add(...e));
  return out;
}
const organizer = { firstName: "Amaka", lastName: "Okafor", identity: { status: "verified" }, kyc: { status: "verified" }, identityVerification: { status: "verified" } };

const A = require(path.join(B, "services/anchoring.js"));
const anchorDate = new Date(now - day).toISOString().slice(0, 10);
const anchorLeaves = campaigns
  .map((c) => { const e = ledgerFor(c); return e.length ? { campaignId: c._id, seq: e[e.length - 1].seq, head: e[e.length - 1].hash } : null; })
  .filter(Boolean)
  .sort((a, b) => (a.campaignId < b.campaignId ? -1 : 1));
const anchorRoot = A.merkleRoot(anchorLeaves.map(A.leafHash));
const anchorMsg = A.anchorMessage({ date: anchorDate, root: anchorRoot, prevDigest: "0".repeat(64), leafCount: anchorLeaves.length });
const anchorDoc = { date: anchorDate, root: anchorRoot, prevDigest: "0".repeat(64), digest: A.sha256(anchorMsg), message: anchorMsg, leafCount: anchorLeaves.length, leaves: anchorLeaves, createdAt: new Date().toISOString(), publications: [{ target: "github", ok: true, ref: "https://github.com/fundandtrace/ledger-anchors/commit/example" }] };

const { organiserTodos } = require(path.join(B, "services/organiserTodos.js"));
const { evaluatePayout } = require(path.join(B, "services/payoutReview.js"));
process.env.PAYSTACK_SECRET = process.env.PAYSTACK_SECRET || "sk_test_mock";
const mainC = { ...byId[MAIN], launched: true, funding: { ...byId[MAIN].funding, bankCode: "058" } };
const frPaidLate = { ...fundingRequests[0], disbursement: { ...fundingRequests[0].disbursement, receipt: "", dateDisbursed: ago(17) } };

const routes = [
  [/^\/api\/fundingRequests\/me\/todos/, () => ({ data: organiserTodos({ user: { identityVerification: { status: "verified" } }, campaigns: [{ ...mainC, updates: [] }], fundingRequests: [frPaidLate, { _id: "fr9", campaignId: MAIN, status: "Declined", declineReason: "The quote isn't on the supplier's letterhead. Please upload the signed quote from Medserve.", createdAt: ago(2) }] }) })],
  [/^\/api\/admin\/fundingRequest\/([\w]+)\/review/, () => { const r = evaluatePayout({ fr: { ...fundingRequests[1], fundingType: "Third Party", thirdPartyBankCode: "058", proofOfFunding: "https://res.cloudinary.com/demo/image/upload/sample.jpg" }, campaign: mainC, organizer: { identityVerification: { status: "verified" }, createdAt: ago(200) }, history: [frPaidLate, fundingRequests[1]], donations: { total: 214, flagged: 2 } }); return { data: { ...r, campaign: { _id: MAIN, title: mainC.basicInformation.campaignTitle, organizer: mainC.organizer, currency: "NGN", raised: mainC.funding.amountRaised, available: mainC.funding.availableBalance, goal: mainC.funding.amountExpected }, history: [frPaidLate, fundingRequests[1]].map((h) => ({ _id: h._id, status: h.status, amount: h.amount, createdAt: h.createdAt, paidAt: h.disbursement?.dateDisbursed || null, hasReceipt: Boolean(h.disbursement?.receipt), purpose: h.purposeOfFunding, current: h._id === "fr2" })) } }; }],
  [/^\/api\/admin\/fundingRequest\/([\w]+)$/, () => ({ data: { ...fundingRequests[1], fundingType: "Third Party", proofOfFunding: "/images/stories/medical_hope.jpg", campaign: mainC } })],
  [/^\/api\/campaigns\/u1/, () => ({ data: { active: [mainC], drafts: [] } })],
  [/^\/api\/ledger\/anchors\/(latest|\d{4}-\d{2}-\d{2})/, (m) => (m[1] === "latest" || m[1] === anchorDate ? { data: anchorDoc } : [404, {}])],
  [/^\/api\/ledger\/([a-f0-9]{24})\/proof/, (m) => { const hs = anchorLeaves.map(A.leafHash); const i = anchorLeaves.findIndex((l) => l.campaignId === m[1]); return { data: i < 0 ? { included: false, anchor: anchorDoc } : { included: true, anchor: anchorDoc, leaf: anchorLeaves[i], leafHash: hs[i], path: A.merkleProof(hs, i) } }; }],
  [/^\/api\/campaigns\/?(\?.*)?$/, () => ({ data: campaigns.map(({ donations, ...c }) => c) })],
  [/^\/api\/campaigns\/campaign\/([a-f0-9]+)/, (m) => byId[m[1]] ? { data: byId[m[1]] } : [404, { error: "Campaign not found" }]],
  [/^\/api\/campaigns\/([a-f0-9]+)\/transparency/, (m) => byId[m[1]] ? { data: computeTransparencyScore({ campaign: byId[m[1]], organizer, fundingRequests: fundingRequests.filter((f) => f.campaignId === m[1]).map((f) => ({ ...f, dateDisbursed: f.disbursement?.dateDisbursed, disbursement: f.disbursement })), now: new Date() }) } : [404, {}]],
  [/^\/api\/ledger\/([a-f0-9]+)\/verify/, (m) => ({ data: { ok: true, count: ledgerFor(byId[m[1]]).length } })],
  [/^\/api\/ledger\/([a-f0-9]{24})(?:\?|$)/, (m) => { const e = byId[m[1]] ? ledgerFor(byId[m[1]]) : []; return { data: { entries: e, count: e.length, page: 1, limit: 500 } }; }],
  [/^\/api\/fundingRequests\/campaignTracker\/([a-f0-9]+)/, (m) => { const c = byId[m[1]]; if (!c) return [404, {}]; const all = fundingRequests.filter((f) => f.campaignId === c._id); return { data: { campaign: c, user: organizer, allFundingRequests: all, approvedFundingRequests: all.filter((f) => f.status === "Approved") } }; }],
  [/^\/api\/giving\/campaign\/([a-f0-9]{24})/, (m) => (m[1] === "60f7117f2ee78d31b4de0f81"
    ? { data: { giftAid: { available: true, charityName: "Hope Clinic Trust", wording: "I want to Gift Aid my donation to Hope Clinic Trust. I am a UK taxpayer and understand that if I pay less Income Tax and/or Capital Gains Tax than the amount of Gift Aid claimed on all my donations in that tax year it is my responsibility to pay any difference." },
        teams: [{ id: "t1", name: "Kaduna Runners", slug: "kaduna-runners", goal: 5000, raised: 3120, donations: 41 }, { id: "t2", name: "St Mary's Parish", slug: "st-marys", goal: 0, raised: 1850, donations: 22 }],
        matching: { live: true, sponsorName: "Northwind Energy", ratio: 1, cap: 5000, pledged: 2300, received: 1000, remaining: 2700 } } }
    : { data: { giftAid: { available: false }, teams: [], matching: null } })],
  [/^\/api\/vendors\/([a-f0-9]{24})/, (m) => (m[1] === "70f7117f2ee78d31b4de0a01" ? { data: { ...VENDORS[0], payouts: [{ campaignId: MAIN, campaignTitle: "Theatre equipment for Ikeja Children's Ward", amount: 6200000, currency: "NGN", date: ago(7), purpose: "Stage 1 deposit (33%) for a refurbished Dräger Fabius GS anaesthesia machine." }] } } : [404, {}])],
  [/^\/api\/vendors\/?(\?.*)?$/, () => ({ data: { vendors: VENDORS, total: VENDORS.length, page: 1 } })],
  [/^\/api\/admin\/metrics/, () => ({ data: { donations: { donations: 412, uniqueDonors: 355, daily: Array.from({ length: 30 }, (_, i) => ({ date: new Date(now - (29 - i) * day).toISOString().slice(0, 10), count: Math.round(8 + 6 * Math.sin(i / 3) + (i % 7 === 5 ? 9 : 0)) })),
    byRail: [ { rail: "paystack", currency: "NGN", donations: 301, donated: 9030000, avgDonation: 30000, tips: 182000, feesCollected: 171500, processorCost: 171320, revenue: 353500, margin: 182180, marginPerDonation: 605.25, takeRate: 2.02, tipRate: 21.6, coverFeeRate: 100, matched: 0, giftAid: 0 },
      { rail: "stripe", currency: "GBP", donations: 88, donated: 4210, avgDonation: 47.84, tips: 96, feesCollected: 31.2, processorCost: 81.15, revenue: 127.2, margin: 46.05, marginPerDonation: 0.52, takeRate: 1.09, tipRate: 14.8, coverFeeRate: 38.6, matched: 1800, giftAid: 41 },
      { rail: "flutterwave", currency: "KES", donations: 23, donated: 152000, avgDonation: 6608.7, tips: 0, feesCollected: 4520, processorCost: 4480, revenue: 4520, margin: 40, marginPerDonation: 1.74, takeRate: 0.03, tipRate: 0, coverFeeRate: 100, matched: 0, giftAid: 0 } ] },
    campaigns: { launched: 14, goalReached: 3, frozenNow: 1, withDonations: 37 }, refunds: { count: 2 }, payouts: [{ currency: "NGN", count: 4, amount: 12400000, toVerifiedVendors: 3 }],
    notes: ["Processor cost is estimated from published rates; Stripe is costed at the UK domestic rate, so foreign-card costs are understated.", "Refunded donations are excluded. Amounts are per currency and never added across currencies."] } })],
  [/^\/api\/donations\/refund-policy/, () => ({ data: { enabled: true, windowDays: 30 } })],
  [/^\/api\/categor/, () => ({ data: ["medical", "emergency", "education", "nonprofit", "memorial"].map((n) => ({ name: n, _id: n })) })],
];


const app = express();
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", req.headers.origin || "http://localhost:3000");
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader("Access-Control-Allow-Headers", "content-type,authorization");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,PATCH,DELETE,OPTIONS");
  if (req.method === "OPTIONS") return res.status(204).end();
  return next();
});
app.use("/api/fees", require(path.join(B, "routes/fees")));
app.use((req, res) => {
  for (const [re, fn] of routes) {
    const m = req.url.match(re);
    if (m && req.method === "GET") {
      let r = fn(m);
      let code = 200;
      if (Array.isArray(r)) [code, r] = r;
      return res.status(code).json(r);
    }
  }
  return res.status(401).json({ status: 401, error: "Unauthorized" });
});
const port = Number(process.env.E2E_API_PORT || 5000);
http.createServer(app).listen(port, () => console.log(`mock api on ${port}`));
