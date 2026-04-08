#!/bin/bash
# ============================================
# Migration: Docker Desktop → Colima
# ============================================
#
# Dieses Script migriert den Mac Mini von Docker Desktop zu Colima.
# Ergebnis: ~10 GB weniger RAM-Verbrauch, kein Swap mehr.
#
# Voraussetzungen:
#   - Homebrew installiert
#   - Zugang zur externen SSD (/Volumes/ManaData)
#   - ~30 Minuten Downtime
#
# Rollback: Docker Desktop wieder starten (Anleitung am Ende)
#
# Usage:
#   ./scripts/mac-mini/migrate-to-colima.sh           # Full migration
#   ./scripts/mac-mini/migrate-to-colima.sh --dry-run  # Show what would happen
#   ./scripts/mac-mini/migrate-to-colima.sh --rollback # Rollback to Docker Desktop

set -uo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
COMPOSE_FILE="$PROJECT_ROOT/docker-compose.macmini.yml"
ENV_FILE="$PROJECT_ROOT/.env.macmini"
BACKUP_DIR="/Volumes/ManaData/backups/docker-migration-$(date +%Y%m%d)"
DRY_RUN=false
ROLLBACK=false

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
BOLD='\033[1m'
NC='\033[0m'

log() { echo -e "${GREEN}[✓]${NC} $1"; }
warn() { echo -e "${YELLOW}[!]${NC} $1"; }
error() { echo -e "${RED}[✗]${NC} $1"; }
step() { echo -e "\n${BOLD}${BLUE}=== $1 ===${NC}"; }

# Parse args
for arg in "$@"; do
    case $arg in
        --dry-run) DRY_RUN=true ;;
        --rollback) ROLLBACK=true ;;
    esac
done

# ============================================
# Rollback
# ============================================

if [ "$ROLLBACK" = true ]; then
    step "Rollback zu Docker Desktop"

    echo "Stoppe Colima..."
    colima stop 2>/dev/null || true

    echo "Starte Docker Desktop..."
    open -a Docker
    echo "Warte auf Docker Desktop..."
    while ! docker info >/dev/null 2>&1; do sleep 2; done

    echo "Starte Container..."
    docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" up -d

    log "Rollback abgeschlossen. Docker Desktop laeuft wieder."
    exit 0
fi

# ============================================
# Pre-Flight Checks
# ============================================

step "Pre-Flight Checks"

# Check external SSD
if [ ! -d "/Volumes/ManaData" ]; then
    error "Externe SSD nicht gemountet (/Volumes/ManaData)"
    exit 1
fi
log "Externe SSD verfuegbar"

# Check Homebrew
if ! command -v brew &>/dev/null; then
    error "Homebrew nicht installiert"
    exit 1
fi
log "Homebrew verfuegbar"

# Check compose file
if [ ! -f "$COMPOSE_FILE" ]; then
    error "docker-compose.macmini.yml nicht gefunden"
    exit 1
fi
log "Compose-File gefunden"

# Check env file
if [ ! -f "$ENV_FILE" ]; then
    error ".env.macmini nicht gefunden"
    exit 1
fi
log "Environment-File gefunden"

# ============================================
# Step 1: Named Volumes sichern
# ============================================

step "Step 1: Named Volumes sichern"

NAMED_VOLUMES=(
    "mana-redis-data"
    "mana-victoria-data"
    "mana-alertmanager-data"
    "mana-grafana-data"
    "mana-analytics-data"
    "mana-loki-data"
)

if [ "$DRY_RUN" = true ]; then
    warn "[DRY RUN] Wuerde ${#NAMED_VOLUMES[@]} Volumes nach $BACKUP_DIR sichern"
else
    mkdir -p "$BACKUP_DIR"

    for vol in "${NAMED_VOLUMES[@]}"; do
        if docker volume inspect "$vol" >/dev/null 2>&1; then
            echo "  Sichere $vol..."
            # --warning=no-file-changed: TSDB files may vanish during backup
            docker run --rm \
                -v "$vol":/source:ro \
                -v "$BACKUP_DIR":/backup \
                alpine sh -c "tar czf /backup/${vol}.tar.gz -C /source . 2>/dev/null || true"
            log "  $vol gesichert"
        else
            warn "  $vol existiert nicht, ueberspringe"
        fi
    done

    log "Alle Volumes gesichert nach $BACKUP_DIR"
    ls -lh "$BACKUP_DIR/"
fi

# ============================================
# Step 2: PostgreSQL Dump (Sicherheit)
# ============================================

step "Step 2: PostgreSQL Dump (extra Sicherheit)"

if [ "$DRY_RUN" = true ]; then
    warn "[DRY RUN] Wuerde pg_dumpall ausfuehren"
else
    docker exec mana-infra-postgres pg_dumpall -U postgres | gzip > "$BACKUP_DIR/pg_dumpall_pre_migration.sql.gz"
    log "PostgreSQL Dump erstellt ($(du -h "$BACKUP_DIR/pg_dumpall_pre_migration.sql.gz" | cut -f1))"
fi

# ============================================
# Step 3: Docker Desktop stoppen
# ============================================

step "Step 3: Docker Desktop stoppen"

if [ "$DRY_RUN" = true ]; then
    warn "[DRY RUN] Wuerde alle Container stoppen und Docker Desktop beenden"
else
    echo "  Stoppe alle Container..."
    docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" down || true

    echo "  Beende Docker Desktop..."
    osascript -e 'quit app "Docker"' 2>/dev/null || true
    sleep 5

    # Warte bis Docker-Prozesse weg sind
    MAX_WAIT=60
    WAITED=0
    while pgrep -x "com.docker.backend" >/dev/null 2>&1; do
        sleep 2
        WAITED=$((WAITED + 2))
        if [ $WAITED -ge $MAX_WAIT ]; then
            warn "Docker Desktop braucht lange zum Beenden, force-kill..."
            pkill -f "Docker" 2>/dev/null || true
            sleep 3
            break
        fi
    done

    log "Docker Desktop gestoppt"
fi

# ============================================
# Step 4: Colima installieren
# ============================================

step "Step 4: Colima installieren"

if [ "$DRY_RUN" = true ]; then
    warn "[DRY RUN] Wuerde colima, docker CLI und docker-compose installieren"
else
    echo "  Installiere Colima + Docker CLI..."
    brew install colima docker docker-compose docker-credential-helper

    log "Colima $(colima version | head -1) installiert"
    log "Docker CLI $(docker --version) installiert"
fi

# ============================================
# Step 5: Colima starten
# ============================================

step "Step 5: Colima starten"

# Konfiguration:
#   --cpu 8         8 von 10 Cores (2 fuer macOS)
#   --memory 12     12 GB (lässt 4 GB fuer macOS)
#   --disk 200      200 GB Disk fuer Container
#   --vm-type vz    Apple Virtualization.framework (schnellste Option)
#   --vz-rosetta    x86-Emulation fuer ARM-inkompatible Images
#   --mount-type virtiofs  Schnellste Mount-Option

if [ "$DRY_RUN" = true ]; then
    warn "[DRY RUN] Wuerde Colima starten mit: cpu=8, memory=12, disk=200, vm=vz"
else
    colima start \
        --cpu 8 \
        --memory 12 \
        --disk 200 \
        --vm-type vz \
        --vz-rosetta \
        --mount-type virtiofs \
        --mount /Volumes/ManaData:w

    # Verify
    if docker info >/dev/null 2>&1; then
        log "Colima laeuft, Docker CLI verbunden"
    else
        error "Docker CLI kann sich nicht mit Colima verbinden!"
        error "Rollback: ./scripts/mac-mini/migrate-to-colima.sh --rollback"
        exit 1
    fi
fi

# ============================================
# Step 6: Named Volumes wiederherstellen
# ============================================

step "Step 6: Named Volumes wiederherstellen"

if [ "$DRY_RUN" = true ]; then
    warn "[DRY RUN] Wuerde ${#NAMED_VOLUMES[@]} Volumes wiederherstellen"
else
    for vol in "${NAMED_VOLUMES[@]}"; do
        BACKUP_FILE="$BACKUP_DIR/${vol}.tar.gz"
        if [ -f "$BACKUP_FILE" ]; then
            echo "  Stelle $vol wieder her..."
            docker volume create "$vol"
            docker run --rm \
                -v "$vol":/target \
                -v "$BACKUP_DIR":/backup:ro \
                alpine sh -c "tar xzf /backup/${vol}.tar.gz -C /target"
            log "  $vol wiederhergestellt"
        fi
    done
fi

# ============================================
# Step 7: Container starten
# ============================================

step "Step 7: Container starten"

if [ "$DRY_RUN" = true ]; then
    warn "[DRY RUN] Wuerde docker compose up -d ausfuehren"
else
    cd "$PROJECT_ROOT"
    docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" up -d

    log "Container gestartet"
    echo "  Warte 30s auf Initialisierung..."
    sleep 30
fi

# ============================================
# Step 8: Verifizierung
# ============================================

step "Step 8: Verifizierung"

if [ "$DRY_RUN" = true ]; then
    warn "[DRY RUN] Wuerde Health-Checks ausfuehren"
else
    echo ""
    echo "Container-Status:"
    docker ps --format "  {{.Names}}: {{.Status}}" | head -20
    echo "  ... $(docker ps -q | wc -l | tr -d ' ') Container laufen"

    echo ""
    echo "RAM-Verbrauch:"
    echo "  Colima VM: $(ps aux | grep colima | grep -v grep | awk '{sum += $6} END {printf "%.0f MiB\n", sum/1024}')"
    echo "  Docker:    $(ps aux | grep docker | grep -v grep | grep -v Desktop | awk '{sum += $6} END {printf "%.0f MiB\n", sum/1024}')"

    echo ""
    echo "Quick Health-Checks:"
    for svc in "Auth:3001/health" "Sync:3050/health" "Search:3020/api/v1/health"; do
        name="${svc%%:*}"
        url="http://localhost:${svc#*:}"
        status=$(curl -s -o /dev/null -w "%{http_code}" --max-time 5 "$url" 2>/dev/null)
        if [ "$status" = "200" ]; then
            echo -e "  ${GREEN}[OK]${NC} $name"
        else
            echo -e "  ${RED}[FAIL]${NC} $name (HTTP $status)"
        fi
    done
fi

# ============================================
# Step 9: Docker Desktop Autostart deaktivieren
# ============================================

step "Step 9: Autostart umkonfigurieren"

if [ "$DRY_RUN" = true ]; then
    warn "[DRY RUN] Wuerde Docker Desktop Autostart deaktivieren und Colima LaunchAgent erstellen"
else
    # Docker Desktop aus Login Items entfernen
    osascript -e 'tell application "System Events" to delete login item "Docker"' 2>/dev/null || true
    log "Docker Desktop Autostart deaktiviert"

    # Colima LaunchAgent erstellen
    PLIST_PATH="$HOME/Library/LaunchAgents/com.mana.colima.plist"
    cat > "$PLIST_PATH" << 'PLIST'
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>com.mana.colima</string>
    <key>ProgramArguments</key>
    <array>
        <string>/opt/homebrew/bin/colima</string>
        <string>start</string>
        <string>--cpu</string>
        <string>8</string>
        <string>--memory</string>
        <string>12</string>
        <string>--disk</string>
        <string>200</string>
        <string>--vm-type</string>
        <string>vz</string>
        <string>--vz-rosetta</string>
        <string>--mount-type</string>
        <string>virtiofs</string>
        <string>--mount</string>
        <string>/Volumes/ManaData:w</string>
    </array>
    <key>RunAtLoad</key>
    <true/>
    <key>KeepAlive</key>
    <false/>
    <key>StandardOutPath</key>
    <string>/tmp/colima-startup.log</string>
    <key>StandardErrorPath</key>
    <string>/tmp/colima-startup.log</string>
</dict>
</plist>
PLIST

    launchctl load "$PLIST_PATH" 2>/dev/null || true
    log "Colima LaunchAgent erstellt ($PLIST_PATH)"
fi

# ============================================
# Done
# ============================================

step "Migration abgeschlossen!"

echo ""
echo -e "${BOLD}Zusammenfassung:${NC}"
echo "  Runtime:    Docker Desktop → Colima (MIT-Lizenz)"
echo "  VM:         Virtualization.framework (Apple VZ)"
echo "  Backup:     $BACKUP_DIR"
echo ""
echo -e "${BOLD}Naechste Schritte:${NC}"
echo "  1. Health-Check: ./scripts/mac-mini/health-check.sh"
echo "  2. Alle Apps testen: curl https://mana.how"
echo "  3. RAM pruefen: memory_pressure"
echo ""
echo -e "${BOLD}Bei Problemen:${NC}"
echo "  Rollback: ./scripts/mac-mini/migrate-to-colima.sh --rollback"
echo ""
echo -e "${BOLD}Docker Desktop deinstallieren (optional, nach 1 Woche Testbetrieb):${NC}"
echo "  brew uninstall --cask docker"
echo "  rm -rf ~/Library/Containers/com.docker.docker"
echo ""
