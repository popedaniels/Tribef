#!/usr/bin/env bash
set -euo pipefail

# MongoDB backup for Fund&Trace.
#
# Requires the `mongodump` binary (mongodb-database-tools) on PATH.
# For MongoDB Atlas, prefer Atlas' built-in cloud backup (point-in-time
# recovery) in addition to — or instead of — this logical dump.
#
# Usage:
#   MONGOURL="mongodb+srv://..." ./scripts/backup-mongo.sh
#   BACKUP_DIR=./backups RETENTION_DAYS=30 ./scripts/backup-mongo.sh
#
# Env:
#   MONGOURL       connection string (required)
#   BACKUP_DIR     where to write archives (default ./backups)
#   RETENTION_DAYS prune archives older than N days (default 30)

MONGOURL="${MONGOURL:?Set MONGOURL to the database connection string}"
BACKUP_DIR="${BACKUP_DIR:-./backups}"
RETENTION_DAYS="${RETENTION_DAYS:-30}"
STAMP="$(date -u +%Y%m%dT%H%M%SZ)"
TARGET="${BACKUP_DIR}/mongo-${STAMP}"

mkdir -p "${BACKUP_DIR}"

echo "[backup] Dumping MongoDB to ${TARGET}"
mongodump --uri="${MONGOURL}" --out="${TARGET}" --gzip

ARCHIVE="${TARGET}.tar.gz"
echo "[backup] Archiving to ${ARCHIVE}"
tar -czf "${ARCHIVE}" -C "${TARGET}" .

# The raw dump directory is no longer needed once archived.
rm -rf "${TARGET}"

echo "[backup] Removing backups older than ${RETENTION_DAYS} day(s)"
find "${BACKUP_DIR}" -name 'mongo-*.tar.gz' -mtime "+${RETENTION_DAYS}" -print -delete

echo "[backup] Done: ${ARCHIVE}"
