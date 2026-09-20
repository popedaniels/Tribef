// Donor-facing donation receipt PDFs.
// GET /api/donations/:donationId/receipt (requireAuth)
//
// Generated with pdfkit (pure JS) — no headless browser, no deprecated
// phantomjs. buildReceiptPdf is exported separately so the layout is
// unit-testable without HTTP.
const PDFDocument = require("pdfkit");
const { Donations } = require("./shared");
const { Campaign } = require("../../models/campaignModel");
const logger = require("../../utility/logger");

const money = (n) =>
  Number(n || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

function escapeText(value) {
  return String(value == null ? "" : value);
}

function buildReceiptPdf(donation, campaign, org, footerLines = []) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: "A4", margin: 56 });
    const chunks = [];
    doc.on("data", (chunk) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    const title = campaign?.basicInformation?.campaignTitle || "Campaign";
    const currency = donation.currency || "";

    // Header band.
    doc.font("Helvetica-Bold").fontSize(20).text(org.name, { continued: false });
    doc.font("Helvetica").fontSize(10).fillColor("#666666")
      .text("Donation Receipt", { align: "right" });
    doc.moveTo(56, doc.y + 8).lineTo(539, doc.y + 8).lineWidth(2).strokeColor("#1a1a1a").stroke();
    doc.moveDown(2);

    // Amount.
    doc.fillColor("#1a1a1a").font("Helvetica-Bold").fontSize(30)
      .text(`${currency} ${money(donation.amount)}`);
    doc.font("Helvetica").fontSize(11).fillColor("#666666")
      .text("Thank you for your generosity.");
    doc.moveDown(1.5);

    // Detail rows.
    const rows = [
      ["Receipt ID", String(donation._id || "")],
      ["Date", new Date(donation.createdAt || Date.now()).toUTCString()],
      ["Donor", escapeText(donation.donorName || donation.donorEmail)],
      ["Campaign", escapeText(title)],
      ["Payment method", escapeText(donation.paymentMethod || "card")],
      ["Transaction reference", escapeText(donation.transactionRef || donation.transactionId || "")],
    ];
    if (donation.tip) {
      rows.splice(4, 0, ["Platform tip", money(donation.tip)]);
    }

    const rowHeight = 22;
    const labelX = 56;
    const valueX = 280;
    let y = doc.y;
    rows.forEach(([label, value], i) => {
      if (i % 2 === 0) {
        doc.rect(labelX - 4, y - 4, 483, rowHeight).fillAndStroke("#f5f5f5", "#eeeeee");
      }
      doc.fillColor("#666666").font("Helvetica").fontSize(11)
        .text(label, labelX, y, { lineBreak: false });
      doc.fillColor("#1a1a1a").text(String(value), valueX, y, {
        lineBreak: false,
        width: 250,
        ellipsis: true,
      });
      y += rowHeight;
    });

    // Footer.
    doc.y = Math.max(doc.y, y) + 36;
    doc.fontSize(9).fillColor("#999999");
    const lines = footerLines.length
      ? footerLines
      : [`This receipt was generated electronically by ${org.name} and is valid without signature.`];
    lines.forEach((line) => doc.text(line));
    doc.moveDown(0.5);

    return doc.end();
  });
}

exports.getReceipt = async (req, res) => {
  try {
    const requesterEmail =
      req.auth && (req.auth.email || (req.auth.profile && req.auth.profile.email));
    const donation = await Donations.findById(req.params.donationId);
    if (!donation) {
      return res.status(404).json({ status: 404, error: "Donation not found" });
    }
    // Strict ownership: a donor may only download their own receipts.
    if (
      !requesterEmail ||
      String(donation.donorEmail || "").toLowerCase() !== String(requesterEmail).toLowerCase()
    ) {
      return res.status(403).json({ status: 403, error: "Not your donation" });
    }

    const campaign = await Campaign.findById(donation.campaignId);
    const org = {
      name: "Fund&Trace",
      supportEmail: process.env.SUPPORT_EMAIL || "",
      giftAidNote: process.env.GIFT_AID_NOTE || "",
    };
    const footerLines = [
      `This receipt was generated electronically by ${org.name} and is valid without signature.`,
    ];
    if (org.supportEmail) footerLines.push(`Questions: ${org.supportEmail}.`);
    if (org.giftAidNote) footerLines.push(org.giftAidNote);

    const pdfBuffer = await buildReceiptPdf(
      { ...donation.toObject(), currency: campaign?.funding?.currency },
      campaign,
      org,
      footerLines
    );

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="receipt-${donation._id}.pdf"`
    );
    return res.send(pdfBuffer);
  } catch (error) {
    logger.error({ err: error }, "getReceipt failed");
    return res.status(500).json({ status: 500, error: "Server error." });
  }
};

module.exports.buildReceiptPdf = buildReceiptPdf;
module.exports.escapeHtml = escapeText;
