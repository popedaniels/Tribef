require("dotenv").config();
const nodemailer = require("nodemailer");
const { google } = require("googleapis");
const OAuth2 = google.auth.OAuth2;
const logger = require("../utility/logger");

// Transactional email. Prefer SMTP_URL in production (Amazon SES, Postmark,
// Resend, Mailgun… all offer SMTP): Gmail OAuth is capped at a few hundred to
// ~2,000 messages a day, and refresh tokens issued to an OAuth app in
// "testing" mode expire after 7 days, which silently stops receipts.
//   SMTP_URL=smtps://USER:PASS@email-smtp.eu-west-1.amazonaws.com:465
let smtpTransport = null;
exports.createTransporter = async () => {
  if (process.env.SMTP_URL) {
    if (!smtpTransport) smtpTransport = nodemailer.createTransport(process.env.SMTP_URL, { from: process.env.EMAIL_FROM || process.env.EMAIL });
    return smtpTransport;
  }
  try {
    const oauth2Client = new OAuth2(
      process.env.OAUTH_CLIENTID,
      process.env.OAUTH_CLIENT_SECRET,
      "https://developers.google.com/oauthplayground"
    );

    oauth2Client.setCredentials({
      refresh_token: process.env.OAUTH_REFRESH_TOKEN,
    });

    const accessToken = await oauth2Client.getAccessToken();

    const transporter = nodemailer.createTransport({
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

    transporter.verify((err, success) => {
      err
        ? logger.error({ err }, "Mail transporter verify failed")
        : logger.info({ success }, "Mail transporter ready");
    });

    return transporter;
  } catch (error) {
    logger.error({ err: error }, "Mail transporter creation failed");
    throw error;
  }
};
