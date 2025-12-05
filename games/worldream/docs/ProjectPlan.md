# Projektbericht (kurz) – **Personas / Stories**

## 1) Zielbild

Eine text-first Plattform, in der **Characters**, **Objects**, **Places** und **Stories** als **Texte** gepflegt werden. Stories kombinieren diese Bausteine über einfache **@slug**-Referenzen (ohne harte DB-Joins). Fokus: schnell Stories bauen, konsistente Welten darstellen, LLM-freundlich.

## 2) MVP-Funktionsumfang

- **Content-Editor** für `world|character|object|place|story` (ein Formular, gleiche Felder).
- **Story-Builder**: Auswahl per `@slug` (z. B. `cast=@mira,@timo | places=@neo_station`).
- **Story-Verlauf** (optional, aber empfohlen): Einträge als Narration/Dialog.
- **Suche** (FTS) über Titel, Summary, Lore, Canon-Facts, Glossar.
- **Versionierung** (optional): jede Änderung rückrollbar.
- **Anhänge** (Bilder/Audio/Dokumente) per URL/Storage.

## 3) Architektur / Tech-Stack

- **Frontend**: SvelteKit + TypeScript, Tailwind, Form-Editor (MD/Markdown).
- **Backend**: SvelteKit API Routes (`+server.ts`), leichte Services.
- **DB**: Supabase (Postgres) mit **Hybrid-Schema**: feste Meta-Spalten + `content jsonb`.
- **Auth**: Auth.js (oder Lucia).
- **Search**: Postgres FTS (`tsvector` Generated Column).
- **Storage**: Supabase Storage / S3-kompatibel (für Attachments).
- **Deploy**: Docker (Fly.io/Hetzner/Render), kein Vercel-Lock-in.

## 4) Datenmodell (vereinfacht)

### A) Eine Tabelle für alles (empfohlen)

**content_nodes**

- Meta: `id uuid`, `kind ('world'|'character'|'object'|'place'|'story')`, `slug`, `title`, `summary`, `owner_id?`, `visibility ('private'|'shared'|'public')`, `tags text[]`, `world_slug?`, `created_at`, `updated_at`
- Inhalte: `content jsonb` (siehe Felder unten)
- Suche: `search_tsv tsvector GENERATED` (aus ausgewählten Textfeldern)

**story_entries** _(Story-Verlauf, optional)_

- `id`, `story_slug`, `position`, `type ('narration'|'dialog'|'note')`, `speaker_slug?`, `body`, `created_by`, `created_at`

**node_revisions** _(Versionierung, optional)_

- `id`, `node_id/slug`, `content_before jsonb`, `content_after jsonb`, `edited_by`, `edited_at`, `notes?`

**attachments** _(Assets, optional)_

- `id`, `node_slug`, `kind ('image'|'audio'|'doc')`, `url`, `notes?`, `created_at`

### B) Einheitliche **content.json**-Schlüssel (für alle Kinds)

- **appearance** – Beschreibung des Aussehens in Worten
- **image_prompt** – Prompt für Bildgenerierung
- **lore** – Vorgeschichte/History/Lore
- **voice_style** – Tonalität/Erzähl-/Sprechstil
- **capabilities** – Fähigkeiten/Eigenschaften (Text oder Bulletpoints)
- **constraints** – Grenzen/No-Gos/Regeln
- **motivations** – Ziele/Triebe/Konflikte
- **secrets** – verborgene Infos / Twists
- **relationships_text** – Beziehungen als Freitext (mit `@slug`)
- **inventory_text** – Besitz/Ausrüstung als Text
- **timeline_text** – Ereignisse/Chronik als Text
- **glossary_text** – Begriffe/Aliasse/Schreibregeln
- **canon_facts_text** – „offizielle Wahrheiten/Regeln“
- **state_text** – aktueller Zustand in Sätzen („Amulett liegt im Tresor …“)
- **prompt_guidelines** – Anweisungen an LLM (Stil, Person, Perspektive)
- **references** – freie Referenzen/Quellen (z. B. `cast=@mira,@timo`)
- **\_links (optional)** – maschinenlesbarer Cache: `{ cast: ["@mira"], places: ["@neo_station"] }`
- **\_aliases (optional)** – alternative Slugs für Umbenennungen
- **\_i18n (optional)** – Übersetzungen pro Sprache

> **Naming:** `characters` heißen in der DB **kind='character'**.

## 5) RLS / Sichtbarkeit

- **Owner**: Vollzugriff.
- `shared`: Schreibrechte für eingeladene Kollaborateure, sonst Read.
- `public`: Read-only.
- Policies leiten sich an `owner_id`/`visibility` + optional Project-Team ab.

## 6) Vor- & Nachteile des Ansatzes

**Pro**

- Extrem **schnell** iterierbar; ein Editor für alles.
- **LLM-freundlich** (reiner Text/Markdown, klare Prompt-Felder).
- Weniger Schema-Migrationen dank **JSONB**.
- **@slug**-Referenzen: menschlich & maschinenlesbar.

**Contra**

- Keine FK-Sicherheit; Slug-Umbenennungen müssen per `_aliases` abgefedert werden.
- Auswertungen über strukturierte Werte begrenzt (bewusst text-first).
- Konsistenz-Checks geschehen über Textregeln/Parser, nicht DB-Constraints.

**Mitigation**

- Beim Speichern `@slug` parsen → `_links` füllen (Cache).
- `node_revisions` aktivieren (Rollback).
- `search_tsv` nur mit relevanten Feldern befüllen (Performance).

## 7) Minimale API (Beispiele)

- `POST /api/nodes` – create/update `content_nodes`
- `GET  /api/nodes?kind=story&query=...` – FTS + Filter
- `POST /api/stories/:slug/entries` – Verlauf posten
- `GET  /api/stories/:slug/entries` – Verlauf lesen
- `POST /api/nodes/:slug/attachments` – Asset anheften

## 8) Erfolgskriterien (Metriken)

- Time-to-Create: < 2 min vom leeren Story-Draft zum ersten Kapitel
- Konsistenz: < 5% manuelle Korrekturen je 1.000 Wörter (gemessen via Flags/Edits)
- Re-Use: ≥ 30% Stories nutzen bestehende Characters/Places erneut
- Editor-Revert: < 1 min zum Rollback einer Änderung

## 9) Fahrplan (4–6 Wochen)

1. **Woche 1**: SvelteKit Grundgerüst, Auth, `content_nodes`, FTS, RLS.
2. **Woche 2**: Editor (Markdown), Slug-Parser → `_links`, List/Detail-Views.
3. **Woche 3**: **story_entries**, Timeline-Ansicht, einfache Exporte (Markdown/JSON).
4. **Woche 4**: Versionierung (**node_revisions**), Attachments, öffentliche Sharing-Ansicht.
5. **Woche 5–6**: Feinschliff, Prompt-Guidelines-UX, Konsistenz-Hinweise (leichte Regeln).

---

**Kurzfazit:**
Das **text-first + JSONB-Hybrid** macht euch maximal schnell, bleibt LLM-ready und hält den DB-Footprint minimal. Mit `_links`, Revisions und FTS habt ihr genug Struktur für Suche, Wiederverwendung und Konsistenz – ohne die Komplexität klassischer Join-Landschaften.
