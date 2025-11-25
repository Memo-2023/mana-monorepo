# ToggleGroup

Segmented control / toggle group component for choosing between multiple mutually exclusive options.

## Features

- ✅ 2+ options with equal width
- ✅ Optional icons
- ✅ 3 sizes (sm, md, lg)
- ✅ Fully customizable colors
- ✅ Disabled state
- ✅ TypeScript generic support
- ✅ Press feedback

## Installation

```bash
npx @memoro/ui add toggle-group
```

**Dependencies:** text, icon

## Usage

### Basic ToggleGroup

```tsx
import { ToggleGroup, ToggleOption } from '@/components/ui/ToggleGroup';

const options: ToggleOption[] = [
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
];

<ToggleGroup
  options={options}
  value={theme}
  onChange={setTheme}
/>
```

### With Icons

```tsx
const options: ToggleOption[] = [
  { value: 'list', label: 'List', icon: 'list' },
  { value: 'grid', label: 'Grid', icon: 'grid' },
];

<ToggleGroup
  options={options}
  value={viewMode}
  onChange={setViewMode}
/>
```

### Three Options

```tsx
const options: ToggleOption[] = [
  { value: 'all', label: 'All', icon: 'apps' },
  { value: 'active', label: 'Active', icon: 'checkmark-circle' },
  { value: 'archived', label: 'Archived', icon: 'archive' },
];

<ToggleGroup
  options={options}
  value={filter}
  onChange={setFilter}
/>
```

### Different Sizes

```tsx
<ToggleGroup
  options={options}
  value={value}
  onChange={setValue}
  size="sm"
/>

<ToggleGroup
  options={options}
  value={value}
  onChange={setValue}
  size="md"
/>

<ToggleGroup
  options={options}
  value={value}
  onChange={setValue}
  size="lg"
/>
```

### Custom Colors

```tsx
<ToggleGroup
  options={options}
  value={value}
  onChange={setValue}
  backgroundColor="#FEF3C7"
  borderColor="#FCD34D"
  selectedBackgroundColor="#F59E0B"
  selectedBorderColor="#F59E0B"
  textColor="#92400E"
  selectedTextColor="#FFFFFF"
/>
```

### TypeScript Generic

```tsx
type Status = 'pending' | 'approved' | 'rejected';

const statusOptions: ToggleOption<Status>[] = [
  { value: 'pending', label: 'Pending' },
  { value: 'approved', label: 'Approved' },
  { value: 'rejected', label: 'Rejected' },
];

<ToggleGroup<Status>
  options={statusOptions}
  value={status}
  onChange={setStatus}
/>
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `options` | `ToggleOption<T>[]` | - | **Required** - Options to display |
| `value` | `T` | - | **Required** - Currently selected value |
| `onChange` | `(value: T) => void` | - | **Required** - Callback when value changes |
| `disabled` | `boolean` | `false` | Disable all options |
| `backgroundColor` | `string` | `'#F3F4F6'` | Background color for unselected options |
| `borderColor` | `string` | `'#E5E7EB'` | Border color for unselected options |
| `selectedBackgroundColor` | `string` | `'#3B82F6'` | Background color for selected option |
| `selectedBorderColor` | `string` | `'#3B82F6'` | Border color for selected option |
| `textColor` | `string` | `'#111827'` | Text color for unselected options |
| `selectedTextColor` | `string` | `'#FFFFFF'` | Text color for selected option |
| `iconColor` | `string` | `'#6B7280'` | Icon color for unselected options |
| `selectedIconColor` | `string` | `'#FFFFFF'` | Icon color for selected option |
| `size` | `'sm' \| 'md' \| 'lg'` | `'md'` | Size of the toggle |
| `style` | `ViewStyle` | - | Additional styles |

## ToggleOption Type

```typescript
type ToggleOption<T = string> = {
  value: T;
  label: string;
  icon?: string;
};
```

## Sizes

| Size | Padding | Icon Size | Gap |
|------|---------|-----------|-----|
| `sm` | 8px/12px | 16px | 6px |
| `md` | 12px/16px | 20px | 8px |
| `lg` | 16px/20px | 24px | 10px |

## Default Styling

- **Background:** Light gray (#F3F4F6)
- **Border:** Gray (#E5E7EB)
- **Selected Background:** Blue (#3B82F6)
- **Selected Border:** Blue (#3B82F6)
- **Text Color:** Dark gray (#111827)
- **Selected Text:** White (#FFFFFF)
- **Icon Color:** Gray (#6B7280)
- **Selected Icon:** White (#FFFFFF)
- **Size:** Medium
- **Border Radius:** 12px

## Examples

### Theme Switcher

```tsx
const themeOptions: ToggleOption[] = [
  { value: 'system', label: 'System', icon: 'phone-portrait-outline' },
  { value: 'light', label: 'Light', icon: 'sunny-outline' },
  { value: 'dark', label: 'Dark', icon: 'moon-outline' },
];

<ToggleGroup
  options={themeOptions}
  value={theme}
  onChange={setTheme}
/>
```

### View Mode Toggle

```tsx
const viewOptions: ToggleOption[] = [
  { value: 'single', label: 'Single', icon: 'square' },
  { value: 'grid3', label: 'Grid', icon: 'grid' },
  { value: 'grid5', label: 'Tiles', icon: 'apps' },
];

<ToggleGroup
  options={viewOptions}
  value={viewMode}
  onChange={setViewMode}
  size="sm"
/>
```

### Sort Order

```tsx
const sortOptions: ToggleOption[] = [
  { value: 'asc', label: 'Ascending', icon: 'arrow-up' },
  { value: 'desc', label: 'Descending', icon: 'arrow-down' },
];

<ToggleGroup
  options={sortOptions}
  value={sortOrder}
  onChange={setSortOrder}
/>
```

### Filter Toggle

```tsx
const filterOptions: ToggleOption[] = [
  { value: 'all', label: 'All' },
  { value: 'favorites', label: 'Favorites', icon: 'heart' },
];

<ToggleGroup
  options={filterOptions}
  value={filter}
  onChange={setFilter}
/>
```

### Priority Selector

```tsx
type Priority = 'low' | 'medium' | 'high';

const priorityOptions: ToggleOption<Priority>[] = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
];

<ToggleGroup<Priority>
  options={priorityOptions}
  value={priority}
  onChange={setPriority}
  selectedBackgroundColor="#EF4444"
  selectedBorderColor="#EF4444"
/>
```

### Status Toggle

```tsx
const statusOptions: ToggleOption[] = [
  { value: 'online', label: 'Online', icon: 'checkmark-circle' },
  { value: 'busy', label: 'Busy', icon: 'remove-circle' },
  { value: 'offline', label: 'Offline', icon: 'close-circle' },
];

<ToggleGroup
  options={statusOptions}
  value={status}
  onChange={setStatus}
  size="lg"
/>
```

### Gender Selector

```tsx
const genderOptions: ToggleOption[] = [
  { value: 'male', label: 'Male', icon: 'male' },
  { value: 'female', label: 'Female', icon: 'female' },
  { value: 'other', label: 'Other', icon: 'help-circle' },
];

<ToggleGroup
  options={genderOptions}
  value={gender}
  onChange={setGender}
/>
```

### Language Selector

```tsx
const langOptions: ToggleOption[] = [
  { value: 'en', label: 'EN' },
  { value: 'de', label: 'DE' },
  { value: 'fr', label: 'FR' },
  { value: 'es', label: 'ES' },
];

<ToggleGroup
  options={langOptions}
  value={language}
  onChange={setLanguage}
  size="sm"
/>
```

## Common Patterns

### With Label

```tsx
<View>
  <Text variant="body" weight="semibold" style={{ marginBottom: 8 }}>
    View Mode
  </Text>
  <ToggleGroup
    options={viewOptions}
    value={viewMode}
    onChange={setViewMode}
  />
</View>
```

### Horizontal Layout

```tsx
<View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
  <Text variant="body">Theme:</Text>
  <ToggleGroup
    options={themeOptions}
    value={theme}
    onChange={setTheme}
    style={{ flex: 1 }}
  />
</View>
```

### Disabled State

```tsx
<ToggleGroup
  options={options}
  value={value}
  onChange={setValue}
  disabled={isLoading}
/>
```

## Notes

- All options have equal width (flex: 1)
- Options are arranged horizontally
- Selected option is highlighted
- Press feedback with opacity change
- Icons are optional and shown before label
- Use for 2-5 options (more = harder to tap)
- For many options, use Select component instead
- TypeScript generics for type-safe values
- Works great for binary or tri-state toggles
