# iOS Widget Implementation Plan für Memoro

## Überblick

Dieses Dokument beschreibt die geplante Implementierung von iOS Home Screen Widgets und Live Activities für die Memoro App. Widgets ermöglichen es Nutzern, schnellen Zugriff auf ihre wichtigsten Memos direkt vom Home Screen aus zu haben, ohne die App öffnen zu müssen.

**Status:** Planning Phase
**Ziel-Release:** TBD
**Minimum iOS Version:** iOS 16.0+
**Expo SDK:** 54+ (current: SDK 54 ✓)

---

## Motivation & Use Cases

### Warum Widgets für Memoro?

1. **Quick Access** - Sofortiger Zugriff auf wichtige Memos
2. **Glanceable Information** - Überblick über letzte Aufnahmen
3. **Recording Shortcut** - Direkt zur Aufnahme-Funktion springen
4. **Engagement** - Erhöhte App-Nutzung durch Visibility
5. **iOS Ecosystem Integration** - Native iOS Experience

### Primäre Use Cases

1. **Latest Memo Widget** - Zeigt das zuletzt erstellte Memo
2. **Pinned Memos Widget** - Schnellzugriff auf gepinnte Memos
3. **Quick Record Widget** - One-Tap Aufnahme-Button
4. **Statistics Widget** - Memo-Count und Nutzungsstatistiken
5. **Daily Inspiration Widget** - Zufälliges Memo aus der History

---

## Technische Anforderungen

### System Requirements

- ✅ **macOS 15 Sequoia** (Development)
- ✅ **Xcode 16** oder höher
- ✅ **Expo SDK 54** (bereits vorhanden)
- ✅ **iOS 16+** Target Deployment
- ✅ **Apple Team ID:** ZB76J8YWG6 (bereits konfiguriert)
- ⚠️ **Development Build** erforderlich (kein Expo Go Support)

### Dependencies

#### Neue Packages (zu installieren)

```bash
# Widget Plugin (empfohlen von Expo Team)
npm install @bacons/apple-targets

# Shared Data zwischen App & Widget
npm install react-native-shared-group-preferences
```

#### Existing Dependencies (bereits vorhanden)

- ✅ `expo-router` - Deep Linking Support
- ✅ `zustand` mit persist - State Management
- ✅ `AsyncStorage` - Data Persistence
- ✅ `expo-secure-store` - Sensitive Data

---

## Geplante Widget-Typen

### 1. Latest Memo Widget

**Beschreibung:** Zeigt das zuletzt erstellte Memo mit Titel, Datum und Quick Actions.

**Größen:**

- **Small (2x2):** Nur Titel + Datum
- **Medium (4x2):** Titel + Intro + Datum + Space Badge
- **Large (4x4):** Titel + Vollständiger Intro + Transcript Preview + Metadata

**Daten:**

```typescript
interface LatestMemoWidget {
	memoId: string;
	title: string;
	intro?: string;
	transcriptPreview?: string; // First 200 chars
	createdAt: Date;
	spaceName?: string;
	spaceColor?: string;
	audioLength?: number;
	hasTranscript: boolean;
}
```

**Deep Links:**

- Widget Tap → Öffnet Memo Detail (`memoro://memo/{id}`)
- Space Badge → Öffnet Space (`memoro://space/{id}`)

---

### 2. Pinned Memos Widget

**Beschreibung:** Grid-Layout mit gepinnten Memos für schnellen Zugriff.

**Größen:**

- **Small (2x2):** 1 Memo (Featured)
- **Medium (4x2):** 2-3 Memos (Horizontal Stack)
- **Large (4x4):** 4-6 Memos (Grid Layout)

**Daten:**

```typescript
interface PinnedMemosWidget {
	memos: Array<{
		id: string;
		title: string;
		snippet: string; // First 50 chars
		isPinned: boolean;
		spaceColor?: string;
		createdAt: Date;
	}>;
	totalCount: number;
}
```

**Features:**

- Tappable Cards → Öffnet jeweiliges Memo
- Empty State → "No pinned memos" mit Link zu App
- Sortierung nach Pin-Datum (neueste zuerst)

---

### 3. Quick Record Widget

**Beschreibung:** One-Tap Recording Start mit minimalistischem Design.

**Größen:**

- **Small (2x2):** Großer Aufnahme-Button + Mikrofon Icon
- ~~Medium~~ (nicht sinnvoll für diesen Type)
- ~~Large~~ (nicht sinnvoll für diesen Type)

**Daten:**

```typescript
interface QuickRecordWidget {
	selectedSpaceId?: string;
	selectedBlueprintId?: string;
	recordingLanguages?: string[];
}
```

**Deep Links:**

- Widget Tap → Öffnet Recording Screen mit vorausgewählten Settings

**Visual Design:**

- Großes Mikrofon-Icon (SF Symbol)
- Gradient Background (Theme Colors)
- Text: "Start Recording" oder "Aufnehmen"
- Badge mit letztem Space (optional)

---

### 4. Statistics Widget

**Beschreibung:** Übersicht über Nutzungsstatistiken und Achievements.

**Größen:**

- **Small (2x2):** Memo Count + Trend Icon
- **Medium (4x2):** Count + Duration + Last Week Stats
- **Large (4x4):** Detailed Stats + Chart + Breakdown by Space

**Daten:**

```typescript
interface StatisticsWidget {
	totalMemos: number;
	totalDuration: number; // seconds
	thisWeekCount: number;
	thisMonthCount: number;
	favoriteCount: number;
	spaceBreakdown?: Array<{
		spaceName: string;
		count: number;
		color: string;
	}>;
	longestMemo?: {
		title: string;
		duration: number;
	};
}
```

**Features:**

- Trend Indicators (↑↓)
- Weekly Progress Bar
- Tap → Öffnet Statistics Screen (neu zu bauen)

---

### 5. Random Inspiration Widget (Phase 2)

**Beschreibung:** Zeigt ein zufälliges Memo zur Inspiration.

**Größen:** Alle (Small, Medium, Large)

**Update Frequency:** Täglich um Mitternacht

**Daten:**

```typescript
interface InspirationWidget {
	randomMemo: {
		id: string;
		title: string;
		snippet: string;
		createdAt: Date;
		tags?: string[];
	};
	refreshDate: Date;
}
```

---

## Implementierungsphasen

### Phase 1: Grundlagen (Woche 1-2)

**Ziel:** Widget Infrastructure & Latest Memo Widget

#### Tasks:

1. **Setup & Configuration**
   - [ ] Install `@bacons/apple-targets`
   - [ ] Create widget target: `npx create-target widget`
   - [ ] Configure App Groups in app.json
   - [ ] Update bundle identifiers
   - [ ] Add entitlements

2. **Data Sharing Layer**
   - [ ] Create `features/widgets/services/widgetDataManager.ts`
   - [ ] Implement SharedGroupPreferences wrapper
   - [ ] Create widget data types
   - [ ] Test data sharing in development build

3. **Swift Widget - Latest Memo**
   - [ ] Create `LatestMemoWidget.swift`
   - [ ] Implement Timeline Provider
   - [ ] Design Small/Medium/Large layouts
   - [ ] Add placeholder data
   - [ ] Test in Simulator

4. **React Native Integration**
   - [ ] Update `memoStore.ts` to sync with widget
   - [ ] Add widget refresh trigger
   - [ ] Implement deep link handling
   - [ ] Test end-to-end flow

**Deliverable:** Functional Latest Memo Widget in all 3 sizes

---

### Phase 2: Additional Widgets (Woche 3-4)

**Ziel:** Quick Record & Pinned Memos Widgets

#### Tasks:

1. **Quick Record Widget**
   - [ ] Create `QuickRecordWidget.swift`
   - [ ] Design small widget layout
   - [ ] Implement recording preferences sharing
   - [ ] Add intent configuration (optional space/blueprint)
   - [ ] Test deep link to recording screen

2. **Pinned Memos Widget**
   - [ ] Create `PinnedMemosWidget.swift`
   - [ ] Implement grid layout for large widget
   - [ ] Add pin/unpin sync from app
   - [ ] Design empty state
   - [ ] Test with multiple pinned memos

3. **Widget Gallery Assets**
   - [ ] Create widget preview screenshots
   - [ ] Design widget icons
   - [ ] Add localized descriptions

**Deliverable:** 3 functional widget types

---

### Phase 3: Statistics & Polish (Woche 5-6)

**Ziel:** Statistics Widget & UX Improvements

#### Tasks:

1. **Statistics Widget**
   - [ ] Create `StatisticsWidget.swift`
   - [ ] Implement data aggregation in React Native
   - [ ] Design chart/visualization for large widget
   - [ ] Add trend calculations
   - [ ] Build statistics screen in app (new)

2. **Performance Optimization**
   - [ ] Optimize widget timeline generation
   - [ ] Reduce data size for widget sharing
   - [ ] Add caching layer
   - [ ] Test memory usage
   - [ ] Profile widget rendering

3. **UX & Polish**
   - [ ] Add animations/transitions
   - [ ] Implement dark mode support
   - [ ] Add localization (DE, EN)
   - [ ] Error state handling
   - [ ] Offline functionality

**Deliverable:** Production-ready widgets

---

### Phase 4: Live Activities (Optional - Woche 7-8)

**Ziel:** Live Activities für aktive Aufnahmen

**Features:**

- Live recording duration
- Pause/Resume controls
- Waveform visualization
- Recording language indicator

**Status:** Nice-to-have, nicht kritisch für v1

---

## Architektur

### Datenfluss

```
┌─────────────────────────────────────────────────────┐
│                  Memoro React Native App             │
│  ┌───────────────────────────────────────────────┐  │
│  │  Zustand Stores (memoStore, spaceStore, etc) │  │
│  └──────────────┬───────────────────────────────┘  │
│                 │                                    │
│  ┌──────────────▼──────────────────────────────┐   │
│  │   WidgetDataManager (TypeScript)            │   │
│  │   - Prepares data for widget                │   │
│  │   - Calls SharedGroupPreferences            │   │
│  │   - Triggers widget refresh                 │   │
│  └──────────────┬──────────────────────────────┘   │
└─────────────────┼──────────────────────────────────┘
                  │
                  │ SharedGroupPreferences
                  │ (App Group: group.com.memo.beta.widget)
                  │
┌─────────────────▼──────────────────────────────────┐
│          iOS Widget Extension (Swift)              │
│  ┌──────────────────────────────────────────────┐ │
│  │   Timeline Provider                          │ │
│  │   - Reads from UserDefaults (App Group)     │ │
│  │   - Generates timeline entries               │ │
│  │   - Schedules updates                        │ │
│  └──────────────┬───────────────────────────────┘ │
│                 │                                  │
│  ┌──────────────▼───────────────────────────────┐ │
│  │   Widget Views (SwiftUI)                    │ │
│  │   - LatestMemoWidget                        │ │
│  │   - PinnedMemosWidget                       │ │
│  │   - QuickRecordWidget                       │ │
│  │   - StatisticsWidget                        │ │
│  └─────────────────────────────────────────────┘ │
└────────────────────────────────────────────────────┘
```

### Verzeichnisstruktur

```
memoro/
├── app.json                         # App Group & Plugin Config
├── targets/                         # Widget Extension
│   └── widget/
│       ├── expo-target.config.js    # Widget Configuration
│       ├── LatestMemoWidget.swift   # Latest Memo Widget
│       ├── PinnedMemosWidget.swift  # Pinned Memos Widget
│       ├── QuickRecordWidget.swift  # Quick Record Widget
│       ├── StatisticsWidget.swift   # Statistics Widget
│       ├── WidgetBundle.swift       # Widget Collection
│       ├── Models.swift             # Shared Data Models
│       ├── WidgetView.swift         # Common UI Components
│       └── Assets.xcassets/         # Widget Assets
│
├── features/
│   └── widgets/
│       ├── services/
│       │   └── widgetDataManager.ts     # Data Sharing Service
│       ├── types/
│       │   └── widget.types.ts          # TypeScript Types
│       ├── hooks/
│       │   ├── useWidgetData.ts         # Widget Data Hook
│       │   └── useWidgetRefresh.ts      # Refresh Hook
│       └── index.ts                     # Public API
│
├── docs/
│   └── features/
│       ├── ios-widget-implementation-plan.md (this file)
│       └── ios-widget-user-guide.md     # End-user documentation
│
└── assets/
    └── widgets/
        ├── widget-icon.png
        ├── widget-icon@2x.png
        └── widget-icon@3x.png
```

---

## Konfiguration

### app.json Updates

```json
{
	"expo": {
		"ios": {
			"bundleIdentifier": "com.memo.beta",
			"appleTeamId": "ZB76J8YWG6",
			"entitlements": {
				"com.apple.security.application-groups": ["group.com.memo.beta.widget"]
			}
		},
		"plugins": [
			// ... existing plugins ...
			[
				"@bacons/apple-targets",
				{
					"appleTeamId": "ZB76J8YWG6"
				}
			]
		]
	}
}
```

### Widget Target Config (targets/widget/expo-target.config.js)

```javascript
/** @type {import('@bacons/apple-targets/app.plugin').Config} */
module.exports = {
	type: 'widget',
	name: 'MemoroWidget',
	bundleIdentifier: '$(PRODUCT_BUNDLE_IDENTIFIER).widget',
	deploymentTarget: '16.0',
	icon: '../../assets/widgets/widget-icon.png',
	colors: {
		$accent: {
			color: '#007AFF', // iOS Blue
			darkColor: '#0A84FF', // iOS Blue Dark
		},
		$widgetBackground: {
			color: '#FFFFFF',
			darkColor: '#1C1C1E',
		},
	},
	entitlements: {
		'com.apple.security.application-groups': ['group.com.memo.beta.widget'],
	},
	frameworks: ['SwiftUI', 'WidgetKit'],
};
```

---

## Data Sharing Implementation

### WidgetDataManager Service

**File:** `features/widgets/services/widgetDataManager.ts`

```typescript
import SharedGroupPreferences from 'react-native-shared-group-preferences';
import { NativeModules, Platform } from 'react-native';

const APP_GROUP = 'group.com.memo.beta.widget';

export interface WidgetMemoData {
	id: string;
	title: string;
	intro?: string;
	transcriptPreview?: string;
	createdAt: string; // ISO format
	spaceName?: string;
	spaceColor?: string;
	audioLength?: number;
	hasTranscript: boolean;
}

export interface WidgetPinnedMemo {
	id: string;
	title: string;
	snippet: string;
	isPinned: boolean;
	spaceColor?: string;
	createdAt: string;
}

export interface WidgetStatistics {
	totalMemos: number;
	totalDuration: number;
	thisWeekCount: number;
	thisMonthCount: number;
	favoriteCount: number;
	spaceBreakdown?: Array<{
		spaceName: string;
		count: number;
		color: string;
	}>;
}

export class WidgetDataManager {
	/**
	 * Update latest memo data for widget
	 */
	static async updateLatestMemo(memo: WidgetMemoData): Promise<void> {
		try {
			const data = JSON.stringify(memo);
			await SharedGroupPreferences.setItem('latestMemo', data, APP_GROUP);
			this.refreshWidget();
		} catch (error) {
			console.error('[WidgetDataManager] Failed to update latest memo:', error);
		}
	}

	/**
	 * Update pinned memos for widget
	 */
	static async updatePinnedMemos(memos: WidgetPinnedMemo[]): Promise<void> {
		try {
			// Only send top 6 pinned memos (for large widget)
			const limitedMemos = memos.slice(0, 6);
			const data = JSON.stringify(limitedMemos);
			await SharedGroupPreferences.setItem('pinnedMemos', data, APP_GROUP);
			this.refreshWidget();
		} catch (error) {
			console.error('[WidgetDataManager] Failed to update pinned memos:', error);
		}
	}

	/**
	 * Update statistics for widget
	 */
	static async updateStatistics(stats: WidgetStatistics): Promise<void> {
		try {
			const data = JSON.stringify(stats);
			await SharedGroupPreferences.setItem('statistics', data, APP_GROUP);
			this.refreshWidget();
		} catch (error) {
			console.error('[WidgetDataManager] Failed to update statistics:', error);
		}
	}

	/**
	 * Update recording preferences for Quick Record widget
	 */
	static async updateRecordingPreferences(preferences: {
		selectedSpaceId?: string;
		selectedBlueprintId?: string;
		recordingLanguages?: string[];
	}): Promise<void> {
		try {
			const data = JSON.stringify(preferences);
			await SharedGroupPreferences.setItem('recordingPreferences', data, APP_GROUP);
			this.refreshWidget();
		} catch (error) {
			console.error('[WidgetDataManager] Failed to update recording preferences:', error);
		}
	}

	/**
	 * Trigger widget refresh (iOS 14+)
	 */
	static refreshWidget(): void {
		if (Platform.OS === 'ios') {
			try {
				NativeModules.WidgetKit?.reloadAllTimelines();
			} catch (error) {
				console.warn('[WidgetDataManager] Could not reload widget timelines:', error);
			}
		}
	}

	/**
	 * Clear all widget data
	 */
	static async clearWidgetData(): Promise<void> {
		try {
			await SharedGroupPreferences.setItem('latestMemo', '', APP_GROUP);
			await SharedGroupPreferences.setItem('pinnedMemos', '', APP_GROUP);
			await SharedGroupPreferences.setItem('statistics', '', APP_GROUP);
			await SharedGroupPreferences.setItem('recordingPreferences', '', APP_GROUP);
			this.refreshWidget();
		} catch (error) {
			console.error('[WidgetDataManager] Failed to clear widget data:', error);
		}
	}
}
```

---

## Integration mit bestehenden Stores

### Memo Store Integration

**File:** `features/memos/store/memoStore.ts`

```typescript
import { WidgetDataManager } from '~/features/widgets/services/widgetDataManager';

// In setLatestMemo action:
setLatestMemo: (memo: Memo | null) => {
	set({ latestMemo: memo });

	// Update widget data
	if (memo) {
		WidgetDataManager.updateLatestMemo({
			id: memo.id,
			title: memo.title,
			intro: memo.metadata?.intro?.substring(0, 200),
			transcriptPreview: memo.source?.transcript?.substring(0, 200),
			createdAt: memo.created_at || new Date().toISOString(),
			spaceName: memo.space?.name,
			spaceColor: memo.space?.color,
			audioLength: memo.source?.duration_seconds,
			hasTranscript: !!memo.source?.transcript,
		});
	}
};

// In togglePin action:
togglePin: async (memoId: string) => {
	// ... existing pin logic ...

	// Update widget with pinned memos
	const pinnedMemos = state.memos.filter((m) => m.is_pinned);
	WidgetDataManager.updatePinnedMemos(
		pinnedMemos.map((m) => ({
			id: m.id,
			title: m.title,
			snippet: m.source?.transcript?.substring(0, 50) || '',
			isPinned: true,
			spaceColor: m.space?.color,
			createdAt: m.created_at || new Date().toISOString(),
		}))
	);
};
```

---

## Swift Widget Example - Latest Memo

**File:** `targets/widget/LatestMemoWidget.swift`

```swift
import WidgetKit
import SwiftUI

// MARK: - Data Models
struct MemoWidgetData: Codable {
    let id: String
    let title: String
    let intro: String?
    let transcriptPreview: String?
    let createdAt: String
    let spaceName: String?
    let spaceColor: String?
    let audioLength: Int?
    let hasTranscript: Bool
}

// MARK: - Timeline Entry
struct LatestMemoEntry: TimelineEntry {
    let date: Date
    let memo: MemoWidgetData?
}

// MARK: - Timeline Provider
struct LatestMemoProvider: TimelineProvider {
    let userDefaults = UserDefaults(suiteName: "group.com.memo.beta.widget")

    func placeholder(in context: Context) -> LatestMemoEntry {
        LatestMemoEntry(
            date: Date(),
            memo: MemoWidgetData(
                id: "placeholder",
                title: "Willkommen bei Memoro",
                intro: "Dein letztes Memo erscheint hier",
                transcriptPreview: nil,
                createdAt: ISO8601DateFormatter().string(from: Date()),
                spaceName: nil,
                spaceColor: nil,
                audioLength: nil,
                hasTranscript: false
            )
        )
    }

    func getSnapshot(in context: Context, completion: @escaping (LatestMemoEntry) -> ()) {
        let entry = loadLatestMemo() ?? placeholder(in: context)
        completion(entry)
    }

    func getTimeline(in context: Context, completion: @escaping (Timeline<Entry>) -> ()) {
        let entry = loadLatestMemo() ?? placeholder(in: context)

        // Update timeline every hour
        let nextUpdate = Calendar.current.date(byAdding: .hour, value: 1, to: Date())!
        let timeline = Timeline(entries: [entry], policy: .after(nextUpdate))
        completion(timeline)
    }

    private func loadLatestMemo() -> LatestMemoEntry? {
        guard let data = userDefaults?.data(forKey: "latestMemo"),
              let memo = try? JSONDecoder().decode(MemoWidgetData.self, from: data) else {
            return nil
        }

        return LatestMemoEntry(date: Date(), memo: memo)
    }
}

// MARK: - Widget Views
struct LatestMemoWidgetView: View {
    var entry: LatestMemoProvider.Entry
    @Environment(\.widgetFamily) var family

    var body: some View {
        switch family {
        case .systemSmall:
            SmallLatestMemoView(entry: entry)
        case .systemMedium:
            MediumLatestMemoView(entry: entry)
        case .systemLarge:
            LargeLatestMemoView(entry: entry)
        default:
            EmptyView()
        }
    }
}

// MARK: - Small Widget (2x2)
struct SmallLatestMemoView: View {
    let entry: LatestMemoEntry

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            // Header
            HStack {
                Image(systemName: "waveform")
                    .font(.system(size: 16))
                    .foregroundColor(.blue)
                Text("Latest")
                    .font(.system(size: 12, weight: .semibold))
                    .foregroundColor(.secondary)
                Spacer()
            }

            // Title
            if let memo = entry.memo {
                Text(memo.title)
                    .font(.system(size: 14, weight: .semibold))
                    .lineLimit(2)
                    .foregroundColor(.primary)

                Spacer()

                // Date
                Text(formatDate(memo.createdAt))
                    .font(.system(size: 11))
                    .foregroundColor(.secondary)
            } else {
                Text("No memo yet")
                    .font(.system(size: 14))
                    .foregroundColor(.secondary)
            }
        }
        .padding()
        .containerBackground(for: .widget) {
            Color.clear
        }
    }

    private func formatDate(_ isoString: String) -> String {
        let formatter = ISO8601DateFormatter()
        guard let date = formatter.date(from: isoString) else {
            return ""
        }

        let calendar = Calendar.current
        if calendar.isDateInToday(date) {
            return "Heute"
        } else if calendar.isDateInYesterday(date) {
            return "Gestern"
        } else {
            let dateFormatter = DateFormatter()
            dateFormatter.dateFormat = "dd.MM.yy"
            return dateFormatter.string(from: date)
        }
    }
}

// MARK: - Medium Widget (4x2)
struct MediumLatestMemoView: View {
    let entry: LatestMemoEntry

    var body: some View {
        HStack(spacing: 12) {
            VStack(alignment: .leading, spacing: 6) {
                // Header with Space Badge
                HStack {
                    Image(systemName: "waveform")
                        .font(.system(size: 14))
                        .foregroundColor(.blue)

                    if let spaceName = entry.memo?.spaceName {
                        Text(spaceName)
                            .font(.system(size: 10, weight: .semibold))
                            .padding(.horizontal, 6)
                            .padding(.vertical, 2)
                            .background(Color(hex: entry.memo?.spaceColor ?? "#007AFF").opacity(0.2))
                            .cornerRadius(4)
                    }

                    Spacer()
                }

                // Title
                if let memo = entry.memo {
                    Text(memo.title)
                        .font(.system(size: 15, weight: .semibold))
                        .lineLimit(2)
                        .foregroundColor(.primary)

                    // Intro
                    if let intro = memo.intro {
                        Text(intro)
                            .font(.system(size: 12))
                            .lineLimit(2)
                            .foregroundColor(.secondary)
                    }

                    Spacer()

                    // Footer
                    HStack {
                        Text(formatDate(memo.createdAt))
                            .font(.system(size: 11))
                            .foregroundColor(.secondary)

                        if let audioLength = memo.audioLength {
                            Text("•")
                                .foregroundColor(.secondary)
                            Text(formatDuration(audioLength))
                                .font(.system(size: 11))
                                .foregroundColor(.secondary)
                        }

                        if memo.hasTranscript {
                            Spacer()
                            Image(systemName: "checkmark.circle.fill")
                                .font(.system(size: 12))
                                .foregroundColor(.green)
                        }
                    }
                }
            }
        }
        .padding()
        .containerBackground(for: .widget) {
            Color.clear
        }
    }

    private func formatDate(_ isoString: String) -> String {
        // Same as SmallWidget
        let formatter = ISO8601DateFormatter()
        guard let date = formatter.date(from: isoString) else { return "" }

        let calendar = Calendar.current
        if calendar.isDateInToday(date) {
            return "Heute"
        } else if calendar.isDateInYesterday(date) {
            return "Gestern"
        } else {
            let dateFormatter = DateFormatter()
            dateFormatter.dateFormat = "dd.MM.yy"
            return dateFormatter.string(from: date)
        }
    }

    private func formatDuration(_ seconds: Int) -> String {
        let minutes = seconds / 60
        let remainingSeconds = seconds % 60
        return String(format: "%d:%02d", minutes, remainingSeconds)
    }
}

// MARK: - Large Widget (4x4)
struct LargeLatestMemoView: View {
    let entry: LatestMemoEntry

    var body: some View {
        // Similar to Medium but with more content
        // Add transcript preview, tags, etc.
        MediumLatestMemoView(entry: entry) // Placeholder
    }
}

// MARK: - Widget Configuration
@main
struct LatestMemoWidget: Widget {
    let kind: String = "LatestMemoWidget"

    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: LatestMemoProvider()) { entry in
            LatestMemoWidgetView(entry: entry)
        }
        .configurationDisplayName("Letztes Memo")
        .description("Zeigt dein zuletzt erstelltes Memo")
        .supportedFamilies([.systemSmall, .systemMedium, .systemLarge])
        .contentMarginsDisabled()
    }
}

// MARK: - Helper Extension
extension Color {
    init(hex: String) {
        let hex = hex.trimmingCharacters(in: CharacterSet.alphanumerics.inverted)
        var int: UInt64 = 0
        Scanner(string: hex).scanHexInt64(&int)
        let a, r, g, b: UInt64
        switch hex.count {
        case 3: // RGB (12-bit)
            (a, r, g, b) = (255, (int >> 8) * 17, (int >> 4 & 0xF) * 17, (int & 0xF) * 17)
        case 6: // RGB (24-bit)
            (a, r, g, b) = (255, int >> 16, int >> 8 & 0xFF, int & 0xFF)
        case 8: // ARGB (32-bit)
            (a, r, g, b) = (int >> 24, int >> 16 & 0xFF, int >> 8 & 0xFF, int & 0xFF)
        default:
            (a, r, g, b) = (1, 1, 1, 0)
        }

        self.init(
            .sRGB,
            red: Double(r) / 255,
            green: Double(g) / 255,
            blue: Double(b) / 255,
            opacity: Double(a) / 255
        )
    }
}
```

---

## Deep Linking

### URL Scheme

**Format:** `memoro://[screen]/[id]`

**Examples:**

- `memoro://memo/abc-123` → Opens memo detail
- `memoro://space/xyz-789` → Opens space view
- `memoro://record` → Opens recording screen
- `memoro://record?space=xyz` → Opens recording with pre-selected space

### Implementation in App

**File:** `app/_layout.tsx`

```typescript
import { Linking } from 'react-native';
import { useRouter } from 'expo-router';

export default function RootLayout() {
	const router = useRouter();

	useEffect(() => {
		// Handle deep links from widgets
		const handleDeepLink = (url: string) => {
			const route = url.replace('memoro://', '');

			if (route.startsWith('memo/')) {
				const memoId = route.replace('memo/', '');
				router.push(`/(protected)/(memo)/${memoId}`);
			} else if (route.startsWith('space/')) {
				const spaceId = route.replace('space/', '');
				router.push(`/(protected)/(space)/${spaceId}`);
			} else if (route === 'record') {
				router.push('/(protected)/(tabs)/');
			}
		};

		// Listen for deep links
		const subscription = Linking.addEventListener('url', ({ url }) => {
			handleDeepLink(url);
		});

		// Handle initial URL if app was closed
		Linking.getInitialURL().then((url) => {
			if (url) handleDeepLink(url);
		});

		return () => subscription.remove();
	}, [router]);

	// ... rest of layout
}
```

---

## Testing Strategy

### Unit Tests

**File:** `features/widgets/services/__tests__/widgetDataManager.test.ts`

```typescript
import { WidgetDataManager } from '../widgetDataManager';

describe('WidgetDataManager', () => {
	it('should update latest memo data', async () => {
		const mockMemo = {
			id: 'test-123',
			title: 'Test Memo',
			intro: 'Test intro',
			createdAt: new Date().toISOString(),
			hasTranscript: true,
		};

		await WidgetDataManager.updateLatestMemo(mockMemo);
		// Assert SharedGroupPreferences was called
	});

	it('should limit pinned memos to 6', async () => {
		const manyMemos = Array.from({ length: 10 }, (_, i) => ({
			id: `memo-${i}`,
			title: `Memo ${i}`,
			snippet: 'snippet',
			isPinned: true,
			createdAt: new Date().toISOString(),
		}));

		await WidgetDataManager.updatePinnedMemos(manyMemos);
		// Assert only 6 memos were saved
	});
});
```

### Integration Tests

1. **Widget Data Flow Test**
   - Create memo in app
   - Verify widget shows updated data
   - Time threshold: < 2 seconds

2. **Deep Link Test**
   - Tap widget
   - Verify correct screen opens
   - Verify correct data is displayed

3. **Performance Test**
   - Measure widget refresh time
   - Target: < 100ms
   - Test with large datasets

---

## Performance Optimization

### Best Practices

1. **Data Size Limits**
   - Latest Memo: < 5 KB
   - Pinned Memos: < 10 KB (6 memos max)
   - Statistics: < 3 KB
   - Total widget data: < 20 KB

2. **Timeline Generation**
   - Small widgets: 12 entries (12 hours)
   - Medium/Large: 24 entries (24 hours)
   - Update policy: `.after(nextHour)`

3. **Image Optimization**
   - No images in Phase 1
   - Use SF Symbols for icons
   - Future: Compress images to < 50 KB

4. **Memory Usage**
   - Widget process limit: 30 MB
   - Keep under 20 MB for safety
   - Profile with Xcode Instruments

---

## Localization

### Supported Languages

- **German (DE)** - Primary
- **English (EN)** - Secondary

### Translation Keys

**Widget Titles:**

- `widget.latest_memo.title` = "Letztes Memo" / "Latest Memo"
- `widget.pinned_memos.title` = "Gepinnte Memos" / "Pinned Memos"
- `widget.quick_record.title` = "Aufnahme" / "Record"
- `widget.statistics.title` = "Statistiken" / "Statistics"

**Widget Descriptions:**

- `widget.latest_memo.description` = "Zeigt dein zuletzt erstelltes Memo"
- `widget.pinned_memos.description` = "Schnellzugriff auf gepinnte Memos"
- `widget.quick_record.description` = "Starte eine Aufnahme mit einem Tap"
- `widget.statistics.description` = "Übersicht deiner Nutzungsstatistiken"

**UI Text:**

- `widget.common.no_memos` = "Noch keine Memos" / "No memos yet"
- `widget.common.today` = "Heute" / "Today"
- `widget.common.yesterday` = "Gestern" / "Yesterday"

---

## Rollout Plan

### Beta Testing (2 Wochen)

**Phase 1:**

- Internal team testing (5 developers)
- TestFlight beta with 10 users
- Collect feedback on:
  - Widget visibility
  - Deep link functionality
  - Data accuracy
  - Performance

**Phase 2:**

- Extended TestFlight beta (50 users)
- Monitor analytics:
  - Widget add rate
  - Widget interaction rate
  - Deep link success rate
  - Crash reports

### Production Release

**Criteria for Launch:**

- ✅ All widgets functional in 3 sizes
- ✅ Deep links working 100%
- ✅ No memory leaks
- ✅ < 0.1% crash rate in beta
- ✅ Localization complete (DE, EN)
- ✅ Documentation complete

**Release Notes:**

```
🎉 Neu: iOS Home Screen Widgets!

- Letztes Memo Widget: Sieh dein neuestes Memo auf einen Blick
- Gepinnte Memos Widget: Schnellzugriff auf wichtige Memos
- Schnellaufnahme Widget: Starte eine Aufnahme mit einem Tap
- Statistiken Widget: Überblick über deine Memo-Nutzung

Tippe auf ein Widget, um direkt zur App zu springen!
```

---

## Success Metrics

### Key Performance Indicators (KPIs)

1. **Widget Adoption Rate**
   - Target: 30% of users add at least 1 widget within 30 days
   - Measure: Analytics event "widget_added"

2. **Widget Interaction Rate**
   - Target: 50% of users with widgets tap them at least weekly
   - Measure: Deep link events

3. **App Engagement**
   - Target: 15% increase in app opens via widget
   - Measure: App launch source tracking

4. **Widget Retention**
   - Target: 70% widget retention after 30 days
   - Measure: Weekly widget view events

5. **Performance**
   - Target: Widget refresh < 100ms
   - Target: < 20 MB memory usage
   - Target: < 0.1% crash rate

---

## Risks & Mitigation

### Technical Risks

| Risk                  | Impact | Probability | Mitigation                                           |
| --------------------- | ------ | ----------- | ---------------------------------------------------- |
| Widget doesn't update | High   | Medium      | Comprehensive testing, fallback to manual refresh    |
| Deep links fail       | High   | Low         | URL validation, error handling, fallback to app home |
| Memory issues         | Medium | Medium      | Profile early, set size limits, optimize data        |
| Data sync delays      | Medium | Medium      | Cache last known state, show loading states          |
| Build complexity      | Low    | Medium      | Follow @bacons/apple-targets docs, seek help early   |

### User Experience Risks

| Risk                  | Impact | Mitigation                                           |
| --------------------- | ------ | ---------------------------------------------------- |
| Widget confusion      | Medium | Clear labels, contextual help, onboarding            |
| Data privacy concerns | High   | Document data handling, no sensitive data in widgets |
| Inconsistent UI       | Low    | Follow Apple HIG, use system fonts/colors            |
| Outdated widget data  | Medium | Implement refresh logic, show last update time       |

---

## Future Enhancements (Post-V1)

### Phase 5+: Advanced Features

1. **Interactive Widgets (iOS 17+)**
   - Toggle pin/unpin from widget
   - Quick actions (share, delete)
   - Inline editing

2. **Lock Screen Widgets (iOS 16+)**
   - Circular memo count widget
   - Inline recording duration
   - Complications for Apple Watch

3. **StandBy Mode Support (iOS 17+)**
   - Large clock-style widget
   - Optimized for nightstand
   - High contrast mode

4. **Widget Intents & Configuration**
   - User-selectable space filter
   - Custom time ranges
   - Theme selection

5. **Live Activities**
   - Active recording progress
   - Real-time transcription status
   - Processing progress indicator

6. **Siri Integration**
   - "Hey Siri, show my latest memo"
   - "Hey Siri, start recording"
   - Shortcuts app integration

---

## Resources

### Documentation

- [Apple WidgetKit](https://developer.apple.com/documentation/widgetkit)
- [@bacons/apple-targets](https://github.com/EvanBacon/expo-apple-targets)
- [Expo Config Plugins](https://docs.expo.dev/config-plugins/introduction/)
- [React Native Shared Group Preferences](https://github.com/KjellConnelly/react-native-shared-group-preferences)

### Internal Resources

- Design System: `features/theme/`
- Memo Types: `features/memos/types/memo.types.ts`
- Space Types: `features/spaces/types/space.types.ts`
- Analytics: `features/analytics/events.ts`

### Team Contacts

- **iOS Development:** [Name]
- **UI/UX Design:** [Name]
- **Backend/Data:** [Name]
- **QA Testing:** [Name]

---

## Appendix

### A. Widget Size Guidelines

**Small Widget (2x2 Grid)**

- Dimensions: 158x158 pts (iPhone 14)
- Safe Area: 16pt padding all sides
- Max Content: ~3 lines of text

**Medium Widget (4x2 Grid)**

- Dimensions: 338x158 pts (iPhone 14)
- Safe Area: 16pt padding all sides
- Max Content: ~5 lines of text, 1 image

**Large Widget (4x4 Grid)**

- Dimensions: 338x354 pts (iPhone 14)
- Safe Area: 16pt padding all sides
- Max Content: Full memo preview, multiple elements

### B. Color Palette

**Primary Colors:**

- Blue: `#007AFF` (Light), `#0A84FF` (Dark)
- Green: `#34C759` (Success)
- Red: `#FF3B30` (Error)
- Gray: `#8E8E93` (Secondary Text)

**Space Colors:** (from existing Memoro theme)

- Use existing space color palette
- Ensure WCAG AA contrast ratios

### C. SF Symbols Used

- `waveform` - Audio recording
- `checkmark.circle.fill` - Completed
- `pin.fill` - Pinned memo
- `mic.fill` - Recording button
- `chart.bar.fill` - Statistics
- `sparkles` - Inspiration
- `arrow.right.circle` - Navigation

---

**Document Version:** 1.0
**Last Updated:** 2025-01-30
**Author:** Claude Code
**Status:** Planning Phase
**Next Review:** Before Phase 1 Start
