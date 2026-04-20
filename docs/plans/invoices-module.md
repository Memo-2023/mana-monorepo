# Invoices — Module Plan

## Status (2026-04-20)

**M1–M7 DONE** — solo-tauglich, ohne Logo-Upload + AI-Tools.

| Milestone | Commit | Notes |
|---|---|---|
| M1 Skelett | `2cf89ce26` | Modul registriert, Dexie v27, Encryption-Registry, leere ListView |
| M2 CRUD | `8d00ee069` | Store, Totals, Status-Maschine, ListView mit Stats-Cards, Routes |
| M3 Settings | in M2 | SenderProfileForm fertig, **Logo-Upload offen** (uload-Integration nötig) |
| M4 PDF Basic | `2dc298a79` | pdf-lib, pagination, preview + download |
| M5 QR-Rechnung | `5af23d30b` | swissqrbill/svg + PNG-Overlay, SCOR auto, address-parser-Heuristik |
| M6 Versand | `08b7ac16b` | SendModal mit mailto + PDF-Download + Confirm → status sent |
| M7 Dashboard | pending commit | InvoicesOpenWidget mit Offen/Überfällig + Top-3 älteste überfällig |

**Tests (45+ green):** totals math, SCOR + address-parser (swissqrbill `isSCORReferenceValid` roundtrip), mail template + mailto encoding.

**Offene Arbeit vor "produktiv einsetzbar":**
- **M3-Polish:** Logo-Upload via uload → erscheint im PDF-Header
- **M8 AI-Tools:** `create_invoice` (propose), `mark_paid` (propose), `list_invoices` (auto), `get_invoice_stats` (auto) — braucht Planner-Drift-Guard-Update
- **Nummernkreis-Multi-Device-Kollision:** dokumentiert als gap (pragmatisch, solo-MVP-tauglich)
- **Strukturierte Adressen:** Heuristik-Parser deckt Standard-CH/DE ab; komplexere Adressen fehlen → User sieht in Warning, was fehlt
- **Bezahlte Rechnung → finance-Transaktion:** Cross-Modul-Hook, Phase 3
- **camt.053 Bankabgleich:** Phase 2

Nächster Schritt: M3 Logo-Upload ODER M8 AI-Tools ODER Real-World-Dogfooding (erste eigene Rechnung an einen echten Kunden).

---

## Ziel

Ein Modul, mit dem der Nutzer **Rechnungen an Kunden stellt**: Rechnung anlegen → PDF generieren (inkl. **Schweizer QR-Rechnung**) → per Mail versenden → Zahlungs-Status nachhalten. Kernfrage: *"Hat der Kunde bezahlt — und wenn nein, wann muss ich mahnen?"*

Solo-Zielgruppe: Freelancer/Selbstständige in CH (+DE). Später trivial auf Vereine erweiterbar (Empfänger = Mitgliedergruppe → Serienrechnungslauf für Mitgliederbeiträge).

## Abgrenzung

- **Kein Ersatz für `finance`** — das bleibt das private Einnahmen/Ausgaben-Tracker. `invoices` ist die **Outbound**-Seite: Rechnungen *stellen* statt Transaktionen *erfassen*. Ein bezahlter Rechnungseingang kann später automatisch eine `finance`-Einnahme erzeugen (Cross-Modul-Hook, Phase 3).
- **Keine vollständige Buchhaltung** — keine Kontenrahmen (SKR03/SKR42), keine doppelte Buchführung, keine MwSt-Voranmeldung. Das ist ClubDesk-Niveau Paket B-2 und explizit *nicht* MVP.
- **Kein Bankabgleich (camt.053)** — Phase 2/3, separater Plan.
- **Kein Payment-Provider** — keine Stripe/PayPal-Zahlungslinks im MVP. Zahlungseingang wird manuell markiert oder (später) per camt abgeglichen.
- **Kein CRM** — Kundendaten kommen aus dem bestehenden `contacts`-Modul, nicht aus einer eigenen Kunden-Tabelle.

## Entscheidung: eigenes Modul, nicht Finance-Erweiterung

Zwei Optionen wurden erwogen:

1. **In `finance` integrieren** — Rechnung wäre ein Transaktions-Typ.
2. **Eigenes Modul `invoices`** (gewählt).

Begründung für (2):
- Rechnungen haben komplexeres Schema (Positionen, PDF-Assets, QR-Zahldaten, Status-Maschine Entwurf/Versendet/Bezahlt/Überfällig) — das verunreinigt das schlanke Finance-Schema.
- Unterschiedliche Zielgruppe: `finance` ist Alltags-Tracking (jeder), `invoices` ist Selbstständigen-Workflow (Teilmenge).
- Separater Launcher-Eintrag, eigene Route, eigene AI-Tools.
- Finance bleibt encryption-minimal, invoices hat mehr sensitive Felder.

Cross-Link: Bezahlte Rechnung → optional auto-erzeugte `finance`-Einnahme (Phase 3).

## Modul-Struktur

```
apps/mana/apps/web/src/lib/modules/invoices/
├── types.ts                       # LocalInvoice, Invoice, InvoiceLine, InvoiceStatus, Client
├── collections.ts                 # invoices + invoiceClients tables + guest-seed
├── queries.ts                     # useAllInvoices, useInvoicesByStatus, useInvoice(id), useStats, useOverdue
├── stores/
│   ├── invoices.svelte.ts         # create, update, markSent, markPaid, markOverdue, void, duplicate, delete
│   ├── clients.svelte.ts          # createClient, updateClient, deleteClient (optional — kann auch in contacts)
│   └── settings.svelte.ts         # Absender-Profil, Logo, Fußzeile, IBAN, MwSt-Nummer, Nummernkreis
├── components/
│   ├── InvoiceCard.svelte         # Listeneintrag: Nummer + Kunde + Betrag + Status-Badge + Fälligkeit
│   ├── InvoiceForm.svelte         # Create/Edit inkl. Positionen-Editor
│   ├── LinesEditor.svelte         # Positionen: Titel, Menge, Einheit, Einzelpreis, MwSt-Satz
│   ├── StatusBadge.svelte         # draft / sent / paid / overdue / void
│   ├── StatusFilter.svelte        # Filter-Chips
│   ├── ClientPicker.svelte        # Auswahl aus contacts ODER invoiceClients
│   ├── SenderProfileForm.svelte   # einmalige Einrichtung (Name, IBAN, MwSt, Logo)
│   └── InvoicePreview.svelte      # Live-Preview des PDFs (iframe oder react-pdf react-free Variante)
├── pdf/
│   ├── renderer.ts                # erzeugt Blob via pdf-lib (Header, Tabelle, Footer, QR-Slip)
│   ├── qr-bill.ts                 # swissqrbill-Integration (SPC-kompatibel, CHF/EUR)
│   └── templates/
│       └── default.ts             # Layout-Konstanten (Margins, Fonts, Farben)
├── views/
│   ├── ListView.svelte            # komponiert Filter + Grid/Liste
│   ├── DetailView.svelte          # Rechnungsdetail + PDF-Preview + Aktionen
│   └── SettingsView.svelte        # Absender-Profil + Nummernkreis-Editor
├── tools.ts                       # AI-Tools — siehe §AI-Integration
├── constants.ts                   # STATUS_LABELS, VAT_RATES_CH, VAT_RATES_DE, DEFAULT_DUE_DAYS
├── module.config.ts               # { appId: 'invoices', tables: [{ name: 'invoices' }, { name: 'invoiceClients' }, { name: 'invoiceSettings' }] }
└── index.ts                       # Re-Exports
```

## Daten-Schema

### `LocalInvoice` (Dexie)

```typescript
export type InvoiceStatus = 'draft' | 'sent' | 'paid' | 'overdue' | 'void';
export type Currency = 'CHF' | 'EUR' | 'USD';

export interface LocalInvoiceLine {
  id: string;                       // client-generated, stabil für Drag-Reorder
  title: string;                    // encrypted
  description?: string | null;      // encrypted
  quantity: number;                 // plaintext
  unit?: string | null;             // plaintext — "Std", "Stk", "Tag"
  unitPrice: number;                // plaintext — in kleinster Währungseinheit (Rappen/Cent), Integer
  vatRate: number;                  // plaintext — 0, 2.6, 3.8, 8.1 (CH) oder 0, 7, 19 (DE)
  discount?: number | null;         // plaintext — Prozent (0..100)
}

export interface LocalInvoice extends BaseRecord {
  number: string;                   // plaintext — "2026-0042", aus Nummernkreis generiert
  status: InvoiceStatus;            // plaintext — filterbar
  clientId: string | null;          // plaintext — FK entweder contacts.id ODER invoiceClients.id
  clientSource: 'contact' | 'invoice-client'; // plaintext — welche Tabelle
  clientSnapshot: {                 // encrypted — Kunden-Daten zum Zeitpunkt des Versands eingefroren
    name: string;
    address?: string;
    email?: string;
    vatNumber?: string;
  };
  currency: Currency;               // plaintext
  issueDate: string;                // plaintext — YYYY-MM-DD
  dueDate: string;                  // plaintext — YYYY-MM-DD
  sentAt?: string | null;           // plaintext — ISO timestamp
  paidAt?: string | null;           // plaintext — ISO timestamp
  lines: LocalInvoiceLine[];        // teils encrypted (Titel/Description), teils plaintext (Zahlen)
  subject?: string | null;          // encrypted — "Beratungsleistung April 2026"
  notes?: string | null;            // encrypted — Freitext unterhalb der Positionen
  terms?: string | null;            // encrypted — AGB/Zahlungsbedingungen
  referenceNumber?: string | null;  // plaintext — QR-Referenz (CH) oder Kundenreferenz
  pdfBlobKey?: string | null;       // plaintext — uload/media-ID des gerenderten PDFs (Cache)
  // Berechnete Totals — denormalisiert, bei jedem update neu
  totals: {
    net: number;                    // plaintext
    vat: number;                    // plaintext
    gross: number;                  // plaintext
    vatBreakdown: Array<{ rate: number; base: number; tax: number }>;
  };
}
```

### `LocalInvoiceClient` (Dexie) — *optional, Phase 1.5*

Separate Tabelle für Rechnungs-spezifische Kundendaten, falls `contacts` nicht reicht. Gleiche Felder wie `clientSnapshot`, aber zentral editierbar. MVP startet ohne — bestehende `contacts` reichen für solo-User.

```typescript
export interface LocalInvoiceClient extends BaseRecord {
  name: string;                     // encrypted
  address?: string | null;          // encrypted
  email?: string | null;            // encrypted
  vatNumber?: string | null;        // encrypted
  iban?: string | null;             // encrypted — für spätere SEPA-Lastschrift
  defaultCurrency: Currency;        // plaintext
  defaultDueDays: number;           // plaintext — 14, 30, 60
  notes?: string | null;            // encrypted
}
```

### `LocalInvoiceSettings` (Dexie, Singleton pro User)

```typescript
export interface LocalInvoiceSettings extends BaseRecord {
  // Absender
  senderName: string;               // encrypted
  senderAddress: string;            // encrypted
  senderEmail: string;              // encrypted
  senderVatNumber?: string | null;  // encrypted — "CHE-123.456.789 MWST"
  senderIban: string;               // encrypted — CH-IBAN für QR-Rechnung
  senderBic?: string | null;        // encrypted — für SEPA

  // Branding
  logoMediaId?: string | null;      // plaintext — uload-ID
  accentColor: string;              // plaintext — Hex
  footer?: string | null;           // encrypted — Fußzeile unter jedem PDF

  // Nummernkreis
  numberPrefix: string;             // plaintext — "2026-"
  numberPadding: number;            // plaintext — 4 → "0042"
  nextNumber: number;               // plaintext — Zähler, wird atomisch inkrementiert

  // Defaults
  defaultCurrency: Currency;
  defaultVatRate: number;           // plaintext — 8.1 (CH) oder 19 (DE)
  defaultDueDays: number;
  defaultTerms?: string | null;     // encrypted
}
```

### Encryption-Registry

`apps/mana/apps/web/src/lib/data/crypto/registry.ts`:

```typescript
invoices: {
  fields: ['clientSnapshot', 'subject', 'notes', 'terms', 'lines'],
  version: 1,
},
invoiceClients: {
  fields: ['name', 'address', 'email', 'vatNumber', 'iban', 'notes'],
  version: 1,
},
invoiceSettings: {
  fields: ['senderName', 'senderAddress', 'senderEmail', 'senderVatNumber', 'senderIban', 'senderBic', 'footer', 'defaultTerms'],
  version: 1,
},
```

**Wichtig zu `lines`:** Die komplette `lines`-Array wird encrypted serialisiert. Die Zahlenanteile wären zwar plaintext-fähig, aber die Trennung von encrypted Titel + plaintext Zahlen pro Line ist teuer in Dexie-Queries. Pragmatisch: ganze `lines`-Array encrypten, `totals` daneben plaintext halten für Filter/Summen.

## Routing

```
apps/mana/apps/web/src/routes/(app)/invoices/
├── +page.svelte                   # ListView mit Status-Filter
├── new/+page.svelte               # InvoiceForm im Create-Mode
├── [id]/+page.svelte              # DetailView
├── [id]/edit/+page.svelte         # InvoiceForm im Edit-Mode
└── settings/+page.svelte          # SettingsView (Absender, Nummernkreis)
```

## UI-Konzept

### Landing (`/invoices`)

- **Top-Leiste:** Status-Chips (Alle | Entwurf | Versendet | Bezahlt | **Überfällig** als rote Count-Badge), Zeitraum-Filter (Dieses Jahr | Letztes Jahr | Alle), Search
- **Kennzahlen-Karten:** Offene Summe, Überfällig, YTD fakturiert, YTD bezahlt
- **Liste:** `InvoiceCard` mit Nummer, Kunde, Fälligkeit, Bruttobetrag, Status-Badge; Click → DetailView
- **FAB:** "+" öffnet `new`-Route (oder Modal, konsistent mit anderen Modulen)
- **Scene-Scope**: Invoices ignorieren Scene-Scope per Default (kein Tag-System — Kunden/Nummer identifizieren, nicht Tags)

### InvoiceForm

Links Eingabe, rechts Live-Preview des PDFs (auf Desktop). Mobile: Tab-Switch.

Sections:
1. **Kunde** — ClientPicker (sucht in Contacts + InvoiceClients)
2. **Metadaten** — Nummer (auto-generiert, editierbar), Issue-Date, Due-Date, Währung, Betreff
3. **Positionen** — `LinesEditor`: Tabelle mit Add/Remove/Reorder. Spalten: Titel, Menge, Einheit, Einzelpreis, MwSt%, Total (berechnet)
4. **Totals** — Auto-berechnet: Netto pro MwSt-Satz, MwSt, Brutto
5. **Notizen & AGB** — Markdown-Felder für zusätzlichen Text

Save-Actions: "Als Entwurf speichern" (status: draft) oder "Speichern & Versenden" (status: sent, öffnet Mail-Flow).

### DetailView

- Header: Nummer, Status-Badge, Aktionen-Menu (Bearbeiten, Duplizieren, Als bezahlt markieren, Stornieren, PDF herunterladen, Per Mail senden)
- Linke Spalte: Rechnungs-Metadaten + Positionen als Read-Only-Tabelle
- Rechte Spalte: PDF-Preview (iframe)
- Footer: Activity-Log (erstellt, versendet, bezahlt, gemahnt) — aus `_activity` gefiltert

### SettingsView

- Absender-Profil-Form (einmalig auszufüllen, Onboarding-Block wenn leer)
- Logo-Upload via bestehende `uload`-Infrastruktur
- Nummernkreis-Konfigurator mit Preview ("Nächste Rechnung: 2026-0042")
- Default-Werte (Währung, MwSt, Zahlungsfrist)

## PDF-Rendering

### Library-Wahl

- **`pdf-lib`** (npm, ~130 KB gzipped, WebAssembly-frei) — reicht für Tabellen + Text + Logo.
- **`swissqrbill`** (npm, CH-spezifisch, SPC-kompatibel) — generiert den Zahlteil als PDF-Seite oder PNG-Overlay.

Alternativen verworfen:
- `@react-pdf/renderer` — React-only, Mana ist Svelte.
- `jsPDF` — großer Footprint, weniger flexibel bei komplexen Layouts.
- Server-Side-Rendering via Puppeteer in `apps/api` — wäre besser aber *Phase 2*. MVP bleibt client-side (local-first-Prinzip + keine neuen Service-Dependencies).

### Render-Pipeline

```
invoice → renderer.ts
         ├── Layout-Engine: Header (Absender + Logo) → Empfänger-Block → Rechnungsmeta → Positionen-Tabelle → Totals → Notes → Footer
         ├── qr-bill.ts: swissqrbill.generate({ amount, iban, creditor, debtor, reference }) → PDF-Seite appendieren (nur wenn Currency=CHF)
         └── → Blob (application/pdf)
```

Rendering dauert ~100-300ms für typische Rechnungen (akzeptabel für Live-Preview mit debounce 500ms).

### QR-Rechnung (CH) — Kern-USP

- Pflichtfelder: IBAN, Creditor (Name + Adresse), Amount, Currency=CHF, Reference (QRR oder SCOR)
- `referenceNumber` aus Invoice-Schema generiert via QRR-Algorithmus (27 Ziffern, Mod-10-Prüfziffer) ODER SCOR (ISO 11649 Creditor Reference)
- swissqrbill kümmert sich um Swiss Cross + Perforation + Zahlteil-Layout

## Registrierung (Checklist)

1. `apps/mana/apps/web/src/lib/modules/invoices/module.config.ts` anlegen
2. Config in `apps/mana/apps/web/src/lib/data/module-registry.ts` importieren + in `MODULE_CONFIGS` aufnehmen
3. Dexie-Schema-Migration: `db.version(N+1).stores({ invoices: 'id, number, status, userId, clientId, issueDate, dueDate', invoiceClients: 'id, userId', invoiceSettings: 'id, userId' })` hinzufügen — NICHT bestehende Versionen ändern
4. Encryption-Registry-Einträge (siehe oben)
5. Routes unter `(app)/invoices/` anlegen
6. App-Eintrag in `packages/shared-branding/src/mana-apps.ts`:
   ```typescript
   { id: 'invoices', name: 'Rechnungen', description: {...}, icon: APP_ICONS.invoices, color: '#059669', status: 'development', requiredTier: 'alpha' }
   ```
7. Icon in `packages/shared-branding/src/app-icons.ts`
8. `docs/MODULE_REGISTRY.md` unter "Arbeit & Finanzen" ergänzen
9. Guest-Seed in `collections.ts` (eine Demo-Rechnung im Status `draft` an einen seed-contact)
10. Vitest-Tests:
    - Store-Mutationen (create, updateLines → totals neu berechnet, markPaid → paidAt gesetzt)
    - Encryption-Roundtrip
    - Nummer-Generator (atomisch, kein Duplikat bei gleichzeitigem Create)
    - QRR-Prüfziffer
    - PDF-Rendering smoke-test (Blob > 0 bytes)

## AI-Integration (Phase 2)

Nachdem MVP steht, Tools in `tools.ts` registrieren und in `@mana/shared-ai/src/tools/schemas.ts` + `AI_PROPOSABLE_TOOL_NAMES` aufnehmen:

| Tool | Policy | Beschreibung |
|------|--------|--------------|
| `create_invoice` | propose | Rechnung als Entwurf anlegen — Kunde, Positionen, Fälligkeit aus Chat extrahieren |
| `mark_invoice_paid` | propose | Rechnung als bezahlt markieren (mit Datum) |
| `list_invoices` | auto | Status-Filter + Zeitraum für Planner-Kontext |
| `get_invoice_stats` | auto | Offene Summe, YTD-Umsatz, überfällige Anzahl |
| `suggest_dunning` | propose | Mahntext für überfällige Rechnung vorschlagen (nutzt Kundensnapshot + Fälligkeit + Betrag) |
| `draft_invoice_from_timesheet` | propose | Phase 3: verbindet `times`-Modul — "letzte 4 Wochen für Kunde X" → Rechnung |

UX-Integration: `<AiProposalInbox module="invoices" />` auf ListView einbetten. Mission-Beispiel: *"Erinnere mich freitags an überfällige Rechnungen und schlag Mahntexte vor."*

## Kommunikation / Versand

### MVP (Phase 1)

- Button "Per Mail senden" → öffnet bestehende `mail`-Compose mit pre-filled Empfänger (aus clientSnapshot.email), Betreff (`Rechnung {number}`), Body (Vorlage mit Platzhaltern), Anhang = gerendertes PDF
- User sendet manuell ab → Store setzt `status='sent'` + `sentAt=now`
- Optional: nach Versand automatisches Dexie-`_activity`-Event "Rechnung versendet"

### Phase 2 — Automatisiert

- Eigener Endpoint in `apps/api`: `POST /api/v1/invoices/:id/send` → serverseitig Mail verschicken via Stalwart
- E-Mail-Tracking (Opens) — analog zu Newsletter-Modul später
- Zahlungs-Reminder (cron im `mana-ai`): "Rechnung seit 5 Tagen überfällig"

## Milestones

| Milestone | Umfang | Geschätzter Aufwand |
|-----------|--------|---------------------|
| **M1 Skelett** | Modul registriert, Dexie-Tables, Encryption-Registry, leere ListView, Guest-Seed, App-Entry + Icon | 0.5 Tag |
| **M2 CRUD** | InvoiceForm + LinesEditor + DetailView, Totals-Berechnung, Status-Maschine, Nummer-Generator | 3 Tage |
| **M3 Settings** | SettingsView + Singleton-Store, Logo-Upload via uload, Nummernkreis-Editor | 1 Tag |
| **M4 PDF Basic** | pdf-lib-Renderer mit Header/Tabelle/Totals/Footer, Preview-iframe in DetailView, Download-Button | 2 Tage |
| **M5 QR-Rechnung** | swissqrbill-Integration, QRR-Referenz-Generator, IBAN-Validation, CHF-only Gating | 1.5 Tage |
| **M6 Versand** | "Per Mail senden"-Flow über bestehendes mail-Modul, status-Transition sent+sentAt | 0.5 Tag |
| **M7 Dashboard & Stats** | Kennzahlen-Karten, Overdue-Highlighting, `useStats()` + Dashboard-Widget | 1 Tag |
| **M8 AI-Tools** | 4 Tools (create_invoice, mark_paid, list, stats) + Proposal-Inbox | 1.5 Tage |

**Summe MVP (M1–M7):** ~9.5 Arbeitstage → realistisch **~2.5 Wochen** mit Testing/Polishing.

## Phase 2 (nach MVP)

- camt.053/054-Bankabgleich (separater Plan, eigenes Backend-Feature in mana-api)
- SEPA-Lastschrift (pain.008-XML-Export)
- Mahnwesen (3-Stufen-Mahnlauf)
- Wiederkehrende Rechnungen (via `rituals`)
- PDF-Rendering server-side via Puppeteer (bessere Typografie, custom fonts)
- Auto-Sync bezahlter Rechnungen → `finance`-Transaktion

## Phase 3 (Vereinsvariante)

- Empfänger = Gruppe (aus contacts-Gruppen) → Serienrechnungslauf
- Integration Mitglieder-Entität (aus Paket A)
- Beitragsmodelle (Jahresbeitrag, Halbjahresbeitrag, gestaffelt nach Kategorie)
- QR-Rechnung mit Vereins-Referenz pro Mitglied

## Offene Fragen

1. **Nummernkreis-Atomicität**: Bei schnellem doppeltem Create-Klick ohne Sync darf keine doppelte Nummer entstehen. Dexie-Transaktion um `nextNumber`-Read + `nextNumber++` wrappen. Bei Sync-Konflikt (Offline Create auf zwei Geräten): LWW löst durch `__fieldTimestamps`, aber Nummern wären doppelt. Lösung: Beim Sync-Merge Kollision erkennen → älterer Eintrag behält Nummer, neuerer bekommt `nextNumber` neu zugewiesen. **Design nötig vor M2.**
2. **Kundensnapshot-Strategie**: Beim Versenden wird der Kunden-Stand eingefroren (`clientSnapshot`). Was passiert bei Edit der Rechnung im Status `sent`? Option A: Edit nur im Status `draft` erlauben. Option B: Jede Edit-Operation neuen Snapshot nehmen. **Empfehlung A** — einfacher, entspricht Realität (versendete Rechnung ist rechtsverbindlich).
3. **Logo-Upload-Pfad**: `uload` liefert Media-ID, aber PDF-Renderer braucht Bytes. Zwei Optionen: (a) Logo beim Render aus uload ziehen (async), oder (b) Base64-inline in `invoiceSettings` speichern. Empfehlung (a) weil Logos typischerweise >20 KB und wir encryption sparen wollen.
4. **Currency-Scope**: MVP CHF + EUR reicht für 95% der Zielgruppe. USD/GBP später.
5. **Mehrsprachigkeit**: Sollen Rechnungen sprachlich anpassbar sein (DE/EN/FR auf dem PDF)? Phase 2 — MVP: Sprache = UI-Sprache.
6. **Zero-Knowledge-Kompatibilität**: Der `clientSnapshot` ist encrypted. Wenn ZK aktiv ist, kann der Server kein PDF renderen/versenden (Phase 2). Für MVP (client-side-Render) kein Problem.

## Abhängigkeiten

- `contacts`-Modul: vorhanden, wird für ClientPicker genutzt.
- `mail`-Modul: vorhanden (beta), wird für Versand genutzt.
- `uload`-Modul: vorhanden, wird für Logo + PDF-Cache genutzt.
- npm: `pdf-lib@^1`, `swissqrbill@^4` — beide MIT-lizenziert, aktiv gewartet.
- Keine neue Backend-Service nötig für MVP.

## Erfolgs-Kriterien

- **Tag 1 nach Launch:** Till kann für einen realen Kunden eine QR-Rechnung stellen, als PDF herunterladen und manuell versenden.
- **Woche 2:** Rechnung wird aus Mana heraus per Mail versendet, PDF landet als Anhang.
- **Monat 1:** 3–5 externe Nutzer (Freelancer) testen das Modul und haben bezahlte Rechnungen generiert.
- **Monat 3:** Mission "Erinnere mich an überfällige Rechnungen" läuft und schlägt Mahnungen vor.
