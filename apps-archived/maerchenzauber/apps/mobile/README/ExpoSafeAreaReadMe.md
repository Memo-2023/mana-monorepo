Safe areas
Learn how to add safe areas for screen components inside your Expo project.

Creating a safe area ensures your app screen's content is positioned correctly. This means it doesn't get overlapped by notches, status bars, home indicators, and other interface elements that are part of the device's physical hardware or are controlled by the operating system. When the content gets overlapped, it gets concealed by these interface elements.

Here's an example of an app screen's content getting concealed by the status bar on Android. On iOS, the same content is concealed by rounded corners, notch, and the status bar.

Without defining a safe area, the content can be obscured by the device's interface elements.
Use
react-native-safe-area-context
library
react-native-safe-area-context provides a flexible API for handling Android and iOS device's safe area insets. It also provides a SafeAreaView component that you can use instead of a <View> to account for safe areas automatically in your screen components.

Using the library, the result of the previous example changes as it displays the content inside a safe area, as shown below:

On using react-native-safe-area-context, the content is positioned within the safe area.
Installation
You can skip installing react-native-safe-area-context if you have created a project using the default template. This library is installed as peer dependency for Expo Router library. Otherwise, install it by running the following command:

Terminal

Copy

npx expo install react-native-safe-area-context
Usage
You can directly use SafeAreaView to wrap the content of your screen's component. It is a regular <View> with the safe area insets applied as extra padding or margin.

app/index.tsx

Copy

import { Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function HomeScreen() {
return (
<SafeAreaView style={{ flex: 1 }}>
<Text>Content is in safe area.</Text>
</SafeAreaView>
);
}
Using a different Expo template and don't have Expo Router installed?
Alternate:
useSafeAreaInsets
hook
Alternate to SafeAreaView, you can use useSafeAreaInsets hook in your screen component. It provides direct access to the safe area insets, allowing you to apply padding for each edge of the <View> using an inset from this hook.

The example below uses the useSafeAreaInsets hook. It applies top padding to a <View> using insets.top.

app/index.tsx

Copy

import { Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function HomeScreen() {
const insets = useSafeAreaInsets();

return (
<View style={{ flex: 1, paddingTop: insets.top }}>
<Text>Content is in safe area.</Text>
</View>
);
}
The hook provides the insets in the following object:

{
top: number,
right: number,
bottom: number,
left: number
}
Additional information
Minimal example
Below is a minimal working example that uses the useSafeAreaInsets hook to apply top padding to a view.

Using react-native-safe-area-context

Copy

Open in Snack

import { Text, View } from 'react-native';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';

function HomeScreen() {
const insets = useSafeAreaInsets();
return (
<View style={{ flex: 1, paddingTop: insets.top }}>
<Text style={{ fontSize: 28 }}>Content is in safe area.</Text>
</View>
);
}

export default function App() {
return (
<SafeAreaProvider>
<HomeScreen />
</SafeAreaProvider>
);
}

Show More
Usage with React Navigation
By default, React Navigation supports safe areas and uses react-native-safe-area-context as a peer dependency. For more information, see the React Navigation documentation.

Usage with web
If you are targeting the web, set up SafeAreaProvider as described in the usage section. If you are doing server-side rendering (SSR), see the Web SSR section in the library's documentation.
