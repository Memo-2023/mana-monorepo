# ManaCore Workspace Orchestrator

> Architektur-Entscheidung für modulares Multi-App-System mit Split-Screen und Drag & Drop

**Status:** Proposal
**Datum:** 2024-12-12
**Autor:** Till Schneider / Claude

---

## Executive Summary

Dieses Dokument beschreibt die Architektur des **ManaCore Workspace Orchestrators** - ein modulares System, das es ermöglicht:

1. Mehrere Apps nebeneinander im Split-Screen anzuzeigen
2. Drag & Drop zwischen Apps zu unterstützen
3. Flexible Deployments mit unterschiedlichen App-Kombinationen zu erstellen
4. Die Anzahl der Apps beliebig zu skalieren

---

## Problemstellung

### Aktuelle Situation

Das ManaCore-Ökosystem besteht aus mehreren unabhängigen SvelteKit-Anwendungen:

| App | Port (Dev) | Domain (Prod) |
|-----|------------|---------------|
| Calendar | 5179 | calendar.mana.how |
| Contacts | 5184 | contacts.mana.how |
| Todo | 5188 | todo.mana.how |
| Chat | 5174 | chat.mana.how |
| Clock | 5187 | clock.mana.how |
| Picture | 5185 | picture.mana.how |

Jede App ist eine **eigenständige SvelteKit-Instanz** mit:
- Eigenem Dev-Server und Production-Build
- Eigener Domain/Subdomain
- Eigenem Backend (NestJS)
- Geteilter Auth über Mana Core Auth (JWT)

### Anforderungen

1. **Split-Screen:** Zwei Apps nebeneinander anzeigen
2. **Drag & Drop:** Elemente zwischen Apps verschieben (z.B. Kontakt auf Kalender droppen)
3. **Modulare Deployments:** Kunde A bekommt nur Calendar+Todo, Kunde B bekommt alles
4. **Skalierbarkeit:** System muss mit 20+ Apps funktionieren
5. **Wartbarkeit:** Neue Apps einfach hinzufügen

### Warum die aktuelle Architektur nicht ausreicht

- **Separate Browser-Tabs:** Kein Drag & Drop zwischen Tabs möglich
- **iFrames:** Drag & Drop über iFrame-Grenzen ist technisch problematisch (CORS, Event-Blocking)
- **Keine geteilte State:** Jede App hat eigenen Svelte-Kontext

---

## Evaluierte Ansätze

### 1. Build-Time Feature Flags

**Konzept:** Zur Build-Zeit konfigurieren welche Apps inkludiert werden.

```bash
ENABLED_APPS=calendar,todo pnpm build
```

**Bewertung:**
- ✅ Minimale Bundle-Size
- ✅ Einfaches Konzept
- ❌ Neuer Build pro Konfiguration nötig
- ❌ Keine dynamische Aktivierung
- ❌ Viele Build-Artefakte zu managen

**Fazit:** Zu unflexibel für unterschiedliche Deployment-Szenarien.

---

### 2. Plugin-Architektur (Runtime Loading)

**Konzept:** Apps als Plugins zur Laufzeit laden.

```typescript
// manifest.json
{
  "apps": [
    { "id": "calendar", "enabled": true, "url": "/plugins/calendar.js" }
  ]
}
```

**Bewertung:**
- ✅ Ein Build, viele Konfigurationen
- ✅ Dynamische Aktivierung möglich
- ❌ Komplexe Plugin-API
- ❌ Versionierung zwischen Plugins
- ❌ Initiale Ladezeit durch viele Chunks

**Fazit:** Guter Ansatz, aber zu komplex für unsere Anforderungen.

---

### 3. Monorepo mit Conditional Exports

**Konzept:** Alle Apps als separate Packages, verschiedene Entry-Points pro Deployment.

```
packages/
├── app-calendar/
├── app-todo/
└── ...

deployments/
├── full/           # Alle Apps
├── productivity/   # Calendar + Todo
└── crm/           # Contacts + Calendar
```

**Bewertung:**
- ✅ Klare Package-Grenzen
- ✅ Gutes Dependency-Management
- ❌ Viele Packages zu maintainen
- ❌ Versionskoordination aufwändig

**Fazit:** Solide, aber zu viel Overhead.

---

### 4. Monolith (Alle Apps in einer SvelteKit-Instanz)

**Konzept:** Alle Apps in eine einzige SvelteKit-App zusammenführen.

```
src/routes/
├── calendar/[...rest]
├── todo/[...rest]
└── contacts/[...rest]
```

**Bewertung:**
- ✅ Triviales Drag & Drop (alles im selben DOM)
- ✅ Gemeinsamer Svelte-Store
- ✅ Einfache Implementierung
- ❌ **Keine flexiblen Deployments möglich**
- ❌ Bundle enthält immer alle Apps
- ❌ Skaliert schlecht bei 20+ Apps
- ❌ Einzelne Apps nicht unabhängig deploybar

**Fazit:** Löst Drag & Drop, aber widerspricht den Modularitäts-Anforderungen.

---

### 5. Micro-Frontend Orchestrator (Gewählt)

**Konzept:** Kombination aus Shell-Anwendung, App-Registry und Build-Optimierung.

**Bewertung:**
- ✅ Flexibel: Build-Time ODER Runtime-Konfiguration
- ✅ Skaliert auf viele Apps
- ✅ Klare Contracts zwischen Apps
- ✅ Drag & Drop ist First-Class-Citizen
- ✅ Code-Splitting out of the box
- ✅ Apps können einzeln oder zusammen deployed werden
- ⚠️ Initialer Setup-Aufwand

**Fazit:** Bester Trade-off zwischen Flexibilität und Komplexität.

---

## Gewählte Architektur: Micro-Frontend Orchestrator

### Architektur-Übersicht

```
┌─────────────────────────────────────────────────────────────┐
│                     Workspace Shell                          │
│  ┌───────────────┬─────────────────┬───────────────────┐    │
│  │  App Registry │   Drag Context  │   Split Router    │    │
│  └───────────────┴─────────────────┴───────────────────┘    │
├─────────────────────────────────────────────────────────────┤
│                      App Manifest                            │
│    { "calendar": {...}, "todo": {...}, "contacts": {...} }   │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐             │
│  │  Calendar  │  │    Todo    │  │  Contacts  │    ...      │
│  │   Module   │  │   Module   │  │   Module   │             │
│  └────────────┘  └────────────┘  └────────────┘             │
│        ↑               ↑               ↑                     │
│        └───────────────┴───────────────┘                     │
│                 Shared Services Layer                        │
│       (Auth, Theme, i18n, API Client, Drag/Drop)            │
└─────────────────────────────────────────────────────────────┘
```

### Kernkomponenten

#### 1. Workspace Shell

Die äußere Hülle, die immer geladen wird:

- **Split-Pane Layout:** Rendert 1-2 App-Panels nebeneinander
- **App Registry:** Kennt alle verfügbaren Apps und ihre Capabilities
- **Drag Context:** Globaler Drag-Layer über allen Panels
- **Navigation:** PillNavigation mit App-Switcher für Split-Screen

#### 2. App Module

Jede App ist ein eigenständiges Modul:

```typescript
interface ManaAppModule {
  // Identifikation
  id: string;           // 'calendar'
  name: string;         // 'Kalender'
  icon: string;         // App-Icon
  color: string;        // Primärfarbe

  // Capabilities
  draggable: DragType[];     // Was kann aus dieser App gedraggt werden?
  droppable: DropHandler[];  // Was kann diese App empfangen?

  // UI
  component: SvelteComponent;  // Haupt-Komponente
  routes: RouteDefinition[];   // Interne Routes

  // Optional
  toolbar?: SvelteComponent;   // App-spezifische Toolbar
  quickActions?: QuickAction[]; // Für QuickInputBar
}
```

#### 3. Drag & Drop Registry

Zentrale Koordination für Cross-App Drag & Drop:

```typescript
// Drag-Types die Apps exportieren können
type DragType =
  | 'contact'      // Kontakt-Karte
  | 'event'        // Kalender-Event
  | 'task'         // Todo-Task
  | 'file'         // Datei
  | 'note';        // Notiz

// Drop-Handler die Apps registrieren
interface DropHandler {
  accepts: DragType[];
  zone: 'panel' | 'specific';  // Ganzes Panel oder spezifische Bereiche
  onDrop: (item: DragItem, target: DropTarget) => void;
  preview?: (item: DragItem) => SvelteComponent;
}
```

#### 4. Deployment-Konfiguration

```typescript
// manacore.config.ts
export default defineWorkspace({
  // Welche Apps in diesem Build?
  apps: ['calendar', 'todo', 'contacts'],

  // Wie werden Apps geladen?
  loadStrategy: 'lazy',  // 'eager' | 'lazy' | 'on-demand'

  // Feature-Flags pro App
  features: {
    calendar: {
      views: ['week', 'month', 'agenda'],
      sharing: true,
      recurring: true,
    },
    todo: {
      projects: true,
      labels: true,
      recurring: false,
    },
    contacts: {
      import: true,
      export: true,
      googleSync: false,
    }
  },

  // Erlaubte Drag & Drop Verbindungen
  connections: [
    { from: 'contacts.contact', to: 'calendar.attendee' },
    { from: 'contacts.contact', to: 'todo.assignee' },
    { from: 'calendar.event', to: 'todo.task' },
    { from: 'todo.task', to: 'calendar.event' },
  ],

  // Default Split-Screen Konfiguration
  defaultLayout: {
    primary: 'calendar',
    secondary: null,  // Kein Split-Screen als Default
  }
});
```

### Build-Output

```
dist/
├── shell.js              # Workspace Shell (~50KB)
├── shared.js             # Shared Services (~100KB)
├── manifest.json         # App-Konfiguration
└── apps/
    ├── calendar.js       # Calendar Module (lazy)
    ├── calendar.css
    ├── todo.js           # Todo Module (lazy)
    ├── todo.css
    ├── contacts.js       # Contacts Module (lazy)
    └── contacts.css
```

### Split-Screen URL-Schema

```
/workspace                           # Single App (Default)
/workspace?app=calendar              # Calendar alleine
/workspace?left=calendar&right=todo  # Split-Screen
/workspace?left=calendar&right=todo&split=60  # 60/40 Split
```

---

## Drag & Drop Implementierung

### Globaler Drag-Layer

```svelte
<!-- WorkspaceShell.svelte -->
<div class="workspace">
  <!-- App Panels -->
  <div class="panels">
    <AppPanel app={leftApp} />
    {#if rightApp}
      <Divider />
      <AppPanel app={rightApp} />
    {/if}
  </div>

  <!-- Globaler Drag Overlay (über allen Panels) -->
  <DragOverlay />
</div>
```

### Drag-Flow

1. **Drag Start:** App signalisiert Drag mit Type und Payload
2. **Drag Move:** Element wird im globalen Overlay gerendert
3. **Drag Over:** Drop-Zonen in allen Apps highlighten
4. **Drop:** Ziel-App erhält Payload und verarbeitet ihn

### Beispiel: Kontakt auf Kalender droppen

```typescript
// Contacts App registriert Draggable
ContactsModule.draggable = [{
  type: 'contact',
  getData: (contact) => ({
    id: contact.id,
    name: contact.displayName,
    email: contact.email,
  }),
  preview: ContactDragPreview,
}];

// Calendar App registriert Drop-Handler
CalendarModule.droppable = [{
  accepts: ['contact'],
  zone: 'event-form',  // Nur in Event-Formularen
  onDrop: (item) => {
    // Kontakt als Teilnehmer hinzufügen
    addAttendee({
      name: item.data.name,
      email: item.data.email,
    });
  },
}];
```

---

## Deployment-Szenarien

### Szenario 1: Vollversion (SaaS)

```typescript
// manacore.config.ts
apps: ['calendar', 'todo', 'contacts', 'chat', 'files', 'notes', ...]
```

Alle Apps verfügbar, User kann Split-Screen frei konfigurieren.

### Szenario 2: Produktivitäts-Suite

```typescript
// productivity.config.ts
apps: ['calendar', 'todo', 'notes']
features: {
  calendar: { sharing: false },  // Keine Team-Features
}
```

Fokussiertes Bundle für Einzelnutzer.

### Szenario 3: CRM-Paket

```typescript
// crm.config.ts
apps: ['contacts', 'calendar', 'tasks']
connections: [
  { from: 'contacts.contact', to: 'calendar.attendee' },
  { from: 'contacts.contact', to: 'tasks.assignee' },
]
```

Kontakt-zentriertes Bundle mit relevanten Verknüpfungen.

### Szenario 4: Single-App (Legacy-Kompatibilität)

```typescript
// calendar-only.config.ts
apps: ['calendar']
features: {
  splitScreen: false,  // Kein Split-Screen UI
}
```

Einzelne App wie bisher, für Migration bestehender User.

---

## Warum nicht Monolith?

Der Monolith-Ansatz (alle Apps in einer SvelteKit-Instanz) wurde bewusst **nicht gewählt**, obwohl er Drag & Drop trivial machen würde:

| Kriterium | Monolith | Orchestrator |
|-----------|----------|--------------|
| Drag & Drop | Trivial | Erfordert Koordination |
| Bundle-Size | Immer alles | Nur aktivierte Apps |
| Flexible Deployments | Nicht möglich | Beliebig konfigurierbar |
| App-Unabhängigkeit | Keine | Vollständig |
| Skalierung (20+ Apps) | Problematisch | Kein Problem |
| Build-Zeit | Wächst mit jeder App | Konstant pro App |
| Team-Arbeit | Merge-Konflikte | Unabhängige Entwicklung |

**Kernargument:** Bei wachsender App-Anzahl wird der Monolith unwartbar. Der Orchestrator skaliert linear, der Monolith exponentiell (in Komplexität).

---

## Migrations-Strategie

### Phase 1: Workspace Shell erstellen

- Neue App: `apps/workspace`
- Implementiert Shell, Registry, Drag-Layer
- Kann bestehende Apps als "Legacy iFrames" einbetten (Fallback)

### Phase 2: App-Module extrahieren

- Calendar, Todo, Contacts als Module refactoren
- Gemeinsame Komponenten in Shared Services
- Drag & Drop Contracts definieren

### Phase 3: Schrittweise Migration

- Eine App nach der anderen in Orchestrator integrieren
- Parallelbetrieb: Standalone + Workspace
- Alte Standalone-Deployments weiter unterstützen

### Phase 4: Neue Apps als Module

- Alle neuen Apps direkt als Module entwickeln
- Einheitliche App-Template verwenden

---

## Offene Fragen

1. **Routing:** Wie verhalten sich Deep-Links im Split-Screen?
2. **State-Sync:** Sollen Apps Änderungen in Echtzeit sehen?
3. **Mobile:** Split-Screen nur Desktop oder auch Tablet?
4. **Keyboard-Navigation:** Wie wechselt Fokus zwischen Panels?
5. **Undo/Redo:** Global oder pro Panel?

---

## Nächste Schritte

1. [ ] Workspace Shell Proof-of-Concept
2. [ ] Drag & Drop Registry implementieren
3. [ ] Calendar als erstes Modul migrieren
4. [ ] Split-Screen Layout mit Resize
5. [ ] Deployment-Pipeline anpassen

---

## Referenzen

- [Module Federation](https://webpack.js.org/concepts/module-federation/)
- [Micro Frontends](https://micro-frontends.org/)
- [Svelte Context API](https://svelte.dev/docs#run-time-svelte-setcontext)
- [HTML Drag and Drop API](https://developer.mozilla.org/en-US/docs/Web/API/HTML_Drag_and_Drop_API)
