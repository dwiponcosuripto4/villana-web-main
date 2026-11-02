#!/usr/bin/env bash
#
# auto_backup_db.sh
# Automated PostgreSQL backup script.
# The backup is timestamped and compressed with bzip2.
#

set -euo pipefail

export $(cat /home/www/dev/villana-web/.env | xargs)

# === Configuration ===
DB_BACKUP_DIR="${DB_BACKUP_DIR:-/home/www/backups/villana}"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="villana_${TIMESTAMP}.sql"
COMPRESSED_FILE="${BACKUP_FILE}.bz2"

# === Ensure DATABASE_URL is set ===
if [[ -z "${DATABASE_URL:-}" ]]; then
  echo "❌ Error: DATABASE_URL environment variable is not set."
  exit 1
fi

# === Parse DATABASE_URL ===
# Expected format: postgres://user:pass@host:port/dbname
url="$DATABASE_URL"

url="${url#postgres://}"
url="${url#postgresql://}"

# --- Split from the rightmost '@' to handle '@' in password ---
userinfo="${url%@*}" # everything before last '@'
rest="${url##*@}"    # everything after last '@'

# If there's no '@' at all, fallback
if [[ "$userinfo" == "$url" ]]; then
  userinfo=""
  rest="$url"
fi

USER="${userinfo%%:*}"
PASS="${userinfo#*:}"
if [[ "$USER" == "$PASS" ]]; then PASS=""; fi

HOSTPORT="${rest%%/*}"
DBNAME="${rest#*/}"

HOST="${HOSTPORT%%:*}"
PORT="${HOSTPORT#*:}"
if [[ "$HOST" == "$PORT" ]]; then PORT="5432"; fi

# === Sanity check ===
if [[ -z "$DBNAME" ]]; then
  echo "❌ Error: Could not parse DATABASE_URL correctly."
  exit 1
fi

# === Prepare backup directory ===
mkdir -p "$DB_BACKUP_DIR"

# === Export password for pg_dump ===
export PGPASSWORD="$PASS"

# === Perform backup ===
echo "📦 Dumping PostgreSQL database '$DBNAME' from $HOST:$PORT ($USER)..."
pg_dump \
  --host="$HOST" \
  --port="$PORT" \
  --username="$USER" \
  --format=plain \
  --file="${DB_BACKUP_DIR}/${BACKUP_FILE}" \
  "$DBNAME"

# === Compress the backup ===
echo "🗜️ Compressing backup..."
bzip2 -f "${DB_BACKUP_DIR}/${BACKUP_FILE}"

# === Verify compression success ===
if [[ -f "${DB_BACKUP_DIR}/${COMPRESSED_FILE}" ]]; then
  echo "✅ Backup complete: ${DB_BACKUP_DIR}/${COMPRESSED_FILE}"
else
  echo "❌ Compression failed."
  exit 1
fi

# === Remove old backups, keep only the 7 most recent ===
ls -t "${DB_BACKUP_DIR}"/*.bz2 | tail -n +8 | xargs -r rm --
