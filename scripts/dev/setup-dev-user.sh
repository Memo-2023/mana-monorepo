#!/usr/bin/env bash
#
# setup-dev-user.sh — Create a local-dev user account end-to-end.
#
# Calls mana-auth's POST /api/v1/auth/register (which goes through
# Better Auth's signUpEmail), then runs an idempotent SQL UPDATE to
# mark the email as verified and lift the access tier to 'founder'
# so the new user can immediately exercise every tier-gated module.
#
# Why both steps?
#   - Better Auth's createUser hashes the password the way the runtime
#     expects (scrypt). Hand-rolling INSERTs in raw SQL would either
#     hash wrong (login fails) or pull a moving-target dependency.
#   - The local mana-auth has `requireEmailVerification: true` and no
#     real SMTP wired up. The verification token sits in
#     `auth.verification` waiting for someone to click it. The SQL
#     bypass at the end is the standard local-dev shortcut.
#   - The default tier is `public`. Founder is the highest tier so
#     every requiredTier check passes — that's the point of a dev
#     account.
#
# Usage:
#   ./scripts/dev/setup-dev-user.sh                  # creates the 3 default accounts
#   ./scripts/dev/setup-dev-user.sh email@x.de pass  # creates a single account
#
# Defaults are tills95@gmail.com, tilljkb@gmail.com, rajiehq@gmail.com
# all with password "Aa-123456789".
#
# Idempotent: existing users get tier/email_verified re-applied without
# touching their password. Re-running the script after a partial setup
# is safe.
#
# Prereqs:
#   - Postgres up + reachable at localhost:5432 (`pnpm docker:up`)
#   - mana-auth running on :3001 (`pnpm dev:auth`)
#   - psql in PATH

set -euo pipefail

# ─── Config ──────────────────────────────────────────────────
AUTH_URL="${AUTH_URL:-http://localhost:3001}"
DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-5432}"
DB_USER="${DB_USER:-mana}"
DB_PASS="${DB_PASS:-devpassword}"
DB_NAME="${DB_NAME:-mana_platform}"
TIER="${TIER:-founder}"
ROLE="${ROLE:-admin}"

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
DIM='\033[2m'
NC='\033[0m'

# ─── Preflight ───────────────────────────────────────────────
if ! command -v psql >/dev/null 2>&1; then
	echo -e "${RED}error:${NC} psql not in PATH. Install postgres client first."
	exit 1
fi

if ! curl -fsS "${AUTH_URL}/health" >/dev/null 2>&1 \
	&& ! curl -fsS "${AUTH_URL}/api/v1/auth/signup-status" >/dev/null 2>&1; then
	echo -e "${RED}error:${NC} mana-auth not reachable at ${AUTH_URL}."
	echo -e "${DIM}       Start it with: pnpm dev:auth${NC}"
	exit 1
fi

# ─── Create-or-promote one user ──────────────────────────────
create_user() {
	local email="$1"
	local password="$2"
	local name
	name="${email%@*}"

	echo -e "\n${GREEN}→${NC} ${email}"

	# Step 1: register via mana-auth (Better Auth signUpEmail under the hood)
	local response http_code
	response=$(curl -sS -o /tmp/setup-dev-user.body -w "%{http_code}" \
		-X POST "${AUTH_URL}/api/v1/auth/register" \
		-H "Content-Type: application/json" \
		-d "{\"email\":\"${email}\",\"password\":\"${password}\",\"name\":\"${name}\"}" \
		|| true)
	http_code="${response}"
	local body
	body="$(cat /tmp/setup-dev-user.body || true)"
	rm -f /tmp/setup-dev-user.body

	case "${http_code}" in
		200|201)
			echo -e "  ${DIM}registered${NC}"
			;;
		409)
			echo -e "  ${YELLOW}already exists${NC} — re-applying tier/verification"
			;;
		429)
			echo -e "  ${RED}rate limit hit${NC}: ${body}"
			return 1
			;;
		*)
			echo -e "  ${RED}register failed (HTTP ${http_code})${NC}: ${body}"
			return 1
			;;
	esac

	# Step 2: idempotent SQL — verify email, lift tier, gift sync.
	# Quoting note: the table is auth.users (Better Auth schema), columns
	# are email_verified + access_tier. The access_tier enum lives in the
	# public schema (Drizzle's pgEnum default), so the cast is just
	# `::access_tier`, NOT `auth.access_tier`. We bind email + tier as
	# psql vars to dodge any quoting weirdness.
	#
	# The sync_subscriptions upsert makes Cloud Sync work out of the box
	# for dev accounts. `is_gifted = true` means the recurring-billing
	# cron in mana-credits skips the row and sync stays on indefinitely —
	# same effect as if an admin had called POST /api/v1/admin/sync/:id/gift.
	# Without this, the sync-billing status endpoint returns active=false
	# and the UI shows "Lokal" even though the Go mana-sync would fail-open
	# (which makes the inactive indicator a dev-only lie). The sync schema
	# lives inside mana_platform (credits.sync_subscriptions) — it's only
	# a separate *service*, not a separate DB.
	PGPASSWORD="${DB_PASS}" psql -q \
		-h "${DB_HOST}" -p "${DB_PORT}" -U "${DB_USER}" -d "${DB_NAME}" \
		-v ON_ERROR_STOP=1 \
		-v email="${email}" \
		-v tier="${TIER}" \
		-v role="${ROLE}" \
		<<-'SQL'
			-- access_tier and role are orthogonal: tier gates product
			-- features per user (public < beta < alpha < founder), role
			-- gates backend admin endpoints (role=admin required for
			-- e.g. /api/v1/admin/sync/:id/gift). Dev accounts want both.
			UPDATE auth.users
			SET email_verified = true,
			    access_tier    = :'tier'::access_tier,
			    role           = :'role'::user_role,
			    updated_at     = NOW()
			WHERE email = :'email';

			INSERT INTO credits.sync_subscriptions
				(user_id, active, billing_interval, amount_charged,
				 activated_at, is_gifted, gifted_by, gifted_at,
				 created_at, updated_at)
			SELECT id, true, 'monthly', 0,
			       NOW(), true, 'setup-dev-user.sh', NOW(),
			       NOW(), NOW()
			FROM auth.users
			WHERE email = :'email'
			ON CONFLICT (user_id) DO UPDATE
			SET active     = true,
			    is_gifted  = true,
			    updated_at = NOW();
		SQL

	# Verify final state and report
	local row
	row=$(PGPASSWORD="${DB_PASS}" psql -t -A \
		-h "${DB_HOST}" -p "${DB_PORT}" -U "${DB_USER}" -d "${DB_NAME}" \
		-c "SELECT id, email_verified, access_tier, role FROM auth.users WHERE email = '${email}';")
	if [[ -z "${row}" ]]; then
		echo -e "  ${RED}user row missing after register${NC}"
		return 1
	fi
	echo -e "  ${DIM}${row}${NC}"
	echo -e "  ${GREEN}✓${NC} email=${email}  password=${password}  tier=${TIER}  role=${ROLE}  sync=gifted"
}

# ─── Main ────────────────────────────────────────────────────
if [[ $# -eq 2 ]]; then
	create_user "$1" "$2"
else
	echo -e "${GREEN}Creating default dev users (tier=${TIER}, role=${ROLE}, sync=gifted)…${NC}"
	create_user "tills95@gmail.com"  "Aa-123456789"
	create_user "tilljkb@gmail.com"  "Aa-123456789"
	create_user "rajiehq@gmail.com"  "Aa-123456789"
fi

echo -e "\n${GREEN}✓ Done.${NC} Login at ${AUTH_URL/3001/5173}/login"
