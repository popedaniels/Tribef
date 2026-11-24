// nodemailer 10 upgrade (security fix), SMTP_URL support, and the retry outbox.
const nodemailer = require("nodemailer");

describe("mailing", () => {
  afterEach(() => {
    delete process.env.SMTP_URL;
    delete process.env.EMAIL_FROM;
    jest.resetModules();
    jest.dontMock("nodemailer");
    jest.dontMock("../../models/mailOutboxModel");
  });

  it("nodemailer 10 keeps the createTransport/sendMail API the app uses", async () => {
    const t = nodemailer.createTransport({ jsonTransport: true });
    const info = await t.sendMail({ from: "a@fundandtrace.com", to: "b@example.com", subject: "Receipt", html: "<p>Thanks</p>" });
    expect(JSON.parse(info.message)).toMatchObject({ subject: "Receipt", to: [{ address: "b@example.com" }] });
  });

  function setup({ fail } = {}) {
    process.env.SMTP_URL = "smtp://user:pass@smtp.example.com:587";
    const sent = [];
    const created = [];
    const queued = [];
    jest.doMock("nodemailer", () => ({
      createTransport: (url) => {
        created.push(url);
        return {
          sendMail: async (m) => {
            if (fail?.length) throw fail.shift();
            sent.push(m);
            return { messageId: "m1" };
          },
        };
      },
    }));
    jest.doMock("../../models/mailOutboxModel", () => ({
      MailOutbox: {
        create: async (d) => queued.push({ ...d, _id: String(queued.length), status: "queued" }),
        findOneAndUpdate: async (q) => {
          const j = queued.find((x) => x.status === "queued" && x.nextAt <= q.$or[0].nextAt.$lte);
          if (j) j.status = "sending";
          return j || null;
        },
        updateOne: async (q, u) => Object.assign(queued.find((x) => x._id === q._id), u.$set),
      },
    }));
    const mongoose = require("mongoose");
    Object.defineProperty(mongoose.connection, "readyState", { value: 1, configurable: true });
    return { mailing: require("../../services/mailing"), sent, created, queued };
  }

  it("uses SMTP_URL with one pooled transport, and sends from EMAIL_FROM", async () => {
    process.env.EMAIL_FROM = "Fund&Trace <receipts@fundandtrace.com>";
    const { mailing, sent, created } = setup();
    await (await mailing.createTransporter()).sendMail({ from: "fundandtrace@gmail.com", to: "b@x.com", subject: "Hi", text: "x" });
    await (await mailing.createTransporter()).sendMail({ to: "c@x.com", subject: "Hi", text: "x" });
    expect(created).toEqual(["smtp://user:pass@smtp.example.com:587"]);
    expect(sent.map((m) => m.from)).toEqual(["Fund&Trace <receipts@fundandtrace.com>", "Fund&Trace <receipts@fundandtrace.com>"]);
  });

  it("queues a message when the provider is briefly down, and the scheduler delivers it later", async () => {
    const down = Object.assign(new Error("Greylisted, try later"), { responseCode: 451 });
    const { mailing, sent, queued } = setup({ fail: [down] });
    const r = await (await mailing.createTransporter()).sendMail({ to: "b@x.com", subject: "Receipt", html: "<p>x</p>" });
    expect(r).toEqual({ queued: true, messageId: null });
    expect(queued[0]).toMatchObject({ to: "b@x.com", subject: "Receipt", attempts: 1 });
    expect(await mailing.drainMailOutbox()).toMatchObject({ sent: 0 }); // not due yet
    expect(await mailing.drainMailOutbox({ now: new Date(Date.now() + 6 * 60e3) })).toMatchObject({ sent: 1 });
    expect(sent).toHaveLength(1);
    expect(queued[0].status).toBe("sent");
  });

  it("throws permanent failures to the caller instead of queueing them", async () => {
    const bad = Object.assign(new Error("550 No such user"), { responseCode: 550 });
    const { mailing, queued } = setup({ fail: [bad] });
    await expect((await mailing.createTransporter()).sendMail({ to: "nobody@x.com", subject: "s", text: "t" })).rejects.toThrow("550");
    expect(queued).toHaveLength(0);
  });

  it("classifies errors", () => {
    const { isTransient } = require("../../services/mailing");
    expect(isTransient({ code: "ETIMEDOUT" })).toBe(true);
    expect(isTransient({ responseCode: 421 })).toBe(true);
    expect(isTransient({ responseCode: 554 })).toBe(false);
    expect(isTransient({ message: "invalid_grant: Token has been expired or revoked." })).toBe(true);
  });
});
