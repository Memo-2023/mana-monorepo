# Zeego Kompatibilitätsprobleme und Alternativen-Analyse

## Zusammenfassung

Datum: 30. September 2025

Unser Projekt nutzt aktuell Zeego v3.0.6 für Context Menus und Dropdown Menus. Mit dem Upgrade auf Expo SDK 54 (React Native 0.81) und iOS 26 treten kritische Kompatibilitätsprobleme auf, die die App am Starten hindern.

## Aktueller Fehler

```
Unable to resolve module react-native-ios-context-menu from
/Users/tillschneider/Documents/__00__Code/memoro/node_modules/zeego/lib/module/menu/create-ios-menu/index.ios.js:
react-native-ios-context-menu could not be found within the project
```

## Problemanalyse

### Zeego Kompatibilitätsstatus

**Zeego Version 3.x Kompatibilität:**

- ✅ React Native: 0.76 oder 0.77
- ✅ Expo SDK: 52+
- ❌ React Native 0.81 (SDK 54): **Nicht offiziell unterstützt**
- ❌ iOS 26: **Keine offizielle Kompatibilität**

**Abhängigkeiten:**

- `react-native-menu`: 1.2.2
- `react-native-ios-context-menu`: 3.1.0
- `react-native-ios-utilities`: 5.1.2

### Ursache des Problems

Laut GitHub Issue #173 auf dem Zeego Repository:

1. **Pod Install Fehler:**
   - `Unable to find a specification for RCT-Folly (= 2022.05.16.00) depended upon by react-native-ios-context-menu`
   - `Unable to find a specification for RCT-Folly (= 2022.05.16.00) depended upon by react-native-ios-utilities`

2. **Status:**
   - Der Maintainer (nandorojo) hat ein PR im upstream Library gemerged
   - Wartet auf Veröffentlichung der Fixes
   - **react-native-ios-context-menu befindet sich im "Maintenance Mode"** - der Autor macht aktuell kein OSS mehr

### Expo SDK 54 Spezifika

- React Native 0.81 mit precompiled XCFrameworks für iOS
- Xcode 26 erforderlich
- Node.js 20.19.4+ erforderlich
- **RCT-Folly Versionskonflikt** mit älteren nativen Dependencies

## Aktuelle Zeego-Nutzung im Projekt

Zeego wird an **15 Stellen** im Projekt verwendet:

### Context Menus (4 Verwendungen)

- `components/organisms/Memory.tsx`
- `components/molecules/PromptPreview.tsx`
- `components/molecules/MemoPreview.tsx`

### Dropdown Menus (11 Verwendungen)

- `components/molecules/TableOfContentsMenu.tsx`
- `components/atoms/Pill.tsx`
- `features/subscription/SubscriptionMenu.tsx`
- `features/menus/MemoHeaderMenu.tsx`
- `features/menus/MemoMenu.tsx`
- `features/menus/HeaderMenu.tsx`
- Weitere Komponenten

## Alternative Lösungen - Detaillierte Analyse

### Option 1: Warten auf Zeego-Update 🕐

**Beschreibung:**
Warten, bis Zeego offiziell Expo SDK 54 und React Native 0.81 unterstützt.

**Vorteile:**

- ✅ Keine Code-Änderungen nötig
- ✅ Behält bestehende API und Funktionalität
- ✅ Native Performance bleibt erhalten

**Nachteile:**

- ❌ Unbekannter Zeitrahmen
- ❌ `react-native-ios-context-menu` ist im Maintenance Mode (Autor macht kein OSS mehr)
- ❌ Blockiert SDK 54 Upgrade
- ❌ Keine iOS 26 Features verfügbar
- ❌ Sicherheits- und Performance-Updates von SDK 54 nicht verfügbar

**Zeitaufwand:** 0 Stunden (aber unbestimmte Wartezeit)

**Risiko:** Hoch - keine Garantie für zeitnahe Lösung

---

### Option 2: Expo/React Native Action Sheet 📱

**Beschreibung:**
Ersetze Dropdown- und Context-Menus durch `@expo/react-native-action-sheet` (bereits im Projekt als Dependency).

**Vorteile:**

- ✅ **Bereits im Projekt vorhanden** (`@expo/react-native-action-sheet@^4.1.1`)
- ✅ Offiziell von Expo maintained
- ✅ 100% Expo SDK 54 kompatibel
- ✅ Funktioniert mit Expo Go
- ✅ Native iOS und Android UIs
- ✅ Einfache API
- ✅ Keine zusätzlichen Dependencies

**Nachteile:**

- ❌ **Limitierte Funktionalität** - keine verschachtelten Menüs, keine Icons, keine Checkboxen
- ❌ Andere UX - Modal von unten statt Context Menu
- ❌ Funktioniert nicht auf Web (nur mobil)
- ❌ Keine Context Menu Gesten (Long Press)

**Beispiel Migration:**

```tsx
// Vorher (Zeego)
import * as DropdownMenu from 'zeego/dropdown-menu';

<DropdownMenu.Root>
	<DropdownMenu.Trigger>
		<Button />
	</DropdownMenu.Trigger>
	<DropdownMenu.Content>
		<DropdownMenu.Item key="delete" onSelect={handleDelete}>
			<DropdownMenu.ItemTitle>Löschen</DropdownMenu.ItemTitle>
			<DropdownMenu.ItemIcon ios={{ name: 'trash' }} />
		</DropdownMenu.Item>
	</DropdownMenu.Content>
</DropdownMenu.Root>;

// Nachher (Action Sheet)
import { useActionSheet } from '@expo/react-native-action-sheet';

const { showActionSheetWithOptions } = useActionSheet();

<Button
	onPress={() => {
		showActionSheetWithOptions(
			{
				options: ['Löschen', 'Abbrechen'],
				destructiveButtonIndex: 0,
				cancelButtonIndex: 1,
			},
			(buttonIndex) => {
				if (buttonIndex === 0) handleDelete();
			}
		);
	}}
/>;
```

**Zeitaufwand:** 6-8 Stunden (alle 15 Verwendungen anpassen)

**Risiko:** Niedrig - stabile, gut getestete Library

**Empfohlen für:** Schnelle Lösung, wenn advanced Features nicht kritisch sind

---

### Option 3: react-native-context-menu-view 📋

**Beschreibung:**
Cross-platform Context Menu Library (iOS + Android).

**Vorteile:**

- ✅ Context Menus auf iOS und Android
- ✅ Einfachere API als Zeego
- ✅ Native UI auf beiden Plattformen
- ✅ Unterstützt Icons und Submenus

**Nachteile:**

- ❌ **Wartungsprobleme** - viele offene Issues
- ❌ **Keine bestätigte New Architecture Unterstützung**
- ❌ **Unklare SDK 54 Kompatibilität**
- ❌ Nicht auf Web verfügbar
- ❌ Nur Context Menus, keine Dropdown Menus

**Status der Library:**

- Latest Version: 1.19.0 (vor 5 Monaten)
- Maintenance: "Not nearly as good" laut Community-Feedback
- Signifikante offene Issues

**Zeitaufwand:** 8-10 Stunden

**Risiko:** Mittel-Hoch - unklare Kompatibilität, Wartungsprobleme

**Nicht empfohlen** wegen fehlender New Architecture Unterstützung

---

### Option 4: Native Platform APIs direkt nutzen 🎯

**Beschreibung:**
Direkte Verwendung von Platform-spezifischen APIs ohne Wrapper Library.

**iOS:**

- `@react-native-menu/menu@2.0.0` für iOS Context Menus (UIMenu)

**Android:**

- `@react-native-menu/menu@2.0.0` für Android PopupMenu

**Web:**

- Radix UI Dropdown Menu / Context Menu

**Vorteile:**

- ✅ Maximale Kontrolle
- ✅ Native Features und Performance
- ✅ Keine Wrapper-Dependencies
- ✅ `@react-native-menu/menu` hat v2.0.0 vor 14 Tagen released
- ✅ Expo config plugin vorhanden

**Nachteile:**

- ❌ **3 verschiedene Implementierungen** (iOS, Android, Web)
- ❌ Viel Boilerplate Code
- ❌ Höherer Wartungsaufwand
- ❌ Inkonsistente APIs über Plattformen

**Beispiel Platform Switch:**

```tsx
import { Platform } from 'react-native';
import { ContextMenuView } from '@react-native-menu/menu'; // iOS/Android
import * as RadixDropdown from '@radix-ui/react-dropdown-menu'; // Web

const Menu = Platform.select({
	ios: IOSContextMenu,
	android: AndroidContextMenu,
	web: RadixWebMenu,
});
```

**Zeitaufwand:** 12-16 Stunden

**Risiko:** Mittel - komplexer, aber volle Kontrolle

**Empfohlen für:** Teams mit Platform-spezifischem UI-Bedarf

---

### Option 5: Hybrid-Lösung mit Fallbacks 🔀

**Beschreibung:**
Kombiniere mehrere Libraries basierend auf Use Case.

**Strategie:**

- **Einfache Dropdown Menus:** Action Sheet
- **iOS Context Menus (kritisch):** `@react-native-menu/menu@2.0.0`
- **Android:** Action Sheet oder `@react-native-menu/menu`
- **Web:** Radix UI oder Action Sheet-ähnliche Modals

**Vorteile:**

- ✅ Best-of-both-worlds Ansatz
- ✅ Sofort funktionsfähig
- ✅ Optimiert für jeden Use Case
- ✅ Schrittweise Migration möglich

**Nachteile:**

- ❌ Höhere Code-Komplexität
- ❌ Mehr Dependencies
- ❌ Inkonsistente UX möglich

**Zeitaufwand:** 10-14 Stunden

**Risiko:** Mittel - erhöhte Komplexität

---

### Option 6: Custom Menu Components 🛠️

**Beschreibung:**
Baue eigene Menu-Komponenten mit React Native Modals, Pressables und Animations.

**Vorteile:**

- ✅ Volle Kontrolle über UX
- ✅ Cross-platform konsistent
- ✅ Keine nativen Dependencies
- ✅ Funktioniert mit Expo Go
- ✅ Keine Kompatibilitätsprobleme

**Nachteile:**

- ❌ **Sehr hoher Zeitaufwand** (20-30 Stunden)
- ❌ Kein natives Look-and-Feel
- ❌ Performance-Optimierung nötig
- ❌ Accessibility muss selbst implementiert werden
- ❌ Wartungsaufwand sehr hoch

**Zeitaufwand:** 20-30 Stunden initial + ongoing maintenance

**Risiko:** Hoch - Reinventing the wheel

**Nicht empfohlen** außer bei sehr spezifischen UI-Anforderungen

---

## Vergleichsmatrix

| Kriterium                   | Option 1: Warten | Option 2: Action Sheet | Option 3: context-menu-view | Option 4: Native APIs | Option 5: Hybrid | Option 6: Custom |
| --------------------------- | ---------------- | ---------------------- | --------------------------- | --------------------- | ---------------- | ---------------- |
| **Zeitaufwand**             | 0h (Wartezeit)   | 6-8h                   | 8-10h                       | 12-16h                | 10-14h           | 20-30h           |
| **SDK 54 Ready**            | ❌ Nein          | ✅ Ja                  | ⚠️ Unklar                   | ✅ Ja                 | ✅ Ja            | ✅ Ja            |
| **New Arch Support**        | ⚠️ Teils         | ✅ Ja                  | ❌ Unklar                   | ✅ Ja                 | ✅ Ja            | ✅ Ja            |
| **Native Look**             | ✅ Ja            | ✅ Ja                  | ✅ Ja                       | ✅ Ja                 | ✅ Ja            | ❌ Nein          |
| **Web Support**             | ✅ Ja            | ❌ Nein                | ❌ Nein                     | ✅ Ja                 | ⚠️ Teils         | ✅ Ja            |
| **Maintenance**             | ⚠️ Extern        | ✅ Niedrig             | ❌ Hoch                     | ⚠️ Mittel             | ⚠️ Mittel        | ❌ Sehr Hoch     |
| **Feature-Vollständigkeit** | ✅✅✅           | ⚠️                     | ✅✅                        | ✅✅✅                | ✅✅✅           | ✅✅✅           |
| **Risiko**                  | 🔴 Hoch          | 🟢 Niedrig             | 🟡 Mittel-Hoch              | 🟡 Mittel             | 🟡 Mittel        | 🔴 Hoch          |

---

## Empfehlung

### 🥇 Primär-Empfehlung: Option 2 (Action Sheet) + Option 4 (Native APIs für kritische Features)

**Begründung:**

1. **Sofortige Lösung für SDK 54 Upgrade**
   - Blockiert nicht länger den SDK 54 Rollout
   - Zugriff auf iOS 26 und Android 16 Features
   - Sicherheitsupdates von React Native 0.81

2. **Schrittweiser Migrations-Ansatz**
   - **Phase 1 (Quick Win - 2-3 Tage):**
     - Ersetze alle Dropdown Menus mit Action Sheets
     - Funktionale App, SDK 54 kompatibel

   - **Phase 2 (Optimierung - 1-2 Wochen):**
     - Identifiziere kritische Context Menu Use Cases (z.B. Memory.tsx)
     - Implementiere mit `@react-native-menu/menu@2.0.0` für native iOS Context Menus
     - Fallback zu Action Sheet auf Android

   - **Phase 3 (Langfristig - optional):**
     - Monitoring von Zeego Updates
     - Wenn Zeego SDK 54 Support erhält: Evaluation ob Rückmigration sinnvoll

3. **Risiko-Minimierung**
   - Action Sheet ist production-ready und von Expo maintained
   - `@react-native-menu/menu` v2.0.0 ist aktuell (14 Tage alt)
   - Beide Libraries haben Expo SDK 54 Support

4. **UX Trade-off akzeptabel**
   - Action Sheets sind bekanntes iOS/Android Pattern
   - Für 80% der Use Cases ausreichend
   - Native Context Menus nur für spezifische Features

---

## Migrations-Plan (Detailliert)

### Phase 1: Quick Migration (2-3 Tage)

**Ziel:** SDK 54 kompatible App mit Action Sheets

#### Tag 1: Vorbereitung

1. **Backup erstellen**

   ```bash
   git checkout -b migration/zeego-to-actionsheet
   ```

2. **Action Sheet Hook vorbereiten**

   ```tsx
   // hooks/useMenu.ts
   import { useActionSheet } from '@expo/react-native-action-sheet';

   export const useMenu = () => {
   	const { showActionSheetWithOptions } = useActionSheet();

   	return {
   		showMenu: (options: MenuOption[]) => {
   			showActionSheetWithOptions(
   				{
   					options: options.map((o) => o.title),
   					destructiveButtonIndex: options.findIndex((o) => o.destructive),
   					cancelButtonIndex: options.length - 1,
   				},
   				(index) => {
   					options[index]?.onSelect?.();
   				}
   			);
   		},
   	};
   };
   ```

3. **Type Definitions**
   ```tsx
   // types/menu.ts
   export interface MenuOption {
   	title: string;
   	onSelect?: () => void;
   	destructive?: boolean;
   	disabled?: boolean;
   }
   ```

#### Tag 2: Migration Dropdown Menus (11 Komponenten)

1. `features/menus/HeaderMenu.tsx`
2. `features/menus/MemoMenu.tsx`
3. `features/menus/MemoHeaderMenu.tsx`
4. `components/atoms/Pill.tsx`
5. `components/molecules/TableOfContentsMenu.tsx`
6. `features/subscription/SubscriptionMenu.tsx`
7. Weitere Dropdown-Komponenten

**Pro Komponente:**

- Zeego Imports entfernen
- Action Sheet Hook einbinden
- Trigger Button anpassen
- Menu Options Array erstellen

#### Tag 3: Migration Context Menus (4 Komponenten)

1. `components/organisms/Memory.tsx`
2. `components/molecules/PromptPreview.tsx`
3. `components/molecules/MemoPreview.tsx`

**Temporär:** Action Sheet mit Long Press Trigger

#### Tag 3 Nachmittag: Testing

- iOS Testing (Simulator + Device)
- Android Testing (Emulator + Device)
- Funktionale Tests aller Menu-Interaktionen
- Edge Cases (z.B. mehrere Menus gleichzeitig)

---

### Phase 2: Native Context Menus (1-2 Wochen)

**Nur für kritische Features wo Context Menu UX wichtig ist**

#### Woche 1: Setup + iOS Implementation

**Dependency Installation:**

```bash
npm install @react-native-menu/menu@2.0.0
```

**app.json Plugin:**

```json
{
	"plugins": ["@react-native-menu/menu"]
}
```

**Rebuild:**

```bash
npx expo prebuild --clean
npx expo run:ios
```

#### Beispiel Implementation:

```tsx
// components/organisms/Memory.tsx
import { Platform } from 'react-native';
import { ContextMenuView } from '@react-native-menu/menu';
import { useMenu } from '~/hooks/useMenu'; // Action Sheet fallback

export const Memory = ({ memory }) => {
	const { showMenu } = useMenu();

	if (Platform.OS === 'ios') {
		return (
			<ContextMenuView
				actions={[
					{ id: 'share', title: 'Teilen', image: 'square.and.arrow.up' },
					{ id: 'delete', title: 'Löschen', destructive: true },
				]}
				onPressAction={({ nativeEvent }) => {
					if (nativeEvent.actionKey === 'delete') handleDelete();
					if (nativeEvent.actionKey === 'share') handleShare();
				}}
			>
				<MemoryContent memory={memory} />
			</ContextMenuView>
		);
	}

	// Android/Web Fallback: Long Press -> Action Sheet
	return (
		<Pressable
			onLongPress={() =>
				showMenu([
					{ title: 'Teilen', onSelect: handleShare },
					{ title: 'Löschen', onSelect: handleDelete, destructive: true },
				])
			}
		>
			<MemoryContent memory={memory} />
		</Pressable>
	);
};
```

#### Woche 2: Testing + Optimierung

- iOS Context Menu Testing
- Android Fallback Testing
- Performance Testing
- UX Feedback sammeln

---

### Phase 3: Monitoring & Evaluation (Ongoing)

**Zeego Tracking:**

- GitHub Issue #173 monitoren
- Release Notes von Zeego beobachten
- Bei SDK 54 Support: Evaluation ob Rückmigration lohnt

**Kriterien für Rückmigration zu Zeego:**

- ✅ Offizieller Expo SDK 54 Support
- ✅ React Native 0.81+ Support
- ✅ Stabile Version (keine Beta)
- ✅ Positive Community Feedback
- ✅ `react-native-ios-context-menu` Maintenance Status verbessert

---

## Technische Details & Code-Beispiele

### Zeego Package entfernen

```bash
npm uninstall zeego
npm uninstall react-native-ios-context-menu react-native-ios-utilities
npm uninstall @react-native-menu/menu # Falls installiert als Zeego Dependency
```

### Action Sheet Provider Setup

```tsx
// app/_layout.tsx
import { ActionSheetProvider } from '@expo/react-native-action-sheet';

export default function RootLayout() {
	return <ActionSheetProvider>{/* Rest der App */}</ActionSheetProvider>;
}
```

### Utility Hook für konsistente Menus

```tsx
// hooks/useMenu.ts
import { useActionSheet } from '@expo/react-native-action-sheet';
import { useCallback } from 'react';

export interface MenuOption {
	title: string;
	onSelect?: () => void;
	destructive?: boolean;
	disabled?: boolean;
	icon?: string; // Für zukünftige native menu implementation
}

export const useMenu = () => {
	const { showActionSheetWithOptions } = useActionSheet();

	const showMenu = useCallback(
		(
			options: MenuOption[],
			config?: {
				title?: string;
				message?: string;
			}
		) => {
			const actionOptions = options.map((o) => o.title);
			const cancelButtonIndex = actionOptions.length - 1;
			const destructiveButtonIndex = options.findIndex((o) => o.destructive);

			showActionSheetWithOptions(
				{
					options: actionOptions,
					cancelButtonIndex,
					destructiveButtonIndex: destructiveButtonIndex >= 0 ? destructiveButtonIndex : undefined,
					title: config?.title,
					message: config?.message,
				},
				(buttonIndex) => {
					if (buttonIndex !== undefined && buttonIndex !== cancelButtonIndex) {
						options[buttonIndex]?.onSelect?.();
					}
				}
			);
		},
		[showActionSheetWithOptions]
	);

	return { showMenu };
};
```

---

## Risiken & Mitigationen

### Risiko 1: UX Verschlechterung

**Problem:** Action Sheets haben andere UX als Context/Dropdown Menus

**Mitigation:**

- User Testing durchführen
- Feedback sammeln
- Bei kritischen Features: Native Context Menus (Phase 2)

### Risiko 2: Web Support

**Problem:** Action Sheets funktionieren nicht auf Web

**Mitigation:**

- Falls Web wichtig: Phase 2 mit Radix UI für Web
- Oder: Web-spezifische Dropdown Implementierung mit React Native Web Modals

### Risiko 3: Feature Loss

**Problem:** Icons, Checkboxes, verschachtelte Menus gehen verloren

**Mitigation:**

- Dokumentiere fehlende Features
- Priorisiere nach Business Impact
- Alternative UI Patterns für kritische Features (z.B. separate Settings Screens statt Inline Checkboxes)

### Risiko 4: Zukünftige Zeego-Updates

**Problem:** Wenn Zeego später SDK 54 Support erhält, haben wir doppelten Aufwand

**Mitigation:**

- Code modular halten (useMenu Hook als Abstraction)
- Zeego Monitoring als Teil des Prozesses
- Rückmigration nur wenn klarer Mehrwert

---

## Entscheidungshilfe

### Wähle **Option 1 (Warten)** wenn:

- ❌ Nicht empfohlen - zu hohes Risiko

### Wähle **Option 2 (Action Sheet)** wenn:

- ✅ Schnelle Lösung benötigt (2-3 Tage)
- ✅ SDK 54 Upgrade blockiert
- ✅ Basic Menu-Funktionalität ausreichend
- ✅ Team-Kapazität limitiert

### Wähle **Option 4 (Native APIs)** wenn:

- ✅ Context Menu UX kritisch
- ✅ Platform-spezifische Features benötigt
- ✅ Team hat 2-3 Wochen Zeit
- ✅ Web Support wichtig

### Wähle **Option 2 + 4 Hybrid (Empfohlen)** wenn:

- ✅ Best-of-both-worlds gewünscht
- ✅ Schrittweise Migration möglich
- ✅ Risiko-Minimierung wichtig
- ✅ Langfristige Flexibilität gewünscht

---

## Nächste Schritte (Action Items)

1. **Sofort:** Entscheidung treffen (Hybrid-Ansatz empfohlen)
2. **Tag 1:** Git Branch erstellen, useMenu Hook implementieren
3. **Tag 2-3:** Migration aller Zeego Verwendungen zu Action Sheets
4. **Woche 1:** Testing + SDK 54 Upgrade durchführen
5. **Woche 2-3:** Native Context Menus für kritische Features (optional)
6. **Ongoing:** Zeego Repository monitoren für SDK 54 Support

---

## Ressourcen & Links

### Zeego

- [Zeego GitHub Issue #173 (Expo 54 Build fails)](https://github.com/nandorojo/zeego/issues/173)
- [Zeego Docs - Compatibility Table](https://zeego.dev/start)

### Action Sheet

- [@expo/react-native-action-sheet Docs](https://docs.expo.dev/versions/latest/sdk/action-sheet/)
- [GitHub Repository](https://github.com/expo/react-native-action-sheet)

### Native Menu

- [@react-native-menu/menu v2.0.0](https://www.npmjs.com/package/@react-native-menu/menu)
- [GitHub Repository](https://github.com/react-native-menu/menu)

### Expo SDK 54

- [Expo SDK 54 Changelog](https://expo.dev/changelog/sdk-54)
- [Expo SDK 54 Upgrade Guide](https://expo.dev/blog/expo-sdk-upgrade-guide)

---

## Appendix: Zeego Usage in Project

### Context Menu Verwendungen

1. **components/organisms/Memory.tsx** (Zeile 17)
   - Use Case: Long-press auf Memory für Actions (Share, Delete, etc.)
   - Kritikalität: Hoch - Kern-Feature

2. **components/molecules/PromptPreview.tsx** (Zeile 10)
   - Use Case: Prompt Preview Context Menu
   - Kritikalität: Mittel

3. **components/molecules/MemoPreview.tsx** (Zeile 34)
   - Use Case: Memo Preview Actions
   - Kritikalität: Hoch

### Dropdown Menu Verwendungen

4. **features/menus/HeaderMenu.tsx** (Zeile 8)
   - Use Case: App Header Menu
   - Kritikalität: Mittel

5. **features/menus/MemoMenu.tsx** (Zeile 7)
   - Use Case: Memo-spezifische Aktionen
   - Kritikalität: Hoch

6. **features/menus/MemoHeaderMenu.tsx** (Zeile 8)
   - Use Case: Memo Header Dropdown
   - Kritikalität: Mittel

7. **components/atoms/Pill.tsx** (Zeile 10)
   - Use Case: Pill/Tag Dropdown
   - Kritikalität: Niedrig

8. **components/molecules/TableOfContentsMenu.tsx** (Zeile 8)
   - Use Case: TOC Navigation
   - Kritikalität: Mittel

9. **features/subscription/SubscriptionMenu.tsx** (Zeile 9)
   - Use Case: Subscription Settings
   - Kritikalität: Hoch - Revenue-relevant

10. **components/organisms/PhotoGallery.tsx**
    - Use Case: Photo Actions
    - Kritikalität: Mittel

---

**Dokument erstellt:** 30. September 2025
**Letzte Aktualisierung:** 30. September 2025
**Autor:** Claude Code Analyse
**Status:** ✅ Bereit für Team Review
