# iOS Widget Implementation Guide für Expo React Native Quotes App

## Überblick

Diese Anleitung erklärt, wie Sie iOS Home Screen Widgets und Live Activities für Ihre Expo React Native Quotes App implementieren. Stand: Dezember 2025, basierend auf Expo SDK 54.

## Voraussetzungen

### System Requirements

- **macOS 15 Sequoia** oder höher
- **Xcode 16** oder höher
- **CocoaPods 1.16.2** oder höher (Ruby 3.2.0+)
- **Expo SDK 53+** (SDK 54 empfohlen, wie in Ihrem Projekt)
- **iOS 16+** für Live Activities, iOS 14+ für Home Screen Widgets
- Apple Developer Account (für Device Testing)

### Development Build

Widgets funktionieren **nicht** mit Expo Go. Sie benötigen einen Development Build:

```bash
# Erstellen Sie einen Development Build
npm run prebuild
npm run ios
```

## Implementation Strategie

### Ansatz 1: @bacons/apple-targets Plugin (Empfohlen)

Dies ist der modernste und am besten unterstützte Ansatz, entwickelt von Evan Bacon vom Expo Team.

#### Installation

```bash
# Plugin installieren
npm install @bacons/apple-targets

# Widget Target erstellen
npx create-target widget
```

Dies generiert automatisch:

- `/targets/widget/` Verzeichnis mit Swift-Dateien
- Basis Widget-Konfiguration
- Integration in app.json

#### Konfiguration in app.json

```json
{
	"expo": {
		"name": "Quote App",
		"slug": "quote-app",
		"version": "1.0.0",
		"platforms": ["ios"],
		"ios": {
			"bundleIdentifier": "com.yourcompany.quoteapp",
			"supportsTablet": true,
			"entitlements": {
				"com.apple.security.application-groups": ["group.com.yourcompany.quoteapp.widget"]
			}
		},
		"plugins": [
			[
				"@bacons/apple-targets",
				{
					"appleTeamId": "YOUR_TEAM_ID"
				}
			]
		]
	}
}
```

#### Widget Konfiguration (targets/widget/expo-target.config.js)

```javascript
/** @type {import('@bacons/apple-targets/app.plugin').Config} */
module.exports = {
	type: 'widget',
	name: 'QuotesWidget',
	bundleIdentifier: '$(PRODUCT_BUNDLE_IDENTIFIER).widget',
	deploymentTarget: '16.0',
	icon: '../../assets/widget-icon.png',
	colors: {
		$accent: {
			color: '#007AFF',
			darkColor: '#0A84FF',
		},
		$widgetBackground: {
			color: '#FFFFFF',
			darkColor: '#1C1C1E',
		},
	},
	entitlements: {
		'com.apple.security.application-groups': ['group.com.yourcompany.quoteapp.widget'],
	},
	frameworks: ['SwiftUI', 'WidgetKit'],
};
```

### Ansatz 2: Manuelle Implementation mit Config Plugins

Falls Sie mehr Kontrolle benötigen, können Sie einen eigenen Config Plugin erstellen.

#### Plugin Struktur (plugins/withIOSWidget.js)

```javascript
const {
	withXcodeProject,
	withDangerousMod,
	withEntitlementsPlist,
	withInfoPlist,
	IOSConfig,
} = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

function withIOSWidget(config) {
	// App Group hinzufügen
	config = withEntitlementsPlist(config, async (config) => {
		config.modResults['com.apple.security.application-groups'] = [
			`group.${config.ios.bundleIdentifier}.widget`,
		];
		return config;
	});

	// Widget Target zum Xcode Project hinzufügen
	config = withXcodeProject(config, async (config) => {
		const project = config.modResults;

		// Widget Target Configuration
		// (Detaillierte Implementation hier)

		return config;
	});

	return config;
}

module.exports = withIOSWidget;
```

## Swift Widget Implementation

### Basic Quote Widget (targets/widget/QuotesWidget.swift)

```swift
import WidgetKit
import SwiftUI

// Widget Datenmodell
struct QuoteEntry: TimelineEntry {
    let date: Date
    let quote: String
    let author: String
    let category: String?
}

// Widget Datenprovider
struct QuoteProvider: TimelineProvider {
    let userDefaults = UserDefaults(suiteName: "group.com.yourcompany.quoteapp.widget")

    func placeholder(in context: Context) -> QuoteEntry {
        QuoteEntry(
            date: Date(),
            quote: "Der beste Weg, die Zukunft vorauszusagen, ist, sie zu erfinden.",
            author: "Alan Kay",
            category: "Innovation"
        )
    }

    func getSnapshot(in context: Context, completion: @escaping (QuoteEntry) -> ()) {
        let entry = getQuoteFromStorage() ?? placeholder(in: context)
        completion(entry)
    }

    func getTimeline(in context: Context, completion: @escaping (Timeline<Entry>) -> ()) {
        var entries: [QuoteEntry] = []

        // Quotes aus UserDefaults laden
        let quotes = loadQuotesFromUserDefaults()

        // Timeline mit stündlichen Updates erstellen
        let currentDate = Date()
        for hourOffset in 0..<24 {
            let entryDate = Calendar.current.date(byAdding: .hour, value: hourOffset, to: currentDate)!
            let quote = quotes.randomElement() ?? placeholder(in: context)
            entries.append(QuoteEntry(
                date: entryDate,
                quote: quote.quote,
                author: quote.author,
                category: quote.category
            ))
        }

        let timeline = Timeline(entries: entries, policy: .atEnd)
        completion(timeline)
    }

    private func loadQuotesFromUserDefaults() -> [QuoteModel] {
        guard let data = userDefaults?.data(forKey: "savedQuotes"),
              let quotes = try? JSONDecoder().decode([QuoteModel].self, from: data) else {
            return defaultQuotes()
        }
        return quotes
    }

    private func defaultQuotes() -> [QuoteModel] {
        return [
            QuoteModel(quote: "Innovation distinguishes between a leader and a follower.",
                      author: "Steve Jobs",
                      category: "Leadership"),
            QuoteModel(quote: "The only way to do great work is to love what you do.",
                      author: "Steve Jobs",
                      category: "Motivation")
        ]
    }
}

// Widget View
struct QuotesWidgetView : View {
    var entry: QuoteProvider.Entry
    @Environment(\.widgetFamily) var family

    var body: some View {
        switch family {
        case .systemSmall:
            SmallWidgetView(entry: entry)
        case .systemMedium:
            MediumWidgetView(entry: entry)
        case .systemLarge:
            LargeWidgetView(entry: entry)
        default:
            Text("Unsupported")
        }
    }
}

// Small Widget Layout
struct SmallWidgetView: View {
    let entry: QuoteEntry

    var body: some View {
        VStack(alignment: .leading, spacing: 4) {
            Text(entry.quote)
                .font(.system(size: 14, weight: .medium))
                .lineLimit(3)
                .foregroundColor(.primary)

            Spacer()

            Text("— \(entry.author)")
                .font(.system(size: 12))
                .foregroundColor(.secondary)
                .lineLimit(1)
        }
        .padding()
        .containerBackground(for: .widget) {
            LinearGradient(
                colors: [Color.blue.opacity(0.1), Color.purple.opacity(0.1)],
                startPoint: .topLeading,
                endPoint: .bottomTrailing
            )
        }
    }
}

// Medium Widget Layout
struct MediumWidgetView: View {
    let entry: QuoteEntry

    var body: some View {
        HStack(spacing: 12) {
            VStack(alignment: .leading, spacing: 8) {
                if let category = entry.category {
                    Text(category.uppercased())
                        .font(.system(size: 10, weight: .semibold))
                        .foregroundColor(.blue)
                }

                Text(entry.quote)
                    .font(.system(size: 16, weight: .medium))
                    .lineLimit(3)
                    .foregroundColor(.primary)

                Text("— \(entry.author)")
                    .font(.system(size: 14))
                    .foregroundColor(.secondary)
            }

            Spacer()

            Image(systemName: "quote.bubble.fill")
                .font(.system(size: 30))
                .foregroundColor(.blue.opacity(0.3))
        }
        .padding()
        .containerBackground(for: .widget) {
            Color.clear
        }
    }
}

// Widget Configuration
@main
struct QuotesWidget: Widget {
    let kind: String = "QuotesWidget"

    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: QuoteProvider()) { entry in
            QuotesWidgetView(entry: entry)
        }
        .configurationDisplayName("Daily Quotes")
        .description("Get inspired with a new quote every hour")
        .supportedFamilies([.systemSmall, .systemMedium, .systemLarge])
        .contentMarginsDisabled() // iOS 17+
    }
}

// Quote Model
struct QuoteModel: Codable {
    let quote: String
    let author: String
    let category: String?
}
```

## React Native Integration

### Daten-Sharing zwischen App und Widget

#### Installation der benötigten Pakete

```bash
npm install react-native-shared-group-preferences
# oder
npm install react-native-widget-extension
```

#### SharedDataManager (store/widgetDataManager.ts)

```typescript
import SharedGroupPreferences from 'react-native-shared-group-preferences';

const APP_GROUP = 'group.com.yourcompany.quoteapp.widget';

export class WidgetDataManager {
	static async saveQuotesToWidget(quotes: Quote[]): Promise<void> {
		try {
			const quotesData = JSON.stringify(quotes);
			await SharedGroupPreferences.setItem('savedQuotes', quotesData, APP_GROUP);

			// Widget Update triggern (iOS 14+)
			if (Platform.OS === 'ios') {
				const WidgetKit = NativeModules.WidgetKit;
				WidgetKit?.reloadAllTimelines();
			}
		} catch (error) {
			console.error('Failed to save quotes to widget:', error);
		}
	}

	static async saveDailyQuote(quote: Quote): Promise<void> {
		try {
			const quoteData = JSON.stringify({
				...quote,
				date: new Date().toISOString(),
			});

			await SharedGroupPreferences.setItem('dailyQuote', quoteData, APP_GROUP);

			// Widget aktualisieren
			this.refreshWidget();
		} catch (error) {
			console.error('Failed to save daily quote:', error);
		}
	}

	static async saveUserPreferences(preferences: WidgetPreferences): Promise<void> {
		try {
			await SharedGroupPreferences.setItem(
				'widgetPreferences',
				JSON.stringify(preferences),
				APP_GROUP
			);
		} catch (error) {
			console.error('Failed to save widget preferences:', error);
		}
	}

	static refreshWidget(): void {
		if (Platform.OS === 'ios') {
			NativeModules.WidgetKit?.reloadAllTimelines();
		}
	}
}

interface WidgetPreferences {
	updateFrequency: 'hourly' | 'daily' | 'manual';
	categories: string[];
	theme: 'light' | 'dark' | 'auto';
	fontSize: 'small' | 'medium' | 'large';
}
```

#### Integration in Zustand Store (store/quotesStore.ts Update)

```typescript
import { WidgetDataManager } from './widgetDataManager';

// In Ihrem bestehenden Store
const useQuotesStore = create<QuotesState>()(
	persist(
		(set, get) => ({
			// ... existing state ...

			toggleFavorite: async (quoteId: string) => {
				set((state) => {
					const newFavorites = state.favorites.includes(quoteId)
						? state.favorites.filter((id) => id !== quoteId)
						: [...state.favorites, quoteId];

					// Widget mit aktualisierten Favoriten updaten
					const favoriteQuotes = state.quotes.filter((q) => newFavorites.includes(q.id));
					WidgetDataManager.saveQuotesToWidget(favoriteQuotes);

					return { favorites: newFavorites };
				});
			},

			setDailyQuote: async (quote: Quote) => {
				// Daily Quote im Widget speichern
				await WidgetDataManager.saveDailyQuote(quote);
				set({ dailyQuote: quote });
			},
		})
		// ... persist config ...
	)
);
```

### Native Module für Widget Kit (optional)

Für erweiterte Widget-Kontrolle können Sie ein eigenes Native Module erstellen:

#### WidgetKitModule.swift

```swift
import Foundation
import WidgetKit

@objc(WidgetKitModule)
class WidgetKitModule: NSObject {

  @objc
  func reloadAllTimelines() {
    if #available(iOS 14.0, *) {
      WidgetCenter.shared.reloadAllTimelines()
    }
  }

  @objc
  func reloadTimelines(_ widgetKind: String) {
    if #available(iOS 14.0, *) {
      WidgetCenter.shared.reloadTimelines(ofKind: widgetKind)
    }
  }

  @objc
  static func requiresMainQueueSetup() -> Bool {
    return false
  }
}
```

#### WidgetKitModule.m (Bridge Header)

```objc
#import <React/RCTBridgeModule.h>

@interface RCT_EXTERN_MODULE(WidgetKitModule, NSObject)

RCT_EXTERN_METHOD(reloadAllTimelines)
RCT_EXTERN_METHOD(reloadTimelines:(NSString *)widgetKind)

@end
```

## Widget Features und Best Practices

### 1. Widget Sizes und Layouts

iOS unterstützt verschiedene Widget-Größen:

- **Small**: 2x2 Grid (minimaler Inhalt)
- **Medium**: 4x2 Grid (mehr Details)
- **Large**: 4x4 Grid (vollständiger Inhalt)
- **Extra Large** (iPad): 6x4 Grid

### 2. Timeline Updates

```swift
// In QuoteProvider
func getTimeline(in context: Context, completion: @escaping (Timeline<Entry>) -> ()) {
    let updatePolicy: TimelineReloadPolicy

    // Update-Frequenz basierend auf User Preferences
    if let updateFrequency = userDefaults?.string(forKey: "updateFrequency") {
        switch updateFrequency {
        case "hourly":
            updatePolicy = .after(Date().addingTimeInterval(3600))
        case "daily":
            updatePolicy = .after(Calendar.current.startOfDay(for: Date()).addingTimeInterval(86400))
        default:
            updatePolicy = .atEnd
        }
    } else {
        updatePolicy = .atEnd
    }

    let timeline = Timeline(entries: entries, policy: updatePolicy)
    completion(timeline)
}
```

### 3. Deep Linking

Widget-Taps können die App mit spezifischen Inhalten öffnen:

```swift
// Widget View mit Link
struct QuoteWidgetView: View {
    var entry: QuoteEntry

    var body: some View {
        VStack {
            // Widget Content
        }
        .widgetURL(URL(string: "quoteapp://quote/\(entry.quoteId)"))
    }
}
```

React Native App Handler:

```typescript
import { Linking } from 'react-native';

// In App.tsx
useEffect(() => {
	const handleDeepLink = (url: string) => {
		const route = url.replace('quoteapp://', '');
		if (route.startsWith('quote/')) {
			const quoteId = route.replace('quote/', '');
			// Navigate to quote details
			navigation.navigate('QuoteDetail', { quoteId });
		}
	};

	const subscription = Linking.addEventListener('url', ({ url }) => {
		handleDeepLink(url);
	});

	return () => subscription.remove();
}, []);
```

### 4. Live Activities (iOS 16+)

Für dynamische Updates (z.B. Quote of the Day Countdown):

```swift
// LiveActivity Attributes
struct QuoteLiveActivityAttributes: ActivityAttributes {
    public struct ContentState: Codable, Hashable {
        var quote: String
        var author: String
        var expiresAt: Date
    }

    var category: String
}

// Start Live Activity from React Native
NativeModules.LiveActivityModule.startQuoteActivity({
  quote: "Your quote here",
  author: "Author Name",
  category: "Motivation",
  duration: 3600 // seconds
});
```

## Testing und Debugging

### 1. Widget Testing im Simulator

```bash
# Build und Run
npx expo run:ios

# In Xcode:
# 1. Scheme zu "widgetExtension" wechseln
# 2. Run auf Simulator
# 3. Widget über Home Screen hinzufügen
```

### 2. Debug Console Logs

In widget.swift:

```swift
import os.log

extension Logger {
    static let widget = Logger(subsystem: "com.yourcompany.quoteapp.widget", category: "widget")
}

// Usage
Logger.widget.info("Loading quotes from UserDefaults")
```

### 3. Widget Preview in SwiftUI

```swift
struct QuotesWidget_Previews: PreviewProvider {
    static var previews: some View {
        Group {
            QuotesWidgetView(entry: QuoteEntry(
                date: Date(),
                quote: "Preview Quote",
                author: "Preview Author",
                category: "Preview"
            ))
            .previewContext(WidgetPreviewContext(family: .systemSmall))

            QuotesWidgetView(entry: QuoteEntry(
                date: Date(),
                quote: "Preview Quote",
                author: "Preview Author",
                category: "Preview"
            ))
            .previewContext(WidgetPreviewContext(family: .systemMedium))
        }
    }
}
```

## Häufige Probleme und Lösungen

### Problem 1: Widget zeigt keine Daten

**Lösung:**

1. Überprüfen Sie App Group Configuration
2. Stellen Sie sicher, dass beide Targets dieselbe App Group verwenden
3. Prüfen Sie UserDefaults Suite Name

### Problem 2: Widget Updates nicht

**Lösung:**

```typescript
// Force Widget Reload
import { NativeModules } from 'react-native';

const forceWidgetUpdate = () => {
	if (Platform.OS === 'ios') {
		NativeModules.WidgetKit?.reloadAllTimelines();
	}
};
```

### Problem 3: Build Fehler nach Widget Addition

**Lösung:**

```bash
# Clean Build
cd ios
rm -rf Pods Podfile.lock
pod install
cd ..
npx expo run:ios --clear
```

### Problem 4: Widget erscheint nicht in Widget Gallery

**Lösung:**

- Minimum Deployment Target prüfen (iOS 14.0+)
- Info.plist Einträge verifizieren
- Bundle Identifier Format überprüfen

## Performance Optimierung

### 1. Bildoptimierung

```swift
// Bilder für Widgets vorbereiten
func prepareImageForWidget(_ image: UIImage, size: CGSize) -> UIImage? {
    UIGraphicsBeginImageContextWithOptions(size, false, 0.0)
    image.draw(in: CGRect(origin: .zero, size: size))
    let optimizedImage = UIGraphicsGetImageFromCurrentImageContext()
    UIGraphicsEndImageContext()
    return optimizedImage
}
```

### 2. Daten-Caching

```typescript
// Efficient Data Storage
class WidgetCache {
	static async cacheQuotes(quotes: Quote[]) {
		// Nur die nötigen Felder speichern
		const minimalQuotes = quotes.map((q) => ({
			id: q.id,
			quote: q.quote.substring(0, 200), // Limit text length
			author: q.author,
			category: q.category,
		}));

		await WidgetDataManager.saveQuotesToWidget(minimalQuotes);
	}
}
```

### 3. Timeline Optimization

```swift
// Intelligente Timeline Generation
func getTimeline(in context: Context, completion: @escaping (Timeline<Entry>) -> ()) {
    let entries: [QuoteEntry]

    if context.isPreview {
        // Minimal entries for preview
        entries = [getPlaceholderEntry()]
    } else if context.family == .systemSmall {
        // Fewer entries for small widgets
        entries = generateEntries(count: 12)
    } else {
        // Standard timeline
        entries = generateEntries(count: 24)
    }

    let timeline = Timeline(entries: entries, policy: .atEnd)
    completion(timeline)
}
```

## Deployment Checkliste

### Pre-Deployment

- [ ] App Group korrekt konfiguriert
- [ ] Widget Bundle Identifier folgt Apple Guidelines
- [ ] Alle erforderlichen Entitlements gesetzt
- [ ] Widget Icons in allen Größen vorhanden
- [ ] Lokalisierung implementiert (falls nötig)
- [ ] Privacy Descriptions in Info.plist

### Testing

- [ ] Widget auf verschiedenen iOS Versionen getestet
- [ ] Alle Widget Größen funktionieren
- [ ] Deep Links funktionieren korrekt
- [ ] Widget Updates korrekt bei App-Änderungen
- [ ] Memory Usage optimiert
- [ ] Offline-Funktionalität gewährleistet

### App Store Vorbereitung

- [ ] Widget Screenshots erstellt
- [ ] Widget Beschreibung vorbereitet
- [ ] App Store Connect Widget Information ausgefüllt

## Ressourcen und Weiterführende Links

### Offizielle Dokumentation

- [Apple WidgetKit Documentation](https://developer.apple.com/documentation/widgetkit)
- [Expo Config Plugins](https://docs.expo.dev/config-plugins/introduction/)
- [React Native Share Extension](https://github.com/alinz/react-native-share-extension)

### Community Resources

- [Evan Bacon's Apple Targets Plugin](https://github.com/EvanBacon/expo-apple-targets)
- [EAS Widget Example](https://github.com/gaishimo/eas-widget-example)
- [React Native Widget Bridge](https://github.com/fasky-software/react-native-widget-bridge)

### Tutorials und Beispiele

- [SwiftUI Widget Tutorial](https://www.hackingwithswift.com/books/ios-swiftui/introduction-to-widgetkit)
- [Expo Managed Workflow Widgets](https://www.peterarontoth.com/posts/interactive-widgets-in-expo-managed-workflows)

## Zusammenfassung

Die Implementation von iOS Widgets in einer Expo React Native App erfordert:

1. **Development Build** statt Expo Go
2. **Config Plugin** (@bacons/apple-targets empfohlen)
3. **App Groups** für Daten-Sharing
4. **Swift/SwiftUI** Kenntnisse für Widget UI
5. **UserDefaults/SharedGroupPreferences** für Kommunikation
6. **Timeline Provider** für Content Updates

Mit dieser Anleitung sollten Sie in der Lage sein, funktionale und ansprechende Widgets für Ihre Quotes App zu erstellen, die nahtlos mit Ihrer React Native App kommunizieren.
