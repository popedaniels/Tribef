// nodemailer 10 upgrade (security fix) + SMTP_URL support.
const nodemailer = require("nodemailer");

describe("mailing", () => {
  afterEach(() => delete process.env.SMTP_URL);

  it("nodemailer 10 keeps the createTransport/sendMail API the app uses", async () => {
    const t = nodemailer.createTransport({ jsonTransport: true });
    const info = await t.sendMail({ from: "a@fundandtrace.com", to: "b@example.com", subject: "Receipt", html: "<p>Thanks</p>" });
    expect(JSON.parse(info.message)).toMatchObject({ subject: "Receipt", to: [{ address: "b@example.com" }] });
  });

  it("uses SMTP_URL when set, and reuses one pooled transport", async () => {
    process.env.SMTP_URL = "smtp://user:pass@smtp.example.com:587";
    jest.resetModules();
    const { createTransporter } = require("../../services/mailing");
    const a = await createTransporter();
    const b = await createTransporter();
    expect(a).toBe(b);
    expect(a.options.host).toBe("smtp.example.com");
  });
});
