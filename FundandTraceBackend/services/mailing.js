require("dotenv").config();
const nodemailer = require("nodemailer");
const mongoose = require("mongoose");
const { google } = require("googleapis");
const OAuth2 = google.auth.OAuth2;
const logger = require("../utility/logger");

// Transactional email.
//
// Provider: prefer SMTP_URL in production (Amazon SES, Postmark, Resend,
// Mailgun… all offer SMTP). Gmail OAuth is capped at a few hundred to ~2,000
// messages a day, and refresh tokens issued to an OAuth app in "testing"
// mode expire after 7 days, which silently stops receipts.
//   SMTP_URL=smtps://USER:PASS@email-smtp.eu-west-1.amazonaws.com:465
//   EMAIL_FROM="Fund&Trace <receipts@fundandtrace.com>"
// With EMAIL_FROM set every message is sent from it (templates still say
// fundandtrace@gmail.com, which SES/Postmark would reject as unverified).
//
// Reliability: createTransporter() returns a sender whose sendMail() queues
// the message in MailOutbox when the provider is temporarily unavailable
// (connection errors, timeouts, 4xx SMTP replies, OAuth token failures) and
// returns { queued: true }. The scheduler retries queued mail with backoff
// (5m, 15m, 1h, 4h, 12h) and alerts when a message finally fails.
// Permanent errors (bad address, 5xx) still throw to the caller.

const BACKOFF_MIN = [5, 15, 60, 240, 720];
const MAX_ATTEMPTS = BACKOFF_MIN.length + 1;

let smtpTransport = null;
async function rawTransport() {
  if (process.env.SMTP_URL) {
    if (!smtpTransport) smtpTransport = nodemailer.createTransport(process.env.SMTP_URL, { from: process.env.EMAIL_FROM || process.env.EMAIL });
    return smtpTransport;
  }
  const oauth2Client = new OAuth2(process.env.OAUTH_CLIENTID, process.env.OAUTH_CLIENT_SECRET, "https://developers.google.com/oauthplayground");
  oauth2Client.setCredentials({ refresh_token: process.env.OAUTH_REFRESH_TOKEN });
  const accessToken = await oauth2Client.getAccessToken();
  return nodemailer.createTransport({
    service: "gmail",
    auth: {
      type: "OAuth2",
      user: process.env.EMAIL,
      accessToken,
      clientId: process.env.OAUTH_CLIENTID,
      clientSecret: process.env.OAUTH_CLIENT_SECRET,
      refreshToken: process.env.OAUTH_REFRESH_TOKEN,
    },
  });
}

/** Transient = worth retrying later. */
function isTransient(err) {
  if (!err) return false;
  const code = Number(err.responseCode);
  if (code >= 400 && code < 500) return true; // 421/450/451/452: try again later
  if (code >= 500) return false; // 550 no such user, 554 rejected…
  if (/^(ECONNECTION|ETIMEDOUT|ESOCKET|EDNS|ECONNRESET|ECONNREFUSED|ENOTFOUND|EAI_AGAIN|EAUTH)$/.test(String(err.code || ""))) return true;
  if (/invalid_grant|getAccessToken|timeout|socket|network/i.test(String(err.message || ""))) return true;
  return false;
}

const KEEP = ["from", "to", "cc", "bcc", "replyTo", "subject", "text", "html", "headers", "attachments"];
function normalise(options) {
  const msg = {};
  for (const k of KEEP) if (options[k] !== undefined) msg[k] = options[k];
  if (process.env.EMAIL_FROM) msg.from = process.env.EMAIL_FROM;
  return msg;
}

async function queue(msg, err) {
  const { MailOutbox } = require("../models/mailOutboxModel");
  const size = Buffer.byteLength(JSON.stringify(msg));
  if (size > 8 * 1024 * 1024) return false; // too big to keep: let the caller see the error
  await MailOutbox.create({
    message: msg,
    to: String(Array.isArray(msg.to) ? msg.to.join(",") : msg.to || "").slice(0, 300),
    subject: String(msg.subject || "").slice(0, 200),
    attempts: 1,
    lastError: String(err?.message || err).slice(0, 300),
    nextAt: new Date(Date.now() + BACKOFF_MIN[0] * 60e3),
  });
  return true;
}

exports.createTransporter = async () => ({
  async sendMail(options) {
    const msg = normalise(options || {});
    try {
      const t = await rawTransport();
      return await t.sendMail(msg);
    } catch (err) {
      if (isTransient(err) && mongoose.connection.readyState === 1) {
        try {
          if (await queue(msg, err)) {
            logger.warn({ err: err?.message, subject: msg.subject }, "Mail provider unavailable; message queued for retry");
            return { queued: true, messageId: null };
          }
        } catch (qErr) {
          logger.error({ err: qErr }, "Couldn't queue email for retry");
        }
      }
      logger.error({ err: err?.message, code: err?.code, responseCode: err?.responseCode, subject: msg.subject }, "Email send failed");
      throw err;
    }
  },
  // Kept for callers that check readiness.
  async verify() {
    const t = await rawTransport();
    return t.verify();
  },
});

/** Retry queued mail. Called on every scheduler tick. */
exports.drainMailOutbox = async ({ limit = 25, now = new Date(), transport } = {}) => {
  const { MailOutbox } = require("../models/mailOutboxModel");
  let sent = 0;
  let failed = 0;
  let retried = 0;
  let t = transport;
  for (let i = 0; i < limit; i++) {
    const job = await MailOutbox.findOneAndUpdate(
      { $or: [{ status: "queued", nextAt: { $lte: now } }, { status: "sending", leaseUntil: { $lt: now } }] },
      { $set: { status: "sending", leaseUntil: new Date(now.getTime() + 5 * 60e3) } },
      { sort: { nextAt: 1 }, new: true }
    );
    if (!job) break;
    try {
      if (!t) t = await rawTransport();
      await t.sendMail(job.message);
      await MailOutbox.updateOne({ _id: job._id }, { $set: { status: "sent", sentAt: new Date(), leaseUntil: null }, $inc: { attempts: 1 } });
      sent += 1;
    } catch (err) {
      const attempts = (job.attempts || 0) + 1;
      const giveUp = attempts >= MAX_ATTEMPTS || !isTransient(err);
      await MailOutbox.updateOne(
        { _id: job._id },
        {
          $set: {
            status: giveUp ? "failed" : "queued",
            attempts,
            lastError: String(err?.message || err).slice(0, 300),
            leaseUntil: null,
            nextAt: new Date(now.getTime() + (BACKOFF_MIN[Math.min(attempts - 1, BACKOFF_MIN.length - 1)] || 720) * 60e3),
          },
        }
      );
      if (giveUp) {
        failed += 1;
        const text = `Email permanently failed after ${attempts} attempts: "${job.subject}" to ${job.to} (${String(err?.message || err).slice(0, 120)})`;
        logger.error({ to: job.to, subject: job.subject }, text);
        if (process.env.ALERT_WEBHOOK_URL) require("axios").post(process.env.ALERT_WEBHOOK_URL, { text, content: text }, { timeout: 5000 }).catch(() => {});
      } else retried += 1;
      // Provider still down: stop this tick rather than burning attempts.
      if (isTransient(err)) break;
    }
  }
  return { sent, failed, retried };
};

exports.isTransient = isTransient;
