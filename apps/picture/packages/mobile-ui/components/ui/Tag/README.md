# Tag

Tag/Chip component for labels, categories, and keywords.

## Features

- ✅ 3 variants: solid, outline, subtle
- ✅ 3 sizes: sm, md, lg
- ✅ Optional icon
- ✅ Closeable tags
- ✅ Pressable for selection
- ✅ TagGroup for layouts

## Installation

```bash
npx @memoro/ui add tag
```

**Dependencies:** `text`, `icon`

## Usage

### Basic Tag

```tsx
import { Tag } from '@/components/ui/Tag';

<Tag label="Featured" color="#3B82F6" />
```

### Variants

```tsx
<Tag label="Solid" variant="solid" color="#10B981" />
<Tag label="Outline" variant="outline" color="#F59E0B" />
<Tag label="Subtle" variant="subtle" color="#8B5CF6" />
```

### Sizes

```tsx
<Tag label="Small" size="sm" color="#3B82F6" />
<Tag label="Medium" size="md" color="#3B82F6" />
<Tag label="Large" size="lg" color="#3B82F6" />
```

### With Icon

```tsx
<Tag label="Category" icon="tag" color="#10B981" />
<Tag label="Location" icon="location" color="#EF4444" />
```

### Closeable Tag

```tsx
<Tag
  label="Filter"
  color="#3B82F6"
  onClose={() => console.log('Closed')}
/>
```

### Pressable Tag

```tsx
<Tag
  label="Select me"
  color="#8B5CF6"
  onPress={() => console.log('Pressed')}
/>
```

### Tag Group

```tsx
<TagGroup gap={8}>
  <Tag label="React" color="#61DAFB" />
  <Tag label="TypeScript" color="#3178C6" />
  <Tag label="Mobile" color="#10B981" />
  <Tag label="UI" color="#F59E0B" />
</TagGroup>
```

## Props

### Tag

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `label` | `string` | - | **Required** - Tag text |
| `variant` | `'solid' \| 'outline' \| 'subtle'` | `'subtle'` | Visual style |
| `size` | `'sm' \| 'md' \| 'lg'` | `'md'` | Tag size |
| `color` | `string` | `'#3B82F6'` | Tag color |
| `icon` | `string` | - | Icon name (optional) |
| `onClose` | `() => void` | - | Close handler (shows X button) |
| `onPress` | `() => void` | - | Press handler (makes tag pressable) |
| `style` | `ViewStyle` | - | Additional styles |

### TagGroup

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `children` | `ReactNode` | - | Tag elements |
| `gap` | `number` | `8` | Space between tags |
| `style` | `ViewStyle` | - | Container styles |

## Variants

| Variant | Background | Border | Text |
|---------|-----------|--------|------|
| `solid` | Color | None | White |
| `outline` | Transparent | Color | Color |
| `subtle` | Color (20% opacity) | None | Color |

## Sizes

| Size | Padding | Font Size | Icon Size |
|------|---------|-----------|-----------|
| `sm` | 8/4px | 12px | 14px |
| `md` | 12/6px | 14px | 16px |
| `lg` | 16/8px | 16px | 18px |

## Examples

### Category Tags

```tsx
<TagGroup>
  <Tag label="Technology" icon="laptop" color="#3B82F6" />
  <Tag label="Design" icon="paintbrush" color="#8B5CF6" />
  <Tag label="Business" icon="briefcase" color="#10B981" />
</TagGroup>
```

### Filter Tags (Removable)

```tsx
{filters.map(filter => (
  <Tag
    key={filter.id}
    label={filter.name}
    color="#3B82F6"
    onClose={() => removeFilter(filter.id)}
  />
))}
```

### Status Tags

```tsx
<Tag label="Active" variant="solid" color="#10B981" />
<Tag label="Pending" variant="solid" color="#F59E0B" />
<Tag label="Inactive" variant="outline" color="#6B7280" />
```

### Selectable Tags

```tsx
{categories.map(cat => (
  <Tag
    key={cat.id}
    label={cat.name}
    variant={selected === cat.id ? 'solid' : 'outline'}
    color="#3B82F6"
    onPress={() => setSelected(cat.id)}
  />
))}
```

### Skill Tags

```tsx
<TagGroup gap={6}>
  <Tag label="React" size="sm" color="#61DAFB" />
  <Tag label="TypeScript" size="sm" color="#3178C6" />
  <Tag label="Node.js" size="sm" color="#339933" />
  <Tag label="GraphQL" size="sm" color="#E535AB" />
</TagGroup>
```

## Common Colors

- **Blue:** `#3B82F6` (info, primary)
- **Green:** `#10B981` (success, active)
- **Yellow:** `#F59E0B` (warning, pending)
- **Red:** `#EF4444` (error, important)
- **Purple:** `#8B5CF6` (featured)
- **Gray:** `#6B7280` (inactive)

## Dependencies

- `Text` component
- `Icon` component

## Notes

- Tags wrap automatically in TagGroup
- Close button has 8px hit slop for easier tapping
- Press/close interactions show opacity feedback
- Icon appears before label
- Close button appears after label
- Fully rounded with 999px border radius
