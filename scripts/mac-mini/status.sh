#!/bin/bash
# ManaCore Mac Mini Status Overview
# Shows the current state of all services

# Ensure PATH includes docker
export PATH="/usr/local/bin:/opt/homebrew/bin:$PATH"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
COMPOSE_FILE="$PROJECT_ROOT/docker-compose.macmini.yml"
ENV_FILE="$PROJECT_ROOT/.env.macmini"

# Colors
BOLD='\033[1m'
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo ""
echo -e "${BOLD}=========================================="
echo -e "  ManaCore Mac Mini Status"
echo -e "==========================================${NC}"
echo ""
echo -e "${BLUE}Time:${NC} $(date)"
echo -e "${BLUE}Hostname:${NC} $(hostname)"
echo -e "${BLUE}Uptime:${NC} $(uptime | sed 's/.*up //' | sed 's/,.*//')"
echo ""

# ============================================
# LaunchD Services
# ============================================
echo -e "${BOLD}LaunchD Services:${NC}"

check_launchd() {
    local label=$1
    local name=$2
    if launchctl list | grep -q "$label"; then
        echo -e "  ${GREEN}[Running]${NC} $name"
    else
        echo -e "  ${RED}[Stopped]${NC} $name"
    fi
}

check_launchd "com.cloudflare.cloudflared" "Cloudflared Tunnel"
check_launchd "com.manacore.docker-startup" "Docker Startup"
check_launchd "com.manacore.health-check" "Health Check (5min)"
check_launchd "com.manacore.stt" "STT Service (Whisper/Voxtral)"

# ============================================
# Docker Status
# ============================================
echo ""
echo -e "${BOLD}Docker Status:${NC}"

if docker info >/dev/null 2>&1; then
    echo -e "  ${GREEN}[Running]${NC} Docker Desktop"

    # Container count
    RUNNING=$(docker ps -q | wc -l | tr -d ' ')
    TOTAL=$(docker ps -aq | wc -l | tr -d ' ')
    echo -e "  ${BLUE}Containers:${NC} $RUNNING running / $TOTAL total"
else
    echo -e "  ${RED}[Stopped]${NC} Docker Desktop"
fi

# ============================================
# Container Details
# ============================================
echo ""
echo -e "${BOLD}Containers:${NC}"

if docker info >/dev/null 2>&1; then
    # Format: NAME | STATUS | PORTS
    docker ps -a --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" | while read line; do
        if echo "$line" | grep -q "Up"; then
            echo -e "  ${GREEN}$line${NC}"
        elif echo "$line" | grep -q "NAMES"; then
            echo -e "  ${BOLD}$line${NC}"
        else
            echo -e "  ${RED}$line${NC}"
        fi
    done
fi

# ============================================
# Native Services (non-Docker)
# ============================================
echo ""
echo -e "${BOLD}Native Services:${NC}"

# Ollama
if curl -s --max-time 2 http://localhost:11434/api/tags >/dev/null 2>&1; then
    OLLAMA_MODELS=$(curl -s http://localhost:11434/api/tags | grep -o '"name":"[^"]*"' | wc -l | tr -d ' ')
    echo -e "  ${GREEN}[Running]${NC} Ollama (${OLLAMA_MODELS} models)"
else
    echo -e "  ${YELLOW}[Stopped]${NC} Ollama"
fi

# STT Service
if curl -s --max-time 2 http://localhost:3020/health >/dev/null 2>&1; then
    echo -e "  ${GREEN}[Running]${NC} STT Service (port 3020)"
else
    echo -e "  ${YELLOW}[Stopped]${NC} STT Service"
fi

# ============================================
# Network/Tunnel Status
# ============================================
echo ""
echo -e "${BOLD}Network:${NC}"

if pgrep -x "cloudflared" >/dev/null; then
    echo -e "  ${GREEN}[Connected]${NC} Cloudflare Tunnel"

    # Check external connectivity
    if curl -s --max-time 3 https://mana.how >/dev/null 2>&1; then
        echo -e "  ${GREEN}[Reachable]${NC} https://mana.how"
    else
        echo -e "  ${YELLOW}[Unknown]${NC} https://mana.how (check from external)"
    fi
else
    echo -e "  ${RED}[Disconnected]${NC} Cloudflare Tunnel"
fi

# ============================================
# Disk Usage
# ============================================
echo ""
echo -e "${BOLD}Disk Usage:${NC}"
df -h / | tail -1 | awk '{print "  System: " $3 " used / " $2 " total (" $5 " full)"}'

if docker info >/dev/null 2>&1; then
    DOCKER_DISK=$(docker system df --format "{{.Size}}" 2>/dev/null | head -1)
    echo "  Docker: $DOCKER_DISK"
fi

# ============================================
# Recent Logs
# ============================================
echo ""
echo -e "${BOLD}Recent Activity:${NC}"
if [ -f /tmp/manacore-health.log ]; then
    echo "  Last health check:"
    tail -3 /tmp/manacore-health.log | sed 's/^/    /'
fi

echo ""
echo -e "${BLUE}Commands:${NC}"
echo "  Health check:  ./scripts/mac-mini/health-check.sh"
echo "  Restart all:   ./scripts/mac-mini/restart.sh"
echo "  View logs:     tail -f /tmp/manacore-startup.log"
echo ""
