#!/bin/bash
set -e

echo "🚀 Setting up Telegram Calendar Bot on Mac Mini..."

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# 1. Navigate to project
echo -e "${YELLOW}📂 Navigating to project...${NC}"
cd ~/projects/manacore-monorepo

# 2. Fetch and checkout branch
echo -e "${YELLOW}📥 Fetching latest code...${NC}"
git fetch origin claude/research-telegram-bots-LrdWJ
git checkout claude/research-telegram-bots-LrdWJ
git pull origin claude/research-telegram-bots-LrdWJ

# 3. Navigate to bot directory
cd services/telegram-calendar-bot

# 4. Create database
echo -e "${YELLOW}🗄️ Creating database...${NC}"
psql -U manacore -d postgres -c "CREATE DATABASE calendar_bot;" 2>/dev/null || echo "Database already exists"

# 5. Install dependencies
echo -e "${YELLOW}📦 Installing dependencies...${NC}"
pnpm install

# 6. Create .env file
echo -e "${YELLOW}⚙️ Creating .env file...${NC}"
cat > .env << 'EOF'
# Server
PORT=3303
NODE_ENV=production
TZ=Europe/Berlin

# Telegram
TELEGRAM_BOT_TOKEN=8226852885:AAHyfshVf8qOtdc626ZzAHDVcVtx0KpQ50g
TELEGRAM_ALLOWED_USERS=

# Calendar Backend API
CALENDAR_API_URL=http://localhost:3016
MANA_CORE_AUTH_URL=http://localhost:3001

# Database
DATABASE_URL=postgresql://manacore:devpassword@localhost:5432/calendar_bot

# Reminder Settings
REMINDER_CHECK_INTERVAL=60000
MORNING_BRIEFING_ENABLED=true
MORNING_BRIEFING_TIME=07:00
MORNING_BRIEFING_TIMEZONE=Europe/Berlin
EOF

# 7. Push database schema
echo -e "${YELLOW}🗂️ Pushing database schema...${NC}"
pnpm db:push

# 8. Build
echo -e "${YELLOW}🔨 Building...${NC}"
pnpm build

# 9. Create launchd plist for macOS
echo -e "${YELLOW}🍎 Creating launchd service...${NC}"
cat > ~/Library/LaunchAgents/com.manacore.telegram-calendar-bot.plist << 'EOF'
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>com.manacore.telegram-calendar-bot</string>
    <key>ProgramArguments</key>
    <array>
        <string>/opt/homebrew/bin/node</string>
        <string>/Users/till/projects/manacore-monorepo/services/telegram-calendar-bot/dist/src/main.js</string>
    </array>
    <key>WorkingDirectory</key>
    <string>/Users/till/projects/manacore-monorepo/services/telegram-calendar-bot</string>
    <key>EnvironmentVariables</key>
    <dict>
        <key>NODE_ENV</key>
        <string>production</string>
        <key>PORT</key>
        <string>3303</string>
        <key>TZ</key>
        <string>Europe/Berlin</string>
        <key>TELEGRAM_BOT_TOKEN</key>
        <string>8226852885:AAHyfshVf8qOtdc626ZzAHDVcVtx0KpQ50g</string>
        <key>CALENDAR_API_URL</key>
        <string>http://localhost:3016</string>
        <key>MANA_CORE_AUTH_URL</key>
        <string>http://localhost:3001</string>
        <key>DATABASE_URL</key>
        <string>postgresql://manacore:devpassword@localhost:5432/calendar_bot</string>
        <key>REMINDER_CHECK_INTERVAL</key>
        <string>60000</string>
        <key>MORNING_BRIEFING_ENABLED</key>
        <string>true</string>
        <key>MORNING_BRIEFING_TIME</key>
        <string>07:00</string>
        <key>MORNING_BRIEFING_TIMEZONE</key>
        <string>Europe/Berlin</string>
    </dict>
    <key>RunAtLoad</key>
    <true/>
    <key>KeepAlive</key>
    <true/>
    <key>StandardOutPath</key>
    <string>/Users/till/projects/manacore-monorepo/services/telegram-calendar-bot/logs/stdout.log</string>
    <key>StandardErrorPath</key>
    <string>/Users/till/projects/manacore-monorepo/services/telegram-calendar-bot/logs/stderr.log</string>
</dict>
</plist>
EOF

# Create logs directory
mkdir -p logs

# 10. Load and start service
echo -e "${YELLOW}▶️ Starting service...${NC}"
launchctl unload ~/Library/LaunchAgents/com.manacore.telegram-calendar-bot.plist 2>/dev/null || true
launchctl load ~/Library/LaunchAgents/com.manacore.telegram-calendar-bot.plist

# Wait a moment for startup
sleep 3

# 11. Check status
echo -e "${YELLOW}🔍 Checking status...${NC}"
if curl -s http://localhost:3303/health | grep -q "ok"; then
    echo -e "${GREEN}✅ Telegram Calendar Bot is running!${NC}"
    echo -e "${GREEN}🤖 Bot URL: https://t.me/calendar_mana_bot${NC}"
    echo ""
    echo "Useful commands:"
    echo "  View logs:    tail -f ~/projects/manacore-monorepo/services/telegram-calendar-bot/logs/stdout.log"
    echo "  Stop bot:     launchctl unload ~/Library/LaunchAgents/com.manacore.telegram-calendar-bot.plist"
    echo "  Start bot:    launchctl load ~/Library/LaunchAgents/com.manacore.telegram-calendar-bot.plist"
    echo "  Health check: curl http://localhost:3303/health"
else
    echo -e "${YELLOW}⚠️ Bot may still be starting. Check logs:${NC}"
    echo "  tail -f ~/projects/manacore-monorepo/services/telegram-calendar-bot/logs/stderr.log"
fi
