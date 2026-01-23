# Production Launch Guide - mana.how

Diese Anleitung beschreibt alle Schritte um die Staging-Umgebung zur Production zu machen.

**Server:** 46.224.108.214 (Hetzner)
**Domain:** mana.how

---

## Schritt 1: DNS-Einträge anlegen

Bei eurem DNS-Provider (wo `mana.how` registriert ist) folgende A-Records anlegen:

### Erforderliche DNS-Einträge

| Subdomain | Typ | Ziel | TTL |
|-----------|-----|------|-----|
| `@` (root) | A | 46.224.108.214 | 300 |
| `www` | A | 46.224.108.214 | 300 |
| `auth` | A | 46.224.108.214 | 300 |
| `chat` | A | 46.224.108.214 | 300 |
| `chat-api` | A | 46.224.108.214 | 300 |
| `todo` | A | 46.224.108.214 | 300 |
| `todo-api` | A | 46.224.108.214 | 300 |
| `calendar` | A | 46.224.108.214 | 300 |
| `calendar-api` | A | 46.224.108.214 | 300 |
| `clock` | A | 46.224.108.214 | 300 |
| `clock-api` | A | 46.224.108.214 | 300 |

**Alternative mit Wildcard:**
| Subdomain | Typ | Ziel | TTL |
|-----------|-----|------|-----|
| `@` (root) | A | 46.224.108.214 | 300 |
| `*` | A | 46.224.108.214 | 300 |

> **Hinweis:** Nach dem Anlegen kann es bis zu 24h dauern bis die DNS-Einträge weltweit propagiert sind. In der Praxis meist schneller.

### DNS prüfen

```bash
# Prüfen ob DNS korrekt ist
dig mana.how +short
dig auth.mana.how +short
dig chat.mana.how +short
# Sollte jeweils 46.224.108.214 zurückgeben
```

---

## Schritt 2: Server vorbereiten

SSH auf den Server:

```bash
ssh -i ~/.ssh/hetzner_deploy_key deploy@46.224.108.214
```

### 2.1 Backup der aktuellen Staging-Daten (optional aber empfohlen)

```bash
cd ~/manacore-staging

# Datenbank-Backup erstellen
docker compose exec -T postgres pg_dumpall -U postgres > ~/backup_$(date +%Y%m%d_%H%M%S).sql

echo "Backup erstellt: ~/backup_*.sql"
```

### 2.2 Staging Container stoppen

```bash
cd ~/manacore-staging
docker compose down
```

---

## Schritt 3: Production Konfiguration deployen

### 3.1 Verzeichnis umbenennen (optional)

```bash
# Von staging zu production umbenennen
mv ~/manacore-staging ~/manacore-production
cd ~/manacore-production
```

### 3.2 Production docker-compose kopieren

Vom lokalen Rechner:

```bash
# Aus dem Repo-Root
scp -i ~/.ssh/hetzner_deploy_key \
  docker-compose.production.yml \
  deploy@46.224.108.214:~/manacore-production/docker-compose.yml
```

### 3.3 Production Caddyfile kopieren

```bash
scp -i ~/.ssh/hetzner_deploy_key \
  docker/caddy/Caddyfile.production \
  deploy@46.224.108.214:~/Caddyfile
```

### 3.4 Caddy neu laden

Auf dem Server:

```bash
# Caddy Config neu laden
docker exec caddy caddy reload --config /etc/caddy/Caddyfile

# Prüfen ob Caddy läuft
docker logs caddy --tail 20
```

---

## Schritt 4: Environment Variables anpassen

Auf dem Server die `.env` Datei anpassen:

```bash
cd ~/manacore-production
nano .env
```

Die bestehenden Staging-Werte können bleiben. Nur sicherstellen dass:

```env
NODE_ENV=production

# Diese Werte bleiben gleich (Staging Secrets weiterverwenden):
POSTGRES_PASSWORD=<behalten>
REDIS_PASSWORD=<behalten>
JWT_SECRET=<behalten>
JWT_PUBLIC_KEY=<behalten>
JWT_PRIVATE_KEY=<behalten>
SUPABASE_URL=<behalten>
SUPABASE_ANON_KEY=<behalten>
SUPABASE_SERVICE_ROLE_KEY=<behalten>
AZURE_OPENAI_ENDPOINT=<behalten>
AZURE_OPENAI_API_KEY=<behalten>
```

---

## Schritt 5: Container starten

```bash
cd ~/manacore-production

# Images pullen
docker compose pull

# Container starten
docker compose up -d

# Status prüfen
docker compose ps
```

---

## Schritt 6: Health Checks

```bash
# Alle Services prüfen
curl -s http://localhost:3001/api/v1/health  # Auth
curl -s http://localhost:5173/health          # Dashboard
curl -s http://localhost:3000/health          # Chat Web
curl -s http://localhost:3002/api/v1/health   # Chat API
curl -s http://localhost:5188/health          # Todo Web
curl -s http://localhost:3018/api/health      # Todo API
curl -s http://localhost:5186/health          # Calendar Web
curl -s http://localhost:3016/api/v1/health   # Calendar API
curl -s http://localhost:5187/health          # Clock Web
curl -s http://localhost:3017/api/v1/health   # Clock API
```

---

## Schritt 7: SSL-Zertifikate (automatisch)

Caddy holt sich automatisch Let's Encrypt Zertifikate sobald die DNS-Einträge korrekt sind.

Prüfen:

```bash
# Logs prüfen auf Certificate-Meldungen
docker logs caddy 2>&1 | grep -i "certificate\|tls"

# Oder direkt testen
curl -I https://mana.how
```

---

## Schritt 8: Finale Tests

Im Browser testen:

| URL | Erwartet |
|-----|----------|
| https://mana.how | Dashboard Login |
| https://auth.mana.how/api/v1/health | `{"status":"ok"}` |
| https://chat.mana.how | Chat App Login |
| https://todo.mana.how | Todo App Login |
| https://calendar.mana.how | Calendar App Login |
| https://clock.mana.how | Clock App Login |

---

## Troubleshooting

### Container startet nicht

```bash
# Logs anschauen
docker compose logs <service-name>

# Beispiel
docker compose logs mana-core-auth
docker compose logs chat-backend
```

### DNS nicht propagiert

```bash
# Verschiedene DNS-Server testen
dig @8.8.8.8 mana.how +short    # Google DNS
dig @1.1.1.1 mana.how +short    # Cloudflare DNS
```

### SSL-Zertifikat Fehler

```bash
# Caddy Logs prüfen
docker logs caddy --tail 100

# Caddy neu starten
docker restart caddy
```

### Datenbank Verbindungsfehler

```bash
# Postgres prüfen
docker compose exec postgres psql -U postgres -l

# Datenbanken anzeigen
docker compose exec postgres psql -U postgres -c "\l"
```

---

## Rollback zu Staging

Falls etwas schief geht:

```bash
cd ~/manacore-production
docker compose down

# Alte Staging docker-compose wiederherstellen
# (müsste vorher gesichert werden)

# Caddyfile zurück auf staging
scp -i ~/.ssh/hetzner_deploy_key \
  docker/caddy/Caddyfile.staging \
  deploy@46.224.108.214:~/Caddyfile

docker exec caddy caddy reload --config /etc/caddy/Caddyfile
docker compose up -d
```

---

## Zusammenfassung der URLs

Nach erfolgreichem Launch:

| App | URL |
|-----|-----|
| **Dashboard** | https://mana.how |
| **Auth API** | https://auth.mana.how |
| **Chat** | https://chat.mana.how |
| **Chat API** | https://chat-api.mana.how |
| **Todo** | https://todo.mana.how |
| **Todo API** | https://todo-api.mana.how |
| **Calendar** | https://calendar.mana.how |
| **Calendar API** | https://calendar-api.mana.how |
| **Clock** | https://clock.mana.how |
| **Clock API** | https://clock-api.mana.how |
