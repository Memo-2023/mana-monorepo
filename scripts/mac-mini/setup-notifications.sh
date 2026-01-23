#!/bin/bash
# Setup notifications for ManaCore Health Checks
# Run this script on the Mac Mini to configure alerts

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
ENV_FILE="$PROJECT_ROOT/.env.notifications"

echo "=== ManaCore Notification Setup ==="
echo ""

# ============================================
# Check for existing config
# ============================================

if [ -f "$ENV_FILE" ]; then
    echo "Existing configuration found at $ENV_FILE"
    read -p "Do you want to reconfigure? [y/N] " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "Keeping existing configuration."
        exit 0
    fi
fi

# ============================================
# Telegram Setup
# ============================================

echo ""
echo "=== Telegram Bot Setup ==="
echo ""
echo "To create a Telegram bot:"
echo "  1. Open Telegram and message @BotFather"
echo "  2. Send /newbot"
echo "  3. Choose a name (e.g., 'ManaCore Alerts')"
echo "  4. Choose a username (e.g., 'manacore_alerts_bot')"
echo "  5. Copy the bot token"
echo ""

read -p "Enter Telegram Bot Token (or press Enter to skip): " TELEGRAM_BOT_TOKEN

if [ -n "$TELEGRAM_BOT_TOKEN" ]; then
    echo ""
    echo "To get your Chat ID:"
    echo "  1. Send a message to your new bot in Telegram"
    echo "  2. Open this URL in your browser:"
    echo "     https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/getUpdates"
    echo "  3. Find the 'chat' -> 'id' value"
    echo ""
    read -p "Enter your Telegram Chat ID: " TELEGRAM_CHAT_ID
fi

# ============================================
# Email Setup
# ============================================

echo ""
echo "=== Email Setup ==="
echo ""
echo "For email alerts, you need:"
echo "  1. An SMTP server (Gmail, Mailgun, etc.)"
echo "  2. msmtp installed (brew install msmtp)"
echo ""

read -p "Enter email address for alerts (or press Enter to skip): " EMAIL_TO

if [ -n "$EMAIL_TO" ]; then
    read -p "Enter 'From' email address [$EMAIL_TO]: " EMAIL_FROM
    EMAIL_FROM=${EMAIL_FROM:-$EMAIL_TO}

    echo ""
    echo "You need to configure msmtp separately."
    echo "Create ~/.msmtprc with contents like:"
    echo ""
    echo "  defaults"
    echo "  auth           on"
    echo "  tls            on"
    echo "  tls_trust_file /etc/ssl/cert.pem"
    echo "  logfile        ~/.msmtp.log"
    echo ""
    echo "  account        default"
    echo "  host           smtp.gmail.com"
    echo "  port           587"
    echo "  from           $EMAIL_FROM"
    echo "  user           your-email@gmail.com"
    echo "  password       your-app-password"
    echo ""
    echo "For Gmail, use an App Password (not your regular password)."
    echo ""

    # Check if msmtp is installed
    if ! command -v msmtp &> /dev/null; then
        echo "msmtp is not installed. Install with:"
        echo "  brew install msmtp"
        echo ""
    fi
fi

# ============================================
# ntfy Setup
# ============================================

echo ""
echo "=== ntfy.sh Setup (optional) ==="
echo ""
echo "ntfy.sh is a simple push notification service."
echo "No account needed - just choose a unique topic name."
echo ""

read -p "Enter ntfy topic name (or press Enter to skip): " NTFY_TOPIC

# ============================================
# Write configuration
# ============================================

echo ""
echo "=== Writing Configuration ==="

cat > "$ENV_FILE" << EOF
# ManaCore Notification Configuration
# Generated on $(date)

# Telegram
TELEGRAM_BOT_TOKEN=${TELEGRAM_BOT_TOKEN}
TELEGRAM_CHAT_ID=${TELEGRAM_CHAT_ID}

# Email
EMAIL_TO=${EMAIL_TO}
EMAIL_FROM=${EMAIL_FROM}

# ntfy.sh
NTFY_TOPIC=${NTFY_TOPIC}
EOF

chmod 600 "$ENV_FILE"
echo "Configuration saved to $ENV_FILE"

# ============================================
# Test notifications
# ============================================

echo ""
read -p "Do you want to send a test notification? [Y/n] " -n 1 -r
echo

if [[ ! $REPLY =~ ^[Nn]$ ]]; then
    echo ""
    echo "Sending test notifications..."

    # Source the new config
    source "$ENV_FILE"

    # Test Telegram
    if [ -n "$TELEGRAM_BOT_TOKEN" ] && [ -n "$TELEGRAM_CHAT_ID" ]; then
        echo -n "  Testing Telegram... "
        RESULT=$(curl -s -X POST "https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage" \
            -d "chat_id=${TELEGRAM_CHAT_ID}" \
            -d "text=✅ ManaCore notification test successful!" \
            -d "parse_mode=HTML")

        if echo "$RESULT" | grep -q '"ok":true'; then
            echo "OK"
        else
            echo "FAILED"
            echo "  Response: $RESULT"
        fi
    fi

    # Test Email
    if [ -n "$EMAIL_TO" ] && command -v msmtp &> /dev/null; then
        echo -n "  Testing Email... "
        echo -e "Subject: ManaCore Test Notification\nFrom: ${EMAIL_FROM}\nTo: ${EMAIL_TO}\n\nThis is a test notification from ManaCore health check." | \
            msmtp -a default "$EMAIL_TO" 2>/dev/null && echo "OK" || echo "FAILED (check ~/.msmtprc)"
    elif [ -n "$EMAIL_TO" ]; then
        echo "  Email configured but msmtp not installed"
    fi

    # Test ntfy
    if [ -n "$NTFY_TOPIC" ]; then
        echo -n "  Testing ntfy... "
        curl -s -d "ManaCore notification test successful!" \
            -H "Title: Test" \
            "https://ntfy.sh/$NTFY_TOPIC" >/dev/null && echo "OK" || echo "FAILED"
    fi
fi

# ============================================
# Summary
# ============================================

echo ""
echo "=== Setup Complete ==="
echo ""
echo "Configured notifications:"
[ -n "$TELEGRAM_BOT_TOKEN" ] && echo "  ✓ Telegram"
[ -n "$EMAIL_TO" ] && echo "  ✓ Email ($EMAIL_TO)"
[ -n "$NTFY_TOPIC" ] && echo "  ✓ ntfy ($NTFY_TOPIC)"
echo ""
echo "Health checks run every 5 minutes and will send"
echo "notifications when services fail."
echo ""
echo "To test manually:"
echo "  ./scripts/mac-mini/health-check.sh"
echo ""
