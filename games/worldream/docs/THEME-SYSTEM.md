# Worldream Theme System

## Überblick

Das neue zentrale Theme-System ermöglicht es, das gesamte Erscheinungsbild der Anwendung durch einfache Theme-Wechsel zu ändern. Alle Farben sind semantisch definiert und wirken sich automatisch auf alle Komponenten aus.

## Verfügbare Themes

Jedes Theme hat sowohl eine **helle** als auch eine **dunkle** Variante:

### 1. Standard (Default)

- **Light**: Helle, moderne Oberfläche mit Violet als Primärfarbe
- **Dark**: Dunkles Theme mit Zinc-basierter Farbpalette
- Das klassische Light/Dark-Duo als Standardauswahl

### 2. Wald (Forest)

- **Light**: Helle, naturinspirierte Oberfläche mit grüner Farbpalette
- **Dark**: Dunkles Wald-Theme mit tiefen Grüntönen
- Beruhigend und fokussiert für naturverbundene Nutzer

### 3. Ozean (Ocean)

- **Light**: Maritime helle Oberfläche mit Sky-Tönen
- **Dark**: Dunkles Tiefsee-Theme mit intensiven Blautönen
- Frisch und inspirierend für kreative Arbeit

## Verwendung

### Theme & Modus wechseln

- **Light/Dark Toggle**: Klicke auf das Sonnen-/Mond-Symbol um zwischen heller und dunkler Variante zu wechseln
- **Theme Selection**: Klicke auf das Theme-Symbol und wähle dein bevorzugtes Theme aus dem Dropdown-Menü
- Die Kombination aus Theme und Modus wird automatisch gespeichert

### Semantische Klassen

#### Hintergründe

- `bg-theme-base` - Haupthintergrund der Seite
- `bg-theme-surface` - Karten und Komponenten
- `bg-theme-elevated` - Erhöhte/schwebende Elemente
- `bg-theme-overlay` - Overlays und Modals

#### Text

- `text-theme-primary` - Haupttext und Überschriften
- `text-theme-secondary` - Sekundärer Text
- `text-theme-tertiary` - Deaktivierter/subtiler Text
- `text-theme-inverse` - Invertierter Text (z.B. auf dunklem Hintergrund)

#### Rahmen

- `border-theme-default` - Standard-Rahmen
- `border-theme-subtle` - Subtile Trennlinien
- `border-theme-strong` - Betonte Rahmen

#### Primärfarben

- `bg-theme-primary-[50-950]` - Primärfarben-Palette
- `text-theme-primary-[50-950]` - Primärtext-Palette
- `border-theme-primary-[50-950]` - Primärrahmen-Palette

#### Zustände

- `text-theme-success` - Erfolgsmeldungen
- `text-theme-warning` - Warnungen
- `text-theme-error` - Fehlermeldungen
- `text-theme-info` - Informationen

#### Interaktionen

- `hover:bg-theme-interactive-hover` - Hover-Hintergrund
- `bg-theme-interactive-active` - Aktiver Zustand
- `focus:ring-theme-interactive-focus` - Fokus-Ring

## Neues Theme hinzufügen

1. Öffne `src/lib/themes/themes.config.ts`
2. Füge ein neues Theme-Objekt zum `themes` Objekt hinzu:

```typescript
myTheme: {
  name: 'My Theme',
  colors: {
    primary: {
      // Definiere die Primärfarben-Palette (50-950)
    },
    background: {
      // Definiere Hintergrundfarben
    },
    text: {
      // Definiere Textfarben
    },
    // ... weitere Farbdefinitionen
  }
}
```

3. Das neue Theme erscheint automatisch im Theme-Switcher!

## Technische Details

### Architektur

- **CSS-Variablen**: Alle Farben werden als CSS Custom Properties definiert
- **Tailwind-Integration**: Semantische Utility-Klassen über Tailwind Config
- **Runtime-Switching**: Themes können ohne Neuladen gewechselt werden
- **LocalStorage**: Theme-Auswahl wird gespeichert

### Dateien

- `/src/lib/themes/themes.config.ts` - Theme-Definitionen
- `/src/lib/themes/themes.css` - CSS-Variablen
- `/src/lib/themes/themeStore.ts` - State Management
- `/src/lib/components/ThemeSwitcher.svelte` - UI-Komponente

## Migration von alten Klassen

Alte Klassen wurden automatisch zu semantischen Klassen migriert:

| Alt                                     | Neu                                               |
| --------------------------------------- | ------------------------------------------------- |
| `bg-slate-50 dark:bg-zinc-900`          | `bg-theme-bg-base`                                |
| `text-slate-900 dark:text-zinc-100`     | `text-theme-text-primary`                         |
| `border-slate-300 dark:border-zinc-700` | `border-theme-border-default`                     |
| `bg-violet-600 hover:bg-violet-700`     | `bg-theme-primary-600 hover:bg-theme-primary-700` |

## Best Practices

1. **Verwende immer semantische Klassen** statt hard-coded Farben
2. **Teste neue Features** in allen Themes
3. **Behalte Kontraste im Auge** für Barrierefreiheit
4. **Nutze die Primärpalette** für Markenfarben
5. **Verwende Zustands-Farben** konsistent für Feedback

## Vorteile

✅ **Zentrale Verwaltung**: Ein Ort für alle Farbdefinitionen  
✅ **Konsistenz**: Automatische Anwendung auf alle Komponenten  
✅ **Flexibilität**: Einfaches Hinzufügen neuer Themes  
✅ **Performance**: Keine zusätzlichen Stylesheets nötig  
✅ **Entwickler-Erfahrung**: IntelliSense und Type-Safety  
✅ **Benutzer-Erfahrung**: Smooth Transitions zwischen Themes
