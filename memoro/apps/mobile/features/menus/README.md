# Memoro Menü-System

Dieses Dokument beschreibt die Verwendung von Menüs in der Memoro-App. Wir verwenden zwei verschiedene Menü-Typen für unterschiedliche Anwendungsfälle.

## Übersicht

| Menü-Typ | Verwendung | Bibliothek | Plattformunterstützung |
|----------|------------|------------|------------------------|
| Action Sheet | Bestätigungsdialoge, Aktionsauswahl | `@expo/react-native-action-sheet` | iOS, Android, Web, macOS |
| Context Menu | Kontext-/Dropdown-Menüs | `react-native-context-menu-view` | iOS (nativ), Android (adaptiert), **NICHT macOS** |

## ⚠️ Wichtiger Hinweis: macOS (Mac Catalyst) Kompatibilität

Die `react-native-context-menu-view` Bibliothek ist **nicht kompatibel mit Mac Catalyst** und verursacht Abstürze beim Rendern auf macOS. Alle Menü-Komponenten müssen ein spezielles Import-Pattern verwenden, um macOS-Kompatibilität sicherzustellen.

### Implementierungs-Pattern für Context Menus

```javascript
// Nur ContextMenu für unterstützte native Plattformen importieren
let ContextMenu: any = null;
// Erst Platform.OS statisch prüfen, dann Runtime-Check
if (Platform.OS !== 'web') {
  try {
    // Nur importieren wenn nicht auf macOS - Runtime-Check im require-Block
    const contextMenuModule = require('react-native-context-menu-view');
    // Doppelcheck zur Laufzeit nach Import
    if (!shouldDisableContextMenu()) {
      ContextMenu = contextMenuModule.default;
    }
  } catch (error) {
    console.warn('ContextMenu not available on', getPlatformString());
  }
}
```

### Schlüsselpunkte für macOS-Kompatibilität

1. **Zweistufige Prüfung**: Erst `Platform.OS !== 'web'` statisch prüfen, dann `shouldDisableContextMenu()` zur Laufzeit
2. **Runtime-Validierung**: Die `shouldDisableContextMenu()` Funktion erkennt Mac Catalyst und gibt `true` zurück
3. **Fallback-Mechanismus**: Wenn `ContextMenu` `null` ist, fallen Komponenten auf Web-Style Implementierungen zurück

### Platform Detection

Die Platform-Detection-Logik befindet sich in `/features/utils/platformDetection.ts`:
- `isMacOS()`: Erkennt ob die App auf Mac Catalyst läuft
- `shouldDisableContextMenu()`: Gibt `true` für Plattformen zurück, auf denen Context Menus deaktiviert werden sollen
- `getPlatformString()`: Gibt einen Plattform-Identifier für Logging zurück

## 1. Action Sheet für Bestätigungsdialoge

Wir verwenden Action Sheets anstelle von modalen Dialogen für alle Bestätigungsabfragen und Aktionsauswahlen.

### Installation

```bash
npm install @expo/react-native-action-sheet
```

### Einrichtung

Das Action Sheet Provider ist bereits im Root Layout (`app/_layout.tsx`) eingerichtet:

```tsx
import { ActionSheetProvider } from '@expo/react-native-action-sheet';

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <ActionSheetProvider>
          <AuthProvider>
            <RootLayoutNav />
          </AuthProvider>
        </ActionSheetProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
```

### Verwendung

```tsx
import { useActionSheet } from '@expo/react-native-action-sheet';
import { useTheme } from '~/features/theme/ThemeProvider';

function YourComponent() {
  const { showActionSheetWithOptions } = useActionSheet();
  const { isDark } = useTheme();

  const handleShowActionSheet = () => {
    const options = ['Option 1', 'Löschen', 'Abbrechen'];
    const destructiveButtonIndex = 1;
    const cancelButtonIndex = 2;
    
    showActionSheetWithOptions({
      options,
      cancelButtonIndex,
      destructiveButtonIndex,
      title: 'Titel',
      message: 'Beschreibung der verfügbaren Optionen',
      // iOS: Native Dark Mode Unterstützung
      userInterfaceStyle: isDark ? 'dark' : 'light',
      // Android/Web: Benutzerdefiniertes Styling für Dark Mode
      containerStyle: isDark ? {
        backgroundColor: '#1e1e1e',
      } : undefined,
      textStyle: {
        color: isDark ? '#FFFFFF' : '#000000',
      },
      titleTextStyle: {
        color: isDark ? '#FFFFFF' : '#000000',
      },
      messageTextStyle: {
        color: isDark ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.7)',
      },
    }, (selectedIndex?: number) => {
      if (selectedIndex === undefined) return; // Abgebrochen
      
      switch (selectedIndex) {
        case 0:
          // Option 1 ausgewählt
          break;
        case destructiveButtonIndex:
          // Löschen ausgewählt
          break;
      }
    });
  };

  return (
    <Pressable onPress={handleShowActionSheet}>
      <Text>Action Sheet anzeigen</Text>
    </Pressable>
  );
}
```

### Anwendungsfälle

- Bestätigung von Löschaktionen
- Bestätigung von Abbruch-Aktionen
- Auswahl aus einer Liste von Optionen
- Jede Art von Bestätigungsdialog

## 2. Context Menu für Kontext- und Dropdown-Menüs

Wir verwenden Context Menus für Kontext- und Dropdown-Menüs, die an bestimmte UI-Elemente gebunden sind.

### Installation

```bash
npm install react-native-context-menu-view
```

### Verwendung

```tsx
import ContextMenu from 'react-native-context-menu-view';
import { useTheme } from '~/features/theme/ThemeProvider';

function YourComponent() {
  const { isDark, themeVariant } = useTheme();
  
  const handleMenuPress = (e) => {
    const { index, name } = e.nativeEvent;
    
    switch (name) {
      case 'edit':
        // Bearbeiten-Aktion
        break;
      case 'delete':
        // Löschen-Aktion
        break;
    }
  };

  return (
    <ContextMenu
      title="Optionen"
      actions={[
        { 
          title: 'Bearbeiten',
          subtitle: 'Element bearbeiten',
          systemIcon: 'square.and.pencil', // iOS SF Symbol
          id: 'edit',
        },
        { 
          title: 'Löschen',
          systemIcon: 'trash',
          destructive: true,
          id: 'delete',
        },
      ]}
      onPress={handleMenuPress}
      previewBackgroundColor={isDark ? '#1e1e1e' : '#ffffff'}
    >
      <View style={styles.yourElement}>
        <Text>Rechtsklick oder lange drücken für Optionen</Text>
      </View>
    </ContextMenu>
  );
}
```

### Anwendungsfälle

- Kontextmenüs für Listenelemente
- Dropdown-Menüs für Schaltflächen
- Zusätzliche Aktionen für UI-Elemente
- Alle Menüs, die an ein bestimmtes Element gebunden sind

## Richtlinien für die Menüauswahl

1. **Action Sheet verwenden wenn:**
   - Eine Bestätigung vom Benutzer benötigt wird
   - Eine Auswahl aus einer Liste von Optionen angeboten wird
   - Die Aktion nicht an ein bestimmtes UI-Element gebunden ist
   - Modale Dialoge ersetzt werden sollen

2. **Context Menu verwenden wenn:**
   - Das Menü an ein bestimmtes UI-Element gebunden ist
   - Rechtsklick- oder Long-Press-Funktionalität benötigt wird
   - Mehrere Aktionen für ein Element angeboten werden
   - Eine native Menüerfahrung gewünscht ist

## Dark Mode Unterstützung

Beide Menütypen unterstützen den Dark Mode:

- **Action Sheet:** Verwendet `userInterfaceStyle` auf iOS und benutzerdefinierte Styling-Props auf Android/Web
- **Context Menu:** Verwendet `previewBackgroundColor` und native Darstellung

## Beispiele

Beispiele für die Verwendung beider Menütypen findest du in:

- `components/organisms/AudioPlayer.tsx` - Action Sheet für Löschbestätigung
- `components/atoms/RecordingButton.tsx` - Action Sheet für Aufnahmebestätigung

## Ressourcen

- [Action Sheet Dokumentation](https://github.com/expo/react-native-action-sheet)
- [Context Menu Dokumentation](https://github.com/mpiannucci/react-native-context-menu-view)
