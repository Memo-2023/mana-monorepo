# Central Theming System

Das zentrale Theming-System ermöglicht einheitliches Aussehen und Benutzereinstellungen über alle Mana-Apps hinweg. Es besteht aus mehreren Schichten: Theme-Varianten, Light/Dark-Modus und Accessibility-Einstellungen.

## Architektur

```
┌─────────────────────────────────────────────────────────────┐
│                     mana-auth                          │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  user_settings (JSON-Feld)                           │   │
│  │  - theme: { mode, colorScheme, pinnedThemes }       │   │
│  │  - nav: { desktopPosition, sidebarCollapsed }       │   │
│  │  - locale: "de"                                      │   │
│  │  - general: { startPages, sounds, etc. }            │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                             │
        ┌────────────────────┼────────────────────┐
        │                    │                    │
   ┌────▼────┐         ┌─────▼────┐        ┌─────▼────┐
   │  Todo   │         │ Calendar │        │ Contacts │
   │         │         │          │        │          │
   │ shared- │         │ shared-  │        │ shared-  │
   │ theme   │         │ theme    │        │ theme    │
   └─────────┘         └──────────┘        └──────────┘
```

## Packages

| Package | Beschreibung |
|---------|--------------|
| `@mana/shared-theme` | Theme Store, Types, Utilities, Konstanten |
| `@mana/shared-theme-ui` | Svelte UI-Komponenten (ThemeSelector, ThemePage, etc.) |

## Theme-Varianten

Es gibt 8 vordefinierte Theme-Varianten:

### Standard-Varianten (PillNav)
| Name | Farbe | Icon | Hue |
|------|-------|------|-----|
| `lume` | Gold | sparkle | 47 |
| `nature` | Grün | leaf | 122 |
| `stone` | Blau-Grau | hexagon | 200 |
| `ocean` | Blau | waves | 199 |

### Erweiterte Varianten (Themes-Seite)
| Name | Farbe | Icon | Hue |
|------|-------|------|-----|
| `sunset` | Coral/Orange | sun | 15 |
| `midnight` | Violett | moon | 260 |
| `rose` | Pink | flower | 340 |
| `lavender` | Lavendel | sparkle | 270 |

## Theme-Modus

```typescript
type ThemeMode = 'light' | 'dark' | 'system';
```

- **light**: Heller Modus
- **dark**: Dunkler Modus
- **system**: Folgt der System-Einstellung

## Color Tokens

Jede Theme-Variante definiert diese HSL-Farbwerte für Light und Dark:

```typescript
interface ThemeColors {
  primary: string;           // Hauptfarbe
  primaryForeground: string; // Text auf Primary
  secondary: string;         // Sekundärfarbe
  secondaryForeground: string;
  background: string;        // Seitenhintergrund
  foreground: string;        // Haupttext
  surface: string;           // Karten-Hintergrund
  surfaceHover: string;      // Hover-Zustand
  surfaceElevated: string;   // Modals, Dropdowns
  muted: string;             // Deaktivierte Elemente
  mutedForeground: string;
  border: string;            // Rahmen
  borderStrong: string;      // Starke Rahmen
  error: string;             // Fehler-Rot
  success: string;           // Erfolg-Grün
  warning: string;           // Warnung-Orange
  input: string;             // Input-Hintergrund
  ring: string;              // Focus-Ring
}
```

### HSL-Format

Farben werden als HSL-Strings ohne `hsl()` Wrapper gespeichert:

```typescript
// Format: "H S% L%"
const gold = '47 95% 58%';
const darkBlue = '199 100% 18%';

// CSS-Verwendung
--color-primary: 47 95% 58%;
background-color: hsl(var(--color-primary));
```

## Store-Nutzung

### Theme Store

```typescript
import { createThemeStore } from '@mana/shared-theme';

// Store erstellen
export const theme = createThemeStore({
  appId: 'calendar',
  defaultMode: 'system',
  defaultVariant: 'ocean',
});

// In Komponente initialisieren
onMount(() => {
  const cleanup = theme.initialize();
  return cleanup;
});

// Zugriff auf State
theme.mode       // 'light' | 'dark' | 'system'
theme.variant    // 'ocean' | 'nature' | ...
theme.effectiveMode // 'light' | 'dark' (aufgelöst)
theme.isDark     // boolean

// Aktionen
theme.setMode('dark');
theme.setVariant('nature');
theme.toggleMode();   // Light ↔ Dark
theme.cycleMode();    // Light → Dark → System → Light
```

### App-spezifische Primary Color

```typescript
export const theme = createThemeStore({
  appId: 'memoro',
  primaryColor: {
    light: '47 95% 58%',  // Gold
    dark: '47 95% 58%',
  },
});
```

### User Settings Store (Server-Sync)

```typescript
import { createUserSettingsStore } from '@mana/shared-theme';

export const userSettings = createUserSettingsStore({
  appId: 'calendar',
  authUrl: 'http://localhost:3001',
  getAccessToken: () => authStore.getAccessToken(),
});

// Laden
await userSettings.load();

// Zugriff
userSettings.theme.mode       // Theme-Modus
userSettings.theme.colorScheme // Variante
userSettings.nav.desktopPosition // 'top' | 'bottom'
userSettings.locale           // 'de'
userSettings.general.soundsEnabled

// Aktualisieren (speichert auf Server)
await userSettings.updateGlobal({
  theme: { mode: 'dark' }
});

// App-spezifische Überschreibung
await userSettings.updateAppOverride({
  theme: { colorScheme: 'nature' }
});
```

## Accessibility (A11y)

### A11y Store

```typescript
import { createA11yStore } from '@mana/shared-theme';

export const a11y = createA11yStore({ appId: 'calendar' });

// State
a11y.contrast      // 'normal' | 'high'
a11y.colorblind    // 'none' | 'deuteranopia' | 'protanopia' | 'monochrome'
a11y.reduceMotion  // boolean

// Aktionen
a11y.setContrast('high');
a11y.setColorblind('deuteranopia');
a11y.setReduceMotion(true);
a11y.resetAll();
```

### A11y-Optionen

**Kontrast:**
- `normal`: Standard (WCAG AA 4.5:1)
- `high`: Erhöhter Kontrast (WCAG AAA 7:1)

**Farbenblindheit:**
- `none`: Keine Anpassung
- `deuteranopia`: Grün-Blindheit (~6% der Männer)
- `protanopia`: Rot-Blindheit (~1% der Männer)
- `monochrome`: Graustufen

**Reduzierte Bewegung:**
- Respektiert `prefers-reduced-motion`
- Kann manuell überschrieben werden

## UI-Komponenten

### ThemePage

Vollständige Themes-Seite mit allen Optionen:

```svelte
<script>
  import { ThemePage } from '@mana/shared-theme-ui';
  import { theme, a11y } from '$lib/stores';
</script>

<ThemePage
  currentVariant={theme.variant}
  onSelectTheme={(v) => theme.setVariant(v)}
  showModeSelector={true}
  currentMode={theme.mode}
  onModeChange={(m) => theme.setMode(m)}
  a11yStore={a11y}
  showA11ySettings={true}
/>
```

### ThemeSelector

Dropdown zur Theme-Auswahl:

```svelte
<script>
  import { ThemeSelector } from '@mana/shared-theme-ui';
  import { theme } from '$lib/stores';
</script>

<ThemeSelector themeStore={theme} />
```

### ThemeModeSelector

Umschalter für Light/Dark/System:

```svelte
<script>
  import { ThemeModeSelector } from '@mana/shared-theme-ui';
  import { theme } from '$lib/stores';
</script>

<ThemeModeSelector themeStore={theme} />
```

### ThemeToggle

Einfacher Dark/Light Toggle:

```svelte
<script>
  import { ThemeToggle } from '@mana/shared-theme-ui';
  import { theme } from '$lib/stores';
</script>

<ThemeToggle themeStore={theme} />
```

### A11ySettings

Vollständige Accessibility-Einstellungen:

```svelte
<script>
  import { A11ySettings } from '@mana/shared-theme-ui';
  import { a11y } from '$lib/stores';
</script>

<A11ySettings store={a11y} />
```

## CSS-Integration

### Tailwind CSS

Die Themes werden als CSS-Variablen angewendet:

```css
:root {
  --color-primary: 199 98% 45%;
  --color-background: 199 100% 97%;
  --color-foreground: 199 100% 18%;
  /* ... weitere Tokens */
}

.dark {
  --color-primary: 199 98% 48%;
  --color-background: 200 25% 7%;
  --color-foreground: 0 0% 100%;
}
```

In Tailwind:

```html
<div class="bg-background text-foreground">
  <button class="bg-primary text-primary-foreground">
    Klick mich
  </button>
</div>
```

### tailwind.config.js

```javascript
theme: {
  extend: {
    colors: {
      background: 'hsl(var(--color-background))',
      foreground: 'hsl(var(--color-foreground))',
      primary: {
        DEFAULT: 'hsl(var(--color-primary))',
        foreground: 'hsl(var(--color-primary-foreground))',
      },
      // ... weitere
    }
  }
}
```

## Dateien

### @mana/shared-theme

| Datei | Beschreibung |
|-------|--------------|
| `src/types.ts` | Alle TypeScript Interfaces |
| `src/constants.ts` | Theme-Definitionen (8 Varianten) |
| `src/store.svelte.ts` | Theme Store Factory |
| `src/a11y-store.svelte.ts` | Accessibility Store |
| `src/a11y-constants.ts` | A11y Konstanten |
| `src/a11y-utils.ts` | A11y Helper |
| `src/user-settings-store.svelte.ts` | Server-Sync Store |
| `src/utils.ts` | Theme Utilities |
| `src/app-routes.ts` | Start-Page Konfiguration |

### @mana/shared-theme-ui

| Datei | Beschreibung |
|-------|--------------|
| `src/ThemeSelector.svelte` | Theme-Dropdown |
| `src/ThemeModeSelector.svelte` | Light/Dark/System Selector |
| `src/ThemeToggle.svelte` | Einfacher Toggle |
| `src/components/ThemeCard.svelte` | Theme-Vorschau Karte |
| `src/components/ThemeGrid.svelte` | Grid von Theme-Karten |
| `src/components/A11ySettings.svelte` | A11y Einstellungen |
| `src/pages/ThemePage.svelte` | Vollständige Themes-Seite |

## Integration in eine App

### 1. Dependencies installieren

```json
{
  "dependencies": {
    "@mana/shared-theme": "workspace:*",
    "@mana/shared-theme-ui": "workspace:*"
  }
}
```

### 2. Store erstellen

```typescript
// src/lib/stores/theme.ts
import { createThemeStore, createA11yStore } from '@mana/shared-theme';

export const theme = createThemeStore({
  appId: 'myapp',
  defaultVariant: 'ocean',
});

export const a11y = createA11yStore({
  appId: 'myapp',
});
```

### 3. Im Root-Layout initialisieren

```svelte
<!-- src/routes/+layout.svelte -->
<script>
  import { onMount } from 'svelte';
  import { theme, a11y } from '$lib/stores/theme';

  onMount(() => {
    const cleanupTheme = theme.initialize();
    const cleanupA11y = a11y.initialize();
    return () => {
      cleanupTheme();
      cleanupA11y();
    };
  });
</script>

<slot />
```

### 4. Themes-Seite hinzufügen

```svelte
<!-- src/routes/(app)/themes/+page.svelte -->
<script>
  import { ThemePage } from '@mana/shared-theme-ui';
  import { theme, a11y } from '$lib/stores/theme';
</script>

<ThemePage
  currentVariant={theme.variant}
  onSelectTheme={(v) => theme.setVariant(v)}
  showModeSelector={true}
  currentMode={theme.mode}
  onModeChange={(m) => theme.setMode(m)}
  a11yStore={a11y}
  showA11ySettings={true}
/>
```

## Vorteile

- **Konsistenz:** Alle Apps sehen einheitlich aus
- **User Experience:** Theme-Einstellungen werden gespeichert
- **Accessibility:** Barrierefreiheit ist eingebaut
- **Einfachheit:** 8 vordefinierte Themes zur Auswahl
