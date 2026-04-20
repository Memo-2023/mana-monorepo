# Broadcast / Newsletter — Module Plan

## Status (2026-04-20)

**M0 Planning** — dieser Plan. Noch kein Code.

Nächster Schritt: M1 Skelett (Modul registriert, Dexie-Table, leere ListView).

---

## Ziel

Ein Modul, mit dem der Nutzer **E-Mail-Kampagnen an Kontakte** verschickt: Newsletter, Ankündigungen, Serienmails. Kernfrage: *"Wer bekommt welche Mail wann — und wie hat sie performt?"*

Zielgruppen (in Reihenfolge der Priorität):
1. **Creator / Solo-Blogger** — periodischer Newsletter an Abonnenten, Substack-Alternative
2. **Solo-Freelancer** — Kunden-Updates, Projekt-Ankündigungen
3. **Kleine Unternehmen** — Kampagnen, Aktionen
4. **Vereine (später)** — Mitgliederinfos, Mahnungen, Einladungen (verbindet sich später mit Invoices + Events)

## Abgrenzung

**In scope (MVP):**
- Kampagnen CRUD (Entwurf → Geplant → Gesendet)
- Empfängerliste aus `contacts` via Tag/Filter-basierter Segmentierung
- Rich-Text-Editor (Tiptap) mit Basis-Formatierung, Bild-Einbettung, Link-Rewriting
- Versand über **mana-mail** mit neuem `/v1/mail/bulk-send` Endpoint
- Per-Empfänger-Tracking: `sent` / `delivered` / `bounced` / `opened` / `clicked` / `unsubscribed`
- Open-Tracking via 1×1 Pixel
- Click-Tracking via Link-Rewrite → Redirect-Endpoint
- Unsubscribe-Link (One-Click, DSGVO-konform, kein Login)
- Templates (Built-in Defaults + User-Custom)
- Basis-Statistik pro Kampagne: Öffnungsrate, Klickrate, Bounce-Rate, Unsubscribe-Rate

**Out of scope (Phase 2+):**
- A/B-Testing
- Drip-Kampagnen / Automations (später über `rituals`)
- Heatmaps / Click-Maps
- Revenue Attribution
- Behavioral Triggers
- Transaktionale Mails (die bleiben in Stalwart direkt via JMAP)
- SMS
- Shop-Integration
- Double-Opt-In-Flow (MVP: angenommen, Empfänger wurden außerhalb geworben; Phase 2 fügt DOI-Landing-Pages hinzu)

**Abgrenzung zu `mail`:**
- `mail` = 1:1-Kommunikation (wie Apple Mail / Gmail)
- `broadcast` = 1:N-Kommunikation (Newsletter, Ankündigungen, Serienmails)
- Share: beide nutzen Stalwart als Backend, aber `broadcast` braucht zusätzliche Infrastruktur (Tracking, Bulk-Orchestrierung, DSGVO-Consent-Logs)

**Abgrenzung zu `invoices`:**
- Invoices sendet 1:1 transaktionale Mails via `mailto:` (weil Stalwart aktuell keine Attachments kann)
- Broadcast sendet 1:N Marketing-/Info-Mails direkt serverseitig
- Later: Invoices könnte `broadcast` nutzen für "Rechnung an alle Mitgliedergruppe" (Vereins-Variante, Phase 3)

## Namensschema

- **Modul-/appId:** `broadcast`
- **UI-Label:** "Broadcasts" (oder "Newsletter & Broadcasts")
- **Route:** `/broadcasts`

Begründung: "Newsletter" impliziert periodisch; "Broadcast" deckt auch einmalige Ankündigungen ab. User-Copy kann trotzdem "Newsletter" sagen, wo das passender ist.

## Architektur-Entscheidungen

### Tracking-Infrastruktur: neuer Endpoint-Cluster in `mana-mail`

`mana-mail` ist der logische Ort — es besitzt schon den SMTP-Stack (Stalwart), die Auth-Integration, und eine Service-Key-basierte internal-Route.

Drei neue öffentliche (kein Auth, weil Empfänger sie anklicken) Endpoints:
- `GET /v1/mail/track/open/:token` → 1×1 transparentes GIF, loggt Open
- `GET /v1/mail/track/click/:token?url=<encoded>` → 302-Redirect zum Ziel, loggt Click
- `GET /v1/mail/track/unsubscribe/:token` → HTML-Bestätigungsseite ("bist du sicher?"), POST-Endpoint setzt Empfänger auf `unsubscribed`

Ein JWT-authed Endpoint für den Bulk-Versand:
- `POST /v1/mail/bulk-send` — nimmt Kampagnen-Payload + Empfängerliste entgegen, verarbeitet serverseitig, streamt Status-Updates zurück via SSE (oder 202-Accepted + Polling)

**Token-Design:** `{campaignId}:{recipientId}:{nonce}` signiert mit HMAC-SHA256 über einen Broadcast-spezifischen Server-Secret. Kurz (base64url, ~50 chars), stateless validierbar, nicht vorhersagbar.

### Versand-Orchestrierung: serverseitig, asynchron

mana-mail nimmt den Bulk-Auftrag entgegen, persistiert ihn als Job, arbeitet ihn im Hintergrund ab:
- Rate-Limiting (max X Mails/Minute pro User, verhindert Spam-Listings)
- Retry bei transienten Fehlern (SMTP 4xx)
- Bounce-Handling (SMTP 5xx → permanent, markiert Empfänger als `bounced`)
- Per-Empfänger Status wird zurückgemeldet (via WebSocket oder Polling auf `/v1/mail/bulk-send/:jobId/status`)

Für MVP: **synchroner Loop**. Der Nutzer wartet 30 Sekunden für 100 Empfänger — akzeptabel. Echte Async-Jobs + Retry sind Phase 2, wenn Listen wachsen.

### Client vs. Server für Tracking-Events

Tracking-Events (Open, Click, Unsubscribe) entstehen auf dem Server (Empfänger öffnen die Mail in Gmail, nicht in Mana). Sie müssen:
1. Serverseitig persistiert werden (Postgres, per-campaign + per-recipient)
2. Zum User-Client synchronisiert werden (damit das Dashboard Öffnungsraten zeigt)

Zwei Optionen:
- **A)** mana-mail schreibt in eigene Postgres-Tabelle, Webapp liest über authenticated API (`GET /v1/mail/campaigns/:id/events`)
- **B)** mana-mail pusht Events in den normalen Sync-Stream (mana-sync), Webapp bekommt sie wie alle anderen Daten

**Gewählt: Option A.** Tracking-Events sind viele (potenziell Millionen), und sie müssen nie ein anderes Client-Device beschreiben. Kein Mehrwert durch Sync-Overhead. API-Polling via liveQuery reicht.

### Rich-Text-Editor: Tiptap

Bereits im Mana-Stack anerkannt (wird im Notes-Modul schon erwogen). Alternativen verworfen:
- **Unlayer** — hochwertig aber closed-source + SaaS-License für Embed
- **Lexical** (Facebook) — React-only
- **ProseMirror direkt** — zu low-level
- **Plain Markdown + Preview** — okay für v0, aber Bilder-Einbetten wird Krampf

Tiptap 2 hat Svelte-Wrapper (`@tiptap/svelte`). Extension-basiert → wir nehmen nur was wir brauchen (Starterkit + Image + Link + Placeholder).

### HTML-Generierung & Inlining

E-Mail-HTML ≠ Web-HTML. Viele Clients (Outlook, Gmail) rendern Flexbox/Grid/CSS-Variables nicht. Wir brauchen:
1. **Inlining** — Style-Rules werden in `style=""`-Attribute aufgelöst
2. **Table-basiertes Layout** (Altlast aus Outlook-Zeiten) — für komplexe Layouts; MVP hält sich an einfache single-column
3. **Dark-Mode-Compat** — Standard-CSS bypass wird in einigen Clients ausgehebelt; zunächst light-only

Library-Wahl: **`juice`** (npm, ~20KB) für CSS-Inlining. Ausgeführt serverseitig in mana-mail beim Versand, nicht client-side — dann kann das Webapp-Bundle schlank bleiben.

### DSGVO & Compliance

**Critical Path** für EU/CH-Deploy:
1. **Einwilligung:** jeder Empfänger muss explizit zugestimmt haben. Im MVP ist das out-of-scope; User trägt die Verantwortung. Dokumentiert in Settings-Seite mit Warnung.
2. **Double-Opt-In (DOI):** Phase 2 — Landing-Page + Confirm-Mail-Flow.
3. **Unsubscribe-Link in jeder Mail:** Pflicht. Ein-Klick-Abmeldung, kein Login.
4. **List-Unsubscribe-Header** (RFC 8058): `List-Unsubscribe: <mailto:unsubscribe@…>, <https://…>` + `List-Unsubscribe-Post: List-Unsubscribe=One-Click` → Gmail/Apple-Mail-nativer Abmelden-Knopf.
5. **Consent-Audit-Log:** wann/wie kam der Kontakt auf die Liste? (Phase 2)
6. **Data-Processing-Agreement (AVV):** User-Settings-Seite erzeugt ausfüllbares PDF.
7. **Right-to-be-forgotten:** hash-basierte Dedupe + harter Delete beim Unsubscribe (nicht nur soft-delete).

MVP-Pragmatik: Punkte 1-4 sind Must-Have. 5-7 sind Phase 2.

### Deliverability

Newsletter fallen häufiger ins Spam als 1:1-Mail. Checkliste:
1. **SPF** — Stalwart hat's, User-Domain muss eintragen
2. **DKIM** — Stalwart signiert, User-Domain muss eintragen
3. **DMARC** — User-Domain braucht Policy (`p=none` anfangs reicht)
4. **Bounce-Handling** — harte Bounces → Empfänger dauerhaft ausschließen
5. **Warm-up** — erste Kampagne an ≤ 100 Empfänger, dann Ausweitung
6. **Reputation** — User-Feedback-Loop mit Gmail/Hotmail (Phase 2)

Für MVP: Settings-Onboarding zeigt SPF/DKIM/DMARC-Check mit DNS-Einträgen zum Kopieren. Wenn nicht konfiguriert, warnt der Send-Flow.

## Modul-Struktur

```
apps/mana/apps/web/src/lib/modules/broadcast/
├── types.ts                       # LocalCampaign, LocalTemplate, LocalRecipientList, LocalSendStatus
├── collections.ts                 # Dexie tables, no seed (leere Liste bei First-Run)
├── queries.ts                     # useAllCampaigns, useCampaign(id), useTemplates, useSendStats(id)
├── stores/
│   ├── campaigns.svelte.ts        # create, update, schedule, cancel, send, duplicate, delete
│   ├── templates.svelte.ts        # createTemplate, updateTemplate, deleteTemplate
│   └── settings.svelte.ts         # From-Name, Reply-To, Footer, DNS-Check-Status
├── audience/
│   ├── segment-builder.ts         # Pure: Filter-Ausdrücke parsen + auf Contacts matchen
│   └── AudienceBuilder.svelte     # UI: Tag-Chips + Feld-Filter + Preview-Liste
├── editor/
│   ├── Editor.svelte              # Tiptap-Wrapper mit Newsletter-spezifischen Extensions
│   ├── ImageUpload.svelte         # Via uload, wie bei invoices/logo
│   └── extensions/                # Tiptap-Extensions für Merge-Tags ({{vorname}}), Divider, Button
├── preview/
│   ├── DesktopPreview.svelte      # iframe mit gerendertem HTML
│   ├── MobilePreview.svelte       # iframe, schmal, mit User-Agent-Mobile-Hack
│   └── PlainTextPreview.svelte    # Pflicht-Alternative für Non-HTML-Clients
├── components/
│   ├── CampaignCard.svelte        # Listenzeile: Betreff + Status + Empfänger + Datum
│   ├── StatusBadge.svelte         # draft / scheduled / sending / sent / cancelled
│   ├── StatsPanel.svelte          # Open-Rate, Click-Rate, Bounces als Kennzahlen
│   └── DnsCheckBanner.svelte      # Warnung wenn SPF/DKIM/DMARC fehlt
├── views/
│   ├── ListView.svelte            # Kampagnen-Liste mit Status-Filter + Stats-Cards
│   ├── DetailView.svelte          # Kampagnen-Detail mit Preview + Stats
│   ├── ComposeView.svelte         # Compose: Audience → Content → Review → Send
│   └── TemplateManager.svelte     # Template-Bibliothek
├── tools.ts                       # AI-Tools
├── constants.ts                   # DEFAULT_TEMPLATES, STATUS_LABELS, TRACK_PIXEL_URL
├── module.config.ts               # appId: 'broadcast', tables: [...]
└── index.ts
```

## Daten-Schema

### Dexie-Tabellen (client, encrypted)

```typescript
export type CampaignStatus =
	| 'draft'
	| 'scheduled'   // zeitgesteuert, noch nicht versendet
	| 'sending'     // aktiv im Versand
	| 'sent'        // komplett abgeschlossen
	| 'cancelled';

export interface LocalCampaign extends BaseRecord {
	name: string;                          // encrypted — interner Arbeitstitel
	subject: string;                       // encrypted — E-Mail-Betreff
	preheader?: string | null;             // encrypted — die Zeile nach dem Betreff in Gmail-Liste
	fromName: string;                      // encrypted — "Till Ilmatar"
	fromEmail: string;                     // encrypted — muss zu verifizierter Domain gehören
	replyTo?: string | null;               // encrypted
	content: {                             // encrypted — Tiptap-JSON + generiertes HTML
		tiptap: object;                    // Roh-JSON vom Editor
		html?: string;                     // Gerenderter HTML-Output (Cache, regeneriert bei save)
		plainText?: string;                // Fallback für Non-HTML-Clients
	};
	templateId?: string | null;            // plaintext — FK zu broadcastTemplates, optional
	audience: {                            // encrypted — Segment-Definition als serialisierter AST
		filters: Array<{
			field: 'tag' | 'email' | 'custom';
			op: 'has' | 'not-has' | 'eq' | 'contains';
			value: string;
		}>;
		estimatedCount: number;            // cached, plaintext (für Listen-Preview)
	};
	scheduledAt?: string | null;           // plaintext — ISO timestamp für Scheduled-Send
	sentAt?: string | null;                // plaintext
	status: CampaignStatus;                // plaintext
	serverJobId?: string | null;           // plaintext — verknüpft mit mana-mail-Job
	stats?: {                              // plaintext — cached, wird per API aktualisiert
		totalRecipients: number;
		sent: number;
		delivered: number;
		bounced: number;
		opened: number;
		clicked: number;
		unsubscribed: number;
		lastSyncedAt: string;
	};
}

export interface LocalBroadcastTemplate extends BaseRecord {
	name: string;                          // encrypted
	description?: string | null;           // encrypted
	subject?: string | null;               // encrypted — Vorlage für Betreff
	content: { tiptap: object };           // encrypted
	isBuiltIn: boolean;                    // plaintext — built-in templates come from constants.ts
	thumbnailUrl?: string | null;          // plaintext — mana-media
}

export interface LocalBroadcastSettings extends BaseRecord {
	// Sender-Profil (Default für neue Kampagnen)
	defaultFromName: string;               // encrypted
	defaultFromEmail: string;              // encrypted
	defaultReplyTo?: string | null;        // encrypted
	defaultFooter?: string | null;         // encrypted — erscheint unter jeder Kampagne

	// DNS-Check-Status (last-checked)
	dnsCheck?: {                           // plaintext
		domain: string;
		spf: 'ok' | 'missing' | 'wrong';
		dkim: 'ok' | 'missing' | 'wrong';
		dmarc: 'ok' | 'missing' | 'wrong' | 'weak';
		checkedAt: string;
	} | null;

	// Compliance / DSGVO
	legalAddress: string;                  // encrypted — Pflicht im Footer (ImpressumsPflicht)
	unsubscribeLandingCopy?: string | null;// encrypted — Copy für Abmelde-Seite
}
```

**Per-Recipient-Status** bleibt serverseitig — siehe Backend-Schema unten. Kein Dexie-Mirror (könnte bei 10k+ Empfängern teuer werden).

### Postgres (mana-mail-seitig, neuer `broadcast` Schema)

```sql
-- Server-seitiger Spiegel einer gesendeten Kampagne (für Tracking-Events)
CREATE TABLE broadcast.campaigns (
	id TEXT PRIMARY KEY,                   -- matches LocalCampaign.id
	user_id TEXT NOT NULL,
	subject TEXT,                           -- für Audit; wird nicht re-sendet
	sent_at TIMESTAMPTZ NOT NULL,
	created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE broadcast.sends (
	id TEXT PRIMARY KEY,                   -- UUID
	campaign_id TEXT REFERENCES broadcast.campaigns(id) ON DELETE CASCADE,
	recipient_email TEXT NOT NULL,
	recipient_contact_id TEXT,             -- FK zu contacts, optional
	tracking_token TEXT NOT NULL UNIQUE,   -- für Open/Click/Unsubscribe-Links
	status TEXT NOT NULL,                  -- queued | sent | delivered | bounced | failed
	sent_at TIMESTAMPTZ,
	bounced_at TIMESTAMPTZ,
	bounce_reason TEXT
);

CREATE TABLE broadcast.events (
	id BIGSERIAL PRIMARY KEY,
	send_id TEXT REFERENCES broadcast.sends(id) ON DELETE CASCADE,
	kind TEXT NOT NULL,                    -- open | click | unsubscribe
	occurred_at TIMESTAMPTZ DEFAULT NOW(),
	ip_hash TEXT,                          -- HMAC — für Dedup, nicht PII
	user_agent_hash TEXT,                  -- HMAC — für Dedup
	link_url TEXT,                         -- nur bei kind=click
	metadata JSONB
);

CREATE INDEX ON broadcast.events (send_id, kind);
CREATE INDEX ON broadcast.events (occurred_at DESC);
```

### Encryption-Registry

```typescript
broadcastCampaigns: entry<LocalCampaign>([
	'name', 'subject', 'preheader', 'fromName', 'fromEmail', 'replyTo',
	'content', 'audience',
]),
broadcastTemplates: entry<LocalBroadcastTemplate>([
	'name', 'description', 'subject', 'content',
]),
broadcastSettings: entry<LocalBroadcastSettings>([
	'defaultFromName', 'defaultFromEmail', 'defaultReplyTo', 'defaultFooter',
	'legalAddress', 'unsubscribeLandingCopy',
]),
```

## Backend-Erweiterungen (`mana-mail`)

### Neue Routes

```
services/mana-mail/src/routes/
├── broadcast-send.ts        # POST /v1/mail/bulk-send (JWT auth)
├── broadcast-stats.ts       # GET /v1/mail/campaigns/:id/events (JWT auth)
├── broadcast-track.ts       # GET /v1/mail/track/... (PUBLIC, no auth)
└── broadcast-dns.ts         # GET /v1/mail/dns-check?domain=... (JWT auth)
```

### Neue Services

```
services/mana-mail/src/services/
├── broadcast-orchestrator.ts   # Bulk-Send-Loop mit Rate-Limiting
├── html-inliner.ts              # juice-Wrapper für inline-css
├── tracking-token.ts            # HMAC-Sign/Verify
├── bounce-handler.ts            # SMTP-Response-Parser
└── dns-check.ts                 # SPF/DKIM/DMARC-Verifier
```

### Neue Env-Vars

```
BROADCAST_TRACKING_SECRET=...        # HMAC-Secret für Tokens
BROADCAST_MAX_RECIPIENTS_PER_HOUR=500
BROADCAST_MAX_RECIPIENTS_PER_CAMPAIGN=5000
BROADCAST_UNSUBSCRIBE_LANDING_URL=https://mana.how/unsubscribe
```

## Tracking-Pipeline

### Open-Tracking (Pixel)

Beim Rendern der Mail wird vor `</body>` ein 1×1-Bild eingefügt:
```html
<img src="https://mail.mana.how/v1/mail/track/open/{token}"
     width="1" height="1" alt="" style="display:block">
```

Server-Endpoint:
- Prüft Token (HMAC), findet `send_id`
- INSERT in `broadcast.events` mit `kind='open'`, IP/UA-Hash
- Dedupe per (send_id, ip_hash, user_agent_hash, day) — sonst zählt "User öffnet 5×" als 5 Opens
- Response: 1×1 transparent GIF, `Cache-Control: no-store`

### Click-Tracking (Link-Rewrite)

Beim HTML-Rendering werden alle `<a href="X">`-Links umgeschrieben zu:
```html
<a href="https://mail.mana.how/v1/mail/track/click/{token}?url=<encoded>">
```

Server-Endpoint:
- Prüft Token, findet `send_id`
- INSERT in `broadcast.events` mit `kind='click'`, `link_url=decoded`
- 302-Redirect zum Original-URL
- Bei ungültigem Token: 302 zum Original (graceful fail — User soll nicht stehen bleiben)

**Known issue:** User, die die Mail als "als Text anzeigen" öffnen, bekommen kein Tracking. Akzeptabel.

### Unsubscribe

Zwei Pfade:
1. **Link im Mail-Footer** → GET `/track/unsubscribe/:token` → HTML-Seite mit Bestätigen-Button
2. **List-Unsubscribe-Header** → Gmail-Native → POST direkt

Beide landen im gleichen Handler: `UPDATE broadcast.sends SET status='unsubscribed' WHERE tracking_token = ?`, plus Event-Log. Bei zukünftigen Kampagnen automatisch ausgeschlossen.

## UI-Konzept

### Landing (`/broadcasts`)

- **Kennzahlen-Karten** oben: Kampagnen dieses Jahr, durchschnittliche Öffnungsrate, Unsubscribes
- **Status-Chips**: Alle | Entwurf | Geplant | Gesendet | Abgebrochen
- **Kampagnen-Liste**: Karte pro Kampagne mit Betreff + Empfänger-Count + Sent-Datum + Mini-Stats (%)
- **FAB**: "+ Neue Kampagne" → öffnet ComposeView

### Compose-Flow (4 Schritte mit Stepper)

1. **Audience** — Filter-Builder mit Live-Preview der Empfängerliste
2. **Content** — Editor mit Live-Preview (Desktop + Mobile Tabs)
3. **Preflight** — Review: Absender, Betreff, Empfänger-Count, DNS-Check, Unsubscribe-Link-Check, Spam-Score-Preview
4. **Send** — "Jetzt senden" ODER "Später senden" (Datepicker)

### DetailView

- **Header**: Betreff + Status + Sent-At + Empfänger-Count
- **Stats-Panel** (für `sent` Kampagnen): Open-Rate, Click-Rate, Bounce-Rate, Unsubscribe-Rate als Prozent-Balken
- **Preview**: iframe mit finalem HTML
- **Empfänger-Liste**: tabellarisch, filterbar (alle / bounced / unsubscribed)
- **Klick-Liste** (für Performance-Analyse): Top-geklickte Links mit Count

### Settings

- Absender-Defaults (Name, E-Mail, Reply-To)
- Legal-Address (Impressum-Pflicht)
- Default-Footer
- **DNS-Check-Widget** — klickbar "jetzt prüfen" → ruft `/v1/mail/dns-check`, zeigt SPF/DKIM/DMARC-Status mit Copy-Paste-DNS-Records

## Milestones

| Milestone | Umfang | Aufwand |
|---|---|---|
| **M1 Skelett** | Modul registriert, Dexie-Tables, leere ListView + ComposeView-Stub, Settings-Placeholder | 1 Tag |
| **M2 Audience + Editor** | AudienceBuilder (Tag-Filter), Tiptap-Editor mit Bild-Upload, Live-Count der Empfänger | 3 Tage |
| **M3 HTML-Render** | Tiptap-JSON → HTML mit Footer + Unsubscribe-Link, Desktop/Mobile-Preview, PlainText-Fallback | 2 Tage |
| **M4 Bulk-Send (synchron)** | `/v1/mail/bulk-send` in mana-mail (sync loop), Tracking-Token-Signing, HTML-Inlining via juice | 3 Tage |
| **M5 Open + Click Tracking** | Track-Endpoints, Pixel + Link-Rewrite, Postgres-Schema, Stats-API | 2 Tage |
| **M6 Unsubscribe** | Landing-Seite, List-Unsubscribe-Header, Empfänger-Exclusion bei nächster Kampagne | 1 Tag |
| **M7 Stats-Dashboard** | StatsPanel mit Raten, Empfänger-Liste filterbar, Klick-Liste | 1.5 Tage |
| **M8 DNS-Check + Settings** | DNS-Verifier, Settings-UI mit Copy-Paste-Records, Legal-Address-Pflicht | 1 Tag |
| **M9 AI-Tools** | `suggest_subject_line`, `segment_audience`, `draft_campaign_from_notes` | 1.5 Tage |
| **M10 Dashboard-Widget + Tests** | "Offene Kampagnen + YTD-Stats" als Widget, Unit-Tests für Pure-Helpers | 1 Tag |

**Summe MVP (M1–M10):** ~17 Arbeitstage → realistisch **~4 Wochen** mit Polish + Testing.

## AI-Integration

Nach M4-Basis-Versand. Tools werden in `@mana/shared-ai`'s `AI_TOOL_CATALOG` registriert:

| Tool | Policy | Beschreibung |
|------|--------|--------------|
| `create_campaign` | propose | Entwurf aus Kurzbeschreibung — Subject, Audience-Filter, Body-Grobstruktur |
| `suggest_subject_line` | auto | 5 Varianten eines Betreffs, optimiert für Öffnungsrate (kurz, aktiv, konkret) |
| `segment_audience` | auto | "Kontakte mit Tag X, aber nicht Y" — parse Natural-Language-Query zu Filter-AST |
| `draft_campaign_from_notes` | propose | Nimmt eine `note` als Input, generiert Newsletter-Outline |
| `list_campaigns` | auto | Status + Zeitraum, für Planner-Kontext |
| `get_campaign_stats` | auto | Raten für eine spezifische Kampagne |
| `schedule_campaign` | propose | Entwurf → Scheduled mit Timestamp |

**Mission-Beispiel:** *"Jeden Freitag meine Notizen der Woche zu einem Newsletter-Entwurf machen"* — auto-Call `list_notes(thisWeek)`, dann propose `draft_campaign_from_notes`.

## Offene Fragen

1. **Sender-Domain:** Mana als SaaS braucht eine eigene Versand-Domain (z.B. `mail.mana.how`). Wenn User eigene Domain (`news.kunde.ch`) nutzt, müssen wir DKIM/SPF für deren Domain co-signen — das ist Stalwart-Config-Arbeit. MVP: nur mana-Domain, DNS-Check für Custom-Domain kommt M8.

2. **Spam-Score Preview (M3 Preflight):** Nutzen wir `SpamAssassin` oder eine SaaS (Mail-Tester.com API)? SpamAssassin selbst hosten ist Wartungsaufwand. Für MVP: einfache Regex-basierte Hinweise ("Betreff ist zu lang", "zu viele Ausrufezeichen") + externe manuelle Prüfung empfehlen.

3. **Image-Hosting:** Bilder in Mails müssen von einer öffentlichen URL kommen. Nutzen wir uload wie bei invoices/logo? Dann müssen uload-URLs CDN-cached + nicht hinter Auth sein. Klären vor M2.

4. **Webhooks für Bounce-Handling:** Stalwart kann Bounce-Notifications als Webhook senden. Alternative: periodisches IMAP-Polling der `bounces@`-Mailbox. Einfacher = IMAP-Poll, robuster = Webhook.

5. **Rate-Limits:** wie viele Mails pro Stunde sind OK für unser Stalwart-Setup? Muss man mit dem Hoster (Nine/Cloudflare/…) abklären. Konservativ: 100/h pro User, 500/h global, im MVP.

6. **Zero-Knowledge-Mode:** Newsletter-Content ist by-design nicht sensitiv (geht ja an N Empfänger raus). Aber: Empfänger-Listen SIND sensitiv. Im ZK-Mode müsste der Server die Empfängerliste entschlüsseln können, um Mails zu versenden — das bricht ZK. Lösung: **Broadcast-Modul ist explizit nicht ZK-kompatibel**, warnt im Onboarding.

7. **Tiptap-Bundle-Size:** Tiptap core + Starterkit + Image + Link ≈ 100 KB gzipped. Akzeptabel. Wir lazy-laden den Editor nur in ComposeView.

8. **Empfänger aus mehreren Quellen:** Nur contacts für MVP. Phase 2: manuelle Listen (CSV-Import), Phase 3: externe Integrationen (Mailchimp-Import).

## Abhängigkeiten

- `contacts` — Empfängerlisten (vorhanden)
- `mana-mail` — muss Bulk-Send + Track-Endpoints bekommen (neue Routes)
- `mana-media` (`uload`) — für Bild-Einbettung im Editor (vorhanden)
- `rituals` — Phase 2 für wiederkehrende Kampagnen (vorhanden)
- `notes` — AI-Tool `draft_campaign_from_notes` (vorhanden)
- npm: `@tiptap/core`, `@tiptap/starter-kit`, `@tiptap/extension-image`, `@tiptap/extension-link`, `juice` (server-seitig in mana-mail)

## Erfolgs-Kriterien

- **Tag 1 nach MVP-Launch:** Till verschickt Newsletter an 5 Test-Empfänger, sieht Open-Stats im Dashboard
- **Woche 2:** 3 externe Alpha-Tester nutzen das Modul für echte Kampagnen
- **Monat 1:** Eine Kampagne mit ≥ 100 Empfängern verschickt, Open-Rate ≥ 25% (Consumer-Benchmark)
- **Monat 3:** Mission "Jeden Freitag Newsletter-Entwurf aus Notizen" läuft automatisch für mindestens einen User

## Phase 2 (nach MVP)

- Double-Opt-In mit Landing-Pages
- Consent-Audit-Log (wer hat wann zugestimmt, woher)
- A/B-Testing (zwei Subjects, 20% Test, automatischer Gewinner-Versand)
- Drip-Kampagnen via `rituals`-Integration
- Empfänger-CSV-Import
- Externe Imports (Mailchimp/Substack)
- Bounce-Webhook statt IMAP-Poll
- Custom-Domain-DKIM-Signing

## Phase 3 (Vereinsvariante)

- Mitglieder-Gruppen als Audience-Quelle (nach Paket A Rollen-/Rechtematrix)
- "Invoices + Newsletter"-Kombi: Mitgliederrechnung mit Anschreiben-Mail
- Vereinssatzungen als Anhang bei Jahresmailing
