# ManaCore Auth Monitoring

Automated health checks and status dashboard for the authentication service.

## Quick Start (Hetzner Server)

### 1. Copy files to server

```bash
# From your local machine
scp -r monitoring/ deploy@46.224.108.214:~/manacore-monitoring/
```

### 2. Make scripts executable

```bash
ssh deploy@46.224.108.214
cd ~/manacore-monitoring
chmod +x *.sh
```

### 3. Run manually to test

```bash
# Test staging
./auth-health-check.sh staging

# Test production
./auth-health-check.sh production

# Generate dashboard
./generate-dashboard.sh
```

### 4. Set up cron job (runs every hour)

```bash
crontab -e
```

Add these lines:

```cron
# Auth health checks - every hour
0 * * * * /home/deploy/manacore-monitoring/auth-health-check.sh staging >> /home/deploy/manacore-monitoring/logs/staging.log 2>&1
0 * * * * /home/deploy/manacore-monitoring/auth-health-check.sh production >> /home/deploy/manacore-monitoring/logs/production.log 2>&1

# Generate dashboard - every hour (after health checks)
5 * * * * /home/deploy/manacore-monitoring/generate-dashboard.sh >> /home/deploy/manacore-monitoring/logs/dashboard.log 2>&1
```

### 5. Serve dashboard with Caddy

Add to your Caddyfile:

```caddyfile
status.manacore.ai {
    root * /home/deploy/manacore-monitoring/dashboard
    file_server
    encode gzip

    header {
        Cache-Control "no-cache, no-store, must-revalidate"
    }
}
```

Reload Caddy:

```bash
sudo systemctl reload caddy
```

## Files

| File | Description |
|------|-------------|
| `auth-health-check.sh` | Main test script - runs health checks |
| `generate-dashboard.sh` | Generates HTML dashboard from results |
| `results/` | JSON test results (created automatically) |
| `dashboard/` | HTML dashboard files (created automatically) |

## Tests Performed

1. **Health Endpoint** - Checks `/api/v1/health` returns 200
2. **JWKS Endpoint** - Verifies `/api/v1/auth/jwks` returns EdDSA keys
3. **Security Headers** - Checks HSTS, CSP, X-Frame-Options, etc.
4. **Response Time** - Measures endpoint latency

## Status Meanings

| Status | Description |
|--------|-------------|
| ✅ HEALTHY | All tests passing |
| ⚠️ DEGRADED | Some tests have warnings |
| ❌ DOWN | Critical tests failing |

## Customization

### Change check frequency

Edit the cron schedule. Common options:
- Every 5 minutes: `*/5 * * * *`
- Every hour: `0 * * * *`
- Every 6 hours: `0 */6 * * *`
- Daily at midnight: `0 0 * * *`

### Add notifications

Add to the end of `auth-health-check.sh`:

```bash
# Send alert if status is not healthy
if [ "$OVERALL_STATUS" != "healthy" ]; then
    curl -X POST "https://your-webhook-url" \
        -H "Content-Type: application/json" \
        -d '{"text": "⚠️ Auth service '"$ENVIRONMENT"' is '"$OVERALL_STATUS"'"}'
fi
```

### Test locally

```bash
# Test against local development server
./auth-health-check.sh local
```

## Troubleshooting

### Logs

```bash
# View recent logs
tail -f ~/manacore-monitoring/logs/staging.log
tail -f ~/manacore-monitoring/logs/production.log
```

### Manual test

```bash
# Test health endpoint directly
curl -s https://auth.staging.manacore.ai/api/v1/health

# Test JWKS
curl -s https://auth.staging.manacore.ai/api/v1/auth/jwks
```

### Cron not running?

```bash
# Check cron service
sudo systemctl status cron

# View cron logs
grep CRON /var/log/syslog | tail -20
```
