#!/usr/bin/env bash
# Local rehearsal of the nightly backup (no production data, needs Docker):
#   bash scripts/backup/rehearse-local.sh
# Starts two throwaway PostgreSQL 16 containers (source on 127.0.0.1:5440, empty restore
# target on 127.0.0.1:5441), migrates and seeds the source with test data, then runs
# scripts/backup/backup-and-verify.sh exactly as the GitHub Action does. Also checks
# that a wrong passphrase cannot open the dump. Containers are removed afterwards.
set -euo pipefail

SRC_PORT=5440
DST_PORT=5441
SRC_URL="postgresql://rehearsal:rehearsal@127.0.0.1:${SRC_PORT}/rehearsal"
DST_URL="postgresql://rehearsal:rehearsal@127.0.0.1:${DST_PORT}/rehearsal"
here="$(cd "$(dirname "$0")" && pwd)"
root="$(cd "$here/../.." && pwd)"
out="$(mktemp -d)"

cleanup() {
  docker rm -f im-backup-src im-backup-dst >/dev/null 2>&1 || true
  rm -rf "$out"
}
trap cleanup EXIT

start() {
  docker run -d --rm --name "$1" -p "127.0.0.1:$2:5432" \
    -e POSTGRES_USER=rehearsal -e POSTGRES_PASSWORD=rehearsal -e POSTGRES_DB=rehearsal \
    postgres:16 >/dev/null
}
ready() {
  for _ in $(seq 1 60); do
    docker exec "$1" pg_isready -U rehearsal -d rehearsal >/dev/null 2>&1 && return 0
    sleep 1
  done
  echo "✖ $1 did not start" && exit 1
}

echo "▶ Starting throwaway PostgreSQL 16 containers"
start im-backup-src "$SRC_PORT"
start im-backup-dst "$DST_PORT"
ready im-backup-src
ready im-backup-dst

echo "▶ Migrating and seeding the source with test data"
# Both URLs are set explicitly so Prisma can never fall back to a URL from an env file.
(
  cd "$root"
  export DATABASE_URL="$SRC_URL" DIRECT_URL="$SRC_URL"
  case "$DATABASE_URL$DIRECT_URL" in
    *127.0.0.1:${SRC_PORT}*127.0.0.1:${SRC_PORT}*) ;;
    *) echo "✖ refusing: not the local rehearsal database" && exit 1 ;;
  esac
  npx prisma migrate deploy >/dev/null
  node prisma/seed.js >/dev/null
)
psql -X -q -v ON_ERROR_STOP=1 -d "$SRC_URL" <<'SQL'
insert into enquiries (id, name, email, phone, requirement, status, created_at, updated_at)
select 'rehearsal-' || g, 'Rehearsal ' || g, 'rehearsal' || g || '@test.local', '+919820000000',
       'Road Signs', 'NEW', now(), now()
from generate_series(1, 25) g;
SQL

passphrase="rehearsal-$(date +%s)-$RANDOM$RANDOM"
SOURCE_URL="$SRC_URL" RESTORE_URL="$DST_URL" BACKUP_PASSPHRASE="$passphrase" OUT_DIR="$out" \
  bash "$here/backup-and-verify.sh"

echo "▶ A wrong passphrase must not open the dump"
if gpg --batch --quiet --pinentry-mode loopback --passphrase-fd 0 --decrypt \
  --output /dev/null "$out"/*.dump.gpg <<< "wrong-passphrase" 2>/dev/null; then
  echo "✖ the dump opened with a wrong passphrase" && exit 1
fi
echo "✓ Encrypted: a wrong passphrase is refused"
echo "✓ Rehearsal passed on $(date -u +%Y-%m-%d)"
