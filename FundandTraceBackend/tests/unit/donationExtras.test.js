jest.mock("../../models/charity", () => ({
  Charity: { findById: jest.fn(() => ({ select: () => ({ lean: async () => global.__charity }) })) },
}));
jest.mock("../../models/checkoutIntentModel", () => ({ CheckoutIntent: { create: jest.fn(async () => ({})) } }));
const extras = require("../../services/donationExtras");
const { _internals } = (() => {
  jest.doMock("../../utility/auth", () => ({ getAuthUserId: () => "" }));
  return require("../../controller/giving");
})();

const campaign = { charityId: "ch1", funding: { currency: "GBP" }, teams: [{ _id: "t1", name: "Red" }] };
const ga = (over = {}) => ({ giftAid: { declared: true, firstName: "Jo", lastName: "Bloggs", houseNameOrNumber: "12", postcode: "ec1a1bb", ...over } });
beforeEach(() => (global.__charity = { charityName: "Test Trust", giftAidEnabled: true, hmrcReference: "XR1" }));

describe("Gift Aid preparation", () => {
  it("normalises UK postcodes to HMRC format", () => {
    expect(extras.normalisePostcode("sw1a1aa")).toBe("SW1A 1AA");
    expect(extras.normalisePostcode(" M1  1AE ")).toBe("M1 1AE");
    expect(extras.normalisePostcode("12345")).toBe("");
  });
  it("stores the exact wording shown and cleans names", async () => {
    const out = await extras.prepare(ga({ lastName: "Smith-Jones", firstName: "=cmd()" }), campaign);
    expect(out.giftAid.wording).toMatch(/^I want to Gift Aid my donation to Test Trust\. I am a UK taxpayer/);
    expect(out.giftAid.lastName).toBe("Smith Jones"); // HMRC: space instead of hyphen
    expect(out.giftAid.firstName).toBe("cmd");
  });
  it("refuses Gift Aid when the charity isn't enabled or the campaign isn't GBP", async () => {
    global.__charity = { charityName: "X", giftAidEnabled: false };
    await expect(extras.prepare(ga(), campaign)).rejects.toMatchObject({ code: "gift_aid_unavailable" });
    global.__charity = { charityName: "X", giftAidEnabled: true, hmrcReference: "XR1" };
    await expect(extras.prepare(ga(), { ...campaign, funding: { currency: "USD" } })).rejects.toMatchObject({ code: "gift_aid_unavailable" });
  });
  it("requires name, house and postcode", async () => {
    await expect(extras.prepare(ga({ lastName: "" }), campaign)).rejects.toMatchObject({ code: "gift_aid_name" });
    await expect(extras.prepare(ga({ houseNameOrNumber: "" }), campaign)).rejects.toMatchObject({ code: "gift_aid_address" });
    await expect(extras.prepare(ga({ postcode: "nope" }), campaign)).rejects.toMatchObject({ code: "gift_aid_postcode" });
  });
  it("accepts known teams only and returns null when nothing was asked for", async () => {
    expect(await extras.prepare({ teamId: "t1" }, campaign)).toEqual({ teamId: "t1", giftAid: null });
    await expect(extras.prepare({ teamId: "nope" }, campaign)).rejects.toMatchObject({ code: "unknown_team" });
    expect(await extras.prepare({}, campaign)).toBeNull();
  });
});

describe("Gift Aid export cells", () => {
  it("neutralises spreadsheet formulas and formats dates DD/MM/YY", () => {
    expect(_internals.csvCell("=HYPERLINK(1)")).toBe(`"'=HYPERLINK(1)"`);
    expect(_internals.csvCell('a"b')).toBe(`"a""b"`);
    expect(_internals.ddmmyy("2026-04-05T23:00:00Z")).toBe("05/04/26");
  });
});
