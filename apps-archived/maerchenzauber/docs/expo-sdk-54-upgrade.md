# Expo SDK 54 Upgrade Guide für Märchenzauber

## 📋 Übersicht

Dieses Dokument beschreibt das Upgrade von **Expo SDK 51** (aktuell) auf **Expo SDK 54** für das Märchenzauber Projekt.

### Aktuelle Version

- **Expo SDK**: 51.0.28
- **React Native**: 0.74.5
- **React**: 18.2.0

### Zielversion

- **Expo SDK**: 54.0.0
- **React Native**: 0.81.0
- **React**: 19.1.0

## 🚀 Neue Features in SDK 54

### 1. Performance-Verbesserungen

- **Precompiled XCFrameworks für iOS**: Reduziert Clean-Build-Zeiten von ~120 auf ~10 Sekunden
- **Schnellere Builds**: Besonders bei großen Projekten spürbar

### 2. Native UI-Features

- **Native Tabs (Beta)**: Liquid Glass Tabs mit automatischem Scrolling
- **iOS 26 Support**: Liquid Glass Icons und Views
- **Verbesserte Modals**: Web-Modals verhalten sich jetzt wie iPad/iPhone Modals

### 3. Technische Updates

- **React Native 0.81** mit React 19.1
- **Android 16 Target**: Edge-to-Edge standardmäßig aktiviert
- **New Architecture Migration**: SDK 55 wird nur noch New Architecture unterstützen

### 4. API-Verbesserungen

- **File System API**: Neue objektorientierte API
- **SQLite localStorage**: Drop-in Ersatz für Web localStorage
- **Streaming Support**: TextDecoderStream/TextEncoderStream für AI-Integration

## ⚠️ Breaking Changes

### 1. Kritische Änderungen

#### expo-av Deprecation

```diff
- import { Audio, Video } from 'expo-av';
+ import { Audio } from 'expo-audio';
+ import { Video } from 'expo-video';
```

**Wichtig**: expo-av wird in SDK 55 entfernt!

#### File System API

```diff
- import { ... } from 'expo-file-system/next';
+ import { ... } from 'expo-file-system';
// Legacy API verfügbar unter:
+ import { ... } from 'expo-file-system/legacy';
```

#### Reanimated v4

- Nur New Architecture Support
- Für Legacy Architecture: Bei Reanimated v3 bleiben

### 2. Platform-spezifische Änderungen

#### iOS

- **Xcode Requirement**: Xcode 16.1+ (empfohlen: Xcode 26)
- **iOS Minimum**: iOS 15.1

#### Android

- **Target SDK**: Android 16
- **Edge-to-Edge**: Standardmäßig aktiviert (nicht deaktivierbar)

## 📝 Upgrade-Schritte

### Schritt 1: Backup erstellen

```bash
# Git-Status prüfen
git status

# Alle Änderungen committen
git add .
git commit -m "chore: backup before SDK 54 upgrade"

# Neuen Branch erstellen
git checkout -b upgrade/expo-sdk-54
```

### Schritt 2: Dependencies aktualisieren

#### Mobile App (apps/mobile/package.json)

```json
{
  "dependencies": {
    "expo": "~54.0.0",
    "expo-application": "~6.0.0",
    "expo-blur": "~14.0.0",
    "expo-clipboard": "~8.0.0",
    "expo-constants": "~17.0.0",
    "expo-dev-client": "~5.0.0",
    "expo-device": "~7.0.0",
    "expo-file-system": "~18.0.0",
    "expo-font": "~13.0.0",
    "expo-image": "~2.0.0",
    "expo-image-picker": "~16.0.0",
    "expo-linear-gradient": "~14.0.0",
    "expo-linking": "~7.0.0",
    "expo-localization": "~16.0.0",
    "expo-router": "~4.0.0",
    "expo-secure-store": "~14.0.0",
    "expo-splash-screen": "~0.29.0",
    "expo-status-bar": "~2.0.0",
    "expo-system-ui": "~4.0.0",
    "expo-web-browser": "~14.0.0",
    "react": "19.1.0",
    "react-dom": "19.1.0",
    "react-native": "0.81.0",
    "react-native-gesture-handler": "~2.22.0",
    "react-native-reanimated": "~3.16.0",
    "react-native-safe-area-context": "4.14.0",
    "react-native-screens": "4.4.0"
  },
  "devDependencies": {
    "@types/react": "~19.1.0",
    "jest-expo": "~54.0.0",
    "typescript": "~5.7.0"
  }
}
```

### Schritt 3: Installation durchführen

```bash
# Cache löschen
cd apps/mobile
rm -rf node_modules
npm cache clean --force

# Dependencies installieren
npm install

# Expo Doctor ausführen
npx expo-doctor
```

### Schritt 4: Native Directories zurücksetzen (wenn vorhanden)

```bash
# Alte native Directories löschen
rm -rf ios android

# Neu generieren (wenn benötigt)
npx expo prebuild --clean
```

### Schritt 5: Code-Anpassungen

#### 1. File System API migrieren

```typescript
// ALT (SDK 51)
import * as FileSystem from 'expo-file-system';

// NEU (SDK 54) - Für moderne API
import { File, Directory } from 'expo-file-system';

// Oder für Legacy-Kompatibilität
import * as FileSystem from 'expo-file-system/legacy';
```

#### 2. Router Updates (v3 → v4)

```typescript
// Prüfe expo-router Imports und Konfiguration
// Router v4 hat verbesserte TypeScript-Unterstützung
```

#### 3. Native Tabs (Optional - Beta)

```typescript
// Neue native Tabs verwenden (Beta)
import { Tabs } from 'expo-router/unstable-native-tabs';

// Liquid Glass Effekte automatisch verfügbar
```

### Schritt 6: Metro-Konfiguration prüfen

```javascript
// metro.config.js
// Entferne veraltete Overrides
// Prüfe monorepo-spezifische Konfiguration
```

### Schritt 7: Tests durchführen

```bash
# Unit Tests
npm test

# Type Checking
npm run type-check

# Linting
npm run lint

# iOS testen
npm run ios

# Android testen
npm run android
```

## 🔧 Spezifische Anpassungen für Märchenzauber

### 1. Image Generation

- Replicate Integration sollte weiterhin funktionieren
- Prüfe expo-image v2.0 Breaking Changes

### 2. Supabase Integration

- Keine direkten Änderungen erwartet
- Auth-Flow testen

### 3. Character/Story Features

- File System API für Caching anpassen
- Image Picker API prüfen

### 4. Performance-Optimierungen nutzen

- iOS Builds werden deutlich schneller
- Android Edge-to-Edge für bessere UX

## 📱 Neue Features für Märchenzauber nutzen

### Native Tabs für Story-Navigation

```typescript
import { Tabs } from 'expo-router/unstable-native-tabs';

// Liquid Glass Effekte für magische Navigation
<Tabs
  screenOptions={{
    tabBarStyle: {
      // Automatische Liquid Glass Effekte
    }
  }}
>
  <Tabs.Screen name="stories" />
  <Tabs.Screen name="characters" />
</Tabs>
```

### iOS 26 Liquid Glass Icons

```json
// app.json
{
  "expo": {
    "ios": {
      "icon": "./assets/app.icon" // Neue .icon Datei
    }
  }
}
```

### Verbesserte Modal-Präsentation

```typescript
// Web-Modals verhalten sich jetzt nativ
<Modal
  presentationStyle="pageSheet" // Funktioniert jetzt auch im Web
  animationType="slide"
>
  {/* Story-Optionen */}
</Modal>
```

## 🐛 Troubleshooting

### Problem: Build-Fehler nach Upgrade

```bash
# Cache komplett zurücksetzen
npx expo start -c
rm -rf .expo
watchman watch-del-all
```

### Problem: Reanimated Fehler

```bash
# Bei Legacy Architecture bleiben
npm install react-native-reanimated@3.16.0
```

### Problem: Metro-Fehler

```javascript
// metro.config.js anpassen
// Entferne metro/src/... Imports
// Ersetze durch metro/private/...
```

### Problem: Type-Fehler mit React 19

```bash
# TypeScript-Definitionen aktualisieren
npm install --save-dev @types/react@~19.1.0
```

## ✅ Checkliste

- [ ] Backup/Branch erstellt
- [ ] Dependencies aktualisiert
- [ ] expo-doctor ohne Fehler
- [ ] File System API migriert
- [ ] Tests laufen durch
- [ ] iOS Build funktioniert
- [ ] Android Build funktioniert
- [ ] Story-Generation getestet
- [ ] Character-Creation getestet
- [ ] Image-Generation funktioniert
- [ ] Auth-Flow funktioniert
- [ ] Credits/Mana-System funktioniert

## 📚 Ressourcen

- [Expo SDK 54 Changelog](https://expo.dev/changelog/sdk-54)
- [Upgrade Guide](https://docs.expo.dev/workflow/upgrading-expo-sdk-walkthrough/)
- [New Architecture Guide](https://docs.expo.dev/guides/new-architecture/)
- [React Native 0.81 Release Notes](https://reactnative.dev/blog)
- [Reanimated v4 Migration](https://docs.swmansion.com/react-native-reanimated/docs/guides/migration-from-v3)

## 🎯 Nächste Schritte nach Upgrade

1. **Performance-Tests**: Vergleiche Build-Zeiten vorher/nachher
2. **Native Features**: Evaluiere Native Tabs für bessere UX
3. **New Architecture**: Plane Migration für SDK 55 Kompatibilität
4. **Edge-to-Edge**: Nutze Android 16 Features für immersive Stories
5. **iOS 26 Features**: Implementiere Liquid Glass Effekte

## ⏱️ Geschätzter Zeitaufwand

- **Vorbereitung**: 30 Minuten
- **Upgrade durchführen**: 1-2 Stunden
- **Testing**: 2-3 Stunden
- **Fehlerbehebung**: 1-2 Stunden (je nach Komplexität)
- **Gesamt**: ~1 Arbeitstag

## 🚨 Wichtige Hinweise

1. **SDK 55 Vorbereitung**: New Architecture wird Pflicht - jetzt schon planen!
2. **expo-av Migration**: Muss vor SDK 55 abgeschlossen sein
3. **Testing**: Besonders Auth-Flow und Credit-System gründlich testen
4. **EAS Build**: Image auf `macos-sequoia-15.5-xcode-26.0` setzen für iOS 26 Features

---

**Letzte Aktualisierung**: Januar 2025
**Märchenzauber Version**: Nach Upgrade auf SDK 54
