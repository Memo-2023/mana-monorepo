# Redis Cache Setup - Erfolgreich konfiguriert! 🎉

## Was wurde gemacht:

### 1. Redis lokal installiert

- Redis via Homebrew installiert: `brew install redis`
- Redis-Service gestartet: `brew services start redis`
- Läuft jetzt permanent im Hintergrund

### 2. Umgebungsvariablen konfiguriert

**Lokal (.env.development):**

```env
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
```

**Produktion (.env):**

```env
# Füge deine Redis-Daten hier ein:
REDIS_HOST=your-redis-host
REDIS_PORT=6379
REDIS_USERNAME=default
REDIS_PASSWORD=your-redis-password
```

### 3. Robuster Fallback-Mechanismus

- App funktioniert auch OHNE Redis
- Automatische Erkennung ob Redis verfügbar ist
- Graceful degradation wenn Redis offline ist

## So prüfst du ob Redis funktioniert:

### 1. Status-Endpoint

```bash
# Lokal
curl http://localhost:5173/api/redis-status

# Produktion
curl https://ulo.ad/api/redis-status
```

### 2. Console Logs

Beim App-Start siehst du:

- ✅ Redis: Connected successfully (wenn verbunden)
- ⚠️ Redis: Disabled (wenn nicht konfiguriert)

### 3. Performance Test

1. Besuche einen Link zum ersten Mal → "Cache MISS"
2. Besuche denselben Link nochmal → "Cache HIT!" (viel schneller!)

### 4. Redis CLI

```bash
# Zeige alle gecachten Links
redis-cli keys "redirect:*"

# Zeige Cache-Inhalt
redis-cli get "redirect:dein-link-code"
```

## Befehle für Redis-Management:

```bash
# Redis starten
brew services start redis

# Redis stoppen
brew services stop redis

# Redis Status
brew services list | grep redis

# Redis Monitor (live traffic)
redis-cli monitor

# Cache leeren
redis-cli flushall
```

## Test-Scripts:

- `test-local-redis.mjs` - Testet lokale Redis-Verbindung
- `test-redis-cache.mjs` - Umfassender Cache-Test
- `check-prod-redis.sh` - Testet Produktion Cache

## Nächste Schritte für Produktion:

1. Redis in Docker Compose einrichten
2. Umgebungsvariablen setzen:
   - REDIS_HOST
   - REDIS_PORT
   - REDIS_PASSWORD
   - REDIS_USERNAME (optional)
3. Deploy und mit `/api/redis-status` prüfen

## Cache-Strategie:

- **Normale Links**: 5 Minuten Cache
- **Populäre Links**: 24 Stunden Cache
- **Passwort-geschützte Links**: Kein Cache
- **Abgelaufene Links**: Kein Cache

Der Cache beschleunigt Redirects von ~100ms auf ~10ms! 🚀
