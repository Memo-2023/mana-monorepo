Building SwiftUI apps with Expo UI

Copy

Learn how to use Expo UI to integrate SwiftUI into your Expo apps.

Available in SDK 54 and above.
Expo UI brings SwiftUI to React Native. You can use modern SwiftUI primitives to build your apps.

This guide covers the basics of using Expo UI to integrate SwiftUI into your Expo apps.

Features
SwiftUI primitives: Expo UI is not another UI library. It brings SwiftUI primitives to Expo.
1-to-1 mapping: The components in Expo UI have a 1-to-1 mapping to SwiftUI views. You can easily explore available views in the SwiftUI ecosystem, such as Explore SwiftUI or the Libraried app, and find the corresponding Expo UI component.
Full-app support: Expo UI is designed to be used throughout the entire app. You can write your app entirely in Expo UI, while maintaining flexibility at the same time. The integration works at the component level. You can also mix React Native components, Expo UI components, DOM components, or custom 2D components using react-native-skia.
Installation
You'll need to install the @expo/ui package in your Expo project. Run the following command to install it:

Terminal

Copy

npx expo install @expo/ui
Usage
Expo UI has several SwiftUI components available. You can use them in your app by importing them from @expo/ui/swift-ui. However, to cross the boundary from React Native (UIKit) to SwiftUI, you need to use the <Host> component. The <Host> is the container for SwiftUI views. You can think of it like <svg> in the DOM or <Canvas> in react-native-skia. Under the hood, it uses UIHostingController to render SwiftUI views in UIKit.

Basic usage with Host

Code

Preview

SwiftUI loading view

Copy

import { CircularProgress, Host } from '@expo/ui/swift-ui';
import { View, Text } from 'react-native';

export default function LoadingView() {
return (
<View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
<Host matchContents>
<CircularProgress />
</Host>
<Text>Loading...</Text>
</View>
);
}
Using HStack and VStack
You can also use the HStack and VStack components to build the entire layout in SwiftUI.

Code

Preview

SwiftUI loading with HStack and VStack

Copy

import { CircularProgress, Host, HStack, LinearProgress, VStack } from '@expo/ui/swift-ui';

export default function LoadingView() {
return (
<Host style={{ flex: 1, margin: 32 }}>
<VStack spacing={32}>
<HStack spacing={32}>
<CircularProgress />
<CircularProgress color="orange" />
</HStack>
<LinearProgress progress={0.5} />
<LinearProgress color="orange" progress={0.7} />
</VStack>
</Host>
);
}
Modifiers
SwiftUI modifier is a powerful way to customize the appearance and behavior of SwiftUI components. Expo UI also provides modifiers for SwiftUI components. You can import modifiers from @expo/ui/swift-ui/modifiers and pass them as an array to the modifiers prop. In the following example, the expo-mesh-gradient and glassEffect modifier are combined to create Liquid Glass text.

Code

Preview

Note: glassEffect modifier requires Xcode 26+ and iOS 26+.

SwiftUI modifiers

Copy

import { Host, Text } from '@expo/ui/swift-ui';
import { glassEffect, padding } from '@expo/ui/swift-ui/modifiers';
import { MeshGradientView } from 'expo-mesh-gradient';
import { View } from 'react-native';

export default function Page() {
return (
<View style={{ flex: 1 }}>
<MeshGradientView
style={{ flex: 1 }}
columns={3}
rows={3}
colors={['red', 'purple', 'indigo', 'orange', 'white', 'blue', 'yellow', 'green', 'cyan']}
points={[
[0.0, 0.0],
[0.5, 0.0],
[1.0, 0.0],
[0.0, 0.5],
[0.5, 0.5],
[1.0, 0.5],
[0.0, 1.0],
[0.5, 1.0],
[1.0, 1.0],
]}
/>
<Host style={{ position: 'absolute', top: 0, right: 0, left: 0, bottom: 0 }}>
<Text
size={32}
modifiers={[
padding({
all: 16,
}),
glassEffect({
glass: {
variant: 'clear',
},
}),
]}>
Glass effect text
</Text>
</Host>
</View>
);
}

Show More
iOS Settings app example
Combining the Expo UI components and modifiers, you can build a UI like iOS Settings app.

Code

Preview

SwiftUI Form example to build iOS Settings app

Copy

import {
Button,
Form,
Host,
HStack,
Image,
Section,
Spacer,
Switch,
Text,
} from '@expo/ui/swift-ui';
import { background, clipShape, frame } from '@expo/ui/swift-ui/modifiers';
import { Link } from 'expo-router';
import { useState } from 'react';

export default function SettingsView() {
const [isAirplaneMode, setIsAirplaneMode] = useState(true);

return (
<Host style={{ flex: 1 }}>

<Form>
<Section>
<HStack spacing={8}>
<Image
systemName="airplane"
color="white"
size={18}
modifiers={[
frame({ width: 28, height: 28 }),
background('#ffa500'),
clipShape('roundedRectangle'),
]}
/>
<Text>Airplane Mode</Text>
<Spacer />
<Switch value={isAirplaneMode} onValueChange={setIsAirplaneMode} />
</HStack>

          <Link href="/wifi" asChild>
            <Button>
              <HStack spacing={8}>
                <Image
                  systemName="wifi"
                  color="white"
                  size={18}
                  modifiers={[
                    frame({ width: 28, height: 28 }),
                    background('#007aff'),
                    clipShape('roundedRectangle'),
                  ]}
                />
                <Text color="primary">Wi-Fi</Text>
                <Spacer />
                <Image systemName="chevron.right" size={14} color="secondary" />
              </HStack>
            </Button>
          </Link>
        </Section>
      </Form>
    </Host>

);
}

Show More
Common questions
Can I use flexbox or other styles in SwiftUI components?
Flexbox styles can be applied to the <Host> component itself. Once you're inside the SwiftUI context, however, Yoga is not available — layouts should be defined using <HStack> and <VStack> instead.

What's the Host component?
<Host> is the container for SwiftUI views. You can think of it like <svg> in the DOM or <Canvas> in react-native-skia. Under the hood, it uses UIHostingController to render SwiftUI views in UIKit.

How is Expo UI different from libraries like react-native-paper or react-native-elements?
Expo UI is not "yet another" UI library and not an opinionated design kit. Instead, it's a primitives library. It exposes native SwiftUI and Jetpack Compose components directly to JavaScript, rather than re-implementing or simulating UI in JavaScript.

Can I use @expo/ui/swift-ui on Android or web?
The first milestone for Expo UI is achieving a 1-to-1 mapping from SwiftUI to Expo UI. Universal support will come in the next stage of the roadmap. Our priority is to establish strong SwiftUI support first, and then expand to Jetpack Compose on Android and DOM support on the Web.

Can I use React Native components inside SwiftUI components?
Yes, you can place React Native components as JSX children of Expo UI components. Expo UI automatically creates a UIViewRepresentable wrapper for you. However, keep in mind that the SwiftUI layout system works differently from UIKit and has some limitations. According to Apple's documentation:

SwiftUI fully controls the layout of the UIKit view's center, bounds, frame, and transform properties. Don't directly set these layout-related properties on the view managed by a UIViewRepresentable instance from your own code because that conflicts with SwiftUI and results in undefined behavior.
Also note that once you render React Native components, you're leaving the SwiftUI context. If you want to add Expo UI components again, you'll need to reintroduce a <Host> wrapper.

We recommend keeping SwiftUI layouts self-contained. Interop is possible, but it works best when boundaries are clearly defined.

I'm a SwiftUI developer. Why should I learn Expo UI?
Because React's promise of "learn once, write anywhere", it now extends to SwiftUI and Jetpack Compose. With Expo UI, you can apply your SwiftUI knowledge to build apps that run in the React Native ecosystem, extend to the Web through DOM components, and even integrate 2D and 3D rendering. The system is flexible enough that different parts of your app can use different approaches — giving you seamless integration at the component level.

SwiftUI

SwiftUI components for building native iOS interfaces with @expo/ui.

Bundled version:
~0.2.0-beta.4

Copy

This library is currently in beta and subject to breaking changes. It is not available in the Expo Go app — use development builds to try it out.
The SwiftUI components in @expo/ui/swift-ui allow you to build fully native iOS interfaces using SwiftUI from React Native.

Expo UI guide for Swift UI
Learn about the basics of @expo/ui/swift-ui

Installation
Terminal

Copy

npx expo install @expo/ui
If you are installing this in an existing React Native app, make sure to install expo in your project.

Components
BottomSheet

iOS

Code

import { BottomSheet, Host, Text } from '@expo/ui/swift-ui';
import { useWindowDimensions } from 'react-native';

const { width } = useWindowDimensions();

<Host style={{ position: 'absolute', width }}>
<BottomSheet isOpened={isOpened} onIsOpenedChange={e => setIsOpened(e)}>
<Text>Hello, world!</Text>
</BottomSheet>
</Host>
See also: official SwiftUI documentation

Button
The borderless variant is not available on Apple TV.

iOS

Code

import { Button, Host } from '@expo/ui/swift-ui';

<Host style={{ flex: 1 }}>
<Button
variant="default"
onPress={() => {
setEditingProfile(true);
}}>
Edit profile
</Button>
</Host>
See also: official SwiftUI documentation

CircularProgress

iOS

Code

import { CircularProgress, Host } from '@expo/ui/swift-ui';

<Host style={{ width: 300 }}>
<CircularProgress progress={0.5} color="blue" />
</Host>
See also: official SwiftUI documentation

ColorPicker
This component is not available on Apple TV.

iOS

Code

import { ColorPicker, Host } from '@expo/ui/swift-ui';

<Host style={{ width: 400, height: 200 }}>
<ColorPicker
    label="Select a color"
    selection={color}
    onValueChanged={setColor}
  />
</Host>
See also: official SwiftUI documentation

ContextMenu
Note: Also known as DropdownMenu.

iOS

Code

import { ContextMenu, Host } from '@expo/ui/swift-ui';

<Host style={{ width: 150, height: 50 }}>
<ContextMenu>
<ContextMenu.Items>
<Button
systemImage="person.crop.circle.badge.xmark"
onPress={() => console.log('Pressed1')}>
Hello
</Button>
<Button
variant="bordered"
systemImage="heart"
onPress={() => console.log('Pressed2')}>
Love it
</Button>
<Picker
label="Doggos"
options={['very', 'veery', 'veeery', 'much']}
variant="menu"
selectedIndex={selectedIndex}
onOptionSelected={({ nativeEvent: { index } }) => setSelectedIndex(index)}
/>
</ContextMenu.Items>
<ContextMenu.Trigger>
<Button variant="bordered">
Show Menu
</Button>
</ContextMenu.Trigger>
</ContextMenu>
</Host>

Show More
See also: official SwiftUI documentation

DateTimePicker (date)
This component is not available on Apple TV.

iOS

Code

import { DateTimePicker, Host } from '@expo/ui/swift-ui';

<Host matchContents>
  <DateTimePicker
    onDateSelected={date => {
      setSelectedDate(date);
    }}
    displayedComponents='date'
    initialDate={selectedDate.toISOString()}
    variant='wheel'
  />
</Host>
See also: official SwiftUI documentation

DateTimePicker (time)
This component is not available on Apple TV.

iOS

Code

import { DateTimePicker, Host } from '@expo/ui/swift-ui';

<Host matchContents>
  <DateTimePicker
    onDateSelected={date => {
      setSelectedDate(date);
    }}
    displayedComponents='hourAndMinute'
    initialDate={selectedDate.toISOString()}
    variant='wheel'
  />
</Host>
See also: official SwiftUI documentation

Gauge
This component is not available on Apple TV.

iOS

Code

import { Gauge, Host } from "@expo/ui/swift-ui";

<Host matchContents>
  <Gauge
    max={{ value: 1, label: '1' }}
    min={{ value: 0, label: '0' }}
    current={{ value: 0.5 }}
    color={[
      PlatformColor('systemRed'),
      PlatformColor('systemOrange'),
      PlatformColor('systemYellow'),
      PlatformColor('systemGreen'),
    ]}
    type="circularCapacity"
  />
</Host>
See also: official SwiftUI documentation

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

import { LinearProgress, Host } from '@expo/ui/swift-ui';

<Host style={{ width: 300 }}>
<LinearProgress progress={0.5} color="red" />
</Host>
See also: official SwiftUI documentation

List

iOS

Code

import { Host, List } from '@expo/ui/swift-ui';

<Host style={{ flex: 1 }}>
<List
scrollEnabled={false}
editModeEnabled={editModeEnabled}
onSelectionChange={(items) => alert(`indexes of selected items: ${items.join(', ')}`)}
moveEnabled={moveEnabled}
onMoveItem={(from, to) => alert(`moved item at index ${from} to index ${to}`)}
onDeleteItem={(item) => alert(`deleted item at index: ${item}`)}
listStyle='automatic'
deleteEnabled={deleteEnabled}
selectEnabled={selectEnabled}>
{data.map((item, index) => (
<LabelPrimitive key={index} title={item.text} systemImage={item.systemImage} color={color} />
))}
</List>
</Host>

Show More
See also: official SwiftUI documentation

Picker (segmented)

iOS

Code

import { Host, Picker } from '@expo/ui/swift-ui';

<Host matchContents>
  <Picker
    options={['$', '$$', '$$$', '$$$$']}
    selectedIndex={selectedIndex}
    onOptionSelected={({ nativeEvent: { index } }) => {
      setSelectedIndex(index);
    }}
    variant="segmented"
  />
</Host>
See also: official SwiftUI documentation

Picker (wheel)
The wheel variant is not available on Apple TV.

iOS

Code

import { Host, Picker } from '@expo/ui/swift-ui';

<Host style={{ height: 100 }}>
<Picker
options={['$', '$$', '$$$', '$$$$']}
selectedIndex={selectedIndex}
onOptionSelected={({ nativeEvent: { index } }) => {
setSelectedIndex(index);
}}
variant="wheel"
/>
</Host>
See also: official SwiftUI documentation

Slider
This component is not available on Apple TV.

iOS

Code

import { Host, Slider } from '@expo/ui/swift-ui';

<Host style={{ minHeight: 60 }}>
<Slider
value={value}
onValueChange={(value) => {
setValue(value);
}}
/>
</Host>
See also: official SwiftUI documentation

Switch (toggle)
Note: Also known as Toggle.

iOS

Code

import { Host, Switch } from '@expo/ui/swift-ui';

<Host matchContents>
  <Switch
    checked={checked}
    onValueChange={checked => {
      setChecked(checked);
    }}
    color="#ff0000"
    label="Play music"
    variant="switch"
  />
</Host>
See also: official SwiftUI documentation

Switch (checkbox)

iOS

Code

import { Host, Switch } from '@expo/ui/swift-ui';

<Host matchContents>
  <Switch
    checked={checked}
    onValueChange={checked => {
      setChecked(checked);
    }}
    label="Play music"
    variant="checkbox"
  />
</Host>
See also: official SwiftUI documentation

TextField

iOS

Code

import { Host, TextField } from '@expo/ui/swift-ui';

<Host matchContents>
  <TextField autocorrection={false} defaultValue="A single line text input" onChangeText={setValue} />
</Host>
See also: official SwiftUI documentation

More
Expo UI is still in active development. We continue to add more functionality and may change the API. Some examples in the docs may not be up to date. If you want to see the latest changes, check the examples.

API
Full documentation is not yet available. Use TypeScript types to explore the API.

// Import from the SwiftUI package
import { BottomSheet } from '@expo/ui/swift-ui';

Jetpack Compose

Jetpack Compose components for building native Android interfaces with @expo/ui.

Bundled version:
~0.2.0-beta.4

Copy

This library is currently in alpha and will frequently experience breaking changes. It is not available in the Expo Go app — use development builds to try it out.
The Jetpack Compose components in @expo/ui/jetpack-compose allow you to build fully native Android interfaces using Jetpack Compose from React Native.

Installation
Terminal

Copy

npx expo install @expo/ui
If you are installing this in an existing React Native app, make sure to install expo in your project.

Components
Button

Android

Code

import { Button } from '@expo/ui/jetpack-compose';

<Button
style={{ flex: 1 }}
variant="default"
onPress={() => {
setEditingProfile(true);
}}>
Edit profile
</Button>
See also: official Jetpack Compose documentation

CircularProgress

Android

Code

import { CircularProgress } from '@expo/ui/jetpack-compose';

<CircularProgress progress={0.5} style={{ width: 300 }} color="blue" elementColors={{ trackColor: '#cccccc' }} />
See also: official Jetpack Compose documentation

ContextMenu
Note: Also known as DropdownMenu.

Android

Code

import { ContextMenu } from '@expo/ui/jetpack-compose';

<ContextMenu style={{ width: 150, height: 50 }}>
<ContextMenu.Items>
<Button
elementColors={{ containerColor: '#0000ff', contentColor: '#00ff00' }}
onPress={() => console.log('Pressed1')}>
Hello
</Button>
<Button
variant="bordered"
color="#ff0000"
onPress={() => console.log('Pressed2')}>
Love it
</Button>
<Picker
label="Doggos"
options={['very', 'veery', 'veeery', 'much']}
variant="menu"
selectedIndex={selectedIndex}
onOptionSelected={({ nativeEvent: { index } }) => setSelectedIndex(index)}
/>
</ContextMenu.Items>
<ContextMenu.Trigger>
<Button variant="bordered" style={{ width: 150, height: 50 }}>
Show Menu
</Button>
</ContextMenu.Trigger>
</ContextMenu>

Show More
See also: official Jetpack Compose documentation

Chip

Android

Code

import { Chip } from '@expo/ui/jetpack-compose';

// Assist chip with icon
<Chip
variant="assist"
label="Book"
leadingIcon="filled.Add"
onPress={() => console.log('Opening flight booking...')}
/>

// Filter chip with selection
<Chip
variant="filter"
label="Images"
leadingIcon="filled.Star"
selected={selectedFilters.includes('Images')}
onPress={() => handleFilterToggle('Images')}
/>

// Input chip with dismiss
<Chip
variant="input"
label="Work"
leadingIcon="filled.Create"
onDismiss={() => handleInputDismiss('Work')}
/>

// Suggestion chip
<Chip
variant="suggestion"
label="Nearby"
leadingIcon="filled.LocationOn"
onPress={() => console.log('Searching nearby...')}
/>

Show More
See also: official Jetpack Compose documentation

DateTimePicker (date)

Android

Code

import { DateTimePicker } from '@expo/ui/jetpack-compose';

<DateTimePicker
onDateSelected={date => {
setSelectedDate(date);
}}
displayedComponents='date'
initialDate={selectedDate.toISOString()}
variant='picker'
/>
See also: official Jetpack Compose documentation

DateTimePicker (time)

Android

Code

import { DateTimePicker } from '@expo/ui/jetpack-compose';

<DateTimePicker
onDateSelected={date => {
setSelectedDate(date);
}}
displayedComponents='hourAndMinute'
initialDate={selectedDate.toISOString()}
variant='picker'
/>
See also: official Jetpack Compose documentation

LinearProgress

Android

Code

import { LinearProgress } from '@expo/ui/jetpack-compose';

<LinearProgress progress={0.5} style={{ width: 300 }} color="red" />
See also: official Jetpack Compose documentation

Picker (radio)

Android

Code

import { Picker } from '@expo/ui/jetpack-compose';

<Picker
options={['$', '$$', '$$$', '$$$$']}
selectedIndex={selectedIndex}
onOptionSelected={({ nativeEvent: { index } }) => {
setSelectedIndex(index);
}}
variant="radio"
/>
See also: official Jetpack Compose documentation

Picker (segmented)

Android

Code

import { Picker } from '@expo/ui/jetpack-compose';

<Picker
options={['$', '$$', '$$$', '$$$$']}
selectedIndex={selectedIndex}
onOptionSelected={({ nativeEvent: { index } }) => {
setSelectedIndex(index);
}}
variant="segmented"
/>
See also: official Jetpack Compose documentation

Slider

Android

Code

import { Slider } from '@expo/ui/jetpack-compose';

<Slider
style={{ minHeight: 60 }}
value={value}
onValueChange={(value) => {
setValue(value);
}}
/>
See also: official Jetpack Compose documentation

Switch (toggle)
Note: also known as Toggle.

Android

Code

import { Switch } from '@expo/ui/jetpack-compose';

<Switch
value={checked}
onValueChange={checked => {
setChecked(checked);
}}
color="#ff0000"
label="Play music"
variant="switch"
/>
See also: official Jetpack Compose documentation

Switch (checkbox)

Android

Code

import { Switch } from '@expo/ui/jetpack-compose';

<Switch
value={checked}
onValueChange={checked => {
setChecked(checked);
}}
label="Play music"
color="#ff0000"
variant="checkbox"
/>
See also: official Jetpack Compose documentation

TextInput

Android

Code

import { TextInput } from '@expo/ui/jetpack-compose';

<TextInput autocorrection={false} defaultValue="A single line text input" onChangeText={setValue} />
See also: official Jetpack Compose documentation

API
Full documentation is not yet available. Use TypeScript types to explore the API.

// Import from the Jetpack Compose package
import { Button } from '@expo/ui/jetpack-compose';
