#!/bin/bash
# ManaCore Health Check Script
# Checks all services and sends notifications on failure
#
# Notification channels (configure via environment or .env.notifications):
#   - Telegram: TELEGRAM_BOT_TOKEN + TELEGRAM_CHAT_ID
#   - Email: EMAIL_TO + EMAIL_FROM + SMTP_* settings
#   - ntfy: NTFY_TOPIC

# Ensure PATH includes docker
export PATH="/usr/local/bin:/opt/homebrew/bin:$PATH"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

# Load notification config if exists
if [ -f "$PROJECT_ROOT/.env.notifications" ]; then
    source "$PROJECT_ROOT/.env.notifications"
fi

# Colors for terminal output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Track failures
FAILURES=()

# ============================================
# Notification Functions
# ============================================

send_telegram() {
    local message="$1"

    if [ -z "$TELEGRAM_BOT_TOKEN" ] || [ -z "$TELEGRAM_CHAT_ID" ]; then
        return 0
    fi

    curl -s -X POST "https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage" \
        -d "chat_id=${TELEGRAM_CHAT_ID}" \
        -d "text=${message}" \
        -d "parse_mode=HTML" \
        >/dev/null 2>&1

    if [ $? -eq 0 ]; then
        echo "  [Telegram] Notification sent"
    else
        echo "  [Telegram] Failed to send"
    fi
}

send_email() {
    local subject="$1"
    local body="$2"

    if [ -z "$EMAIL_TO" ]; then
        return 0
    fi

    # Use msmtp if available, otherwise try mail command
    if command -v msmtp &> /dev/null; then
        echo -e "Subject: ${subject}\nFrom: ${EMAIL_FROM:-manacore@localhost}\nTo: ${EMAIL_TO}\n\n${body}" | \
            msmtp -a default "$EMAIL_TO" 2>/dev/null
    elif command -v mail &> /dev/null; then
        echo "$body" | mail -s "$subject" "$EMAIL_TO" 2>/dev/null
    elif command -v sendmail &> /dev/null; then
        echo -e "Subject: ${subject}\nFrom: ${EMAIL_FROM:-manacore@localhost}\nTo: ${EMAIL_TO}\n\n${body}" | \
            sendmail "$EMAIL_TO" 2>/dev/null
    else
        echo "  [Email] No mail client available (install msmtp)"
        return 1
    fi

    if [ $? -eq 0 ]; then
        echo "  [Email] Notification sent to $EMAIL_TO"
    else
        echo "  [Email] Failed to send"
    fi
}

send_ntfy() {
    local message="$1"

    if [ -z "$NTFY_TOPIC" ]; then
        return 0
    fi

    curl -s -d "$message" \
        -H "Title: Mac Mini Alert" \
        -H "Priority: high" \
        -H "Tags: warning" \
        "https://ntfy.sh/$NTFY_TOPIC" >/dev/null 2>&1

    if [ $? -eq 0 ]; then
        echo "  [ntfy] Notification sent"
    else
        echo "  [ntfy] Failed to send"
    fi
}

send_all_notifications() {
    local failed_services="$1"
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')

    # Telegram message (HTML format)
    local telegram_msg="🚨 <b>ManaCore Health Check Failed</b>

<b>Time:</b> ${timestamp}
<b>Host:</b> $(hostname)

<b>Failed Services:</b>
${failed_services}

Check logs: <code>ssh mac-mini</code>"

    # Email message
    local email_subject="[ALERT] ManaCore Health Check Failed"
    local email_body="ManaCore Health Check Failed
=============================

Time: ${timestamp}
Host: $(hostname)

Failed Services:
${failed_services}

To investigate:
  ssh mac-mini
  cd ~/projects/manacore-monorepo
  ./scripts/mac-mini/status.sh
  docker logs <container-name>"

    # Plain text for ntfy
    local ntfy_msg="ManaCore Failed: ${failed_services}"

    echo ""
    echo "Sending notifications..."
    send_telegram "$telegram_msg"
    send_email "$email_subject" "$email_body"
    send_ntfy "$ntfy_msg"
}

# ============================================
# Health Check Functions
# ============================================

check_service() {
    local name=$1
    local url=$2
    local timeout=${3:-5}

    local status=$(curl -s -o /dev/null -w "%{http_code}" --max-time "$timeout" "$url" 2>/dev/null)

    if [ "$status" = "200" ]; then
        echo -e "  ${GREEN}[OK]${NC} $name"
        return 0
    else
        echo -e "  ${RED}[FAIL]${NC} $name (HTTP $status)"
        FAILURES+=("$name")
        return 1
    fi
}

# ============================================
# Main Health Check
# ============================================

echo ""
echo "=== ManaCore Health Check ==="
echo "Time: $(date)"
echo ""

echo "Infrastructure:"
# Check postgres via docker
if docker exec mana-infra-postgres pg_isready -U postgres >/dev/null 2>&1; then
    echo -e "  ${GREEN}[OK]${NC} PostgreSQL"
else
    echo -e "  ${RED}[FAIL]${NC} PostgreSQL"
    FAILURES+=("PostgreSQL")
fi

# Check redis via docker
if docker exec mana-infra-redis redis-cli ping >/dev/null 2>&1; then
    echo -e "  ${GREEN}[OK]${NC} Redis"
else
    echo -e "  ${RED}[FAIL]${NC} Redis"
    FAILURES+=("Redis")
fi

# Check for stuck containers (Created/Exited status)
STUCK_CONTAINERS=$(docker ps -a --filter "status=created" --filter "status=exited" --format "{{.Names}}" | grep "^mana-" || true)
if [ -n "$STUCK_CONTAINERS" ]; then
    echo -e "  ${RED}[FAIL]${NC} Stuck containers detected:"
    echo "$STUCK_CONTAINERS" | while read c; do echo "         - $c"; done
    FAILURES+=("Stuck containers: $(echo $STUCK_CONTAINERS | tr '\n' ' ')")
fi

echo ""
echo "Auth & Dashboard:"
check_service "Auth API" "http://localhost:3001/health"
check_service "Dashboard Web" "http://localhost:5000/health"

echo ""
echo "Chat:"
check_service "Chat Backend" "http://localhost:3030/health"
check_service "Chat Web" "http://localhost:5010/health"

echo ""
echo "Todo:"
check_service "Todo Backend" "http://localhost:3031/health"
check_service "Todo Web" "http://localhost:5011/health"

echo ""
echo "Calendar:"
check_service "Calendar Backend" "http://localhost:3032/health"
check_service "Calendar Web" "http://localhost:5012/health"

echo ""
echo "Clock:"
check_service "Clock Backend" "http://localhost:3033/health"
check_service "Clock Web" "http://localhost:5013/health"

echo ""
echo "Contacts:"
check_service "Contacts Backend" "http://localhost:3034/health"
check_service "Contacts Web" "http://localhost:5014/health"

echo ""
echo "Storage:"
check_service "Storage Backend" "http://localhost:3035/api/v1/health"
check_service "Storage Web" "http://localhost:5015/health"

echo ""
echo "Presi:"
check_service "Presi Backend" "http://localhost:3036/api/v1/health"
check_service "Presi Web" "http://localhost:5016/health"

echo ""
echo "NutriPhi:"
check_service "NutriPhi Backend" "http://localhost:3037/api/v1/health"
check_service "NutriPhi Web" "http://localhost:5017/health"

echo ""
echo "SkillTree:"
check_service "SkillTree Backend" "http://localhost:3038/health"
# SkillTree Web disabled - Dockerfile needs fix for shared packages

echo ""
echo "Photos:"
check_service "Photos Backend" "http://localhost:3039/api/v1/health"
check_service "Photos Web" "http://localhost:5019/health"

echo ""
echo "Core Services:"
check_service "Search Service" "http://localhost:3020/api/v1/health"
check_service "Media Service" "http://localhost:3015/api/v1/health"
check_service "LLM Service" "http://localhost:3025/health"

echo ""
echo "GPU Server (192.168.178.11):"
check_service "GPU Ollama" "http://192.168.178.11:11434/api/version" 3
check_service "GPU STT" "http://192.168.178.11:3020/health" 3
check_service "GPU TTS" "http://192.168.178.11:3022/health" 3
check_service "GPU Image Gen" "http://192.168.178.11:3023/health" 3

echo ""
echo "Matrix:"
check_service "Synapse" "http://localhost:4000/health"
check_service "Element Web" "http://localhost:4080/"
check_service "Matrix Web" "http://localhost:4090/health"
check_service "Matrix Mana Bot" "http://localhost:4010/health"
check_service "Matrix Ollama Bot" "http://localhost:4011/health"
check_service "Matrix Stats Bot" "http://localhost:4012/health"
check_service "Matrix Project Doc Bot" "http://localhost:4013/health"

echo ""
echo "Monitoring:"
check_service "Grafana" "http://localhost:8000/api/health"
check_service "Umami" "http://localhost:8010/api/heartbeat"
check_service "GlitchTip" "http://localhost:8020/_health/"
check_service "VictoriaMetrics" "http://localhost:9090/health"

echo ""
echo "Alerting:"
check_service "vmalert" "http://localhost:8880/health"
check_service "Alertmanager" "http://localhost:9093/-/healthy"
check_service "Alert Notifier" "http://localhost:9095/health"

echo ""
echo "Disk Space:"
check_disk() {
    local name=$1
    local path=$2
    local warn_pct=${3:-80}
    local crit_pct=${4:-90}

    if [ ! -d "$path" ]; then
        echo -e "  ${YELLOW}[SKIP]${NC} $name ($path not found)"
        return 0
    fi

    local usage_pct=$(df "$path" | tail -1 | awk '{gsub(/%/,""); print $5}')
    local avail=$(df -h "$path" | tail -1 | awk '{print $4}')

    if [ "$usage_pct" -ge "$crit_pct" ]; then
        echo -e "  ${RED}[CRIT]${NC} $name: ${usage_pct}% used ($avail free)"
        FAILURES+=("Disk $name: ${usage_pct}% (critical)")
    elif [ "$usage_pct" -ge "$warn_pct" ]; then
        echo -e "  ${YELLOW}[WARN]${NC} $name: ${usage_pct}% used ($avail free)"
        FAILURES+=("Disk $name: ${usage_pct}% (warning)")
    else
        echo -e "  ${GREEN}[OK]${NC} $name: ${usage_pct}% used ($avail free)"
    fi
}

check_disk "System (/)" "/"
check_disk "ManaData" "/Volumes/ManaData"

echo ""
echo "Cloudflare Tunnel:"
if pgrep -x "cloudflared" >/dev/null; then
    echo -e "  ${GREEN}[OK]${NC} cloudflared running"
else
    echo -e "  ${RED}[FAIL]${NC} cloudflared not running"
    FAILURES+=("cloudflared")
fi

echo ""
echo "=== Summary ==="

if [ ${#FAILURES[@]} -eq 0 ]; then
    echo -e "${GREEN}All services healthy!${NC}"
    exit 0
else
    echo -e "${RED}Failed services (${#FAILURES[@]}):${NC}"
    FAILED_LIST=""
    for f in "${FAILURES[@]}"; do
        echo "  - $f"
        FAILED_LIST="${FAILED_LIST}- ${f}\n"
    done

    # Send notifications
    send_all_notifications "$(echo -e "$FAILED_LIST")"

    exit 1
fi
