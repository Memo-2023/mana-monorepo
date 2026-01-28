#!/bin/bash
set -e

echo "🚀 Setting up Telegram Chat Bot on Mac Mini..."

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${YELLOW}📂 Navigating to project...${NC}"
cd ~/projects/manacore-monorepo

echo -e "${YELLOW}📥 Fetching latest code...${NC}"
git fetch origin claude/research-telegram-bots-LrdWJ
git checkout claude/research-telegram-bots-LrdWJ
git pull origin claude/research-telegram-bots-LrdWJ

cd services/telegram-chat-bot

echo -e "${YELLOW}🗄️ Creating database...${NC}"
psql -U manacore -d postgres -c "CREATE DATABASE chat_bot;" 2>/dev/null || echo "Database already exists"

echo -e "${YELLOW}📦 Installing dependencies...${NC}"
pnpm install

echo -e "${YELLOW}⚙️ Creating .env file...${NC}"
cat > .env << 'EOF'
PORT=3305
NODE_ENV=production
TZ=Europe/Berlin

TELEGRAM_BOT_TOKEN=YOUR_TOKEN_HERE
TELEGRAM_ALLOWED_USERS=

CHAT_API_URL=http://localhost:3002
MANA_CORE_AUTH_URL=http://localhost:3001

DATABASE_URL=postgresql://manacore:devpassword@localhost:5432/chat_bot

DEFAULT_MODEL=gemma3:4b
EOF

echo -e "${YELLOW}⚠️ WICHTIG: Telegram Bot Token in .env eintragen!${NC}"
echo "Datei: ~/projects/manacore-monorepo/services/telegram-chat-bot/.env"

echo -e "${YELLOW}🗂️ Pushing database schema...${NC}"
pnpm db:push

echo -e "${YELLOW}🔨 Building...${NC}"
pnpm build

echo -e "${YELLOW}🍎 Creating launchd service...${NC}"
cat > ~/Library/LaunchAgents/com.manacore.telegram-chat-bot.plist << 'EOF'
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>com.manacore.telegram-chat-bot</string>
    <key>ProgramArguments</key>
    <array>
        <string>/opt/homebrew/bin/node</string>
        <string>/Users/till/projects/manacore-monorepo/services/telegram-chat-bot/dist/src/main.js</string>
    </array>
    <key>WorkingDirectory</key>
    <string>/Users/till/projects/manacore-monorepo/services/telegram-chat-bot</string>
    <key>EnvironmentVariables</key>
    <dict>
        <key>NODE_ENV</key>
        <string>production</string>
        <key>PORT</key>
        <string>3305</string>
        <key>TZ</key>
        <string>Europe/Berlin</string>
        <key>CHAT_API_URL</key>
        <string>http://localhost:3002</string>
        <key>MANA_CORE_AUTH_URL</key>
        <string>http://localhost:3001</string>
        <key>DATABASE_URL</key>
        <string>postgresql://manacore:devpassword@localhost:5432/chat_bot</string>
        <key>DEFAULT_MODEL</key>
        <string>gemma3:4b</string>
    </dict>
    <key>RunAtLoad</key>
    <true/>
    <key>KeepAlive</key>
    <true/>
    <key>StandardOutPath</key>
    <string>/Users/till/projects/manacore-monorepo/services/telegram-chat-bot/logs/stdout.log</string>
    <key>StandardErrorPath</key>
    <string>/Users/till/projects/manacore-monorepo/services/telegram-chat-bot/logs/stderr.log</string>
</dict>
</plist>
EOF

mkdir -p logs

echo -e "${GREEN}✅ Setup abgeschlossen!${NC}"
echo ""
echo "⚠️ NÄCHSTE SCHRITTE:"
echo "1. Telegram Bot Token in .env eintragen"
echo "2. Token auch im LaunchAgent plist eintragen:"
echo "   nano ~/Library/LaunchAgents/com.manacore.telegram-chat-bot.plist"
echo "   (füge TELEGRAM_BOT_TOKEN key/string Paar hinzu)"
echo ""
echo "3. Service starten:"
echo "   launchctl load ~/Library/LaunchAgents/com.manacore.telegram-chat-bot.plist"
echo ""
echo "Nützliche Befehle:"
echo "  View logs:    tail -f logs/stdout.log"
echo "  Stop bot:     launchctl unload ~/Library/LaunchAgents/com.manacore.telegram-chat-bot.plist"
echo "  Health check: curl http://localhost:3305/health"
