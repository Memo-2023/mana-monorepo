# uload Deployment Guide

Schritt-für-Schritt Anleitung zum Deployment von uload mit Coolify auf Hetzner VPS.

## Architektur

```
┌─────────────────────────────────────────────────────────────────┐
│                      Hetzner VPS                                 │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │                      Coolify                               │  │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────────┐   │  │
│  │  │   uload     │  │  PostgreSQL │  │     Redis       │   │  │
│  │  │   (Node)    │  │    (16)     │  │     (7)         │   │  │
│  │  │   :3000     │  │    :5432    │  │    :6379        │   │  │
│  │  └─────────────┘  └─────────────┘  └─────────────────┘   │  │
│  │         │                │                  │             │  │
│  │         └────────────────┴──────────────────┘             │  │
│  │                       Traefik (SSL/Proxy)                 │  │
│  │                         :80 / :443                        │  │
│  └───────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
                     https://ulo.ad
```

---

## Voraussetzungen

- [ ] Hetzner VPS (mindestens CX21: 2 vCPU, 4GB RAM, 40GB SSD)
- [ ] Domain mit DNS-Zugang (z.B. ulo.ad)
- [ ] GitHub Account mit Zugriff auf das Repository
- [ ] Accounts für externe Services:
  - Resend (Email)
  - Stripe (Payments)
  - Cloudflare R2 (Storage)

---

## Schritt 1: Hetzner VPS einrichten

### 1.1 Server erstellen

1. Gehe zu [Hetzner Cloud Console](https://console.hetzner.cloud)
2. Erstelle neues Projekt oder wähle bestehendes
3. Klicke **Add Server**
4. Wähle:
   - **Location:** Falkenstein oder Nürnberg (DE)
   - **Image:** Ubuntu 22.04
   - **Type:** CX21 (2 vCPU, 4GB RAM) oder größer
   - **SSH Key:** Füge deinen öffentlichen SSH-Key hinzu
5. Klicke **Create & Buy Now**
6. Notiere die **IP-Adresse**

### 1.2 Mit Server verbinden

```bash
ssh root@DEINE-SERVER-IP
```

### 1.3 System updaten

```bash
apt update && apt upgrade -y
```

---

## Schritt 2: Coolify installieren

### 2.1 Installation

```bash
curl -fsSL https://cdn.coollabs.io/coolify/install.sh | bash
```

Die Installation dauert ca. 2-5 Minuten.

### 2.2 Coolify öffnen

1. Öffne im Browser: `http://DEINE-SERVER-IP:8000`
2. Erstelle Admin-Account (E-Mail + Passwort)
3. Wähle **Self-hosted** als Instance Type
4. Der Server "localhost" wird automatisch hinzugefügt

---

## Schritt 3: PostgreSQL Datenbank erstellen

### 3.1 In Coolify

1. Klicke **+ New Resource**
2. Wähle **Database**
3. Wähle **PostgreSQL**
4. Konfiguriere:
   - **Name:** `uload-postgres`
   - **Version:** `16-alpine`
   - **Database Name:** `uload`
   - **Database User:** `uload`
   - **Password:** (automatisch generiert oder eigenes)
5. Klicke **Start**

### 3.2 Connection String notieren

Nach dem Start findest du unter **Connect** die Internal URL:

```
postgresql://uload:PASSWORT@uload-postgres:5432/uload
```

**Wichtig:** Kopiere diese URL - du brauchst sie später!

---

## Schritt 4: Redis erstellen (optional, aber empfohlen)

### 4.1 In Coolify

1. Klicke **+ New Resource**
2. Wähle **Database**
3. Wähle **Redis**
4. Konfiguriere:
   - **Name:** `uload-redis`
   - **Version:** `7-alpine`
5. Klicke **Start**

### 4.2 Connection String notieren

```
redis://uload-redis:6379
```

---

## Schritt 5: GitHub Repository verbinden

### 5.1 GitHub App erstellen

1. In Coolify: Gehe zu **Sources** (linke Sidebar)
2. Klicke **+ Add**
3. Wähle **GitHub App**
4. Klicke **Register GitHub App**
5. Du wirst zu GitHub weitergeleitet
6. Gib der App einen Namen (z.B. "coolify-uload")
7. Klicke **Create GitHub App**
8. Installiere die App für dein Repository

### 5.2 Repository-Zugriff gewähren

1. Wähle **Only select repositories**
2. Wähle `manacore-monorepo`
3. Klicke **Install**

---

## Schritt 6: uload Application erstellen

### 6.1 Neue Application

1. Klicke **+ New Resource**
2. Wähle **Application**
3. Wähle deine **GitHub App** als Source
4. Wähle das Repository `manacore-monorepo`
5. Wähle Branch: `main`

### 6.2 Build-Konfiguration (WICHTIG!)

Da uload Teil eines Monorepos ist, muss die Build-Konfiguration genau so sein:

| Einstellung             | Wert                       |
| ----------------------- | -------------------------- |
| **Base Directory**      | `/` (leer lassen oder `/`) |
| **Build Pack**          | Dockerfile                 |
| **Dockerfile Location** | `uload/Dockerfile`         |
| **Port Exposes**        | `3000`                     |

**Warum `/` als Base Directory?**
Das Dockerfile benötigt Zugriff auf:

- `uload/apps/web/` (die App)
- `packages/shared-*` (gemeinsame Packages)
- `pnpm-workspace.yaml` und `pnpm-lock.yaml` (Workspace-Config)

---

## Schritt 7: Environment Variables setzen

### 7.1 In Coolify

Gehe zu deiner Application → **Environment Variables** → **Add Variable**

### 7.2 Erforderliche Variablen

```env
# === APP ===
NODE_ENV=production
PORT=3000
HOST=0.0.0.0
ORIGIN=https://ulo.ad

# === DATABASE ===
# Von Schritt 3.2 - PostgreSQL Internal URL
DATABASE_URL=postgresql://uload:DEIN-PASSWORT@uload-postgres:5432/uload

# === REDIS (optional) ===
# Von Schritt 4.2
REDIS_URL=redis://uload-redis:6379

# === AUTH ===
# Generiere mit: openssl rand -base64 32
AUTH_SECRET=GENERIERE-EINEN-SICHEREN-STRING-HIER

# === EMAIL (Resend) ===
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxxxxxxxxx

# === PAYMENTS (Stripe) ===
STRIPE_SECRET_KEY=sk_live_xxxxxxxxxxxxxxxxxxxxxxxxxxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxxxxxxxxxxxxxxx

# === STORAGE (Cloudflare R2) ===
R2_ACCESS_KEY_ID=xxxxxxxxxxxxxxxxxxxxxxxxxx
R2_SECRET_ACCESS_KEY=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
R2_BUCKET_NAME=uload-uploads
R2_ENDPOINT=https://xxxxxxxxxx.r2.cloudflarestorage.com
```

### 7.3 AUTH_SECRET generieren

Auf deinem lokalen Rechner:

```bash
openssl rand -base64 32
```

Kopiere das Ergebnis als `AUTH_SECRET`.

---

## Schritt 8: Domain konfigurieren

### 8.1 DNS-Einträge setzen

Bei deinem DNS-Provider (z.B. Cloudflare, Namecheap):

| Type | Name | Value           | TTL  |
| ---- | ---- | --------------- | ---- |
| A    | @    | DEINE-SERVER-IP | 3600 |
| A    | www  | DEINE-SERVER-IP | 3600 |

### 8.2 Domain in Coolify hinzufügen

1. Gehe zu deiner Application → **Settings**
2. Unter **Domains** klicke **+ Add**
3. Gib ein: `ulo.ad`
4. Aktiviere: **Generate SSL Certificate** (Let's Encrypt)
5. Optional: Füge auch `www.ulo.ad` hinzu mit Redirect

### 8.3 Warten

DNS-Änderungen können 5-30 Minuten dauern. SSL-Zertifikate werden automatisch erstellt.

---

## Schritt 9: Deployment starten

### 9.1 Erster Deploy

1. Gehe zu deiner Application
2. Klicke **Deploy**
3. Warte auf den Build (ca. 3-5 Minuten)

### 9.2 Build-Logs überwachen

Klicke auf das laufende Deployment um die Logs zu sehen.

**Erfolgreicher Build zeigt:**

```
✔ done
Listening on http://0.0.0.0:3000
```

---

## Schritt 10: Datenbank-Migration

### 10.1 Nach erstem Deployment

Die Datenbank-Tabellen müssen erstellt werden:

1. In Coolify: Gehe zu deiner Application → **Terminal**
2. Oder via SSH:

```bash
# Container-Name finden
docker ps | grep uload

# In Container gehen
docker exec -it CONTAINER-NAME sh

# Migration ausführen
npx drizzle-kit push
```

### 10.2 Alternative: Pre-Deploy Command

In Coolify → Application → **Settings** → **Pre-Deploy Command**:

```bash
cd /app && npx drizzle-kit push
```

---

## Schritt 11: Verifizieren

### 11.1 Health Check

```bash
curl https://ulo.ad/api/health
```

Erwartete Antwort:

```json
{ "status": "ok", "timestamp": "2025-11-25T12:00:00.000Z", "uptime": 123.45 }
```

### 11.2 Website öffnen

Öffne `https://ulo.ad` im Browser.

---

## Automatische Deployments

### Webhook (Standard)

Coolify erstellt automatisch einen GitHub Webhook. Bei jedem Push auf `main` wird automatisch deployed.

### Manuelles Deployment

In Coolify: Application → **Redeploy**

---

## Wartung & Monitoring

### Logs anzeigen

**In Coolify:**
Application → **Logs**

**Via SSH:**

```bash
docker logs -f $(docker ps -qf "name=uload")
```

### Container neustarten

In Coolify: Application → **Restart**

### Datenbank Backup

```bash
# Manuelles Backup
docker exec uload-postgres pg_dump -U uload uload > backup_$(date +%Y%m%d).sql

# Backup wiederherstellen
cat backup_20251125.sql | docker exec -i uload-postgres psql -U uload uload
```

---

## Troubleshooting

### Build schlägt fehl

| Problem                    | Lösung                                   |
| -------------------------- | ---------------------------------------- |
| "Cannot find package"      | Prüfe Base Directory (muss `/` sein)     |
| "pnpm-lock.yaml not found" | Prüfe dass pnpm-lock.yaml im Repo ist    |
| Timeout beim Build         | Erhöhe Build-Timeout in Coolify Settings |

### Container startet nicht

| Problem                      | Lösung                                    |
| ---------------------------- | ----------------------------------------- |
| "Missing API key"            | Prüfe RESEND_API_KEY Environment Variable |
| "Cannot connect to database" | Prüfe DATABASE_URL (Internal URL!)        |
| Port already in use          | Prüfe ob alter Container noch läuft       |

### SSL-Zertifikat Fehler

1. Prüfe DNS-Einträge (A-Record auf Server-IP)
2. Warte 5-10 Minuten
3. In Coolify: Domain löschen und neu hinzufügen
4. Prüfe ob Port 80 erreichbar ist (Firewall)

### Datenbank-Verbindung fehlgeschlagen

1. Prüfe ob PostgreSQL-Container läuft
2. Verwende **Internal URL** (nicht External!)
3. Teste Verbindung:
   ```bash
   docker exec -it uload-postgres psql -U uload -d uload -c "SELECT 1"
   ```

---

## Checkliste Production-Ready

- [ ] Hetzner VPS erstellt und SSH funktioniert
- [ ] Coolify installiert und Admin-Account erstellt
- [ ] PostgreSQL läuft und CONNECTION_STRING notiert
- [ ] Redis läuft (optional)
- [ ] GitHub Repository verbunden
- [ ] Application mit korrektem Dockerfile-Pfad erstellt
- [ ] Alle Environment Variables gesetzt
- [ ] AUTH_SECRET generiert (min. 32 Zeichen)
- [ ] DNS A-Records konfiguriert
- [ ] Domain in Coolify hinzugefügt
- [ ] SSL-Zertifikat aktiv
- [ ] Erster Deploy erfolgreich
- [ ] Datenbank-Migration ausgeführt
- [ ] Health-Check funktioniert (`/api/health`)
- [ ] Website erreichbar

---

## Dateien im Repository

| Datei                              | Beschreibung             |
| ---------------------------------- | ------------------------ |
| `uload/Dockerfile`                 | Multi-Stage Docker Build |
| `uload/docker-compose.yml`         | Lokale Entwicklung       |
| `uload/docker-compose.coolify.yml` | Coolify Deployment       |
| `uload/docker-compose.prod.yml`    | Standalone Production    |

---

## Support

Bei Problemen:

1. Coolify Logs prüfen
2. Container Logs prüfen (`docker logs`)
3. GitHub Issues: https://github.com/anthropics/claude-code/issues
