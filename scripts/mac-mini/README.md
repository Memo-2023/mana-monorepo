# Mac Mini Server Scripts

Scripts for managing the ManaCore production environment on Mac Mini.

## Quick Start (After System Update)

```bash
# 1. SSH into Mac Mini (from your local machine)
ssh mac-mini

# 2. Navigate to project
cd ~/projects/manacore-monorepo

# 3. Setup auto-start (only needed once)
./scripts/mac-mini/setup-autostart.sh

# 4. Check status
./scripts/mac-mini/status.sh
```

## Scripts Overview

| Script | Purpose |
|--------|---------|
| `setup-autostart.sh` | Configure automatic startup on boot (run once) |
| `startup.sh` | Main startup script (called by launchd) |
| `health-check.sh` | Check all services health |
| `status.sh` | Show full system status |
| `restart.sh` | Restart all Docker containers |
| `stop.sh` | Stop all Docker containers |
| `deploy.sh` | Pull latest images and deploy |

## First-Time Setup

### 1. Prerequisites on Mac Mini

```bash
# Install Homebrew
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Install required tools
brew install cloudflared git docker

# Install Docker Desktop
# Download from: https://www.docker.com/products/docker-desktop/
```

### 2. Clone Repository

```bash
mkdir -p ~/projects
cd ~/projects
git clone https://github.com/Memo-2023/manacore-monorepo.git
cd manacore-monorepo
```

### 3. Configure Cloudflare Tunnel

```bash
# Login to Cloudflare
cloudflared tunnel login

# The tunnel is already created (ID: bb0ea86d-8253-4a54-838b-107bb7945be9)
# Credentials should be at: ~/.cloudflared/bb0ea86d-8253-4a54-838b-107bb7945be9.json
```

### 4. Configure Environment

```bash
# Copy and edit the environment file
cp .env.macmini.example .env.macmini
nano .env.macmini
```

### 5. Enable Auto-Start

```bash
# This sets up all launchd services
./scripts/mac-mini/setup-autostart.sh
```

### 6. Configure Docker Desktop

Open Docker Desktop and enable:
- **Settings > General > Start Docker Desktop when you sign in**

## Daily Operations

### Check Status

```bash
./scripts/mac-mini/status.sh
```

### Run Health Check

```bash
./scripts/mac-mini/health-check.sh
```

### Restart Services

```bash
# Normal restart
./scripts/mac-mini/restart.sh

# Pull latest images and restart
./scripts/mac-mini/restart.sh --pull

# Force recreate containers
./scripts/mac-mini/restart.sh --force
```

### View Logs

```bash
# Startup log
tail -f /tmp/manacore-startup.log

# Health check log
tail -f /tmp/manacore-health.log

# Cloudflare tunnel log
tail -f /tmp/cloudflared.log

# Specific container logs
docker logs -f mana-core-auth
docker logs -f chat-backend
```

### Stop Services

```bash
./scripts/mac-mini/stop.sh
```

## LaunchD Services

Three services are configured to run automatically:

| Service | Label | Purpose |
|---------|-------|---------|
| Cloudflared | `com.cloudflare.cloudflared` | Tunnel to Cloudflare |
| Docker Startup | `com.manacore.docker-startup` | Start containers on boot |
| Health Check | `com.manacore.health-check` | Check every 5 minutes |

### Manual Service Control

```bash
# Check status
launchctl list | grep -E 'cloudflare|manacore'

# Restart a service
launchctl kickstart -k gui/$(id -u)/com.manacore.docker-startup

# Stop a service
launchctl unload ~/Library/LaunchAgents/com.manacore.docker-startup.plist

# Start a service
launchctl load ~/Library/LaunchAgents/com.manacore.docker-startup.plist
```

## Troubleshooting

### Docker not starting

```bash
# Check if Docker Desktop is running
docker info

# Start Docker Desktop manually
open -a Docker
```

### Cloudflare tunnel not connecting

```bash
# Check cloudflared status
pgrep -x cloudflared

# View tunnel logs
tail -50 /tmp/cloudflared.log

# Restart tunnel
launchctl kickstart -k gui/$(id -u)/com.cloudflare.cloudflared
```

### Container health check failing

```bash
# Check specific container
docker logs <container-name>

# Restart specific container
docker restart <container-name>

# Check database connectivity
docker exec manacore-postgres pg_isready -U postgres
```

### Services not starting on boot

```bash
# Re-run setup
./scripts/mac-mini/setup-autostart.sh

# Check launchd errors
launchctl error <exit-code>

# Verify plist files
plutil ~/Library/LaunchAgents/com.manacore.*.plist
```

## Push Notifications (Optional)

To receive notifications when health checks fail:

1. Create a topic at [ntfy.sh](https://ntfy.sh/)
2. Add to your shell profile:
   ```bash
   export NTFY_TOPIC=your-topic-name
   ```
3. Subscribe on your phone using the ntfy app

## URLs

Once running, services are available at:

| Service | URL |
|---------|-----|
| Dashboard | https://mana.how |
| Auth API | https://auth.mana.how |
| Chat | https://chat.mana.how |
| Chat API | https://chat-api.mana.how |
| Todo | https://todo.mana.how |
| Todo API | https://todo-api.mana.how |
| Calendar | https://calendar.mana.how |
| Calendar API | https://calendar-api.mana.how |
| Clock | https://clock.mana.how |
| Clock API | https://clock-api.mana.how |
| SSH | ssh mac-mini (via cloudflared) |
