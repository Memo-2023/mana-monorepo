# FAB (Floating Action Button)

Floating action button with spring animation and shadow.

## Features

- ✅ Spring press animation
- ✅ Customizable position (bottom/right/left)
- ✅ Custom colors and icon
- ✅ Shadow effect
- ✅ Built with Reanimated

## Installation

```bash
npx @memoro/ui add fab
```

**Dependencies:** `icon`, `react-native-reanimated`

## Usage

### Basic FAB

```tsx
import { FAB } from '@/components/ui/FAB';

<FAB
  icon="add"
  onPress={() => console.log('Pressed')}
/>
```

### Custom Colors

```tsx
<FAB
  icon="camera"
  backgroundColor="#10B981"
  iconColor="#FFFFFF"
  onPress={() => {}}
/>
```

### Custom Position

```tsx
// Bottom right (default)
<FAB icon="add" bottom={20} right={20} onPress={() => {}} />

// Bottom left
<FAB icon="menu" bottom={20} left={20} onPress={() => {}} />

// Higher position
<FAB icon="add" bottom={150} onPress={() => {}} />
```

### Larger Icon

```tsx
<FAB
  icon="heart"
  iconSize={28}
  onPress={() => {}}
/>
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `icon` | `string` | - | **Required** - Icon name |
| `onPress` | `() => void` | - | **Required** - Press handler |
| `bottom` | `number` | `100` | Distance from bottom (px) |
| `right` | `number` | `16` | Distance from right (px) |
| `left` | `number` | - | Distance from left (overrides right) |
| `backgroundColor` | `string` | `'#3B82F6'` | Button background color |
| `iconColor` | `string` | `'#FFFFFF'` | Icon color |
| `iconSize` | `number` | `24` | Icon size |
| `style` | `ViewStyle` | - | Additional container styles |

## Default Styling

- **Size:** 56x56px
- **Border Radius:** 28px (perfect circle)
- **Background:** Blue (#3B82F6)
- **Icon:** White, 24px
- **Shadow:** Colored shadow matching background

## Animation

- Press scales down to 0.9
- Releases back to 1.0
- Spring animation with damping

## Examples

### Create/Add FAB

```tsx
<FAB
  icon="add"
  backgroundColor="#3B82F6"
  onPress={handleCreate}
/>
```

### Camera FAB

```tsx
<FAB
  icon="camera"
  backgroundColor="#10B981"
  bottom={100}
  onPress={handleCamera}
/>
```

### Edit FAB

```tsx
<FAB
  icon="pencil"
  backgroundColor="#F59E0B"
  bottom={80}
  right={20}
  onPress={handleEdit}
/>
```

### Multiple FABs (Stacked)

```tsx
<>
  <FAB
    icon="add"
    bottom={100}
    right={20}
    onPress={handlePrimary}
  />
  <FAB
    icon="filter"
    bottom={170}
    right={20}
    backgroundColor="#6B7280"
    onPress={handleSecondary}
  />
</>
```

## Position Tips

- **Default:** `bottom={100}, right={16}`
- **Above Tab Bar:** `bottom={80-100}`
- **Below Tab Bar:** `bottom={20}`
- **Multiple FABs:** Stack with 70px spacing

## Dependencies

- `Icon` component
- `react-native-reanimated` (v3+)

## Notes

- Uses absolute positioning - ensure parent has appropriate layout
- Z-index of 10 (appears above most content)
- Shadow color matches background for glowing effect
- Press animation is hardware accelerated (Reanimated)
- Icon uses Icon component (SF Symbols on iOS, Ionicons elsewhere)
