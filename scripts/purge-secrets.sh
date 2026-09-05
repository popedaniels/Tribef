#!/usr/bin/env bash
set -euo pipefail

# Purge committed secrets from the FundandTrace / FundandTraceBackend git
# history. Removes tracked `.env` files and replaces known secret-shaped values
# (Mongo URIs, Stripe/Flutterwave/webhook keys) with [REDACTED] placeholders.
#
# ⚠️  Rewriting history is DESTRUCTIVE and rewrites every commit SHA. It also
#     removes the `origin` remote so you cannot accidentally push old history.
#     Coordinate with everyone who has cloned the repo, then force-push.
#     Rotation MUST happen first or in the same change window — purging history
#     does not revoke a secret that is still valid.
#
# Requirements: git-filter-repo (pip install git-filter-repo or
#               `apt install git-filter-repo`).
#
# Usage:
#   ./scripts/purge-secrets.sh            # dry run: print the exact commands
#   ./scripts/purge-secrets.sh --apply    # actually rewrite both repos

APPLY=false
[ "${1:-}" = "--apply" ] && APPLY=true

REPOS=("FundandTrace" "FundandTraceBackend")

# Patterns used by `git filter-repo --replace-text`.
PATTERNS="$(mktemp)"
trap 'rm -f "${PATTERNS}"' EXIT
cat > "${PATTERNS}" <<'EOF'
regex:mongodb\+srv://[A-Za-z0-9._%:/?#@&=+-]+==>[REDACTED_MONGO_URL]
regex:mongodb://[A-Za-z0-9._%:/?#@&=+-]+==>[REDACTED_MONGO_URL]
regex:sk_live_[A-Za-z0-9]+==>[REDACTED_STRIPE_LIVE_KEY]
regex:sk_test_[A-Za-z0-9]+==>[REDACTED_STRIPE_TEST_KEY]
regex:pk_live_[A-Za-z0-9]+==>[REDACTED_STRIPE_PUBLISHABLE]
regex:pk_test_[A-Za-z0-9]+==>[REDACTED_STRIPE_PUBLISHABLE]
regex:whsec_[A-Za-z0-9]+==>[REDACTED_STRIPE_WEBHOOK_SECRET]
regex:FLWSECK-[A-Za-z0-9-]+==>[REDACTED_FLUTTERWAVE_KEY]
regex:OAUTH_CLIENT_SECRET\s*[:=]\s*["'][^"']+["']==>OAUTH_CLIENT_SECRET=[REDACTED]
regex:TOKEN_SECRET\s*[:=]\s*["'][^"']+["']==>TOKEN_SECRET=[REDACTED]
regex:SECURITY_KEY\s*[:=]\s*[0-9a-fA-F]{64}==>SECURITY_KEY=[REDACTED]
regex:INIT_VECTOR\s*[:=]\s*[0-9a-fA-F]{32}==>INIT_VECTOR=[REDACTED]
EOF

if ! command -v git-filter-repo >/dev/null 2>&1; then
  echo "purge-secrets.sh: git-filter-repo not found." >&2
  echo "Install it first:  pip install git-filter-repo   (or  apt install git-filter-repo)" >&2
  exit 1
fi

for repo in "${REPOS[@]}"; do
  echo "============================================================"
  echo "Repository: ${repo}"
  echo "============================================================"

  if [ ! -d "${repo}/.git" ]; then
    echo "  (skipped: not a git repository)"
    continue
  fi

  if [ "${APPLY}" = true ]; then
    echo "  [APPLY] Rewriting history for ${repo} ..."
    (
      cd "${repo}"
      git filter-repo --force \
        --invert-paths --path .env \
        --replace-text "${PATTERNS}"
    )
    echo "  Done. Review with: git -C ${repo} log --oneline"
    echo "  The 'origin' remote has been removed by filter-repo."
    echo "  Re-add it only after rotating credentials:"
    echo "    git -C ${repo} remote add origin <url>"
    echo "    git -C ${repo} push --force --all && git -C ${repo} push --force --tags"
  else
    echo "  [DRY RUN] Would execute:"
    echo "    cd ${repo} && git filter-repo --force \\"
    echo "      --invert-paths --path .env \\"
    echo "      --replace-text <patterns>"
  fi
  echo
done

if [ "${APPLY}" = false ]; then
  echo "Dry run complete. Run with --apply to rewrite history."
  echo "Reminder: rotate credentials BEFORE (or at the same time as) purging."
fi
