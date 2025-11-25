# Header

Navigation header component with title, back button, and custom actions.

## Features

- ✅ Optional back button with custom handler
- ✅ Title display
- ✅ Custom left/right content slots
- ✅ Safe area support
- ✅ Customizable colors and border
- ✅ Press feedback on back button

## Installation

```bash
npx @memoro/ui add header
```

**Dependencies:** text, icon

## Usage

### Basic Header

```tsx
import { Header } from '@/components/navigation/Header';

<Header title="My Screen" />
```

### With Back Button

```tsx
import { useRouter } from 'expo-router';

function MyScreen() {
  const router = useRouter();

  return (
    <Header
      title="Details"
      showBackButton
      onBackPress={() => router.back()}
    />
  );
}
```

### With Custom Right Content

```tsx
<Header
  title="Settings"
  rightContent={
    <>
      <HeaderButton icon="search" onPress={() => {}} />
      <HeaderButton icon="ellipsis-horizontal" onPress={() => {}} />
    </>
  }
/>
```

### With Custom Left Content

```tsx
<Header
  title="Messages"
  leftContent={
    <Image
      source={{ uri: user.avatar }}
      style={{ width: 32, height: 32, borderRadius: 16 }}
    />
  }
  rightContent={
    <HeaderButton icon="add" onPress={() => {}} />
  }
/>
```

### Without Border

```tsx
<Header
  title="My Screen"
  showBorder={false}
/>
```

### Without Safe Area

```tsx
<Header
  title="My Screen"
  useSafeArea={false}
/>
```

### Custom Colors

```tsx
<Header
  title="Dark Header"
  backgroundColor="#1F2937"
  borderColor="#374151"
  titleColor="#FFFFFF"
  backIconColor="#60A5FA"
/>
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `title` | `string` | - | Header title |
| `showBackButton` | `boolean` | `false` | Show back button on the left |
| `onBackPress` | `() => void` | - | Back button press handler (required if showBackButton) |
| `leftContent` | `ReactNode` | - | Custom left content (overrides back button) |
| `rightContent` | `ReactNode` | - | Custom right content |
| `backgroundColor` | `string` | `'#FFFFFF'` | Background color |
| `borderColor` | `string` | `'#E5E7EB'` | Border color |
| `titleColor` | `string` | `'#111827'` | Title text color |
| `backIconColor` | `string` | `'#3B82F6'` | Back button icon color |
| `showBorder` | `boolean` | `true` | Show border at bottom |
| `useSafeArea` | `boolean` | `true` | Use safe area insets for top padding |
| `style` | `ViewStyle` | - | Additional styles |

## Default Styling

- **Background:** White (#FFFFFF)
- **Border:** Light gray (#E5E7EB)
- **Title:** Dark gray (#111827), H4, Semibold
- **Back Icon:** Blue (#3B82F6)
- **Padding:** 16px horizontal, 12px vertical
- **Min Height:** 56px

## Examples

### Profile Header

```tsx
<Header
  title="Profile"
  leftContent={
    <Pressable onPress={() => router.back()}>
      <Icon name="close" size={24} color="#111827" />
    </Pressable>
  }
  rightContent={
    <Pressable onPress={handleSave}>
      <Text variant="body" color="#3B82F6" weight="semibold">Save</Text>
    </Pressable>
  }
/>
```

### Search Header

```tsx
<Header
  leftContent={
    <View style={{ flex: 1, marginRight: 12 }}>
      <TextInput
        placeholder="Search..."
        style={{
          backgroundColor: '#F3F4F6',
          paddingHorizontal: 12,
          paddingVertical: 8,
          borderRadius: 8,
        }}
      />
    </View>
  }
  rightContent={
    <Pressable onPress={handleCancel}>
      <Text variant="body" color="#6B7280">Cancel</Text>
    </Pressable>
  }
/>
```

### Chat Header

```tsx
<Header
  showBackButton
  onBackPress={() => router.back()}
  leftContent={
    <View style={{ flexDirection: 'row', alignItems: 'center', marginLeft: 12 }}>
      <Image
        source={{ uri: chat.avatar }}
        style={{ width: 32, height: 32, borderRadius: 16, marginRight: 8 }}
      />
      <Text variant="h4">{chat.name}</Text>
    </View>
  }
  rightContent={
    <>
      <HeaderButton icon="videocam" onPress={handleVideoCall} />
      <HeaderButton icon="call" onPress={handleCall} />
    </>
  }
/>
```

### Settings Header

```tsx
<Header
  showBackButton
  onBackPress={() => router.back()}
  title="Settings"
  rightContent={
    <HeaderButton
      icon="checkmark"
      onPress={handleSave}
      iconColor="#10B981"
    />
  }
/>
```

### Minimal Header

```tsx
<Header
  title="Welcome"
  showBorder={false}
  backgroundColor="transparent"
/>
```

## Integration with Navigation

### Expo Router

```tsx
import { Stack } from 'expo-router';
import { Header } from '@/components/navigation/Header';

export default function Layout() {
  return (
    <Stack
      screenOptions={{
        header: ({ navigation, route, options }) => (
          <Header
            title={options.title || route.name}
            showBackButton={navigation.canGoBack()}
            onBackPress={() => navigation.goBack()}
          />
        ),
      }}
    />
  );
}
```

### React Navigation

```tsx
import { Header } from '@/components/navigation/Header';

<Stack.Navigator
  screenOptions={{
    header: ({ navigation, route, options }) => (
      <Header
        title={options.title}
        showBackButton={navigation.canGoBack()}
        onBackPress={() => navigation.goBack()}
      />
    ),
  }}
>
  <Stack.Screen name="Home" component={HomeScreen} />
</Stack.Navigator>
```

## Common Patterns

### Header with Multiple Actions

```tsx
<Header
  title="Photos"
  rightContent={
    <View style={{ flexDirection: 'row', gap: 8 }}>
      <HeaderButton icon="search" onPress={handleSearch} />
      <HeaderButton icon="share" onPress={handleShare} />
      <HeaderButton icon="ellipsis-horizontal" onPress={handleMore} />
    </View>
  }
/>
```

### Header with Badge

```tsx
<Header
  title="Notifications"
  rightContent={
    <View>
      <HeaderButton icon="settings" onPress={handleSettings} />
      {unreadCount > 0 && (
        <Badge
          count={unreadCount}
          style={{ position: 'absolute', top: -4, right: -4 }}
        />
      )}
    </View>
  }
/>
```

### Transparent Header (Overlay)

```tsx
<View style={{ flex: 1 }}>
  <Image source={headerImage} style={{ position: 'absolute', width: '100%', height: 200 }} />
  <Header
    title="Detail"
    showBackButton
    onBackPress={() => router.back()}
    backgroundColor="transparent"
    titleColor="#FFFFFF"
    backIconColor="#FFFFFF"
    showBorder={false}
  />
</View>
```

## Notes

- Requires `react-native-safe-area-context` for safe area support
- Back button is only shown if both `showBackButton={true}` and `onBackPress` are provided
- `leftContent` overrides back button if provided
- Minimum height is 56px to match standard header heights
- Works on iOS, Android, and Web
- Combine with HeaderButton component for consistent action buttons
