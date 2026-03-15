# Standortverlauf App

Eine Expo React Native App, die den Standortverlauf des Nutzers aufzeichnet und auf einer Karte darstellt. Alle Daten werden lokal auf dem Gerät gespeichert.

![Standortverlauf App](https://via.placeholder.com/800x400?text=Standortverlauf+App)

## Funktionen

### 🗺️ Echtzeit-Standortverfolgung
- Verfolge deinen aktuellen Standort in Echtzeit auf einer interaktiven Karte
- Visualisiere deinen Bewegungsverlauf als Linie auf der Karte
- Automatische Zentrierung auf deinen aktuellen Standort (optional)
- Dark Mode Unterstützung für angenehme Nutzung bei Nacht

### 📝 Detaillierter Standortverlauf
- Chronologische Liste aller aufgezeichneten Standorte
- Detaillierte Informationen zu jedem Standort:
  - Datum und Uhrzeit (mit verbesserter Zeitstempel-Verwaltung)
  - Genaue Koordinaten (Breiten- und Längengrad)
  - Genauigkeit der Standortbestimmung
  - Geschwindigkeit (falls verfügbar)
  - Adressinformationen mit formatierter Darstellung (optional)
  - Eindeutige ID für jeden Standort
  - Erweiterte Metadaten (Quelle, Verbindungstyp, Batteriestand)
  - Qualitätsindikatoren für Standortgenauigkeit
- Intelligente Standortkonsolidierung:
  - Zusammenfassung von nahe beieinanderliegenden Standorten
  - Berechnung der Verweildauer an jedem Ort
  - Anzeige der Anzahl der zusammengefassten Datenpunkte
  - Umschaltbar zwischen detaillierter und konsolidierter Ansicht
- Automatische Migration bestehender Daten

### 🔍 Umfangreiches Logging und Diagnose
- Detaillierte Logs aller App-Aktivitäten
- Überwachung der Hintergrund- und Vordergrundaktualisierungen
- Fehlerdiagnose und Problembehandlung
- Visualisierung von Standortgenauigkeit und Tracking-Intervallen

### 🔒 Datenschutz und Sicherheit
- Alle Daten werden ausschließlich lokal auf deinem Gerät gespeichert
- Keine Übertragung von Standortdaten an externe Server
- Volle Kontrolle über deine Daten mit der Möglichkeit, den Verlauf jederzeit zu löschen
- Option zum Ein-/Ausschalten der Adressspeicherung

### ⚙️ Anpassbare Tracking-Einstellungen
- Starte und stoppe das Tracking nach Bedarf
- Mehrere Tracking-Intervalle zur Auswahl:
  - 5 Minuten (hohe Genauigkeit, höherer Akkuverbrauch)
  - 1 Stunde (mittlere Genauigkeit, moderater Akkuverbrauch)
  - 3 Stunden (niedrigere Genauigkeit, geringer Akkuverbrauch)
  - 6 Stunden (niedrige Genauigkeit, minimaler Akkuverbrauch)
- Auswählbare Genauigkeitsstufen:
  - Niedrigste (1-3 km, geringster Akkuverbrauch)
  - Niedrig (500m-1km)
  - Mittel (100-500m, empfohlen)
  - Hoch (20-100m)
  - Höchste (0-20m, höchster Akkuverbrauch)
- Distanz-basierte Aktualisierung: Automatische Anpassung je nach Intervall

## Technische Details

### Verwendete Technologien
- **Expo**: Framework für die einfache Entwicklung von React Native Apps
- **React Native**: Cross-Platform Framework für native mobile Apps
- **Expo Router**: Für die Navigation zwischen den Screens
- **Expo Location**: Für den Zugriff auf die Standortdaten des Geräts
- **React Native Maps**: Für die Kartenansicht und -interaktion
- **AsyncStorage**: Für die lokale Datenspeicherung

### Architektur

Die App ist in mehrere Komponenten und Dienste unterteilt:

#### Hauptkomponenten
- **LocationMap**: Zeigt die Karte mit dem aktuellen Standort und dem Bewegungsverlauf
- **TrackingControls**: Bietet Steuerelemente zum Starten/Stoppen des Trackings und Löschen des Verlaufs
- **LocationHistoryList**: Zeigt den Standortverlauf in einer detaillierten Liste
- **ConsolidatedLocationList**: Zeigt den zusammengefassten Standortverlauf
- **LogsList**: Visualisiert die App-Logs mit Farbkodierung je nach Schweregrad
- **ThemeWrapper**: Sorgt für die konsistente Darstellung im Light- und Dark-Mode

#### Dienste
- **locationService**: Enthält alle Funktionen für das Standort-Tracking und die lokale Speicherung:
  - `requestLocationPermissions`: Anfordern der Standortberechtigungen
  - `getCurrentLocation`: Abrufen des aktuellen Standorts mit erweiterten Metadaten
  - `startLocationTracking`: Starten der kontinuierlichen Standortverfolgung
  - `saveLocationToHistory`: Speichern eines Standorts im Verlauf mit automatischer Migration
  - `getLocationHistory`: Abrufen des gesamten Standortverlaufs mit Migrationssupport
  - `clearLocationHistory`: Löschen des gesamten Standortverlaufs
  - `getAccuracyLevel`/`saveAccuracyLevel`: Verwalten der Genauigkeitseinstellung
  - `getDefaultInterval`/`saveDefaultInterval`: Verwalten des Standard-Tracking-Intervalls
  - **LocationData Interface**: Erweiterte Datenstruktur mit:
    - Eindeutige IDs für jeden Standort
    - Strukturierte Zeitstempel (ISO String + Unix Millisekunden)
    - Erweiterte Adressinformationen mit formatierter Darstellung
    - Metadaten (Quelle, Batteriestand, Verbindungstyp, Bewegungsstatus)
    - Qualitätsindikatoren (Genauigkeitslevel, horizontale/vertikale Genauigkeit)
    - Legacy-Support für bestehende Daten
- **logService**: Protokolliert alle App-Aktivitäten und Fehler:
  - `logInfo`/`logWarning`/`logError`: Protokollieren von Nachrichten mit verschiedenen Schweregraden
  - `getStoredLogs`: Abrufen aller gespeicherten Logs
  - `clearLogs`: Löschen aller Protokolle
- **locationHelper**: Hilft bei der Analyse und Zusammenfassung von Standortdaten:
  - `consolidateLocationsByProximity`: Fasst nahe beieinander liegende Standorte zusammen (kompatibel mit neuer Datenstruktur)
  - `getDistanceBetweenCoordinates`: Berechnet die Entfernung zwischen zwei Koordinaten
  - `formatDuration`: Formatiert Zeitspannen in benutzerfreundlicher Weise
  - Unterstützung für sowohl neue als auch Legacy-Adressformate
- **backgroundLocationTask**: Verarbeitung im Hintergrund mit erweiterten Metadaten:
  - Generierung von UUIDs für Standorte
  - Erfassung von Verbindungstyp und Batteriestand
  - Kompatibilität mit neuer LocationData-Struktur

#### Navigation
- **Tabs**: Die App verwendet eine Tab-Navigation mit drei Haupttabs:
  - **Karte**: Zeigt die Kartenansicht mit Tracking-Steuerung
  - **Verlauf**: Zeigt die chronologische Liste aller aufgezeichneten Standorte mit Umschaltmöglichkeit zur konsolidierten Ansicht
  - **Logs**: Zeigt detaillierte Protokolle aller App-Aktivitäten

## Installation und Einrichtung

### Voraussetzungen
- Node.js (v14 oder höher)
- npm oder yarn
- Expo CLI (`npm install -g expo-cli`)
- iOS Simulator oder Android Emulator (optional für lokale Tests)
- Physisches Gerät mit Expo Go App (empfohlen für Standortfunktionen)

### Installation

1. Repository klonen oder herunterladen
   ```bash
   git clone https://github.com/username/standortverlauf.git
   cd standortverlauf
   ```

2. Abhängigkeiten installieren
   ```bash
   npm install
   # oder
   yarn install
   ```

3. App starten
   ```bash
   npx expo start
   ```

4. QR-Code mit der Expo Go App scannen oder auf iOS/Android Simulator starten

### Berechtigungen

Die App benötigt folgende Berechtigungen:
- **Standort**: Für die Standortverfolgung (wird beim ersten Start angefragt)

## Nutzung

### Standortverfolgung starten
1. Öffne die App und navigiere zum "Karte"-Tab
2. Tippe auf "Tracking starten"
3. Erteile die Standortberechtigung, wenn du dazu aufgefordert wirst
4. Dein aktueller Standort wird auf der Karte angezeigt und kontinuierlich aktualisiert

### Standortverlauf anzeigen
1. Navigiere zum "Verlauf"-Tab
2. Hier siehst du eine chronologische Liste aller aufgezeichneten Standorte
3. Tippe auf einen Eintrag, um zu diesem Standort auf der Karte zu navigieren
4. Nutze den Umschalter oben, um zwischen der detaillierten und der konsolidierten Ansicht zu wechseln

### Konsolidierte Standorte anzeigen
1. Navigiere zum "Verlauf"-Tab
2. Tippe auf den "Zusammengefasst"-Button im oberen Bereich
3. Die App zeigt nun zusammengefasste Standorte mit Verweildauer und Anzahl der Datenpunkte
4. Die Zahl im orangefarbenen Kreis zeigt die Gesamtzahl der konsolidierten Standorte an

### App-Logs einsehen
1. Navigiere zum "Logs"-Tab
2. Hier siehst du farblich kodierte Einträge für alle App-Aktivitäten:
   - Grün: Informationen
   - Orange: Warnungen
   - Rot: Fehler
3. Die Logs werden automatisch aktualisiert und zeigen Details zu Standortverfolgung, Intervallen und mehr

### Standortverlauf löschen
1. Navigiere zum "Karte"-Tab
2. Tippe auf "Verlauf löschen"
3. Bestätige die Löschung im Dialog

### Einstellungen anpassen
1. Tippe auf das Zahnrad-Symbol in der oberen linken Ecke
2. Passe folgende Einstellungen an:
   - Erscheinungsbild (Dark Mode ein-/ausschalten)
   - Datenschutz (Adressen speichern ein-/ausschalten)
   - Tracking-Einstellungen (Standard-Intervall und Genauigkeit)

## Anpassung und Weiterentwicklung

Die App kann leicht an deine Bedürfnisse angepasst werden:

### Tracking-Intervall und Genauigkeit anpassen
Verwende die Einstellungsseite, um die Tracking-Parameter anzupassen:

1. Tippe auf das Zahnrad-Symbol in der oberen linken Ecke
2. Wähle unter "Tracking-Einstellungen" die gewünschten Optionen:
   - Standard-Intervall: Bestimmt wie oft ein neuer Standort aufgezeichnet wird
   - Genauigkeit: Bestimmt die Präzision der Standortermittlung

Die App passt die zugrunde liegenden Parameter automatisch an:

```javascript
// Die App verwendet nun diese Parameter basierend auf den Einstellungen
const subscription = await startLocationTracking(
  onLocationUpdateCallback,
  selectedInterval,  // Der in den Einstellungen gewählte Intervall
  distanceInterval   // Wird automatisch basierend auf dem Intervall angepasst
);
```

### Kartenansicht anpassen
Die Kartenansicht kann in der Datei `components/LocationMap.tsx` angepasst werden.

### Datenspeicherung erweitern
Die App verwendet jetzt eine erweiterte `LocationData`-Struktur. Um zusätzliche Daten zu speichern, kannst du das Interface in `utils/locationService.ts` erweitern:

```typescript
export interface LocationData {
  id: string;                    // Eindeutige UUID
  latitude: number;
  longitude: number;
  timestamps: {
    recorded: string;            // ISO 8601 String
    recordedMs: number;          // Unix Millisekunden
  };
  // ... weitere Felder
  metadata: {
    source: 'foreground' | 'background' | 'manual';
    batteryLevel?: number;
    connectionType?: 'wifi' | 'cellular' | 'none';
    deviceMotion?: 'stationary' | 'walking' | 'driving' | 'unknown';
    // Hier können weitere Metadaten hinzugefügt werden
  };
  quality: {
    accuracyLevel: AccuracyLevel;
    horizontalAccuracy: number;
    verticalAccuracy?: number;
    isSignificantLocation: boolean;
  };
}
```

### Standortkonsolidierung anpassen
Um den Radius für die Standortkonsolidierung anzupassen, ändere den `consolidationRadius`-Parameter in der Datei `app/(tabs)/two.tsx`:

```javascript
const [consolidationRadius, setConsolidationRadius] = useState(100); // Radius in Metern
```

Ein größerer Radius fasst mehr Standorte zusammen, während ein kleinerer Radius zu einer feineren Aufteilung führt.

## Fehlerbehebung

### Standort wird nicht angezeigt
- Stelle sicher, dass die Standortberechtigung erteilt wurde
- Überprüfe, ob die Standortdienste auf deinem Gerät aktiviert sind
- Bei Verwendung eines Emulators: Simuliere einen Standort

### App stürzt ab oder reagiert nicht
- Überprüfe die Konsolenausgabe auf Fehlermeldungen
- Stelle sicher, dass alle Abhängigkeiten korrekt installiert sind
- Versuche, die App neu zu starten

### Migration bestehender Daten
- Die App migriert automatisch bestehende Standortdaten beim ersten Laden nach dem Update
- Migrationsstatus wird in den Logs angezeigt (grüne Info-Meldungen)
- Bei Problemen mit der Migration können die Standortdaten über "Verlauf löschen" zurückgesetzt werden

### TypeScript/Lint Fehler
- Führe `npm run lint` aus, um Code-Qualitätsprobleme zu identifizieren
- Führe `npm run format` aus, um automatische Formatierungskorrekturen anzuwenden

## Lizenz

Diese App ist unter der MIT-Lizenz lizenziert. Siehe die LICENSE-Datei für Details.

## Kontakt

Bei Fragen oder Problemen erstelle bitte ein Issue im GitHub-Repository oder kontaktiere den Entwickler direkt.

---

Entwickelt mit ❤️ und Expo React Native
