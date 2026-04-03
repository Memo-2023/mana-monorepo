# Mail Server — Stalwart on Mac Mini

Self-hosted email infrastructure using Stalwart (Rust) for all transactional emails.
Fully replaces Brevo SMTP — no external email provider dependency.

## Architecture

```
Browser (Register/Reset/etc.)
  → mana-auth (Hono/Bun, Port 3001)
    → mana-notify (Go, Port 3013) via POST /api/v1/notifications/send
      → Stalwart (Rust, Port 587 internal) via SMTP STARTTLS
        → Recipient MX (e.g. gmail-smtp-in.l.google.com, Port 25)
```

### Key Design Decisions

- **mana-auth has no SMTP dependency** — sends all emails via mana-notify HTTP API
- **mana-notify is the single SMTP gateway** — provider swappable via env vars
- **Stalwart runs inside the Docker stack** — same network as all other services
- **DKIM signing is automatic** — Stalwart signs all outgoing mail with Ed25519 + RSA keys

## Components

| Component | Role | Container | Port |
|-----------|------|-----------|------|
| mana-auth | Triggers emails (verify, reset, invite) | `mana-auth` | 3001 |
| mana-notify | Central email gateway with retry/queue | `mana-core-notify` | 3013 |
| Stalwart | SMTP server, DKIM signing, delivery | `mana-mail` | 25, 587, 465, 993, 8443 |

## Configuration

### Docker Compose (`docker-compose.macmini.yml`)

```yaml
stalwart:
  image: stalwartlabs/stalwart:latest
  container_name: mana-mail
  restart: always
  mem_limit: 256m
  ports:
    - "25:25"       # SMTP (inbound from other servers)
    - "587:587"     # Submission (outbound from mana-notify)
    - "465:465"     # SMTPS
    - "993:993"     # IMAPS
    - "8443:8080"   # Web Admin UI
  volumes:
    - stalwart_data:/opt/stalwart-mail
```

### mana-notify SMTP Environment

```env
SMTP_HOST=stalwart           # Docker service name
SMTP_PORT=587
SMTP_USER=noreply            # Stalwart username (without @domain)
SMTP_PASSWORD=ManaNoReply2026!
SMTP_FROM=ManaCore <noreply@mana.how>
SMTP_INSECURE_TLS=true       # Self-signed cert inside Docker network
```

### mana-auth Environment

```env
MANA_NOTIFY_URL=http://mana-notify:3013   # Routes emails through mana-notify
MANA_CORE_SERVICE_KEY=<shared-key>        # Auth for mana-notify API
```

## Stalwart Admin

### Web UI

Access via SSH tunnel: `ssh -L 8443:localhost:8443 mana-server`
Then open `http://localhost:8443`

- **Username:** `admin`
- **Password:** Set via `STALWART_ADMIN_PASSWORD` env var

### Accounts

| Account | Email | Role | Purpose |
|---------|-------|------|---------|
| admin | — | superuser | Admin access, not for SMTP |
| noreply | noreply@mana.how | user | SMTP sending for all transactional emails |
| postmaster | postmaster@mana.how | user | DMARC reports, bounces |

### Creating Accounts via API

```bash
# Password must be SHA512-crypt hashed ($6$ prefix)
HASH=$(docker exec mana-mail sh -c 'echo -n "PASSWORD" | openssl passwd -6 -stdin')

curl -u admin:PASSWORD http://localhost:8443/api/principal -X POST \
  -H "Content-Type: application/json" \
  -d "{\"type\":\"individual\",\"name\":\"USERNAME\",\"secrets\":[\"$HASH\"],\"emails\":[\"USER@mana.how\"]}"

# Assign 'user' role (required for SMTP access)
curl -u admin:PASSWORD http://localhost:8443/api/principal/USERNAME -X PATCH \
  -H "Content-Type: application/json" \
  -d '[{"action":"set","field":"roles","value":["user"]}]'
```

## DNS Records (Cloudflare)

All records are set on `mana.how` zone:

| Type | Name | Content | Proxy |
|------|------|---------|-------|
| A | `mail` | `194.191.241.139` | DNS only |
| MX | `@` | `mail.mana.how` (Priority 10) | — |
| TXT | `@` | `v=spf1 a mx a:mail.mana.how ~all` | — |
| TXT | `_dmarc` | `v=DMARC1; p=quarantine; rua=mailto:postmaster@mana.how` | — |
| TXT | `mana2026._domainkey` | `v=DKIM1; k=ed25519; h=sha256; p=oR3PJitX2xsZh5sFm1Lt5gMqR2jureP2WxVdY9CTjk4=` | — |
| TXT | `rsa2026._domainkey` | `v=DKIM1; k=rsa; h=sha256; p=MIIBIjANBgkqhkiG9w0BAQE...` (full key in Cloudflare) | — |

### Regenerating DKIM Keys

```bash
curl -u admin:PASSWORD http://localhost:8443/api/dkim -X POST \
  -H "Content-Type: application/json" \
  -d '{"algorithm":"Ed25519","selector":"mana2026","domain":"mana.how"}'

# Get DNS records to update in Cloudflare
curl -u admin:PASSWORD http://localhost:8443/api/dns/records/mana.how
```

## Port Forwarding (Fritz!Box) — TODO

For **receiving** external emails (bounces, replies), the router must forward these ports to the Mac Mini (`192.168.178.131`):

| Port | Protocol | Purpose |
|------|----------|---------|
| 25 | TCP | SMTP inbound (other mail servers deliver here) |
| 587 | TCP | Submission (external mail clients) |
| 465 | TCP | SMTPS (external mail clients, implicit TLS) |

### Fritz!Box Setup

1. Open `http://fritz.box` → Login
2. Go to **Internet → Freigaben → Portfreigaben**
3. Click **Gerät für Freigaben hinzufügen** → Select Mac Mini (`192.168.178.131`)
4. Add port forwarding for 25, 587, 465 (TCP each)
5. Save and apply

**Note:** Port forwarding is only needed for mail reception. Outgoing mail delivery (Port 25 outbound) works without forwarding and is already functional.

### Verify Port Forwarding

```bash
# From an external machine:
nc -z mail.mana.how 25    # Should connect
nc -z mail.mana.how 587   # Should connect
```

## Stalwart Config Customizations

The following were added to `/opt/stalwart/etc/config.toml` inside the container:

```toml
[lookup.default]
hostname = "mail.mana.how"

[server.security]
analysis.scan-ban = false    # Disable auto-ban for Docker internal IPs

[server.allowed-ip]
172.18.0.0/16 = true         # Trust Docker network
```

**Important:** These changes are inside the container volume (`stalwart_data`). They persist across restarts but would be lost if the volume is deleted.

## Troubleshooting

### Check email delivery

```bash
# mana-notify logs (did it send?)
docker logs mana-core-notify --since 5m

# Stalwart logs (did it deliver?)
docker exec mana-mail tail -30 /opt/stalwart/logs/stalwart.log.$(date +%Y-%m-%d)
```

### Common errors

| Error | Cause | Fix |
|-------|-------|-----|
| `mana-notify error: 401` | Service key mismatch | Ensure `MANA_CORE_SERVICE_KEY` matches between mana-auth and mana-notify |
| `smtp not configured` | Empty SMTP_USER or SMTP_PASSWORD | Check `.env` on server, restart mana-notify |
| `security.ip-blocked` | Stalwart banned mana-notify IP | Restart Stalwart container (clears bans) |
| `535 Authentication credentials invalid` | Wrong password or username format | Use username without domain (`noreply`, not `noreply@mana.how`) |
| `550 SPF/DKIM did not pass` | DNS records missing or not propagated | Verify with `dig +short @1.1.1.1 mana.how TXT` |
| `Messages missing Message-ID` | Email missing RFC 5322 headers | mana-notify adds Message-ID + Date automatically |

### Switching back to Brevo (emergency fallback)

Update `.env` on Mac Mini:
```env
SMTP_HOST=smtp-relay.brevo.com
SMTP_PORT=587
SMTP_USER=94cde5002@smtp-brevo.com
SMTP_PASSWORD=<brevo-api-key>
SMTP_INSECURE_TLS=false
```
Then: `docker compose -f docker-compose.macmini.yml up -d mana-notify`

## Resource Usage

| Metric | Value |
|--------|-------|
| RAM (idle) | ~50 MB |
| RAM (under load) | ~100 MB |
| Docker mem_limit | 256 MB |
| Disk (data volume) | ~10 MB initially |
| Container image | ~30 MB |
