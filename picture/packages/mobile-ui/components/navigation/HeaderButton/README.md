# HeaderButton

Icon button component for header actions.

## Features

- ✅ Icon-based button
- ✅ Press feedback
- ✅ Disabled state
- ✅ Customizable size and color
- ✅ Touch target optimization (hit slop)
- ✅ Clean, minimal design

## Installation

```bash
npx @memoro/ui add header-button
```

**Dependencies:** icon

## Usage

### Basic HeaderButton

```tsx
import { HeaderButton } from '@/components/navigation/HeaderButton';

<HeaderButton
  icon="search"
  onPress={() => console.log('Search')}
/>
```

### Custom Size and Color

```tsx
<HeaderButton
  icon="settings"
  onPress={handleSettings}
  size={28}
  iconColor="#3B82F6"
/>
```

### Disabled State

```tsx
<HeaderButton
  icon="save"
  onPress={handleSave}
  disabled={!hasChanges}
  iconColor={hasChanges ? '#10B981' : '#9CA3AF'}
/>
```

### Multiple Buttons

```tsx
<View style={{ flexDirection: 'row', gap: 4 }}>
  <HeaderButton icon="search" onPress={handleSearch} />
  <HeaderButton icon="filter" onPress={handleFilter} />
  <HeaderButton icon="ellipsis-horizontal" onPress={handleMore} />
</View>
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `icon` | `string` | - | **Required** - Icon name |
| `onPress` | `() => void` | - | **Required** - Press handler |
| `size` | `number` | `24` | Icon size in pixels |
| `iconColor` | `string` | `'#6B7280'` | Icon color |
| `disabled` | `boolean` | `false` | Button is disabled |
| `style` | `ViewStyle` | - | Additional styles |
| `hitSlop` | `object` | `{top:10,bottom:10,left:10,right:10}` | Touch target expansion |

## Default Styling

- **Icon Size:** 24px
- **Icon Color:** Gray (#6B7280)
- **Padding:** 8px
- **Hit Slop:** 10px all sides
- **Disabled Opacity:** 0.4
- **Pressed Opacity:** 0.7

## Examples

### Save Button

```tsx
<HeaderButton
  icon="checkmark"
  onPress={handleSave}
  iconColor="#10B981"
/>
```

### Close Button

```tsx
<HeaderButton
  icon="close"
  onPress={handleClose}
  iconColor="#EF4444"
/>
```

### Add Button

```tsx
<HeaderButton
  icon="add"
  onPress={handleAdd}
  iconColor="#3B82F6"
  size={28}
/>
```

### Share Button

```tsx
<HeaderButton
  icon="share-outline"
  onPress={handleShare}
/>
```

### More Menu

```tsx
<HeaderButton
  icon="ellipsis-horizontal"
  onPress={handleOpenMenu}
/>
```

### Edit Button

```tsx
<HeaderButton
  icon="pencil"
  onPress={handleEdit}
  disabled={!canEdit}
  iconColor={canEdit ? '#3B82F6' : '#9CA3AF'}
/>
```

## Integration with Header

### Single Action

```tsx
<Header
  title="Details"
  showBackButton
  onBackPress={() => router.back()}
  rightContent={
    <HeaderButton icon="ellipsis-horizontal" onPress={handleMore} />
  }
/>
```

### Multiple Actions

```tsx
<Header
  title="Photos"
  rightContent={
    <View style={{ flexDirection: 'row', gap: 4 }}>
      <HeaderButton icon="search" onPress={handleSearch} />
      <HeaderButton icon="filter" onPress={handleFilter} />
      <HeaderButton icon="ellipsis-horizontal" onPress={handleMore} />
    </View>
  }
/>
```

### Conditional Actions

```tsx
<Header
  title="Edit"
  showBackButton
  onBackPress={() => router.back()}
  rightContent={
    <>
      {isEditing && (
        <HeaderButton
          icon="checkmark"
          onPress={handleSave}
          iconColor="#10B981"
          disabled={!hasChanges}
        />
      )}
    </>
  }
/>
```

## Common Use Cases

### Search

```tsx
<HeaderButton icon="search" onPress={handleSearch} />
```

### Filter

```tsx
<HeaderButton icon="filter" onPress={handleFilter} />
```

### Sort

```tsx
<HeaderButton icon="swap-vertical" onPress={handleSort} />
```

### Settings

```tsx
<HeaderButton icon="settings-outline" onPress={handleSettings} />
```

### Notifications

```tsx
<View>
  <HeaderButton icon="notifications-outline" onPress={handleNotifications} />
  {hasUnread && (
    <View style={{
      position: 'absolute',
      top: 6,
      right: 6,
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: '#EF4444',
    }} />
  )}
</View>
```

### Download

```tsx
<HeaderButton
  icon="download-outline"
  onPress={handleDownload}
  disabled={isDownloading}
/>
```

### Delete

```tsx
<HeaderButton
  icon="trash-outline"
  onPress={handleDelete}
  iconColor="#EF4444"
/>
```

### Favorite

```tsx
<HeaderButton
  icon={isFavorite ? 'heart' : 'heart-outline'}
  onPress={toggleFavorite}
  iconColor={isFavorite ? '#EF4444' : '#6B7280'}
/>
```

## Styling Patterns

### With Margin

```tsx
<HeaderButton
  icon="search"
  onPress={handleSearch}
  style={{ marginRight: 8 }}
/>
```

### Larger Touch Target

```tsx
<HeaderButton
  icon="close"
  onPress={handleClose}
  hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
/>
```

### Custom Padding

```tsx
<HeaderButton
  icon="settings"
  onPress={handleSettings}
  style={{ padding: 12 }}
/>
```

## Notes

- Perfect for header actions
- Hit slop ensures easy tapping
- Works well with Icon component
- Use consistent icon sizes across headers
- Combine multiple buttons with gap/spacing
- Consider disabled state for unavailable actions
- Press feedback is automatic
