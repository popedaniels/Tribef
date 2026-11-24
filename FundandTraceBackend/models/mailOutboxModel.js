// Emails that couldn't be sent because the mail provider was briefly
// unavailable. services/mailing.js queues them; the scheduler retries with
// backoff. Kept 30 days.
const mongoose = require("mongoose");

const MailOutboxSchema = new mongoose.Schema(
  {
    message: { type: mongoose.Schema.Types.Mixed, required: true }, // from, to, subject, html, text, headers, attachments...
    to: { type: String, default: "" },
    subject: { type: String, default: "" },
    status: { type: String, enum: ["queued", "sending", "sent", "failed"], default: "queued", index: true },
    attempts: { type: Number, default: 0 },
    nextAt: { type: Date, default: Date.now, index: true },
    leaseUntil: { type: Date, default: null },
    lastError: { type: String, default: "" },
    sentAt: { type: Date, default: null },
    createdAt: { type: Date, default: Date.now, expires: 60 * 60 * 24 * 30 },
  },
  { versionKey: false }
);
MailOutboxSchema.index({ status: 1, nextAt: 1 });

module.exports = { MailOutbox: mongoose.model("MailOutbox", MailOutboxSchema) };
