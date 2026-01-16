# ManaCore Production Deployment Guide

One-Server-Setup for manacore.ai with automated HTTPS and daily backups.

## Quick Overview

| Domain | Service | Port |
|--------|---------|------|
| auth.manacore.ai | Auth Service | 3001 |
| app.manacore.ai | Dashboard | 5173 |
| chat.manacore.ai | Chat Web | 3000 |
| chat-api.manacore.ai | Chat Backend | 3002 |
| todo.manacore.ai | Todo Web | 5188 |
| todo-api.manacore.ai | Todo Backend | 3018 |
| calendar.manacore.ai | Calendar Web | 5186 |
| calendar-api.manacore.ai | Calendar Backend | 3016 |
| clock.manacore.ai | Clock Web | 5187 |
| clock-api.manacore.ai | Clock Backend | 3017 |

## Prerequisites

### 1. Server Requirements (Hetzner CAX21 recommended)

- 4 vCPU, 8GB RAM, 80GB SSD (~8€/month)
- Ubuntu 22.04 or Debian 12
- Docker + Docker Compose v2

### 2. DNS Configuration

Add these A records pointing to your server IP:

```
manacore.ai          → YOUR_SERVER_IP
www.manacore.ai      → YOUR_SERVER_IP
app.manacore.ai      → YOUR_SERVER_IP
auth.manacore.ai     → YOUR_SERVER_IP
chat.manacore.ai     → YOUR_SERVER_IP
chat-api.manacore.ai → YOUR_SERVER_IP
todo.manacore.ai     → YOUR_SERVER_IP
todo-api.manacore.ai → YOUR_SERVER_IP
calendar.manacore.ai → YOUR_SERVER_IP
calendar-api.manacore.ai → YOUR_SERVER_IP
clock.manacore.ai    → YOUR_SERVER_IP
clock-api.manacore.ai → YOUR_SERVER_IP
```

---

## Server Setup (First Time)

### Step 1: Install Docker

```bash
# SSH into server
ssh root@YOUR_SERVER_IP

# Install Docker
curl -fsSL https://get.docker.com | sh

# Add user to docker group (optional)
usermod -aG docker $USER

# Verify installation
docker --version
docker compose version
```

### Step 2: Create Project Directory

```bash
mkdir -p /opt/manacore
cd /opt/manacore
```

### Step 3: Copy Files to Server

From your local machine:

```bash
# Copy production files
scp docker/production/docker-compose.yml root@YOUR_SERVER_IP:/opt/manacore/
scp docker/production/Caddyfile root@YOUR_SERVER_IP:/opt/manacore/
scp docker/production/.env.template root@YOUR_SERVER_IP:/opt/manacore/
scp docker/production/backup.sh root@YOUR_SERVER_IP:/opt/manacore/
scp docker/production/restore.sh root@YOUR_SERVER_IP:/opt/manacore/
```

### Step 4: Configure Environment

```bash
cd /opt/manacore

# Copy template
cp .env.template .env

# Generate secure passwords
echo "POSTGRES_PASSWORD=$(openssl rand -base64 32)" >> .env.generated
echo "REDIS_PASSWORD=$(openssl rand -base64 32)" >> .env.generated
echo "JWT_SECRET=$(openssl rand -base64 64)" >> .env.generated

# Edit .env with your values
nano .env
```

### Step 5: Generate JWT Keys

```bash
# Generate Ed25519 key pair
node -e "
const { generateKeyPairSync } = require('crypto');
const { publicKey, privateKey } = generateKeyPairSync('ed25519');
console.log('JWT_PUBLIC_KEY=\"' + publicKey.export({type:'spki',format:'pem'}).toString().replace(/\n/g,'\\\\n') + '\"');
console.log('JWT_PRIVATE_KEY=\"' + privateKey.export({type:'pkcs8',format:'pem'}).toString().replace(/\n/g,'\\\\n') + '\"');
"
```

Copy the output to your `.env` file.

### Step 6: Create Backup Directory

```bash
mkdir -p /opt/manacore/backups
chmod +x backup.sh restore.sh
```

### Step 7: Login to Docker Registry

```bash
# Create GitHub token with read:packages permission
docker login ghcr.io -u YOUR_GITHUB_USERNAME
# Enter your GitHub Personal Access Token
```

---

## Deployment

### Initial Deployment

```bash
cd /opt/manacore

# Pull all images
docker compose pull

# Start all services
docker compose up -d

# Watch logs
docker compose logs -f
```

### Verify Services

```bash
# Check all containers are running
docker compose ps

# Test health endpoints
curl -s http://localhost:3001/api/v1/health  # Auth
curl -s http://localhost:3002/api/v1/health  # Chat Backend
curl -s http://localhost:3018/api/v1/health  # Todo Backend
curl -s http://localhost:3016/api/v1/health  # Calendar Backend
curl -s http://localhost:3017/api/v1/health  # Clock Backend
```

### Initialize Databases

The databases are created automatically on first start, but you may need to run migrations:

```bash
# Create databases if not exist
docker exec manacore-postgres psql -U postgres -c "CREATE DATABASE manacore_auth;"
docker exec manacore-postgres psql -U postgres -c "CREATE DATABASE chat;"
docker exec manacore-postgres psql -U postgres -c "CREATE DATABASE todo;"
docker exec manacore-postgres psql -U postgres -c "CREATE DATABASE calendar;"
docker exec manacore-postgres psql -U postgres -c "CREATE DATABASE clock;"
```

---

## Daily Operations

### Update Services

```bash
cd /opt/manacore

# Pull latest images
docker compose pull

# Restart with new images (zero-downtime for stateless services)
docker compose up -d

# Or restart specific service
docker compose pull chat-backend
docker compose up -d chat-backend
```

### View Logs

```bash
# All services
docker compose logs -f

# Specific service
docker compose logs -f chat-backend

# Last 100 lines
docker compose logs --tail=100 mana-core-auth
```

### Backup

```bash
# Manual backup
./backup.sh

# Backup specific database
./backup.sh chat

# List backups
ls -lh backups/
```

### Restore

```bash
# Restore from backup (CAUTION: overwrites data!)
./restore.sh chat backups/chat_20250116_030000.sql.gz
```

### Setup Daily Backups (Cron)

```bash
crontab -e

# Add this line (backup at 3 AM daily)
0 3 * * * /opt/manacore/backup.sh >> /var/log/manacore-backup.log 2>&1
```

---

## Troubleshooting

### Service won't start

```bash
# Check logs
docker compose logs SERVICE_NAME

# Check container status
docker inspect SERVICE_NAME

# Restart service
docker compose restart SERVICE_NAME
```

### Database connection issues

```bash
# Test database connection
docker exec manacore-postgres psql -U postgres -c "\l"

# Check if database exists
docker exec manacore-postgres psql -U postgres -c "\c chat"
```

### Certificate issues (HTTPS)

```bash
# Caddy automatically obtains certificates
# Check Caddy logs for errors
docker compose logs caddy

# Force certificate renewal
docker exec manacore-caddy caddy reload --config /etc/caddy/Caddyfile
```

### Out of disk space

```bash
# Check disk usage
df -h

# Clean up Docker
docker system prune -a --volumes

# Clean old backups
find /opt/manacore/backups -name "*.sql.gz" -mtime +7 -delete
```

---

## CI/CD Integration

The GitHub Actions workflow can be updated to deploy automatically:

```yaml
# .github/workflows/cd-production.yml
deploy:
  runs-on: ubuntu-latest
  steps:
    - name: Deploy to Production
      uses: appleboy/ssh-action@v1
      with:
        host: ${{ secrets.PROD_SERVER_IP }}
        username: root
        key: ${{ secrets.PROD_SSH_KEY }}
        script: |
          cd /opt/manacore
          docker compose pull
          docker compose up -d
```

---

## Resource Usage

Approximate resource usage per service:

| Service | CPU | Memory |
|---------|-----|--------|
| PostgreSQL | 0.5 | 512MB |
| Redis | 0.1 | 256MB |
| Caddy | 0.1 | 64MB |
| mana-core-auth | 0.5-1 | 256-512MB |
| chat-backend | 1-2 | 512MB-1GB |
| chat-web | 0.2 | 128MB |
| Other backends | 0.2-0.5 | 128-256MB |
| Other webs | 0.2 | 128MB |

**Total**: ~2-4 vCPU, ~3-4GB RAM

Recommended server: **Hetzner CAX21** (4 vCPU ARM, 8GB RAM) for ~8€/month

---

## Security Checklist

- [ ] Strong passwords in `.env` (use `openssl rand -base64 32`)
- [ ] Firewall: Only ports 80, 443, 22 open
- [ ] SSH key authentication (disable password login)
- [ ] Regular backups (daily cron)
- [ ] Keep Docker and OS updated
- [ ] Monitor logs for anomalies
