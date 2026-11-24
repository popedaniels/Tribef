// Daily external anchoring of the public ledger.
//
// The per-campaign hash chains (services/ledger.js) stop anyone *else* from
// rewriting history unnoticed, but the operator could still recompute a whole
// chain. Anchoring closes that gap: once a day we commit to the head of every
// campaign's chain in a single Merkle root and publish it somewhere we can't
// edit afterwards (a public GitHub repo and/or OpenTimestamps → Bitcoin).
//
// Anyone can then check that today's ledger still contains yesterday's heads:
//   1. GET /api/ledger/:campaignId/proof?date=YYYY-MM-DD  → leaf + Merkle path
//   2. recompute the root and compare it with the published anchor
//   3. confirm entry #seq in GET /api/ledger/:campaignId still has that hash.
//
// Hashing (domain-separated to prevent leaf/node confusion):
//   leaf  = SHA256("ft-leaf:v1:" + campaignId + ":" + seq + ":" + head)
//   node  = SHA256("ft-node:v1:" + left + right)
// An odd node at the end of a level is carried up unchanged (no duplication).
const crypto = require("crypto");
const axios = require("axios");
const { LedgerEntry } = require("../models/ledgerEntryModel");
const { LedgerAnchor } = require("../models/ledgerAnchorModel");
const { verifyCampaign, GENESIS } = require("./ledger");
const { EvidenceRecord } = require("../models/evidenceModel");
const { EVIDENCE_LEAF_ID, verifyStoredChain } = require("./evidence");
const logger = require("../utility/logger");

const sha256 = (s) => crypto.createHash("sha256").update(s).digest("hex");
const leafHash = ({ campaignId, seq, head }) => sha256(`ft-leaf:v1:${campaignId}:${seq}:${head}`);
const nodeHash = (l, r) => sha256(`ft-node:v1:${l}${r}`);

/** Root of a list of leaf hashes. Empty tree → 64 zeros. */
function merkleRoot(hashes) {
  if (!hashes.length) return GENESIS;
  let level = hashes.slice();
  while (level.length > 1) {
    const next = [];
    for (let i = 0; i < level.length; i += 2) {
      next.push(i + 1 < level.length ? nodeHash(level[i], level[i + 1]) : level[i]);
    }
    level = next;
  }
  return level[0];
}

/** Inclusion proof for hashes[index]: [{hash, side:"left"|"right"}] bottom-up. */
function merkleProof(hashes, index) {
  if (index < 0 || index >= hashes.length) throw new Error("index out of range");
  const path = [];
  let level = hashes.slice();
  let i = index;
  while (level.length > 1) {
    const sibling = i % 2 === 0 ? i + 1 : i - 1;
    if (sibling < level.length) path.push({ hash: level[sibling], side: i % 2 === 0 ? "right" : "left" });
    const next = [];
    for (let j = 0; j < level.length; j += 2) {
      next.push(j + 1 < level.length ? nodeHash(level[j], level[j + 1]) : level[j]);
    }
    level = next;
    i = Math.floor(i / 2);
  }
  return path;
}

function verifyProof(leaf, path, root) {
  let h = leaf;
  for (const step of path) h = step.side === "right" ? nodeHash(h, step.hash) : nodeHash(step.hash, h);
  return h === root;
}

/** The statement that is published; `digest` = SHA-256 of exactly this text. */
// `evidenceSeq` (sealed live captures, services/evidence.js) is only stated
// when that chain exists, so earlier anchors keep their exact text.
function anchorMessage({ date, root, prevDigest, leafCount, evidenceSeq = null }) {
  const lines = ["Fund&Trace ledger anchor v1", `date: ${date}`, `root: ${root}`, `previous: ${prevDigest}`];
  if (evidenceSeq) {
    lines.push(`campaigns: ${leafCount - 1}`, `evidence records: ${evidenceSeq}`);
  } else {
    lines.push(`campaigns: ${leafCount}`);
  }
  lines.push("verify: https://github.com/popedaniels/Tribef/blob/main/docs/LEDGER_ANCHORING.md", "");
  return lines.join("\n");
}

const sortLeaves = (leaves) => leaves.slice().sort((a, b) => (a.campaignId < b.campaignId ? -1 : a.campaignId > b.campaignId ? 1 : 0));

/** Current head of every campaign chain. */
async function currentHeads() {
  const rows = await LedgerEntry.aggregate([
    { $sort: { campaignId: 1, seq: -1 } },
    { $group: { _id: "$campaignId", seq: { $first: "$seq" }, head: { $first: "$hash" } } },
  ]);
  const leaves = rows.map((r) => ({ campaignId: String(r._id), seq: r.seq, head: r.head }));
  const lastEvidence = await EvidenceRecord.findOne().sort({ seq: -1 }).select("seq hash").lean();
  if (lastEvidence) leaves.push({ campaignId: EVIDENCE_LEAF_ID, seq: lastEvidence.seq, head: lastEvidence.hash });
  return sortLeaves(leaves);
}

// ── Publishers (each optional, configured by env) ─────────────────────────
async function publishGithub(anchor, http = axios) {
  const repo = process.env.ANCHOR_GITHUB_REPO; // "owner/name" of a PUBLIC repo
  const token = process.env.ANCHOR_GITHUB_TOKEN; // fine-grained, contents:write on that repo only
  if (!repo || !token) return null;
  const branch = process.env.ANCHOR_GITHUB_BRANCH || "main";
  const files = {
    [`anchors/${anchor.date}.txt`]: anchor.message,
    [`anchors/${anchor.date}.json`]: JSON.stringify(
      { date: anchor.date, root: anchor.root, prevDigest: anchor.prevDigest, digest: anchor.digest, leaves: anchor.leaves },
      null,
      2
    ),
  };
  let ref = "";
  for (const [path, content] of Object.entries(files)) {
    const res = await http.put(
      `https://api.github.com/repos/${repo}/contents/${path}`,
      { message: `Ledger anchor ${anchor.date}`, content: Buffer.from(content).toString("base64"), branch },
      { headers: { Authorization: `Bearer ${token}`, Accept: "application/vnd.github+json" }, timeout: 15000 }
    );
    ref = res?.data?.commit?.html_url || ref;
  }
  return { target: "github", ok: true, ref };
}

// OpenTimestamps: a free public timestamp that is later committed to Bitcoin.
// We store a complete detached .ots file for the published message text, so
// anyone can run `ots verify anchors/<date>.txt.ots` against anchors/<date>.txt.
const OTS_MAGIC = Buffer.from("004f70656e54696d657374616d7073000050726f6f6600bf89e2e884e89294", "hex");
async function publishOpenTimestamps(anchor, http = axios) {
  if (process.env.ANCHOR_OPENTIMESTAMPS !== "true") return null;
  const calendar = process.env.ANCHOR_OTS_CALENDAR || "https://a.pool.opentimestamps.org";
  const digest = Buffer.from(anchor.digest, "hex");
  const res = await http.post(`${calendar}/digest`, digest, {
    headers: { "Content-Type": "application/x-www-form-urlencoded", Accept: "application/vnd.opentimestamps.v1" },
    responseType: "arraybuffer",
    timeout: 15000,
  });
  const ots = Buffer.concat([OTS_MAGIC, Buffer.from([0x01, 0x08]), digest, Buffer.from(res.data)]);
  return { target: "opentimestamps", ok: true, ref: calendar, proof: ots.toString("base64") };
}

const PUBLISHERS = [publishGithub, publishOpenTimestamps];

/**
 * Build (or return) the anchor for `date`. Refuses to anchor if any chain is
 * broken — committing to a tampered ledger would launder it.
 */
async function createAnchor(date, { publishers = PUBLISHERS, http = axios } = {}) {
  const existing = await LedgerAnchor.findOne({ date });
  if (existing) return existing;

  const leaves = await currentHeads();
  const broken = [];
  for (const leaf of leaves) {
    const v = leaf.campaignId === EVIDENCE_LEAF_ID ? await verifyStoredChain(EvidenceRecord) : await verifyCampaign(leaf.campaignId);
    if (!v.valid || v.headHash !== leaf.head) broken.push({ campaignId: leaf.campaignId, ...v });
  }
  if (broken.length) {
    const err = new Error(`Refusing to anchor: ${broken.length} ledger chain(s) failed verification`);
    err.broken = broken;
    throw err;
  }

  const prev = await LedgerAnchor.findOne({ date: { $lt: date } }).sort({ date: -1 }).lean();
  const root = merkleRoot(leaves.map(leafHash));
  const prevDigest = prev ? prev.digest : GENESIS;
  const evidenceLeaf = leaves.find((l) => l.campaignId === EVIDENCE_LEAF_ID);
  const message = anchorMessage({ date, root, prevDigest, leafCount: leaves.length, evidenceSeq: evidenceLeaf ? evidenceLeaf.seq : null });
  const anchor = await LedgerAnchor.create({
    date,
    root,
    prevDigest,
    digest: sha256(message),
    message,
    leafCount: leaves.length,
    leaves,
  });

  const publications = [{ target: "log", ok: true, ref: "application log", at: new Date() }];
  logger.info({ date, root, digest: anchor.digest, campaigns: leaves.length }, "LEDGER_ANCHOR");
  for (const publish of publishers) {
    try {
      const p = await publish(anchor, http);
      if (p) publications.push({ ...p, at: new Date() });
    } catch (err) {
      logger.error({ err, date }, "Ledger anchor publication failed");
      publications.push({ target: publish.name.replace(/^publish/, "").toLowerCase(), ok: false, error: String(err.message || err), at: new Date() });
    }
  }
  anchor.publications = publications;
  await anchor.save();
  return anchor;
}

/** Inclusion proof for one campaign in the anchor for `date` (or latest). */
async function proofFor(campaignId, date) {
  const anchor = date ? await LedgerAnchor.findOne({ date }).lean() : await LedgerAnchor.findOne().sort({ date: -1 }).lean();
  if (!anchor) return null;
  const leaves = sortLeaves(anchor.leaves);
  const index = leaves.findIndex((l) => l.campaignId === String(campaignId));
  if (index === -1) return { anchor: publicAnchor(anchor), included: false };
  const hashes = leaves.map(leafHash);
  return {
    anchor: publicAnchor(anchor),
    included: true,
    leaf: leaves[index],
    leafHash: hashes[index],
    path: merkleProof(hashes, index),
  };
}

const publicAnchor = (a) => ({
  date: a.date,
  root: a.root,
  prevDigest: a.prevDigest,
  digest: a.digest,
  message: a.message,
  leafCount: a.leafCount,
  createdAt: a.createdAt,
  publications: (a.publications || []).map(({ target, ok, ref, at, proof }) => ({ target, ok, ref, at, hasProof: Boolean(proof) })),
});

module.exports = {
  leafHash,
  nodeHash,
  merkleRoot,
  merkleProof,
  verifyProof,
  anchorMessage,
  currentHeads,
  createAnchor,
  proofFor,
  publicAnchor,
  publishGithub,
  publishOpenTimestamps,
  sha256,
};
