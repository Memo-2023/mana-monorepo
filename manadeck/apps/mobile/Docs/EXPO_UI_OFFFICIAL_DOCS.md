Expo UI

A set of components that allow you to build UIs directly with SwiftUI and Jetpack Compose from React.

Bundled version:
~0.2.0-beta.4

Copy

This library is currently in alpha and will frequently experience breaking changes. It is not available in the Expo Go app – use development builds to try it out.
@expo/ui is a set of native input components that allows you to build fully native interfaces with SwiftUI and Jetpack Compose. It aims to provide the commonly used features and components that a typical app will need.

Expo UI guide for Swift UI
Learn about the basics of @expo/ui/swift-ui

Installation
Terminal

Copy

npx expo install @expo/ui
If you are installing this in an existing React Native app, make sure to install expo in your project.

Swift UI examples
BottomSheet

iOS

Code

BottomSheet component on iOS.
Button
The borderless variant is not available on Apple TV.

iOS

Code

Button component on iOS.
CircularProgress

iOS

Code

CircularProgress component on iOS.
ColorPicker
This component is not available on Apple TV.

iOS

Code

ColorPicker component on iOS.
ContextMenu
Note: Also known as DropdownMenu.

iOS

Code

ContextMenu component on iOS.
DateTimePicker (date)
This component is not available on Apple TV.

iOS

Code

DateTimePicker (date) component on iOS.
DateTimePicker (time)
This component is not available on Apple TV.

iOS

Code

DateTimePicker (time) component on iOS.
Gauge
This component is not available on Apple TV.

iOS

Code

Gauge component on iOS.
Host
A component that allows you to put the other @expo/ui/swift-ui components in React Native. It acts like <svg> for DOM, <Canvas> for react-native-skia, which underlying uses UIHostingController to render the SwiftUI views in UIKit.

Since the Host component is a React Native View, you can pass the style prop to it or matchContents prop to make the Host component match the contents' size.

Wrapping Button in Host

Copy

import { Button, Host } from '@expo/ui/swift-ui';

function Example() {
return (
<Host matchContents>
<Button
onPress={() => {
console.log('Pressed');
}}>
Click
</Button>
</Host>
);
}
Host with flexbox and VStack

Copy

import { Button, Host, VStack, Text } from '@expo/ui/swift-ui';

function Example() {
return (
<Host style={{ flex: 1 }}>
<VStack spacing={8}>
<Text>Hello, world!</Text>
<Button
onPress={() => {
console.log('Pressed');
}}>
Click
</Button>
</VStack>
</Host>
);
}
LinearProgress

iOS

Code

LinearProgress component on iOS.
List

iOS

Code

List component on iOS.
Picker (segmented)

iOS

Code

Picker component on iOS.
Picker (wheel)
The wheel variant is not available on Apple TV.

iOS

Code

Picker component on iOS.
Slider
This component is not available on Apple TV.

iOS

Code

Slider component on iOS.
Switch (toggle)
Note: Also known as Toggle.

iOS

Code

Switch component on iOS.
Switch (checkbox)

iOS

Code

Picker component on iOS.
TextField

iOS

Code

TextField component on iOS.
More
Expo UI is still in active development. We continue to add more functionality and may change the API. Some examples in the docs may not be up to date. If you want to see the latest changes, check the examples.

Jetpack Compose examples
Button

Android

Code

Button component on Android.
CircularProgress

Android

Code

CircularProgress component on Android.
ContextMenu
Note: Also known as DropdownMenu.

Android

Code

ContextMenu component on Android.
Chip

Android

Code

Chip component on Android.
DateTimePicker (date)

Android

Code

DateTimePicker component on Android.
DateTimePicker (time)

Android

Code

DateTimePicker (time) component on Android.
LinearProgress

Android

Code

LinearProgress component on Android.
Picker (radio)

Android

Code

Picker component (radio) on Android.
Picker (segmented)

Android

Code

Picker component on Android.
Slider

Android

Code

Slider component on Android.
Switch (toggle)
Note: also known as Toggle.

Android

Code

Switch component on Android.
Switch (checkbox)

Android

Code

Switch (checkbox variant) component on Android.
TextInput

Android

Code

TextInput component on Android.
API
Full documentation is not yet available. Use TypeScript types to explore the API.

// Import from the SwiftUI package
import { BottomSheet } from '@expo/ui/swift-ui';
// Import from the Jetpack Compose package
import { Button } from '@expo/ui/jetpack-compose';
