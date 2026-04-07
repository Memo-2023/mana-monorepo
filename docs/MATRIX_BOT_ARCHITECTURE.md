# Mana Matrix Bot Architecture

**Status:** Production
**Datum:** 1. Februar 2026
**Autor:** Till Schneider
**Letzte Aktualisierung:** 1. Februar 2026

---

## Executive Summary

Mana setzt auf **Matrix** als primäre Messaging-Plattform für Bot-Interaktionen. Mit 19 spezialisierten Matrix-Bots und einem Gateway-Bot bieten wir eine vollständig dezentrale, DSGVO-konforme Alternative zu Cloud-basierten Chat-Diensten.

**Kernprinzipien:**
- **Volle Kontrolle** - Eigene Infrastruktur, eigene Daten
- **DSGVO-Konformität** - Alle Daten auf eigenen Servern
- **Unabhängigkeit** - Keine Abhängigkeit von Drittanbieter-Plattformen
- **Einheitliche UX** - Konsistente Erfahrung über alle Bots

---

## 1. Warum Matrix?

### 1.1 Die Entscheidung gegen Telegram/Discord/Slack

Bei der Wahl der Messaging-Plattform für Mana hatten wir mehrere Optionen:

| Plattform | Vorteile | Nachteile |
|-----------|----------|-----------|
| **Telegram** | Große Reichweite, einfache API | Zentral, Daten bei Telegram, keine Kontrolle über UX |
| **Discord** | Gaming-Community, Webhooks | US-basiert, DSGVO-Bedenken, Werbung |
| **Slack** | Business-Standard | Teuer, Vendor Lock-in, keine Self-Hosting Option |
| **Matrix** | Dezentral, Self-Hosted, E2E-Verschlüsselung | Kleinere Community, mehr Setup-Aufwand |

**Unsere Entscheidung:** Matrix bietet die einzige Möglichkeit, eine **vollständig unabhängige** Plattform zu betreiben mit:
- Voller Kontrolle über Nutzerdaten
- Eigener UI/UX (Element, eigene Clients)
- End-to-End-Verschlüsselung
- Federation für Inter-Server-Kommunikation

### 1.2 Matrix Grundkonzepte

```
┌─────────────────────────────────────────────────────────────────┐
│                    Matrix Ökosystem                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌─────────────────┐     ┌─────────────────┐                    │
│  │   Homeserver    │<───>│   Homeserver    │   Federation       │
│  │  (mana.how)     │     │ (matrix.org)    │                    │
│  └────────┬────────┘     └─────────────────┘                    │
│           │                                                      │
│           ▼                                                      │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │                        Räume                                 ││
│  ├─────────────────────────────────────────────────────────────┤│
│  │  !abc:mana.how      │  Bot-Interaktion (1:1)                ││
│  │  !xyz:mana.how      │  Gruppen-Chat (Multi-User)            ││
│  │  #public:mana.how   │  Öffentlicher Raum                    ││
│  └─────────────────────────────────────────────────────────────┘│
│                                                                  │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │                        Clients                               ││
│  ├─────────────────────────────────────────────────────────────┤│
│  │  Element (Web/Desktop/Mobile)                               ││
│  │  FluffyChat, Nheko, SchildiChat, ...                        ││
│  │  Mana Bots (matrix-bot-sdk)                             ││
│  └─────────────────────────────────────────────────────────────┘│
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

**Kernkonzepte:**
- **Homeserver:** Der Server, der Nutzerkonten und Räume hostet (wir nutzen Synapse)
- **Räume:** Container für Nachrichten, Events und State
- **Federation:** Server können miteinander kommunizieren
- **E2E-Verschlüsselung:** Megolm/Olm für sichere Kommunikation

---

## 2. Bot-Architektur Übersicht

### 2.1 Gesamtarchitektur

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         Mana Bot Ecosystem                           │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌──────────────────────────────────────────────────────────────────┐   │
│  │           @mana/bot-services (Shared Business Logic)          │   │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌─────────┐ │   │
│  │  │ TodoSvc  │ │ CalSvc   │ │ AiSvc    │ │ ClockSvc │ │ ...     │ │   │
│  │  └──────────┘ └──────────┘ └──────────┘ └──────────┘ └─────────┘ │   │
│  └──────────────────────────────────────────────────────────────────┘   │
│                                    │                                     │
│                                    ▼                                     │
│  ┌──────────────────────────────────────────────────────────────────┐   │
│  │                   Matrix Transport Layer                          │   │
│  │                     (matrix-bot-sdk)                              │   │
│  └──────────────────────────────────────────────────────────────────┘   │
│                                    │                                     │
│         ┌──────────────────────────┼──────────────────────────┐         │
│         ▼                          ▼                          ▼         │
│  ┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐   │
│  │  19 Matrix Bots │     │  Gateway Bot    │     │  Shared Services │   │
│  │  (Specialized)  │     │  (All-in-One)   │     │  (mana-llm, etc) │   │
│  └─────────────────┘     └─────────────────┘     └─────────────────┘   │
│                                    │                                     │
│                                    ▼                                     │
│  ┌──────────────────────────────────────────────────────────────────┐   │
│  │                     Backend APIs                                  │   │
│  │  chat │ todo │ contacts │ calendar │ clock │ picture │ ...       │   │
│  └──────────────────────────────────────────────────────────────────┘   │
│                                    │                                     │
│                                    ▼                                     │
│  ┌──────────────────────────────────────────────────────────────────┐   │
│  │                     Data Layer                                    │   │
│  │  PostgreSQL │ S3/MinIO │ JSON Files │ Redis │ Ollama             │   │
│  └──────────────────────────────────────────────────────────────────┘   │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

### 2.2 Bot-Typen

Wir unterscheiden drei Hauptkategorien von Bots:

#### Typ 1: Backend-integrierte Bots
Diese Bots fungieren als Interface zu bestehenden NestJS-Backend-APIs:

```
User → Matrix Bot → REST API → PostgreSQL
```

**Beispiele:**
- `matrix-contacts-bot` → Contacts Backend (Port 3015)
- `matrix-chat-bot` → Chat Backend (Port 3002)
- `matrix-picture-bot` → Picture Backend (Port 3006)

**Vorteile:**
- Konsistente Geschäftslogik (Web + Bot identisch)
- Zentralisierte Datenhaltung
- Einheitliche Auth via JWT

#### Typ 2: DSGVO-konforme Standalone-Bots
Diese Bots speichern Daten lokal ohne externe Services:

```
User → Matrix Bot → JSON File (lokal)
```

**Beispiele:**
- `matrix-todo-bot` → Lokale JSON-Datei
- `matrix-calendar-bot` → Lokale JSON-Datei
- `matrix-ollama-bot` → In-Memory + lokales Ollama

**Vorteile:**
- Keine Daten verlassen den Server
- Volle DSGVO-Konformität
- Offline-fähig

#### Typ 3: Gateway-Bot
Kombiniert alle Features in einem Bot:

```
User → matrix-mana-bot → @mana/bot-services → Multiple Backends
```

**Features:**
- Einheitlicher Einstiegspunkt (`!mana`)
- Intelligentes Command-Routing
- Cross-Feature-Integration (z.B. "Termin mit Kontakt erstellen")

---

## 3. Shared Package: @mana/bot-services

### 3.1 Architektur

Das Package `@mana/bot-services` stellt transport-agnostische Geschäftslogik bereit:

```typescript
// Business Logic Services
export { TodoModule, TodoService } from './todo';
export { CalendarModule, CalendarService } from './calendar';
export { AiModule, AiService } from './ai';
export { ClockModule, ClockService } from './clock';

// Infrastructure Services (NEU: Konsolidiert aus 11+ Bots)
export { SessionModule, SessionService } from './session';      // Auth via mana-auth
export { TranscriptionModule, TranscriptionService } from './transcription'; // STT via mana-stt

// Storage Provider (pluggable)
export { FileStorageProvider } from './shared/storage/file-storage.provider';
export { MemoryStorageProvider } from './shared/storage/memory-storage.provider';

// Utilities
export { generateId, getTodayISO, formatDateDE } from './shared/utils';
export { parseGermanDateKeyword } from './shared/date-parser';
```

### 3.1.1 Konsolidierte Services

Die folgenden Services wurden aus den einzelnen Bots konsolidiert:

| Service | Vorher | Nachher | Migrierte Bots |
|---------|--------|---------|----------------|
| `SessionService` | 11x dupliziert | 1x in bot-services | picture, contacts, chat, zitare, skilltree, presi, questions, storage, planta, cards, nutriphi |
| `TranscriptionService` | 6x dupliziert | 1x in bot-services | todo, clock, zitare, nutriphi, project-doc |

**Status: Vollständig migriert** - Alle 11 Bots mit SessionService und alle 5 Bots mit TranscriptionService nutzen jetzt die gemeinsamen Services aus `@mana/bot-services`.

### 3.2 TodoService

Vollständige Aufgabenverwaltung mit deutscher Sprachunterstützung:

```typescript
interface TodoService {
  // CRUD
  addTask(userId: string, text: string): Promise<Task>;
  listTasks(userId: string, filter?: TaskFilter): Promise<Task[]>;
  completeTask(userId: string, taskId: string): Promise<Task>;
  deleteTask(userId: string, taskId: string): Promise<void>;

  // Projekte
  createProject(userId: string, name: string): Promise<Project>;
  listProjects(userId: string): Promise<Project[]>;

  // Filter
  getTasksDueToday(userId: string): Promise<Task[]>;
  getTasksByPriority(userId: string, priority: Priority): Promise<Task[]>;
}

// Deutsche Eingabeverarbeitung
"Morgen Arzt anrufen #gesundheit !hoch"
→ { text: "Arzt anrufen", dueDate: tomorrow, project: "gesundheit", priority: "high" }
```

### 3.3 CalendarService

Terminverwaltung mit natürlicher Spracheingabe:

```typescript
interface CalendarService {
  // Events
  createEvent(userId: string, input: string): Promise<Event>;
  getEventsForDate(userId: string, date: Date): Promise<Event[]>;
  getEventsInRange(userId: string, start: Date, end: Date): Promise<Event[]>;

  // Kalender
  createCalendar(userId: string, name: string): Promise<Calendar>;
  listCalendars(userId: string): Promise<Calendar[]>;
}

// Natürliche Eingabe
"Meeting morgen um 14 Uhr im Büro"
→ { title: "Meeting", date: tomorrow, time: "14:00", location: "Büro" }
```

### 3.4 AiService

Integration mit lokalem LLM (Ollama) und mana-llm:

```typescript
interface AiService {
  chat(userId: string, message: string): Promise<string>;
  setModel(userId: string, model: string): Promise<void>;
  setSystemPrompt(userId: string, mode: SystemMode): Promise<void>;
  clearHistory(userId: string): Promise<void>;

  // Vision (für Bildanalyse)
  analyzeImage(userId: string, imageUrl: string, prompt: string): Promise<string>;
}

type SystemMode = 'default' | 'classify' | 'summarize' | 'translate' | 'code';
```

### 3.5 Storage Provider Pattern

Pluggable Storage für flexible Datenhaltung:

```typescript
interface StorageProvider<T> {
  get(key: string): Promise<T | null>;
  set(key: string, value: T): Promise<void>;
  delete(key: string): Promise<void>;
  list(prefix?: string): Promise<string[]>;
}

// Implementierungen
class FileStorageProvider<T> implements StorageProvider<T> {
  constructor(private basePath: string) {}
  // Speichert als JSON-Dateien
}

class MemoryStorageProvider<T> implements StorageProvider<T> {
  private store = new Map<string, T>();
  // In-Memory für Tests
}

// Zukünftig möglich:
class PostgresStorageProvider<T> implements StorageProvider<T> { }
class RedisStorageProvider<T> implements StorageProvider<T> { }
```

---

## 4. Matrix Bot Implementation

### 4.1 Technologie-Stack

Alle Matrix-Bots nutzen einen einheitlichen Stack:

| Komponente | Technologie | Version |
|------------|-------------|---------|
| **Framework** | NestJS | 10.x |
| **Matrix SDK** | matrix-bot-sdk | 0.7.1 |
| **Language** | TypeScript | 5.x |
| **Runtime** | Node.js | 20.x |
| **Build** | tsc + Docker | - |

### 4.2 Bot-Struktur

```
services/matrix-{name}-bot/
├── src/
│   ├── app.module.ts           # NestJS Root Module
│   ├── main.ts                 # Bootstrap
│   ├── matrix/
│   │   ├── matrix.module.ts    # Matrix SDK Integration
│   │   ├── matrix.service.ts   # Bot-Logik & Command-Handling
│   │   └── matrix.constants.ts # Konfiguration
│   ├── services/               # Optionale lokale Services
│   └── utils/                  # Hilfsfunktionen
├── Dockerfile
├── package.json
└── tsconfig.json
```

### 4.3 Matrix Service Pattern

```typescript
@Injectable()
export class MatrixService implements OnModuleInit, OnModuleDestroy {
  private client: MatrixClient;
  private storage: SimpleFsStorageProvider;

  async onModuleInit() {
    // Storage für Sync-State
    this.storage = new SimpleFsStorageProvider('./data/matrix-state.json');

    // Client initialisieren
    this.client = new MatrixClient(
      this.configService.get('MATRIX_HOMESERVER_URL'),
      this.configService.get('MATRIX_ACCESS_TOKEN'),
      this.storage,
    );

    // Crypto für E2E (optional)
    const cryptoStore = new RustSdkCryptoStorageProvider('./data/crypto');
    await this.client.crypto.prepare(cryptoStore);

    // Event-Handler registrieren
    this.client.on('room.message', this.handleMessage.bind(this));

    // Sync starten
    await this.client.start();
  }

  private async handleMessage(roomId: string, event: any) {
    if (event.sender === this.client.getUserId()) return;

    const body = event.content?.body;
    if (!body?.startsWith('!')) return;

    const [command, ...args] = body.slice(1).split(' ');

    switch (command.toLowerCase()) {
      case 'help':
      case 'hilfe':
        await this.sendHelp(roomId);
        break;
      case 'add':
      case 'hinzufuegen':
        await this.handleAdd(roomId, event.sender, args.join(' '));
        break;
      // ... weitere Commands
    }
  }

  private async sendMessage(roomId: string, message: string) {
    await this.client.sendMessage(roomId, {
      msgtype: 'm.text',
      body: message,
      format: 'org.matrix.custom.html',
      formatted_body: this.markdownToHtml(message),
    });
  }
}
```

### 4.4 Command-Pattern

Alle Bots nutzen ein einheitliches Command-Schema:

```
!command [args]           # Englisch
!befehl [argumente]       # Deutsch (Aliase)
```

**Beispiele:**

| Bot | Command | Alias | Beschreibung |
|-----|---------|-------|--------------|
| todo | `!add Task` | `!hinzufuegen` | Aufgabe erstellen |
| todo | `!list` | `!liste` | Aufgaben anzeigen |
| todo | `!done 1` | `!erledigt` | Aufgabe abschließen |
| calendar | `!today` | `!heute` | Termine heute |
| calendar | `!add Meeting morgen 14:00` | `!termin` | Termin erstellen |
| contacts | `!search Max` | `!suche` | Kontakt suchen |

### 4.5 Nummer-basiertes Referenzsystem

Für intuitive Interaktion nutzen Bots ein Listen-Referenz-System:

```
User: !kontakte
Bot:  1. Max Mustermann (max@example.com)
      2. Anna Schmidt (anna@example.com)
      3. Peter Meyer (peter@example.com)

User: !anrufen 2
Bot:  Anruf an Anna Schmidt wird vorbereitet...
      Telefon: +49 123 456789
```

**Implementierung:**
```typescript
// Pro User wird die letzte Liste gespeichert
private listCache = new Map<string, Contact[]>();

async handleList(roomId: string, userId: string) {
  const contacts = await this.contactsApi.list(userId);
  this.listCache.set(userId, contacts);

  const message = contacts
    .map((c, i) => `${i + 1}. ${c.name} (${c.email})`)
    .join('\n');

  await this.sendMessage(roomId, message);
}

async handleCall(roomId: string, userId: string, index: number) {
  const contacts = this.listCache.get(userId);
  if (!contacts || index < 1 || index > contacts.length) {
    return this.sendMessage(roomId, 'Ungültige Nummer');
  }

  const contact = contacts[index - 1];
  // ... Anruf-Logik
}
```

---

## 5. Bot-Katalog

### 5.1 Produktivitäts-Bots

| Bot | Port | Storage | Beschreibung |
|-----|------|---------|--------------|
| **matrix-mana-bot** | 3310 | JSON | Gateway - alle Features vereint |
| **matrix-todo-bot** | 3314 | JSON | Aufgabenverwaltung mit Projekten |
| **matrix-calendar-bot** | 3315 | JSON | Terminverwaltung mit Erinnerungen |
| **matrix-clock-bot** | 3318 | API | Timer, Alarme, Weltuhren |

### 5.2 KI & Medien-Bots

| Bot | Port | Backend | Beschreibung |
|-----|------|---------|--------------|
| **matrix-chat-bot** | 3327 | chat:3002 | KI-Konversationen |
| **matrix-ollama-bot** | 3311 | mana-llm:3025 | Lokales LLM (DSGVO) |
| **matrix-picture-bot** | 3319 | picture:3006 | AI-Bildgenerierung |
| **matrix-tts-bot** | 3023 | mana-tts:3022 | Text-to-Speech |
| **matrix-project-doc-bot** | 3313 | PostgreSQL+S3 | Projektdoku → Blog |

### 5.3 App-Integrations-Bots

| Bot | Port | Backend | Beschreibung |
|-----|------|---------|--------------|
| **matrix-contacts-bot** | 3320 | contacts:3015 | Kontaktverwaltung |
| **matrix-storage-bot** | 3323 | storage:3016 | Cloud-Speicher |
| **matrix-nutriphi-bot** | 3316 | nutriphi:3023 | Ernährungstracking |
| **matrix-zitare-bot** | 3321 | zitare:3019 | Tägliche Zitate |
| **matrix-questions-bot** | 3324 | questions:3011 | Q&A mit Web-Recherche |
| **matrix-cards-bot** | 3321 | cards:3009 | Kartendecks & Lernen |
| **matrix-planta-bot** | 3322 | planta:3022 | Pflanzenpflege |
| **matrix-skilltree-bot** | 3324 | skilltree:3024 | Skill Tree & XP |
| **matrix-presi-bot** | 3308 | presi:3008 | Präsentationen |
| **matrix-stats-bot** | 3312 | Umami | Analytics-Reports |

---

## 6. Authentifizierung

### 6.1 Zwei Auth-Modelle

Wir unterstützen zwei Authentifizierungsmodelle:

#### Modell A: Matrix User ID (DSGVO-optimiert)
Für Standalone-Bots ohne Backend-Anbindung:

```
Matrix User ID → Isolierte Daten pro User
@till:mana.how → /data/till-mana-how/todos.json
```

**Vorteile:**
- Kein Login erforderlich
- Daten strikt isoliert
- Funktioniert offline

**Verwendung:** matrix-todo-bot, matrix-calendar-bot, matrix-ollama-bot

#### Modell B: Mana Auth (JWT)
Für Backend-integrierte Bots:

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   Matrix User   │────>│   Matrix Bot    │────>│ mana-auth  │
│  !login x y     │     │                 │     │   (Port 3001)   │
└─────────────────┘     └─────────────────┘     └─────────────────┘
                              │                        │
                              │ JWT Token              │
                              ▼                        │
                        ┌─────────────────┐           │
                        │  In-Memory Map  │           │
                        │ @user → token   │           │
                        └─────────────────┘           │
                              │                        │
                              ▼                        │
                        ┌─────────────────┐           │
                        │  Backend API    │◀──────────┘
                        │  (JWT Validate) │
                        └─────────────────┘
```

**Login-Flow:**
```
User: !login till@mana.how geheimespasswort
Bot:  Login erfolgreich! Token gültig für 7 Tage.
      Nutze !logout zum Abmelden.

User: !kontakte
Bot:  [Zeigt Kontakte aus Backend]
```

**Verwendung:** matrix-contacts-bot, matrix-chat-bot, matrix-picture-bot, etc.

### 6.2 Token-Management

```typescript
@Injectable()
export class AuthService {
  private tokens = new Map<string, TokenData>();

  async login(matrixUserId: string, email: string, password: string): Promise<boolean> {
    const response = await fetch(`${this.authUrl}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) return false;

    const { accessToken, expiresIn } = await response.json();
    this.tokens.set(matrixUserId, {
      token: accessToken,
      expiresAt: Date.now() + expiresIn * 1000,
    });

    return true;
  }

  getToken(matrixUserId: string): string | null {
    const data = this.tokens.get(matrixUserId);
    if (!data || Date.now() > data.expiresAt) return null;
    return data.token;
  }

  logout(matrixUserId: string): void {
    this.tokens.delete(matrixUserId);
  }
}
```

---

## 7. Datenbank-Anbindung

### 7.1 Vier Speichermodelle

| Modell | Technologie | Bots | Use Case |
|--------|-------------|------|----------|
| **Stateless** | Keine eigene | contacts, chat, picture | Backend delegiert |
| **JSON Files** | Lokale Dateien | todo, calendar, mana-bot | DSGVO, einfach |
| **PostgreSQL** | Drizzle ORM | project-doc-bot | Komplexe Relationen |
| **S3/MinIO** | AWS SDK | project-doc-bot | Medien-Speicherung |

### 7.2 JSON File Storage (DSGVO)

```typescript
// Struktur
/data/
├── {sanitized-matrix-user-id}/
│   ├── todos.json
│   ├── calendar.json
│   └── settings.json
```

```typescript
// FileStorageProvider
class FileStorageProvider<T> {
  constructor(private basePath: string) {}

  private getPath(key: string): string {
    return path.join(this.basePath, `${key}.json`);
  }

  async get(key: string): Promise<T | null> {
    const filePath = this.getPath(key);
    if (!fs.existsSync(filePath)) return null;
    const data = await fs.promises.readFile(filePath, 'utf-8');
    return JSON.parse(data);
  }

  async set(key: string, value: T): Promise<void> {
    const filePath = this.getPath(key);
    await fs.promises.mkdir(path.dirname(filePath), { recursive: true });
    await fs.promises.writeFile(filePath, JSON.stringify(value, null, 2));
  }
}
```

### 7.3 PostgreSQL + Drizzle (Komplexe Bots)

```typescript
// schema.ts (project-doc-bot)
export const projects = pgTable('projects', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: varchar('user_id', { length: 255 }).notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  createdAt: timestamp('created_at').defaultNow(),
});

export const mediaItems = pgTable('media_items', {
  id: uuid('id').primaryKey().defaultRandom(),
  projectId: uuid('project_id').references(() => projects.id),
  type: varchar('type', { length: 50 }).notNull(), // photo, voice, text
  s3Key: varchar('s3_key', { length: 500 }),
  transcription: text('transcription'),
  createdAt: timestamp('created_at').defaultNow(),
});
```

---

## 8. Matrix-spezifische Features

### 8.1 Rich Media Support

Matrix-Bots können verschiedene Nachrichtentypen senden:

```typescript
// Text mit Markdown/HTML
await client.sendMessage(roomId, {
  msgtype: 'm.text',
  body: 'Plain text fallback',
  format: 'org.matrix.custom.html',
  formatted_body: '<b>Bold</b> and <code>code</code>',
});

// Bilder
await client.sendMessage(roomId, {
  msgtype: 'm.image',
  body: 'Generated image',
  url: await client.uploadContent(imageBuffer, 'image/png'),
  info: { w: 512, h: 512, mimetype: 'image/png' },
});

// Dateien
await client.sendMessage(roomId, {
  msgtype: 'm.file',
  body: 'report.pdf',
  url: await client.uploadContent(pdfBuffer, 'application/pdf'),
  info: { mimetype: 'application/pdf', size: pdfBuffer.length },
});

// Audio (für TTS)
await client.sendMessage(roomId, {
  msgtype: 'm.audio',
  body: 'Voice message',
  url: await client.uploadContent(audioBuffer, 'audio/mp3'),
  info: { mimetype: 'audio/mp3', duration: 5000 },
});
```

### 8.2 Reactions

Bots können auf Nachrichten reagieren:

```typescript
// Bestätigung
await client.sendEvent(roomId, 'm.reaction', {
  'm.relates_to': {
    rel_type: 'm.annotation',
    event_id: originalEventId,
    key: '✅',
  },
});

// Fehler
await client.sendEvent(roomId, 'm.reaction', {
  'm.relates_to': {
    rel_type: 'm.annotation',
    event_id: originalEventId,
    key: '❌',
  },
});
```

### 8.3 Reply Threading

```typescript
await client.sendMessage(roomId, {
  msgtype: 'm.text',
  body: '> Original message\n\nMy reply',
  format: 'org.matrix.custom.html',
  formatted_body: '<mx-reply>...</mx-reply>My reply',
  'm.relates_to': {
    'm.in_reply_to': {
      event_id: originalEventId,
    },
  },
});
```

### 8.4 End-to-End Encryption

```typescript
// Crypto Storage initialisieren
const cryptoStore = new RustSdkCryptoStorageProvider('./data/crypto');

// Client mit E2E
const client = new MatrixClient(homeserverUrl, accessToken, storage);
await client.crypto.prepare(cryptoStore);

// Verschlüsselten Raum beitreten
await client.joinRoom(encryptedRoomId);

// Nachrichten werden automatisch ver-/entschlüsselt
await client.sendMessage(encryptedRoomId, {
  msgtype: 'm.text',
  body: 'This will be encrypted',
});
```

---

## 9. Deployment

### 9.1 Docker Configuration

```dockerfile
# Dockerfile
FROM node:20-alpine AS builder

WORKDIR /app

# Workspace files
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml ./

# Shared packages
COPY packages/bot-services ./packages/bot-services

# Bot
COPY services/matrix-todo-bot ./services/matrix-todo-bot

RUN corepack enable && corepack prepare pnpm@9.15.0 --activate
RUN pnpm install --frozen-lockfile
RUN pnpm --filter @mana/bot-services build
RUN pnpm --filter matrix-todo-bot build

# Production
FROM node:20-alpine AS production

WORKDIR /app/services/matrix-todo-bot

COPY --from=builder /app/node_modules/.pnpm /app/node_modules/.pnpm
COPY --from=builder /app/services/matrix-todo-bot/node_modules ./node_modules
COPY --from=builder /app/services/matrix-todo-bot/dist ./dist
COPY --from=builder /app/services/matrix-todo-bot/package.json ./

# Data volume für persistente Speicherung
VOLUME /app/data

ENV NODE_ENV=production
EXPOSE 3314

CMD ["node", "dist/main.js"]
```

### 9.2 Environment Variables

```env
# Matrix Connection
MATRIX_HOMESERVER_URL=https://matrix.mana.how
MATRIX_ACCESS_TOKEN=syt_xxx...
MATRIX_USER_ID=@todo-bot:mana.how

# Auth (für Backend-Integration)
MANA_AUTH_URL=http://mana-auth:3001

# Storage
DATA_PATH=/app/data

# Optional: Backend URLs
TODO_BACKEND_URL=http://todo-backend:3018
CONTACTS_BACKEND_URL=http://contacts-backend:3015

# Optional: AI Services
MANA_LLM_URL=http://mana-llm:3025
```

### 9.3 docker-compose.yml

```yaml
version: '3.8'

services:
  matrix-todo-bot:
    build:
      context: .
      dockerfile: services/matrix-todo-bot/Dockerfile
    environment:
      - MATRIX_HOMESERVER_URL=${MATRIX_HOMESERVER_URL}
      - MATRIX_ACCESS_TOKEN=${MATRIX_TODO_BOT_TOKEN}
      - MATRIX_USER_ID=@todo-bot:mana.how
    volumes:
      - todo-bot-data:/app/data
    networks:
      - mana
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "wget", "-q", "--spider", "http://localhost:3314/health"]
      interval: 30s
      timeout: 10s
      retries: 3

  matrix-calendar-bot:
    # ... analog

  matrix-mana-bot:
    # Gateway mit allen Services
    depends_on:
      - mana-llm
      - todo-backend
      - contacts-backend

volumes:
  todo-bot-data:
  calendar-bot-data:
  mana-bot-data:

networks:
  mana:
    external: true
```

---

## 10. Port-Allokation

### Matrix Bots (3308-3327)

| Port | Service | Beschreibung |
|------|---------|--------------|
| 3308 | matrix-presi-bot | Präsentationen |
| 3310 | matrix-mana-bot | Gateway (All-in-One) |
| 3311 | matrix-ollama-bot | Lokales LLM |
| 3312 | matrix-stats-bot | Analytics |
| 3313 | matrix-project-doc-bot | Projektdoku |
| 3314 | matrix-todo-bot | Aufgaben |
| 3315 | matrix-calendar-bot | Termine |
| 3316 | matrix-nutriphi-bot | Ernährung |
| 3318 | matrix-clock-bot | Timer/Alarme |
| 3319 | matrix-picture-bot | Bildgenerierung |
| 3320 | matrix-contacts-bot | Kontakte |
| 3321 | matrix-zitare-bot | Zitate |
| 3322 | matrix-planta-bot | Pflanzen |
| 3323 | matrix-storage-bot | Cloud-Speicher |
| 3324 | matrix-questions-bot | Q&A |
| 3327 | matrix-chat-bot | KI-Chat |

### Supporting Services

| Port | Service | Beschreibung |
|------|---------|--------------|
| 3001 | mana-auth | Authentifizierung |
| 3020 | mana-stt | Speech-to-Text |
| 3021 | mana-search | Web-Recherche |
| 3022 | mana-tts | Text-to-Speech |
| 3025 | mana-llm | LLM-Abstraction |

---

## 11. Vorteile gegenüber Drittanbieter-Plattformen

### 11.1 Vollständige Kontrolle

| Aspekt | Telegram/Discord | Mana Matrix |
|--------|------------------|-----------------|
| **Datenhoheit** | Bei Anbieter | Bei uns |
| **Verfügbarkeit** | Abhängig von Anbieter | Eigene Infrastruktur |
| **API-Änderungen** | Anbieter entscheidet | Wir entscheiden |
| **Preisänderungen** | Anbieter entscheidet | Keine |
| **Zensur/Sperrung** | Möglich | Nicht möglich |

### 11.2 DSGVO-Konformität

```
┌────────────────────────────────────────────────────────────────┐
│                    DSGVO-Compliance                             │
├────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ✅ Datenverarbeitung nur auf eigenen Servern                  │
│  ✅ Keine Weitergabe an Dritte                                 │
│  ✅ Löschung auf Anfrage (Art. 17)                             │
│  ✅ Auskunft über gespeicherte Daten (Art. 15)                 │
│  ✅ Datenportabilität (Art. 20)                                │
│  ✅ Auftragsverarbeitungsvertrag nicht nötig                   │
│                                                                 │
└────────────────────────────────────────────────────────────────┘
```

### 11.3 Einheitliche UX

Da wir beide Seiten kontrollieren (Bot + Client), können wir:
- Konsistente Command-Syntax über alle Bots
- Deutsche Sprachunterstützung überall
- Einheitliches Fehler-Handling
- Nahtlose Cross-Bot-Integration

---

## 12. Zukünftige Entwicklung

### 12.1 Geplante Erweiterungen

- **Widget-Integration:** Interaktive UIs direkt in Element
- **Voice-Bot:** Sprachsteuerung via Matrix Calls
- **Bot-Discovery:** Automatische Bot-Erkennung in Räumen
- **Mehr @mana/bot-services:** Nutrition, Stats, Docs Services

### 12.2 Konsolidierung

Der Fokus liegt auf der Konsolidierung der Bot-Services in `@mana/bot-services`:
- Alle wiederkehrende Logik zentral
- Einheitliche Storage-Abstraction
- Transport-agnostische Services

---

## 13. Fazit

Mana's Matrix-Bot-Architektur bietet eine **vollständig unabhängige, DSGVO-konforme** Alternative zu Cloud-basierten Chat-Diensten. Mit 19 spezialisierten Bots und einem Gateway-Bot decken wir alle Produktivitäts- und App-Integrationsszenarien ab.

**Kernvorteile:**
1. **Volle Kontrolle** über Daten und Infrastruktur
2. **DSGVO-Konformität** durch lokale Datenhaltung
3. **Einheitliche UX** durch konsistente Command-Patterns
4. **Skalierbarkeit** durch Microservices-Architektur
5. **Erweiterbarkeit** durch @mana/bot-services

---

*Dokument erstellt am 1. Februar 2026*
*Letzte Aktualisierung: 1. Februar 2026*
