// Gift Aid, teams and matched giving, end to end through the Paystack webhook
// against a real MongoDB (CI). Extras are saved as a checkout intent keyed by
// the gateway reference and attached when the donation is credited.
const crypto = require("crypto");
const chai = require("chai");
const chaiHttp = require("chai-http");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const server = require("../../server");
const { Users } = require("../../models/users");
const { Campaign } = require("../../models/campaignModel");
const { Charity } = require("../../models/charity");
const { Donations } = require("../../models/donationsModel");
const { CheckoutIntent } = require("../../models/checkoutIntentModel");
const extras = require("../../services/donationExtras");

chai.use(chaiHttp);
const { expect } = chai;
const SECRET = "sk_test_giving_secret";
const runId = crypto.randomBytes(4).toString("hex");
const ref = (n) => `gv-${runId}-${n}`;
const sign = (b) => crypto.createHmac("sha512", SECRET).update(JSON.stringify(b)).digest("hex");
const cookieFor = (u) => `token=${jwt.sign({ id: String(u._id), email: u.email, sv: 0 }, process.env.TOKEN_SECRET)}`;

describe("Giving: Gift Aid, teams, matching", function () {
  let owner, stranger, charity, campaign, team;
  const pay = (reference, amount) => {
    const body = {
      event: "charge.success",
      data: {
        status: "success", reference, amount: amount * 100, currency: "GBP", channel: "card", paid_at: new Date().toISOString(),
        customer: { first_name: "Jo" },
        metadata: { campaignId: String(campaign._id), donorEmail: `donor-${runId}@example.com`, donorName: "Jo Bloggs", amount: String(amount), tip: "0", fee: "0", anonymous: "false" },
      },
    };
    return chai.request(server).post("/api/donations/paystack-webhook").set("x-paystack-signature", sign(body)).send(body);
  };

  before(async function () {
    if (mongoose.connection.readyState !== 1) return this.skip();
    process.env.PAYSTACK_SECRET = SECRET;
    owner = await Users.create({ email: `owner-${runId}@example.com`, firstName: "O", lastName: "W" });
    stranger = await Users.create({ email: `stranger-${runId}@example.com`, firstName: "S", lastName: "T" });
    charity = await Charity.create({ userId: owner._id, charityName: "Test Trust", hmrcReference: "XR12345", giftAidEnabled: true });
    campaign = await Campaign.create({
      launched: true, suspended: false, charityId: charity._id, organizerId: owner._id,
      funding: { currency: "GBP", amountExpected: 10000 },
      teams: [{ name: "Red Team", slug: "red-team" }],
      matching: { active: true, sponsorName: "Acme Ltd", ratio: 1, cap: 150 },
    });
    team = campaign.teams[0];
  });

  after(async () => {
    if (!campaign) return;
    delete process.env.PAYSTACK_SECRET;
    await Donations.deleteMany({ campaignId: campaign._id });
    await CheckoutIntent.deleteMany({ campaignId: campaign._id });
    await Campaign.deleteOne({ _id: campaign._id });
    await Charity.deleteOne({ _id: charity._id });
    await Users.deleteMany({ _id: { $in: [owner._id, stranger._id] } });
  });

  it("validates Gift Aid input and refuses it on ineligible campaigns", async () => {
    const meta = (ga) => ({ giftAid: { declared: true, firstName: "Jo", lastName: "Bloggs", houseNameOrNumber: "12", postcode: "sw1a1aa", ...ga } });
    const ok = await extras.prepare(meta({}), campaign);
    expect(ok.giftAid.postcode).to.equal("SW1A 1AA");
    expect(ok.giftAid.wording).to.include("Test Trust");
    let err = await extras.prepare(meta({ postcode: "12345" }), campaign).catch((e) => e);
    expect(err.code).to.equal("gift_aid_postcode");
    const ngn = { ...campaign.toObject(), funding: { currency: "NGN" } };
    err = await extras.prepare(meta({}), ngn).catch((e) => e);
    expect(err.code).to.equal("gift_aid_unavailable");
    err = await extras.prepare({ teamId: new mongoose.Types.ObjectId().toString() }, campaign).catch((e) => e);
    expect(err.code).to.equal("unknown_team");
  });

  it("attaches the declaration and team, and matches up to the cap exactly once", async () => {
    const prepared = await extras.prepare(
      { teamId: String(team._id), giftAid: { declared: true, title: "Ms", firstName: "Jo", lastName: "Bloggs", houseNameOrNumber: "12", postcode: "SW1A 1AA" } },
      campaign
    );
    await extras.save(`paystack:${ref(1)}`, campaign._id, prepared);
    expect((await pay(ref(1), 100)).status).to.equal(200);
    expect((await pay(ref(1), 100)).status).to.equal(200); // replayed webhook
    expect((await pay(ref(2), 100)).status).to.equal(200);

    const d1 = await Donations.findOne({ transactionRef: ref(1) }).lean();
    expect(d1.giftAid.declared).to.equal(true);
    expect(d1.giftAid.postcode).to.equal("SW1A 1AA");
    expect(d1.teamId).to.equal(String(team._id));
    expect(d1.matchedAmount).to.equal(100);
    const d2 = await Donations.findOne({ transactionRef: ref(2) }).lean();
    expect(d2.matchedAmount).to.equal(50); // only 50 left under the 150 cap
    expect(d2.giftAid?.declared).to.not.equal(true);

    const c = await Campaign.findById(campaign._id).lean();
    expect(c.matching.pledged).to.equal(150);
    expect(c.funding.amountRaised).to.equal(200); // pledges are NOT escrowed money
  });

  it("shows the leaderboard and matching publicly", async () => {
    const res = await chai.request(server).get(`/api/giving/campaign/${campaign._id}`);
    expect(res).to.have.status(200);
    expect(res.body.data.giftAid.available).to.equal(true);
    expect(res.body.data.teams[0]).to.include({ name: "Red Team", raised: 100, donations: 1 });
    expect(res.body.data.matching).to.include({ sponsorName: "Acme Ltd", pledged: 150, remaining: 0, live: false });
  });

  it("exports Gift Aid in HMRC column order for the charity only, once", async () => {
    const url = `/api/giving/gift-aid/export?charityId=${charity._id}`;
    expect((await chai.request(server).get(url).set("Cookie", cookieFor(stranger))).status).to.equal(403);
    const res = await chai.request(server).get(`${url}&markClaimed=true`).set("Cookie", cookieFor(owner)).buffer(true).parse((r, cb) => {
      let s = "";
      r.on("data", (c) => (s += c));
      r.on("end", () => cb(null, s));
    });
    expect(res).to.have.status(200);
    const lines = res.body.trim().split("\r\n");
    expect(lines[0]).to.include('"Title","First name or initial","Last name","House name or number","Postcode"');
    expect(lines).to.have.length(2);
    expect(lines[1]).to.match(/^"Ms","Jo","Bloggs","12","SW1A 1AA","","","\d\d\/\d\d\/\d\d","100.00"$/);
    const again = await chai.request(server).get(url).set("Cookie", cookieFor(owner));
    expect(again.headers["x-rows"]).to.equal("0");
  });

  it("lets only the organiser add teams", async () => {
    const path = `/api/giving/campaign/${campaign._id}/teams`;
    expect((await chai.request(server).post(path).set("Cookie", cookieFor(stranger)).send({ name: "Blue" })).status).to.be.oneOf([401, 403]);
    const ok = await chai.request(server).post(path).set("Cookie", cookieFor(owner)).send({ name: "Blue Team", captainName: "Sam" });
    expect(ok).to.have.status(201);
    expect(ok.body.data.slug).to.equal("blue-team");
  });
});
