#!/usr/bin/env bash
set -euo pipefail
# Backup → restore → verify drill. Proves backups can actually be restored and
# that the restored data is intact (ledger and evidence hash chains, balances,
# document counts), and measures how long recovery takes.
#
# Usage:
#   SOURCE_MONGOURL="mongodb+srv://readonly@prod/..." \
#   DRILL_MONGOURL="mongodb://localhost:27017/fundandtrace_drill" \
#   ./scripts/backup-restore-drill.sh            # take a fresh dump, then restore it
#
#   DRILL_MONGOURL=... ./scripts/backup-restore-drill.sh ./backups/mongo-....tar.gz
#                                                # restore an existing archive (tests the real backup)
#
# DRILL_MONGOURL's database name must end in "_drill": the restore drops its
# collections first, so it must never point at a real database.
# Requires mongodump/mongorestore (mongodb-database-tools) and node.

HERE="$(cd "$(dirname "$0")" && pwd)"
ROOT="$(cd "${HERE}/.." && pwd)"
DRILL_MONGOURL="${DRILL_MONGOURL:?Set DRILL_MONGOURL to a scratch database whose name ends in _drill}"
DB_NAME="$(node -e 'const u=new URL(process.argv[1].replace(/^mongodb(\+srv)?:/,"http:"));process.stdout.write(u.pathname.replace(/^\//,""))' "${DRILL_MONGOURL}")"
case "${DB_NAME}" in
  *_drill) ;;
  *) echo "drill: refusing to restore into '${DB_NAME}': the database name must end in _drill" >&2; exit 2 ;;
esac

REPORT_DIR="${REPORT_DIR:-${ROOT}/drill-reports}"
mkdir -p "${REPORT_DIR}"
STAMP="$(date -u +%Y%m%dT%H%M%SZ)"
START=$(date +%s)

ARCHIVE="${1:-}"
if [ -z "${ARCHIVE}" ]; then
  SOURCE_MONGOURL="${SOURCE_MONGOURL:?Set SOURCE_MONGOURL or pass an archive}"
  echo "[drill] Recording source counts"
  MONGOURL="${SOURCE_MONGOURL}" node "${ROOT}/FundandTraceBackend/scripts/drill-verify.js" --counts > "${REPORT_DIR}/source-counts-${STAMP}.json"
  echo "[drill] Taking a fresh dump"
  BACKUP_DIR="${REPORT_DIR}/tmp" RETENTION_DAYS=1 MONGOURL="${SOURCE_MONGOURL}" "${ROOT}/scripts/backup-mongo.sh"
  ARCHIVE="$(ls -1t "${REPORT_DIR}"/tmp/mongo-*.tar.gz | head -1)"
  EXPECT="--expect ${REPORT_DIR}/source-counts-${STAMP}.json"
else
  EXPECT=""
fi
BACKUP_TAKEN="$(basename "${ARCHIVE}" | sed -E 's/^mongo-([0-9T]+Z).*/\1/')"

# The archive holds a directory named after the source database; restore it into
# the drill database instead.
TMP="$(mktemp -d)"
trap 'rm -rf "${TMP}"' EXIT
tar -xzf "${ARCHIVE}" -C "${TMP}"
SRC_DIR="$(find "${TMP}" -mindepth 1 -maxdepth 3 -type d -exec sh -c 'ls "$1"/*.bson.gz >/dev/null 2>&1' _ {} \; -print | head -1)"
[ -n "${SRC_DIR}" ] || { echo "drill: no BSON files found in ${ARCHIVE}" >&2; exit 1; }
SRC_DB="$(basename "${SRC_DIR}")"

RESTORE_START=$(date +%s)
echo "[drill] Restoring ${SRC_DB} → ${DB_NAME}"
mongorestore --uri="${DRILL_MONGOURL}" --gzip --drop --nsFrom="${SRC_DB}.*" --nsTo="${DB_NAME}.*" --dir="$(dirname "${SRC_DIR}")" --quiet
RESTORE_SECS=$(( $(date +%s) - RESTORE_START ))

echo "[drill] Verifying the restored data"
set +e
MONGOURL="${DRILL_MONGOURL}" node "${ROOT}/FundandTraceBackend/scripts/drill-verify.js" ${EXPECT} \
  --backup-taken "${BACKUP_TAKEN}" --restore-seconds "${RESTORE_SECS}" --total-seconds "$(( $(date +%s) - START ))" \
  --report "${REPORT_DIR}/drill-${STAMP}.md"
STATUS=$?
set -e
rm -rf "${REPORT_DIR}/tmp"
echo "[drill] Report: ${REPORT_DIR}/drill-${STAMP}.md"
exit ${STATUS}
