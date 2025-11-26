# Glass/Blur Header Implementation Guide - Expo Router

## Overview
Glass headers (blur effect headers) provide a modern iOS-style frosted glass appearance that blurs content behind the header when scrolling. This guide covers implementation in Expo Router.

## Requirements
- Expo Router (latest version)
- iOS device/simulator (blur effect is iOS-only)
- `@react-navigation/elements` package (for `useHeaderHeight` hook)

## Basic Implementation

### 1. Enable Blur Effect in Layout

```typescript
// app/(tabs)/_layout.tsx or app/_layout.tsx
import { Tabs } from 'expo-router';
import { Platform } from 'react-native';

export default function Layout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: true,
        headerTransparent: Platform.OS === 'ios',
        headerBlurEffect: Platform.OS === 'ios' ? 'regular' : undefined,
      }}>
      <Tabs.Screen name="index" options={{ title: 'Home' }} />
    </Tabs>
  );
}
```

### 2. Handle Content Padding

Since the header is transparent, content will render behind it. Use `useHeaderHeight` to add proper padding:

```typescript
// app/(tabs)/index.tsx
import { useHeaderHeight } from '@react-navigation/elements';
import { Platform, FlatList } from 'react-native';

export default function Screen() {
  const headerHeight = useHeaderHeight();

  return (
    <FlatList
      data={items}
      contentContainerStyle={{
        paddingTop: Platform.OS === 'ios' ? headerHeight : 0
      }}
      renderItem={({ item }) => <Item data={item} />}
    />
  );
}
```

## Blur Effect Options (iOS Only)

Available `headerBlurEffect` values:
- `'regular'` - Standard blur (recommended)
- `'prominent'` - More pronounced blur
- `'systemMaterial'` - Adapts to system theme
- `'systemThinMaterial'` - Thinner material
- `'systemUltraThinMaterial'` - Ultra-thin material
- `'systemThickMaterial'` - Thicker material
- `'systemChromeMaterial'` - Chrome-style material
- `'systemThinMaterialLight'` - Light thin material
- `'systemThinMaterialDark'` - Dark thin material

## Platform-Specific Considerations

### iOS
- Blur effect works natively
- Requires both `headerTransparent: true` and `headerBlurEffect`
- Header automatically adapts to light/dark mode with system materials

### Android
- Native blur not supported
- Header remains solid
- Use `Platform.OS === 'ios'` checks to prevent errors

### Web
- Blur not supported
- Falls back to solid header

## Best Practices

### ✅ Do
- Always use Platform checks for iOS-specific features
- Add proper content padding with `useHeaderHeight`
- Test on both iOS and Android
- Use `'regular'` or `'systemMaterial'` for best compatibility
- Consider dark mode with appropriate blur materials

### ❌ Don't
- Don't apply blur without `headerTransparent: true`
- Don't forget to handle content padding
- Don't use iOS-specific values on Android
- Don't rely on blur for critical UI elements visibility

## Common Issues & Solutions

### Issue: Content appears behind header
**Solution**: Use `useHeaderHeight` hook to add `paddingTop`

```typescript
const headerHeight = useHeaderHeight();
contentContainerStyle={{ paddingTop: Platform.OS === 'ios' ? headerHeight : 0 }}
```

### Issue: Blur not visible
**Solution**: Ensure both `headerTransparent` and `headerBlurEffect` are set

```typescript
headerTransparent: true,
headerBlurEffect: 'regular',
```

### Issue: Android crashes or looks wrong
**Solution**: Use platform checks

```typescript
headerTransparent: Platform.OS === 'ios',
headerBlurEffect: Platform.OS === 'ios' ? 'regular' : undefined,
```

### Issue: Header text not readable
**Solution**: Use appropriate blur material or adjust header tint color

```typescript
headerBlurEffect: 'systemMaterial', // Adapts to theme
headerTintColor: colors.foreground,
```

## Complete Example

```typescript
// app/(tabs)/_layout.tsx
import { Tabs } from 'expo-router';
import { Platform } from 'react-native';
import { useThemeColors } from '~/utils/themeUtils';

export default function TabLayout() {
  const colors = useThemeColors();

  return (
    <Tabs
      screenOptions={{
        headerShown: true,
        headerTransparent: Platform.OS === 'ios',
        headerBlurEffect: Platform.OS === 'ios' ? 'systemMaterial' : undefined,
        headerTintColor: colors.foreground,
        tabBarStyle: {
          backgroundColor: colors.background,
        },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
        }}
      />
    </Tabs>
  );
}
```

```typescript
// app/(tabs)/index.tsx
import { View, FlatList, Platform } from 'react-native';
import { useHeaderHeight } from '@react-navigation/elements';

export default function HomeScreen() {
  const headerHeight = useHeaderHeight();

  return (
    <View style={{ flex: 1 }}>
      <FlatList
        data={items}
        contentContainerStyle={{
          paddingTop: Platform.OS === 'ios' ? headerHeight : 0,
          paddingHorizontal: 16,
        }}
        renderItem={({ item }) => <Card item={item} />}
      />
    </View>
  );
}
```

## References
- [Expo Router Stack Documentation](https://docs.expo.dev/router/advanced/stack/)
- [React Navigation Header Options](https://reactnavigation.org/docs/native-stack-navigator/#headerblureffect)
- [Aman Mittal's Guide](https://amanhimself.dev/blog/blur-effect-in-header-with-expo-router/)

## Version Info
- Last updated: 2025-01
- Expo SDK: 52+
- Expo Router: v5+
