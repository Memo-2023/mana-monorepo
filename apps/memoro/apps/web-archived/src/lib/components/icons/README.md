# Icon System

Centralized icon management using **Phosphor Icons (Bold weight)** from `@phosphor-icons/core`.

## Usage

Import and use the `Icon` component throughout the application:

```svelte
<script>
  import Icon from '$lib/components/Icon.svelte';
</script>

<!-- Basic usage -->
<Icon name="user" size={24} />

<!-- With custom size -->
<Icon name="heart" size={32} />

<!-- With custom classes -->
<Icon name="star" size={20} class="text-primary hover:text-primary-dark" />
```

## Available Icons

See `iconPaths.ts` for the complete list of available icons. Some commonly used icons:

### Auth & User
- `user`, `user-plus`, `users`, `sign-in`, `sign-out`

### Navigation
- `arrow-left`, `arrow-right`, `arrow-up`, `arrow-down`
- `caret-down`, `caret-up`, `caret-left`, `caret-right`

### Actions
- `plus`, `minus`, `x`, `check`
- `trash`, `copy`, `share`
- `download`, `upload`

### Media
- `play`, `pause`, `microphone`

### Edit
- `pencil`, `pen`, `note-pencil`

### Files & Folders
- `folder`, `folder-open`, `file`

### UI Elements
- `dots-three`, `dots-three-vertical`, `list`
- `magnifying-glass`, `eye`, `eye-slash`

### Misc
- `key`, `tag`, `link`, `lock`
- `star`, `heart`, `bell`
- `calendar`, `clock`, `image`

## Adding New Icons

1. Find the icon you need at [phosphoricons.com](https://phosphoricons.com/)
2. Locate the bold version in `node_modules/@phosphor-icons/core/assets/bold/`
3. Copy the SVG `<path>` content
4. Add it to `iconPaths.ts`:

```typescript
export const iconPaths = {
  // ... existing icons
  'new-icon': '<path d="..." />',
}
```

5. Use it:

```svelte
<Icon name="new-icon" size={24} />
```

## Icon Weight

All icons use the **Bold** weight for consistency across the application. This provides:
- Better visibility
- Consistent visual hierarchy
- Improved readability at smaller sizes

## TypeScript Support

The Icon component is fully typed. TypeScript will autocomplete icon names and show errors if you use an icon that doesn't exist.

```svelte
<!-- ✅ Valid - TypeScript knows this icon exists -->
<Icon name="user" />

<!-- ❌ Error - TypeScript will show an error -->
<Icon name="invalid-icon" />
```

## Best Practices

1. **Use semantic names**: Icons should have clear, descriptive names
2. **Consistent sizing**: Stick to common sizes (16, 20, 24, 32, 40)
3. **Color inheritance**: Icons use `currentColor` - control color via text color classes
4. **Accessibility**: Icons are marked with `aria-hidden="true"` - provide text alternatives when needed

## Examples

### Button with Icon
```svelte
<button class="flex items-center gap-2">
  <Icon name="plus" size={20} />
  Add Item
</button>
```

### Icon Button
```svelte
<button class="p-2 hover:bg-gray-100 rounded">
  <Icon name="trash" size={20} class="text-red-500" />
</button>
```

### Loading State
```svelte
<button disabled={loading}>
  {#if loading}
    <Icon name="arrow-clockwise" size={20} class="animate-spin" />
  {:else}
    <Icon name="upload" size={20} />
  {/if}
  Upload
</button>
```
