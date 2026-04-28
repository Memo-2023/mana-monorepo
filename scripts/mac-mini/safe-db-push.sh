#!/usr/bin/env bash
#
# Safely apply Drizzle schema changes to the prod Postgres for a single
# service.
#
# Why this exists: every Drizzle-using service has a `db:push` script
# but the CD pipeline never ran it, so schema changes drifted silently
# between the typed Drizzle definition and the live database. Today's
# audit found four such drifts (auth.users.kind, credits.sync_subscriptions,
# credits.reservations, event_discovery.*) — all additive, all easily
# applied once detected, but they should never have stayed undetected.
#
# How it works:
#   1. `drizzle-kit generate` produces a SQL diff file under the
#      service's `drizzle/` dir without applying it.
#   2. We grep the generated SQL for destructive patterns. If any are
#      found, we ABORT and refuse to apply — the operator must review
#      and run `drizzle-kit push --force` manually.
#   3. If only additive changes are present, we run `drizzle-kit push
#      --force` to apply them. Then delete the generated marker file
#      so it doesn't pile up in the repo.
#
# Destructive patterns we refuse to auto-apply:
#   - DROP TABLE / DROP COLUMN / DROP TYPE / DROP SCHEMA / DROP INDEX
#   - ALTER COLUMN ... TYPE  (change column type — usually data-loss)
#   - RENAME COLUMN / RENAME TABLE  (data still there, but breaking
#     change for any caller pinned to the old name)
#
# Usage: scripts/mac-mini/safe-db-push.sh <service-name>
# Env requirements:
#   - DATABASE_URL: connection string to apply migrations against
#   - PROJECT_DIR : repo root (the deploy workflow sets this)

set -euo pipefail

SVC="${1:?usage: $0 <service-name>}"
PROJECT_DIR="${PROJECT_DIR:-$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)}"
SVC_DIR="$PROJECT_DIR/services/$SVC"

if [ ! -d "$SVC_DIR" ]; then
	echo "[safe-db-push] $SVC: no service dir at $SVC_DIR — skipping"
	exit 0
fi
if [ ! -f "$SVC_DIR/drizzle.config.ts" ] && [ ! -f "$SVC_DIR/drizzle.config.js" ]; then
	echo "[safe-db-push] $SVC: no drizzle config — skipping"
	exit 0
fi
if ! grep -q '"db:push"' "$SVC_DIR/package.json" 2>/dev/null; then
	echo "[safe-db-push] $SVC: no db:push script — skipping"
	exit 0
fi

if [ -z "${DATABASE_URL:-}" ]; then
	echo "[safe-db-push] $SVC: DATABASE_URL not set — skipping"
	exit 0
fi

cd "$SVC_DIR"

# Snapshot the existing migration set before we generate. Anything new
# afterwards is the diff this push would apply.
PRE_GEN_FILES=$(find drizzle -maxdepth 2 -name '*.sql' 2>/dev/null | sort || true)

# Generate-only — does not touch the database.
echo "[safe-db-push] $SVC: generating diff…"
GEN_OUT=$(pnpm exec drizzle-kit generate --name "__ci_safety_check_$$" 2>&1 || true)
echo "$GEN_OUT" | tail -20

POST_GEN_FILES=$(find drizzle -maxdepth 2 -name '*.sql' 2>/dev/null | sort || true)

# New SQL files = the diff
NEW_SQL=$(comm -13 <(echo "$PRE_GEN_FILES") <(echo "$POST_GEN_FILES") | grep -v '^$' || true)

if [ -z "$NEW_SQL" ]; then
	echo "[safe-db-push] $SVC: no schema changes — clean."
	exit 0
fi

echo "[safe-db-push] $SVC: schema diff detected:"
echo "$NEW_SQL"

# Trap so we always remove the generated probe files, even on failure.
cleanup() {
	for f in $NEW_SQL; do
		rm -f "$f"
	done
	# drizzle-kit also writes a meta entry; remove the most recent one.
	if [ -f drizzle/meta/_journal.json ]; then
		# Best-effort cleanup — strip the entry that references our probe tag.
		# If jq isn't available, leave it; the next legitimate `db:push` will
		# overwrite anyway.
		if command -v jq >/dev/null 2>&1; then
			tmp=$(mktemp)
			jq '.entries |= map(select(.tag | test("__ci_safety_check") | not))' \
				drizzle/meta/_journal.json > "$tmp" && mv "$tmp" drizzle/meta/_journal.json || true
		fi
	fi
}
trap cleanup EXIT

# Refuse to auto-apply destructive changes. The operator must review
# and either fix the schema (if the diff was unintentional) or run
# `drizzle-kit push --force` manually after taking a fresh pg_dump.
DESTRUCTIVE_PATTERN='DROP[[:space:]]+(TABLE|COLUMN|TYPE|SCHEMA|INDEX|VIEW|FUNCTION)|ALTER[[:space:]]+TABLE.*ALTER[[:space:]]+COLUMN.*TYPE|RENAME[[:space:]]+(COLUMN|TABLE|TO)'

DESTRUCTIVE_HITS=""
for sql in $NEW_SQL; do
	hits=$(grep -niE "$DESTRUCTIVE_PATTERN" "$sql" || true)
	if [ -n "$hits" ]; then
		DESTRUCTIVE_HITS="$DESTRUCTIVE_HITS\n=== $sql ===\n$hits"
	fi
done

if [ -n "$DESTRUCTIVE_HITS" ]; then
	echo "[safe-db-push] $SVC: ✗ DESTRUCTIVE changes detected — refusing to auto-apply"
	echo "  Review the diff and run \`pnpm db:push --force\` manually after backup."
	echo -e "$DESTRUCTIVE_HITS"
	exit 1
fi

# Additive only — safe to apply.
echo "[safe-db-push] $SVC: ✓ additive only, applying…"
pnpm exec drizzle-kit push --force
echo "[safe-db-push] $SVC: ✓ schema is now in sync"
