# ManaMail — Module Plan

## Motivation

Mana hat bereits eine vollständige Mail-Infrastruktur (Stalwart, mana-notify, DNS/DKIM/SPF), die bisher nur für Transaktionsmails genutzt wird. Ein Mail-Modul macht `@mana.how`-Adressen für jeden User möglich und schafft einen integrierten Mail-Client mit KI-Features — tief verknüpft mit Todo, Kalender, Kontakte und anderen Modulen.

## Bestehendes

| Komponente | Status | Details |
|---|---|---|
| Stalwart Mail Server | Produktiv | Rust, Container `mana-mail`, Ports 25/587/465/993/8443 |
| DNS (MX, SPF, DKIM, DMARC) | Konfiguriert | `mail.mana.how` → 194.191.241.139 |
| mana-notify | Produktiv | Go, Port 3013, SMTP-Gateway mit Retry/Queue |
| Mailpit (Dev) | Konfiguriert | Port 1025/8025 für lokale Entwicklung |
| Stalwart Admin API | Verfügbar | Account-CRUD, DKIM-Management |
| Inbound Port-Forwarding | **TODO** | Fritz!Box Ports 25/587/465 → Mac Mini |

### Stalwart JMAP-Support

Stalwart unterstützt **JMAP** (RFC 8620) nativ — ein modernes, REST-basiertes Mail-Protokoll. Vorteile gegenüber IMAP:
- JSON über HTTP (kein kompliziertes IMAP-State-Management)
- Push-Benachrichtigungen bei neuen Mails (EventSource)
- Effizientes Delta-Sync (nur Änderungen seit letztem State)
- Batch-Requests (mehrere Operationen in einem Call)
- Attachment-Upload via Blob-Store

**JMAP wird der primäre Zugriffspfad** für den mana-mail Service.

---

## Architektur

```
Browser (Mana Web)
    ↓ REST / SSE
mana-mail Service (Hono/Bun, Port 3042)
    ↓ JMAP (HTTP)        ↓ SMTP (Port 587)
    Stalwart             Stalwart
    (Lesen/Sync)         (Senden)
    ↓
Internet ← MX: mail.mana.how
```

### Warum ein eigener Service (nicht direkt JMAP vom Browser)?

1. **Credentials** — JMAP-Auth-Credentials dürfen nicht im Browser landen
2. **KI-Processing** — Zusammenfassungen, Kategorisierung laufen serverseitig
3. **Cross-Module-Linking** — Server kann Mails mit Todo/Kalender/Kontakte verknüpfen
4. **Rate-Limiting & Caching** — Server cached Thread-Listen, limitiert API-Calls
5. **Account-Provisioning** — Stalwart-Account-Erstellung bei User-Registrierung

---

## Phase 1: Fundament (MVP)

### 1.1 Service: `services/mana-mail/`

**Stack:** Hono/Bun, Drizzle ORM, PostgreSQL (`mana_platform.mail` Schema)

**Port:** 3042

```
services/mana-mail/
├── src/
│   ├── index.ts              # Bootstrap + Route-Mounting
│   ├── config.ts             # Env-Vars laden
│   ├── routes/
│   │   ├── threads.ts        # GET /threads, GET /threads/:id
│   │   ├── messages.ts       # PUT /messages/:id (read/star/archive)
│   │   ├── send.ts           # POST /send, POST /draft
│   │   ├── labels.ts         # GET /labels, POST /labels
│   │   ├── accounts.ts       # GET /accounts (user's mail accounts)
│   │   └── internal.ts       # POST /internal/on-user-created
│   ├── services/
│   │   ├── jmap-client.ts    # JMAP-Verbindung zu Stalwart
│   │   ├── mail-service.ts   # Business-Logik (Thread-Aufbau, Suche)
│   │   ├── send-service.ts   # SMTP-Senden via Stalwart
│   │   └── account-service.ts# Stalwart Account-Provisioning
│   ├── middleware/
│   │   └── jwt-auth.ts       # JWT-Validierung (wie mana-credits)
│   └── db/
│       └── schema/
│           └── mail.ts       # Drizzle Schema (pgSchema('mail'))
├── package.json
├── tsconfig.json
├── CLAUDE.md
└── Dockerfile
```

### 1.2 Datenbank-Schema (`mana_platform`, Schema `mail`)

```sql
-- User-Mailbox-Einstellungen (nicht die Mails selbst — die leben in Stalwart)
mail.accounts (
  id           UUID PK,
  user_id      TEXT NOT NULL REFERENCES auth.users(id),
  email        TEXT NOT NULL UNIQUE,        -- z.B. till@mana.how
  display_name TEXT,
  provider     TEXT DEFAULT 'stalwart',     -- Phase 2: 'gmail', 'outlook'
  is_default   BOOLEAN DEFAULT true,
  signature    TEXT,                         -- HTML-Signatur
  created_at   TIMESTAMPTZ,
  updated_at   TIMESTAMPTZ
)

-- Lokaler Label-Cache (Stalwart Labels + User-eigene)
mail.labels (
  id           UUID PK,
  account_id   UUID REFERENCES mail.accounts(id),
  stalwart_id  TEXT,                        -- JMAP mailboxId
  name         TEXT NOT NULL,
  color        TEXT,
  type         TEXT DEFAULT 'user',         -- 'system' | 'user'
  sort_order   INT DEFAULT 0
)

-- KI-generierte Metadaten pro Thread (Cache)
mail.thread_metadata (
  id           UUID PK,
  account_id   UUID REFERENCES mail.accounts(id),
  thread_id    TEXT NOT NULL,               -- JMAP threadId
  summary      TEXT,                        -- KI-Zusammenfassung
  category     TEXT,                        -- 'important'|'newsletter'|'social'|'todo'
  sentiment    TEXT,                        -- 'positive'|'neutral'|'negative'
  linked_items JSONB,                       -- [{appId, recordId}] Cross-Module-Links
  created_at   TIMESTAMPTZ,
  updated_at   TIMESTAMPTZ,
  UNIQUE(account_id, thread_id)
)
```

**Keine Mail-Inhalte in der DB** — Mails leben in Stalwart, der Service ist ein Proxy/Cache.

### 1.3 API-Endpunkte

**User-Endpoints (JWT-Auth):**

| Method | Path | Beschreibung |
|---|---|---|
| `GET` | `/api/v1/mail/threads` | Thread-Liste (paginiert, Filter nach Label/Unread) |
| `GET` | `/api/v1/mail/threads/:id` | Thread mit allen Messages |
| `PUT` | `/api/v1/mail/messages/:id` | Status ändern (read/unread, star, archive, label) |
| `POST` | `/api/v1/mail/send` | Mail senden (oder Reply) |
| `POST` | `/api/v1/mail/draft` | Entwurf speichern |
| `DELETE` | `/api/v1/mail/draft/:id` | Entwurf löschen |
| `GET` | `/api/v1/mail/labels` | Labels abrufen |
| `POST` | `/api/v1/mail/labels` | Label erstellen |
| `GET` | `/api/v1/mail/accounts` | User's Mail-Accounts |
| `PUT` | `/api/v1/mail/accounts/:id` | Account-Einstellungen (Signatur etc.) |
| `GET` | `/api/v1/mail/live` | SSE-Stream für neue Mails (JMAP EventSource) |

**Service-Endpoints (X-Service-Key):**

| Method | Path | Beschreibung |
|---|---|---|
| `POST` | `/api/v1/internal/mail/on-user-created` | Account in Stalwart anlegen |
| `POST` | `/api/v1/internal/mail/on-user-deleted` | Account in Stalwart deaktivieren |

### 1.4 JMAP-Client

```typescript
// services/mana-mail/src/services/jmap-client.ts

class JmapClient {
  constructor(private baseUrl: string, private adminToken: string) {}

  // Authentifizierung: Service nutzt Admin-Token, scoped auf User-Account
  async getThreads(accountId: string, opts: {
    limit?: number;
    position?: number;
    filter?: { inMailbox?: string; isUnread?: boolean };
    sort?: { property: string; isAscending: boolean }[];
  }): Promise<Thread[]>

  async getThread(accountId: string, threadId: string): Promise<ThreadDetail>

  async getEmails(accountId: string, emailIds: string[]): Promise<Email[]>

  async setEmailFlags(accountId: string, emailId: string, flags: {
    isRead?: boolean;
    isFlagged?: boolean;
    mailboxIds?: Record<string, boolean>;
  }): Promise<void>

  async sendEmail(accountId: string, email: {
    to: Address[]; cc?: Address[]; bcc?: Address[];
    subject: string; body: string; htmlBody?: string;
    inReplyTo?: string; references?: string[];
    attachments?: Blob[];
  }): Promise<string> // returns emailId

  async subscribe(accountId: string, onNewEmail: (email: Email) => void): EventSource
}
```

### 1.5 Account-Provisioning (bei User-Registrierung)

In `mana-auth/src/routes/auth.ts` ergänzen (fire-and-forget Pattern):

```typescript
// Nach erfolgreicher Registrierung:
fetch(`${config.manaMailUrl}/api/v1/internal/mail/on-user-created`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', 'X-Service-Key': config.serviceKey },
  body: JSON.stringify({
    userId: response.user.id,
    email: body.email,
    name: body.name,
  }),
}).catch(() => {});
```

`mana-mail` erstellt dann:
1. Stalwart-Account via Admin-API (`POST /api/principal`)
2. `mail.accounts` Eintrag in DB
3. System-Labels (Inbox, Sent, Drafts, Trash, Spam, Archive)

**Adress-Vergabe:**
- Default: `username@mana.how` (aus Auth-Username)
- Fallback bei Kollision: `username123@mana.how`
- Aliases möglich: `vorname.nachname@mana.how`

### 1.6 Frontend-Modul: `modules/mail/`

```
modules/mail/
├── module.config.ts          # appId: 'mail', tables: [mailCache, mailDrafts]
├── types.ts                  # Thread, Message, Label, MailAccount
├── collections.ts            # Dexie-Cache-Tabellen
├── queries.ts                # useThreads(), useThread(), useLabels()
├── stores/
│   ├── mail.svelte.ts        # send, reply, markRead, star, archive, moveToLabel
│   └── drafts.svelte.ts      # saveDraft, deleteDraft (local-first)
├── api.ts                    # fetchWithAuth Wrapper für mana-mail Service
├── ListView.svelte           # Inbox-Ansicht (Thread-Liste)
├── views/
│   ├── ThreadView.svelte     # Thread-Detail mit Message-Liste
│   └── ComposeView.svelte    # Neue Mail / Reply schreiben
└── index.ts
```

**Dexie-Cache (local-first für Offline):**

```
// database.ts v9
mailCache:     'id, threadId, accountId, date, isRead, isFlagged, [accountId+date]'
mailDrafts:    'id, accountId, replyToId'
```

- `mailCache` speichert die letzten ~500 Thread-Headers für Offline-Zugriff
- `mailDrafts` speichert Entwürfe lokal (wie alle Module, encrypted)
- Encryption: `title` (subject), `snippet`, `body` in mailCache; `to`, `subject`, `body` in mailDrafts

**ListView.svelte (Inbox):**
- Thread-Liste mit Absender, Betreff, Snippet, Datum, Unread-Badge
- Filter: Inbox / Sent / Drafts / Archive / Labels
- Suche über Betreff + Absender
- Pull-to-refresh / SSE für Live-Updates
- Swipe-Gesten: Links = Archivieren, Rechts = Markieren

**ThreadView.svelte (Detail):**
- Chronologische Message-Liste im Thread
- Reply/Reply-All/Forward Buttons
- Attachment-Anzeige + Download
- "Als Aufgabe erstellen" → Todo-Modul
- "Termin erstellen" → Kalender-Modul

**ComposeView.svelte (Schreiben):**
- To/Cc/Bcc mit Kontakte-Autocomplete
- Rich-Text-Editor (oder Markdown)
- Attachment-Upload via mana-media
- Signatur automatisch anhängen
- Entwurf-Auto-Save (local-first in Dexie)

---

## Phase 2: KI-Features

### 2.1 Thread-Zusammenfassungen
- Bei jedem neuen Thread: `mana-llm` oder `local-llm` erstellt Summary
- Gespeichert in `mail.thread_metadata.summary`
- Im ListView als Tooltip oder aufklappbarer Abschnitt

### 2.2 Smart Reply
- 3 Antwort-Vorschläge basierend auf Thread-Kontext
- Generiert via `mana-llm` API
- One-Click-Send oder als Basis für eigene Antwort

### 2.3 Auto-Kategorisierung
- Neue Mails werden automatisch kategorisiert: `important` / `newsletter` / `social` / `todo`
- Basis: Absender-Reputation, Betreff-Analyse, Inhalt
- User kann Kategorisierung korrigieren (→ lernt pro User)

### 2.4 Aktions-Extraktion
- KI erkennt: "Meeting am Donnerstag um 14 Uhr" → Kalender-Vorschlag
- "Bitte bis Freitag erledigen" → Todo-Vorschlag
- "Rechnung anbei" → Finance-Modul Vorschlag
- Angezeigt als Action-Chips unter der Mail

---

## Phase 3: Multi-Account

### 3.1 Externe Accounts
- Gmail via Google OAuth + Gmail API
- Outlook via Microsoft OAuth + Microsoft Graph
- Generisches IMAP/SMTP für andere Provider

### 3.2 Unified Inbox
- Alle Accounts in einer Thread-Liste
- Account-Badge pro Thread (welcher Account)
- Antwort automatisch vom richtigen Account

---

## Phase 4: Erweitert

### 4.1 Scheduling
- "Später senden" (Mail in Queue mit Zeitstempel)
- "Erinnere mich" (Snooze — Mail verschwindet und taucht zu Zeitpunkt wieder auf)

### 4.2 Templates
- Häufige Antworten als wiederverwendbare Templates
- Variablen-Platzhalter: `{{name}}`, `{{datum}}`

### 4.3 Mail-Regeln
- Automatische Label-Zuweisung basierend auf Absender/Betreff
- Auto-Forward, Auto-Archive
- Integration mit `automations` Modul

---

## Infrastruktur-Voraussetzungen

### Sofort nötig (vor Phase 1)
- [ ] Fritz!Box Port-Forwarding: 25, 587, 465 → Mac Mini (192.168.178.131)
- [ ] Stalwart JMAP-Port (8080 intern) im Docker-Netzwerk verfügbar machen
- [ ] Port 3042 in `PORT_SCHEMA.md` reservieren
- [ ] `MANA_MAIL_URL` zu `.env.development` hinzufügen

### Docker-Compose Erweiterung
```yaml
mana-mail:
  build: ./services/mana-mail
  container_name: mana-mail-service
  ports:
    - "3042:3042"
  environment:
    PORT: 3042
    DATABASE_URL: postgresql://mana:${DB_PASSWORD}@postgres:5432/mana_platform
    MANA_AUTH_URL: http://mana-auth:3001
    MANA_SERVICE_KEY: ${MANA_SERVICE_KEY}
    STALWART_JMAP_URL: http://mana-mail:8080
    STALWART_ADMIN_USER: admin
    STALWART_ADMIN_PASSWORD: ${STALWART_ADMIN_PASSWORD}
    CORS_ORIGINS: http://localhost:5173,https://mana.how
  depends_on:
    - postgres
    - mana-mail  # Stalwart container
  networks:
    - mana-network
```

---

## Cross-Module-Integration

| Aktion | Source | Target | Mechanismus |
|---|---|---|---|
| Mail → Aufgabe | mail | todo | `manaLinks` + `tasksStore.createTask()` |
| Mail → Termin | mail | calendar | `manaLinks` + Datums-Extraktion |
| Mail → Kontakt | mail | contacts | Absender-Matching / Auto-Create |
| Mail → Notiz | mail | notes | Inhalt kopieren + `manaLinks` |
| Mail → Datei | mail | storage | Attachment in MinIO ablegen |
| Mail → Rechnung | mail | finance | KI-Erkennung "Rechnung" |
| Kontakt → Mail | contacts | mail | "E-Mail senden" Button |
| Todo → Mail | todo | mail | "Per Mail teilen" |

---

## Implementierungs-Reihenfolge

1. **Infra**: Port-Forwarding, JMAP-Port, Port reservieren
2. **Service**: `mana-mail` scaffolden (Hono/Bun, Config, Health)
3. **JMAP-Client**: Stalwart-Verbindung, Thread/Email-Queries
4. **Account-Provisioning**: on-user-created Hook in mana-auth
5. **API**: Thread-Liste, Thread-Detail, Send, Draft
6. **Frontend**: Modul-Gerüst (types, collections, queries, stores)
7. **ListView**: Inbox-UI mit Thread-Liste
8. **ThreadView**: Detail-Ansicht mit Messages
9. **ComposeView**: Schreiben/Reply mit Kontakte-Autocomplete
10. **SSE**: Live-Updates für neue Mails
11. **KI Phase 2**: Zusammenfassungen, Smart Reply, Kategorisierung
12. **Multi-Account Phase 3**: Gmail/Outlook OAuth
