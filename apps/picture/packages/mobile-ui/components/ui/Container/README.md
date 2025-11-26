# Container

Safe area container component with flexible padding and background color options.

## Features

- ✅ Safe area handling (respects notch, status bar, etc.)
- ✅ Optional padding
- ✅ Custom background color
- ✅ NativeWind/Tailwind support
- ✅ TypeScript support

## Installation

```bash
npx @memoro/ui add container
```

## Usage

### Basic Container

```tsx
import { Container } from '@/components/ui/Container/Container';

<Container>
  <Text>Your content here</Text>
</Container>
```

### Custom Background Color

```tsx
<Container backgroundColor="#F3F4F6">
  <Text>Gray background</Text>
</Container>

<Container backgroundColor="#1F2937">
  <Text style={{ color: '#FFF' }}>Dark background</Text>
</Container>
```

### Without Padding

```tsx
<Container padding={false}>
  <Image source={{ uri: '...' }} style={{ width: '100%' }} />
</Container>
```

### Custom Padding

```tsx
<Container paddingValue={16}>
  <Text>Custom 16px padding</Text>
</Container>

<Container paddingValue={32}>
  <Text>Larger 32px padding</Text>
</Container>
```

### With Tailwind Classes

```tsx
<Container className="bg-gray-100">
  <Text>Using Tailwind classes</Text>
</Container>
```

### Full Example

```tsx
function MyScreen() {
  return (
    <Container backgroundColor="#FFFFFF" paddingValue={20}>
      <Text variant="h1">Screen Title</Text>
      <Text variant="body" style={{ marginTop: 16 }}>
        Screen content goes here
      </Text>
    </Container>
  );
}
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `children` | `ReactNode` | - | Content to render inside container |
| `backgroundColor` | `string` | `'#FFFFFF'` | Background color (hex, rgb, etc.) |
| `padding` | `boolean` | `true` | Apply default padding |
| `paddingValue` | `number` | `24` | Custom padding in pixels |
| `style` | `ViewStyle` | - | Additional styles |
| `className` | `string` | `''` | CSS class names (NativeWind) |

## Default Behavior

- **Padding:** 24px (Tailwind `p-6`)
- **Background:** White (`#FFFFFF`)
- **Safe Area:** Automatically handled for all edges

## With Theme Integration

```tsx
import { useTheme } from '~/contexts/ThemeContext';
import { Container } from '@/components/ui/Container';

function ThemedScreen() {
  const { theme } = useTheme();

  return (
    <Container backgroundColor={theme.colors.background}>
      <Text color={theme.colors.text.primary}>
        Themed content
      </Text>
    </Container>
  );
}
```

## Common Patterns

### Full-Width Images

```tsx
<Container padding={false}>
  <Image
    source={{ uri: 'https://...' }}
    style={{ width: '100%', height: 200 }}
  />
  <View className="p-6">
    <Text variant="h2">Image Title</Text>
  </View>
</Container>
```

### Form Layout

```tsx
<Container paddingValue={16}>
  <Text variant="h3">Login</Text>
  <Input label="Email" />
  <Input label="Password" secureTextEntry />
  <Button title="Sign In" fullWidth />
</Container>
```

### Scrollable Content

```tsx
<Container padding={false}>
  <ScrollView className="p-6">
    {/* Content */}
  </ScrollView>
</Container>
```

## Dependencies

- `react-native-safe-area-context`

## Notes

- Uses `SafeAreaView` from `react-native-safe-area-context`
- Automatically applies `flex: 1` to fill screen
- Padding defaults to Tailwind's `p-6` (24px)
- Safe area is respected on all edges (top, bottom, left, right)
- Works with both light and dark backgrounds
