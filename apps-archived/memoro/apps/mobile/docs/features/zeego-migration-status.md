# Zeego Migration Status

## Abgeschlossen ✅

### Dependencies

- [x] Zeego deinstalliert
- [x] react-native-ios-context-menu deinstalliert
- [x] react-native-ios-utilities deinstalliert
- [x] @react-native-menu/menu@2.0.0 bereits vorhanden

### Utility Components

- [x] `config/menuActions.ts` - Zentralisierte Menu Actions
- [x] `utils/menuBuilder.ts` - Menu Action Builder
- [x] `components/ui/NativeMenu.tsx` - Wiederverwendbare Wrapper-Komponente

### Dropdown Menus (3/11 migriert)

- [x] `features/menus/HeaderMenu.tsx`
- [x] `features/menus/MemoMenu.tsx`
- [x] `features/menus/MemoHeaderMenu.tsx`
- [ ] `components/atoms/Pill.tsx`
- [ ] `components/molecules/TableOfContentsMenu.tsx`
- [ ] `features/subscription/SubscriptionMenu.tsx`
- [ ] `components/organisms/PhotoGallery.tsx`
- [ ] Weitere 4 Komponenten (noch zu identifizieren)

### Context Menus (0/4 migriert)

- [ ] `components/organisms/Memory.tsx`
- [ ] `components/molecules/PromptPreview.tsx`
- [ ] `components/molecules/MemoPreview.tsx`
- [ ] 1 weitere Komponente

## Nächste Schritte

1. ✅ Restliche Dropdown Menus migrieren
2. ✅ Context Menus migrieren
3. ✅ Native Rebuild (`npx expo prebuild --clean`)
4. ✅ iOS Testing
5. ✅ Android Testing

## Migration Pattern

### Dropdown Menu (Tap)

```tsx
// Vorher
import * as DropdownMenu from 'zeego/dropdown-menu';

// Nachher
import { MenuView } from '@react-native-menu/menu';

<MenuView
	actions={actions}
	onPressAction={({ nativeEvent }) => handleAction(nativeEvent.event)}
	shouldOpenOnLongPress={false} // Dropdown = tap
>
	{children}
</MenuView>;
```

### Context Menu (Long Press)

```tsx
<MenuView
	actions={actions}
	onPressAction={({ nativeEvent }) => handleAction(nativeEvent.event)}
	shouldOpenOnLongPress={true} // Context = long press (default)
>
	{children}
</MenuView>
```

## Web Fallbacks

Alle migrierten Komponenten behalten ihre bestehenden Web-Implementierungen (Custom Modals).

---

**Status:** In Progress (3/15 Komponenten migriert)
**Letzte Aktualisierung:** 30. September 2025
