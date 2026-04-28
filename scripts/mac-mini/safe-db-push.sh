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

# Drizzle-kit must be available as a workspace-local module — its
# binary AND the import that drizzle.config.ts performs both go
# through Node's local-dir resolver. The CD pipeline runs `pnpm
# install --filter ./services/<svc>...` before invoking this script
# so every Drizzle service has node_modules/.bin/drizzle-kit + the
# importable package linked. `pnpm dlx` doesn't work here because
# its global cache isn't on Node's resolution path for the config
# file's `import { defineConfig } from 'drizzle-kit'`.
if ! pnpm exec drizzle-kit --version >/dev/null 2>&1; then
	echo "[safe-db-push] $SVC: drizzle-kit not installed in workspace — run \`pnpm install --filter ./services/$SVC...\` first"
	exit 0
fi

# Snapshot the existing drizzle/ artifacts before we generate. Anything
# new (or newly modified) afterwards is the probe trail this run left
# behind, which the cleanup trap will tear down — even on failure — so
# the runner doesn't accumulate pseudo-migration files between deploys.
DRIZZLE_DIR_EXISTED=false
[ -d drizzle ] && DRIZZLE_DIR_EXISTED=true
PRE_GEN_FILES=$(find drizzle -maxdepth 3 -type f 2>/dev/null | sort || true)

# Generate-only — does not touch the database.
echo "[safe-db-push] $SVC: generating diff…"
GEN_OUT=$(pnpm exec drizzle-kit generate --name "__ci_safety_check_$$" 2>&1 || true)
echo "$GEN_OUT" | tail -20

POST_GEN_FILES=$(find drizzle -maxdepth 3 -type f 2>/dev/null | sort || true)
NEW_GEN_FILES=$(comm -13 <(echo "$PRE_GEN_FILES") <(echo "$POST_GEN_FILES") | grep -v '^$' || true)

# Trap so we always tear down the probe trail (SQL + snapshot + journal
# + the whole drizzle/ tree if we created it), even on failure or
# early-exit. Without this the runner accumulates one pseudo-migration
# pair per deploy and `git status` slowly turns into noise.
cleanup() {
	# Remove every file we wrote. Sorted in reverse so deeper paths go
	# before their parents (relevant for the rmdir cleanup below).
	for f in $(echo "$NEW_GEN_FILES" | tr ' ' '\n' | sort -r); do
		[ -n "$f" ] && rm -f "$f"
	done
	# Strip our probe entry from the journal so legitimate generates
	# don't see a phantom "__ci_safety_check" tag.
	if [ -f drizzle/meta/_journal.json ] && command -v jq >/dev/null 2>&1; then
		tmp=$(mktemp)
		jq '.entries |= map(select(.tag | test("__ci_safety_check") | not))' \
			drizzle/meta/_journal.json > "$tmp" && mv "$tmp" drizzle/meta/_journal.json || true
	fi
	# Drop empty dirs we may have created (drizzle/, drizzle/meta/).
	if [ "$DRIZZLE_DIR_EXISTED" = "false" ]; then
		rm -rf drizzle 2>/dev/null || true
	else
		# Existing dir — only sweep empty subdirs we touched.
		rmdir drizzle/meta 2>/dev/null || true
	fi
}
trap cleanup EXIT

# New SQL files = the diff
NEW_SQL=$(echo "$NEW_GEN_FILES" | grep '\.sql$' || true)

if [ -z "$NEW_SQL" ]; then
	echo "[safe-db-push] $SVC: no schema changes — clean."
	exit 0
fi

echo "[safe-db-push] $SVC: schema diff detected:"
echo "$NEW_SQL"

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
