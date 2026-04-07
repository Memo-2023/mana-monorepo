# Matrix Self-Hosting auf Mac Mini

Plan für DSGVO-konformes Messaging mit Matrix/Synapse auf dem Mana Server.

## Übersicht

```
┌─────────────────────────────────────────────────────────────────────┐
│  Internet                                                           │
│      │                                                              │
│      ▼                                                              │
│  Cloudflare Tunnel                                                  │
│      │                                                              │
│      ├─── matrix.mana.how ──────► Synapse (Port 8008)               │
│      ├─── element.mana.how ─────► Element Web (Port 8087)           │
│      └─── (bestehende Services)                                     │
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │  Docker Container                                            │   │
│  │                                                              │   │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐   │   │
│  │  │   Synapse    │  │  Element Web │  │  Matrix Bots     │   │   │
│  │  │   (8008)     │  │   (8087)     │  │  (NestJS)        │   │   │
│  │  └──────┬───────┘  └──────────────┘  └────────┬─────────┘   │   │
│  │         │                                      │             │   │
│  │         ▼                                      ▼             │   │
│  │  ┌──────────────┐                     ┌──────────────┐      │   │
│  │  │  PostgreSQL  │                     │    Ollama    │      │   │
│  │  │  (matrix db) │                     │   (11434)    │      │   │
│  │  └──────────────┘                     └──────────────┘      │   │
│  └─────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
```

## DSGVO-Vorteile

| Aspekt | Telegram | Matrix (Self-Hosted) |
|--------|----------|----------------------|
| Datenstandort | Dubai/Singapur | Mac Mini (Deutschland) |
| AV-Vertrag | Nicht möglich | Nicht nötig (eigene Daten) |
| E2E-Verschlüsselung | Nur Secret Chats | Standard für alle Räume |
| Metadaten | Bei Telegram | Lokal gespeichert |
| Löschung | Abhängig von Telegram | Volle Kontrolle |

---

## Phase 1: Synapse Homeserver

### 1.1 Datenbank erstellen

```bash
ssh mana-server

# Neue Datenbank für Matrix
docker exec mana-postgres psql -U postgres -c "CREATE DATABASE matrix;"
docker exec mana-postgres psql -U postgres -c "CREATE USER synapse WITH PASSWORD 'synapse-secure-password';"
docker exec mana-postgres psql -U postgres -c "GRANT ALL PRIVILEGES ON DATABASE matrix TO synapse;"
```

### 1.2 Synapse Konfiguration erstellen

```bash
# Verzeichnis erstellen
mkdir -p ~/projects/mana-monorepo/docker/matrix

# Synapse Config generieren (einmalig)
docker run -it --rm \
  -v ~/projects/mana-monorepo/docker/matrix:/data \
  -e SYNAPSE_SERVER_NAME=mana.how \
  -e SYNAPSE_REPORT_STATS=no \
  matrixdotorg/synapse:latest generate
```

### 1.3 homeserver.yaml anpassen

**Datei:** `docker/matrix/homeserver.yaml`

```yaml
server_name: "mana.how"
pid_file: /data/homeserver.pid

listeners:
  - port: 8008
    tls: false
    type: http
    x_forwarded: true
    resources:
      - names: [client, federation]
        compress: false

database:
  name: psycopg2
  args:
    user: synapse
    password: "synapse-secure-password"
    database: matrix
    host: postgres
    port: 5432
    cp_min: 5
    cp_max: 10

# Logging
log_config: "/data/mana.how.log.config"

# Media Store (lokaler Speicher für Medien)
media_store_path: /data/media_store
max_upload_size: 50M

# Registrierung
enable_registration: false
enable_registration_without_verification: false

# Admin-Account beim ersten Start erstellen
# Nach dem Start: docker exec -it synapse register_new_matrix_user -c /data/homeserver.yaml http://localhost:8008 -a

# Rate Limiting (für Bots erhöhen)
rc_message:
  per_second: 5
  burst_count: 20

rc_registration:
  per_second: 0.5
  burst_count: 5

# Für Bot-Integration: Application Services erlauben
app_service_config_files: []

# DSGVO: Datenaufbewahrung begrenzen
retention:
  enabled: true
  default_policy:
    min_lifetime: 1d
    max_lifetime: 365d
  allowed_lifetime_min: 1d
  allowed_lifetime_max: 365d
  purge_jobs:
    - longest_max_lifetime: 3d
      interval: 12h
    - shortest_max_lifetime: 365d
      interval: 1d

# Telemetrie deaktivieren
report_stats: false

# Trusted Key Server (Matrix.org)
trusted_key_servers:
  - server_name: "matrix.org"

# Signing Key
signing_key_path: "/data/mana.how.signing.key"
```

### 1.4 Docker Compose Ergänzung

Füge zu `docker-compose.macmini.yml` hinzu:

```yaml
  # ============================================
  # Matrix Synapse (Homeserver)
  # ============================================

  synapse:
    image: matrixdotorg/synapse:latest
    container_name: mana-synapse
    restart: always
    depends_on:
      postgres:
        condition: service_healthy
    environment:
      SYNAPSE_CONFIG_PATH: /data/homeserver.yaml
    volumes:
      - ./docker/matrix:/data
      - synapse_media:/data/media_store
    ports:
      - "8008:8008"
    healthcheck:
      test: ["CMD", "curl", "-fSs", "http://localhost:8008/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s

  # ============================================
  # Element Web (Matrix Client)
  # ============================================

  element-web:
    image: vectorim/element-web:latest
    container_name: mana-element
    restart: always
    depends_on:
      synapse:
        condition: service_healthy
    volumes:
      - ./docker/matrix/element-config.json:/app/config.json:ro
    ports:
      - "8087:80"
    healthcheck:
      test: ["CMD", "wget", "--no-verbose", "--tries=1", "--spider", "http://localhost:80/"]
      interval: 30s
      timeout: 10s
      retries: 3

# Volumes ergänzen:
volumes:
  synapse_media:
    name: mana-synapse-media
```

### 1.5 Element Web Konfiguration

**Datei:** `docker/matrix/element-config.json`

```json
{
  "default_server_config": {
    "m.homeserver": {
      "base_url": "https://matrix.mana.how",
      "server_name": "mana.how"
    },
    "m.identity_server": {
      "base_url": ""
    }
  },
  "brand": "Mana Chat",
  "integrations_ui_url": "",
  "integrations_rest_url": "",
  "integrations_widgets_urls": [],
  "disable_guests": true,
  "disable_3pid_login": true,
  "default_country_code": "DE",
  "show_labs_settings": false,
  "features": {
    "feature_video_rooms": true,
    "feature_group_calls": true
  },
  "room_directory": {
    "servers": ["mana.how"]
  },
  "setting_defaults": {
    "breadcrumbs": true
  },
  "default_theme": "dark"
}
```

### 1.6 Cloudflare Tunnel erweitern

**Datei:** `~/.cloudflared/config.yml`

```yaml
# Bestehende Einträge...

  - hostname: matrix.mana.how
    service: http://localhost:8008

  - hostname: element.mana.how
    service: http://localhost:8087
```

Nach Änderung:
```bash
launchctl stop com.cloudflare.cloudflared
launchctl start com.cloudflare.cloudflared
```

---

## Phase 2: Synapse starten & Admin erstellen

### 2.1 Container starten

```bash
cd ~/projects/mana-monorepo

# Nur Synapse + Element starten
docker compose -f docker-compose.macmini.yml up -d synapse element-web

# Logs prüfen
docker logs -f mana-synapse
```

### 2.2 Admin-User erstellen

```bash
# Interaktiv einen Admin erstellen
docker exec -it mana-synapse register_new_matrix_user \
  -c /data/homeserver.yaml \
  http://localhost:8008 \
  -a

# Eingeben:
# Username: admin
# Password: (sicheres Passwort)
# Admin: yes
```

### 2.3 Testen

```bash
# Health Check
curl https://matrix.mana.how/health
# Erwartete Antwort: OK

# Federation Check
curl https://matrix.mana.how/_matrix/federation/v1/version
# Erwartete Antwort: {"server":{"name":"Synapse","version":"..."}}

# Element Web aufrufen
open https://element.mana.how
```

---

## Phase 3: Bot-Räume einrichten

### 3.1 Räume erstellen (via Element)

1. **Anmelden** bei https://element.mana.how mit Admin-Account
2. **Räume erstellen:**
   - `#ollama-bot:mana.how` - AI Chat Bot
   - `#stats-bot:mana.how` - Analytics Reports
   - `#project-doc-bot:mana.how` - Projektdokumentation

### 3.2 Bot-User erstellen

```bash
# Bot-User für jeden Bot erstellen (nicht-Admin)
docker exec -it mana-synapse register_new_matrix_user \
  -c /data/homeserver.yaml \
  http://localhost:8008

# Erstelle:
# - ollama-bot (Password notieren)
# - stats-bot (Password notieren)
# - projectdoc-bot (Password notieren)
```

### 3.3 Access Tokens generieren

```bash
# Für jeden Bot ein Access Token holen
curl -X POST "https://matrix.mana.how/_matrix/client/v3/login" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "m.login.password",
    "user": "ollama-bot",
    "password": "bot-password"
  }'

# Response: {"access_token": "syt_xxx", ...}
# Token für .env speichern
```

---

## Phase 4: Bot-Migration (NestJS)

### 4.1 Neue Package-Struktur

```
services/
├── telegram-ollama-bot/     # Alt (Telegram)
├── telegram-stats-bot/      # Alt (Telegram)
├── telegram-project-doc-bot/# Alt (Telegram)
│
├── matrix-ollama-bot/       # NEU (Matrix)
├── matrix-stats-bot/        # NEU (Matrix)
└── matrix-project-doc-bot/  # NEU (Matrix)
```

### 4.2 Dependencies

```bash
cd services/matrix-ollama-bot
pnpm add matrix-bot-sdk
```

### 4.3 Bot-Grundstruktur (Beispiel: Ollama Bot)

**Datei:** `services/matrix-ollama-bot/src/bot/matrix.service.ts`

```typescript
import {
  MatrixClient,
  SimpleFsStorageProvider,
  AutojoinRoomsMixin,
  RichConsoleLogger,
  LogService,
} from 'matrix-bot-sdk';
import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class MatrixService implements OnModuleInit, OnModuleDestroy {
  private client: MatrixClient;

  constructor(private config: ConfigService) {}

  async onModuleInit() {
    LogService.setLogger(new RichConsoleLogger());

    const homeserverUrl = this.config.get('MATRIX_HOMESERVER_URL');
    const accessToken = this.config.get('MATRIX_ACCESS_TOKEN');

    const storage = new SimpleFsStorageProvider('bot-storage.json');

    this.client = new MatrixClient(homeserverUrl, accessToken, storage);

    // Auto-join bei Einladungen
    AutojoinRoomsMixin.setupOnClient(this.client);

    // Message Handler
    this.client.on('room.message', this.handleMessage.bind(this));

    await this.client.start();
    console.log('Matrix bot started!');
  }

  async onModuleDestroy() {
    await this.client.stop();
  }

  private async handleMessage(roomId: string, event: any) {
    // Eigene Nachrichten ignorieren
    if (event.sender === await this.client.getUserId()) return;

    // Nur Text-Nachrichten
    if (event.content?.msgtype !== 'm.text') return;

    const body = event.content.body;

    // Command-Handler
    if (body.startsWith('!')) {
      await this.handleCommand(roomId, event, body);
    } else {
      // Normaler Chat → Ollama
      await this.handleChat(roomId, event, body);
    }
  }

  private async handleCommand(roomId: string, event: any, body: string) {
    const [command, ...args] = body.slice(1).split(' ');

    switch (command.toLowerCase()) {
      case 'help':
        await this.sendMessage(roomId, this.getHelpText());
        break;
      case 'models':
        // Liste verfügbare Modelle
        break;
      case 'clear':
        // Chat-History löschen
        break;
      // ... weitere Commands
    }
  }

  private async handleChat(roomId: string, event: any, message: string) {
    // Typing-Indikator senden
    await this.client.setTyping(roomId, true);

    // Ollama-Anfrage (wie bisher)
    const response = await this.ollamaService.chat(message);

    await this.client.setTyping(roomId, false);
    await this.sendMessage(roomId, response);
  }

  async sendMessage(roomId: string, message: string) {
    await this.client.sendMessage(roomId, {
      msgtype: 'm.text',
      body: message,
      format: 'org.matrix.custom.html',
      formatted_body: this.markdownToHtml(message),
    });
  }

  private getHelpText(): string {
    return `**Mana Ollama Bot**

Befehle:
- \`!help\` - Diese Hilfe
- \`!models\` - Verfügbare Modelle
- \`!model <name>\` - Modell wechseln
- \`!clear\` - Chat-Verlauf löschen

Einfach eine Nachricht schreiben für AI-Chat.`;
  }
}
```

### 4.4 Environment Variables

**Datei:** `services/matrix-ollama-bot/.env`

```env
# Server
PORT=3311

# Matrix
MATRIX_HOMESERVER_URL=https://matrix.mana.how
MATRIX_ACCESS_TOKEN=syt_xxx

# Optional: Nur bestimmte Räume erlauben
MATRIX_ALLOWED_ROOMS=#ollama-bot:mana.how

# Ollama
OLLAMA_URL=http://host.docker.internal:11434
OLLAMA_MODEL=gemma3:4b
OLLAMA_TIMEOUT=120000
```

### 4.5 Docker Compose für Matrix Bots

```yaml
  # ============================================
  # Matrix Ollama Bot
  # ============================================

  matrix-ollama-bot:
    image: ghcr.io/memo-2023/matrix-ollama-bot:latest
    container_name: mana-matrix-ollama-bot
    restart: always
    depends_on:
      synapse:
        condition: service_healthy
    environment:
      NODE_ENV: production
      PORT: 3311
      MATRIX_HOMESERVER_URL: http://synapse:8008
      MATRIX_ACCESS_TOKEN: ${MATRIX_OLLAMA_BOT_TOKEN}
      OLLAMA_URL: http://host.docker.internal:11434
      OLLAMA_MODEL: gemma3:4b
    volumes:
      - matrix_ollama_bot_data:/app/data
    ports:
      - "3311:3311"
    healthcheck:
      test: ["CMD", "wget", "--no-verbose", "--tries=1", "--spider", "http://127.0.0.1:3311/health"]
      interval: 30s
      timeout: 10s
      retries: 3

# Volume ergänzen:
volumes:
  matrix_ollama_bot_data:
    name: mana-matrix-ollama-bot
```

---

## Phase 5: Feature-Mapping Telegram → Matrix

### Commands

| Telegram | Matrix | Beschreibung |
|----------|--------|--------------|
| `/start` | `!help` | Hilfe anzeigen |
| `/help` | `!help` | Hilfe anzeigen |
| `/models` | `!models` | Modelle auflisten |
| `/model x` | `!model x` | Modell wechseln |
| `/clear` | `!clear` | Chat löschen |
| `/status` | `!status` | Bot-Status |

### Media-Handling

| Feature | Telegram | Matrix |
|---------|----------|--------|
| Foto senden | `ctx.message.photo` | `m.image` msgtype |
| Voice senden | `ctx.message.voice` | `m.audio` msgtype |
| Datei senden | `ctx.message.document` | `m.file` msgtype |
| Foto antworten | `ctx.replyWithPhoto()` | `sendMessage()` mit `m.image` |

### Beispiel: Media-Download in Matrix

```typescript
async downloadMedia(event: any): Promise<Buffer> {
  const mxcUrl = event.content.url; // mxc://mana.how/abc123
  const httpUrl = this.client.mxcToHttp(mxcUrl);

  const response = await fetch(httpUrl);
  return Buffer.from(await response.arrayBuffer());
}
```

---

## Phase 6: Health Check & Monitoring

### Health Checks ergänzen

**Datei:** `scripts/mac-mini/health-check.sh`

```bash
# Matrix Synapse
if curl -sf http://localhost:8008/health > /dev/null; then
  echo "✅ Synapse: OK"
else
  echo "❌ Synapse: FAILED"
  FAILED_SERVICES="$FAILED_SERVICES synapse"
fi

# Element Web
if curl -sf http://localhost:8087/ > /dev/null; then
  echo "✅ Element Web: OK"
else
  echo "❌ Element Web: FAILED"
  FAILED_SERVICES="$FAILED_SERVICES element-web"
fi

# Matrix Ollama Bot
if curl -sf http://localhost:3311/health > /dev/null; then
  echo "✅ Matrix Ollama Bot: OK"
else
  echo "❌ Matrix Ollama Bot: FAILED"
  FAILED_SERVICES="$FAILED_SERVICES matrix-ollama-bot"
fi
```

### Prometheus Metrics (optional)

Synapse exportiert Metrics auf Port 9000 (kann aktiviert werden):

```yaml
# In homeserver.yaml ergänzen
enable_metrics: true
metrics_port: 9000

# prometheus.yml ergänzen
- job_name: 'synapse'
  static_configs:
    - targets: ['synapse:9000']
```

---

## Zeitplan

| Phase | Aufgabe | Aufwand |
|-------|---------|---------|
| **1** | Synapse + Element aufsetzen | 1-2h |
| **2** | Admin & Bot-User erstellen | 30min |
| **3** | Bot-Räume einrichten | 30min |
| **4** | Ersten Bot migrieren (Ollama) | 2-4h |
| **5** | Weitere Bots migrieren | je 1-2h |
| **6** | Monitoring & Alerts | 1h |

**Gesamt:** ~1 Tag für Grundsetup + Bot-Migration

---

## Nächste Schritte

1. [ ] `docker/matrix/` Verzeichnis erstellen
2. [ ] Synapse Config generieren
3. [ ] Docker Compose erweitern
4. [ ] Cloudflare Tunnel konfigurieren
5. [ ] Synapse starten & testen
6. [ ] Admin-Account erstellen
7. [ ] Bot-User erstellen
8. [ ] `matrix-ollama-bot` Service erstellen
9. [ ] Bot testen
10. [ ] Weitere Bots migrieren
11. [ ] Telegram Bots deaktivieren

---

## Ressourcen

- [Matrix Spec](https://spec.matrix.org/)
- [Synapse Docs](https://element-hq.github.io/synapse/latest/)
- [matrix-bot-sdk](https://github.com/turt2live/matrix-bot-sdk)
- [Element Web Config](https://github.com/element-hq/element-web/blob/develop/docs/config.md)
