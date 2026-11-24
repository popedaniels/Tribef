const crypto = require("crypto");
process.env.SECURITY_KEY = "c".repeat(64);
const mockPost = jest.fn();
jest.mock("axios", () => ({ post: (...a) => mockPost(...a) }));
const smile = require("../../services/smileId");

describe("Smile ID adapter", () => {
  beforeEach(() => {
    process.env.SMILE_ID_PARTNER_ID = "1234";
    process.env.SMILE_ID_API_KEY = "key";
    mockPost.mockReset();
  });

  it("signs as documented: base64 HMAC-SHA256(timestamp + partner_id + 'sid_request')", () => {
    const ts = "2026-11-24T00:00:00.000Z";
    expect(smile.sign(ts)).toBe(crypto.createHmac("sha256", "key").update(ts + "1234sid_request").digest("base64"));
  });

  it("sends job type 5 to the sandbox and maps a valid ID + exact name", async () => {
    mockPost.mockResolvedValue({ data: { ResultCode: "1012", ResultText: "ID Number Validated", FirstName: "ADAEZE", LastName: "OBI", SmileJobID: "000123" } });
    const r = await smile.verifyIdNumber({ country: "NG", idType: "NIN_V2", idNumber: "123 4567 8901", firstName: "Adaeze", lastName: "Obi", userId: "u1" });
    const [url, body] = mockPost.mock.calls[0];
    expect(url).toBe("https://testapi.smileidentity.com/v1/id_verification");
    expect(body).toMatchObject({ partner_id: "1234", country: "NG", id_type: "NIN_V2", id_number: "12345678901", partner_params: { job_type: 5, user_id: "u1" } });
    expect(r).toMatchObject({ outcome: "verified", nameMatch: "exact", jobId: "000123" });
  });

  it("reports partial and failed matches", async () => {
    mockPost.mockResolvedValue({ data: { ResultCode: "1012", FirstName: "ADAEZE", LastName: "NWOSU" } });
    expect((await smile.verifyIdNumber({ country: "NG", idType: "BVN", idNumber: "22222222222", firstName: "Adaeze", lastName: "Obi" })).nameMatch).toBe("partial");
    mockPost.mockResolvedValue({ data: { ResultCode: "1013" } });
    expect((await smile.verifyIdNumber({ country: "NG", idType: "BVN", idNumber: "22222222222", firstName: "A", lastName: "B" })).outcome).toBe("not_found");
  });

  it("rejects bad formats and unsupported types before calling Smile ID", async () => {
    await expect(smile.verifyIdNumber({ country: "GH", idType: "GHANA_CARD", idNumber: "12345" })).rejects.toMatchObject({ code: "bad_id_format" });
    await expect(smile.verifyIdNumber({ country: "NG", idType: "PASSPORT", idNumber: "A1" })).rejects.toMatchObject({ code: "unsupported_id" });
    expect(mockPost).not.toHaveBeenCalled();
  });

  it("hashes IDs with a key so the same ID matches but can't be reversed without it", () => {
    const a = smile.idHash("NG", "NIN_V2", "12345678901");
    expect(a).toBe(smile.idHash("NG", "NIN_V2", "123-4567-8901"));
    process.env.SECURITY_KEY = "d".repeat(64);
    expect(smile.idHash("NG", "NIN_V2", "12345678901")).not.toBe(a);
  });
});
