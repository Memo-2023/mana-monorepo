# Articles — Workbench Homepage

## Status (2026-04-22)

Proposed. Follow-up auf die M1–M8-Umsetzung (siehe [articles-module.md](articles-module.md)).

## Ziel

Die `/articles`-Landing ist heute eine flache Filter-Chips + Karten-Liste. Für einen Pocket-Klon ist das funktional aber „langweilig" — der User sieht keinen kuratierten Einstieg, keinen Fortschritt, keine Wiederaufnahme-Empfehlung. Bei Readwise Reader / Matter / Omnivore ist die Landing eine reiche Übersicht mit mehreren Sektionen; die flache Liste steht als Fallback daneben.

Dieses Plan-Dokument beschreibt eine neue **HomeView** als Default-Einstieg — multi-sektional, reaktiv, leanes Data-Layer (alle Queries existieren schon). Die bestehende ListView bleibt 1:1 erhalten und ist via Tab oder direkter Route (`/articles/list`) weiter erreichbar.

## Abgrenzung

- **Kein Workbench-Cards-Rewrite.** Articles registriert sich als **eine** App mit **einer** `list`-View. Die HomeView ist der neue Body dieser View — intern mehrere Sektionen, extern ein einziger Einstieg. Siehe [workbench-cards-migration.md](workbench-cards-migration.md) — das Prinzip „eine Karte pro Domain, interne Tabs wenn nötig" passt hier.
- **Kein Scene-Template.** Wir schaffen keinen neuen Template-Handler („Lese-Scene"); Articles landet als ganz normale Workbench-App.
- **Kein Ersatz für das Dashboard-Widget.** `ArticlesUnreadWidget` bleibt auf dem globalen `/dashboard` — das ist ein anderer Surface (Dashboard-Tile) mit anderem Zweck (3-Zeilen-Schnappschuss im Widget-Grid).
- **Keine neuen Queries/Stores.** Alles was die Sections brauchen ist bereits in `queries.ts` vorhanden: `useAllArticles`, `useStats`, `useAllHighlights`. Falls wir was fehlt, wird's dort ergänzt — nicht im HomeView.

## Warum jetzt

1. M1–M8 sind durch, das Modul funktioniert end-to-end — Polish-Phase.
2. Nutzer kommt jetzt öfter vorbei (Bookmarklet + Share-Target → mehr Saves pro Woche). Eine Landing die sagt „hier ist was Neues, hier warst du stehengeblieben" lohnt sich plötzlich.
3. Articles-as-Workbench-App-Registrierung fehlt noch komplett — das Modul lebt heute nur als Route, nicht als draggable Scene-App. Diese Homepage-Iteration ist der natürliche Moment das mitzunehmen.

## Entscheidungen vorab

- **Eine HomeView, keine Tabs.** Keine „Home vs. List"-Umschaltung in der UI. Die Liste-Sektionen DER Homepage ersetzen die alte ListView-Funktionalität. Wenn User wirklich nur die Chip-Filter-Liste will, geht er auf `/articles/list` (separate Route, rendert weiterhin `ListView.svelte`).
- **Scroll-Layout, kein Bento-Grid.** Sections stacken vertikal (wie `myday/ListView.svelte`). Kein CSS-Grid-Layout mit Bento-Kacheln — das skaliert auf Mobile schlecht und ist optisch lauter. Scroll-Landing bleibt ruhig und funktional.
- **Gleiche Theme-Tokens wie das restliche Mana-UI** (`bg-surface`, `text-muted-foreground` etc.). Kein Reader-Theme hier — die Homepage ist UI, nicht Content. Das unterscheidet sie von DetailView (Reader).
- **Keine Persistenz der Sektions-Reihenfolge.** User kann Sektionen nicht umordnen/ausblenden. Wenn das Bedürfnis entsteht → separates Ticket. Startpunkt ist ein gut kuratiertes fixes Layout.

## View-Struktur

```
┌──────────────────────────────────────────────────┐
│  HEADER                                          │
│  "Artikel"     [+ Neu] [✎ Highlights] [⚙ Settings]
│                                                   │
│  Weiterlesen  (wenn status='reading' existiert) │
│  ┌─────┐ ┌─────┐ ┌─────┐                        │
│  │     │ │     │ │     │  horizontal scroll      │
│  │card │ │card │ │card │  mit Progress-Bar       │
│  └─────┘ └─────┘ └─────┘                        │
│                                                   │
│  Frisch in der Leseliste  (status='unread')      │
│  ┌─────────────────────┐                         │
│  │ Artikel-Karte       │  vertikal, max 8        │
│  └─────────────────────┘                         │
│  ┌─────────────────────┐                         │
│  │ Artikel-Karte       │                         │
│  └─────────────────────┘                         │
│  [ Alle ungelesenen →]                           │
│                                                   │
│  Letzte Highlights  (wenn vorhanden)              │
│  ┌─────────────────────┐                         │
│  │ "…quote text…"      │  max 5                  │
│  │ Artikel-Titel       │                         │
│  └─────────────────────┘                         │
│  [ Alle Highlights → ]                           │
│                                                   │
│  Diese Woche                                      │
│  12 gespeichert · 4 gelesen · 7 min pro Artikel  │
│                                                   │
│  Deine Quellen  (top 5 siteName counts)           │
│  • spiegel.de         14 Artikel                  │
│  • theverge.com        8                          │
│  • …                                              │
│                                                   │
│  Favoriten  (wenn welche markiert)                │
│  ┌─────────────────────┐                         │
│  │ ★ Artikel-Karte     │                         │
│  └─────────────────────┘                         │
│                                                   │
│  Archiv-Link                                      │
│  [ 37 archivierte Artikel → ]                    │
└──────────────────────────────────────────────────┘
```

### Sektionen im Detail

1. **Weiterlesen (Continue Reading)** — nur wenn mindestens ein Artikel mit `status='reading'` existiert. Horizontaler Karussell-Scroll, 3–5 sichtbar auf Desktop. Jede Karte zeigt Titel + Site + `readingProgress` als dünnen Progress-Bar unten. Click → Reader.

2. **Frisch in der Leseliste** — unread Artikel, sortiert `savedAt DESC`, max 8. Wenn mehr → Link „Alle ungelesenen →" der nach `/articles/list?filter=unread` geht.

3. **Letzte Highlights** — max 5 Highlights sortiert `createdAt DESC`, gruppiert per Artikel (ein Eintrag pro Artikel, mit erstem Highlight als Preview und Count falls mehrere). Click → Artikel im Reader. Link „Alle Highlights →" nach `/articles/highlights`.

4. **Diese Woche** (Stats-Strip) — eine Zeile, drei Zahlen: `savedThisWeek`, `finishedThisWeek`, durchschnittliche Lesezeit (`ø readingTimeMinutes` aller unread/reading Artikel). Keine Grafik — eine Text-Zeile.

5. **Deine Quellen** — top 5 `siteName` nach Count, mit Total-Count pro Site. Click auf eine Site → `/articles/list?filter=all&site=<siteName>` (Site-Filter in der ListView neu, siehe „Offene Fragen").

6. **Favoriten** — nur wenn `favorites > 0`. Max 4 Karten. Gleicher Card-Style wie „Frisch".

7. **Archiv-Link** — schlichte Zeile am Ende: „37 archivierte Artikel →". Kein Embedded-Inhalt, reiner Link in die gefilterte ListView.

**Empty-State**: wenn der User 0 Artikel hat → identisch zur aktuellen ListView-Empty-State („Noch nichts gespeichert" + CTA + Hinweis auf Bookmarklet).

## Daten-Queries (alle existieren bereits)

| Sektion | Query | Datei |
|---|---|---|
| Weiterlesen | `useAllArticles()` filtered `status==='reading'` | `queries.ts` |
| Frisch | `useAllArticles()` filtered `status==='unread'`, slice(0,8) | `queries.ts` |
| Highlights | `useAllHighlights()`, slice(0,5) | `queries.ts` |
| Stats-Strip | `useStats()` — direkt `savedThisWeek`, `finishedThisWeek`, `topSites` | `queries.ts` |
| Quellen | `useStats().topSites` | `queries.ts` |
| Favoriten | `useAllArticles()` filtered `isFavorite`, slice(0,4) | `queries.ts` |
| Archiv-Count | `useStats().archived` | `queries.ts` |

Keine neue Query notwendig, nur Views die `$derived` darüberlegen.

## Struktur

```
apps/mana/apps/web/src/lib/modules/articles/
├── HomeView.svelte              ← NEU — Default-Einstieg
├── ListView.svelte              ← bleibt, Fallback für Power-User
├── views/
│   ├── DetailView.svelte        (unverändert)
│   └── HighlightsView.svelte    (unverändert)
└── components/
    ├── HomeSectionWeiterlesen.svelte   ← NEU
    ├── HomeSectionFrisch.svelte        ← NEU
    ├── HomeSectionHighlights.svelte    ← NEU
    ├── HomeSectionStats.svelte         ← NEU
    ├── HomeSectionSources.svelte       ← NEU
    ├── HomeSectionFavorites.svelte     ← NEU
    └── ArticleCard.svelte              ← NEU — geteilte Karte, aus ListView extrahiert
```

Die einzelnen Section-Components sind bewusst klein und isoliert. HomeView ist nur Layout + Section-Orchestration.

**Shared `ArticleCard.svelte`** wird aus der ListView extrahiert (aktuell inline), damit beide Views identisch aussehen.

## Routing

- `/articles` → mountet `HomeView` (war bisher `ListView`)
- `/articles/list` (**neu**) → mountet `ListView` (Fallback-Route für User die die flache Liste wollen)
- `/articles/[id]` (unverändert)
- `/articles/add` (unverändert)
- `/articles/highlights` (unverändert)
- `/articles/settings` (unverändert)

`/articles/list` verlinkt man aus der HomeView via „Alle ungelesenen →" Buttons; direkte URL-Navigation ist der Backup.

## App-Registry-Integration

Neu in `apps/mana/apps/web/src/lib/app-registry/apps.ts` — Articles als draggable Scene-App registrieren:

```typescript
registerApp({
  id: 'articles',
  name: 'Artikel',
  color: '#f97316',
  icon: BookOpen,  // oder BookmarkSimple aus @mana/shared-icons
  views: {
    list: { load: () => import('$lib/modules/articles/HomeView.svelte') },
    detail: { load: () => import('$lib/modules/articles/views/DetailView.svelte') },
  },
  contextMenuActions: [
    {
      id: 'new-article',
      label: 'URL speichern',
      icon: Plus,
      action: () => goto('/articles/add'),
    },
  ],
  collection: 'articles',
  paramKey: 'articleId',
  dragType: 'article',
  getDisplayData: (item) => ({
    title: (item.title as string) || 'Artikel',
    subtitle: item.siteName as string | undefined,
  }),
});
```

Danach ist Articles im Scene-App-Picker verfügbar und User kann „Articles" in jede Workbench-Scene ziehen — dort rendert dann die HomeView statt des Dashboard-Widgets. Das Dashboard-Widget bleibt für den separaten `/dashboard`-Surface.

## UI-Tokens

Alle Sektions-Chrome (Überschriften, Buttons, Cards) nutzt die globalen Theme-Tokens aus `@mana/shared-tailwind`:

- Überschriften: `text-foreground font-semibold text-sm uppercase tracking-wide`
- Cards: `bg-card border-border hover:bg-surface-hover`
- Muted text: `text-muted-foreground`
- Primary-Akzente (Favoriten-Stern, Weiterlesen-Progress): weiterhin Articles-Orange `#f97316` — konsistent mit dem restlichen Modul-Branding

Keine Tailwind-Raw-Farben (`bg-gray-*`, `bg-white/*`). Der pre-existing `validate-theme-tokens.mjs`-Audit darf nicht neu anschlagen.

## Reihenfolge (Milestones)

1. **M9.1 — ArticleCard extrahieren** — bestehende ListView-Card-Logik in `components/ArticleCard.svelte` auslagern, ListView angepasst, keine Verhaltensänderung. *Ziel: keine Regression, nur Refactor.*
2. **M9.2 — HomeView-Skelett + Sektionen** — alle 6 Section-Components neu, HomeView orchestriert. Leere Sektionen werden ausgeblendet (`{#if ...}`). Route `/articles` mountet neu die HomeView.
3. **M9.3 — ListView-Route** — `/articles/list` angelegt, rendert weiterhin die bestehende `ListView.svelte`. „Alle ungelesenen →"-Links aus HomeView linken dorthin.
4. **M9.4 — App-Registry-Eintrag** — Articles in `apps.ts` registriert, Icon ausgewählt, drag-type + getDisplayData. Articles erscheint im Scene-App-Picker.
5. **M9.5 — Site-Filter in ListView** (klein) — ListView bekommt `?site=<siteName>`-Query-Param-Support damit „Deine Quellen"-Links funktionieren. Tag-Filter analog via `?tag=<tagId>` falls nicht schon da.

## Offene Fragen

- **Continue-Reading-Karten Horizontal vs. Vertical**: horizontal-scroll wirkt iOS-Reader-haft, vertical konsistent mit Rest. Ich neige zu horizontal für die Continue-Reading (weil's eine „Carousel of things you started"-Affordanz hat) und vertikal für alles andere. Wenn's zu bunt wird, alles vertikal — wenig Aufwand umzubauen.
- **Sektions-Reihenfolge** — obige Liste ist mein Vorschlag. „Weiterlesen" zuerst fühlt sich richtig an (wie bei Netflix „Continue Watching"). „Frisch" danach. Highlights-Preview als drittes. Alternativ wäre „Frisch" primär wenn kein Weiterlesen da ist — das passiert aber schon durch `{#if}`-Gating.
- **Max-Counts** pro Sektion (8 / 5 / 4) — Bauchgefühl. Bei User-Feedback nachjustieren. Dokumentiert als CONSTANTS-File falls's mal konfigurierbar werden soll.
- **Icon für die App-Registry** — ich würde `BookOpen` oder `BookmarkSimple` aus `@mana/shared-icons` nehmen. Passt zu „Lesen / Später lesen". Abstimmung mit dem aktuellen `APP_ICONS.articles`-SVG (Lesezeichen-Dokument) — konsistent halten.
- **„Site-Filter" URL-Schema**: ListView akzeptiert aktuell nur `?filter=<status>`. Neu brauche ich `?site=<name>` + `?tag=<id>`. Pure Query-Param-Erweiterung in der ListView. Kein neues Routing.
- **Mobile-Layout**: max-width 700px wie DetailView-Meta-Bar? Oder volle Breite mit ggf. 2-Spalten-Grid auf Desktop? Erste Iteration: single-column, 800px max, vertikal. 2-Spalten nur wenn später Bedarf.
