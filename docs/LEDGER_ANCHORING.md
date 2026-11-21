# Ledger anchoring: how to check we haven't rewritten history

Every campaign on Fund&Trace has a public, hash-chained ledger
(`GET /api/ledger/:campaignId`). Each entry includes the SHA-256 of the entry
before it, so nobody can edit, delete or reorder an entry without breaking every
later hash. You can recompute a chain in your browser with **Verify ledger** on
any campaign's tracker.

A hash chain on its own can't stop **us**, the operator, from rewriting a whole
chain and recomputing every hash. Daily anchoring closes that gap.

## What happens each day

1. Shortly after 01:00 UTC, every API instance tries to start the daily jobs.
   A database lock lets exactly one of them run.
2. **Integrity check** (`services/integrity.js`): every chain is re-verified,
   every escrow balance is compared with the sum of its ledger, and stuck
   payouts, transfers and refunds are listed. Problems raise an alert.
3. **Anchor** (`services/anchoring.js`): we take the latest entry (the *head*)
   of every campaign's chain and build a Merkle tree over them:

   ```
   leaf = SHA256("ft-leaf:v1:" + campaignId + ":" + seq + ":" + headHash)
   node = SHA256("ft-node:v1:" + left + right)     (an odd node is carried up)
   ```

   We write a short statement with the date, the root, the previous day's
   digest (so the anchors form their own chain) and the number of campaigns.
   Its SHA-256 is the **digest**. **We refuse to anchor if any chain fails
   verification.**
4. **Publish** the statement where we can't change it afterwards:
   - a public GitHub repository (`ANCHOR_GITHUB_REPO`), as
     `anchors/<date>.txt` and `anchors/<date>.json`, so the commit history is a
     public, timestamped record kept by a third party;
   - **OpenTimestamps** (`ANCHOR_OPENTIMESTAMPS=true`), which commits the digest
     to the Bitcoin blockchain within a few hours, at no cost.

## How to check it yourself

**In the browser.** Open a campaign's tracker and press **Verify ledger**. It
recomputes the chain, then checks the campaign's inclusion proof against the
published root and confirms that the entry anchored that day is still there,
unchanged.

**From the command line** (Node 18 or later, no dependencies):

```bash
node scripts/verify-anchor.js --api https://api.fundandtrace.com --date 2026-11-21 \
  --message anchors/2026-11-21.txt   # the copy from the public anchors repo
```

It checks the digest, recomputes the root from every listed head, and confirms
that each live ledger still verifies and still contains the anchored head.

**The external timestamp:**

```bash
curl -o 2026-11-21.txt     "https://api.fundandtrace.com/api/ledger/anchors/2026-11-21?format=txt"
curl -o 2026-11-21.txt.ots "https://api.fundandtrace.com/api/ledger/anchors/2026-11-21?format=ots"
pip install opentimestamps-client && ots upgrade 2026-11-21.txt.ots && ots verify 2026-11-21.txt.ots
```

## Public API

| Endpoint | What it returns |
| --- | --- |
| `GET /api/ledger/anchors` | recent anchors (date, root, digest, where published) |
| `GET /api/ledger/anchors/:date` (or `latest`) | one anchor with every leaf |
| `GET /api/ledger/anchors/:date?format=txt` | the exact published statement |
| `GET /api/ledger/anchors/:date?format=ots` | its OpenTimestamps proof |
| `GET /api/ledger/:campaignId/proof?date=` | the campaign's leaf and Merkle path |

## Configuration

| Variable | Default | Purpose |
| --- | --- | --- |
| `ENABLE_SCHEDULER` | `true` | set `false` to run jobs elsewhere |
| `DAILY_JOBS_HOUR_UTC` | `1` | earliest hour the daily jobs start |
| `ANCHOR_GITHUB_REPO` | (none) | public `owner/repo` to publish anchors to |
| `ANCHOR_GITHUB_TOKEN` | (none) | fine-grained token, *contents: write* on that repo only |
| `ANCHOR_GITHUB_BRANCH` | `main` | branch to commit to |
| `ANCHOR_OPENTIMESTAMPS` | `false` | `true` to timestamp each digest via OpenTimestamps |
| `ANCHOR_OTS_CALENDAR` | `https://a.pool.opentimestamps.org` | calendar server |
| `ALERT_WEBHOOK_URL` | (none) | Slack/Teams/Discord webhook for integrity alerts |
| `LEDGER_START_DATE` | first ledger entry | campaigns created before this are not balance-checked |

## Limits

- Anchoring proves that history **since the first anchor** hasn't been
  rewritten. It can't prove that the first entries were honest. That's what the
  gateway reconciliation (`RECONCILE_DAILY=true`) and published receipts are for.
- Between two anchors, up to a day of new entries is protected only by the hash
  chain.
- The anchors are only as public as where they are published: turn on at least
  one publisher in production.
