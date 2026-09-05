#!/usr/bin/env bash
set -uo pipefail

# Read-only staging smoke test for Fund&Trace.
#
# Verifies the frontend and backend are deployed and that the backend's
# liveness/readiness probes pass. Never mutates data.
#
# Usage:
#   FRONTEND_URL=https://staging.fundandtrace.com API_URL=https://api.staging.fundandtrace.com ./scripts/smoke-test.sh
#
# Note: /ready and /api/health return 503 until the backend can reach MongoDB,
# so a failure there usually means "database not reachable", not "app down".

FRONTEND_URL="${FRONTEND_URL:-http://localhost:3000}"
API_URL="${API_URL:-http://localhost:5000}"
fail=0

check() {
  local label="$1" url="$2" expect="${3:-200}"
  local code
  code="$(curl -s -o /dev/null -w '%{http_code}' --max-time 10 "${url}" 2>/dev/null || true)"
  if [ "${code}" = "${expect}" ]; then
    echo "  [PASS] ${label} -> ${url} (${code})"
  else
    echo "  [FAIL] ${label} -> ${url} (got '${code}', expected ${expect})"
    fail=1
  fi
}

# check_any: pass when the HTTP code is one of a set (e.g. 200|302|503).
# Used for payment-corridor routes whose code depends on whether secrets are set.
check_any() {
  local label="$1" url="$2" allowed="$3"
  local code
  code="$(curl -s -o /dev/null -w '%{http_code}' --max-time 10 "${url}" 2>/dev/null || true)"
  if echo "${allowed}" | grep -qw "${code}"; then
    echo "  [PASS] ${label} -> ${url} (${code})"
  else
    echo "  [FAIL] ${label} -> ${url} (got '${code}', expected one of: ${allowed})"
    fail=1
  fi
}

echo "Fund&Trace staging smoke test"
echo "  frontend: ${FRONTEND_URL}"
echo "  api:      ${API_URL}"
echo

check "Frontend home"      "${FRONTEND_URL}/" 200
check "API root"           "${API_URL}/" 200
check "API liveness"       "${API_URL}/live" 200
check "API readiness"      "${API_URL}/ready" 200
check "API health alias"   "${API_URL}/api/health" 200

# ─── Paystack corridor (FT-025) ────────────────────────────────────────
# Read-only: verifies the Paystack rails are routed and reachable without
# initiating a real transaction. Expectation depends on secrets:
#   - initialize → 503 without PAYSTACK_SECRET, 404 for unknown campaign otherwise
#   - callback   → 302 redirect to frontend without secrets, 500 if Paystack API unreachable
#   - webhook    → 503 without PAYSTACK_SECRET, 401 with secret but no valid signature
check_any "Paystack initialize" "${API_URL}/api/donations/initializePaystack/000000000000000000000000" "404 503"
check_any "Paystack callback"   "${API_URL}/api/donations/paystack/000000000000000000000000?reference=smoke-ft025" "302 500"
check_any "Paystack webhook"    "${API_URL}/api/donations/paystack-webhook" "401 503"

echo
if [ "${fail}" -eq 0 ]; then
  echo "Smoke test passed."
else
  echo "Smoke test FAILED (see above)."
  exit 1
fi
