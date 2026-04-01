# Expo SDK 54 Upgrade Guide für Cards

## 🎯 Übersicht

Dieses Dokument beschreibt die notwendigen Schritte für das Upgrade von Cards von Expo SDK 53 auf SDK 54.

**Aktueller Stand:**
- Expo SDK: 53.0.20
- React Native: 0.79.5
- React: 19.0.0
- Node.js: 20.19.0 (❌ Update erforderlich auf 20.19.4+)

## 📋 Voraussetzungen

### System-Anforderungen
- **Node.js:** Minimum 20.19.4 (aktuell: 20.19.0)
- **Xcode:** 16.1 oder höher (empfohlen: 16.0)
- **EAS CLI:** Neueste Version

### Vor dem Upgrade
```bash
# EAS CLI aktualisieren
npm install -g eas-cli@latest

# Node.js auf 20.19.4+ updaten (via nvm oder direkt)
nvm install 20.19.4
nvm use 20.19.4
```

## 🚨 Breaking Changes & Wichtige Änderungen

### 1. **expo-av wird entfernt**
- ⚠️ **Betroffen:** Ja, Projekt nutzt `expo-av@^15.1.7`
- **Migration:** Zu `expo-video` oder anderen Audio-Libraries wechseln
- **Deadline:** Muss vor SDK 55 migriert werden

### 2. **React Native 0.81 & React 19.1**
- Upgrade von RN 0.79.5 → 0.81
- React bleibt bei 19.x (19.0.0 → 19.1)

### 3. **Android Edge-to-Edge**
- Wird automatisch aktiviert und kann nicht deaktiviert werden
- UI-Anpassungen könnten nötig sein

### 4. **New Architecture**
- SDK 54 ist die letzte Version mit Legacy Architecture Support
- Migration zur New Architecture wird dringend empfohlen

## 📦 Betroffene Dependencies

### Muss aktualisiert werden:
```json
{
  "expo": "^53.0.20" → "^54.0.0",
  "expo-av": "^15.1.7" → Migration erforderlich!,
  "expo-constants": "~17.1.4" → "~18.0.0",
  "expo-dev-client": "~5.2.4" → "~6.0.0",
  "expo-dev-launcher": "^5.0.17" → "^6.0.0",
  "expo-file-system": "^18.1.11" → "^19.0.0",
  "expo-image-picker": "^16.1.4" → "^17.0.0",
  "expo-linking": "~7.1.4" → "~8.0.0",
  "expo-router": "~5.1.4" → "~6.0.0",
  "expo-speech": "^13.1.7" → "^14.0.0",
  "expo-status-bar": "~2.2.3" → "~3.0.0",
  "expo-symbols": "~0.4.5" → "~1.0.0",
  "expo-system-ui": "~5.0.6" → "~6.0.0",
  "expo-web-browser": "~14.2.0" → "~15.0.0",
  "expo-build-properties": "~0.14.8" → "~0.15.0",
  "expo-updates": "~0.28.17" → "~0.29.0",
  "react-native": "0.79.5" → "0.81.0",
  "react": "19.0.0" → "19.1.0",
  "react-dom": "19.0.0" → "19.1.0"
}
```

### Kompatibilität prüfen:
- `react-native-gesture-handler`
- `react-native-reanimated`
- `react-native-screens`
- `react-native-safe-area-context`

## 🔧 Upgrade-Schritte

### Schritt 1: Backup erstellen
```bash
# Git Status prüfen
git status

# Alle Änderungen committen
git add .
git commit -m "Pre SDK 54 upgrade backup"

# Branch für Upgrade erstellen
git checkout -b upgrade/expo-sdk-54
```

### Schritt 2: Dependencies aktualisieren
```bash
# Expo SDK 54 installieren
npx expo install expo@^54.0.0 --fix

# Dies aktualisiert automatisch alle Expo-Packages
```

### Schritt 3: expo-av Migration

**Option A: Zu expo-video wechseln (für Video)**
```bash
npm uninstall expo-av
npx expo install expo-video
```

**Option B: Zu expo-audio wechseln (für Audio)**
```bash
npm uninstall expo-av
npx expo install expo-audio
```

**Code-Anpassungen erforderlich in:**
- Components die Audio/Video verwenden
- Imports anpassen

### Schritt 4: app.json Anpassungen
```json
{
  "expo": {
    // iOS Deployment Target anpassen
    "plugins": [
      [
        "expo-build-properties",
        {
          "ios": {
            "deploymentTarget": "16.0"  // von 15.1 auf 16.0
          },
          "android": {
            "targetSdkVersion": 36,  // Neu für Android 16
            "compileSdkVersion": 36
          }
        }
      ]
    ],
    // New Architecture aktivieren (optional aber empfohlen)
    "experiments": {
      "typedRoutes": true,
      "tsconfigPaths": true,
      "newArchEnabled": true  // Neu hinzufügen
    }
  }
}
```

### Schritt 5: Native Directories neu generieren
```bash
# Alte native Directories löschen (falls vorhanden)
rm -rf ios android

# Neu generieren mit SDK 54
npx expo prebuild --clean
```

### Schritt 6: Development Build erstellen
```bash
# Neuen Development Build erstellen
eas build --profile development --platform ios
eas build --profile development --platform android
```

### Schritt 7: Tests durchführen
```bash
# Lint ausführen
npm run lint

# Format prüfen
npm run format

# App auf verschiedenen Plattformen testen
npm run ios
npm run android
npm run web
```

## ✅ Checkliste

- [ ] Node.js auf 20.19.4+ aktualisiert
- [ ] EAS CLI auf neueste Version aktualisiert
- [ ] Backup/Branch erstellt
- [ ] Dependencies mit `npx expo install expo@^54.0.0 --fix` aktualisiert
- [ ] expo-av Migration durchgeführt
- [ ] app.json angepasst (iOS deployment target, Android SDK)
- [ ] Native Directories neu generiert
- [ ] Development Builds erstellt
- [ ] App auf allen Plattformen getestet
- [ ] UI auf Android Edge-to-Edge geprüft
- [ ] Alle Features funktionieren

## 🐛 Bekannte Probleme & Lösungen

### Problem 1: Metro Cache
```bash
# Metro Cache löschen
npx expo start -c
```

### Problem 2: Pod Installation Fehler (iOS)
```bash
cd ios
pod deintegrate
pod install --repo-update
```

### Problem 3: Android Build Fehler
```bash
cd android
./gradlew clean
cd ..
npx expo run:android
```

## 📚 Weitere Ressourcen

- [Offizielle Expo SDK 54 Changelog](https://expo.dev/changelog/sdk-54)
- [Expo Upgrade Guide](https://docs.expo.dev/workflow/upgrading-expo-sdk-walkthrough/)
- [React Native 0.81 Release Notes](https://reactnative.dev/blog)
- [New Architecture Guide](https://docs.expo.dev/guides/new-architecture/)

## 🆘 Support

Bei Problemen während des Upgrades:
1. [Expo Discord](https://chat.expo.dev)
2. [Expo GitHub Issues](https://github.com/expo/expo/issues)
3. [Stack Overflow](https://stackoverflow.com/questions/tagged/expo)

---

**Letzte Aktualisierung:** 24. September 2025
**Erstellt für:** Cards Projekt
**SDK Version:** 53 → 54