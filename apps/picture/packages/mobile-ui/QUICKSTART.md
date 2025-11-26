# Quick Start - @memoro/ui

## Available Components

✅ **6 components ready to use:**

1. **Button** - Pressable button with variants, sizes, icons
2. **Text** - Typography with 11 variants
3. **Icon** - Cross-platform icons
4. **Container** - Safe area container
5. **EmptyState** - Empty state display
6. **ErrorBanner** - Notification banner

## Usage

### Import Components

```tsx
import { Button } from '~/../../packages/memoro-ui/components/ui/Button';
import { Text } from '~/../../packages/memoro-ui/components/ui/Text';
import { Icon } from '~/../../packages/memoro-ui/components/ui/Icon';
import { Container } from '~/../../packages/memoro-ui/components/ui/Container';
import { EmptyState } from '~/../../packages/memoro-ui/components/ui/EmptyState';
import { ErrorBanner } from '~/../../packages/memoro-ui/components/ui/ErrorBanner';
```

### Example Screen

```tsx
function MyScreen() {
  const [error, setError] = useState<string | null>(null);

  return (
    <Container backgroundColor="#FFFFFF">
      {error && (
        <ErrorBanner
          message={error}
          onDismiss={() => setError(null)}
        />
      )}

      <Text variant="h1" weight="bold" color="#000">
        Welcome to memoro
      </Text>

      <Text variant="body" color="#6B7280" style={{ marginTop: 8 }}>
        Start building amazing apps
      </Text>

      <Button
        title="Get Started"
        variant="primary"
        icon="arrow-forward"
        onPress={() => console.log('Clicked!')}
        style={{ marginTop: 24 }}
      />

      <EmptyState
        emoji="📦"
        title="No items yet"
        description="Create your first item to get started"
        style={{ marginTop: 40 }}
      >
        <Button
          title="Create Item"
          variant="outline"
          icon="add"
          onPress={() => {}}
        />
      </EmptyState>
    </Container>
  );
}
```

### With Theme Integration

```tsx
import { useTheme } from '~/contexts/ThemeContext';

function ThemedComponent() {
  const { theme } = useTheme();

  return (
    <Container backgroundColor={theme.colors.background}>
      <Text color={theme.colors.text.primary}>
        Themed text
      </Text>

      <Button
        title="Themed Button"
        colors={{
          primary: theme.colors.primary.default,
          primaryText: theme.colors.primary.contrast,
        }}
      />
    </Container>
  );
}
```

## Component Examples

### Button Variants

```tsx
<Button title="Primary" variant="primary" onPress={() => {}} />
<Button title="Secondary" variant="secondary" onPress={() => {}} />
<Button title="Danger" variant="danger" onPress={() => {}} />
<Button title="Ghost" variant="ghost" onPress={() => {}} />
<Button title="Outline" variant="outline" onPress={() => {}} />
```

### Text Variants

```tsx
<Text variant="title">Big Title</Text>
<Text variant="h1">Heading 1</Text>
<Text variant="h2">Heading 2</Text>
<Text variant="body">Body text</Text>
<Text variant="caption">Small caption</Text>
```

### Icons

```tsx
<Icon name="heart" size={24} color="#EF4444" />
<Icon name="star" size={32} color="#F59E0B" />
<Icon name="checkmark" size={20} color="#10B981" />
```

### Empty States

```tsx
<EmptyState
  icon="images"
  title="No images"
  description="Upload your first image"
/>

<EmptyState
  emoji="📸"
  title="No photos"
  description="Take your first photo"
>
  <Button title="Take Photo" icon="camera" />
</EmptyState>
```

### Error Banners

```tsx
<ErrorBanner
  message="Something went wrong"
  variant="error"
  onDismiss={() => setError(null)}
/>

<ErrorBanner
  message="Success!"
  variant="success"
  onDismiss={() => {}}
/>
```

## Documentation

Each component has full documentation:

- [Button](./components/ui/Button/README.md) - All variants, sizes, props
- [Text](./components/ui/Text/README.md) - Typography scale, weights
- [Icon](./components/ui/Icon/README.md) - Available icons, platform differences
- [Container](./components/ui/Container/README.md) - Safe area, padding options
- [EmptyState](./components/ui/EmptyState/README.md) - Examples, use cases
- [ErrorBanner](./components/ui/ErrorBanner/README.md) - All variants, positioning

## Tips

1. **Import Path:** Use `~/../../packages/memoro-ui/components/ui/ComponentName`
2. **With Theme:** Pass theme colors via `colors` or `color` props
3. **Types:** All components export their prop types
4. **Dependencies:** Button, EmptyState, and ErrorBanner need Icon and Text

## Next: CLI Tool

Once built, you'll use:

```bash
npx @memoro/ui add button
npx @memoro/ui list
```

For now, import directly from packages folder.
