# Staging Environment Setup Guide

This document describes the complete staging environment setup for ManaCore apps on Hetzner VPS with HTTPS via Caddy reverse proxy.

## Overview

| Component | Details |
|-----------|---------|
| **Server** | Hetzner VPS (46.224.108.214) |
| **Domain** | manacore.ai (Namecheap) |
| **Reverse Proxy** | Caddy (auto-SSL via Let's Encrypt) |
| **Container Runtime** | Docker Compose |
| **SSH Access** | `ssh -i ~/.ssh/hetzner_deploy_key deploy@46.224.108.214` |

## Architecture

```
                                    ┌─────────────────────────────────────────────┐
                                    │           Hetzner VPS (46.224.108.214)      │
                                    │                                             │
    Internet                        │  ┌─────────────────────────────────────┐   │
       │                            │  │         Caddy (ports 80/443)        │   │
       │                            │  │         Auto-SSL via Let's Encrypt  │   │
       ▼                            │  └──────────────┬──────────────────────┘   │
┌──────────────┐                    │                 │                          │
│   Namecheap  │                    │                 ▼                          │
│  DNS Records │────────────────────│  ┌─────────────────────────────────────┐   │
│              │                    │  │      Docker Compose Services        │   │
│ *.staging    │                    │  │                                     │   │
│ A → IP       │                    │  │  mana-core-auth:3001               │   │
└──────────────┘                    │  │  chat-web:3000 / chat-backend:3002 │   │
                                    │  │  clock-web:5187 / clock-backend:3017│   │
                                    │  │  calendar-web:5186 / calendar-api:3016│ │
                                    │  │  todo-web:5188 / todo-backend:3018 │   │
                                    │  │  manacore-web:5173                 │   │
                                    │  │  postgres:5432 / redis:6379        │   │
                                    │  └─────────────────────────────────────┘   │
                                    └─────────────────────────────────────────────┘
```

## Domain Mapping

### DNS Configuration (Namecheap)

| Type | Host | Value | TTL |
|------|------|-------|-----|
| A | `staging` | 46.224.108.214 | Automatic |
| A | `*.staging` | 46.224.108.214 | Automatic |

The wildcard record `*.staging` enables all subdomains like `auth.staging.manacore.ai`, `clock.staging.manacore.ai`, etc.

### Staging URLs

| Service | URL | Internal Port |
|---------|-----|---------------|
| **Auth** | https://auth.staging.manacore.ai | 3001 |
| **ManaCore Web** | https://staging.manacore.ai | 5173 |
| **Chat Web** | https://chat.staging.manacore.ai | 3000 |
| **Chat API** | https://chat-api.staging.manacore.ai | 3002 |
| **Clock Web** | https://clock.staging.manacore.ai | 5187 |
| **Clock API** | https://clock-api.staging.manacore.ai | 3017 |
| **Calendar Web** | https://calendar.staging.manacore.ai | 5186 |
| **Calendar API** | https://calendar-api.staging.manacore.ai | 3016 |
| **Todo Web** | https://todo.staging.manacore.ai | 5188 |
| **Todo API** | https://todo-api.staging.manacore.ai | 3018 |

## Caddy Reverse Proxy

### Installation (One-time setup)

```bash
# SSH into server
ssh -i ~/.ssh/hetzner_deploy_key deploy@46.224.108.214

# Create Caddy data directory
mkdir -p ~/caddy_data ~/caddy_config

# Run Caddy container
docker run -d \
  --name caddy \
  --network host \
  --restart unless-stopped \
  -v ~/Caddyfile:/etc/caddy/Caddyfile \
  -v ~/caddy_data:/data \
  -v ~/caddy_config:/config \
  caddy:2-alpine
```

### Configuration

The Caddyfile is stored at:
- **Server**: `~/Caddyfile`
- **Repo**: `docker/caddy/Caddyfile.staging`

```caddyfile
# ManaCore Staging Reverse Proxy

auth.staging.manacore.ai {
    reverse_proxy localhost:3001
}

chat.staging.manacore.ai {
    reverse_proxy localhost:3000
}

chat-api.staging.manacore.ai {
    reverse_proxy localhost:3002
}

staging.manacore.ai {
    reverse_proxy localhost:5173
}

calendar.staging.manacore.ai {
    reverse_proxy localhost:5186
}

calendar-api.staging.manacore.ai {
    reverse_proxy localhost:3016
}

clock.staging.manacore.ai {
    reverse_proxy localhost:5187
}

clock-api.staging.manacore.ai {
    reverse_proxy localhost:3017
}

todo.staging.manacore.ai {
    reverse_proxy localhost:5188
}

todo-api.staging.manacore.ai {
    reverse_proxy localhost:3018
}
```

### Updating Caddy Configuration

```bash
# Copy updated config to server
scp -i ~/.ssh/hetzner_deploy_key docker/caddy/Caddyfile.staging deploy@46.224.108.214:~/Caddyfile

# Reload Caddy (no downtime)
ssh -i ~/.ssh/hetzner_deploy_key deploy@46.224.108.214 "docker exec caddy caddy reload --config /etc/caddy/Caddyfile"
```

### Caddy Management Commands

```bash
# View logs
docker logs caddy -f

# Restart Caddy
docker restart caddy

# Check Caddy status
docker exec caddy caddy validate --config /etc/caddy/Caddyfile
```

## SvelteKit Runtime Environment Variables

### The Problem

SvelteKit's `$env/static/public` variables are replaced at **build time**. When Docker images are built in CI, the environment variables are baked into the JavaScript bundles. This means containers cannot use different URLs for different environments.

### The Solution

Use `$env/dynamic/private` in `hooks.server.ts` to read environment variables at **runtime**, then inject them into the HTML for client-side access.

### Implementation

Each SvelteKit web app has a `hooks.server.ts` that:
1. Reads `_CLIENT` environment variables at runtime
2. Injects them into the HTML via `<script>` tag
3. Makes them available on `window.__PUBLIC_*__`

**Example: `apps/clock/apps/web/src/hooks.server.ts`**

```typescript
import type { Handle } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';

export const handle: Handle = async ({ event, resolve }) => {
    // Read env vars at RUNTIME (not build time)
    const authUrlClient = env.PUBLIC_MANA_CORE_AUTH_URL_CLIENT || env.PUBLIC_MANA_CORE_AUTH_URL || '';
    const backendUrlClient = env.PUBLIC_BACKEND_URL_CLIENT || env.PUBLIC_BACKEND_URL || '';

    return resolve(event, {
        transformPageChunk: ({ html }) => {
            // Inject into HTML for client-side access
            const envScript = `<script>
window.__PUBLIC_MANA_CORE_AUTH_URL__ = "${authUrlClient}";
window.__PUBLIC_BACKEND_URL__ = "${backendUrlClient}";
</script>`;
            return html.replace('<head>', `<head>${envScript}`);
        },
    });
};
```

### Environment Variable Pattern

Each web app container receives two sets of URLs:

| Variable | Purpose | Example |
|----------|---------|---------|
| `PUBLIC_BACKEND_URL` | Server-side (Docker network) | `http://clock-backend:3017` |
| `PUBLIC_BACKEND_URL_CLIENT` | Client-side (browser) | `https://clock-api.staging.manacore.ai` |
| `PUBLIC_MANA_CORE_AUTH_URL` | Server-side auth | `http://mana-core-auth:3001` |
| `PUBLIC_MANA_CORE_AUTH_URL_CLIENT` | Client-side auth | `https://auth.staging.manacore.ai` |

## Docker Compose Configuration

### File Locations

| File | Purpose |
|------|---------|
| `docker-compose.staging.yml` | Staging configuration (repo) |
| `~/manacore-staging/docker-compose.yml` | Server deployment |

### Key Configuration Sections

**Web App Environment Variables:**
```yaml
clock-web:
  environment:
    NODE_ENV: staging
    PORT: 5187
    # Server-side URLs (Docker internal network)
    PUBLIC_BACKEND_URL: http://clock-backend:3017
    PUBLIC_MANA_CORE_AUTH_URL: http://mana-core-auth:3001
    # Client-side URLs (browser access via HTTPS)
    PUBLIC_BACKEND_URL_CLIENT: https://clock-api.staging.manacore.ai
    PUBLIC_MANA_CORE_AUTH_URL_CLIENT: https://auth.staging.manacore.ai
```

**Backend CORS Configuration:**
```yaml
clock-backend:
  environment:
    CORS_ORIGINS: https://clock.staging.manacore.ai,https://staging.manacore.ai,http://localhost:5187
```

**Auth Service CORS:**
```yaml
mana-core-auth:
  environment:
    CORS_ORIGINS: https://chat.staging.manacore.ai,https://staging.manacore.ai,https://calendar.staging.manacore.ai,https://clock.staging.manacore.ai,https://todo.staging.manacore.ai,http://localhost:3000,http://localhost:5173
```

### Syncing Configuration to Server

```bash
# Copy docker-compose to server
scp -i ~/.ssh/hetzner_deploy_key docker-compose.staging.yml deploy@46.224.108.214:~/manacore-staging/docker-compose.yml

# Recreate containers with new config
ssh -i ~/.ssh/hetzner_deploy_key deploy@46.224.108.214 "cd ~/manacore-staging && docker compose up -d --force-recreate"
```

## Deployment Workflow

### CI/CD Pipeline

The GitHub Actions workflow (`.github/workflows/cd-staging.yml`):
1. Builds Docker images on push to `dev` branch
2. Pushes images to GitHub Container Registry (ghcr.io)
3. SSHs into staging server
4. Pulls latest images
5. Restarts containers

### Manual Deployment

```bash
# 1. Build and push images (from local)
docker build -t ghcr.io/memo-2023/clock-web:latest -f apps/clock/apps/web/Dockerfile .
docker push ghcr.io/memo-2023/clock-web:latest

# 2. SSH into server
ssh -i ~/.ssh/hetzner_deploy_key deploy@46.224.108.214

# 3. Pull and restart
cd ~/manacore-staging
docker compose pull
docker compose up -d --force-recreate
```

### Updating Environment Variables

1. Edit `docker-compose.staging.yml` locally
2. Copy to server: `scp -i ~/.ssh/hetzner_deploy_key docker-compose.staging.yml deploy@46.224.108.214:~/manacore-staging/docker-compose.yml`
3. Recreate affected containers: `docker compose up -d --force-recreate <service-name>`

## Troubleshooting

### Mixed Content Errors

**Symptom:** Browser console shows "Mixed Content: The page was loaded over HTTPS, but requested an insecure resource"

**Cause:** Client-side JavaScript is calling HTTP URLs instead of HTTPS

**Solution:**
1. Check `_CLIENT` environment variables in docker-compose.yml
2. Ensure they use `https://` staging domains
3. Recreate web containers: `docker compose up -d --force-recreate <web-service>`

### CORS Errors

**Symptom:** Browser console shows "Access-Control-Allow-Origin" errors

**Cause:** Backend CORS_ORIGINS doesn't include the HTTPS staging domain

**Solution:**
1. Add the HTTPS domain to `CORS_ORIGINS` in docker-compose.yml
2. Recreate backend containers
3. See [CORS Configuration Guide](./CORS_CONFIGURATION_GUIDE.md) for detailed instructions

### Caddy SSL Certificate Issues

**Symptom:** Browser shows SSL certificate warning

**Solution:**
```bash
# Check Caddy logs
docker logs caddy

# Force certificate renewal
docker exec caddy caddy reload --config /etc/caddy/Caddyfile
```

### Container Health Check Failures

**Symptom:** Container shows "unhealthy" status

**Solution:**
```bash
# Check container logs
docker logs <container-name>

# Check health status
docker inspect <container-name> | grep -A 20 Health
```

### SvelteKit Pre-Compressed Config Files (IMPORTANT)

**Symptom:** Browser calls `localhost:3001` instead of staging URLs, even though:
- Server logs show correct config was generated
- `docker exec <container> cat .../config.json` shows correct values
- `curl https://app.staging.manacore.ai/config.json` shows wrong (localhost) values

**Root Cause:** SvelteKit pre-compresses static files during build:
- `config.json` - raw file (overwritten by entrypoint ✓)
- `config.json.br` - Brotli compressed (stale from build ✗)
- `config.json.gz` - Gzip compressed (stale from build ✗)

When browsers send `Accept-Encoding: gzip, br`, SvelteKit serves the pre-compressed versions, which contain the old localhost values from build time.

**Solution (Permanent):** The `docker-entrypoint.sh` must delete pre-compressed files:
```bash
# After generating config.json, remove stale compressed versions
rm -f /app/apps/<app>/apps/web/build/client/config.json.br
rm -f /app/apps/<app>/apps/web/build/client/config.json.gz
```

**Solution (Quick Fix):** For immediate fix without redeploying:
```bash
# Remove compressed files and restart
docker exec <app>-web-staging rm -f /app/apps/<app>/apps/web/build/client/config.json.br /app/apps/<app>/apps/web/build/client/config.json.gz
docker restart <app>-web-staging
docker restart caddy  # Clear any Caddy cache
```

**Diagnosis Commands:**
```bash
# Check if pre-compressed files exist
docker exec <app>-web-staging ls -la /app/apps/<app>/apps/web/build/client/config.json*

# Test what browser receives (from local machine, not server)
curl https://<app>.staging.manacore.ai/config.json

# Compare file content vs HTTP response
docker exec <app>-web-staging cat /app/apps/<app>/apps/web/build/client/config.json
# vs
curl https://<app>.staging.manacore.ai/config.json
```

### Caddy Response Caching

**Symptom:** After fixing config.json on the server, `curl` still returns old values

**Solution:**
```bash
# Restart Caddy to clear any cached responses
docker restart caddy
```

### Disk Space Full (Docker)

**Symptom:** CI/CD deployment fails with "no space left on device"

**Cause:** Docker images, containers, and build cache accumulating over time

**Solution (Immediate):**
```bash
ssh -i ~/.ssh/hetzner_deploy_key deploy@46.224.108.214

# Check disk usage
df -h

# Clean up all unused Docker resources
docker system prune -af --volumes
docker builder prune -af
```

**Solution (Preventive):** Set up a weekly cleanup cronjob:
```bash
crontab -e
# Add this line (runs every Sunday at 3 AM):
0 3 * * 0 docker system prune -af --volumes >> /home/deploy/docker-cleanup.log 2>&1
```

## Adding a New App to Staging

### 1. Update DNS (if needed)

If using a new subdomain pattern, update Namecheap DNS. The `*.staging` wildcard should cover most cases.

### 2. Update Caddyfile

Add entries for web and API:
```caddyfile
newapp.staging.manacore.ai {
    reverse_proxy localhost:<WEB_PORT>
}

newapp-api.staging.manacore.ai {
    reverse_proxy localhost:<API_PORT>
}
```

### 3. Update docker-compose.staging.yml

Add the new services with proper environment variables:
```yaml
newapp-web:
  image: ghcr.io/memo-2023/newapp-web:latest
  environment:
    PUBLIC_BACKEND_URL: http://newapp-backend:<API_PORT>
    PUBLIC_MANA_CORE_AUTH_URL: http://mana-core-auth:3001
    PUBLIC_BACKEND_URL_CLIENT: https://newapp-api.staging.manacore.ai
    PUBLIC_MANA_CORE_AUTH_URL_CLIENT: https://auth.staging.manacore.ai
  ports:
    - "<WEB_PORT>:<WEB_PORT>"
```

### 4. Create docker-entrypoint.sh (CRITICAL)

Create `apps/<app>/apps/web/docker-entrypoint.sh`:
```bash
#!/bin/sh
set -e

echo "🔧 Generating runtime configuration..."

# Environment variables with development defaults
BACKEND_URL=${BACKEND_URL:-"http://localhost:<PORT>"}
AUTH_URL=${AUTH_URL:-"http://localhost:3001"}

echo "📝 Config values:"
echo "   BACKEND_URL: $BACKEND_URL"
echo "   AUTH_URL: $AUTH_URL"

# Generate config.json from environment variables
cat > /app/apps/<app>/apps/web/build/client/config.json <<EOF
{
  "BACKEND_URL": "${BACKEND_URL}",
  "AUTH_URL": "${AUTH_URL}"
}
EOF

echo "✅ Configuration generated at /app/apps/<app>/apps/web/build/client/config.json"
cat /app/apps/<app>/apps/web/build/client/config.json

# CRITICAL: Remove pre-compressed versions (SvelteKit serves these instead of raw file)
rm -f /app/apps/<app>/apps/web/build/client/config.json.br
rm -f /app/apps/<app>/apps/web/build/client/config.json.gz
echo "🗑️  Removed stale pre-compressed config files"

echo "🚀 Starting <App> web app..."
exec "$@"
```

Make sure the Dockerfile copies and uses this entrypoint:
```dockerfile
COPY apps/<app>/apps/web/docker-entrypoint.sh /usr/local/bin/
RUN chmod +x /usr/local/bin/docker-entrypoint.sh
ENTRYPOINT ["docker-entrypoint.sh"]
CMD ["node", "build"]
```

### 5. Create static/config.json for local development

Create `apps/<app>/apps/web/static/config.json` for local dev (this gets overwritten at runtime in Docker):
```json
{
  "BACKEND_URL": "http://localhost:<PORT>",
  "AUTH_URL": "http://localhost:3001"
}
```

### 6. Implement runtime.ts config loader

Create `apps/<app>/apps/web/src/lib/config/runtime.ts`:
```typescript
import { browser, dev } from '$app/environment';

export interface RuntimeConfig {
  BACKEND_URL: string;
  AUTH_URL: string;
}

const DEV_CONFIG: RuntimeConfig = {
  BACKEND_URL: 'http://localhost:<PORT>',
  AUTH_URL: 'http://localhost:3001',
};

let cachedConfig: RuntimeConfig | null = null;

export async function getConfig(): Promise<RuntimeConfig> {
  if (!browser) return DEV_CONFIG;
  if (cachedConfig) return cachedConfig;

  try {
    const res = await fetch('/config.json');
    if (!res.ok) {
      if (dev) return DEV_CONFIG;
      throw new Error(`Failed to load config: ${res.status}`);
    }
    cachedConfig = await res.json();
    return cachedConfig!;
  } catch (error) {
    if (dev) return DEV_CONFIG;
    throw error;
  }
}

export async function getAuthUrl(): Promise<string> {
  const config = await getConfig();
  return config.AUTH_URL;
}

export async function getBackendUrl(): Promise<string> {
  const config = await getConfig();
  return config.BACKEND_URL;
}
```

### 7. Deploy

1. Sync Caddyfile: `scp ... Caddyfile.staging deploy@server:~/Caddyfile`
2. Reload Caddy: `docker exec caddy caddy reload --config /etc/caddy/Caddyfile`
3. Sync docker-compose: `scp ... docker-compose.staging.yml deploy@server:~/manacore-staging/docker-compose.yml`
4. Deploy containers: `docker compose up -d`

## Quick Reference Commands

```bash
# SSH into server
ssh -i ~/.ssh/hetzner_deploy_key deploy@46.224.108.214

# View all containers
docker ps

# View container logs
docker logs -f <container-name>

# Restart a container
docker restart <container-name>

# Recreate containers with new config
cd ~/manacore-staging && docker compose up -d --force-recreate

# Check Caddy SSL certificates
docker exec caddy caddy validate --config /etc/caddy/Caddyfile

# Test HTTPS endpoint
curl -s https://auth.staging.manacore.ai/api/v1/health

# Check container env vars
docker exec <container-name> printenv | grep -E 'CLIENT|CORS'
```

## Related Documentation

- [CORS Configuration Guide](./CORS_CONFIGURATION_GUIDE.md) - Solving CORS issues once and for all
- [Local Development Guide](./LOCAL_DEVELOPMENT.md)
- [CI/CD Deployment Guide](./DEPLOYMENT.md)
- [Environment Variables](./ENVIRONMENT_VARIABLES.md)
