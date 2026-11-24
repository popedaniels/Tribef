# Reviewing PR #1 (stage → main)

PR #1 is large: about 48 commits and 536 files. Review it **commit by commit, in the groups below**, not as one diff. Each commit message says what changed and why. Use `git show <sha>`, or the PR's Commits tab.

Two things make it smaller than it looks:

- Hide whitespace changes. Use `?w=1` on GitHub, or `git show -w`. The line-ending commits (`db2538b`, `4ac8b03`, `1bae0e9`) then show almost nothing.
- Generated or binary files can be skimmed: the backlog `.xlsx`, `package-lock.json`, and the purged CSS output.

## Suggested order

Have someone who knows payments review groups 2, 3, 6 and 7.

| # | Theme | Commits | Focus on |
|---|---|---|---|
| 1 | Baseline fixes | `d4baed0` `2ecd8a1` `dac66a8` `6404d29` `221706f` `d4b0d13` `7e3e8fc` `1cffdc5` | IDOR fix in the ownership guard; PII and bank details no longer leaked from public endpoints; no account enumeration |
| 2 | **Escrow and money movement** | `73321dd` `4aafd6d` `5decd90` `2575555` `005049d` | Atomic approve and payout (no double payouts); dispute freeze; the charged amount and currency must match; ledger outbox under concurrency |
| 3 | **Fees** | `8fa1735` | `services/fees.js`: total = donation + tip + fee; the server recomputes the fee; UK surcharge rules |
| 4 | Trust UI and docs | `284869b` `54df64d` `7532110` `cfaa59a` `714dcd1` `bb90ceb` `cecd76d` `ed1f639` | Wording on money promises (see `docs/briefs/COUNSEL_BRIEF.md`) |
| 5 | Ledger anchoring and ops | `557c24e` `0b32c38` `138df80` `452b531` `5da7a7b` `01b243c` `ce495eb` | Anchoring, integrity checks, backups and the restore drill, CI |
| 6 | **Identity and evidence** | `d113e48` `af84bd2` | Sealed, append-only evidence; KYC gate; the two-person payout rule; Smile ID |
| 7 | **This round: controls** | `780db80` `b5daa44` `979196d` | Two-way reconciliation; admin 2FA enforcement; bank-name check and 48-hour cooldown; checkout limits and Turnstile; card and organiser risk signals |
| 8 | Giving features | `88ab924` `4bf6c43` `20c8841` `592c397` `66550b8` | Gift Aid, teams, matching, the vendor network, donor update emails, Paystack monthly giving |
| 9 | Platform | `8084513` `1a38874` `142da71` `74c7950` `7ff41f5` | FX, mobile, the email retry outbox, privacy (export and delete), SEO |
| 10 | Security fixes | `d93c604` | CodeQL findings |
| — | Line endings | `db2538b` `4ac8b03` `1bae0e9` | Whitespace only (check with `-w`) |

## Before merging

- [ ] All CI checks green on the last commit: Test & Build, including the MongoDB mocha suite; E2E; Lint & Typecheck; Security; Paystack integration; Load test.
- [ ] `docs/LAUNCH_RUNBOOK.md` §3a steps are planned for the deploy: the encryption migration, `LEDGER_START_DATE`, webhooks, `SMTP_URL`/`EMAIL_FROM`, and the new variables in `.env.example`.
- [ ] **Squash or merge?** A merge commit keeps the per-commit messages, which are useful for later audits. A squash merge would also drop three Python wheel files (1.4 MB) that were committed by mistake in `88ab924` and removed in `b5daa44`, so they wouldn't stay in `main`'s history.
