process.env.SECURITY_KEY = process.env.SECURITY_KEY || "c".repeat(64);
jest.mock("../../models/vendorModel", () => ({ Vendor: {}, VENDOR_CATEGORIES: [] }));
jest.mock("../../models/fundingRequestModel", () => ({ FundingRequests: {} }));
const { _internals } = require("../../controller/vendors");

describe("vendor bank-name matching", () => {
  it.each([
    ["Medserve Nigeria Limited", "MEDSERVE NIG LTD", true],
    ["Lagos University Teaching Hospital", "LAGOS UNIVERSITY TEACHING HOSP", true],
    ["St. Kizito Primary School", "ST KIZITO PRIMARY SCHOOL", true],
    ["Medserve Nigeria Limited", "JOHN OKAFOR", false],
    ["Medserve Nigeria Limited", "", false],
  ])("%s vs %s → %s", (a, b, want) => {
    expect(_internals.namesMatch(a, b)).toBe(want);
  });
});
