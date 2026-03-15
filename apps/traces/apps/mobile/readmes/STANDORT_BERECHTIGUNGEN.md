# Lösung für Standortberechtigungen in Expo/React Native-Apps (iOS)

## Problembeschreibung

Bei der Nutzung von Standortdiensten in einer Expo/React Native-App kann folgender Fehler auftreten:

```
There was a problem loading the project.
This development build encountered the following error:
This app is missing usage descriptions, so location services will fail. Add one of the
'NSLocation*UsageDescription' keys to your bundle's Info.plist. See https://bit.ly/3iLqy6S (https://docs.expo.dev/distribution/app-stores/
#system-permissions-dialogs-on-ios) for more information.
```

## Ursache

Dieses Problem tritt auf, wenn:

1. Die App auf Standortdienste zugreift, aber die erforderlichen Berechtigungsbeschreibungen fehlen
2. Die Info.plist-Datei nicht korrekt konfiguriert ist
3. Die notwendigen Hintergrundmodi für Standortdienste fehlen
4. Die Berechtigungsanfragen nicht im richtigen Timing erfolgen

## Vollständige Lösung

### 1. Expo Location Plugin konfigurieren

In `app.json` das Expo Location Plugin mit benutzerfreundlichen Beschreibungstexten hinzufügen:

```json
{
	"expo": {
		"plugins": [
			"expo-router",
			[
				"expo-dev-launcher",
				{
					"launchMode": "most-recent"
				}
			],
			[
				"expo-location",
				{
					"locationAlwaysAndWhenInUsePermission": "Diese App benötigt Zugriff auf Ihren Standort, auch im Hintergrund, um standortbezogene Funktionen anzubieten.",
					"locationAlwaysPermission": "Diese App benötigt Zugriff auf Ihren Standort im Hintergrund, um standortbezogene Funktionen anzubieten.",
					"locationWhenInUsePermission": "Diese App benötigt Zugriff auf Ihren Standort, um standortbezogene Funktionen anzubieten."
				}
			]
		]
	}
}
```

### 2. iOS-spezifische Konfiguration

Ebenfalls in `app.json` die iOS-spezifischen Einstellungen anpassen:

```json
{
	"expo": {
		"ios": {
			"supportsTablet": true,
			"bundleIdentifier": "com.your.app",
			"infoPlist": {
				"NSLocationWhenInUseUsageDescription": "Diese App benötigt Zugriff auf Ihren Standort, um standortbezogene Funktionen anzubieten.",
				"NSLocationAlwaysAndWhenInUseUsageDescription": "Diese App benötigt Zugriff auf Ihren Standort, auch im Hintergrund, um standortbezogene Funktionen anzubieten.",
				"NSLocationAlwaysUsageDescription": "Diese App benötigt Zugriff auf Ihren Standort, um standortbezogene Funktionen anzubieten.",
				"UIBackgroundModes": ["location", "fetch", "processing"]
			},
			"config": {
				"usesNonExemptEncryption": false
			}
		}
	}
}
```

### 3. Android-spezifische Konfiguration

Für Vollständigkeit auch die Android-Berechtigungen hinzufügen:

```json
{
	"expo": {
		"android": {
			"adaptiveIcon": {
				"foregroundImage": "./assets/adaptive-icon.png",
				"backgroundColor": "#ffffff"
			},
			"package": "com.your.app",
			"permissions": [
				"ACCESS_COARSE_LOCATION",
				"ACCESS_FINE_LOCATION",
				"ACCESS_BACKGROUND_LOCATION",
				"FOREGROUND_SERVICE",
				"FOREGROUND_SERVICE_LOCATION"
			]
		}
	}
}
```

### 4. Native Projektdateien neu generieren

Nach Änderungen in der Konfiguration die nativen Projektdateien neu erstellen:

```bash
# Native Ordner löschen
rm -rf ios android

# Native Projektdateien neu generieren
npx expo prebuild --clean

# In das iOS-Verzeichnis wechseln und CocoaPods installieren
cd ios && pod install && cd ..
```

### 5. Berechtigungen früh im App-Lebenszyklus anfordern

Im Hauptkomponentencode (z.B. in App.tsx oder index.tsx) die Berechtigungen direkt beim Start anfordern:

```typescript
import { useEffect } from 'react';
import * as Location from 'expo-location';

export default function App() {
	// Sofortige Berechtigungsanfrage beim Laden
	useEffect(() => {
		const requestPermissions = async () => {
			try {
				// Zuerst Vordergrund-Berechtigung anfordern
				const foreground = await Location.requestForegroundPermissionsAsync();
				console.log('Initial foreground permissions status:', foreground.status);

				if (foreground.status === 'granted') {
					// Wenn Vordergrund genehmigt, dann Hintergrund anfragen
					const background = await Location.requestBackgroundPermissionsAsync();
					console.log('Initial background permissions status:', background.status);
				}
			} catch (error) {
				console.error('Error requesting initial permissions:', error);
			}
		};

		requestPermissions();
	}, []);

	// Rest der App-Komponente...
}
```

### 6. Verbesserte Funktion für die Standortberechtigungsanfrage

In einem Utility-File (z.B. `locationService.ts`):

```typescript
// Request location permissions
export const requestLocationPermissions = async (): Promise<boolean> => {
	try {
		// Zuerst nur Vordergrund-Berechtigungen anfordern
		const foreground = await Location.requestForegroundPermissionsAsync();
		console.log('Foreground permissions status:', foreground.status);

		if (foreground.status !== 'granted') {
			console.log('Foreground location permission not granted');
			return false;
		}

		// Dann Hintergrund-Berechtigungen anfordern
		const background = await Location.requestBackgroundPermissionsAsync();
		console.log('Background permissions status:', background.status);

		if (background.status !== 'granted') {
			console.log('Background location permission not granted, but foreground is available');
			// Wir erlauben den Betrieb auch nur mit Vordergrund-Berechtigungen
			return true;
		}

		return true;
	} catch (error) {
		console.error('Error requesting permissions:', error);
		return false;
	}
};
```

### 7. Vor dem Standortzugriff immer Berechtigungen prüfen

Beispiel für eine getCurrentLocation-Funktion, die zuerst die Berechtigungen prüft:

```typescript
// Get current location
export const getCurrentLocation = async (): Promise<LocationData | null> => {
	try {
		// Erst überprüfen und bei Bedarf die Berechtigungen anfordern
		const hasPermission = await requestLocationPermissions();
		if (!hasPermission) {
			console.log('Location permission not granted');
			return null;
		}

		const location = await Location.getCurrentPositionAsync({
			accuracy: Location.Accuracy.Balanced,
		});

		return {
			latitude: location.coords.latitude,
			longitude: location.coords.longitude,
			timestamp: location.timestamp,
			accuracy: location.coords.accuracy || undefined,
			altitude: location.coords.altitude || undefined,
			speed: location.coords.speed || undefined,
		};
	} catch (error) {
		console.error('Error getting location:', error);
		return null;
	}
};
```

### 8. Bei anhaltenden Problemen: App-Einstellungen zurücksetzen

Wenn trotz aller Änderungen der Fehler weiter auftritt:

1. Die App auf dem Gerät/Simulator deinstallieren
2. In den iOS-Einstellungen unter Datenschutz → Ortungsdienste alle Berechtigungen für die App zurücksetzen
3. Neustart des Geräts/Simulators
4. Erneute Installation der App

## Häufige Fehlerquellen

1. **Fehlende Berechtigungsbeschreibungen**: Die Texte müssen vorhanden und aussagekräftig sein.
2. **Falsche Hintergrundmodi**: Für Hintergrund-Standortdienste muss `"UIBackgroundModes": ["location"]` gesetzt sein.
3. **Timing der Berechtigungsanfragen**: Berechtigungen sollten früh im App-Lebenszyklus angefragt werden.
4. **Veraltete native Dateien**: Nach Änderungen in app.json immer `npx expo prebuild --clean` ausführen.
5. **Expo-Konfiguration**: Sicherstellen, dass expo-location mit den richtigen Berechtigungsbeschreibungen als Plugin genutzt wird.

## Zusätzliche Ressourcen

- [Expo Location Dokumentation](https://docs.expo.dev/versions/latest/sdk/location/)
- [iOS Berechtigungen in Expo Apps](https://docs.expo.dev/distribution/app-stores/#system-permissions-dialogs-on-ios)
- [Hintergrund-Standortdienste in iOS](https://developer.apple.com/documentation/corelocation/getting_the_user_s_location/handling_location_events_in_the_background)
