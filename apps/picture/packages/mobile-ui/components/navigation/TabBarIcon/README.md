# TabBarIcon

Icon component optimized for tab bar usage.

## Features

- ✅ Optimized for tab bars
- ✅ Optical alignment (negative margin)
- ✅ Color and size customization
- ✅ Focused state support
- ✅ Cross-platform icons

## Installation

```bash
npx @memoro/ui add tab-bar-icon
```

**Dependencies:** icon

## Usage

### Basic TabBarIcon

```tsx
import { TabBarIcon } from '@/components/navigation/TabBarIcon';

<TabBarIcon
  name="home"
  color="#3B82F6"
/>
```

### With Expo Router

```tsx
import { Tabs } from 'expo-router';
import { TabBarIcon } from '@/components/navigation/TabBarIcon';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#3B82F6',
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color }) => <TabBarIcon name="home" color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color }) => <TabBarIcon name="person" color={color} />,
        }}
      />
    </Tabs>
  );
}
```

### With React Navigation

```tsx
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { TabBarIcon } from '@/components/navigation/TabBarIcon';

const Tab = createBottomTabNavigator();

function MyTabs() {
  return (
    <Tab.Navigator>
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          tabBarIcon: ({ color, focused }) => (
            <TabBarIcon name="home" color={color} focused={focused} />
          ),
        }}
      />
      <Tab.Screen
        name="Settings"
        component={SettingsScreen}
        options={{
          tabBarIcon: ({ color, focused }) => (
            <TabBarIcon name="settings" color={color} focused={focused} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}
```

### Custom Size

```tsx
<TabBarIcon
  name="heart"
  color="#EF4444"
  size={32}
/>
```

### Focused/Unfocused Icons

```tsx
<TabBarIcon
  name={focused ? 'heart' : 'heart-outline'}
  color={focused ? '#EF4444' : '#6B7280'}
  focused={focused}
/>
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `name` | `string` | - | **Required** - Icon name |
| `color` | `string` | - | **Required** - Icon color |
| `size` | `number` | `28` | Icon size in pixels |
| `focused` | `boolean` | `false` | Is the tab focused |
| `style` | `ViewStyle` | - | Additional styles |

## Default Styling

- **Icon Size:** 28px (standard tab bar size)
- **Margin Bottom:** -3px (optical alignment)
- **Color:** Passed from tab bar

## Examples

### Home Tab

```tsx
<TabBarIcon
  name={focused ? 'home' : 'home-outline'}
  color={color}
  focused={focused}
/>
```

### Search Tab

```tsx
<TabBarIcon
  name={focused ? 'search' : 'search-outline'}
  color={color}
  focused={focused}
/>
```

### Profile Tab

```tsx
<TabBarIcon
  name={focused ? 'person' : 'person-outline'}
  color={color}
  focused={focused}
/>
```

### Settings Tab

```tsx
<TabBarIcon
  name={focused ? 'settings' : 'settings-outline'}
  color={color}
  focused={focused}
/>
```

### Notifications Tab

```tsx
<TabBarIcon
  name={focused ? 'notifications' : 'notifications-outline'}
  color={color}
  focused={focused}
/>
```

### Cart Tab

```tsx
<TabBarIcon
  name={focused ? 'cart' : 'cart-outline'}
  color={color}
  focused={focused}
/>
```

### Messages Tab

```tsx
<TabBarIcon
  name={focused ? 'chatbubble' : 'chatbubble-outline'}
  color={color}
  focused={focused}
/>
```

## Full Tab Bar Example

```tsx
import { Tabs } from 'expo-router';
import { TabBarIcon } from '@/components/navigation/TabBarIcon';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#3B82F6',
        tabBarInactiveTintColor: '#6B7280',
        headerShown: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, focused }) => (
            <TabBarIcon
              name={focused ? 'home' : 'home-outline'}
              color={color}
              focused={focused}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="search"
        options={{
          title: 'Search',
          tabBarIcon: ({ color, focused }) => (
            <TabBarIcon
              name={focused ? 'search' : 'search-outline'}
              color={color}
              focused={focused}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="favorites"
        options={{
          title: 'Favorites',
          tabBarIcon: ({ color, focused }) => (
            <TabBarIcon
              name={focused ? 'heart' : 'heart-outline'}
              color={color}
              focused={focused}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, focused }) => (
            <TabBarIcon
              name={focused ? 'person' : 'person-outline'}
              color={color}
              focused={focused}
            />
          ),
        }}
      />
    </Tabs>
  );
}
```

## Icon Naming Pattern

For better UX, use filled icons when focused and outline variants when unfocused:

```tsx
// Good
name={focused ? 'home' : 'home-outline'}

// Also good (if no outline variant exists)
name="home"

// Avoid (no visual difference)
name="home" // same for focused and unfocused
```

## Common Icon Choices

### Navigation
- `home` / `home-outline`
- `compass` / `compass-outline`
- `map` / `map-outline`
- `location` / `location-outline`

### Content
- `grid` / `grid-outline`
- `list` / `list-outline`
- `images` / `images-outline`
- `videocam` / `videocam-outline`

### Social
- `chatbubble` / `chatbubble-outline`
- `notifications` / `notifications-outline`
- `people` / `people-outline`
- `mail` / `mail-outline`

### Shopping
- `cart` / `cart-outline`
- `bag` / `bag-outline`
- `pricetag` / `pricetag-outline`
- `card` / `card-outline`

### Media
- `play-circle` / `play-circle-outline`
- `musical-notes` / `musical-notes-outline`
- `camera` / `camera-outline`
- `mic` / `mic-outline`

### Utility
- `settings` / `settings-outline`
- `bookmark` / `bookmark-outline`
- `heart` / `heart-outline`
- `star` / `star-outline`

## Optical Alignment

The default `-3px` bottom margin provides optical alignment for most tab bars. Adjust if needed:

```tsx
<TabBarIcon
  name="home"
  color={color}
  style={{ marginBottom: -5 }} // Custom alignment
/>
```

## Notes

- Perfect for bottom tab navigation
- Works with Expo Router and React Navigation
- Use outline/filled variants for better UX
- Default size (28px) matches standard tab bars
- Negative margin provides optical centering
- Color is typically provided by navigation library
- Consider focused state for better visual feedback
