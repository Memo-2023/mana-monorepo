# Portable Theme Module

Dieses Modul enthält ein komplettes Theme-System für React Native Apps mit:
- Hell/Dunkel Modus (inkl. System-Einstellung)
- Kontrast-Einstellungen (5 Stufen)
- Theme Provider & Hooks
- Fertige UI-Komponenten für Theme-Einstellungen

## Installation

1. Kopiere den gesamten `theme` Ordner in dein Projekt
2. Installiere die benötigten Dependencies:
```bash
npm install @react-native-async-storage/async-storage
```

## Verwendung

1. Wrapp deine App mit dem ThemeProvider:
```tsx
import { ThemeProvider } from './theme';

export default function App() {
  return (
    <ThemeProvider>
      <YourApp />
    </ThemeProvider>
  );
}
```

2. Nutze den useTheme Hook in deinen Komponenten:
```tsx
import { useTheme } from './theme';

export function MyComponent() {
  const { theme, isDark } = useTheme();
  return (
    <View style={{ backgroundColor: theme.colors.background }}>
      <Text style={{ color: theme.colors.text }}>
        Hello World
      </Text>
    </View>
  );
}
```

3. Füge die ThemeSettings Komponente in deine Settings-Seite ein:
```tsx
import { ThemeSettings } from './theme';

export function SettingsScreen() {
  return (
    <View>
      <ThemeSettings />
    </View>
  );
}
```
