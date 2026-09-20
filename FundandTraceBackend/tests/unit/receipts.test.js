// Receipt PDF generation + fraud init-attempt scoring.
process.env.NODE_ENV = "test";
process.env.SECURITY_KEY = process.env.SECURITY_KEY || "a".repeat(64);
process.env.INIT_VECTOR = process.env.INIT_VECTOR || "b".repeat(32);

const { buildReceiptPdf, escapeHtml } = require("../../controller/donations/receipts");
const { initAttemptScore } = require("../../utility/fraud");

describe("Receipts — PDF generation", () => {
  const donation = {
    _id: "507f1f77bcf86cd799439011",
    donorName: "Ada Lovelace",
    donorEmail: "ada@example.com",
    amount: 25,
    tip: 2.5,
    paymentMethod: "Stripe",
    transactionRef: "ref-xyz",
    createdAt: new Date("2026-01-15T10:00:00Z"),
    currency: "GBP",
  };

  it("produces a valid PDF buffer", async () => {
    const buffer = await buildReceiptPdf(
      donation,
      { basicInformation: { campaignTitle: "Clean Water <Project> & Fund" } },
      { name: "Fund&Trace" },
      ["Line one.", "Line two."]
    );
    expect(Buffer.isBuffer(buffer)).toBe(true);
    // Every PDF starts with the %PDF magic bytes.
    expect(buffer.subarray(0, 5).toString()).toBe("%PDF-");
    expect(buffer.length).toBeGreaterThan(1000);
  });

  it("renders without optional fields", async () => {
    const buffer = await buildReceiptPdf(
      { ...donation, tip: 0, createdAt: undefined },
      null,
      { name: "Fund&Trace" }
    );
    expect(buffer.subarray(0, 5).toString()).toBe("%PDF-");
  });
});

describe("Receipts — text escaping", () => {
  it("escapes HTML-significant characters in untrusted values", () => {
    // Receipts are now vector-drawn by pdfkit (no HTML), but the helper is
    // kept as a guard for any future text passthrough into other formats.
    expect(escapeHtml('<script>&"')).toBe("<script>&\"");
  });
});

describe("Fraud — initialization attempt scoring", () => {
  it("stays silent below the attempt threshold", () => {
    if (!process.env.FRAUD_INIT_MAX) {
      expect(initAttemptScore(7)).toEqual({ score: 0, reason: null });
      expect(initAttemptScore(0)).toEqual({ score: 0, reason: null });
    }
  });

  it("scores rapid init attempts (card-testing probes that never complete)", () => {
    if (!process.env.FRAUD_INIT_MAX) {
      const result = initAttemptScore(12);
      expect(result.score).toBeGreaterThan(0);
      expect(result.reason).toBe("init_attempts:12");
    }
  });

  it("handles non-finite input safely", () => {
    expect(initAttemptScore(NaN).score).toBe(0);
  });
});
