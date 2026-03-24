#!/bin/bash
# tune-tcp.sh — Reduce TCP TIME_WAIT accumulation on macOS
#
# Problem: With 72+ Docker containers each running health checks,
# TIME_WAIT sockets accumulate and can exhaust ephemeral ports.
#
# macOS default MSL (Maximum Segment Lifetime) is 15000ms (15s),
# meaning TIME_WAIT lasts 30s (2x MSL). This script reduces MSL
# to 5000ms (5s), so TIME_WAIT drops to 10s.
#
# Usage:
#   sudo ./tune-tcp.sh          # Apply settings
#   ./tune-tcp.sh --status      # Check current values (no sudo needed)
#
# To run at boot, add to a launchd plist or call from startup.sh

set -euo pipefail

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

show_status() {
    echo "=== TCP Tuning Status ==="
    echo ""

    # Current MSL value
    CURRENT_MSL=$(sysctl -n net.inet.tcp.msl 2>/dev/null || echo "unknown")
    echo -e "net.inet.tcp.msl:        ${YELLOW}${CURRENT_MSL}${NC} ms (TIME_WAIT = 2x MSL = $((CURRENT_MSL * 2 / 1000))s)"

    # TIME_WAIT socket count
    TW_COUNT=$(netstat -n -p tcp 2>/dev/null | grep -c TIME_WAIT || echo "0")
    if [ "$TW_COUNT" -gt 500 ]; then
        echo -e "TIME_WAIT sockets:       ${RED}${TW_COUNT}${NC} (high!)"
    elif [ "$TW_COUNT" -gt 100 ]; then
        echo -e "TIME_WAIT sockets:       ${YELLOW}${TW_COUNT}${NC} (moderate)"
    else
        echo -e "TIME_WAIT sockets:       ${GREEN}${TW_COUNT}${NC} (healthy)"
    fi

    # Ephemeral port range
    FIRST=$(sysctl -n net.inet.ip.portrange.first 2>/dev/null || echo "unknown")
    LAST=$(sysctl -n net.inet.ip.portrange.last 2>/dev/null || echo "unknown")
    if [ "$FIRST" != "unknown" ] && [ "$LAST" != "unknown" ]; then
        AVAILABLE=$((LAST - FIRST))
        echo -e "Ephemeral port range:    ${FIRST}-${LAST} (${AVAILABLE} ports)"
        if [ "$TW_COUNT" != "0" ] && [ "$AVAILABLE" -gt 0 ]; then
            USAGE_PCT=$((TW_COUNT * 100 / AVAILABLE))
            echo -e "Port usage by TIME_WAIT: ${USAGE_PCT}%"
        fi
    fi

    echo ""
}

apply_settings() {
    if [ "$(id -u)" -ne 0 ]; then
        echo -e "${RED}Error: Must run as root (sudo) to change sysctl values${NC}"
        echo "Usage: sudo $0"
        exit 1
    fi

    echo "=== Applying TCP Tuning ==="
    echo ""

    # Show before
    BEFORE_MSL=$(sysctl -n net.inet.tcp.msl 2>/dev/null)
    echo "Before: net.inet.tcp.msl = ${BEFORE_MSL}ms (TIME_WAIT = $((BEFORE_MSL * 2 / 1000))s)"

    # Set MSL to 5000ms (TIME_WAIT will be 10s instead of 30s)
    sysctl -w net.inet.tcp.msl=5000

    # Show after
    AFTER_MSL=$(sysctl -n net.inet.tcp.msl 2>/dev/null)
    echo -e "After:  net.inet.tcp.msl = ${GREEN}${AFTER_MSL}${NC}ms (TIME_WAIT = $((AFTER_MSL * 2 / 1000))s)"

    echo ""
    echo -e "${GREEN}TCP tuning applied successfully.${NC}"
    echo "Note: This setting does not persist across reboots."
    echo "Add this script to startup.sh or a launchd plist for persistence."
    echo ""

    show_status
}

# Main
case "${1:-apply}" in
    --status|-s|status)
        show_status
        ;;
    *)
        apply_settings
        ;;
esac
