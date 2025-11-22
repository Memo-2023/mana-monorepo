# Expo UI Documentation

## Überblick

**Expo UI** (@expo/ui) ist eine innovative Bibliothek von nativen UI-Komponenten, die es ermöglicht, vollständig native Benutzeroberflächen mit **SwiftUI** (iOS) und **Jetpack Compose** (Android) direkt in React Native Apps zu erstellen. Die Bibliothek bringt moderne, deklarative UI-Frameworks direkt in React Native und ermöglicht es Entwicklern, die Vorteile beider Welten zu nutzen.

## Status und Verfügbarkeit

- **Aktueller Status**: Alpha (Stand: 2025)
- **Verfügbarkeit**: Nur in Development Builds (nicht in Expo Go)
- **Breaking Changes**: Häufig zu erwarten während der Alpha-Phase
- **Priorität**: SwiftUI-Support zuerst, dann Jetpack Compose und Web/DOM

## Installation

```bash
npx expo install @expo/ui
```

## Kernkonzepte

### Host Component

Die `Host`-Komponente ist der Container für alle Expo UI Komponenten. Sie funktioniert ähnlich wie:
- `<svg>` für DOM
- `<Canvas>` für react-native-skia

Unter der Haube verwendet sie `UIHostingController` um SwiftUI Views in UIKit zu rendern.

```javascript
import { Host } from '@expo/ui/swift-ui';

<Host style={{ flex: 1 }}>
  {/* Expo UI Komponenten hier */}
</Host>
```

### 1-zu-1 Mapping

Expo UI bietet eine direkte Abbildung zu nativen UI-Frameworks:
- SwiftUI Views für iOS
- Jetpack Compose Components für Android

## Verfügbare Komponenten

### SwiftUI Components (@expo/ui/swift-ui)

| Komponente | Beschreibung |
|------------|-------------|
| `Host` | Container für SwiftUI Komponenten |
| `Button` | Native Button mit System-Images |
| `Text` | Native Text-Komponente |
| `VStack` | Vertikales Layout |
| `ContextMenu` | Kontextmenü |
| `DateTimePicker` | Datum/Zeit-Auswahl |
| `Picker` | Segmented und Wheel-Varianten |
| `Slider` | Schieberegler |
| `Switch` | Toggle/Schalter |
| `LinearProgress` | Fortschrittsbalken |
| `BottomSheet` | Bottom Sheet Modal |

### Jetpack Compose Components (@expo/ui/jetpack-compose)

| Komponente | Beschreibung |
|------------|-------------|
| `TextInput` | Native Texteingabe |
| `Button` | Native Android Button |
| Weitere Komponenten in Entwicklung |

## Code-Beispiele

### Basis-Beispiel mit SwiftUI

```javascript
import { Host, VStack, Text, Button } from '@expo/ui/swift-ui';

function MyComponent() {
  return (
    <Host style={{ flex: 1 }}>
      <VStack spacing={8}>
        <Text>Willkommen bei Expo UI!</Text>
        <Button onPress={() => console.log('Geklickt!')}>
          Klick mich
        </Button>
      </VStack>
    </Host>
  );
}
```

### Bottom Sheet Beispiel

```javascript
import { BottomSheet, Host, Text } from '@expo/ui/swift-ui';
import { useState } from 'react';
import { useWindowDimensions } from 'react-native';

function BottomSheetExample() {
  const [isOpened, setIsOpened] = useState(false);
  const { width } = useWindowDimensions();

  return (
    <Host style={{ position: 'absolute', width }}>
      <BottomSheet 
        isOpened={isOpened} 
        onIsOpenedChange={e => setIsOpened(e)}
      >
        <Text>Sheet-Inhalt hier</Text>
      </BottomSheet>
    </Host>
  );
}
```

### Jetpack Compose TextInput

```javascript
import { TextInput } from '@expo/ui/jetpack-compose';

function AndroidInput() {
  const [value, setValue] = useState('');

  return (
    <TextInput 
      autocorrection={false} 
      defaultValue="Standardtext" 
      onChangeText={setValue} 
    />
  );
}
```

## Integration mit React Native

### Mixing Components

Du kannst React Native Komponenten als JSX-Children von Expo UI Komponenten verwenden:

```javascript
import { Host, VStack } from '@expo/ui/swift-ui';
import { View, Text as RNText } from 'react-native';

function MixedComponent() {
  return (
    <Host style={{ flex: 1 }}>
      <VStack>
        {/* React Native Komponente innerhalb von Expo UI */}
        <View>
          <RNText>React Native Text</RNText>
        </View>
      </VStack>
    </Host>
  );
}
```

Expo UI erstellt automatisch einen `UIViewRepresentable` Wrapper für React Native Komponenten.

## Vorteile von Expo UI

### 1. Native Performance
- Direkte Nutzung von SwiftUI und Jetpack Compose
- Keine Bridge-Overhead für UI-Updates
- Optimierte native Animationen und Transitions

### 2. Moderne UI-Patterns
- Zugriff auf die neuesten nativen UI-Features
- System-konsistentes Design out-of-the-box
- Native Gesten und Interaktionen

### 3. Flexibilität
- Full-App Support: Gesamte App in Expo UI schreibbar
- Component-Level Mixing: Mische React Native, Expo UI, DOM und Custom 2D Components
- Schrittweise Migration möglich

### 4. Developer Experience
- TypeScript Support mit vollständigen Typen
- Hot Reload Support
- Vertraute React-Patterns

## Einschränkungen und Überlegungen

### Aktuelle Einschränkungen

1. **Alpha Status**: API kann sich häufig ändern
2. **Dokumentation**: Noch nicht vollständig, nutze TypeScript-Typen zur API-Exploration
3. **Platform Support**: SwiftUI-Support priorisiert, Jetpack Compose noch in Entwicklung
4. **Expo Go**: Nicht unterstützt, Development Build erforderlich

### Performance-Überlegungen

- Host-Components haben einen gewissen Overhead
- Für einfache UI-Elemente kann React Native effizienter sein
- Ideal für komplexe, native UI-Patterns

## Best Practices

### 1. Strukturierung

```javascript
// Separiere native UI in eigene Komponenten
function NativeSheet({ children }) {
  return (
    <Host style={{ flex: 1 }}>
      <BottomSheet>
        {children}
      </BottomSheet>
    </Host>
  );
}
```

### 2. Platform-spezifischer Code

```javascript
import { Platform } from 'react-native';

const NativeButton = Platform.select({
  ios: require('@expo/ui/swift-ui').Button,
  android: require('@expo/ui/jetpack-compose').Button,
});
```

### 3. TypeScript nutzen

```typescript
import type { ButtonProps } from '@expo/ui/swift-ui';

interface MyButtonProps extends ButtonProps {
  variant?: 'primary' | 'secondary';
}
```

## Zukunft von Expo UI

### Roadmap 2025

1. **Q1-Q2 2025**: Stabilisierung der SwiftUI-Integration
2. **Q3 2025**: Vollständiger Jetpack Compose Support
3. **Q4 2025**: Web/DOM Support
4. **2026**: Stable Release geplant

### Geplante Features

- Mehr native Komponenten
- Bessere React Native Integration
- Custom Native Component Support
- Theming und Styling System
- Animation APIs

## Migration Guide

### Von React Native zu Expo UI

```javascript
// Vorher (React Native)
import { TouchableOpacity, Text } from 'react-native';

<TouchableOpacity onPress={handlePress}>
  <Text>Click me</Text>
</TouchableOpacity>

// Nachher (Expo UI)
import { Host, Button } from '@expo/ui/swift-ui';

<Host>
  <Button onPress={handlePress}>Click me</Button>
</Host>
```

## Troubleshooting

### Häufige Probleme

**Problem**: Components werden nicht angezeigt
- **Lösung**: Stelle sicher, dass Components in einem `Host` gewrappt sind

**Problem**: Build-Fehler mit Expo Go
- **Lösung**: Verwende Development Build: `npx expo run:ios` oder `npx expo run:android`

**Problem**: TypeScript-Fehler
- **Lösung**: Update auf neueste @expo/ui Version

## Ressourcen

### Offizielle Dokumentation
- [Expo UI Docs](https://docs.expo.dev/versions/latest/sdk/ui/)
- [SwiftUI Guide](https://docs.expo.dev/guides/expo-ui-swift-ui/)
- [GitHub Repository](https://github.com/expo/expo/tree/main/packages/expo-ui)

### Community
- [Expo Discord](https://discord.gg/expo)
- [GitHub Discussions](https://github.com/expo/expo/discussions)

### Beispiel-Projekte
- [Liquid Glass App](https://expo.dev/blog/liquid-glass-app-with-expo-ui-and-swiftui)
- [Live Activity Example](https://christopher.engineering/en/blog/live-activity-with-react-native/)

## Fazit

Expo UI repräsentiert einen innovativen Ansatz für React Native Development, der die Grenzen zwischen React Native und nativen UI-Frameworks verschwimmen lässt. Während es sich noch in der Alpha-Phase befindet, zeigt es bereits das Potenzial für die Zukunft der mobilen App-Entwicklung mit React Native.

Für das Märchenzauber-Projekt könnte Expo UI besonders interessant sein für:
- Native Picker-Komponenten für Sprachauswahl
- BottomSheets für Story-Optionen
- Native Animationen für magische Übergänge
- System-konsistente UI-Elemente