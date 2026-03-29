#!/bin/bash
# Memory Baseline Script
# Run on the Mac Mini to measure actual container memory usage
# Usage: ./scripts/mac-mini/memory-baseline.sh [--watch]

set -euo pipefail

BOLD="\033[1m"
GREEN="\033[0;32m"
YELLOW="\033[0;33m"
RED="\033[0;31m"
CYAN="\033[0;36m"
RESET="\033[0m"

echo -e "${BOLD}╔══════════════════════════════════════════════════╗${RESET}"
echo -e "${BOLD}║       Mana Docker Memory Baseline Report        ║${RESET}"
echo -e "${BOLD}╚══════════════════════════════════════════════════╝${RESET}"
echo ""
echo -e "${CYAN}Timestamp:${RESET} $(date '+%Y-%m-%d %H:%M:%S')"
echo ""

# Get Colima VM memory
COLIMA_MEM=$(colima list -j 2>/dev/null | python3 -c "import sys,json; d=json.load(sys.stdin); print(d[0].get('memory',0))" 2>/dev/null || echo "unknown")
if [ "$COLIMA_MEM" != "unknown" ] && [ "$COLIMA_MEM" -gt 0 ] 2>/dev/null; then
  COLIMA_MEM_GB=$(echo "scale=1; $COLIMA_MEM / 1073741824" | bc 2>/dev/null || echo "$COLIMA_MEM")
  echo -e "${CYAN}Colima VM Memory:${RESET} ${COLIMA_MEM_GB} GB"
else
  echo -e "${CYAN}Colima VM Memory:${RESET} (run 'colima list' to check)"
fi
echo ""

# Docker stats snapshot (no-stream = one-shot)
echo -e "${BOLD}── Per-Container Memory Usage ──${RESET}"
echo ""
printf "${BOLD}%-40s %10s %10s %10s${RESET}\n" "CONTAINER" "MEM USAGE" "MEM LIMIT" "MEM %"
echo "────────────────────────────────────────────────────────────────────────"

# Collect stats and sort by memory usage (descending)
docker stats --no-stream --format "{{.Name}}\t{{.MemUsage}}\t{{.MemPerc}}" | \
  sort -t$'\t' -k2 -h -r | \
  while IFS=$'\t' read -r name usage perc; do
    # Extract just the usage part (before " / ")
    mem_used=$(echo "$usage" | cut -d'/' -f1 | xargs)
    mem_limit=$(echo "$usage" | cut -d'/' -f2 | xargs)
    perc_num=$(echo "$perc" | tr -d '%')

    # Color based on percentage
    if (( $(echo "$perc_num > 80" | bc -l 2>/dev/null || echo 0) )); then
      COLOR=$RED
    elif (( $(echo "$perc_num > 50" | bc -l 2>/dev/null || echo 0) )); then
      COLOR=$YELLOW
    else
      COLOR=$GREEN
    fi

    printf "%-40s %10s %10s ${COLOR}%10s${RESET}\n" "$name" "$mem_used" "$mem_limit" "$perc"
  done

echo ""
echo -e "${BOLD}── Category Summary ──${RESET}"
echo ""

# Category totals using docker stats
get_category_mem() {
  local pattern="$1"
  docker stats --no-stream --format "{{.Name}}\t{{.MemUsage}}" | \
    grep "$pattern" | \
    awk -F'\t' '{
      split($2, a, "/");
      gsub(/[[:space:]]/, "", a[1]);
      val = a[1];
      if (index(val, "GiB") > 0) { gsub(/GiB/, "", val); total += val * 1024; }
      else if (index(val, "MiB") > 0) { gsub(/MiB/, "", val); total += val; }
      else if (index(val, "KiB") > 0) { gsub(/KiB/, "", val); total += val / 1024; }
    } END { printf "%.0f", total }'
}

infra=$(get_category_mem "mana-infra")
core=$(get_category_mem "mana-core\|mana-auth\|mana-credits\|mana-user\|mana-subscriptions\|mana-analytics\|mana-api-gateway\|mana-crawler\|mana-service")
matrix=$(get_category_mem "mana-matrix")
apps=$(get_category_mem "mana-app")
monitoring=$(get_category_mem "mana-mon")
games=$(get_category_mem "mana-game")
auto=$(get_category_mem "mana-auto")

total=$((infra + core + matrix + apps + monitoring + games + auto))

printf "%-25s %8s MiB\n" "Infrastructure:" "$infra"
printf "%-25s %8s MiB\n" "Core Services:" "$core"
printf "%-25s %8s MiB\n" "Matrix Stack:" "$matrix"
printf "%-25s %8s MiB\n" "Web Apps:" "$apps"
printf "%-25s %8s MiB\n" "Monitoring:" "$monitoring"
printf "%-25s %8s MiB\n" "Games:" "$games"
printf "%-25s %8s MiB\n" "Automation:" "$auto"
echo "─────────────────────────────────────"
printf "${BOLD}%-25s %8s MiB (%.1f GiB)${RESET}\n" "TOTAL:" "$total" "$(echo "scale=1; $total / 1024" | bc)"

echo ""
echo -e "${BOLD}── Container Count ──${RESET}"
echo ""
running=$(docker ps -q | wc -l | xargs)
stopped=$(docker ps -aq --filter "status=exited" | wc -l | xargs)
echo "Running: $running | Stopped: $stopped | Total: $((running + stopped))"

echo ""
echo -e "${BOLD}── Recommendations ──${RESET}"
echo ""

if [ "$total" -gt 10240 ]; then
  echo -e "${RED}WARNING: Total usage exceeds 10 GiB — builds will struggle${RESET}"
elif [ "$total" -gt 8192 ]; then
  echo -e "${YELLOW}NOTICE: Usage above 8 GiB — builds may need monitoring stopped${RESET}"
else
  echo -e "${GREEN}OK: Usage under 8 GiB — sufficient headroom for builds${RESET}"
fi

# Watch mode
if [ "${1:-}" = "--watch" ]; then
  echo ""
  echo -e "${CYAN}Entering watch mode (Ctrl+C to exit)...${RESET}"
  echo ""
  docker stats --format "table {{.Name}}\t{{.MemUsage}}\t{{.MemPerc}}\t{{.CPUPerc}}"
fi
