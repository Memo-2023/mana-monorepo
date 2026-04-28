# Forms — Module Plan

## Status (2026-04-28)

**Noch nicht begonnen.** Plan-Dokument; Modul existiert nicht im Repo. Lücke explizit dokumentiert in [`docs/reports/clubdesk-vs-mana-comparison.md:106`](../reports/clubdesk-vs-mana-comparison.md): *"Quiz-Builder vorhanden; kein dediziertes Formular-/Anmelde-System."*

---

## Ziel

Ein Modul `forms`, in dem der Nutzer **eigene Formulare** baut und Antworten sammelt. Kernfrage: *"Wie kriege ich strukturierte Eingaben von anderen Menschen in mein Mana?"*

Use-Cases:

- Vereins-Anmeldung (löst die ClubDesk-Lücke)
- Event-Registrierung mit benutzerdefinierten Feldern (über `mana-events` Share-Links hinaus)
- Lead-Capture auf einer Website (Block in `website`)
- Wöchentliche Mood-/Pulse-Checks ans Team via `broadcasts`
- Persönliche Intake-Formulare (Onboarding-Fragebogen für Coaches/Therapeut:innen)
- "Wishlist"-Formular an Freunde (Geburtstags-Geschenkideen abfragen)
- RSVP-mit-Meta ("Kommst du? Was bringst du mit? Allergien?")

Nicht im Scope:

- **Quizze** — bleibt in `quiz` (Score-Semantik richtig/falsch, Play-Mode, kein Antwort-Sammeln)
- **Self-Surveys** an sich selbst — gehört in `journal` / `augur` / `habits`
- **Voting / Polls mit Live-Ergebnis-Anzeige** — eigenes Pattern, ggf. später als `polls`-Modul
- **Konversationelle Bots** — `mana-persona-runner` ist die Heimat dafür; Forms kann allerdings als *Form-as-Conversation* serviert werden (siehe Killer-Feature 4)

## Abgrenzung

- **Nicht `quiz`**: Score-frei. Ein Form-Eintrag hat keine "richtige" Antwort. Trotzdem teilen sich beide Module die Frage-Schema-Engine (siehe Architektur).
- **Nicht `feedback`**: `feedback` ist *zentral* der öffentliche Mana-Feedback-Hub (1 Hub für alle User). `forms` ist *n-zu-1 pro User/Space* — jeder User kann beliebig viele Formulare anlegen.
- **Nicht `website`**: `website` ist Block-Tree CMS für Public-Sites. `forms` ist die Form-Domain — wird in `website` als **Block** gerendert (analog wie `events` als Listing-Block).
- **Nicht `events`**: Events sind Termine. Forms sind Eingabe-Schemas. Ein Event *kann* ein Form als RSVP-Hook haben (1:1-Bindung), aber das Form-Modul kennt Events nicht direkt — das Event-Modul referenziert den Form.
- **Nicht `broadcasts`**: Broadcasts ist Distribution. Forms ist Capture. Ein Broadcast kann ein Form-Link enthalten; bei wiederkehrenden Forms (Killer-Feature 5) sendet `broadcasts` den Link periodisch.

## Architektur-Entscheidung

### Eigenes Modul, geteilte Schema-Engine mit `quiz`

- Eigenes Modul `forms` mit eigenem Launcher-Eintrag, eigener Route, eigener Encryption-Registry-Zeile.
- **Frage-Schema-Engine (Field-Types, Validation, Branching) wird in ein neues Shared-Package `@mana/shared-form-schema` extrahiert** — `quiz` und `forms` nutzen es. Mache das in M1 in zwei Schritten: zuerst `forms` baut die Engine inline; sobald sie stabil ist, extrahieren und `quiz` darauf migrieren (separate Lieferung, nicht in diesem Plan).
- **Eine Tabelle pro Belang**: `forms` (das Schema) und `formResponses` (die eingereichten Antworten). Kein gemeinsames JSON.

Begründung: Quiz und Forms haben *fundamental unterschiedliche* Lifecycle-Semantik (Quiz hat `quizAttempts` mit `correct`-Flag, Forms hat `formResponses` ohne Bewertung). Aber die Frage-Definition (Single-Choice, Multi-Choice, Long-Text, Required, etc.) ist identisch. Schema-Sharing reduziert Duplikate; Tabellen-Trennung hält Semantik sauber.

### Eine Public-Render-Pipeline für alle "Public Capture" Modi

Mana hat schon das **Visibility + Unlisted-Sharing System** (`@mana/shared-privacy`). Public-Form-Submission läuft darüber:
- `forms.visibility = 'unlisted'` mit Token → `/forms/<token>` öffentlich erreichbar
- Antwort-Submit geht über `mana-api` `/api/v1/forms/public/<token>/submit` (dem unlisted-System analog)
- Kein neuer Auth-Flow; Public-Submitter müssen *nicht* eingeloggt sein

## Modul-Struktur

```
apps/mana/apps/web/src/lib/modules/forms/
├── types.ts                    # LocalForm, Form, FormField, FormResponse, FieldType, BranchingRule
├── collections.ts              # forms + formResponses Dexie-Tables + Welcome-Seed (1 Beispiel-Form pro Space)
├── queries.ts                  # useAllForms, useForm(id), useResponses(formId), useResponseStats(formId)
├── stores/
│   ├── forms.svelte.ts         # createForm, updateForm, addField, reorderFields, setVisibility, regenerateToken
│   └── responses.svelte.ts     # submitResponse, deleteResponse, exportCsv
├── components/
│   ├── FieldEditor.svelte      # Drag-reorder, type-switch, required toggle, options editor
│   ├── FieldRenderer.svelte    # Public-side: rendert ein Feld als Input
│   ├── FieldPalette.svelte     # "Feld hinzufügen"-Picker
│   ├── BranchingEditor.svelte  # "Wenn Feld X = Y, zeige Feld Z"
│   ├── ResponsePreview.svelte  # Tabellen-Zeile pro Antwort, Klick → Detail
│   ├── ResponseDetailModal.svelte
│   └── FormBlock.svelte        # Embed-Komponente für website-builder
├── views/
│   ├── ListView.svelte         # Form-Übersicht (Karten mit Antwort-Count)
│   ├── BuilderView.svelte      # Form-Editor (Felder + Settings + Logik)
│   ├── ResponsesView.svelte    # Antwort-Tabelle mit CSV-Export
│   ├── PublicFormView.svelte   # Public-Submit-UI (rendert die definierten Felder)
│   └── SettingsView.svelte     # Form-Level Settings (Anonymität, ZK, Auto-Sync-Targets)
├── tools.ts                    # AI-Tools (siehe AI-Integration)
├── lib/
│   ├── validation.ts           # Field-Type-Validation pro Type
│   ├── branching.ts            # Conditional-Logic-Resolver
│   └── csv.ts                  # CSV-Export pure
├── module.config.ts            # { appId: 'forms', tables: [{ name: 'forms' }, { name: 'formResponses' }] }
└── index.ts
```

## Daten-Schema

### `LocalForm` (Dexie)

```typescript
export type FieldType =
  | 'short_text'
  | 'long_text'
  | 'single_choice'
  | 'multi_choice'
  | 'number'
  | 'date'
  | 'email'
  | 'yes_no'
  | 'rating'        // 1-5 oder 1-10
  | 'section'       // visueller Trenner, kein Input
  | 'consent';      // Pflicht-Häkchen mit Text (DSGVO)

export interface FormField {
  id: string;                         // stabile UUID, von der UI generiert
  type: FieldType;
  label: string;
  helpText?: string;
  required: boolean;
  options?: { id: string; label: string }[]; // single/multi
  config?: {
    minLength?: number;
    maxLength?: number;
    min?: number;
    max?: number;
    ratingScale?: 5 | 10;
  };
}

export interface BranchingRule {
  id: string;
  ifFieldId: string;
  ifOperator: 'equals' | 'not_equals' | 'contains' | 'is_empty';
  ifValue?: string | string[];
  thenAction: 'show' | 'hide' | 'skip_to';
  thenFieldIds?: string[];
  thenSkipToFieldId?: string;
}

export interface LocalForm extends BaseRecord {
  title: string;
  description: string | null;
  fields: FormField[];                // ≤ 100 (soft-cap)
  branching: BranchingRule[];
  status: 'draft' | 'published' | 'closed';
  settings: {
    submitButtonLabel: string;
    successMessage: string;
    allowMultipleSubmissions: boolean;
    requireEmail: boolean;
    anonymous: boolean;               // wenn true: keine Submitter-Meta gespeichert
    zkMode: boolean;                  // wenn true: per-Form-Key, Owner sieht nur Aggregate
    closedAt?: string;
    responseLimit?: number;
    autoSync?: {
      target: 'contacts' | 'events' | 'feedback' | 'library' | 'space_member';
      mapping: Record<string, string>; // formFieldId → targetField
    };
  };
  responseCount: number;              // Denormalized counter
  visibility?: VisibilityLevel;
  visibilityChangedAt?: string;
  visibilityChangedBy?: string;
  unlistedToken?: string;
  unlistedExpiresAt?: string;
}

export interface LocalFormResponse extends BaseRecord {
  formId: string;
  submittedAt: string;
  answers: Record<string, string | string[] | number | boolean | null>; // fieldId → value
  submitterEmail?: string;            // optional, encrypted
  submitterName?: string;             // optional, encrypted
  submitterMeta?: {                   // encrypted blob
    userAgent?: string;
    referrer?: string;
    ipHash?: string;                  // server-side gehasht, nie raw IP
  };
  status: 'new' | 'reviewed' | 'archived' | 'spam';
  syncedTargets?: { target: string; recordId: string }[]; // wenn autoSync angewandt
}
```

### Encryption-Registry (`crypto/registry.ts`)

```typescript
forms: {
  encrypt: ['title', 'description', 'fields', 'branching', 'settings'],
  plaintext: ['status', 'responseCount', 'visibility', 'visibilityChangedAt',
              'visibilityChangedBy', 'unlistedToken', 'unlistedExpiresAt',
              'createdAt', 'updatedAt', 'spaceId', 'id'],
},
formResponses: {
  encrypt: ['answers', 'submitterEmail', 'submitterName', 'submitterMeta'],
  plaintext: ['formId', 'submittedAt', 'status', 'syncedTargets',
              'createdAt', 'updatedAt', 'spaceId', 'id'],
},
```

`submittedAt` bleibt plaintext (Sortier-Key); `syncedTargets` plaintext, weil es Cross-Module-IDs ohne PII enthält.

## AI-Integration

### Tools im `AI_TOOL_CATALOG`

| Tool | Mode | Zweck |
|---|---|---|
| `forms_create` | propose | Neues Form aus Prompt — Felder werden generiert, User reviewed |
| `forms_add_field` | propose | Einzelnes Feld einfügen (z.B. "füge ein Allergien-Feld hinzu") |
| `forms_publish` | propose | draft → published, generiert unlisted-Token |
| `forms_close` | propose | published → closed (keine neuen Antworten) |
| `forms_list` | auto | Forms eines Spaces auflisten (nur Metadaten) |
| `forms_get_responses` | auto | Antworten als Aggregat (counts, top-values pro Feld) |
| `forms_summarize_responses` | auto | LLM clustert offene Text-Antworten + zieht Themes (analog Augur Living-Oracle) |

### Mission-Runner-Integration

Forms ist ein **prime candidate für Mission-Runner**: "Bau mir bis Donnerstag ein Form für Vereins-Anmeldung mit Pflichtfeldern X, Y, Z, schicke den Link an die Adressliste-A, und melde mir am Sonntag die Antworten." → Mission spannt forms_create + broadcasts_send + (in 5 Tagen) forms_summarize_responses.

## Sync

- `forms` und `formResponses` syncen über die unified `mana-sync`-Engine wie alle anderen Tabellen — pro `appId='forms'` gegruppiert.
- **Public-Submit-Pfad ist eigene Lane**: `mana-api` exponiert `POST /api/v1/forms/public/<token>/submit`, schreibt in `mana_platform.forms_responses` Schema, schickt das Insert *server-seitig* in die Sync-Pipeline (analog `unlisted-snapshots`-Resolver). Der einreichende Nutzer hat keinen Sync-Client.
- Edge-Case **Anonymous-Mode**: bei `settings.anonymous=true` werden `submitterEmail`/`submitterName`/`submitterMeta` server-seitig vor dem Insert verworfen. Dem Owner-Client wird nichts angeliefert, was er nicht selber erst entschlüsseln dürfte.

## Visibility & Unlisted Sharing

Ein Form hat zwei Bedeutungen von "öffentlich":

1. **Form-Schema öffentlich** — `visibility='unlisted'` → Token-Link zum *Submit*-View
2. **Antworten öffentlich** — separates Flag `settings.responsesPublic` (rare; standardmäßig **immer privat**)

Default: ein neues Form ist `visibility='private'`. "Form veröffentlichen" bedeutet `published` Status + `unlisted` Visibility-Bump — beides in *einem* Klick im Builder.

Token-Rotation/-Expiry analog zum bestehenden Unlisted-System (`@mana/shared-privacy/unlisted-client`).

## Killer-Features (Differentiator vs. Typeform/Tally)

Diese drei Features rechtfertigen, dass wir Forms statt eines Typeform-Embeds bauen. Alles andere ist Commodity.

### KF1 — AI-Form-from-Prompt
"Bau mir ein Anmeldeformular für unseren Volleyball-Verein mit Spielposition, Trikotgröße und DSGVO-Häkchen." → `forms_create` füllt alle Felder vor; User reviewed im Builder; ein Klick zum Publish.

### KF4 — Form-as-Conversation via Persona-Runner
Der Public-Form-View hat einen Toggle `experience: 'classic' | 'conversation'`. Im Conversation-Mode rendert sich das Form als Chat — `mana-persona-runner` mit einer "Form-Host"-Persona stellt die Fragen, akzeptiert Free-Text-Antworten, mapt sie zurück auf strukturierte Felder. Erfordert `mana-persona-runner` Public-Mode (existiert noch nicht — siehe M5).

### KF7 — Public Sign-up an Space
Form mit `settings.autoSync.target='space_member'` → Submit erzeugt einen Space-Membership-Invite. Löst die ClubDesk-"Online-Anmeldung"-Lücke direkt; der Submitter klickt im Bestätigungs-Email auf "Beitreten" und wird Mitglied.

---

## Milestones

### M1 — Skelett + Field-Engine inline
- Modul registriert in `mana-apps.ts` (icon, color, tier, requiredTier='guest')
- Dexie v53 (oder nächste freie Version) mit `forms` + `formResponses` Tables + Per-Space-Welcome-Seed (ein Beispiel-Form: "Mini-Feedback")
- Encryption-Registry erweitert
- Route `/forms` mountet mit Empty-State
- Field-Engine inline (Validation, Branching) — noch kein Shared-Package-Extract

**Done:** `/forms` lädt; `pnpm validate:all` grün.

### M2 — Builder + CRUD
- `BuilderView`: Drag-reorder Felder via existierende Drag-Primitives, FieldPalette mit den 11 Feldtypen, FieldEditor pro Feld inline
- Field-Type-spezifische Konfig (Options-Editor für Choice-Felder, Min/Max für Number, Rating-Scale-Toggle)
- Form-Settings-Panel (submitButtonLabel, successMessage, requireEmail, allowMultipleSubmissions)
- Draft-Save: every change → `forms.update` (autosave-on-blur Pattern wie in `lasts`)
- ListView mit Karten pro Form, Klick → BuilderView

**Done:** Form mit ≥10 Feldern lässt sich bauen, speichern, neu laden.

### M3 — Public-Submit + Responses-Inbox
- `mana-api` `POST /api/v1/forms/public/<token>/submit` (Hono-Route in `services/mana-api` oder bestehender unified `apps/api`)
- `PublicFormView` rendert die definierten Felder, validiert client-side, submitet
- Bei Submit: Response-Insert in mana_platform → mana-sync pickt's auf → kommt im Owner-Client als neue Zeile in `formResponses` an
- `ResponsesView`: Tabelle mit Submit-Time, Submitter-Email, Snippet pro Antwort; Klick → ResponseDetailModal mit allen Antworten
- CSV-Export pure (kein Server-Roundtrip)
- Status-Workflow `new → reviewed → archived` per Klick in der Tabelle

**Done:** Form publishen, Link in Inkognito-Tab öffnen, Antwort einreichen, Owner sieht sie ≤2 Sek nach Sync.

### M4 — Conditional Logic + Visibility
- `BranchingEditor` mit "Wenn-Dann"-Regeln (UI: pro Feld ein "Logik"-Tab)
- `branching.ts` Resolver berechnet effektiv-sichtbare Felder pro Antwortzustand
- Visibility-System angeschlossen: `<VisibilityPicker>` + `<SharedLinkControls>` im Builder
- Token-Rotation + Expiry
- Resolver `buildFormPublicBlob` in `data/unlisted/resolvers.ts` (whitelist: title, description, fields, branching, settings.submitButtonLabel, settings.successMessage)
- Hard-Block: forms mit `responsesPublic: true` werden trotzdem nie ohne Login serialisiert (Antworten bleiben privat)

**Done:** Branching macht Felder sichtbar/unsichtbar je nach Antwort; Token-Link funktioniert; Token rotieren funktioniert.

### M5 — AI-Tools
- 7 Tools (siehe AI-Integration) in `@mana/shared-ai/src/tools/schemas.ts`
- Webapp-Implementierungen in `forms/tools.ts`
- Server-seitige planner-drift-tests grün
- `forms_summarize_responses` ruft `mana-llm` mit den (entschlüsselten, client-seitig) Antworten auf — keine Klartext-PII ans LLM, ggf. mit Augur-Style "redact emails/names"-Pre-Pass

**Done:** "Bau mir ein Form für …" über Workbench-Chat → fertiges Form im Builder.

### M6 — Encryption + ZK-Mode
- ZK-Mode-Toggle: bei aktiv wird ein per-Form-Key generiert (separater Eintrag in mana-auth Master-Key-Store, *nicht* der User-Master-Key)
- Public-Form-Antworten werden client-seitig im Submitter-Browser mit dem Form-Key (aus dem Public-Schema-Bundle) verschlüsselt → Server speichert nur Ciphertext
- Owner-Client hat den Key (im eigenen, master-key-encrypted Storage), kann lokal entschlüsseln
- Aggregat-Tools (`forms_get_responses` count-mode) funktionieren *ohne* Decrypt — Server kann zählen ohne lesen
- Encrypted-tools-audit grün; Crypto-Registry-Update für `formResponses.answers`

**Done:** ZK-Form publishen, Submit, Server-DB direkt inspizieren → kein Klartext-Antwort sichtbar.

### M7 — Auto-Sync zu Cross-Modulen
- `settings.autoSync` UI im Settings-Tab des Builders
- Bei Submit: Response-Insert + Mapping → schreibt in Target-Modul-Tabelle
- 5 Targets: contacts, events (RSVP), feedback, library, space_member
- `syncedTargets` auf der Response zeigt was passiert ist (UI: kleine Chips in der Response-Detail)

**Done:** Form mit autoSync auf `contacts` ausfüllen → neuer Kontakt erscheint im `/contacts`-Modul.

### M8 — Website-Block + Embed
- `FormBlock.svelte` als Block in `website` Block-Tree CMS
- Block-Config: form_id-Picker (nur eigene Forms des aktiven Spaces)
- SSR-Render auf der public Website rendert das Form direkt (kein Iframe)
- Submit landet im selben Public-API-Endpoint

**Done:** Form als Block in eine Website-Page einfügen, Page öffnen, Form ausfüllen, Antwort kommt im Owner-Client an.

### M9 — Form-as-Conversation (KF4)
- Toggle `experience: 'classic' | 'conversation'` in Form-Settings
- "Form-Host"-Persona in `mana-persona-runner` (read-only, stateless, kein Tool-Access)
- Public-Conversation-View streamt Fragen über `mana-persona-runner` Public-API (neuer Endpoint)
- Antwort-Mapping: LLM extrahiert pro Feldtyp (Single-Choice → match closest option, Number → parse, etc.)
- Fallback bei Mapping-Fehler: classic-Mode-View mit pre-filled Werten

**Done:** Form im Conversation-Mode öffnen → Chat-Bubbles statt Inputs; nach Submit liegt strukturierte Response wie üblich vor.

### M10 — Wiederkehrende Forms (KF5)
- Form-Setting `recurrence: { frequency: 'weekly' | 'monthly', sendVia: 'broadcast', recipients: ContactList }`
- Cron-Job in `mana-notify` oder `mana-ai`: schickt Link periodisch
- Each-Send markiert Antworten mit `cohort: 'YYYY-WW'` für Trend-Analyse
- Cross-Module: bei `autoSync` zu `mood` → speist Augur-Living-Oracle

**Done:** Wöchentlicher Pulse-Check setup, läuft 4 Wochen, ResponseView zeigt Trend.

---

## Out-of-Scope (möglich später)

- **File-Upload-Field** — erfordert Storage-Quota-Management pro Form, eigenes Sub-Plan-Doc
- **Payment-Field** — Stripe/SEPA-Integration; eher Teil von `invoices`-Modul
- **A/B-Testing der Form-Varianten** — Cohort-Mechanik aus M10 reicht aus, A/B kann später drauf
- **Public-Results-Dashboard** — wenn `responsesPublic`, ein Aggregate-View ohne Login
- **Multi-Page Forms** mit Pagination — derzeit single-page, scrollbar; Branching reicht meist
- **Templates-Library** — wenn KF1 (AI-from-Prompt) zieht, brauchen wir keine Template-Galerie

## Nicht-Ziele

- **Logic-Engine wird nicht turing-complete** — nur if/then/skip; keine Formel-Felder ("Antwort A * 2 + Antwort B")
- **Keine Webhooks** zu Drittsystemen — wer das will, scriptet es via `mana-mcp` Tools
- **Kein eigener Server-Dienst** — `apps/api` reicht; kein neuer `services/mana-forms`-Container

## Validatoren-Checkliste vor jedem Push

- `pnpm validate:all` grün (turbo + pgSchema + theme + i18n + crypto)
- `pnpm test --filter @mana/web -- forms` grün
- `audit:encrypted-tools` zählt `forms` mit
- `validate:i18n-parity` mit Namespace `forms/` × 5 Locales aligned

## Vorbild-Module für Pattern-Recyceln

- **`quiz`** — Frage-Schema, Field-Types-Pattern (extrahieren in M1-Folge-Lieferung)
- **`lasts`** — Settings-Store, DueBanner für "Du hast 3 neue Antworten", autosave-on-blur
- **`augur`** — Living-Oracle für `forms_summarize_responses` (Theme-Clustering)
- **`events`** Share-Links — Public-Submit-Pfad-Vorbild für Anmeldung
- **`website`** Block-Tree — `FormBlock.svelte` analog zu existierenden Blocks
