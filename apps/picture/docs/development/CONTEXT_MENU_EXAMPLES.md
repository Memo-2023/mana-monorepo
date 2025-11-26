# react-native-context-menu-view Usage Examples

## Basic Context Menu

```tsx
import ContextMenu from 'react-native-context-menu-view';
import { View, Text, Image } from 'react-native';

function BasicExample() {
  return (
    <ContextMenu
      actions={[
        { title: 'Save', systemIcon: 'square.and.arrow.down' },
        { title: 'Share', systemIcon: 'square.and.arrow.up' },
        { title: 'Delete', destructive: true, systemIcon: 'trash' }
      ]}
      onPress={(e) => {
        console.log('Action pressed:', e.nativeEvent.name);
        // Handle action based on e.nativeEvent.index or e.nativeEvent.name
      }}
    >
      <View className="p-4 bg-gray-100 rounded-lg">
        <Text>Long press me!</Text>
      </View>
    </ContextMenu>
  );
}
```

## Context Menu with Submenus (iOS 14+)

```tsx
import ContextMenu from 'react-native-context-menu-view';

function SubmenuExample() {
  return (
    <ContextMenu
      actions={[
        { title: 'Save', systemIcon: 'square.and.arrow.down' },
        {
          title: 'Export',
          systemIcon: 'square.and.arrow.up.on.square',
          // Nested submenu actions
          actions: [
            { title: 'Export as PDF', systemIcon: 'doc.fill' },
            { title: 'Export as Image', systemIcon: 'photo' },
            { title: 'Export as Video', systemIcon: 'video' }
          ]
        },
        { title: 'Delete', destructive: true, systemIcon: 'trash' }
      ]}
      onPress={(e) => {
        console.log('Action:', e.nativeEvent.name);
      }}
    >
      <View className="p-4 bg-blue-100 rounded-lg">
        <Text>Long press for submenu!</Text>
      </View>
    </ContextMenu>
  );
}
```

## Context Menu with Preview

```tsx
import ContextMenu from 'react-native-context-menu-view';

function PreviewExample() {
  return (
    <ContextMenu
      actions={[
        { title: 'Edit', systemIcon: 'pencil' },
        { title: 'Duplicate', systemIcon: 'plus.square.on.square' },
        { title: 'Delete', destructive: true, systemIcon: 'trash' }
      ]}
      onPress={(e) => {
        console.log('Action:', e.nativeEvent.name);
      }}
      previewBackgroundColor="white"
    >
      <Image
        source={{ uri: 'https://example.com/image.jpg' }}
        className="w-full h-48 rounded-lg"
      />
    </ContextMenu>
  );
}
```

## Context Menu on Generated Images

```tsx
import ContextMenu from 'react-native-context-menu-view';
import * as MediaLibrary from 'expo-media-library';
import * as FileSystem from 'expo-file-system';

function GeneratedImageMenu({ imageUrl }: { imageUrl: string }) {
  const handleSave = async () => {
    // Request permissions
    const { status } = await MediaLibrary.requestPermissionsAsync();
    if (status !== 'granted') {
      alert('Permission required to save images');
      return;
    }

    // Download and save image
    const fileUri = FileSystem.documentDirectory + 'generated-image.jpg';
    await FileSystem.downloadAsync(imageUrl, fileUri);
    await MediaLibrary.createAssetAsync(fileUri);
    alert('Image saved!');
  };

  return (
    <ContextMenu
      actions={[
        { title: 'Save to Photos', systemIcon: 'square.and.arrow.down' },
        { title: 'Share', systemIcon: 'square.and.arrow.up' },
        {
          title: 'More Options',
          actions: [
            { title: 'Set as Wallpaper', systemIcon: 'photo.on.rectangle' },
            { title: 'Copy', systemIcon: 'doc.on.doc' },
            { title: 'View Details', systemIcon: 'info.circle' }
          ]
        },
        { title: 'Delete', destructive: true, systemIcon: 'trash' }
      ]}
      onPress={(e) => {
        switch(e.nativeEvent.index) {
          case 0: // Save to Photos
            handleSave();
            break;
          case 1: // Share
            // Implement share
            break;
          case 2: // Delete
            // Implement delete
            break;
        }
      }}
    >
      <Image
        source={{ uri: imageUrl }}
        className="w-full h-full rounded-lg"
        resizeMode="cover"
      />
    </ContextMenu>
  );
}
```

## Available Action Properties

```tsx
interface Action {
  title: string;                    // Action title
  systemIcon?: string;              // SF Symbol name (iOS only)
  icon?: string;                    // Custom icon (Android)
  destructive?: boolean;            // Red text for destructive actions
  disabled?: boolean;               // Disable the action
  inlineChildren?: boolean;         // Show submenu items inline
  actions?: Action[];               // Nested submenu actions
}
```

## Common SF Symbols (iOS)

- `square.and.arrow.down` - Save/Download
- `square.and.arrow.up` - Share/Export
- `trash` - Delete
- `pencil` - Edit
- `doc.on.doc` - Copy
- `heart` / `heart.fill` - Favorite
- `star` / `star.fill` - Star/Rate
- `photo` - Image
- `video` - Video
- `info.circle` - Info
- `eye` / `eye.slash` - Show/Hide
- `checkmark` - Confirm

## Android Support

The library also works on Android with Material Design menus:

```tsx
<ContextMenu
  actions={[
    { title: 'Save', icon: 'save' },  // Use Android icon names
    { title: 'Share', icon: 'share' },
    { title: 'Delete', destructive: true, icon: 'delete' }
  ]}
  onPress={(e) => {
    console.log('Action:', e.nativeEvent.index);
  }}
>
  <YourComponent />
</ContextMenu>
```

## Tips

1. **Long Press**: Context menu appears on long press by default
2. **Submenus**: Nest `actions` arrays for submenus (iOS 14+)
3. **SF Symbols**: Use Apple's SF Symbols for iOS icons
4. **Destructive Actions**: Set `destructive: true` for delete/remove actions
5. **Event Handling**: Use `e.nativeEvent.index` or `e.nativeEvent.name` to identify actions
