#!/usr/bin/env bash
set -euo pipefail

# Restore a MongoDB backup produced by backup-mongo.sh.
#
# Requires the `mongorestore` binary (mongodb-database-tools) on PATH.
#
# Usage:
#   MONGOURL="mongodb+srv://..." ./scripts/restore-mongo.sh ./backups/mongo-YYYYMMDDTHHMMSSZ.tar.gz

ARCHIVE="${1:?Usage: restore-mongo.sh <path-to-mongo-*.tar.gz>}"
MONGOURL="${MONGOURL:?Set MONGOURL to the target database connection string}"

if [ ! -f "${ARCHIVE}" ]; then
  echo "restore-mongo.sh: archive not found: ${ARCHIVE}" >&2
  exit 1
fi

TMP="$(mktemp -d)"
trap 'rm -rf "${TMP}"' EXIT

echo "[restore] Extracting ${ARCHIVE}"
tar -xzf "${ARCHIVE}" -C "${TMP}"

echo "[restore] Restoring to ${MONGOURL} (--drop replaces existing collections)"
mongorestore --uri="${MONGOURL}" --gzip --drop "${TMP}"

echo "[restore] Done"
