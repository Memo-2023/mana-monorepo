#!/bin/bash
#
# Rebuild the Mac Mini Cloudflare tunnel as a locally-managed tunnel.
#
# WHY:
#   The original `mana-server` tunnel was created via the Cloudflare
#   dashboard, which makes it remotely-managed: cloudflared loads its
#   ingress rules from Cloudflare's API and ignores the local config
#   file's `ingress:` section. There is no documented way to convert
#   a remotely-managed tunnel to locally-managed (cloudflared#843
#   has been open for years), so the only path to single-source-of-
#   truth file management is to delete and recreate the tunnel.
#
# WHAT THIS DOES (in order):
#   1. Snapshot baseline HTTP statuses for every hostname currently
#      in cloudflared-config.yml — for an after/before diff at the end
#   2. Backup the existing credentials .json (cannot be restored after
#      delete since the cloud config also goes away, but useful for
#      cross-referencing the old tunnel ID)
#   3. Delete the existing tunnel via `cloudflared tunnel delete -f`
#   4. Create a new tunnel with the same name `mana-server`. Cloudflare
#      generates a new UUID and writes a new credentials .json
#   5. Patch the new tunnel ID + credentials path into both
#      ~/projects/mana-monorepo/cloudflared-config.yml AND
#      ~/.cloudflared/config.yml
#   6. For each hostname in the config file, run
#      `cloudflared tunnel route dns -f mana-server <hostname>` so the
#      Cloudflare DNS CNAME for the hostname re-points at the new tunnel
#   7. launchctl kickstart -k cloudflared to pick up the new credentials
#   8. Wait for the tunnel to register, then HTTP-probe every hostname
#      and report any that didn't come back up
#
# DOWNTIME:
#   ~30-90 seconds total. Step 3 (delete) immediately blackholes ALL
#   public mana.how URLs. Steps 4-6 take ~30-60s. Step 7 brings the
#   tunnel back up. After that DNS edge propagation may add another
#   10-30s for some Cloudflare PoPs.
#
# ROLLBACK:
#   The old tunnel is gone forever after step 3. There is no rollback
#   to the old tunnel ID. If something breaks during this script, the
#   recovery path is to re-run this same script (it's idempotent for
#   already-routed hostnames thanks to the -f flag on the dns command).
#
# RUN ON: the mana-server itself, NOT from a dev box. The cloudflared
# CLI needs the cert.pem from `cloudflared tunnel login` which lives in
# ~/.cloudflared/ on the server.

set -euo pipefail

# ─── Configuration ─────────────────────────────────────────

CLOUDFLARED=/opt/homebrew/bin/cloudflared
TUNNEL_NAME="mana-server"
REPO_CONFIG="$HOME/projects/mana-monorepo/cloudflared-config.yml"
CLOUDFLARED_DIR="$HOME/.cloudflared"
LOCAL_CONFIG="$CLOUDFLARED_DIR/config.yml"
PLIST_FILE="$HOME/Library/LaunchAgents/com.cloudflare.cloudflared.plist"
TIMESTAMP=$(date +%s)
BACKUP_DIR="$CLOUDFLARED_DIR/rebuild-backup-$TIMESTAMP"

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

log() { echo -e "${GREEN}[$(date +%H:%M:%S)]${NC} $*"; }
warn() { echo -e "${YELLOW}[$(date +%H:%M:%S)] WARN${NC} $*"; }
err() { echo -e "${RED}[$(date +%H:%M:%S)] ERROR${NC} $*"; }

# ─── Pre-flight checks ─────────────────────────────────────

[ -x "$CLOUDFLARED" ] || { err "$CLOUDFLARED not found or not executable"; exit 1; }
[ -f "$REPO_CONFIG" ] || { err "$REPO_CONFIG not found — pull repo first"; exit 1; }
[ -f "$CLOUDFLARED_DIR/cert.pem" ] || { err "$CLOUDFLARED_DIR/cert.pem missing — run 'cloudflared tunnel login' first"; exit 1; }
command -v jq >/dev/null || { err "jq is required"; exit 1; }

OLD_TUNNEL_ID=$($CLOUDFLARED tunnel list -o json 2>/dev/null | jq -r ".[] | select(.name==\"$TUNNEL_NAME\") | .id")
if [ -z "$OLD_TUNNEL_ID" ]; then
    err "No tunnel named '$TUNNEL_NAME' found. Aborting."
    exit 1
fi

log "Old tunnel ID: $OLD_TUNNEL_ID"

# Extract hostname list from the repo config
HOSTNAMES=$(grep -E "^\s+- hostname:" "$REPO_CONFIG" | awk '{print $3}')
HOSTNAME_COUNT=$(echo "$HOSTNAMES" | wc -l | tr -d ' ')
log "Repo config has $HOSTNAME_COUNT hostnames"

# ─── Confirmation ──────────────────────────────────────────

if [ "${1:-}" != "--yes" ]; then
    echo ""
    warn "This will:"
    warn "  - DELETE the existing tunnel '$TUNNEL_NAME' (ID: $OLD_TUNNEL_ID)"
    warn "  - Take ALL $HOSTNAME_COUNT public mana.how URLs offline for ~30-90s"
    warn "  - Recreate the tunnel as locally-managed"
    warn "  - Re-route every hostname's DNS CNAME at the new tunnel"
    echo ""
    read -r -p "Type 'rebuild' to proceed: " CONFIRM
    if [ "$CONFIRM" != "rebuild" ]; then
        log "Aborted by user."
        exit 0
    fi
fi

mkdir -p "$BACKUP_DIR"
log "Backups will be written to $BACKUP_DIR"

# ─── Step 1: Baseline HTTP probe ───────────────────────────

log "Step 1/8: Probing baseline HTTP statuses for all hostnames..."
BASELINE_FILE="$BACKUP_DIR/baseline-http-statuses.txt"
: > "$BASELINE_FILE"
for host in $HOSTNAMES; do
    [ "$host" = "ssh.mana.how" ] && continue   # SSH-only, no HTTP
    code=$(curl -s -o /dev/null -m 5 -w "%{http_code}" "https://$host" 2>/dev/null || echo "000")
    printf "%-35s %s\n" "$host" "$code" | tee -a "$BASELINE_FILE"
done

# ─── Step 2: Backup credentials ────────────────────────────

log "Step 2/8: Backing up existing credentials and config files..."
cp "$CLOUDFLARED_DIR/$OLD_TUNNEL_ID.json" "$BACKUP_DIR/old-credentials.json"
cp "$LOCAL_CONFIG" "$BACKUP_DIR/old-local-config.yml" 2>/dev/null || true
cp "$REPO_CONFIG" "$BACKUP_DIR/old-repo-config.yml"
log "  ✓ backed up credentials + configs"

# ─── Step 3: Delete the old tunnel ─────────────────────────

log "Step 3/8: Deleting old tunnel (force, all connections drop now)..."
$CLOUDFLARED tunnel delete -f "$TUNNEL_NAME"
log "  ✓ tunnel $OLD_TUNNEL_ID deleted"

# ─── Step 4: Create new tunnel ─────────────────────────────

log "Step 4/8: Creating new tunnel '$TUNNEL_NAME'..."
CREATE_OUT=$($CLOUDFLARED tunnel create "$TUNNEL_NAME" 2>&1)
echo "$CREATE_OUT"
NEW_TUNNEL_ID=$(echo "$CREATE_OUT" | grep -oE "[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}" | head -1)
if [ -z "$NEW_TUNNEL_ID" ]; then
    NEW_TUNNEL_ID=$($CLOUDFLARED tunnel list -o json | jq -r ".[] | select(.name==\"$TUNNEL_NAME\") | .id")
fi
[ -n "$NEW_TUNNEL_ID" ] || { err "could not determine new tunnel ID"; exit 1; }
log "  ✓ new tunnel ID: $NEW_TUNNEL_ID"

NEW_CREDS="$CLOUDFLARED_DIR/$NEW_TUNNEL_ID.json"
[ -f "$NEW_CREDS" ] || { err "expected credentials file $NEW_CREDS not found"; exit 1; }

# ─── Step 5: Patch config files with the new tunnel id ────

log "Step 5/8: Patching cloudflared-config.yml with the new tunnel ID..."
sed -i.bak "s|$OLD_TUNNEL_ID|$NEW_TUNNEL_ID|g" "$REPO_CONFIG"
rm -f "$REPO_CONFIG.bak"

# Mirror to ~/.cloudflared/config.yml as a defensive copy so anything
# that defaults to that path also sees the new tunnel id.
cp "$REPO_CONFIG" "$LOCAL_CONFIG"
log "  ✓ both config files now reference $NEW_TUNNEL_ID"

# Validate the new config syntactically before continuing
$CLOUDFLARED tunnel --config "$REPO_CONFIG" ingress validate
log "  ✓ ingress validate passed"

# ─── Step 6: DNS routes ────────────────────────────────────

log "Step 6/8: Routing $HOSTNAME_COUNT hostnames at the new tunnel..."
ROUTE_FAILS=0
for host in $HOSTNAMES; do
    [ "$host" = "ssh.mana.how" ] && continue   # cloudflared tunnel route dns is for HTTP/TCP, ssh is special
    if $CLOUDFLARED tunnel route dns -f "$TUNNEL_NAME" "$host" 2>/dev/null; then
        printf "  ✓ %s\n" "$host"
    else
        printf "  ✗ %s (route failed)\n" "$host"
        ROUTE_FAILS=$((ROUTE_FAILS + 1))
    fi
done

# ssh.mana.how is special — needs `cloudflared tunnel route` with the TCP variant.
# Try it but don't fail the whole script if it doesn't work; the user can re-add manually.
if $CLOUDFLARED tunnel route dns -f "$TUNNEL_NAME" "ssh.mana.how" 2>/dev/null; then
    log "  ✓ ssh.mana.how"
else
    warn "  ssh.mana.how DNS route failed — re-add manually if SSH-via-Cloudflare is needed"
fi

if [ "$ROUTE_FAILS" -gt 0 ]; then
    warn "$ROUTE_FAILS DNS routes failed. Continuing — they can be re-tried after the tunnel is up."
fi

# ─── Step 7: Restart cloudflared ───────────────────────────

log "Step 7/8: Restarting cloudflared via launchctl kickstart..."
launchctl kickstart -k "gui/$(id -u)/com.cloudflare.cloudflared"
log "  waiting 8s for tunnel to register..."
sleep 8

# ─── Step 8: Verification ──────────────────────────────────

log "Step 8/8: Verifying every hostname comes back up..."
VERIFY_FILE="$BACKUP_DIR/post-rebuild-http-statuses.txt"
: > "$VERIFY_FILE"
DOWN_COUNT=0
for host in $HOSTNAMES; do
    [ "$host" = "ssh.mana.how" ] && continue
    code=$(curl -s -o /dev/null -m 8 -w "%{http_code}" "https://$host" 2>/dev/null || echo "000")
    printf "%-35s %s\n" "$host" "$code" | tee -a "$VERIFY_FILE"
    if [ "$code" = "000" ] || [ "$code" = "404" ]; then
        DOWN_COUNT=$((DOWN_COUNT + 1))
    fi
done

echo ""
log "=== Summary ==="
log "Old tunnel:    $OLD_TUNNEL_ID (deleted)"
log "New tunnel:    $NEW_TUNNEL_ID (locally-managed)"
log "Backup dir:    $BACKUP_DIR"
log "Hostnames:     $HOSTNAME_COUNT"
log "DNS failures:  $ROUTE_FAILS"
if [ "$DOWN_COUNT" -gt 0 ]; then
    warn "Hosts still down (404/000): $DOWN_COUNT — see $VERIFY_FILE for details"
    warn "Compare with $BASELINE_FILE to identify regressions."
else
    log "All hosts responding ✓"
fi
echo ""
log "Next steps:"
log "  1. From your dev box: cd ~/projects/mana-monorepo && git diff cloudflared-config.yml"
log "     -> review the tunnel-id change, then commit + push"
log "  2. Smoke-test the apps in your browser"
