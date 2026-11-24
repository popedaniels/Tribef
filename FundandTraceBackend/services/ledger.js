// Tamper-evident public ledger.
//
// Every movement of escrowed money (donation credit, payout, payout reversal,
// refund) is appended as an entry whose hash covers its content AND the hash
// of the previous entry for that campaign:
//
//   hash_n = SHA-256( canonical(entry_n without hash) )   where entry_n.prevHash = hash_{n-1}
//
// Editing, deleting or reordering any past entry breaks every later hash, and
// anyone can recompute the chain from the public API (GET /api/ledger/:id) —
// no wallet or blockchain needed. Publishing the head hash elsewhere (e.g. a
// daily anchor) extends this to protection against the operator itself.
//
// Appends are idempotent on (campaignId, type, refId) and serialised per
// campaign by the unique (campaignId, seq) index with retry.

const crypto = require("crypto");
const { LedgerEntry } = require("../models/ledgerEntryModel");
const logger = require("../utility/logger");

const GENESIS = "0".repeat(64);
const MAX_ATTEMPTS = 25;

const round2 = (n) => Math.round(Number(n) * 100) / 100;

// Stable serialisation: fixed key order, ISO dates, amounts to 2dp.
const canonical = (e) =>
  JSON.stringify([
    String(e.campaignId),
    Number(e.seq),
    String(e.type),
    round2(e.amount).toFixed(2),
    String(e.currency || "").toUpperCase(),
    String(e.refId),
    String(e.memo || ""),
    new Date(e.at).toISOString(),
    String(e.prevHash),
  ]);

const hashEntry = (e) => crypto.createHash("sha256").update(canonical(e)).digest("hex");

const SIGN = { credit: 1, payout: -1, payout_reversal: 1, refund: -1 };

// Appends to one campaign's chain are serialised within this process (no
// self-contention), and retried with jittered backoff when another instance
// takes the next seq. The load test showed the old fixed 6 retries losing
// ~1 in 3 entries with 25 concurrent webhooks on one campaign.
const chains = new Map(); // campaignId -> tail promise
function serialise(campaignId, fn) {
  const key = String(campaignId);
  const prev = chains.get(key) || Promise.resolve();
  const run = prev.then(fn, fn);
  const tail = run.catch(() => undefined);
  chains.set(key, tail);
  tail.then(() => {
    if (chains.get(key) === tail) chains.delete(key);
  });
  return run;
}
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function tryAppend({ campaignId, type, amount, currency, refId, memo, at }) {
  const signed = SIGN[type] * Math.abs(round2(amount));
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt += 1) {
    try {
      const existing = await LedgerEntry.findOne({ campaignId, type, refId: String(refId) });
      if (existing) return existing;

      const last = await LedgerEntry.findOne({ campaignId }).sort({ seq: -1 });
      const entry = {
        campaignId,
        seq: last ? last.seq + 1 : 1,
        type,
        amount: signed,
        currency: String(currency || "").toUpperCase(),
        refId: String(refId),
        memo: String(memo || "").slice(0, 200),
        at: new Date(at),
        prevHash: last ? last.hash : GENESIS,
      };
      entry.hash = hashEntry(entry);
      return await LedgerEntry.create(entry);
    } catch (err) {
      // 11000 = another writer took this seq (or the same refId): back off and retry.
      if (err && err.code === 11000 && attempt < MAX_ATTEMPTS) {
        await sleep(Math.min(200, 2 ** Math.min(attempt, 7)) * (0.5 + Math.random()));
        continue;
      }
      throw err;
    }
  }
  throw new Error("ledger contention: retries exhausted");
}

/**
 * Append an entry. Never throws: the ledger must not break a money flow that
 * already succeeded. If the append can't be done now it goes to the durable
 * outbox and is retried until it lands, so no credit is ever left unrecorded.
 * @returns the stored entry, the existing one for a duplicate refId, or null (queued).
 */
async function appendEntry({ campaignId, type, amount, currency = "", refId, memo = "", at = new Date() }) {
  if (!campaignId || !SIGN[type] || !refId || !Number.isFinite(Number(amount))) {
    logger.error({ campaignId, type, refId, amount }, "Ledger append rejected: invalid entry");
    return null;
  }
  const item = { campaignId, type, amount, currency, refId: String(refId), memo, at };
  try {
    return await serialise(campaignId, async () => {
      await drainOutbox(campaignId); // earlier stragglers first, keeps order close to real time
      return tryAppend(item);
    });
  } catch (err) {
    logger.error({ err, campaignId, type, refId }, "Ledger append deferred to outbox");
    await queue(item, err);
    return null;
  }
}

async function queue(item, err) {
  const { LedgerOutbox } = require("../models/ledgerOutboxModel");
  try {
    await LedgerOutbox.updateOne(
      { campaignId: item.campaignId, type: item.type, refId: item.refId },
      { $setOnInsert: { amount: item.amount, currency: item.currency, memo: item.memo, at: item.at }, $inc: { attempts: 1 }, $set: { lastError: String(err?.message || err).slice(0, 200) } },
      { upsert: true }
    );
  } catch (e) {
    logger.fatal({ err: e, item }, "LEDGER ENTRY LOST: outbox write failed; reconcile manually");
  }
}

/** Retry queued entries (one campaign, or all). Safe to call any time. */
async function drainOutbox(campaignId = null, limit = 500) {
  const { LedgerOutbox } = require("../models/ledgerOutboxModel");
  const pending = await LedgerOutbox.find(campaignId ? { campaignId } : {}).sort({ at: 1 }).limit(limit).lean();
  let done = 0;
  for (const p of pending) {
    try {
      const run = () => tryAppend(p);
      // When draining everything, still serialise per campaign.
      await (campaignId ? run() : serialise(p.campaignId, run));
      await LedgerOutbox.deleteOne({ _id: p._id });
      done += 1;
    } catch (err) {
      await LedgerOutbox.updateOne({ _id: p._id }, { $inc: { attempts: 1 }, $set: { lastError: String(err?.message || err).slice(0, 200) } });
    }
  }
  return { pending: pending.length, appended: done };
}

/** Recompute a chain. Pure: works on any array of entries sorted by seq. */
function verifyEntries(entries) {
  let prevHash = GENESIS;
  let balance = 0;
  for (let i = 0; i < entries.length; i += 1) {
    const e = entries[i];
    if (Number(e.seq) !== i + 1) {
      return { valid: false, length: entries.length, brokenAt: i + 1, reason: "sequence gap or reorder" };
    }
    if (e.prevHash !== prevHash) {
      return { valid: false, length: entries.length, brokenAt: e.seq, reason: "prevHash does not match previous entry" };
    }
    if (hashEntry(e) !== e.hash) {
      return { valid: false, length: entries.length, brokenAt: e.seq, reason: "entry content does not match its hash" };
    }
    prevHash = e.hash;
    balance = round2(balance + Number(e.amount));
  }
  return { valid: true, length: entries.length, headHash: prevHash, balance };
}

async function verifyCampaign(campaignId) {
  const entries = await LedgerEntry.find({ campaignId }).sort({ seq: 1 }).lean();
  return verifyEntries(entries);
}

module.exports = { appendEntry, drainOutbox, verifyEntries, verifyCampaign, hashEntry, canonical, GENESIS };
