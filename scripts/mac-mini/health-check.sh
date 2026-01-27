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
if docker exec manacore-postgres pg_isready -U postgres >/dev/null 2>&1; then
    echo -e "  ${GREEN}[OK]${NC} PostgreSQL"
else
    echo -e "  ${RED}[FAIL]${NC} PostgreSQL"
    FAILURES+=("PostgreSQL")
fi

# Check redis via docker
if docker exec manacore-redis redis-cli ping >/dev/null 2>&1; then
    echo -e "  ${GREEN}[OK]${NC} Redis"
else
    echo -e "  ${RED}[FAIL]${NC} Redis"
    FAILURES+=("Redis")
fi

echo ""
echo "Auth & Dashboard:"
check_service "Auth API" "http://localhost:3001/health"
check_service "Dashboard Web" "http://localhost:5173/health"

echo ""
echo "Chat:"
check_service "Chat Backend" "http://localhost:3002/health"
check_service "Chat Web" "http://localhost:3000/health"

echo ""
echo "Todo:"
check_service "Todo Backend" "http://localhost:3018/health"
check_service "Todo Web" "http://localhost:5188/health"

echo ""
echo "Calendar:"
check_service "Calendar Backend" "http://localhost:3016/health"
check_service "Calendar Web" "http://localhost:5186/health"

echo ""
echo "Clock:"
check_service "Clock Backend" "http://localhost:3017/health"
check_service "Clock Web" "http://localhost:5187/health"

echo ""
echo "Contacts:"
check_service "Contacts Backend" "http://localhost:3015/health"
check_service "Contacts Web" "http://localhost:5184/health"

echo ""
echo "Storage:"
check_service "Storage Backend" "http://localhost:3019/api/v1/health"
check_service "Storage Web" "http://localhost:5185/health"

echo ""
echo "Presi:"
check_service "Presi Backend" "http://localhost:3008/api/health"
check_service "Presi Web" "http://localhost:5178/health"

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
