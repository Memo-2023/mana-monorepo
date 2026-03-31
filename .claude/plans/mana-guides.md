# mana guides — Implementation Plan

## Concept

Guides ist eine **Playbook-App**: jeder Guide ist gleichzeitig eine schöne Karte zum Entdecken
(Bibliothek), ein ausführbarer Prozess mit Ausführungshistorie (Executer) und ein Baustein in
strukturierten Lernpfaden (Teacher). Drei Konzepte, ein konsistentes Datenmodell.

**Positionierung:** Zwischen context (freie Dokumente) und todo (Tasks). Guides sind
strukturierte, ausführbare Schritt-für-Schritt-Anleitungen.

---

## Architektur-Entscheidungen

| Thema | Entscheidung | Begründung |
|-------|-------------|------------|
| Stack | SvelteKit 5 + Svelte Runes + Tailwind | Ecosystem-Standard |
| Daten | Local-first (Dexie.js + mana-sync) | Kein Server für MVP, offline-fähig |
| Server | Kein MVP-Server | Phase 2: Web-Import via mana-search, Sharing |
| Auth | mana-core-auth, allowGuest=true | Guides funktionieren als Gast |
| Tier | beta | Entwicklungsphase |
| Port | 5200 | Nächster freier Port nach calc (5198) |
| Farbe | #0d9488 (teal) | Einzigartig im Ecosystem |
| Subdomain | guides.mana.how | |

---

## Datenmodell

Alle Collections local-first via `createLocalStore()`, 5 Collections:

```typescript
LocalGuide {
  id, title, description?, coverEmoji?, coverColor?,
  category, difficulty: 'easy'|'medium'|'hard',
  estimatedMinutes?, tags: string[],
  collectionId?,       // Zugehörigkeit zu einer Collection
  orderInCollection?,
  xpReward?,           // skilltree bridge (optional)
  skillId?,
  createdAt, updatedAt, deletedAt  // BaseRecord
}

LocalSection {
  id, guideId, title, order
}

LocalStep {
  id, guideId, sectionId?,
  order, title, content?,   // markdown
  type: 'instruction'|'warning'|'tip'|'checkpoint'|'code',
  checkable: boolean
}

LocalCollection {
  id, title, description?, coverEmoji?, coverColor?,
  type: 'path'|'library',   // path=geordnet, library=ungeordnet
  guideOrder: string[]       // geordnete Guide-IDs für paths
}

LocalRun {
  id, guideId,
  startedAt, completedAt?,
  mode: 'scroll'|'focus',
  stepStates: Record<stepId, { done: boolean; doneAt?: string; notes?: string }>
}
```

---

## Route-Struktur

```
apps/guides/apps/web/src/routes/
  +layout.svelte                        root: auth init, theme, i18n
  (app)/
    +layout.svelte                      auth gate, nav, FAB
    +page.svelte                        Bibliothek: Grid aller Guides
    guide/
      [id]/
        +page.svelte                    Guide-Detail: Sections, Steps, Run starten
        run/
          +page.svelte                  Run-Modus: Scroll oder Fokus
    collections/
      +page.svelte                      Collections-Liste
      [id]/
        +page.svelte                    Collection-Detail / Pfad-View
    history/
      +page.svelte                      Alle Runs, Ausführungshistorie
  (auth)/
    login/+page.svelte
    register/+page.svelte
    forgot-password/+page.svelte
    reset-password/+page.svelte
```

---

## UI-Konzept

### Bibliothek (Hauptansicht)
- Masonry- oder gleichmäßiges Grid mit Guide-Karten
- Karte zeigt: Emoji/Color, Titel, Kategorie, Schwierigkeit (⭐), Zeit, Run-Status-Ring
- Filter: Kategorie / Schwierigkeit / Status (Neu/Aktiv/Abgeschlossen)
- FAB: "Guide erstellen"

### Guide-Karte Status-Indikator
```
○ Neu         (nie ausgeführt)
◑ Aktiv       (laufender Run)
● Abgeschlossen (letzter Run fertig)
⟳ Wiederholt  (3+ Runs = SOP-Indikator)
```

### Run-Modi
**Scroll-Modus** (Tutorials, Anleitungen):
- Alle Steps sichtbar, fortlaufend scrollbar
- Erledigte Steps werden durchgestrichen/grün
- Fortschrittsbalken oben

**Fokus-Modus** (SOPs, Routinen):
- Ein Step fullscreen
- Großer "Abschließen"-Button
- Notiz hinzufügen möglich
- Navigation: Zurück / Weiter

### Collections / Pfad-View
- `path`-Collections: sequentielle Ansicht mit Fortschrittsbalken, XP-Belohnung
- `library`-Collections: Themed Kochbuch-Stil, ungeordneter Grid

---

## Phasen

### Phase 1 — MVP (jetzt implementiert) ✓
- [x] Monorepo-Skelett (package.json, config-files)
- [x] Local-Store (5 Collections)
- [x] Guest-Seed (3 Demo-Guides)
- [x] Root-Layout + Auth-Layout
- [x] Bibliothek-View (+page.svelte)
- [x] Guide-Detail-View
- [x] Run-Modus (Scroll + Fokus)
- [x] Collections-View
- [x] Verlauf-View
- [x] GuideCard-Komponente
- [x] GuideEditModal
- [x] RunView-Komponente
- [x] Registrierung in mana-apps.ts + app-icons.ts

### Phase 2 — Web-Import & Sharing
- [ ] Hono/Bun-Server (apps/guides/apps/server/)
- [ ] Web-Import: URL → Guide via mana-search
- [ ] Guide-Export: JSON / Markdown
- [ ] Guide-Sharing (öffentliche Guides)
- [ ] QR-Code für Guide-Sharing

### Phase 3 — KI & Integration
- [ ] KI-Guide-Generator: Text/Paste → strukturierter Guide via mana-llm
- [ ] skilltree-XP-Bridge (completedRun → XP-Event)
- [ ] calendar-Integration: Guide als Kalender-Event einplanen
- [ ] todo-Integration: Guide-Schritt als Task erstellen

### Phase 4 — Community
- [ ] Öffentliche Guide-Bibliothek (community guides)
- [ ] Guide-Bewertungen und Kommentare
- [ ] Guide-Templates (Starter-Vorlagen)

---

## Dateien

```
apps/guides/
├── package.json
└── apps/
    └── web/
        ├── package.json
        ├── svelte.config.js
        ├── vite.config.ts
        ├── tsconfig.json
        ├── src/
        │   ├── app.html
        │   ├── app.css
        │   ├── app.d.ts
        │   ├── hooks.client.ts
        │   ├── lib/
        │   │   ├── data/
        │   │   │   ├── local-store.ts
        │   │   │   └── guest-seed.ts
        │   │   ├── stores/
        │   │   │   ├── auth.svelte.ts
        │   │   │   ├── guides.svelte.ts
        │   │   │   └── runs.svelte.ts
        │   │   └── components/
        │   │       ├── GuideCard.svelte
        │   │       ├── GuideEditModal.svelte
        │   │       ├── StepEditor.svelte
        │   │       └── RunView.svelte
        │   └── routes/
        │       ├── +layout.svelte
        │       ├── (app)/
        │       │   ├── +layout.svelte
        │       │   ├── +page.svelte
        │       │   ├── guide/[id]/
        │       │   │   ├── +page.svelte
        │       │   │   └── run/+page.svelte
        │       │   ├── collections/
        │       │   │   ├── +page.svelte
        │       │   │   └── [id]/+page.svelte
        │       │   └── history/+page.svelte
        │       └── (auth)/
        │           ├── login/+page.svelte
        │           ├── register/+page.svelte
        │           ├── forgot-password/+page.svelte
        │           └── reset-password/+page.svelte

Registrierung:
  packages/shared-branding/src/app-icons.ts  → guidesSvg + APP_ICONS.guides
  packages/shared-branding/src/mana-apps.ts  → MANA_APPS entry + APP_URLS entry
```

---

## Abgrenzung zu bestehenden Apps

| App | Überlappung | Abgrenzung |
|-----|-------------|------------|
| context | Dokumente, Wissen | context = freie Dokumente, guides = strukturierte Ausführung |
| todo | Aufgaben, Checklisten | todo = Tasks, guides = Prozesse mit History |
| questions | Recherche | questions = Q&A, guides = How-To |
| manadeck | Lernen | manadeck = Karteikarten/Spaced-Repetition, guides = Schritt-für-Schritt |
| skilltree | Skill-Progression | skilltree = XP-Tracking, guides = Quelle von XP (optional) |
