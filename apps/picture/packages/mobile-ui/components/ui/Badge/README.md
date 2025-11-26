# Badge

Notification badge for counts and status indicators.

## Features

- ✅ 3 variants: solid, outline, dot
- ✅ 3 sizes: sm, md, lg
- ✅ Max count with + indicator
- ✅ Can wrap around children
- ✅ Standalone or positioned

## Installation

```bash
npx @memoro/ui add badge
```

**Dependencies:** `text`

## Usage

### Standalone Badge

```tsx
import { Badge } from '@/components/ui/Badge';

<Badge content={5} />
<Badge content={99} max={99} />
<Badge content="NEW" color="#10B981" />
```

### Wrapped Around Icon

```tsx
<Badge content={3}>
  <Icon name="notifications" size={24} />
</Badge>

<Badge content={10} color="#EF4444">
  <Icon name="mail" size={24} />
</Badge>
```

### Dot Variant (Status Indicator)

```tsx
<Badge variant="dot" color="#10B981">
  <Icon name="person" size={32} />
</Badge>

<Badge variant="dot" color="#EF4444">
  <Text>Offline</Text>
</Badge>
```

### Outline Variant

```tsx
<Badge variant="outline" content={5} color="#3B82F6" />
```

### Sizes

```tsx
<Badge content={3} size="sm" />
<Badge content={3} size="md" />
<Badge content={3} size="lg" />
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `content` | `string \| number` | - | Badge content |
| `variant` | `'solid' \| 'outline' \| 'dot'` | `'solid'` | Visual style |
| `size` | `'sm' \| 'md' \| 'lg'` | `'md'` | Badge size |
| `color` | `string` | `'#EF4444'` | Badge color |
| `max` | `number` | `99` | Max number (shows +) |
| `showZero` | `boolean` | `false` | Show badge when content is 0 |
| `style` | `ViewStyle` | - | Additional styles |
| `children` | `ReactNode` | - | Element to wrap badge around |

## Variants

| Variant | Background | Border | Text |
|---------|-----------|--------|------|
| `solid` | Color | None | White |
| `outline` | Transparent | Color | Color |
| `dot` | Color | None | None |

## Sizes

| Size | Min Width | Height | Font Size | Dot Size |
|------|-----------|--------|-----------|----------|
| `sm` | 16px | 16px | 10px | 8px |
| `md` | 20px | 20px | 12px | 10px |
| `lg` | 24px | 24px | 14px | 12px |

## Examples

### Notification Bell

```tsx
<Badge content={notificationCount} color="#EF4444">
  <Icon name="notifications" size={28} />
</Badge>
```

### Shopping Cart

```tsx
<Badge content={cartItems} color="#3B82F6">
  <Icon name="cart" size={28} />
</Badge>
```

### Messages

```tsx
<Badge content={unreadMessages} max={99}>
  <Icon name="mail" size={28} />
</Badge>
```

### Online Status

```tsx
<Badge variant="dot" color="#10B981">
  <Image
    source={{ uri: user.avatar }}
    style={{ width: 50, height: 50, borderRadius: 25 }}
  />
</Badge>
```

### Tab Badge

```tsx
<View style={{ flexDirection: 'row' }}>
  <Text>Messages</Text>
  <Badge content={5} size="sm" style={{ marginLeft: 8 }} />
</View>
```

### Status Badges

```tsx
<View style={{ flexDirection: 'row', gap: 12 }}>
  <Badge variant="dot" color="#10B981" />
  <Text>Online</Text>
</View>

<View style={{ flexDirection: 'row', gap: 12 }}>
  <Badge variant="dot" color="#F59E0B" />
  <Text>Away</Text>
</View>

<View style={{ flexDirection: 'row', gap: 12 }}>
  <Badge variant="dot" color="#EF4444" />
  <Text>Busy</Text>
</View>
```

## Positioning

When wrapped around children:
- **Position:** Absolute, top-right corner
- **Offset:** -4px from top and right
- **Z-Index:** 1

## Common Colors

- **Red:** `#EF4444` (notifications, errors)
- **Blue:** `#3B82F6` (info, messages)
- **Green:** `#10B981` (success, online)
- **Yellow:** `#F59E0B` (warnings, away)
- **Gray:** `#6B7280` (neutral, offline)

## Max Count

When `content` exceeds `max`:
- Shows `{max}+` (e.g., "99+")
- Default max is 99
- Customize with `max` prop

## Dependencies

- `Text` component

## Notes

- Badge hides when content is 0 (unless `showZero={true}`)
- Dot variant ignores content
- Solid variant has white text
- Outline variant has colored text
- Positioning works with any children (icons, images, text)
