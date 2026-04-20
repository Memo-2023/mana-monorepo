# Social Relay — Module Plan

## Status (2026-04-20)

**Ideenphase, wartet auf Spaces-Foundation.** Noch kein Code. Nach Einführung der Spaces-Primitive (siehe [`spaces-foundation.md`](./spaces-foundation.md)) wird Edisconet ein Space vom Typ `brand` — der frühere `brands/`-Modul-Vorschlag entfällt. OAuth-Token, Voice-Doc und AI-Persona hängen am Space. Dieser Plan wird nach Phase-2 der Foundation überarbeitet und präzisiert; bis dahin nur konzeptuell gültig.

---

## Ziel

Ausgewählte LinkedIn-Posts von **Howspace** (Quelle) werden auf Deutsch übersetzt, für **Edisconet** (Ziel, Company Page ID 88888092) tonal angepasst und — **nach menschlichem Review** — auf der Edisconet-Company-Page veröffentlicht. Ursprung (Howspace) bleibt im Post sichtbar.

Kernfrage: *"Welcher HS-Post lohnt sich für Edisconet, wie klingt er auf Deutsch in unserem Ton, und wie kommt er mit korrekter Attribution raus — ohne dass ich jedes Mal 20 Minuten copy-paste-übersetze?"*

**Nicht im Scope (bewusst):**
- Automatisches Scraping von LinkedIn (ToS-Verstoß, Ban-Risiko für den Company-Account)
- Vollautomatisches Posten ohne Approval (Reputationsrisiko, KI-Halluzination bei Fachbegriffen)
- Multi-Source / Multi-Target (erst HS→Edisconet, später generalisieren)
- Bild-/Video-Assets aus HS-Posts übernehmen (Copyright) — wir erzeugen eigene Visuals oder postieren Text-only

## Abgrenzung zu bestehenden Modulen

| Modul | Unterschied |
|-------|-------------|
| `mana-research` | Research extrahiert Fakten aus vielen Quellen, Social Relay transformiert *einen* spezifischen Post für Republishing |
| `mana-ai` (Mission Runner) | Wird als Execution-Layer genutzt (Queue, Retry, Cron), nicht dupliziert |
| `mana-landing-builder` | Erzeugt Landing Pages, nicht Social-Posts |
| `news-research` | RSS-Feed-Discovery für Consumer, nicht B2B-Social-Republishing |

---

## Architektur-Entscheidung: Weg 3 (Eigenbau, manueller Intake)

Gegen Scraping, gegen Fire-and-forget. Begründung:

1. **ToS-konform**: Kein Crawling fremder LinkedIn-Seiten. User pastet Post-URL oder Text manuell.
2. **Review-Gate**: Draft landet in der Mana-UI, geht erst nach Approve live. Schützt vor KI-Fehlern und falscher Tonalität.
3. **Wiederverwendung**: `mana-llm` (Übersetzung+Adaption), `mana-ai` (Queue), `mana-auth` (OAuth-Token-Storage) existieren bereits.
4. **Erweiterbar**: Später zweite Quelle (X, Bluesky, Blog-RSS) oder zweite Ziel-Page ohne Umbau.

### Komponenten-Übersicht

```
┌─────────────────────┐    paste URL/text    ┌──────────────────────┐
│ Mana Web Module     │ ───────────────────▶ │ apps/api/social-relay│
│ (social-relay/)     │                       │  Hono routes          │
└─────────────────────┘                       └──────────┬────────────┘
         ▲                                               │
         │ Draft-Review, Approve                         ▼
         │                                    ┌──────────────────────┐
         │                                    │ mana-llm             │
         │                                    │ (translate + adapt)  │
         │                                    └──────────┬────────────┘
         │                                               │
         │                                    ┌──────────▼────────────┐
         │                                    │ services/             │
         │                                    │ mana-social-relay     │  ◀── cron: daily digest?
         │                                    │ (publish queue)       │
         │                                    └──────────┬────────────┘
         │                                               │
         │ webhook: published                            ▼
         │                                    ┌──────────────────────┐
         └────────────────────────────────────│ LinkedIn UGC API     │
                                              │ (Edisconet page)     │
                                              └──────────────────────┘
```

---

## Intake: wie kommen HS-Posts rein?

Drei Wege, priorisiert:

1. **Post-URL paste** (primär): User kopiert `https://www.linkedin.com/posts/howspace_...` → Server holt OpenGraph-Meta (Titel/Beschreibung/Hero-Image URL, Post-Text oft im `og:description`) via `apps/api`-Fetch. Ausreichend für die meisten Text-Posts.
2. **Manueller Text-Paste** (Fallback): Wenn OG-Extraktion scheitert oder der Post Mehrwert im Carousel/Video hat, fügt der User den Text selbst ein. Screenshot optional als Referenz.
3. **Watchlist** (später, Phase 2): User trägt Howspace-URL ein, täglicher Cron fragt die OG-Daten der Company-Page an (oder einen HS-eigenen RSS-Feed/Newsletter, falls verfügbar) und zeigt neue Posts als **Vorschlagsliste** — kein Auto-Pull in die Queue.

Kein `puppeteer`/`playwright`-Scraping gegen linkedin.com in Phase 1.

---

## Processing: `mana-llm` Pipeline

Ein neuer Prompt-Template in `services/mana-llm/prompts/social-relay.ts`:

```ts
// Inputs: sourcePostText (EN), brandVoice ("edisconet"), sourceUrl
// Outputs: { germanPost, suggestedHashtags, attributionFooter, rationale }
```

Drei Teilschritte innerhalb *eines* LLM-Calls (günstiger als drei Calls):

1. **Übersetzung** EN → DE mit B2B-Ton
2. **Adaption**: Howspace-spezifische Referenzen (ihre Produktnamen, ihre Cases) werden generalisiert oder auf Edisconet-Kontext gemappt. Claim-Übernahmen (Statistiken, Kundennamen) werden als `[originalzitat]` markiert, nicht umformuliert.
3. **Attribution-Footer erzwingen**, Template:
   > `Inspiriert von einem Post von @Howspace: [sourceUrl]`
   Harter System-Prompt-Check + Post-Processing-Assertion: wenn der Footer fehlt, Fehler werfen, nicht stillschweigend posten.

Model: `claude-sonnet-4-6` (Qualität > Geschwindigkeit, 1–2 Posts/Tag). Temperatur niedrig (0.3) für Konsistenz. Prompt-Cache auf den Brand-Voice-Block, damit wiederholte Läufe günstig bleiben.

---

## Publishing: LinkedIn Community Management API

**Offizielle API, nicht inoffiziell.** Endpoints:

- `POST /rest/posts` — Text-Post als Organization
- OAuth 2.0, Scope `w_organization_social`
- Access-Token-Lifetime: 60 Tage, Refresh nötig

**Onboarding (einmalig):**
1. LinkedIn Developer App erstellen, Edisconet-Company-Page als Organization verifizieren
2. App-Review durchlaufen für `w_organization_social` (2–4 Wochen Bearbeitungszeit — **blockt Go-Live, früh starten**)
3. OAuth-Flow in `services/mana-auth` ergänzen: `auth/linkedin-org/callback` → speichert Token verschlüsselt in `mana_platform.linkedin_tokens` (neue pgSchema)
4. Refresh-Cron in `mana-social-relay` (alle 50 Tage)

**Kein Draft-Endpoint in der API** — LinkedIn bietet keine server-seitigen Drafts für Organizations. Unser Review-Gate läuft deshalb komplett in Mana: `status='approved'` → erst dann schlägt `publish` zu.

---

## Modul-Struktur (Frontend)

```
apps/mana/apps/web/src/lib/modules/social-relay/
├── types.ts                      # SourcePost, Draft, PublishedPost, Status
├── collections.ts                # Dexie: socialRelayDrafts
├── queries.ts                    # useDrafts, useDraft(id), usePublished
├── stores/
│   └── drafts.svelte.ts          # ingestUrl, regenerate, approve, reject, publish
├── api.ts                        # Client: /api/v1/social-relay/*
├── components/
│   ├── IngestForm.svelte         # URL-Paste + Manual-Text-Fallback
│   ├── DraftCard.svelte          # Listeneintrag (Quelle + DE-Preview + Status)
│   ├── DraftDetail.svelte        # Seitenweise Review, Edit-in-place, Regenerate-Button
│   ├── PublishButton.svelte      # approve + publish (mit Bestätigung)
│   └── HistoryView.svelte        # veröffentlichte Posts + LinkedIn-Permalinks
└── routes/
    ├── +page.svelte              # Liste aller Drafts
    └── draft/[id]/+page.svelte   # Detail + Review
```

## Backend-Routes (`apps/api`)

```
apps/api/src/modules/social-relay/routes.ts
├── POST /ingest                  # { sourceUrl | sourceText } → Draft (kein LLM-Call yet)
├── POST /drafts/:id/generate     # triggert mana-llm → schreibt germanPost in Draft
├── PATCH /drafts/:id             # User-Edits am germanPost
├── POST /drafts/:id/approve      # status='approved'
├── POST /drafts/:id/publish      # queue in mana-social-relay → LinkedIn
├── GET  /drafts                  # Liste (paginated)
└── GET  /published               # Liste veröffentlichter Posts + Permalinks
```

Auth: nur `role='founder'` (Admin). Kein Public-Tier.

## Neuer Service `services/mana-social-relay`

Analog zu `mana-ai` Mission-Runner, aber klein:

- Port (neu, in `docs/PORT_SCHEMA.md` eintragen)
- Queue (Redis) für `publish`-Jobs
- LinkedIn-API-Client + Token-Refresh-Cron
- Webhook-Dispatcher zurück an `apps/api` bei Erfolg/Fehler
- Retry mit exponential backoff (LinkedIn API kann 429en)

Alternative: **kein eigener Service**, Publishing direkt in `apps/api` mit `mana-ai`-Mission als Queue. Erspart Container + Port. Entscheidung aufschieben bis M2 — wenn die Publish-Logik unter ~100 Zeilen bleibt, gewinnt Alternative.

---

## Data Model

**Dexie (`apps/mana/apps/web/src/lib/data/database.ts`) — v27:**

```ts
socialRelayDrafts: Dexie.Table<LocalSocialRelayDraft, string>

type LocalSocialRelayDraft = {
  id: string
  sourceUrl: string              // encrypted
  sourceText: string             // encrypted (OG-extracted or manual)
  sourceAuthor: string           // "Howspace" — plaintext (brand name)
  germanPost: string             // encrypted (LLM output, user-editable)
  suggestedHashtags: string[]    // plaintext
  attributionFooter: string      // encrypted
  status: 'draft' | 'generating' | 'ready' | 'approved' | 'publishing' | 'published' | 'failed' | 'rejected'
  linkedInPostId: string | null  // plaintext, nach publish
  linkedInPermalink: string | null
  failureReason: string | null   // encrypted
  createdAt: number
  updatedAt: number
  publishedAt: number | null
}
```

Encryption-Registry-Entry in `apps/mana/apps/web/src/lib/data/crypto/registry.ts`: Felder mit `encrypted` oben.

**Postgres (`mana_platform.social_relay`):**

```sql
CREATE SCHEMA social_relay;
CREATE TABLE social_relay.drafts ( ... );           -- sync target
CREATE TABLE social_relay.linkedin_tokens (         -- OAuth-Tokens
  organization_id TEXT PRIMARY KEY,
  access_token_encrypted BYTEA NOT NULL,
  refresh_token_encrypted BYTEA NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL
);
```

Sync via `mana-sync` wie alle anderen Module; `appId='social-relay'`.

---

## Milestones

### M1 — Skelett + Intake (1–2 Tage)
- Modul registriert in `mana-apps.ts` (`tier: 'founder'`)
- Route `/social-relay`, leere Liste
- Dexie v27 + Encryption-Registry
- `POST /ingest` mit OG-Extraction (ohne LLM)
- Manuelle Text-Paste als Fallback
- Draft-Liste zeigt Quelle, noch kein generiertes Deutsch

### M2 — LLM-Pipeline (2–3 Tage)
- `services/mana-llm`: `social-relay.ts` Prompt-Template
- `POST /drafts/:id/generate`
- DraftDetail-View mit Side-by-Side EN/DE, Regenerate-Button
- Attribution-Footer-Check (Assertion im Backend)
- Edit-in-place

### M3 — LinkedIn OAuth + Publish (Dauer hängt von App-Review ab)
- LinkedIn Developer App einrichten
- **App-Review-Antrag stellen → läuft 2–4 Wochen, blockt M3** (parallel zu M1/M2 starten)
- OAuth-Flow in `mana-auth`
- `POST /drafts/:id/publish` → direkter API-Call (noch ohne Queue)
- Erfolg → Permalink in Draft, Status='published'

### M4 — Queue + Retry (1 Tag)
- Entscheidung: eigener Service vs. `mana-ai`-Mission
- Retry mit backoff
- History-View mit allen Posts + LinkedIn-Permalinks

### M5 — Watchlist / Vorschläge (optional, Phase 2)
- Howspace-Watchlist-Eintrag (URL der Company-Page)
- Täglicher Cron → OG-Scrape der öffentlichen Übersicht, Diff gegen bekannte Post-URLs
- Neue Posts als **Vorschläge** in der UI (1-Tap Ingest), kein Auto-Pull

---

## Offene Fragen

- **LinkedIn App-Review**: Wie streng ist `w_organization_social`-Approval für kleine Firmen? Erfordert u.U. eine Produkt-Demo. → Früh klären, ggf. parallel Weg-1-Workaround (Make.com + LinkedIn-Integration von Make, die eigenen OAuth-Scope mitbringt) als Übergangslösung für M3.
- **Bilder**: HS-Posts haben oft ein Hero-Image. Copyright → wir nutzen sie *nicht*. Eigenes Visual? Dann braucht M2 einen `mana-image-gen`-Hook oder manuellen Upload via `uload`. Phase-1-Entscheidung: **Text-only**, Bildoption in M5.
- **Brand Voice**: Braucht ein Edisconet-Voice-Dokument (Tonalität, Claims, verbotene Wörter) als System-Prompt-Kontext. Vor M2 zu liefern. Ablage: `services/mana-llm/prompts/voices/edisconet.md`.
- **Language-Fallback**: Was wenn HS-Post bereits Deutsch ist? → Erkennen (franc oder LLM selbst), dann nur Adaption, keine Übersetzung.
- **Eigener Service vs. inline in `apps/api`**: In M4 entscheiden.
- **Rate-Limiting**: LinkedIn erlaubt ~25 Posts/Tag/Page. Irrelevant für unseren Use-Case (1–5/Woche), aber in Queue einbauen.
- **Compliance-Footer**: Reicht "Inspiriert von" oder brauchen wir expliziteres "Basierend auf [URL]"? Rechtsmeinung bei Content-Ownership einholen, sobald M2 läuft.

---

## Zusammenfassung für "Was zuerst?"

Zwei Dinge **parallel** starten, weil LinkedIn App-Review lange dauert:

1. **Tag 1**: LinkedIn Developer App anlegen, Edisconet-Page verifizieren, App-Review beantragen.
2. **Tag 1–4**: M1 + M2 bauen (Intake + LLM-Pipeline). Ergebnis ist bereits nutzbar: Draft → Copy-to-Clipboard → manuell auf LinkedIn posten. Spart schon ~80% der Zeit gegenüber Vollmanuell.
3. **Sobald Review durch**: M3 (Auto-Publish) aktivieren.
