# ✅ SF Symbols Fix - iOS Icons

## Problem
iOS Menus zeigten keine SF Symbols Icons an.

## Ursache
`@react-native-menu/menu` benötigt für SF Symbols ein Objekt mit `iconType` und `iconValue`:

```tsx
// ❌ Falsch - zeigt keine Icons
image: 'trash'

// ✅ Richtig - zeigt SF Symbol
image: { iconType: 'SYSTEM', iconValue: 'trash' }
```

## Lösung Applied

### 1. menuBuilder.ts aktualisiert
```tsx
image: Platform.select({
  ios: { iconType: 'SYSTEM' as const, iconValue: action.icon.ios },
  android: action.icon.android,
})
```

### 2. Alle 9 Komponenten gefixt
✅ HeaderMenu.tsx
✅ MemoMenu.tsx
✅ MemoHeaderMenu.tsx
✅ Memory.tsx
✅ MemoPreview.tsx
✅ PromptPreview.tsx
✅ Pill.tsx
✅ TableOfContentsMenu.tsx
✅ SubscriptionMenu.tsx

## Test
```bash
npx expo run:ios
```

**Erwartung:**
- ✅ Alle Menus zeigen SF Symbols Icons
- ✅ Destructive Actions (Delete) sind rot
- ✅ Icons passen zum System-Styling

---

**Status:** ✅ COMPLETE
**Date:** 30. September 2025