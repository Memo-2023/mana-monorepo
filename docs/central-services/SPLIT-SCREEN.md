# Split-Screen Feature

Das Split-Screen Feature ermöglicht es, zwei Mana-Apps nebeneinander in einem Browser-Tab anzuzeigen. Die rechte App wird dabei in einem iFrame eingebettet.

## Übersicht

| Aspekt | Details |
|--------|---------|
| **Package** | `@manacore/shared-splitscreen` |
| **Integrierte Apps** | Calendar, Todo, Contacts |
| **Aktivierung** | Split-Button in App-Dropdown oder Ctrl/Cmd+Klick |
| **Persistenz** | URL-Parameter + localStorage |
| **Mobile** | Automatisch deaktiviert (<1024px) |

## Architektur

```
┌─────────────────────────────────────────────────────────────────┐
│                     SplitPaneContainer                          │
├─────────────────────────┬───────┬───────────────────────────────┤
│                         │       │                               │
│      Main Panel         │ ║ ║ ║ │        Side Panel             │
│    (aktuelle App)       │ ║ ║ ║ │     (iFrame mit App)          │
│                         │ ║ ║ ║ │                               │
│   ┌─────────────────┐   │ Resize│   ┌─────────────────────────┐ │
│   │ PillNavigation  │   │ Handle│   │      AppPanel           │ │
│   └─────────────────┘   │       │   │  ┌─────────────────────┐│ │
│                         │       │   │  │  PanelControls      ││ │
│   ┌─────────────────┐   │       │   │  │  [Swap] [Close]     ││ │
│   │     Content     │   │       │   │  └─────────────────────┘│ │
│   │                 │   │       │   │                         │ │
│   │                 │   │       │   │  ┌─────────────────────┐│ │
│   │                 │   │       │   │  │                     ││ │
│   │                 │   │       │   │  │     <iframe>        ││ │
│   │                 │   │       │   │  │                     ││ │
│   │                 │   │       │   │  └─────────────────────┘│ │
│   └─────────────────┘   │       │   └─────────────────────────┘ │
│                         │       │                               │
└─────────────────────────┴───────┴───────────────────────────────┘
```

## Package-Struktur

```
packages/shared-splitscreen/
├── src/
│   ├── index.ts                    # Barrel exports
│   ├── types.ts                    # TypeScript types
│   ├── stores/
│   │   └── split-panel.svelte.ts   # Svelte 5 runes store mit Context API
│   ├── components/
│   │   ├── SplitPaneContainer.svelte  # Haupt-Layout (CSS Grid)
│   │   ├── AppPanel.svelte            # iFrame-Container
│   │   ├── PanelControls.svelte       # Swap/Close Buttons
│   │   └── ResizeHandle.svelte        # Draggable Divider
│   └── utils/
│       ├── url-state.ts            # URL-Persistenz (?panel=todo&split=60)
│       ├── local-storage.ts        # localStorage-Persistenz
│       └── index.ts                # Utils barrel
├── package.json
└── tsconfig.json
```

## Komponenten

### SplitPaneContainer

Haupt-Container mit CSS Grid Layout.

```svelte
<script>
  import { SplitPaneContainer, setSplitPanelContext, DEFAULT_APPS } from '@manacore/shared-splitscreen';

  // Context initialisieren
  const splitPanel = setSplitPanelContext('calendar', DEFAULT_APPS);
</script>

<SplitPaneContainer>
  <!-- Dein App-Content -->
  <slot />
</SplitPaneContainer>
```

**CSS Grid:**
- Ohne Split: `grid-template-columns: 1fr`
- Mit Split: `grid-template-columns: {dividerPos}% 6px 1fr`

### AppPanel

iFrame-Container mit Loading/Error States.

**iFrame Sandbox Permissions:**
```typescript
const sandboxPermissions = [
  'allow-same-origin',     // Für localStorage/Cookie-Zugriff
  'allow-scripts',         // JavaScript ausführen
  'allow-forms',           // Formulare absenden
  'allow-popups',          // Popups öffnen
  'allow-popups-to-escape-sandbox',
  'allow-storage-access-by-user-activation',
];
```

### ResizeHandle

Draggable Divider für Panel-Größenanpassung.

**Features:**
- Maus- und Touch-Support
- Tastatur-Navigation (Pfeiltasten)
- Doppelklick = Reset auf 50%
- Constraints: 20% - 80%

**Accessibility:**
```svelte
<div
  role="separator"
  aria-orientation="vertical"
  aria-valuenow={position}
  aria-valuemin={20}
  aria-valuemax={80}
  tabindex="0"
/>
```

### PanelControls

Overlay mit Swap- und Close-Buttons.

- **Swap:** Navigiert zur App im rechten Panel (window.location.href)
- **Close:** Schließt das Split-Panel

## Store API

### Initialisierung

```typescript
import { setSplitPanelContext, DEFAULT_APPS } from '@manacore/shared-splitscreen';

// Im Layout-Component (z.B. +layout.svelte)
const splitPanel = setSplitPanelContext('calendar', DEFAULT_APPS);

// In onMount initialisieren (lädt URL/localStorage State)
onMount(() => {
  splitPanel.initialize();
});
```

### Store Interface

```typescript
interface SplitPanelStore {
  // State (readonly)
  readonly isActive: boolean;           // Split-Modus aktiv?
  readonly rightPanel: PanelConfig | null;  // Rechtes Panel
  readonly dividerPosition: number;     // Position in % (20-80)
  readonly isMobile: boolean;           // Mobile Breakpoint erreicht?
  readonly availableApps: AppDefinition[];  // Verfügbare Apps (ohne aktuelle)

  // Actions
  openPanel: (appId: string, path?: string) => void;
  closePanel: () => void;
  swapPanels: () => void;
  setDividerPosition: (position: number) => void;
  resetDividerPosition: () => void;
  initialize: () => void;
}
```

### Context-Zugriff

```typescript
import { getSplitPanelContext } from '@manacore/shared-splitscreen';

// In Child-Components
const splitPanel = getSplitPanelContext();
```

## Verfügbare Apps

Standard-Konfiguration in `DEFAULT_APPS`:

| App | ID | Port | Farbe |
|-----|----|------|-------|
| Calendar | `calendar` | 5179 | #3b82f6 |
| Todo | `todo` | 5188 | #10b981 |
| Contacts | `contacts` | 5184 | #8b5cf6 |
| Clock | `clock` | 5187 | #f59e0b |

## Persistenz

### URL-State

```
https://calendar.app/?panel=todo&split=60
```

- `panel`: App-ID des rechten Panels
- `split`: Divider-Position in % (nur wenn ≠ 50)

### localStorage

```typescript
// Key: manacore-splitscreen-{appId}
{
  "version": 1,
  "state": {
    "dividerPosition": 60,
    "rightPanel": {
      "appId": "todo",
      "url": "http://localhost:5188/",
      "name": "Todo"
    }
  }
}
```

**Priorität:** URL > localStorage

## Integration in Apps

### 1. Dependency hinzufügen

```json
// package.json
{
  "dependencies": {
    "@manacore/shared-splitscreen": "workspace:*"
  }
}
```

### 2. Layout anpassen

```svelte
<!-- +layout.svelte -->
<script lang="ts">
  import { onMount } from 'svelte';
  import { PillNavigation } from '@manacore/shared-ui';
  import {
    SplitPaneContainer,
    setSplitPanelContext,
    DEFAULT_APPS,
  } from '@manacore/shared-splitscreen';

  // Split-Panel Store initialisieren
  const splitPanel = setSplitPanelContext('calendar', DEFAULT_APPS);

  // Handler für Split-Panel Öffnung
  function handleOpenInPanel(appId: string, url: string) {
    splitPanel.openPanel(appId);
  }

  onMount(() => {
    splitPanel.initialize();
  });
</script>

<SplitPaneContainer>
  <div class="layout-container">
    <PillNavigation
      {...props}
      onOpenInPanel={handleOpenInPanel}
    />

    <main>
      {@render children()}
    </main>
  </div>
</SplitPaneContainer>
```

### 3. PillNavigation Props

Die `PillNavigation`-Komponente unterstützt automatisch:

- **Split-Button:** Erscheint bei jedem App-Item im Dropdown
- **Modifier-Key Detection:** Ctrl/Cmd+Klick öffnet im Split-Panel

```typescript
// Neues Prop für PillNavigation
onOpenInPanel?: (appId: string, url: string) => void;
```

## Mobile Verhalten

Split-Screen ist auf mobilen Geräten deaktiviert:

```typescript
const MOBILE_BREAKPOINT = 1024; // px

// Automatische Prüfung bei Resize
window.addEventListener('resize', () => {
  if (window.innerWidth < MOBILE_BREAKPOINT && isActive) {
    closePanel();
  }
});
```

**CSS Fallback:**
```css
@media (max-width: 1023px) {
  .split-pane-container {
    grid-template-columns: 1fr !important;
  }
  .side-panel,
  .resize-handle {
    display: none;
  }
}
```

## Constraints

| Constraint | Wert |
|------------|------|
| Min. Divider Position | 20% |
| Max. Divider Position | 80% |
| Default Position | 50% |
| Mobile Breakpoint | 1024px |
| Resize Handle Breite | 6px |

## Bekannte Einschränkungen

1. **Keine Cross-App Kommunikation:** Apps im iFrame können nicht direkt kommunizieren
2. **Separate Auth Sessions:** Jede App hat ihre eigene Session (funktioniert wegen shared localStorage)
3. **Kein Drag & Drop zwischen Apps:** Feature wurde bewusst nicht implementiert
4. **Performance:** iFrame lädt komplette App, kann bei langsamen Verbindungen spürbar sein

## Zukünftige Erweiterungen

- [ ] postMessage API für Cross-App Events
- [ ] Mehr als 2 Panels
- [ ] Panel Templates / Presets
- [ ] Keyboard Shortcuts (Cmd+\ zum Togglen)
- [ ] Panel-Position speichern per App-Kombination

## Debugging

### DevTools

```javascript
// State prüfen
const store = getSplitPanelContext();
console.log({
  isActive: store.isActive,
  rightPanel: store.rightPanel,
  dividerPosition: store.dividerPosition,
  isMobile: store.isMobile,
});

// Manuell öffnen
store.openPanel('todo');

// Manuell schließen
store.closePanel();
```

### URL testen

```
# Todo im Split öffnen
http://localhost:5179/?panel=todo

# Mit angepasster Position
http://localhost:5179/?panel=contacts&split=70
```

### localStorage löschen

```javascript
localStorage.removeItem('manacore-splitscreen-calendar');
localStorage.removeItem('manacore-splitscreen-todo');
localStorage.removeItem('manacore-splitscreen-contacts');
```
