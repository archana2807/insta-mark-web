#!/usr/bin/env bash
# Backup with a restore test (D15). Used by .github/workflows/backup.yml every night and
# by scripts/backup/rehearse-local.sh.
#
#   SOURCE_URL         database to back up (production: the Neon *direct* URL)
#   RESTORE_URL        an EMPTY throwaway database the dump is restored into
#   BACKUP_PASSPHRASE  encrypts the dump (gpg, AES-256)
#   OUT_DIR            where the encrypted dump is written (default: ./backup)
#
# Steps: count rows → pg_dump → count again → encrypt → decrypt → pg_restore into
# RESTORE_URL → every table's row count must lie between the two source counts (the
# live site may change during the dump). Prints table names and counts only — never
# the URLs or any row data.
set -euo pipefail

: "${SOURCE_URL:?SOURCE_URL is required}"
: "${RESTORE_URL:?RESTORE_URL is required}"
: "${BACKUP_PASSPHRASE:?BACKUP_PASSPHRASE is required}"
OUT_DIR="${OUT_DIR:-backup}"

stamp="$(date -u +%Y-%m-%dT%H%MZ)"
work="$(mktemp -d)"
trap 'rm -rf "$work"' EXIT
mkdir -p "$OUT_DIR"

# Exact row count of every table in the public schema: "table|count" lines.
counts() {
  local url="$1"
  local tables
  # Options before the database: psql on Windows ignores options placed after it, and
  # prints CRLF line ends (hence tr -d '\r'). Linux (the GitHub runner) is fine either way.
  tables="$(psql -X -At -v ON_ERROR_STOP=1 \
    -c "select tablename from pg_tables where schemaname = 'public' order by 1" -d "$url" |
    tr -d '\r')"
  for t in $tables; do
    printf '%s|%s\n' "$t" \
      "$(psql -X -At -v ON_ERROR_STOP=1 -c "select count(*) from \"public\".\"$t\"" -d "$url" |
        tr -d '\r')"
  done
}

echo "▶ pg_dump $(pg_dump --version | awk '{print $NF}'), restore test into an empty database"
counts "$SOURCE_URL" > "$work/before.txt"
pg_dump --format=custom --no-owner --no-privileges --dbname="$SOURCE_URL" --file="$work/db.dump"
counts "$SOURCE_URL" > "$work/after.txt"

encrypted="$OUT_DIR/insta-mark-$stamp.dump.gpg"
gpg --batch --yes --quiet --pinentry-mode loopback --passphrase-fd 0 \
  --symmetric --cipher-algo AES256 --output "$encrypted" "$work/db.dump" <<< "$BACKUP_PASSPHRASE"

# The restore test uses the ENCRYPTED file, exactly as a real recovery would.
gpg --batch --yes --quiet --pinentry-mode loopback --passphrase-fd 0 \
  --decrypt --output "$work/restored.dump" "$encrypted" <<< "$BACKUP_PASSPHRASE"
pg_restore --no-owner --no-privileges --exit-on-error --dbname="$RESTORE_URL" "$work/restored.dump"
counts "$RESTORE_URL" > "$work/restored.txt"

status=0
printf '%-24s %10s %10s %10s\n' "table" "before" "after" "restored"
while IFS='|' read -r table before; do
  after="$(grep "^$table|" "$work/after.txt" | cut -d'|' -f2)"
  restored="$(grep "^$table|" "$work/restored.txt" | cut -d'|' -f2 || true)"
  low=$(( before < after ? before : after ))
  high=$(( before > after ? before : after ))
  mark="ok"
  if [[ -z "$restored" || "$restored" -lt "$low" || "$restored" -gt "$high" ]]; then
    mark="MISMATCH"
    status=1
  fi
  printf '%-24s %10s %10s %10s  %s\n' "$table" "$before" "$after" "${restored:-missing}" "$mark"
done < "$work/before.txt"

tables="$(wc -l < "$work/before.txt" | tr -d ' ')"
if [[ "$tables" -eq 0 ]]; then
  echo "✖ No tables found in the source database"
  exit 1
fi
if [[ "$status" -ne 0 ]]; then
  echo "✖ Restore test FAILED: the restored database does not match"
  exit 1
fi
echo "✓ Restore test passed: $tables tables restored and checked ($stamp)"
echo "✓ Encrypted backup: $encrypted ($(du -h "$encrypted" | cut -f1))"
