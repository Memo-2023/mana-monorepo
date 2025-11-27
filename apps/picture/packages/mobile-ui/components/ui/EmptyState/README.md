# EmptyState

Component for displaying empty states when there's no content to show.

## Features

- ✅ Icon or emoji support
- ✅ Title and description
- ✅ Custom colors
- ✅ Optional action button/content
- ✅ Customizable padding
- ✅ TypeScript support

## Installation

```bash
npx @memoro/ui add empty-state
```

Dependencies: `text`, `icon`

## Usage

### With Icon

```tsx
import { EmptyState } from '@/components/ui/EmptyState/EmptyState';

<EmptyState
	icon="images"
	title="No images yet"
	description="Start creating to see your images here"
/>;
```

### With Emoji

```tsx
<EmptyState emoji="📸" title="No photos" description="Take your first photo to get started" />
```

### With Action Button

```tsx
<EmptyState icon="add-circle" title="Get started" description="Create your first item to begin">
	<Button title="Create Item" variant="primary" onPress={() => {}} />
</EmptyState>
```

### Custom Colors

```tsx
<EmptyState
	icon="heart-outline"
	iconColor="#EF4444"
	title="No favorites"
	titleColor="#1F2937"
	description="Mark items as favorite to see them here"
	descriptionColor="#9CA3AF"
/>
```

### Custom Icon Size

```tsx
<EmptyState
	icon="folder-outline"
	iconSize={80}
	title="Empty folder"
	description="This folder doesn't contain any files"
/>
```

## Props

| Prop               | Type        | Default     | Description                      |
| ------------------ | ----------- | ----------- | -------------------------------- |
| `icon`             | `string`    | -           | Icon name (Ionicons/SF Symbol)   |
| `emoji`            | `string`    | -           | Emoji to display instead of icon |
| `iconSize`         | `number`    | `60`        | Icon or emoji size               |
| `iconColor`        | `string`    | `'#9CA3AF'` | Icon color (not for emoji)       |
| `title`            | `string`    | -           | **Required** - Title text        |
| `description`      | `string`    | -           | **Required** - Description text  |
| `titleColor`       | `string`    | `'#1F2937'` | Title text color                 |
| `descriptionColor` | `string`    | `'#6B7280'` | Description text color           |
| `padding`          | `number`    | `32`        | Container padding                |
| `style`            | `ViewStyle` | -           | Additional container styles      |
| `children`         | `ReactNode` | -           | Optional content (e.g., button)  |

## Examples

### No Search Results

```tsx
<EmptyState
	icon="search"
	title="No results found"
	description="Try adjusting your search or filters"
/>
```

### No Network Connection

```tsx
<EmptyState
	emoji="📡"
	title="No connection"
	description="Check your internet connection and try again"
>
	<Button title="Retry" onPress={handleRetry} />
</EmptyState>
```

### First Time User

```tsx
<EmptyState
	emoji="👋"
	title="Welcome!"
	description="Let's get started by creating your first project"
>
	<Button title="Create Project" variant="primary" icon="add" onPress={handleCreate} />
</EmptyState>
```

### Error State

```tsx
<EmptyState
	icon="warning"
	iconColor="#EF4444"
	title="Something went wrong"
	description="We couldn't load your content. Please try again."
>
	<Button title="Try Again" variant="outline" onPress={handleRetry} />
</EmptyState>
```

### Gallery Empty

```tsx
<EmptyState
	icon="images"
	iconSize={72}
	title="No images"
	description="Upload your first image to get started"
>
	<Button title="Upload Image" variant="primary" icon="cloud-upload" onPress={handleUpload} />
</EmptyState>
```

## Common Use Cases

| Use Case     | Icon/Emoji             | Title Example          |
| ------------ | ---------------------- | ---------------------- |
| No items     | `emoji="📦"`           | "No items yet"         |
| No images    | `icon="images"`        | "No images"            |
| No results   | `icon="search"`        | "No results found"     |
| Empty inbox  | `emoji="📬"`           | "Inbox empty"          |
| No favorites | `icon="heart-outline"` | "No favorites"         |
| Error state  | `icon="warning"`       | "Something went wrong" |
| Offline      | `emoji="📡"`           | "You're offline"       |
| Welcome      | `emoji="👋"`           | "Welcome!"             |

## Layout

The component:

- Centers content vertically and horizontally
- Uses `flex: 1` to fill available space
- Stacks icon/emoji, title, description, and children vertically
- Adds 16px margin below icon/emoji
- Adds 8px margin below title
- Adds 24px margin above children (if present)

## With Theme

```tsx
import { useTheme } from '~/contexts/ThemeContext';
import { EmptyState } from '@/components/ui/EmptyState';

function ThemedEmptyState() {
	const { theme } = useTheme();

	return (
		<EmptyState
			icon="images"
			iconColor={theme.colors.text.tertiary}
			title="No images"
			titleColor={theme.colors.text.primary}
			description="Start creating"
			descriptionColor={theme.colors.text.secondary}
		/>
	);
}
```

## Dependencies

- `Text` component
- `Icon` component

## Notes

- Use either `icon` OR `emoji`, not both
- Icon uses the Icon component (SF Symbols on iOS, Ionicons elsewhere)
- Emoji is rendered as text with large font size
- Children are typically action buttons
- Component fills available vertical space with `flex: 1`
