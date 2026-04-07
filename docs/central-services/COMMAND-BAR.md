# Central Command Bar

Die zentrale Command Bar bietet eine einheitliche Schnellsuche und Navigation über alle Mana-Apps hinweg. Sie wird mit `Cmd/Ctrl+K` aktiviert und bietet Suche, Quick Actions und Tastatur-Navigation.

## Architektur

```
┌─────────────────────────────────────────────────────────────┐
│                 @mana/shared-ui                         │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  CommandBar.svelte                                   │   │
│  │  - Suche mit Debounce (150ms)                       │   │
│  │  - Quick Actions                                     │   │
│  │  - Tastatur-Navigation                               │   │
│  │  - Ergebnis-Anzeige mit Avataren                    │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                             │
        ┌────────────────────┼────────────────────┐
        │                    │                    │
   ┌────▼────┐         ┌─────▼────┐        ┌─────▼────┐
   │  Todo   │         │ Calendar │        │ Contacts │
   │         │         │          │        │          │
   │ Sucht   │         │ Sucht    │        │ Sucht    │
   │ Tasks   │         │ Events   │        │ Kontakte │
   └─────────┘         └──────────┘        └──────────┘
```

## Package

| Package | Beschreibung |
|---------|--------------|
| `@mana/shared-ui` | CommandBar Svelte-Komponente + TypeScript-Typen |

## Keyboard Shortcut

| Shortcut | Aktion |
|----------|--------|
| `Cmd/Ctrl+K` | Command Bar öffnen |
| `↑↓` | Navigation durch Ergebnisse |
| `Enter` | Auswahl bestätigen |
| `Escape` | Schließen |

## TypeScript Interfaces

### CommandBarItem

Ein Suchergebnis:

```typescript
interface CommandBarItem {
  id: string;           // Eindeutige ID
  title: string;        // Haupttext (z.B. Name, Titel)
  subtitle?: string;    // Untertitel (z.B. Datum, E-Mail)
  icon?: string;        // Icon-Name
  imageUrl?: string;    // Avatar/Bild URL
  isFavorite?: boolean; // Favorit-Markierung (zeigt Herz-Icon)
}
```

### QuickAction

Eine Schnellaktion (ohne Suche):

```typescript
interface QuickAction {
  id: string;           // Eindeutige ID
  label: string;        // Anzeigetext
  icon: string;         // Icon-Name
  href?: string;        // Link-Ziel (optional)
  shortcut?: string;    // Tastenkürzel-Anzeige
  onclick?: () => void; // Click-Handler (alternativ zu href)
}
```

### Unterstützte Icons

Die CommandBar unterstützt folgende eingebaute Icons:

| Icon-Name | Beschreibung |
|-----------|--------------|
| `plus` | Plus-Zeichen (Neu erstellen) |
| `heart` | Herz (Favoriten) |
| `tag` | Tag/Label |
| `upload` | Upload (Import) |
| `calendar` | Kalender |
| `clock` | Uhr |
| `check` | Häkchen |
| `settings` | Zahnrad (Einstellungen) |
| `list` | Liste |

## Komponenten-Props

```typescript
interface Props {
  open: boolean;                               // Sichtbarkeit
  onClose: () => void;                        // Schließen-Handler
  onSearch: (query: string) => Promise<CommandBarItem[]>;  // Such-Funktion
  onSelect: (item: CommandBarItem) => void;   // Auswahl-Handler
  quickActions?: QuickAction[];               // Schnellaktionen
  placeholder?: string;                       // Suchfeld-Placeholder
  emptyText?: string;                         // Text bei leeren Ergebnissen
  searchingText?: string;                     // Text während Suche
}
```

## Nutzung

### Basis-Beispiel

```svelte
<script lang="ts">
  import { goto } from '$app/navigation';
  import { CommandBar } from '@mana/shared-ui';
  import type { CommandBarItem, QuickAction } from '@mana/shared-ui';

  let commandBarOpen = $state(false);

  // Quick Actions definieren
  const quickActions: QuickAction[] = [
    { id: 'new', label: 'Neu erstellen', icon: 'plus', href: '/new', shortcut: 'N' },
    { id: 'settings', label: 'Einstellungen', icon: 'settings', href: '/settings' },
  ];

  // Such-Funktion implementieren
  async function handleSearch(query: string): Promise<CommandBarItem[]> {
    const results = await api.search(query);
    return results.map((item) => ({
      id: item.id,
      title: item.name,
      subtitle: item.description,
    }));
  }

  // Auswahl verarbeiten
  function handleSelect(item: CommandBarItem) {
    goto(`/item/${item.id}`);
  }

  // Keyboard Shortcut registrieren
  function handleKeydown(event: KeyboardEvent) {
    if ((event.ctrlKey || event.metaKey) && event.key === 'k') {
      event.preventDefault();
      commandBarOpen = true;
    }
  }
</script>

<svelte:window onkeydown={handleKeydown} />

<CommandBar
  bind:open={commandBarOpen}
  onClose={() => (commandBarOpen = false)}
  onSearch={handleSearch}
  onSelect={handleSelect}
  {quickActions}
  placeholder="Suchen..."
  emptyText="Keine Ergebnisse"
  searchingText="Suche..."
/>
```

## App-spezifische Implementierungen

### Todo App

```typescript
// Quick Actions
const quickActions: QuickAction[] = [
  { id: 'new', label: 'Neue Aufgabe erstellen', icon: 'plus', href: '/task/new', shortcut: 'N' },
  { id: 'kanban', label: 'Kanban-Board', icon: 'list', href: '/kanban' },
  { id: 'stats', label: 'Statistiken', icon: 'chart', href: '/statistics' },
  { id: 'settings', label: 'Einstellungen', icon: 'settings', href: '/settings' },
];

// Suche: Tasks durchsuchen
async function handleSearch(query: string): Promise<CommandBarItem[]> {
  const tasks = await getTasks({ search: query });
  return tasks.slice(0, 10).map((task) => ({
    id: task.id,
    title: task.title,
    subtitle: task.isCompleted
      ? '✓ Erledigt'
      : task.dueDate
        ? new Date(task.dueDate).toLocaleDateString('de-DE')
        : 'Kein Datum',
  }));
}

// Auswahl: Zu Task navigieren
function handleSelect(item: CommandBarItem) {
  goto(`/task/${item.id}`);
}
```

### Calendar App

```typescript
// Quick Actions
const quickActions: QuickAction[] = [
  { id: 'new', label: 'Neuen Termin erstellen', icon: 'plus', href: '/event/new', shortcut: 'N' },
  { id: 'today', label: 'Zu Heute springen', icon: 'calendar', onclick: () => viewStore.goToToday() },
  { id: 'agenda', label: 'Agenda anzeigen', icon: 'list', href: '/agenda' },
  { id: 'settings', label: 'Einstellungen', icon: 'settings', href: '/settings' },
];

// Suche: Events durchsuchen
async function handleSearch(query: string): Promise<CommandBarItem[]> {
  const result = await searchEvents(query);
  if (result.error || !result.data) return [];

  return result.data.slice(0, 10).map((event) => ({
    id: event.id,
    title: event.title,
    subtitle: format(new Date(event.startTime), 'dd. MMM yyyy, HH:mm', { locale: de }),
  }));
}

// Auswahl: Zu Event navigieren
function handleSelect(item: CommandBarItem) {
  goto(`/event/${item.id}`);
}
```

### Contacts App

```typescript
// Quick Actions
const quickActions: QuickAction[] = [
  { id: 'new', label: 'Neuen Kontakt erstellen', icon: 'plus', href: '/contacts/new', shortcut: 'N' },
  { id: 'favorites', label: 'Favoriten anzeigen', icon: 'heart', href: '/favorites' },
  { id: 'tags', label: 'Tags verwalten', icon: 'tag', href: '/tags' },
  { id: 'import', label: 'Kontakte importieren', icon: 'upload', href: '/data?tab=import' },
];

// Suche: Kontakte durchsuchen
async function handleSearch(query: string): Promise<CommandBarItem[]> {
  const response = await contactsApi.list({ search: query, limit: 10 });
  return (response.contacts || []).map((contact) => ({
    id: contact.id,
    title: contact.displayName ||
           [contact.firstName, contact.lastName].filter(Boolean).join(' ') ||
           contact.email || 'Unbekannt',
    subtitle: contact.company || contact.email,
    imageUrl: contact.photoUrl,
    isFavorite: contact.isFavorite,
  }));
}

// Auswahl: Kontakt-Modal öffnen
function handleSelect(item: CommandBarItem) {
  goto(`/contacts/${item.id}`);
}
```

## Funktionen

### Suche

- **Debounce:** 150ms Verzögerung für Performance
- **Loading-State:** Spinner während der Suche
- **Empty State:** Konfigurierbare Meldung bei keinen Ergebnissen
- **Limit:** Ergebnisse werden typischerweise auf 10 begrenzt

### Quick Actions

Wenn kein Suchtext eingegeben ist, werden Quick Actions angezeigt:

- Navigation mit Pfeiltasten
- Ausführung mit Enter
- Keyboard-Shortcuts werden rechts angezeigt

### Ergebnis-Anzeige

- **Avatar:** Bild oder Initialen
- **Titel:** Haupttext
- **Untertitel:** Zusatzinfo (grau)
- **Favorit:** Herz-Icon wenn `isFavorite: true`
- **Hover:** Visuelles Feedback bei Maus-Over

### Keyboard Navigation

| Taste | Aktion |
|-------|--------|
| `↑` / `↓` | Durch Ergebnisse navigieren |
| `Enter` | Ausgewähltes Element öffnen |
| `Escape` | Command Bar schließen |

## Styling

Die Command Bar verwendet ein dunkles Theme mit CSS-Variablen:

```css
.command-modal {
  background: #1a1a1a;
  border: 1px solid #333;
  border-radius: 12px;
  max-width: 560px;
}

.command-result.selected {
  background: #2a2a2a;
}

.result-avatar {
  background: #3b82f6;  /* Primary Color */
}

.result-favorite {
  color: #ef4444;  /* Rot für Herz */
}
```

### Animationen

- **Fade In:** Backdrop erscheint mit 0.15s
- **Slide In:** Modal gleitet von oben mit 0.2s
- **Loading Spinner:** Rotation Animation

## Integration in Layout

Typischerweise wird die CommandBar im App-Layout integriert:

```svelte
<!-- src/routes/(app)/+layout.svelte -->
<script lang="ts">
  import { CommandBar } from '@mana/shared-ui';

  let commandBarOpen = $state(false);

  function handleKeydown(event: KeyboardEvent) {
    // Cmd/Ctrl+K funktioniert auch in Input-Feldern
    if ((event.ctrlKey || event.metaKey) && event.key === 'k') {
      event.preventDefault();
      commandBarOpen = true;
    }
  }
</script>

<svelte:window onkeydown={handleKeydown} />

<!-- Haupt-Layout -->
<PillNavigation ... />

<main>
  {@render children()}
</main>

<!-- Command Bar (global) -->
<CommandBar
  bind:open={commandBarOpen}
  onClose={() => (commandBarOpen = false)}
  onSearch={handleSearch}
  onSelect={handleSelect}
  {quickActions}
/>
```

## Dateien

### @mana/shared-ui

| Datei | Beschreibung |
|-------|--------------|
| `src/command-bar/CommandBar.svelte` | Hauptkomponente |
| `src/command-bar/index.ts` | Exports |
| `src/index.ts` | Package-Export |

## Vorteile

- **Einheitliche UX:** Gleiche Interaktion in allen Apps
- **Schnelle Navigation:** Sofortiger Zugriff auf häufige Aktionen
- **Tastatur-fokussiert:** Optimiert für Power-User
- **Flexibel:** App-spezifische Such-Logik und Quick Actions
- **Responsive:** Funktioniert auf Desktop und Mobile

## Best Practices

1. **Such-Performance:** Limit auf 10 Ergebnisse setzen
2. **Quick Actions:** Maximal 4-5 Aktionen für Übersichtlichkeit
3. **Sinnvolle Shortcuts:** Mnemonische Kürzel (N=Neu, S=Settings)
4. **Gute Subtitles:** Zusätzliche Info für eindeutige Identifikation
5. **Keyboard First:** Cmd+K sollte immer funktionieren, auch in Input-Feldern
