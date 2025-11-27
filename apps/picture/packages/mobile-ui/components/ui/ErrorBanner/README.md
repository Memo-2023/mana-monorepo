# ErrorBanner

Floating banner component for displaying error, warning, info, or success messages with dismiss functionality.

## Features

- ✅ 4 variants: error, warning, info, success
- ✅ Auto-positioned at top of screen
- ✅ Dismissable
- ✅ Icon support
- ✅ Custom colors
- ✅ Shadow/elevation
- ✅ TypeScript support

## Installation

```bash
npx @memoro/ui add error-banner
```

Dependencies: `text`, `icon`

## Usage

### Error Banner

```tsx
import { ErrorBanner } from '@/components/ui/ErrorBanner/ErrorBanner';

const [error, setError] = useState<string | null>(null);

{
	error && <ErrorBanner message={error} onDismiss={() => setError(null)} />;
}
```

### Success Banner

```tsx
<ErrorBanner
	message="Changes saved successfully"
	variant="success"
	onDismiss={() => setSuccess(null)}
/>
```

### Warning Banner

```tsx
<ErrorBanner
	message="Your session will expire soon"
	variant="warning"
	onDismiss={() => setWarning(null)}
/>
```

### Info Banner

```tsx
<ErrorBanner message="New features available" variant="info" onDismiss={() => setInfo(null)} />
```

### Custom Colors

```tsx
<ErrorBanner
	message="Custom message"
	backgroundColor="#8B5CF6" // purple
	textColor="#FFFFFF"
	onDismiss={() => {}}
/>
```

### Custom Icon

```tsx
<ErrorBanner message="Network error" icon="cloud-offline" variant="error" onDismiss={() => {}} />
```

### Custom Position

```tsx
<ErrorBanner
	message="Bottom banner"
	top={undefined}
	style={{ bottom: 20, top: undefined }}
	onDismiss={() => {}}
/>
```

## Props

| Prop               | Type                                          | Default     | Description                           |
| ------------------ | --------------------------------------------- | ----------- | ------------------------------------- |
| `message`          | `string`                                      | -           | **Required** - Message text           |
| `onDismiss`        | `() => void`                                  | -           | **Required** - Dismiss callback       |
| `variant`          | `'error' \| 'warning' \| 'info' \| 'success'` | `'error'`   | Banner style variant                  |
| `top`              | `number`                                      | `60`        | Distance from top of screen           |
| `horizontalMargin` | `number`                                      | `16`        | Left/right margins                    |
| `backgroundColor`  | `string`                                      | -           | Custom background (overrides variant) |
| `textColor`        | `string`                                      | `'#FFFFFF'` | Text and icon color                   |
| `icon`             | `string`                                      | -           | Custom icon (overrides variant)       |
| `style`            | `ViewStyle`                                   | -           | Additional styles                     |

## Variants

| Variant   | Color           | Default Icon         |
| --------- | --------------- | -------------------- |
| `error`   | Red (#EF4444)   | `alert-circle`       |
| `warning` | Amber (#F59E0B) | `warning`            |
| `info`    | Blue (#3B82F6)  | `information-circle` |
| `success` | Green (#10B981) | `checkmark-circle`   |

## Examples

### Network Error

```tsx
<ErrorBanner
	message="No internet connection"
	icon="cloud-offline"
	variant="error"
	onDismiss={handleDismiss}
/>
```

### Form Validation Error

```tsx
<ErrorBanner
	message="Please fill in all required fields"
	variant="error"
	onDismiss={() => setError(null)}
/>
```

### Save Success

```tsx
<ErrorBanner
	message="Your changes have been saved"
	variant="success"
	onDismiss={() => setSuccess(null)}
/>
```

### Low Storage Warning

```tsx
<ErrorBanner
	message="Storage space running low"
	variant="warning"
	icon="warning"
	onDismiss={() => {}}
/>
```

### Auto-Dismiss Pattern

```tsx
const [error, setError] = useState<string | null>(null);

useEffect(() => {
	if (error) {
		const timer = setTimeout(() => setError(null), 5000);
		return () => clearTimeout(timer);
	}
}, [error]);

return <>{error && <ErrorBanner message={error} onDismiss={() => setError(null)} />}</>;
```

### Multiple Banners (Stacked)

```tsx
{
	error && (
		<ErrorBanner message={error} variant="error" top={60} onDismiss={() => setError(null)} />
	);
}
{
	warning && (
		<ErrorBanner
			message={warning}
			variant="warning"
			top={140} // Below error banner
			onDismiss={() => setWarning(null)}
		/>
	);
}
```

## Positioning

- **Default:** Absolute position at `top: 60px`
- **Z-Index:** 1000 (appears above most content)
- **Horizontal:** 16px margins on left/right
- **Width:** Automatically fills available width

To position at bottom:

```tsx
<ErrorBanner message="Bottom banner" style={{ top: undefined, bottom: 20 }} onDismiss={() => {}} />
```

## Animation Tip

For smooth enter/exit animations, use a library like `react-native-reanimated`:

```tsx
import Animated, { FadeInDown, FadeOutUp } from 'react-native-reanimated';

{
	error && (
		<Animated.View entering={FadeInDown} exiting={FadeOutUp}>
			<ErrorBanner message={error} onDismiss={() => setError(null)} />
		</Animated.View>
	);
}
```

## Common Patterns

### API Error Handler

```tsx
const handleApiError = (error: Error) => {
	setError(error.message || 'Something went wrong');
};

try {
	await api.call();
} catch (error) {
	handleApiError(error);
}
```

### Form Submission

```tsx
const handleSubmit = async () => {
	try {
		await submitForm();
		setSuccess('Form submitted successfully');
	} catch (error) {
		setError('Failed to submit form');
	}
};
```

## Dependencies

- `Text` component
- `Icon` component

## Notes

- Uses absolute positioning - ensure parent container has appropriate layout
- Shadow works on both iOS and Android (shadowColor for iOS, elevation for Android)
- Dismiss button has 8px hit slop for easier tapping
- Banner is full-width with horizontal margins
- Text auto-wraps if message is long
- Close icon provides visual feedback on press (opacity change)
