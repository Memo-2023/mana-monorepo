# Mac Mini Setup Checklist

**Server:** mana-server (ssh.mana.how)
**Domain:** mana.how
**Stand:** 22.01.2026

---

## 1. SSH verbinden

```bash
ssh mana-server
```

---

## 2. Repo aktualisieren

```bash
cd ~/projects/manacore-monorepo
git pull
```

---

## 3. Environment-Datei erstellen

```bash
cp .env.macmini.example .env.macmini
nano .env.macmini
```

**Diese Werte eintragen:**

```env
# Datenbank (selbst ausdenken, sicher!)
POSTGRES_PASSWORD=MeinSicheresPasswort123!

# Redis (selbst ausdenken)
REDIS_PASSWORD=RedisPasswort456!

# JWT Secret (mind. 32 Zeichen)
JWT_SECRET=MeinSuperGeheimerJWTSecretKey2026!

# Optional: Azure OpenAI für Chat
AZURE_OPENAI_ENDPOINT=https://xxx.openai.azure.com/
AZURE_OPENAI_API_KEY=xxx
```

Speichern: `Ctrl+O`, `Enter`, `Ctrl+X`

---

## 4. Cloudflared Service einrichten (einmalig)

```bash
chmod +x scripts/mac-mini/setup-cloudflared-service.sh
./scripts/mac-mini/setup-cloudflared-service.sh
```

**Prüfen ob es läuft:**
```bash
launchctl list | grep cloudflared
tail -f /tmp/cloudflared.log
```

---

## 5. Docker Images pullen & Container starten

```bash
# Bei GitHub einloggen (PAT mit read:packages Berechtigung)
echo "DEIN_GITHUB_TOKEN" | docker login ghcr.io -u memo-2023 --password-stdin

# Images pullen
docker compose -f docker-compose.macmini.yml --env-file .env.macmini pull

# Container starten
docker compose -f docker-compose.macmini.yml --env-file .env.macmini up -d
```

---

## 6. Datenbanken erstellen

```bash
docker compose -f docker-compose.macmini.yml exec -T postgres psql -U postgres -c "CREATE DATABASE manacore_auth;"
docker compose -f docker-compose.macmini.yml exec -T postgres psql -U postgres -c "CREATE DATABASE chat;"
docker compose -f docker-compose.macmini.yml exec -T postgres psql -U postgres -c "CREATE DATABASE todo;"
docker compose -f docker-compose.macmini.yml exec -T postgres psql -U postgres -c "CREATE DATABASE calendar;"
docker compose -f docker-compose.macmini.yml exec -T postgres psql -U postgres -c "CREATE DATABASE clock;"
```

---

## 7. Status prüfen

```bash
# Container Status
docker compose -f docker-compose.macmini.yml ps

# Logs anschauen (falls Probleme)
docker compose -f docker-compose.macmini.yml logs -f
```

---

## 8. Health Checks

```bash
curl -s http://localhost:3001/api/v1/health && echo " ✓ Auth"
curl -s http://localhost:5173/health && echo " ✓ Dashboard"
curl -s http://localhost:3002/api/v1/health && echo " ✓ Chat API"
curl -s http://localhost:3000/health && echo " ✓ Chat Web"
curl -s http://localhost:3018/api/health && echo " ✓ Todo API"
curl -s http://localhost:5188/health && echo " ✓ Todo Web"
curl -s http://localhost:3016/api/v1/health && echo " ✓ Calendar API"
curl -s http://localhost:5186/health && echo " ✓ Calendar Web"
curl -s http://localhost:3017/api/v1/health && echo " ✓ Clock API"
curl -s http://localhost:5187/health && echo " ✓ Clock Web"
```

---

## 9. Im Browser testen

| App | URL |
|-----|-----|
| Dashboard | https://mana.how |
| Auth API | https://auth.mana.how/api/v1/health |
| Chat | https://chat.mana.how |
| Todo | https://todo.mana.how |
| Calendar | https://calendar.mana.how |
| Clock | https://clock.mana.how |

---

## Nützliche Befehle

```bash
# Alle Container stoppen
docker compose -f docker-compose.macmini.yml down

# Alle Container neustarten
docker compose -f docker-compose.macmini.yml restart

# Logs eines Services
docker compose -f docker-compose.macmini.yml logs -f mana-core-auth

# Update auf neue Images
docker compose -f docker-compose.macmini.yml pull
docker compose -f docker-compose.macmini.yml up -d

# Alte Images aufräumen
docker image prune -f

# Cloudflared Logs
tail -f /tmp/cloudflared.log
```

---

## Troubleshooting

**Container startet nicht:**
```bash
docker compose -f docker-compose.macmini.yml logs <service-name>
```

**Datenbank-Fehler:**
```bash
docker compose -f docker-compose.macmini.yml exec postgres psql -U postgres -c "\l"
```

**Cloudflared Probleme:**
```bash
launchctl unload ~/Library/LaunchAgents/com.cloudflare.cloudflared.plist
launchctl load ~/Library/LaunchAgents/com.cloudflare.cloudflared.plist
tail -f /tmp/cloudflared.error.log
```
