# Header Styling Guide - Expo Router

## Overview
This guide covers all available styling options for headers in Expo Router's Stack navigator.

## Available Header Style Options

### Basic Configuration

```typescript
import { Stack } from 'expo-router';
import { useThemeColors } from '~/utils/themeUtils';

export default function Layout() {
  const colors = useThemeColors();

  return (
    <Stack
      screenOptions={{
        // Header visibility
        headerShown: true,

        // Header title
        title: 'My Screen',

        // Glass effect (iOS only)
        headerTransparent: true,
        headerBlurEffect: 'systemMaterial',

        // Colors
        headerTintColor: colors.foreground,
        headerStyle: {
          backgroundColor: colors.background,
        },

        // Title styling
        headerTitleStyle: {
          fontWeight: 'bold',
          fontSize: 18,
          fontFamily: 'System',
        },

        // Shadow/Border
        headerShadowVisible: false,

        // Back button
        headerBackVisible: true,
        headerBackTitle: 'Back',
        headerBackTitleVisible: true,
      }}>
      <Stack.Screen name="index" />
    </Stack>
  );
}
```

## Core Style Properties

### 1. headerStyle
Controls the header container's style.

```typescript
headerStyle: {
  backgroundColor: '#ff0000',  // Background color (not needed with headerTransparent)
}
```

**Note**: Cannot set `height` - this is controlled by the OS.

### 2. headerTintColor
Sets the color for back button and title text.

```typescript
headerTintColor: '#ffffff'  // White text and icons
```

### 3. headerTitleStyle
Customizes the title text appearance.

```typescript
headerTitleStyle: {
  fontWeight: 'bold',
  fontSize: 20,
  fontFamily: 'CustomFont',
  color: '#000000',  // Can override headerTintColor for title only
}
```

### 4. headerTitleAlign
Controls title alignment.

```typescript
headerTitleAlign: 'center' | 'left'  // Default: 'center' on iOS, 'left' on Android
```

### 5. headerTransparent
Makes header transparent for glass effect.

```typescript
headerTransparent: true  // Required for headerBlurEffect
```

### 6. headerBlurEffect (iOS only)
Adds blur/glass effect to header.

```typescript
headerBlurEffect: 'systemMaterial' | 'regular' | 'prominent' |
                  'systemThinMaterial' | 'systemUltraThinMaterial' |
                  'systemChromeMaterial' | 'systemThinMaterialLight' |
                  'systemThinMaterialDark'
```

### 7. headerShadowVisible
Controls header shadow/border visibility.

```typescript
headerShadowVisible: false  // Remove shadow
```

## Back Button Customization

### headerBackVisible
Show/hide back button.

```typescript
headerBackVisible: true  // Show back button
```

### headerBackTitle (iOS only)
Custom text for back button.

```typescript
headerBackTitle: 'Home'  // Default: Previous screen title
```

### headerBackTitleVisible (iOS only)
Show/hide back button text.

```typescript
headerBackTitleVisible: false  // Only show arrow icon
```

### headerBackImageSource
Custom back button icon.

```typescript
headerBackImageSource: require('./assets/back-icon.png')
```

## Title Customization

### headerTitle
Function to render custom title component.

```typescript
headerTitle: () => (
  <View>
    <Text style={{ fontSize: 20, fontWeight: 'bold' }}>Custom Title</Text>
  </View>
)
```

### headerTitleAlign
```typescript
headerTitleAlign: 'center'  // 'center' | 'left'
```

## Header Buttons

### headerLeft
Custom left button/component.

```typescript
headerLeft: () => (
  <Pressable onPress={() => console.log('Left button')}>
    <Icon name="menu" size={24} />
  </Pressable>
)
```

### headerRight
Custom right button/component.

```typescript
headerRight: () => (
  <Pressable onPress={() => console.log('Right button')}>
    <Icon name="settings" size={24} />
  </Pressable>
)
```

## Search Bar (iOS 11+)

### headerSearchBarOptions
Native iOS search bar in header.

```typescript
headerSearchBarOptions: {
  placeholder: 'Search...',
  onChangeText: (text) => console.log(text),
  hideWhenScrolling: true,
}
```

## Large Title (iOS)

### headerLargeTitle
Large title that collapses on scroll (iOS only).

```typescript
headerLargeTitle: true
```

### headerLargeTitleStyle
Style for large title.

```typescript
headerLargeTitleStyle: {
  fontWeight: 'bold',
  fontSize: 34,
}
```

### headerLargeTitleShadowVisible
Shadow for large title.

```typescript
headerLargeTitleShadowVisible: false
```

## Complete Example: Glass Header with Theme

```typescript
import { Stack } from 'expo-router';
import { Platform } from 'react-native';
import { useThemeColors } from '~/utils/themeUtils';

export default function Layout() {
  const colors = useThemeColors();

  return (
    <Stack
      screenOptions={{
        headerShown: true,

        // Glass effect (iOS only)
        ...(Platform.OS === 'ios' ? {
          headerTransparent: true,
          headerBlurEffect: 'systemMaterial',
        } : {
          headerStyle: {
            backgroundColor: colors.background,
          },
        }),

        // Colors
        headerTintColor: colors.foreground,

        // Title styling
        headerTitleStyle: {
          fontWeight: '600',
          fontSize: 17,
        },
        headerTitleAlign: 'center',

        // Shadow
        headerShadowVisible: false,

        // Back button
        headerBackTitleVisible: false,
      }}>
      <Stack.Screen
        name="index"
        options={{
          title: 'Home',
          headerRight: () => (
            <Pressable onPress={() => console.log('Settings')}>
              <Icon name="settings" size={24} color={colors.foreground} />
            </Pressable>
          ),
        }}
      />
    </Stack>
  );
}
```

## Platform Differences

### iOS
- Default title alignment: `center`
- Supports `headerBlurEffect`
- Supports `headerLargeTitle`
- Supports `headerSearchBarOptions`
- Back button shows previous screen title by default

### Android
- Default title alignment: `left`
- No blur effect (use solid `backgroundColor`)
- No large title support
- No native search bar in header
- Back button only shows arrow icon

## Common Patterns

### 1. Remove Header Shadow
```typescript
headerShadowVisible: false
```

### 2. Custom Back Button
```typescript
headerLeft: () => (
  <Pressable onPress={() => router.back()}>
    <Icon name="arrow-back" size={24} color={colors.foreground} />
  </Pressable>
)
```

### 3. Hide Header on Specific Screen
```typescript
<Stack.Screen
  name="fullscreen"
  options={{ headerShown: false }}
/>
```

### 4. Dynamic Title
```typescript
<Stack.Screen
  name="detail"
  options={{
    title: dynamicTitle,
    // or
    headerTitle: () => <CustomTitleComponent title={dynamicTitle} />
  }}
/>
```

### 5. Large Title with Search (iOS)
```typescript
<Stack.Screen
  name="search"
  options={{
    headerLargeTitle: true,
    headerSearchBarOptions: {
      placeholder: 'Search items...',
    },
  }}
/>
```

## Limitations

### Cannot Customize:
- ❌ Header height (controlled by OS)
- ❌ Status bar appearance (use `expo-status-bar` package)
- ❌ Exact positioning of elements (use headerLeft/headerRight instead)

### Platform-Specific:
- ⚠️ Blur effects only on iOS
- ⚠️ Large titles only on iOS
- ⚠️ Native search bar only on iOS 11+

## Troubleshooting

### Issue: Title not visible on transparent header
**Solution**: Ensure `headerTintColor` is set to a visible color

### Issue: Back button wrong color
**Solution**: Set `headerTintColor` - it controls both title and back button

### Issue: Header too tall/short
**Solution**: Height is controlled by OS and cannot be changed. Use custom header component if needed.

### Issue: Shadow visible on transparent header
**Solution**: Set `headerShadowVisible: false`

## References
- [Expo Router Stack Documentation](https://docs.expo.dev/router/advanced/stack/)
- [React Navigation Native Stack Navigator](https://reactnavigation.org/docs/native-stack-navigator/)
- [React Navigation Headers](https://reactnavigation.org/docs/headers/)
