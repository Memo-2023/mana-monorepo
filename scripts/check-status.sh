#!/usr/bin/env bash
# Requires: bash 3+, curl, python3 (for yaml parsing) or grep
# check-status.sh — Prüft die Erreichbarkeit aller mana.how-Dienste
# Liest direkt aus cloudflared-config.yml (Single Source of Truth)
# Usage: ./scripts/check-status.sh [--internal]
#   --internal  Prüft interne Ports statt externe Domains

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
CLOUDFLARED_CONFIG="$REPO_ROOT/cloudflared-config.yml"
TIMEOUT=8
INTERNAL=false

[[ "${1:-}" == "--internal" ]] && INTERNAL=true

# Farben
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
GRAY='\033[0;90m'
BOLD='\033[1m'
NC='\033[0m'

# Zähler
ok=0; warn=0; fail=0; total=0

# Temporäres Verzeichnis für parallele Ergebnisse
tmpdir=$(mktemp -d)
trap 'rm -rf "$tmpdir"' EXIT

check_url() {
  local url="$1"
  local label="$2"
  local outfile="$3"

  # Note: curl outputs "000" itself on connection failure, so no || fallback needed
  local code
  code=$(curl -o /dev/null -s -w "%{http_code}" --max-time "$TIMEOUT" "$url" 2>/dev/null)

  local icon
  if [[ "$code" =~ ^(200|201|204|301|302|303|307|308)$ ]]; then
    icon="✅"
  elif [[ "$code" =~ ^4 ]]; then
    # 4xx = server reachable, wrong path (API root returns 404 — use health endpoint)
    icon="⚠️"
  elif [[ "$code" == "000" ]]; then
    icon="⏱"
  else
    # 5xx or unknown
    icon="❌"
  fi

  printf "%s|%s|%s|%s\n" "$icon" "$code" "$label" "$url" > "$outfile"
}

echo ""
echo -e "${BOLD}ManaCore Service Status${NC}  $(date '+%Y-%m-%d %H:%M:%S')"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Alle Hostnamen aus cloudflared-config.yml extrahieren (ohne ssh.mana.how)
# Bash 3-kompatibel (kein mapfile)
hostnames=()
while IFS= read -r host; do
  hostnames+=("$host")
done < <(
  grep "hostname:" "$CLOUDFLARED_CONFIG" \
  | awk '{print $3}' \
  | grep -v "^ssh\." \
  | sort -u
)

# Parallel prüfen
i=0
for host in "${hostnames[@]}"; do
  url="https://$host"
  check_url "$url" "$host" "$tmpdir/$i" &
  i=$((i + 1))
done
wait

# Ergebnisse sammeln und sortieren
declare -a results_ok=()
declare -a results_warn=()
declare -a results_fail=()
declare -a results_4xx=()

for f in "$tmpdir"/*; do
  [[ -f "$f" ]] || continue
  IFS='|' read -r icon code label url < "$f"
  total=$((total + 1))
  line=$(printf "  %s  %-38s  %s  %s" "$icon" "$label" "$code" "$url")
  if [[ "$icon" == "✅" ]]; then
    results_ok+=("$line")
    ok=$((ok + 1))
  elif [[ "$icon" == "⏱" ]]; then
    results_warn+=("$line")
    warn=$((warn + 1))
  elif [[ "$icon" == "⚠️" ]]; then
    results_4xx+=("$line")
  else
    results_fail+=("$line")
    fail=$((fail + 1))
  fi
done

# Ausgabe
if [[ ${#results_ok[@]} -gt 0 ]]; then
  echo ""
  echo -e "${GREEN}${BOLD}ONLINE (${#results_ok[@]})${NC}"
  for line in "${results_ok[@]}"; do echo -e "${GREEN}${line}${NC}"; done
fi

if [[ ${#results_4xx[@]} -gt 0 ]]; then
  echo ""
  echo -e "${YELLOW}${BOLD}ERREICHBAR / 4xx — Root-Pfad nicht definiert (${#results_4xx[@]})${NC}"
  for line in "${results_4xx[@]}"; do echo -e "${YELLOW}${line}${NC}"; done
fi

if [[ ${#results_fail[@]} -gt 0 ]]; then
  echo ""
  echo -e "${RED}${BOLD}NICHT ERREICHBAR / 5xx (${#results_fail[@]})${NC}"
  for line in "${results_fail[@]}"; do echo -e "${RED}${line}${NC}"; done
fi

if [[ ${#results_warn[@]} -gt 0 ]]; then
  echo ""
  echo -e "${YELLOW}${BOLD}TIMEOUT / KEIN DNS (${#results_warn[@]})${NC}"
  for line in "${results_warn[@]}"; do echo -e "${YELLOW}${line}${NC}"; done
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "  ${GREEN}✅ Online: $ok${NC}   ${RED}❌ Down: $fail${NC}   ${YELLOW}⏱ Timeout: $warn${NC}   (Gesamt: $total)"
echo ""
