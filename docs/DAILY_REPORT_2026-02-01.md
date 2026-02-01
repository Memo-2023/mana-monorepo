# Daily Report - 1. Februar 2026

**Zeitraum:** 18:00 (31. Jan) - 04:15 Uhr (1. Feb)
**Commits:** 35+
**Hauptthemen:** Voice Integration, Matrix Bot Consolidation, Node.js v25 Compatibility, Mac Mini Deployment

---

## Zusammenfassung

Eine intensive Nacht-Session mit Fokus auf **Voice-Integration** und **Bot-Infrastruktur-Konsolidierung**:

- **Voice Integration** - Vollständige Sprach-Ein-/Ausgabe für matrix-mana-bot (4 Phasen)
- **Bot Consolidation** - 19 Matrix-Bots auf gemeinsame Packages migriert (~5,500 Zeilen dedupliziert)
- **Node.js v25 Fixes** - ESM-Kompatibilität für matrix-bot-common und bot-services
- **Mac Mini Deployment** - matrix-mana-bot erfolgreich deployed und getestet
- **Matrix Media API Fix** - Authenticated Downloads für Synapse 1.98+

---

## 1. Voice Integration für matrix-mana-bot (Hauptfeature)

### Übersicht

Vollständige Integration von Spracheingabe und -ausgabe in den Gateway-Bot. Nutzer können jetzt Sprachnachrichten senden und erhalten sowohl Text- als auch Audio-Antworten.

### Phase 1: Voice Input (STT)
**Commit:** `db07b561` - feat(matrix-mana-bot): add voice input support

Implementierung der Spracheingabe via Whisper:

```typescript
// voice/voice.service.ts
async transcribe(audioBuffer: Buffer): Promise<string> {
    const response = await fetch(`${this.sttUrl}/transcribe`, {
        method: 'POST',
        body: formData,
    });
    return data.text;
}
```

**Features:**
- Audio-Download von Matrix via `downloadMedia()`
- Whisper STT-Integration (mana-stt auf Port 3020)
- Transkription wird als Nachricht angezeigt: `🎤 *"Was sind meine Aufgaben?"*`
- Transkribierter Text wird als normaler Command verarbeitet

### Phase 2: Voice Output (TTS)
**Commit:** `48dfcd18` - feat(matrix-mana-bot): add voice output/TTS support

Implementierung der Sprachausgabe via Edge TTS:

```typescript
// voice/voice.service.ts
async synthesize(text: string, voice?: string, speed?: number): Promise<Buffer> {
    const response = await fetch(`${this.voiceBotUrl}/tts`, {
        method: 'POST',
        body: JSON.stringify({ text, voice, speed }),
    });
    return Buffer.from(await response.arrayBuffer());
}
```

**Features:**
- Edge TTS Integration (mana-voice-bot auf Port 3050)
- 15 deutsche Stimmen verfügbar
- Audio-Antworten werden als m.audio Message gesendet
- Dual-Response: Text + Audio bei Voice-Anfragen

### Phase 3: Smart Voice Formatting
**Commit:** `e892e8db` - feat(matrix-mana-bot): add smart voice formatting

Intelligente Formatierung für natürliche Sprachausgabe:

```typescript
// voice/voice-formatter.service.ts
export class VoiceFormatterService {
    format(text: string): string {
        return this.applyAllFormatters(text);
    }
}
```

**Formatierungen:**
| Input | Output |
|-------|--------|
| `10:00` | "zehn Uhr" |
| `14:30` | "halb drei" |
| `15.02.` | "15. Februar" |
| `!p1` | "mit höchster Priorität" |
| `@heute` | "fällig heute" |
| `1. Item\n2. Item\n3. Item` | "Erstens Item, Zweitens Item, Drittens Item" |
| Lange Listen | "Top 3... und X weitere" |

### Phase 4: Persistent Voice Preferences
**Commit:** `462ef006` - feat(matrix-mana-bot): add persistent voice preferences

Benutzerspezifische Spracheinstellungen:

```typescript
// voice/voice-preferences.store.ts
export interface VoicePreferences {
    voice: string;        // de-DE-ConradNeural
    speed: number;        // 1.0
    autoVoiceReply: boolean;  // true
}
```

**Neue Commands:**
| Command | Beschreibung |
|---------|-------------|
| `!voice` | Aktuelle Stimme anzeigen |
| `!voice <name>` | Stimme ändern |
| `!voices` | Verfügbare Stimmen auflisten |
| `!speed 1.5` | Sprechgeschwindigkeit ändern (0.5-2.0x) |
| `!voice auto an/aus` | Auto-Reply an/aus |

**Persistenz:**
- Gespeichert in `data/voice-preferences.json`
- Debounced Save (1s Verzögerung)
- Automatische Wiederherstellung bei Neustart

---

## 2. Bot Consolidation - Shared Packages

### @manacore/matrix-bot-common
**Commit:** `145b0b65` - feat: create @manacore/matrix-bot-common shared package

Neues Package mit gemeinsamen Utilities für alle Matrix-Bots:

**Komponenten:**
| Komponente | Beschreibung |
|------------|--------------|
| `BaseMatrixService` | Abstrakte Basisklasse mit Client-Lifecycle |
| `HealthController` | Standardisierter Health-Endpoint |
| `MatrixMessageService` | Message/Reply/Reaction Helpers |
| `markdownToHtml()` | Markdown zu HTML Konvertierung |
| `KeywordCommandDetector` | Natural Language Command Detection |
| `SessionHelper<T>` | Type-safe Session Data Wrapper |
| `UserListMapper<T>` | Nummern-basiertes Referenzsystem |

**Migration:**
```typescript
// VORHER: Jeder Bot hat eigenen Code (~200 Zeilen)
@Injectable()
export class MatrixService implements OnModuleInit {
    private client: MatrixClient;
    // ... duplicate initialization code
}

// NACHHER: Extends BaseMatrixService
@Injectable()
export class MatrixService extends BaseMatrixService {
    protected handleTextMessage(roomId: string, event: MatrixRoomEvent, message: string) {
        // Nur Bot-spezifische Logik
    }
}
```

**Commits für Migration:**
- `2567ea62` - 19 Bots auf BaseMatrixService migriert (~1,500 Zeilen entfernt)
- `83f2d63f` - 19 Bots auf shared HealthController migriert (~400 Zeilen entfernt)
- `867a1a7f` - 5 Bots auf KeywordCommandDetector migriert
- `a23430f2` - 11 weitere Bots auf KeywordCommandDetector migriert

### @manacore/bot-services Consolidation
**Commit:** `9b61831c` - refactor: consolidate SessionService & TranscriptionService

Zentrale Services für alle Bots:

**SessionService:**
```typescript
// Vorher: In 11 Bots dupliziert
// Nachher: Einmal in @manacore/bot-services
@Injectable()
export class SessionService {
    async validateToken(token: string): Promise<UserSession | null>;
    async getSession(matrixUserId: string): Promise<string | null>;
}
```

**TranscriptionService:**
```typescript
// Vorher: In 6 Bots dupliziert
// Nachher: Einmal in @manacore/bot-services
@Injectable()
export class TranscriptionService {
    async transcribe(audioBuffer: Buffer): Promise<string>;
}
```

**Migrierte Bots (22 Module-Dateien gelöscht):**
- SessionService: 11 Bots
- TranscriptionService: 6 Bots
- **Code-Reduktion:** ~1,100 Zeilen

### Voice Transcription für alle Bots
**Commit:** `c29939e7` - feat: add voice transcription support to Matrix bots

13 Bots können jetzt Sprachnachrichten verarbeiten:

| Bot | Voice Support |
|-----|---------------|
| matrix-calendar-bot | Transkription → Command |
| matrix-chat-bot | Transkription → AI Chat |
| matrix-contacts-bot | Transkription → Search |
| matrix-manadeck-bot | Transkription → Command |
| matrix-ollama-bot | Transkription → AI |
| matrix-picture-bot | Transkription → Prompt |
| matrix-planta-bot | Transkription → Command |
| matrix-presi-bot | Transkription → Command |
| matrix-questions-bot | Transkription → Research |
| matrix-skilltree-bot | Transkription → XP |
| matrix-stats-bot | Transkription → Stats |
| matrix-storage-bot | Transkription → Search |
| matrix-tts-bot | Transkription → Voice |

---

## 3. Node.js v25 ESM Compatibility

### Problem

Mac Mini läuft auf Node.js v25, welches strikte ESM-Regeln hat:

```
Error [ERR_UNSUPPORTED_DIR_IMPORT]: Directory import '/app/node_modules/@manacore/matrix-bot-common/src/base' is not supported
```

### Lösung: Explizite .js Extensions
**Commits:**
- `cfaf9f2f` - fix(matrix-bot-common): use explicit ESM imports
- `12f1288a` - build(matrix-bot-common): add build step for Node.js v25
- `5b4b1282` - build(bot-services): add build step for Node.js v25

```typescript
// VORHER (funktioniert nicht in Node.js v25)
export * from './base';
export * from './health';

// NACHHER (funktioniert)
export * from './base/index.js';
export * from './health/index.js';
```

**Package.json Updates:**
```json
{
  "main": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": { "types": "./dist/index.d.ts", "default": "./dist/index.js" },
    "./base": { "types": "./dist/base/index.d.ts", "default": "./dist/base/index.js" }
  },
  "scripts": {
    "build": "tsc"
  }
}
```

---

## 4. NestJS Dependency Injection Fixes

### Problem

OrchestrationModule konnte AiService, TodoService, CalendarService nicht auflösen:

```
Error: Nest can't resolve dependencies of OrchestrationService (?, ?, ?).
Please make sure that the argument AiService at index [0] is available.
```

### Lösung: Global Modules
**Commits:**
- `2a03a7ce` - fix(matrix-mana-bot): import service modules in OrchestrationModule
- `8370005b` - fix(matrix-mana-bot): make service modules global for DI

```typescript
// app.module.ts - VORHER
imports: [
    TodoModule.registerAsync({ ... }),
    AiModule.registerAsync({ ... }),
]

// app.module.ts - NACHHER (global: true)
imports: [
    {
        ...TodoModule.registerAsync({ ... }),
        global: true,
    },
    {
        ...AiModule.registerAsync({ ... }),
        global: true,
    },
]
```

Mit `global: true` sind die Services in allen Modulen verfügbar, ohne dass jedes Modul die Service-Module importieren muss.

---

## 5. Matrix Authenticated Media API

### Problem

Synapse 1.98+ erfordert authentifizierte Media-Downloads:

```
GET /_matrix/media/r0/download/mana.how/abc123
→ 404 M_NOT_FOUND
```

### Lösung: Neue v1 API mit Bearer Token
**Commit:** `793b6d8e` - fix(matrix-bot-common): use authenticated media API for downloads

```typescript
// base-matrix.service.ts
protected async downloadMedia(mxcUrl: string): Promise<Buffer> {
    const [, serverName, mediaId] = mxcUrl.match(/^mxc:\/\/([^/]+)\/(.+)$/);

    // Neue authentifizierte API (Matrix spec v1.11+)
    const downloadUrl = `${config.homeserverUrl}/_matrix/client/v1/media/download/${serverName}/${mediaId}`;

    const response = await fetch(downloadUrl, {
        headers: {
            Authorization: `Bearer ${config.accessToken}`,
        },
    });

    if (!response.ok) {
        // Fallback zu alter API für ältere Server
        return this.client.downloadContent(mxcUrl).data;
    }

    return Buffer.from(await response.arrayBuffer());
}
```

**API-Vergleich:**
| Version | Endpoint | Auth |
|---------|----------|------|
| Alt (r0) | `/_matrix/media/r0/download/{server}/{mediaId}` | Keine |
| Neu (v1) | `/_matrix/client/v1/media/download/{server}/{mediaId}` | Bearer Token |

---

## 6. Mac Mini Deployment

### Deployment-Prozess

```bash
# 1. SSH auf Mac Mini
ssh mana-server

# 2. Repo updaten
cd ~/projects/manacore-monorepo
git pull

# 3. Packages bauen (wegen ESM)
pnpm --filter @manacore/matrix-bot-common build
pnpm --filter @manacore/bot-services build

# 4. Bot bauen
cd services/matrix-mana-bot
pnpm build

# 5. Bot starten
nohup node dist/main.js > logs.txt 2>&1 &
```

### Test-Ergebnisse

**Text-Commands:**
| Command | Status |
|---------|--------|
| `!help` | ✅ Funktioniert |
| `!todo Einkaufen` | ✅ Task erstellt |
| `!list` | ✅ Tasks angezeigt |
| AI Chat | ✅ Ollama Antwort |

**Voice-Commands:**
| Test | Status |
|------|--------|
| Audio-Download | ✅ Authenticated API |
| Whisper Transkription | ✅ 6.9s für kurze Phrase |
| AI-Verarbeitung | ✅ 82 Tokens @ 37 t/s |
| TTS-Synthese | ✅ 143KB in 1.9s |
| Audio-Reply | ✅ Gesendet |

**Logs:**
```
[MatrixService] Bot user ID: @mana-bot:mana.how
[VoiceService] STT URL: http://localhost:3020
[VoiceService] Voice Bot URL: http://localhost:3050
[AiService] Ollama connected: v0.15.1
[Bootstrap] Mana Gateway Bot running on port 3310

[MatrixService] Downloading audio from mxc://mana.how/SOEedHRtrSujwFiNLkiZvTFB
[MatrixService] Transcribing 11742 bytes
[VoiceService] Transcribed in 6923ms: "Was sind meine Aufgaben?"
[AiService] Generated 82 tokens at 37.0 t/s
[VoiceService] Synthesized 143712 bytes in 1966ms
[MatrixService] Sent audio response (143712 bytes)
```

---

## 7. Weitere Änderungen

### Docker-Compose Restructuring
**Commit:** `508ae124` - refactor: restructure docker-compose with new port schema

Neues Port-Schema gemäß ADR-003:
| Range | Kategorie |
|-------|-----------|
| 3000-3099 | Core Services & Backends |
| 4000-4099 | Matrix Stack |
| 5000-5099 | Web Frontends |
| 6000-6099 | Automation |
| 8000-8099 | Monitoring |
| 9000-9199 | Infrastructure |

### Telegram Bots entfernt
**Commit:** `a341aa1b` - remove: Telegram bots - Matrix-only strategy

6 Telegram-Bots entfernt zugunsten Matrix-only Strategie:
- Volle Kontrolle über UX
- Komplette DSGVO-Compliance
- Keine Abhängigkeit von Drittanbietern

### mana-media Service
**Commit:** `cd28a830` - feat(mana-media): add unified media processing platform

Neue Medien-Verarbeitungsplattform:
- Multi-Format Upload
- Async Transcoding via BullMQ
- Adaptive Streaming (HLS)
- S3-kompatibler Storage

### Manalink PWA
**Commit:** `5c8120f4` - feat(manalink): add PWA support and rebrand Matrix client

Matrix-Client als installierbare PWA:
- Neuer Name: "Manalink" (statt "Mana Matrix")
- Service Worker mit Workbox
- Offline-Caching
- iOS/Android Meta-Tags

### tsconfig & Vite Fixes
**Commits:**
- `0229b1c9` - fix: resolve tsconfig issues across all NestJS backends
- `03abacc8` - fix(web-apps): fix Vite type compatibility

10 NestJS-Backends und 14 Web-Apps gefixt:
- Lokale Compiler-Options statt shared-tsconfig
- Drizzle-ORM Type-Kompatibilität
- Vite @types/node Konflikte gelöst

### OAuth Token Endpoint Fix
**Commits:**
- `191c7b4c` - fix(mana-core-auth): handle form-urlencoded token requests
- `0d986478` - fix(mana-core-auth): use body-parser for urlencoded

Matrix Synapse sendet Token-Requests als `application/x-www-form-urlencoded`, aber Better Auth erwartete JSON. Fix mit body-parser Middleware.

---

## Architektur-Diagramm

### Voice Pipeline

```
┌─────────────────────────────────────────────────────────────────┐
│                     matrix-mana-bot                              │
│                                                                  │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────────┐   │
│  │ Audio Message│───>│ downloadMedia│───>│  VoiceService    │   │
│  │ (m.audio)    │    │ (v1 API+Auth)│    │  .transcribe()   │   │
│  └──────────────┘    └──────────────┘    └────────┬─────────┘   │
│                                                    │              │
│                                                    ▼              │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                  mana-stt (Whisper)                       │   │
│  │                  localhost:3020                           │   │
│  └────────────────────────────┬─────────────────────────────┘   │
│                               │                                  │
│                               ▼                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │    CommandRouter → handleTextMessage()                    │   │
│  │    "Was sind meine Aufgaben?" → AI/Todo/Calendar          │   │
│  └────────────────────────────┬─────────────────────────────┘   │
│                               │                                  │
│                               ▼                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │    VoiceFormatterService.format()                         │   │
│  │    Numbers → Words, Times → Natural Speech                │   │
│  └────────────────────────────┬─────────────────────────────┘   │
│                               │                                  │
│                               ▼                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                mana-voice-bot (Edge TTS)                  │   │
│  │                localhost:3050                             │   │
│  └────────────────────────────┬─────────────────────────────┘   │
│                               │                                  │
│                               ▼                                  │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────────┐   │
│  │ Text Reply   │    │ Audio Reply  │    │ uploadMedia()    │   │
│  │ (m.text)     │    │ (m.audio)    │<───│ Matrix Upload    │   │
│  └──────────────┘    └──────────────┘    └──────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

### Shared Packages Hierarchie

```
┌─────────────────────────────────────────────────────────────────┐
│                     19 Matrix Bots                               │
│  calendar│chat│clock│contacts│mana│manadeck│nutriphi│ollama│... │
└─────────────────────────────┬───────────────────────────────────┘
                              │
              ┌───────────────┴───────────────┐
              ▼                               ▼
┌─────────────────────────┐     ┌─────────────────────────────────┐
│ @manacore/matrix-bot-   │     │ @manacore/bot-services          │
│ common                  │     │                                 │
│                         │     │ - TodoModule                    │
│ - BaseMatrixService     │     │ - CalendarModule                │
│ - HealthController      │     │ - AiModule                      │
│ - markdownToHtml        │     │ - ClockModule                   │
│ - KeywordCommandDetector│     │ - SessionModule                 │
│ - SessionHelper         │     │ - TranscriptionModule           │
│ - UserListMapper        │     │                                 │
└─────────────────────────┘     └─────────────────────────────────┘
```

---

## Statistiken

| Metrik | Wert |
|--------|------|
| **Commits** | 35+ |
| **Neue Packages** | 2 (@manacore/matrix-bot-common, mana-media) |
| **Migrierte Bots** | 19 |
| **Entfernte Duplikate** | ~5,500 Zeilen |
| **Voice Phases** | 4 |
| **Neue Voice Commands** | 5 (!voice, !voices, !speed, !voice auto) |
| **Bearbeitete Dateien** | ~150+ |
| **Mac Mini Services** | matrix-mana-bot deployed |

---

## Bekannte Issues

1. **Whisper Latenz** - ~7s für kurze Phrasen (akzeptabel für async Messages)
2. **TTS Qualität** - Edge TTS ist gut, aber nicht perfekt für komplexe Sätze
3. **Voice Preferences** - Noch keine Migration wenn sich Voice-Namen ändern

---

## Nächste Schritte

1. **Voice für andere Bots** - TTS-Output auch für calendar-bot, todo-bot etc.
2. **Streaming TTS** - Audio chunks statt vollständiger Download
3. **Voice Wake Word** - "Hey Mana" Aktivierung
4. **Whisper Optimierung** - Batch-Processing, Caching
5. **Docker Images** - matrix-mana-bot als Docker Image bauen

---

*Bericht erstellt am 1. Februar 2026, 04:30 Uhr*
