# Upgrade-Anleitung: Expo SDK 53 zu SDK 54

## Übersicht

Diese Anleitung beschreibt den Upgrade-Prozess von Expo SDK 53 auf SDK 54 für das Manadeck-Projekt.

## Wichtige Änderungen in SDK 54

### Hauptversionen

- **React Native**: 0.79.5 → 0.81.x
- **React**: 19.0.0 → 19.1.x
- **Reanimated**: v3 → v4 (optional)
- **Android API**: Unterstützung für API 36
- **iOS**: Unterstützung für iOS 26
- **Node.js**: Mindestens 20.19.x erforderlich

### Breaking Changes

1. **Legacy Architecture**
   - SDK 54 ist die letzte Version mit Legacy Architecture Support
   - Ab SDK 55 wird nur noch die New Architecture unterstützt

2. **File System API**
   - Die neue expo-file-system API ist jetzt Standard
   - Legacy API unter `expo-file-system/legacy` verfügbar

3. **JSC Support**
   - React Native 0.81 hat keine eingebaute JSC-Unterstützung mehr
   - Hermes ist jetzt die Standard-JavaScript-Engine

4. **Deprecations**
   - `expo-av` wird in SDK 55 entfernt (Migration zu `expo-audio` und `expo-video` empfohlen)
   - React Native's `<SafeAreaView>` ist veraltet

## Upgrade-Schritte

### 1. Vorbereitung

Erstelle ein Backup deines Projekts:

```bash
git add .
git commit -m "Backup vor SDK 54 Upgrade"
git branch backup-sdk-53
```

### 2. Dependencies aktualisieren

```bash
# Expo SDK 54 installieren
npm install expo@^54.0.0

# Alle Dependencies auf kompatible Versionen upgraden
npx expo install --fix

# Probleme überprüfen
npx expo-doctor@latest
```

### 3. React und React Native aktualisieren

Da SDK 54 React Native 0.81 und React 19.1 benötigt:

```bash
npm install react@19.1.0 react-native@0.81.x
```

### 4. Spezifische Package-Updates für Manadeck

Basierend auf den aktuellen Dependencies:

```bash
# React Navigation (falls Updates verfügbar)
npx expo install @react-navigation/native

# Reanimated (optional auf v4, oder bei v3 bleiben)
# Für v4 (nur mit New Architecture):
npx expo install react-native-reanimated@~4.0.0

# Oder bei v3 bleiben (mit Legacy Architecture):
npx expo install react-native-reanimated@~3.17.4

# Weitere Expo-Packages aktualisieren
npx expo install \
  @expo/vector-icons \
  expo-av \
  expo-constants \
  expo-dev-client \
  expo-file-system \
  expo-image-picker \
  expo-linking \
  expo-router \
  expo-speech \
  expo-status-bar \
  expo-symbols \
  expo-system-ui \
  expo-web-browser \
  expo-build-properties \
  expo-updates

# React Native Community Packages
npx expo install \
  @react-native-async-storage/async-storage \
  react-native-gesture-handler \
  react-native-safe-area-context \
  react-native-screens \
  react-native-svg
```

### 5. File System API Migration (falls verwendet)

Falls das Projekt `expo-file-system` nutzt:

**Quick Migration (Legacy API behalten):**

```typescript
// Alt:
import * as FileSystem from 'expo-file-system';

// Neu:
import * as FileSystem from 'expo-file-system/legacy';
```

**Oder zur neuen API migrieren:**

```typescript
// Neue API verwenden
import * as FileSystem from 'expo-file-system';
```

### 6. Native Projekte aktualisieren

**Wenn Continuous Native Generation verwendet wird:**

```bash
# Alte native Verzeichnisse löschen
rm -rf android ios

# Neu generieren
npx expo prebuild --clean
```

**Wenn eigene native Projekte vorhanden sind:**

```bash
# iOS Pods aktualisieren
cd ios && pod install && cd ..

# Native Änderungen prüfen
# Siehe: https://docs.expo.dev/bare/upgrade/
```

### 7. EAS Build Configuration

Update `eas.json` falls nötig:

```json
{
	"build": {
		"development": {
			"node": "20.19.1"
		},
		"preview": {
			"node": "20.19.1"
		},
		"production": {
			"node": "20.19.1"
		}
	}
}
```

### 8. Testing

```bash
# Cache löschen und neu starten
npx expo start --clear

# Auf verschiedenen Plattformen testen
npm run ios
npm run android
npm run web

# Linting und Formatierung
npm run lint
npm run format

# Development Build erstellen
npm run build:dev
```

## Migrations-Checkliste

- [ ] Backup erstellt
- [ ] Dependencies aktualisiert
- [ ] `npx expo-doctor` erfolgreich
- [ ] File System Imports geprüft/migriert
- [ ] Native Projekte aktualisiert
- [ ] Node.js Version ≥ 20.19.x
- [ ] Development Build funktioniert
- [ ] iOS Build funktioniert
- [ ] Android Build funktioniert
- [ ] Web Build funktioniert
- [ ] Alle Features getestet

## Troubleshooting

### Problem: Metro Bundler Fehler

```bash
# Metro Cache löschen
npx expo start --clear
rm -rf node_modules/.cache/metro
```

### Problem: iOS Build schlägt fehl

- Xcode 16.1 oder höher erforderlich
- iOS Deployment Target prüfen

### Problem: Reanimated Fehler

- Bei Problemen mit v4: Bei v3 bleiben
- Babel Config prüfen (babel-preset-expo handled das automatisch)

### Problem: TypeScript Fehler

```bash
# TypeScript neu konfigurieren
npx expo customize tsconfig.json
```

## Rollback bei Problemen

Falls das Upgrade fehlschlägt:

```bash
git checkout backup-sdk-53
npm install
```

## Weiterführende Ressourcen

- [Expo SDK 54 Changelog](https://expo.dev/changelog/sdk-54)
- [React Native 0.81 Release Notes](https://github.com/facebook/react-native/releases/tag/v0.81.0)
- [Expo Upgrade Guide](https://docs.expo.dev/workflow/upgrading-expo-sdk-walkthrough/)
- [Native Project Upgrade Helper](https://docs.expo.dev/bare/upgrade/)

## Nächste Schritte nach dem Upgrade

1. **New Architecture aktivieren** (empfohlen für SDK 54):

   ```bash
   npx expo prebuild --clean
   ```

2. **expo-av Migration** planen (wird in SDK 55 entfernt):
   - Migration zu `expo-audio` für Audio
   - Migration zu `expo-video` für Video

3. **Performance-Optimierungen** mit Reanimated v4 (falls New Architecture)

## Support

Bei Problemen:

- [Expo Discord](https://chat.expo.dev)
- [GitHub Issues](https://github.com/expo/expo/issues)
- [Stack Overflow](https://stackoverflow.com/questions/tagged/expo)
