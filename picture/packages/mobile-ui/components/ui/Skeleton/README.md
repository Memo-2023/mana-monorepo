# Skeleton

Loading skeleton with shimmer animation for placeholder content.

## Features

- ✅ Shimmer animation
- ✅ 3 variants: rect, circle, text
- ✅ Custom dimensions and colors
- ✅ SkeletonGroup for layouts
- ✅ Built with Reanimated

## Installation

```bash
npx @memoro/ui add skeleton
```

**Dependencies:** `react-native-reanimated`

## Usage

### Rectangle (Default)

```tsx
import { Skeleton } from '@/components/ui/Skeleton';

<Skeleton width={200} height={100} />
```

### Circle (Avatar)

```tsx
<Skeleton variant="circle" width={50} height={50} />
```

### Text Line

```tsx
<Skeleton variant="text" width="80%" />
<Skeleton variant="text" width="60%" />
```

### Custom Colors

```tsx
<Skeleton
  width={200}
  height={20}
  backgroundColor="#D1D5DB"
  shimmerColor="#E5E7EB"
/>
```

### Card Skeleton

```tsx
<SkeletonGroup spacing={12}>
  <Skeleton variant="circle" width={50} height={50} />
  <Skeleton variant="text" width="70%" />
  <Skeleton variant="text" width="50%" />
</SkeletonGroup>
```

### List Skeleton

```tsx
{Array.from({ length: 5 }).map((_, i) => (
  <SkeletonGroup key={i} spacing={8} style={{ marginBottom: 16 }}>
    <Skeleton variant="circle" width={40} height={40} />
    <View style={{ flex: 1 }}>
      <Skeleton variant="text" width="80%" />
      <Skeleton variant="text" width="60%" />
    </View>
  </SkeletonGroup>
))}
```

### Image Grid Skeleton

```tsx
<View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
  {Array.from({ length: 6 }).map((_, i) => (
    <Skeleton key={i} width={100} height={100} />
  ))}
</View>
```

## Props

### Skeleton

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `width` | `number \| string` | `'100%'` | Width of skeleton |
| `height` | `number \| string` | `20` | Height of skeleton |
| `borderRadius` | `number` | - | Border radius (auto for variants) |
| `backgroundColor` | `string` | `'#E5E7EB'` | Base color |
| `shimmerColor` | `string` | `'#F3F4F6'` | Shimmer overlay color |
| `duration` | `number` | `1500` | Animation duration (ms) |
| `style` | `ViewStyle` | - | Additional styles |
| `variant` | `'rect' \| 'circle' \| 'text'` | `'rect'` | Skeleton shape |

### SkeletonGroup

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `children` | `ReactNode` | - | Skeleton elements |
| `spacing` | `number` | `12` | Gap between elements |
| `style` | `ViewStyle` | - | Container styles |

## Variants

| Variant | Default Radius | Use Case |
|---------|---------------|----------|
| `rect` | 8px | Images, cards, boxes |
| `circle` | 50% | Avatars, icons |
| `text` | 4px | Text lines |

## Examples

### Profile Card Skeleton

```tsx
<View style={{ padding: 16 }}>
  <SkeletonGroup spacing={16}>
    {/* Avatar */}
    <Skeleton variant="circle" width={80} height={80} />

    {/* Name */}
    <Skeleton variant="text" width="60%" height={24} />

    {/* Bio */}
    <SkeletonGroup spacing={8}>
      <Skeleton variant="text" width="100%" />
      <Skeleton variant="text" width="90%" />
      <Skeleton variant="text" width="70%" />
    </SkeletonGroup>

    {/* Stats */}
    <View style={{ flexDirection: 'row', gap: 16 }}>
      <Skeleton width={80} height={40} />
      <Skeleton width={80} height={40} />
      <Skeleton width={80} height={40} />
    </View>
  </SkeletonGroup>
</View>
```

### Article Skeleton

```tsx
<SkeletonGroup spacing={16}>
  {/* Cover image */}
  <Skeleton width="100%" height={200} />

  {/* Title */}
  <Skeleton variant="text" width="90%" height={28} />
  <Skeleton variant="text" width="70%" height={28} />

  {/* Meta */}
  <View style={{ flexDirection: 'row', gap: 12 }}>
    <Skeleton variant="circle" width={32} height={32} />
    <Skeleton variant="text" width={120} />
  </View>

  {/* Content */}
  <SkeletonGroup spacing={8}>
    <Skeleton variant="text" width="100%" />
    <Skeleton variant="text" width="95%" />
    <Skeleton variant="text" width="98%" />
    <Skeleton variant="text" width="85%" />
  </SkeletonGroup>
</SkeletonGroup>
```

## Default Colors

- **Background:** `#E5E7EB` (gray-200)
- **Shimmer:** `#F3F4F6` (gray-100)

## Animation

- Pulses from 30% → 60% → 30% opacity
- Duration: 1500ms
- Infinite loop

## Dependencies

- `react-native-reanimated` (v3+)

## Notes

- Uses Reanimated for smooth 60fps animation
- Shimmer color should be lighter than background
- Use SkeletonGroup for consistent spacing
- Supports percentage widths
