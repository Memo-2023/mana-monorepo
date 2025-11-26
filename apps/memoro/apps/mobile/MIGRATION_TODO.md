# Zeego → @react-native-menu/menu Migration TODO

## ✅ Completed

### Phase 1: Dependencies & Setup
- [x] Zeego uninstalled
- [x] Utility components created (NativeMenu, menuActions, menuBuilder)
- [x] All imports replaced with `import { MenuView } from '@react-native-menu/menu';`

### Phase 2: Simple Migrations
- [x] `features/menus/HeaderMenu.tsx`
- [x] `features/menus/MemoMenu.tsx`
- [x] `features/menus/MemoHeaderMenu.tsx`
- [x] `components/organisms/Memory.tsx`

## 🔄 In Progress - Need Code Replacement

Die folgenden 5 Komponenten haben bereits den Import ersetzt, aber die `ContextMenu.Root`, `ContextMenu.Trigger`, `DropdownMenu.Root` etc. müssen noch durch `MenuView` ersetzt werden:

### 1. components/molecules/MemoPreview.tsx
**Type:** Context Menu (Long Press)
**Lines:** 881-919
**Special:** Has `ContextMenu.Preview` - muss durch MenuView ohne Preview ersetzt werden

**Pattern:**
```tsx
// Zeile 881-919 ersetzen
<ContextMenu.Root>
  <ContextMenu.Trigger>...</ContextMenu.Trigger>
  <ContextMenu.Preview>...</ContextMenu.Preview>
  <ContextMenu.Content>
    {menuItems.map((item) => (
      <ContextMenu.Item...>...</ContextMenu.Item>
    ))}
  </ContextMenu.Content>
</ContextMenu.Root>

// Wird zu:
<MenuView
  actions={menuItems.map(item => ({
    id: item.key,
    title: item.title,
    image: Platform.select({
      ios: item.systemIcon,
      android: `ic_menu_${item.key}`,
    }),
    attributes: item.destructive ? { destructive: true } : undefined,
  }))}
  onPressAction={({ nativeEvent }) => {
    const selectedItem = menuItems.find(item => item.key === nativeEvent.event);
    selectedItem?.onSelect?.();
  }}
  shouldOpenOnLongPress={true}  // Context Menu
>
  {/* Content ohne Preview */}
</MenuView>
```

**Note:** ContextMenu.Preview wird nicht von @react-native-menu/menu unterstützt - einfach weglassen.

---

### 2. components/molecules/PromptPreview.tsx
**Type:** Context Menu (Long Press)
**Lines:** Suche nach `ContextMenu.Root`

**Pattern:** Gleich wie MemoPreview, aber ohne Preview

---

### 3. components/atoms/Pill.tsx
**Type:** Dropdown Menu (Tap) für Context Menu Funktionalität
**Lines:** Suche nach `DropdownMenu.Root` oder `ContextMenu.Root`

**Pattern:** shouldOpenOnLongPress={true} für Context Menu verhalten

---

### 4. components/molecules/TableOfContentsMenu.tsx
**Type:** Dropdown Menu (Tap)
**Lines:** Suche nach `DropdownMenu.Root`

**Pattern:**
```tsx
<MenuView
  actions={...}
  onPressAction={...}
  shouldOpenOnLongPress={false}  // Dropdown = normal tap
>
  {children}
</MenuView>
```

---

### 5. features/subscription/SubscriptionMenu.tsx
**Type:** Dropdown Menu (Tap)
**Lines:** Suche nach `DropdownMenu.Root`

**Pattern:** shouldOpenOnLongPress={false}

---

## Quick Find & Replace Patterns

### Pattern 1: Simple ContextMenu (ohne Preview)
```bash
# Find:
<ContextMenu.Root>
  <ContextMenu.Trigger>
    {TRIGGER_CONTENT}
  </ContextMenu.Trigger>
  <ContextMenu.Content>
    {menuItems.map((item) => (
      <ContextMenu.Item key={item.key} onSelect={item.onSelect} destructive={item.destructive}>
        <ContextMenu.ItemIcon ios={{ name: item.systemIcon }} />
        <ContextMenu.ItemTitle>{item.title}</ContextMenu.ItemTitle>
      </ContextMenu.Item>
    ))}
  </ContextMenu.Content>
</ContextMenu.Root>

# Replace with:
<MenuView
  actions={menuItems.map(item => ({
    id: item.key,
    title: item.title,
    image: Platform.select({ ios: item.systemIcon, android: `ic_menu_${item.key}` }),
    attributes: item.destructive ? { destructive: true } : undefined,
  }))}
  onPressAction={({ nativeEvent }) => {
    const selectedItem = menuItems.find(item => item.key === nativeEvent.event);
    selectedItem?.onSelect?.();
  }}
  shouldOpenOnLongPress={true}
>
  {TRIGGER_CONTENT}
</MenuView>
```

### Pattern 2: Simple DropdownMenu
```bash
# Find:
<DropdownMenu.Root>
  <DropdownMenu.Trigger>...</DropdownMenu.Trigger>
  <DropdownMenu.Content>...</DropdownMenu.Content>
</DropdownMenu.Root>

# Replace with:
<MenuView
  actions={...}
  onPressAction={...}
  shouldOpenOnLongPress={false}
>
  ...
</MenuView>
```

## Commands to Find Remaining Work

```bash
# Find all ContextMenu usage
grep -rn "ContextMenu\." components/ features/ --include="*.tsx" | grep -v node_modules

# Find all DropdownMenu usage
grep -rn "DropdownMenu\." components/ features/ --include="*.tsx" | grep -v node_modules

# Test if any zeego imports remain
grep -rn "from 'zeego" components/ features/ --include="*.tsx" | grep -v node_modules
```

## Test Commands

```bash
# Clean rebuild
npx expo prebuild --clean

# Start iOS
npx expo run:ios

# Start Android
npx expo run:android
```

---

**Status:** 4/15 Komponenten vollständig migriert, 5 haben Import ersetzt aber benötigen Code-Replacement
**Next:** Code-Replacement in den 5 verbleibenden Komponenten