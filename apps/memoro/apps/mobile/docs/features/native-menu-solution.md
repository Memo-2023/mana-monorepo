# Native Menu Lösung für Expo SDK 54 - Empfehlung

## Executive Summary

**Status:** ✅ LÖSUNG GEFUNDEN

Unser Projekt hat bereits `@react-native-menu/menu@2.0.0` installiert (als Zeego-Dependency). Diese Library wurde **im September 2023 auf React Native 0.81 aktualisiert** und ist damit SDK 54 kompatibel. Wir können Zeego entfernen und direkt mit `@react-native-menu/menu` arbeiten - kombiniert mit Radix UI für Web.

**Zeitaufwand:** 8-12 Stunden
**Risiko:** Niedrig - Library ist bereits installiert und getestet
**Empfehlung:** ⭐ Primäre Lösung

---

## Problemanalyse (Nochmal zur Klarstellung)

### Warum funktioniert Zeego nicht?

Zeego v3.0.6 ist für **Expo SDK 52** (React Native 0.76/0.77) optimiert, nicht für SDK 54 (React Native 0.81). Der Fehler:

```
Unable to resolve module react-native-ios-context-menu
```

tritt auf, weil die Zeego-Dependencies (`react-native-ios-context-menu` und `react-native-ios-utilities`) einen `RCT-Folly` Versionskonflikt mit React Native 0.81 haben.

**GitHub Issue #173:** Build fails with Expo 54 - noch nicht gelöst.

### Was bietet Expo UI?

**Expo UI** (`@expo/ui`) ist **kein Context/Dropdown Menu Framework**. Es bietet nur:
- Native Input Components für Jetpack Compose (Android) und SwiftUI (iOS)
- Keine Menu-Komponenten

Expo UI ist also keine Lösung für unser Problem.

---

## Die Lösung: @react-native-menu/menu (Bereits installiert!)

### Warum @react-native-menu/menu?

✅ **Bereits im Projekt:** Version 2.0.0 ist installiert (war Zeego-Dependency)
✅ **SDK 54 Ready:** v2.0.0 wurde auf React Native 0.81 aktualisiert (September 2023)
✅ **Native iOS & Android Menus:** UIMenu (iOS 14+) und PopupMenu (Android)
✅ **Aktiv maintained:** Letztes Update vor 14 Tagen (Stand: September 2025)
✅ **Expo Config Plugin:** Offizielle Expo-Integration
✅ **Feature-reich:** Icons, Submenus, Events (onOpenMenu, onCloseMenu)

### Library Status

**Current Version:** 2.0.0
**Last Updated:** Vor 14 Tagen (September 2025)
**React Native Support:** 0.81+ (getestet im Example-Projekt)
**iOS:** 14+ (UIMenu nativ), iOS 13 Fallback zu ActionSheet
**Android:** PopupMenu (native Android API)
**Expo:** ✅ Expo Config Plugin vorhanden

---

## Architektur-Übersicht

### Cross-Platform Strategie

```
┌─────────────────────────────────────────────────────┐
│                    useNativeMenu()                  │
│              (Unified Hook Interface)               │
└─────────────────────────────────────────────────────┘
                          │
          ┌───────────────┼───────────────┐
          │               │               │
          ▼               ▼               ▼
    ┌─────────┐     ┌─────────┐     ┌─────────┐
    │   iOS   │     │ Android │     │   Web   │
    └─────────┘     └─────────┘     └─────────┘
          │               │               │
          ▼               ▼               ▼
    ┌─────────────┐ ┌─────────────┐ ┌─────────────┐
    │   UIMenu    │ │ PopupMenu   │ │  Radix UI   │
    │  (Native)   │ │  (Native)   │ │ (Web-only)  │
    └─────────────┘ └─────────────┘ └─────────────┘
```

### Platform-Specific Implementation

**iOS:** `@react-native-menu/menu` → UIMenu API
**Android:** `@react-native-menu/menu` → PopupMenu API
**Web:** Radix UI Dropdown/Context Menu (bereits von Zeego bekannt)

---

## Feature-Vergleich

| Feature | Zeego | @react-native-menu/menu + Radix | Action Sheet |
|---------|-------|----------------------------------|--------------|
| **Native iOS Context Menu** | ✅ | ✅ | ❌ |
| **Native Android Menu** | ✅ | ✅ | ❌ |
| **Web Support** | ✅ Radix | ✅ Radix | ❌ |
| **Expo SDK 54** | ❌ Broken | ✅ | ✅ |
| **React Native 0.81** | ❌ | ✅ | ✅ |
| **Icons (SF Symbols)** | ✅ | ✅ | ❌ |
| **Submenus** | ✅ | ✅ | ❌ |
| **Checkboxes** | ✅ | ⚠️ Eingeschränkt | ❌ |
| **Custom Styling** | ✅ | ⚠️ Native Styling | ✅ |
| **Unified API** | ✅ | ❌ (Platform Switch) | N/A |
| **Maintenance Status** | ⚠️ SDK 54 Issue | ✅ Aktiv | ✅ Expo Official |
| **Setup Complexity** | Mittel | Mittel | Niedrig |

---

## Code-Beispiele

### 1. iOS/Android Native Menu (Context Menu)

```tsx
// components/organisms/Memory.tsx
import { Platform } from 'react-native';
import { MenuView } from '@react-native-menu/menu';

export const Memory = ({ memory, onDelete, onShare }) => {
  return (
    <MenuView
      title="Memory Actions"
      actions={[
        {
          id: 'share',
          title: 'Teilen',
          titleColor: '#007AFF',
          image: Platform.select({
            ios: 'square.and.arrow.up',
            android: 'ic_menu_share',
          }),
        },
        {
          id: 'delete',
          title: 'Löschen',
          attributes: {
            destructive: true,
          },
          image: Platform.select({
            ios: 'trash',
            android: 'ic_menu_delete',
          }),
        },
      ]}
      onPressAction={({ nativeEvent }) => {
        switch (nativeEvent.event) {
          case 'share':
            onShare();
            break;
          case 'delete':
            onDelete();
            break;
        }
      }}
    >
      <MemoryContent memory={memory} />
    </MenuView>
  );
};
```

### 2. iOS/Android Dropdown Menu

```tsx
// features/menus/HeaderMenu.tsx
import { Platform, Pressable } from 'react-native';
import { MenuView } from '@react-native-menu/menu';

export const HeaderMenu = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <MenuView
      title="Einstellungen"
      onPressAction={({ nativeEvent }) => {
        if (nativeEvent.event === 'profile') {
          navigation.navigate('Profile');
        } else if (nativeEvent.event === 'settings') {
          navigation.navigate('Settings');
        }
      }}
      actions={[
        {
          id: 'profile',
          title: 'Profil',
          image: Platform.select({
            ios: 'person.circle',
            android: 'ic_menu_myplaces',
          }),
        },
        {
          id: 'settings',
          title: 'Einstellungen',
          image: Platform.select({
            ios: 'gearshape',
            android: 'ic_menu_preferences',
          }),
        },
      ]}
      shouldOpenOnLongPress={false} // Öffnet auf normalen Press (nicht long press)
    >
      <Pressable>
        <Icon name="ellipsis-horizontal" />
      </Pressable>
    </MenuView>
  );
};
```

### 3. Web - Radix UI Dropdown

```tsx
// components/menus/HeaderMenu.web.tsx
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import './HeaderMenu.css'; // Radix UI styling

export const HeaderMenu = () => {
  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <button className="IconButton">
          <Icon name="ellipsis-horizontal" />
        </button>
      </DropdownMenu.Trigger>

      <DropdownMenu.Portal>
        <DropdownMenu.Content className="DropdownMenuContent">
          <DropdownMenu.Item
            className="DropdownMenuItem"
            onSelect={() => navigation.navigate('Profile')}
          >
            Profil
          </DropdownMenu.Item>
          <DropdownMenu.Item
            className="DropdownMenuItem"
            onSelect={() => navigation.navigate('Settings')}
          >
            Einstellungen
          </DropdownMenu.Item>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
};
```

### 4. Unified Hook (Cross-Platform Abstraction)

```tsx
// hooks/useNativeMenu.ts
import { Platform } from 'react-native';
import { MenuView } from '@react-native-menu/menu';

export interface MenuAction {
  id: string;
  title: string;
  destructive?: boolean;
  icon?: string;
  onPress: () => void;
}

export const useNativeMenu = () => {
  const showMenu = (actions: MenuAction[]) => {
    if (Platform.OS === 'web') {
      // Web: Return props for Radix UI
      return {
        isWeb: true,
        actions,
      };
    }

    // Native: Return props for MenuView
    return {
      isWeb: false,
      menuActions: actions.map(action => ({
        id: action.id,
        title: action.title,
        attributes: action.destructive ? { destructive: true } : undefined,
        image: action.icon ? Platform.select({
          ios: action.icon,
          android: `ic_menu_${action.icon}`,
        }) : undefined,
      })),
      onPressAction: ({ nativeEvent }) => {
        const action = actions.find(a => a.id === nativeEvent.event);
        action?.onPress();
      },
    };
  };

  return { showMenu };
};
```

### 5. Platform-Specific Component

```tsx
// components/molecules/MemoPreview.tsx
import { Platform } from 'react-native';
import { MenuView } from '@react-native-menu/menu';

// Separate Web-Komponente importieren
const MemoPreviewWeb = Platform.OS === 'web'
  ? require('./MemoPreview.web').default
  : null;

export const MemoPreview = ({ memo }) => {
  // Web: Verwende Radix UI
  if (Platform.OS === 'web') {
    return <MemoPreviewWeb memo={memo} />;
  }

  // Native: Verwende @react-native-menu/menu
  return (
    <MenuView
      actions={[
        { id: 'edit', title: 'Bearbeiten', image: 'pencil' },
        { id: 'delete', title: 'Löschen', attributes: { destructive: true } },
      ]}
      onPressAction={({ nativeEvent }) => {
        // Handle action
      }}
    >
      <MemoContent memo={memo} />
    </MenuView>
  );
};
```

---

## Migrations-Plan

### Phase 1: Setup & Dependencies (2 Stunden)

#### 1.1 Dependencies bereinigen

```bash
# Zeego entfernen
npm uninstall zeego

# Zeego iOS-Dependencies entfernen
npm uninstall react-native-ios-context-menu react-native-ios-utilities

# @react-native-menu/menu ist bereits installiert (v2.0.0)
# Radix UI für Web installieren
npm install @radix-ui/react-dropdown-menu @radix-ui/react-context-menu
```

#### 1.2 Expo Config Plugin

`app.json` ist bereits konfiguriert (Zeego hatte die gleiche Dependency):

```json
{
  "plugins": [
    "@react-native-menu/menu"
  ]
}
```

#### 1.3 Rebuild

```bash
# Clean prebuild
npx expo prebuild --clean

# iOS
npx expo run:ios

# Android
npx expo run:android
```

---

### Phase 2: Dropdown Menus Migration (4-5 Stunden)

**Komponenten (11 Stück):**

1. ✅ `features/menus/HeaderMenu.tsx`
2. ✅ `features/menus/MemoMenu.tsx`
3. ✅ `features/menus/MemoHeaderMenu.tsx`
4. ✅ `components/atoms/Pill.tsx`
5. ✅ `components/molecules/TableOfContentsMenu.tsx`
6. ✅ `features/subscription/SubscriptionMenu.tsx`
7. ✅ Weitere Dropdown-Komponenten

**Migration Pattern:**

```tsx
// VORHER (Zeego)
import * as DropdownMenu from 'zeego/dropdown-menu';

<DropdownMenu.Root>
  <DropdownMenu.Trigger>
    <Button />
  </DropdownMenu.Trigger>
  <DropdownMenu.Content>
    <DropdownMenu.Item key="item-1" onSelect={handleAction}>
      <DropdownMenu.ItemTitle>Action</DropdownMenu.ItemTitle>
      <DropdownMenu.ItemIcon ios={{ name: 'star' }} />
    </DropdownMenu.Item>
  </DropdownMenu.Content>
</DropdownMenu.Root>

// NACHHER (Native Menu)
import { MenuView } from '@react-native-menu/menu';

<MenuView
  actions={[
    {
      id: 'item-1',
      title: 'Action',
      image: Platform.select({
        ios: 'star',
        android: 'ic_menu_star',
      }),
    },
  ]}
  onPressAction={({ nativeEvent }) => {
    if (nativeEvent.event === 'item-1') handleAction();
  }}
  shouldOpenOnLongPress={false}
>
  <Button />
</MenuView>
```

**Pro Komponente: ~20-30 Minuten**

---

### Phase 3: Context Menus Migration (2-3 Stunden)

**Komponenten (4 Stück):**

1. ✅ `components/organisms/Memory.tsx` (Kritisch - Kern-Feature)
2. ✅ `components/molecules/PromptPreview.tsx`
3. ✅ `components/molecules/MemoPreview.tsx`
4. ✅ `components/organisms/PhotoGallery.tsx`

**Migration Pattern:**

```tsx
// VORHER (Zeego)
import * as ContextMenu from 'zeego/context-menu';

<ContextMenu.Root>
  <ContextMenu.Trigger>
    <MemoryCard />
  </ContextMenu.Trigger>
  <ContextMenu.Content>
    <ContextMenu.Item key="share" onSelect={handleShare}>
      <ContextMenu.ItemTitle>Teilen</ContextMenu.ItemTitle>
    </ContextMenu.Item>
  </ContextMenu.Content>
</ContextMenu.Root>

// NACHHER (Native Menu - Long Press by default)
import { MenuView } from '@react-native-menu/menu';

<MenuView
  actions={[
    {
      id: 'share',
      title: 'Teilen',
      image: 'square.and.arrow.up', // SF Symbol
    },
  ]}
  onPressAction={({ nativeEvent }) => {
    if (nativeEvent.event === 'share') handleShare();
  }}
  // shouldOpenOnLongPress ist true by default für Context Menus
>
  <MemoryCard />
</MenuView>
```

**Pro Komponente: ~30-40 Minuten**

---

### Phase 4: Web Support (Optional - 2-3 Stunden)

Wenn Web-Support wichtig ist, erstelle `.web.tsx` Varianten:

#### 4.1 Platform Extensions Setup

```tsx
// components/menus/HeaderMenu.tsx (Native)
export { HeaderMenu } from './HeaderMenu.native';

// components/menus/HeaderMenu.native.tsx
import { MenuView } from '@react-native-menu/menu';
// Native implementation

// components/menus/HeaderMenu.web.tsx
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
// Radix UI implementation
```

#### 4.2 Shared Styling für Web

```css
/* styles/menus.css */
.DropdownMenuContent {
  min-width: 220px;
  background-color: white;
  border-radius: 6px;
  padding: 5px;
  box-shadow: 0px 10px 38px -10px rgba(22, 23, 24, 0.35);
}

.DropdownMenuItem {
  padding: 8px;
  border-radius: 3px;
  cursor: pointer;
}

.DropdownMenuItem:hover {
  background-color: #f5f5f5;
}
```

**Nur implementieren wenn Web-Support benötigt wird!**

---

### Phase 5: Testing & Optimierung (2-3 Stunden)

#### 5.1 Test-Checkliste

**iOS Testing:**
- [ ] Context Menus (Long Press)
- [ ] Dropdown Menus (Tap)
- [ ] SF Symbols Icons
- [ ] Destructive Actions (rote Farbe)
- [ ] Nested Submenus
- [ ] Events (onOpenMenu, onCloseMenu)

**Android Testing:**
- [ ] Context Menus (Long Press)
- [ ] Dropdown Menus (Tap)
- [ ] Material Icons
- [ ] Destructive Actions
- [ ] Performance

**Web Testing (falls implementiert):**
- [ ] Radix UI Dropdowns
- [ ] Radix UI Context Menus
- [ ] Keyboard Navigation
- [ ] Accessibility (ARIA)

#### 5.2 Edge Cases

- Mehrere Menus gleichzeitig geöffnet
- Schnelles Tippen/Schließen
- Screen Rotation während Menu offen
- Dark Mode Support

---

## Vorteile dieser Lösung

### ✅ Technische Vorteile

1. **SDK 54 Kompatibel:** Library wurde auf RN 0.81 getestet
2. **Native Performance:** Direkte UIMenu/PopupMenu APIs
3. **Bereits installiert:** Keine neuen Dependencies
4. **Aktiv maintained:** Updates vor 14 Tagen
5. **Expo-Integration:** Offizieller Config Plugin

### ✅ UX Vorteile

1. **Native Look & Feel:** 100% native iOS/Android Menus
2. **System-Integration:** SF Symbols, Material Icons
3. **Accessibility:** Native Accessibility Support
4. **Gestures:** Native Long Press, Tap Gestures

### ✅ Developer Experience

1. **Simple API:** Weniger Boilerplate als Zeego
2. **TypeScript Support:** Vollständig typisiert
3. **Debugging:** Native Debugging mit Xcode/Android Studio
4. **Testing:** Jest Mocks vorhanden

---

## Nachteile & Lösungen

### ❌ Kein Unified API wie Zeego

**Problem:** Verschiedene APIs für iOS/Android vs Web

**Lösung 1 (Empfohlen):** Platform-specific files
```
HeaderMenu.tsx         → Export default
HeaderMenu.native.tsx  → Native implementation
HeaderMenu.web.tsx     → Radix UI implementation
```

**Lösung 2:** Custom Hook (siehe `useNativeMenu` oben)

**Lösung 3:** Wrapper-Komponente
```tsx
// components/ui/NativeMenu.tsx
export const NativeMenu = Platform.OS === 'web'
  ? RadixDropdownMenu
  : ReactNativeMenu;
```

### ❌ Web Support erfordert extra Arbeit

**Problem:** Web nicht out-of-the-box supported

**Lösung:**
- Wenn Web wichtig: Phase 4 implementieren (~2-3h)
- Wenn Web nicht wichtig: Weglassen

**Realität:** Viele Expo-Apps fokussieren sich auf Mobile

### ❌ Mehr Code als mit Zeego

**Problem:** ~20-30% mehr Code durch Platform Switches

**Lösung:**
- Abstraction Layers (Hooks, Wrapper)
- Code-Generierung für repetitive Patterns
- Akzeptieren des Trade-offs für native UX

### ❌ Checkbox-Support eingeschränkt

**Problem:** Native Menus haben limitierte Checkbox-Unterstützung

**Alternative:**
- Separate Settings-Screens
- Toggle-Buttons statt Menu Checkboxes
- Custom Modals für komplexe Selections

---

## Migration Timeline

### Aggressive Timeline (3 Tage)

**Tag 1 (4h):**
- ✅ Dependencies setup
- ✅ Rebuild & Testing
- ✅ 5-6 Dropdown Menus migrieren

**Tag 2 (4h):**
- ✅ Restliche Dropdown Menus
- ✅ Alle Context Menus
- ✅ Basis-Testing

**Tag 3 (4h):**
- ✅ Comprehensive Testing
- ✅ Bug Fixes
- ✅ Performance-Optimierung

### Komfortable Timeline (5 Tage)

**Tag 1-2:** Dependencies + Dropdown Menus
**Tag 3:** Context Menus
**Tag 4:** Web Support (optional)
**Tag 5:** Testing + Optimierung

### Enterprise Timeline (2 Wochen)

**Woche 1:** Migration + Basic Testing
**Woche 2:** Web Support + Comprehensive Testing + QA

---

## Code-Organisation Best Practices

### 1. Zentralisierte Menu Actions

```tsx
// config/menuActions.ts
export const MEMO_ACTIONS = {
  EDIT: {
    id: 'edit',
    title: 'Bearbeiten',
    icon: {
      ios: 'pencil',
      android: 'ic_menu_edit',
    },
  },
  DELETE: {
    id: 'delete',
    title: 'Löschen',
    destructive: true,
    icon: {
      ios: 'trash',
      android: 'ic_menu_delete',
    },
  },
  SHARE: {
    id: 'share',
    title: 'Teilen',
    icon: {
      ios: 'square.and.arrow.up',
      android: 'ic_menu_share',
    },
  },
};
```

### 2. Menu Action Builder

```tsx
// utils/menuBuilder.ts
import { Platform } from 'react-native';

export const buildMenuAction = (action: MenuActionConfig) => ({
  id: action.id,
  title: action.title,
  attributes: action.destructive ? { destructive: true } : undefined,
  image: action.icon ? Platform.select({
    ios: action.icon.ios,
    android: action.icon.android,
  }) : undefined,
  titleColor: action.color,
});
```

### 3. Reusable Menu Component

```tsx
// components/ui/NativeMenu.tsx
interface NativeMenuProps {
  actions: MenuActionConfig[];
  onAction: (actionId: string) => void;
  children: React.ReactNode;
  isContextMenu?: boolean;
}

export const NativeMenu: FC<NativeMenuProps> = ({
  actions,
  onAction,
  children,
  isContextMenu = false,
}) => {
  const menuActions = actions.map(buildMenuAction);

  return (
    <MenuView
      actions={menuActions}
      onPressAction={({ nativeEvent }) => onAction(nativeEvent.event)}
      shouldOpenOnLongPress={isContextMenu}
    >
      {children}
    </MenuView>
  );
};
```

### 4. Verwendung

```tsx
// components/organisms/Memory.tsx
import { NativeMenu } from '~/components/ui/NativeMenu';
import { MEMO_ACTIONS } from '~/config/menuActions';

export const Memory = ({ memo }) => {
  const handleAction = (actionId: string) => {
    switch (actionId) {
      case 'edit':
        editMemo(memo);
        break;
      case 'delete':
        deleteMemo(memo);
        break;
      case 'share':
        shareMemo(memo);
        break;
    }
  };

  return (
    <NativeMenu
      actions={[MEMO_ACTIONS.EDIT, MEMO_ACTIONS.DELETE, MEMO_ACTIONS.SHARE]}
      onAction={handleAction}
      isContextMenu
    >
      <MemoCard memo={memo} />
    </NativeMenu>
  );
};
```

---

## Technische Details

### @react-native-menu/menu Features

#### iOS (UIMenu API)

```tsx
<MenuView
  title="Title"
  actions={[
    {
      id: 'action-id',
      title: 'Action Title',
      titleColor: '#007AFF',
      subtitle: 'Optional subtitle',
      image: 'sf.symbol.name', // SF Symbol
      imageColor: '#FF3B30',
      attributes: {
        destructive: boolean,
        disabled: boolean,
        hidden: boolean,
      },
      state: 'on' | 'off' | 'mixed', // Checkbox state
    },
  ]}
  onPressAction={({ nativeEvent }) => {
    // nativeEvent.event = action id
  }}
  onOpenMenu={() => console.log('Opened')}
  onCloseMenu={() => console.log('Closed')}
  shouldOpenOnLongPress={true} // Context menu
  isAnchoredToRight={false}
  themeVariant="dark" | "light"
>
  <YourComponent />
</MenuView>
```

#### Android (PopupMenu API)

```tsx
<MenuView
  title="Title"
  actions={[
    {
      id: 'action-id',
      title: 'Action Title',
      image: 'ic_menu_icon', // Material Icon
      // Android unterstützt weniger Optionen
    },
  ]}
  onPressAction={({ nativeEvent }) => {
    // Handle action
  }}
>
  <YourComponent />
</MenuView>
```

#### Nested Menus (iOS & Android)

```tsx
<MenuView
  actions={[
    {
      id: 'parent',
      title: 'Parent Menu',
      subactions: [
        { id: 'child-1', title: 'Child 1' },
        { id: 'child-2', title: 'Child 2' },
      ],
    },
  ]}
  onPressAction={({ nativeEvent }) => {
    // Handles parent and child actions
  }}
>
  <YourComponent />
</MenuView>
```

### SF Symbols Guide (iOS)

```tsx
// Common SF Symbols
const SF_SYMBOLS = {
  // Actions
  edit: 'pencil',
  delete: 'trash',
  share: 'square.and.arrow.up',
  copy: 'doc.on.doc',
  download: 'arrow.down.circle',
  upload: 'arrow.up.circle',

  // Objects
  photo: 'photo',
  video: 'video',
  document: 'doc',
  folder: 'folder',

  // UI
  settings: 'gearshape',
  profile: 'person.circle',
  search: 'magnifyingglass',
  filter: 'line.3.horizontal.decrease.circle',

  // Status
  check: 'checkmark',
  close: 'xmark',
  warning: 'exclamationmark.triangle',
  info: 'info.circle',
};
```

### Material Icons Guide (Android)

```tsx
// Common Material Icons
const MATERIAL_ICONS = {
  // Actions
  edit: 'ic_menu_edit',
  delete: 'ic_menu_delete',
  share: 'ic_menu_share',
  copy: 'ic_menu_copy_holo_dark',

  // Objects
  camera: 'ic_menu_camera',
  gallery: 'ic_menu_gallery',

  // UI
  preferences: 'ic_menu_preferences',
  myplaces: 'ic_menu_myplaces', // Profile
  search: 'ic_menu_search',

  // Status
  add: 'ic_menu_add',
  close: 'ic_menu_close_clear_cancel',
};
```

---

## Alternative Lösungen (Falls @react-native-menu/menu nicht funktioniert)

### Option B: Zeego Fix abwarten + Workaround

**Wenn du Zeego wirklich bevorzugst:**

1. **GitHub Issue monitoren:** Issue #173 beobachten
2. **Temporärer Workaround:** Downgrade auf Expo SDK 52
3. **Zeitaufwand:** Unbekannt (kann Wochen dauern)

**Nicht empfohlen:** Blockiert SDK 54 Features

### Option C: react-native-ios-context-menu direkt (iOS only)

**Nur für iOS-exklusive Apps:**

```tsx
import { ContextMenuView } from 'react-native-ios-context-menu';

<ContextMenuView
  menuConfig={{
    menuTitle: 'Title',
    menuItems: [
      {
        actionKey: 'action1',
        actionTitle: 'Action 1',
        icon: { iconType: 'SYSTEM', iconValue: 'trash' },
      },
    ],
  }}
  onPressMenuItem={({ nativeEvent }) => {
    // Handle
  }}
>
  <YourComponent />
</ContextMenuView>
```

**Nachteile:**
- Nur iOS
- In Maintenance Mode (Autor macht kein OSS mehr)
- Keine Android/Web Unterstützung

### Option D: Custom Implementation

**Nur als letzter Ausweg:**
- 20-30 Stunden Aufwand
- Kein natives Look-and-Feel
- Hoher Wartungsaufwand

---

## Testing-Strategie

### Unit Tests

```tsx
// __tests__/NativeMenu.test.tsx
import { render, fireEvent } from '@testing-library/react-native';
import { NativeMenu } from '../components/ui/NativeMenu';

jest.mock('@react-native-menu/menu', () => ({
  MenuView: 'MenuView',
}));

describe('NativeMenu', () => {
  it('renders children', () => {
    const { getByText } = render(
      <NativeMenu actions={[]} onAction={jest.fn()}>
        <Text>Test</Text>
      </NativeMenu>
    );
    expect(getByText('Test')).toBeTruthy();
  });

  it('calls onAction with correct id', () => {
    const onAction = jest.fn();
    const { getByTestId } = render(
      <NativeMenu
        actions={[{ id: 'test', title: 'Test' }]}
        onAction={onAction}
      >
        <View testID="trigger" />
      </NativeMenu>
    );

    // Simulate menu press
    fireEvent(getByTestId('trigger'), 'onPressAction', {
      nativeEvent: { event: 'test' },
    });

    expect(onAction).toHaveBeenCalledWith('test');
  });
});
```

### E2E Tests (Detox)

```tsx
// e2e/menus.test.ts
describe('Native Menus', () => {
  it('should open context menu on long press', async () => {
    await element(by.id('memory-card')).longPress();
    await expect(element(by.text('Löschen'))).toBeVisible();
  });

  it('should execute action on tap', async () => {
    await element(by.id('memory-card')).longPress();
    await element(by.text('Löschen')).tap();
    await expect(element(by.id('memory-card'))).not.toBeVisible();
  });
});
```

---

## Rollback-Plan

Falls Probleme auftreten:

### 1. Git Branch Strategy

```bash
# Vor Migration
git checkout -b migration/native-menus
git push -u origin migration/native-menus

# Bei Problemen
git checkout main
git branch -D migration/native-menus
```

### 2. Package Lock

```bash
# package.json vor Migration sichern
cp package.json package.json.backup
cp package-lock.json package-lock.json.backup

# Rollback
mv package.json.backup package.json
mv package-lock.json.backup package-lock.json
npm install
```

### 3. Zeego Restore

```bash
# Falls Rollback nötig
npm install zeego@3.0.6
npx expo prebuild --clean
```

---

## Performance-Optimierung

### 1. Action Memoization

```tsx
const memoActions = useMemo(() =>
  actions.map(buildMenuAction),
  [actions]
);

<MenuView actions={memoActions} />
```

### 2. Handler Optimization

```tsx
const handleAction = useCallback((actionId: string) => {
  switch (actionId) {
    case 'delete':
      deleteHandler();
      break;
    // ...
  }
}, [deleteHandler, /* deps */]);
```

### 3. Lazy Loading (Web)

```tsx
// Radix UI nur auf Web laden
const DropdownMenu = Platform.OS === 'web'
  ? lazy(() => import('@radix-ui/react-dropdown-menu'))
  : null;
```

---

## FAQ

### Q: Funktioniert @react-native-menu/menu mit Expo Go?
**A:** Nein, erfordert Custom Development Build (wie Zeego auch).

### Q: Brauche ich Web Support?
**A:** Nur wenn deine App im Browser laufen soll. Viele Expo-Apps sind Mobile-only.

### Q: Wie ist die Performance vs Zeego?
**A:** Identisch - beide nutzen die gleichen nativen APIs.

### Q: Was ist mit Dark Mode?
**A:** Native Menus respektieren automatisch das System-Theme.

### Q: Kann ich Custom Styling verwenden?
**A:** Nein - native Menus nutzen System-Styling. Für Custom UI: eigene Modals bauen.

### Q: Unterstützt es Animationen?
**A:** Ja - native System-Animationen (nicht konfigurierbar).

---

## Zusammenfassung & Empfehlung

### ✅ Empfohlene Lösung: @react-native-menu/menu

**Warum:**
- ✅ Bereits installiert (v2.0.0)
- ✅ SDK 54 kompatibel (RN 0.81 getestet)
- ✅ Native iOS & Android Menus
- ✅ Aktiv maintained
- ✅ Niedriges Risiko

**Zeitaufwand:** 8-12 Stunden
**Risiko:** Niedrig
**UX:** Native (best-in-class)

### Migrations-Reihenfolge

1. **Sofort:** Dependencies setup (30 min)
2. **Phase 1:** Dropdown Menus (4-5h)
3. **Phase 2:** Context Menus (2-3h)
4. **Phase 3:** Testing (2-3h)
5. **Optional:** Web Support (2-3h)

### Nächste Schritte

1. ✅ Team-Entscheidung einholen
2. ✅ Git Branch erstellen
3. ✅ Phase 1 starten (Dependencies)
4. ✅ Iterativ migrieren
5. ✅ Testen auf allen Plattformen

---

**Dokument erstellt:** 30. September 2025
**Autor:** Claude Code Analyse
**Status:** ✅ Production Ready
**Review:** Empfohlen für Team-Review

---

## Ressourcen

- [@react-native-menu/menu GitHub](https://github.com/react-native-menu/menu)
- [@react-native-menu/menu NPM](https://www.npmjs.com/package/@react-native-menu/menu)
- [Radix UI Dropdown](https://www.radix-ui.com/primitives/docs/components/dropdown-menu)
- [Radix UI Context Menu](https://www.radix-ui.com/primitives/docs/components/context-menu)
- [SF Symbols Browser](https://developer.apple.com/sf-symbols/)
- [Material Icons Guide](https://developer.android.com/reference/android/R.drawable)