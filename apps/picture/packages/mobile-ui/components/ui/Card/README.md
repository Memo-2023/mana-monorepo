# Card

Container card component with shadow and optional press interaction.

## Features

- ✅ Optional shadow and border
- ✅ Pressable variant
- ✅ Customizable padding and radius
- ✅ Custom colors
- ✅ Clean, minimal design

## Installation

```bash
npx @memoro/ui add card
```

## Usage

### Basic Card

```tsx
import { Card } from '@/components/ui/Card';

<Card>
  <Text variant="h3">Card Title</Text>
  <Text>Card content goes here</Text>
</Card>
```

### Pressable Card

```tsx
<Card onPress={() => console.log('Pressed')}>
  <Text variant="h4">Tap me</Text>
  <Text variant="body">This card is interactive</Text>
</Card>
```

### Without Shadow

```tsx
<Card shadow={false}>
  <Text>Flat card</Text>
</Card>
```

### With Border

```tsx
<Card border borderColor="#E5E7EB">
  <Text>Bordered card</Text>
</Card>
```

### Custom Styling

```tsx
<Card
  backgroundColor="#F3F4F6"
  borderRadius={16}
  padding={24}
  shadow={false}
>
  <Text>Custom styled card</Text>
</Card>
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `children` | `ReactNode` | - | **Required** - Card content |
| `onPress` | `() => void` | - | Makes card pressable |
| `backgroundColor` | `string` | `'#FFFFFF'` | Background color |
| `borderRadius` | `number` | `12` | Corner radius |
| `padding` | `number` | `16` | Inner padding |
| `shadow` | `boolean` | `true` | Show shadow |
| `border` | `boolean` | `false` | Show border |
| `borderColor` | `string` | `'#E5E7EB'` | Border color |
| `style` | `ViewStyle` | - | Additional styles |

## Default Styling

- **Background:** White (#FFFFFF)
- **Border Radius:** 12px
- **Padding:** 16px
- **Shadow:** Yes (subtle)
- **Border:** No

## Examples

### Profile Card

```tsx
<Card shadow>
  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
    <Image
      source={{ uri: user.avatar }}
      style={{ width: 50, height: 50, borderRadius: 25 }}
    />
    <View style={{ marginLeft: 12, flex: 1 }}>
      <Text variant="h4">{user.name}</Text>
      <Text variant="body" color="#6B7280">{user.email}</Text>
    </View>
  </View>
</Card>
```

### Article Card

```tsx
<Card onPress={() => navigate('article', { id: article.id })}>
  <Image
    source={{ uri: article.image }}
    style={{ width: '100%', height: 150, borderRadius: 8, marginBottom: 12 }}
  />
  <Text variant="h3">{article.title}</Text>
  <Text variant="body" color="#6B7280" style={{ marginTop: 8 }}>
    {article.excerpt}
  </Text>
  <View style={{ flexDirection: 'row', marginTop: 12, gap: 8 }}>
    <Tag label={article.category} size="sm" />
    <Text variant="caption" color="#9CA3AF">{article.date}</Text>
  </View>
</Card>
```

### Stats Card

```tsx
<Card border shadow={false}>
  <Text variant="caption" color="#6B7280">Total Users</Text>
  <Text variant="h2" style={{ marginTop: 4 }}>24,583</Text>
  <Text variant="body" color="#10B981" style={{ marginTop: 8 }}>
    +12.5% from last month
  </Text>
</Card>
```

### Settings Card

```tsx
<Card onPress={() => navigate('settings')}>
  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
      <Icon name="settings" size={24} color="#6B7280" />
      <Text variant="body" style={{ marginLeft: 12 }}>Settings</Text>
    </View>
    <Icon name="chevron-forward" size={20} color="#9CA3AF" />
  </View>
</Card>
```

### Product Card

```tsx
<Card onPress={() => viewProduct(product.id)}>
  <Image
    source={{ uri: product.image }}
    style={{ width: '100%', height: 200, borderRadius: 8 }}
  />
  <Text variant="h4" style={{ marginTop: 12 }}>{product.name}</Text>
  <Text variant="h3" color="#3B82F6" style={{ marginTop: 8 }}>
    ${product.price}
  </Text>
  <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 8 }}>
    <Icon name="star" size={16} color="#F59E0B" />
    <Text variant="body" color="#6B7280" style={{ marginLeft: 4 }}>
      {product.rating} ({product.reviews})
    </Text>
  </View>
</Card>
```

### Card List

```tsx
<View style={{ gap: 12 }}>
  {items.map(item => (
    <Card key={item.id} onPress={() => selectItem(item)}>
      <Text variant="h4">{item.title}</Text>
      <Text variant="body" color="#6B7280" style={{ marginTop: 4 }}>
        {item.description}
      </Text>
    </Card>
  ))}
</View>
```

## Shadow Details

Default shadow configuration:
```tsx
{
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.1,
  shadowRadius: 8,
  elevation: 3, // Android
}
```

## Press Interaction

When `onPress` is provided:
- Card becomes pressable
- Opacity reduces to 0.8 when pressed
- Visual feedback for user interaction

## Common Patterns

### Card with Header and Footer

```tsx
<Card>
  {/* Header */}
  <View style={{ borderBottomWidth: 1, borderBottomColor: '#E5E7EB', paddingBottom: 12 }}>
    <Text variant="h3">Card Title</Text>
  </View>

  {/* Body */}
  <View style={{ paddingVertical: 12 }}>
    <Text variant="body">Card content</Text>
  </View>

  {/* Footer */}
  <View style={{ borderTopWidth: 1, borderTopColor: '#E5E7EB', paddingTop: 12, flexDirection: 'row', justifyContent: 'space-between' }}>
    <Button title="Cancel" variant="ghost" />
    <Button title="Confirm" />
  </View>
</Card>
```

## Notes

- Shadow works on both iOS and Android
- Press opacity feedback is smooth and instant
- Use `shadow={false}` for flat design
- Combine with other components (Text, Image, Icon) for rich cards
- Perfect for lists, grids, and detail views
