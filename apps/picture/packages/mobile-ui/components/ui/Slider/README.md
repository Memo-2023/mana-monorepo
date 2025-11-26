# Slider

Interactive slider component with smooth animations.

## Features

- ✅ Smooth pan and tap gestures
- ✅ Animated thumb and track
- ✅ Custom colors
- ✅ Configurable min/max values
- ✅ Built with Reanimated v3

## Installation

```bash
npx @memoro/ui add slider
```

**Dependencies:**
- `react-native-reanimated`
- `react-native-gesture-handler`

## Usage

### Basic Slider

```tsx
import { Slider } from '@/components/ui/Slider';
import { useState } from 'react';

function MyComponent() {
  const [value, setValue] = useState(50);

  return (
    <Slider
      minimumValue={0}
      maximumValue={100}
      value={value}
      onValueChange={setValue}
    />
  );
}
```

### Custom Colors

```tsx
<Slider
  minimumValue={0}
  maximumValue={100}
  value={value}
  onValueChange={setValue}
  minimumTrackTintColor="#3B82F6"
  maximumTrackTintColor="#D1D5DB"
  thumbTintColor="#2563EB"
/>
```

### Volume Control

```tsx
const [volume, setVolume] = useState(50);

<Slider
  minimumValue={0}
  maximumValue={100}
  value={volume}
  onValueChange={setVolume}
  minimumTrackTintColor="#10B981"
  thumbTintColor="#059669"
/>
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `minimumValue` | `number` | - | **Required** - Minimum value |
| `maximumValue` | `number` | - | **Required** - Maximum value |
| `value` | `number` | - | **Required** - Current value |
| `onValueChange` | `(value: number) => void` | - | **Required** - Value change callback |
| `minimumTrackTintColor` | `string` | `'#6366f1'` | Filled track color |
| `maximumTrackTintColor` | `string` | `'#374151'` | Unfilled track color |
| `thumbTintColor` | `string` | `'#818cf8'` | Thumb color |
| `style` | `ViewStyle` | - | Additional container styles |

## Default Colors

- **Filled Track:** `#6366f1` (indigo-500)
- **Unfilled Track:** `#374151` (gray-700)
- **Thumb:** `#818cf8` (indigo-400)

## Gestures

- **Pan:** Drag thumb to change value
- **Tap:** Tap anywhere on track to jump to value

## Dependencies

Requires:
- `react-native-reanimated` (v3+)
- `react-native-gesture-handler` (v2+)

## Notes

- Thumb is 24x24px
- Track is 4px high
- Container is 40px high for easy touch
- Smooth animations with Reanimated
- Auto-updates when `value` prop changes
