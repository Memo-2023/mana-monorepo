# Memoro Theme-System

Dieses Modul enthält ein komplettes Theme-System für die Memoro App mit:
- Hell/Dunkel Modus (inkl. System-Einstellung)
- Verschiedene Theme-Varianten (Lume, Nature, Stone, Ocean)
- Theme Provider & Hooks
- Fertige UI-Komponenten für Theme-Einstellungen

## Komponenten

### ThemeProvider
Der zentrale Provider für das Theme-System. Er verwaltet den Theme-Zustand, speichert Einstellungen in AsyncStorage und stellt den `tw`-Helper bereit.

### ThemeSettings
UI-Komponente zur Auswahl des Farbmodus und der Theme-Variante. Kann in jede Einstellungsseite eingebunden werden.

### useTheme Hook
Hook zum Zugriff auf das aktuelle Theme und dessen Funktionen in Komponenten.

## Verwendung

### 1. Verwenden des useTheme Hooks

```tsx
import { useTheme } from '~/features/theme/ThemeProvider';

export function MyComponent() {
  const { isDark, themeVariant, tw } = useTheme();
  
  return (
    <View className={tw("p-4 bg-background")}>
      <Text className={tw("text-default")}>Hello World</Text>
    </View>
  );
}
```

### 2. Verwenden des tw-Helpers

Der `tw`-Helper transformiert generische Klassen in theme-spezifische Klassen:

```tsx
// Generische Klasse -> Theme-spezifische Klasse
"bg-primary"     -> "bg-lume-primary" (bei Theme "lume")
"text-default"   -> "text-lume-text"   (bei Theme "lume")
"border-secondary" -> "border-lume-secondary" (bei Theme "lume")
```

Im Dark Mode werden zusätzlich die Light-Mode-Klassen durch Dark-Mode-Klassen ersetzt:

```tsx
"bg-lume-primary" -> "bg-dark-lume-primary" (im Dark Mode)
```

### 3. Unterstützte generische Klassen

| Generische Klasse | Beschreibung |
|-------------------|-------------|
| `bg-primary`      | Primärfarbe als Hintergrund |
| `text-primary`    | Primärfarbe als Textfarbe |
| `border-primary`  | Primärfarbe als Rahmenfarbe |
| `bg-secondary`    | Sekundärfarbe als Hintergrund |
| `text-secondary`  | Sekundärfarbe als Textfarbe |
| `border-secondary`| Sekundärfarbe als Rahmenfarbe |
| `bg-background`   | Hintergrundfarbe |
| `text-default`    | Standard-Textfarbe |
| `border-default`  | Standard-Rahmenfarbe |

### 4. Atom-Komponenten

Für eine konsistente Darstellung sollten die Atom-Komponenten verwendet werden:

```tsx
import Text from '~/components/atoms/Text';
import Icon from '~/components/atoms/Icon';

// Text-Komponente mit Varianten
<Text variant="h1">Überschrift</Text>
<Text variant="body">Normaler Text</Text>

// Icon-Komponente mit Theme-Farben
<Icon name="home" size={24} useThemeColor />
```

## Best Practices

1. **Konsistente Verwendung des tw-Helpers**: Verwende den `tw`-Helper für alle Klassen, die theme-abhängig sind.

2. **Atom-Komponenten nutzen**: Verwende die Atom-Komponenten (Text, Icon) für eine konsistente Darstellung.

3. **Direktes Styling für komplexe Fälle**: Bei komplexen Styling-Anforderungen kannst du auch direkte Styles verwenden:

```tsx
const { isDark } = useTheme();
const backgroundColor = isDark ? '#121212' : '#FFFFFF';

<View style={{ backgroundColor }} className="p-4 rounded-xl">
  {/* Inhalt */}
</View>
```

4. **Theme-Version beachten**: Wenn eine Komponente auf Theme-Änderungen reagieren soll, verwende die `themeVersion` als Abhängigkeit:

```tsx
const { themeVersion } = useTheme();
// Die Komponente wird neu gerendert, wenn sich das Theme ändert
```
