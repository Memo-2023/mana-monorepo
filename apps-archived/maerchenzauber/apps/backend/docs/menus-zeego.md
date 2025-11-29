Getting Started
Install Zeego
Start by installing Zeego:

yarn add zeego
For upgrading from Zeego 2 to Zeego 3, see the upgrade guide.

Install peer dependencies
A note for monorepo users: install these in the directory of your native app, not in the root of the monorepo.

The following exact versions must be installed. Please reference the compatibility table for the versions that work with your setup.

iOS Dependencies
yarn
yarn add react-native-ios-context-menu@3.1.0 react-native-ios-utilities@5.1.2
npm
npm i \
 react-native-ios-context-menu@3.1.0 \
 react-native-ios-utilities@5.1.2 \
 --legacy-peer-deps
Android Dependencies
yarn
yarn add @react-native-menu/menu@1.2.2
npm
npm i @react-native-menu/menu@1.2.2 --legacy-peer-deps
Compatibility Table
Given a Zeego version (start there), see the dependencies to the right that it is compatible with.

Zeego React Native New Arch Expo SDK react-native-menu react-native-ios-context-menu react-native-ios-utilities
3 0.76 or 0.77 ✅ (optional) 52+ 1.2.2 3.1.0 5.1.2
2 0.74 ❌ 51, 50, 49* 1.0.2 2.5.1 4.5.3
*For Expo SDK 49 or lower, click here
Frameworks
Expo
Expo users need to use a custom development client, since Zeego uses native code.

After installing Zeego and its peer dependencies, you'll need to rebuild your custom development client:

expo run:ios -d
tip
To install your dev client on your iPhone, make sure it's plugged in to your Mac. If it doesn't show up, you may need to run expo prebuild -p ios, open ios/YourApp.xcworspace in XCode, and make sure your Apple team is properly set up.

After the development client build is complete, you can run your app in dev mode:

npx expo start --dev-client
If your app is on the App Store, you'll need to deploy a new build too:

eas build --platform ios --autosubmit
Zeego will not work with Expo Go.

If you aren't familiar with how Expo works / what custom development clients are, I recommend using EAS (Expo's hosted build service.) As long as you eas build, it will work.

Solito/Next.js
You need to add zeego to your transpilePackages in next.config.js.

// next.config.js
module.exports = {
transpilePackages: ['zeego'],
}
Vanilla React Native
Run pod install in your ios folder.

Usage
Here we'll look at a quick overview of what it looks like to use Zeego.

For a full overview of using custom styles and components, see the styling guide.

1. Create your primitives
   Create a file for your primitives, and create each component.

Here, you can add custom styles and interactions. To keep your styles and components consistent, add them all in this file and re-export them.

If you've used Radix UI before, this will look familiar.

// design-system/dropdown-menu.tsx
import \* as DropdownMenu from 'zeego/dropdown-menu'
export const DropdownMenuRoot = DropdownMenu.Root
export const DropdownMenuContent = DropdownMenu.Content
// notice that we're using the create() function
export const DropdownMenuItem = DropdownMenu.create(
(props: React.ComponentProps<typeof DropdownMenu.Item>) => (
<DropdownMenu.Item {...props} style={{ height: 34 }} />
),
'Item'
)
// ...see "Full code samples" below to see the rest of the file
Notice that the DropdownMenuItem is wrapped with create(). This is a requirement for custom components.

Full code samples
Full dropdown-menu.tsx file
Full context-menu.tsx file 2. Build a menu
Build a menu using the primitives you created.

import { Text } from 'react-native'
import {
DropdownMenuRoot,
DropdownMenuContent,
DropdownMenuTrigger,
DropdownMenuItem,
DropdownMenuItemTitle,
} from '@/design-system/dropdown-menu'
function Menu() {
return (
<DropdownMenuRoot>
<DropdownMenuTrigger>
<Text>Open Dropdown Menu</Text>
</DropdownMenuTrigger>
<DropdownMenuContent>
<DropdownMenuItem key="fernando rojo">
<DropdownMenuItemTitle>Fernando Rojo</DropdownMenuItemTitle>
</DropdownMenuItem>
</DropdownMenuContent>
</DropdownMenuRoot>
)
} 3. Add styles
All Zeego primitives ship unstyled. See the styling guide use your own styles & build custom components.

The styles will apply on web, but other than the Trigger component, your iOS and Android apps will style using the native menu components.

You should make a habit of applying the styles in your primitive file we made above to keep your app's feel consistent.

4. Why the boilerplate?
   You might look at step 1 and think, wait, why do I need to have such a big file to use this library?

The reality is, you don't need to, but you should. By wrapping third-party dependencies in one place and styling them yourself, you own the code more closely. It will allow for consumption of those files to be elegant.

If it looks overwhelming, don't worry. You can just copy-paste and continue.

Dropdown Menu
import \* as DropdownMenu from 'zeego/dropdown-menu'
A menu component anchored to a button pressed by a user.

Platform behavior
Web: Uses Radix UI's unstyled Dropdown Menu component
iOS & Android: Uses each platform's built-in native menu component
Features
Zeego's menu includes Radix UI's features:

Can be controlled or uncontrolled.
Supports submenus with configurable reading direction.
Supports items, labels, & groups of items.
Supports checkable items (single or multiple) with an optional indeterminate state.
Supports modal and non-modal modes.
Customize the side, alignment, offsets, collision handling.
Optionally render a pointing arrow.
Focus is fully managed.
Full keyboard navigation.
Typeahead support.
Dismissing and layering behavior is highly customizable.
Plus other unique ones:

SF Symbols on iOS with color customization
Android system icons
Images on menu items (remote images coming soon)
Installation
Make sure you've followed the getting started guide.

Usage
import \* as DropdownMenu from 'zeego/dropdown-menu'
export function MyMenu() {
return (
<DropdownMenu.Root>
<DropdownMenu.Trigger>
<Button />
</DropdownMenu.Trigger>
<DropdownMenu.Content>
<DropdownMenu.Label />
<DropdownMenu.Item>
<DropdownMenu.ItemTitle />
</DropdownMenu.Item>
<DropdownMenu.Group>
<DropdownMenu.Item />
</DropdownMenu.Group>
<DropdownMenu.CheckboxItem>
<DropdownMenu.ItemIndicator />
</DropdownMenu.CheckboxItem>
<DropdownMenu.Sub>
<DropdownMenu.SubTrigger />
<DropdownMenu.SubContent />
</DropdownMenu.Sub>
<DropdownMenu.Separator />
<DropdownMenu.Arrow />
</DropdownMenu.Content>
</DropdownMenu.Root>
)
}
Web Usage
As of Zeego v2, any component available on Radix UI's DropdownMenu is also available on Zeego's DropdownMenu, and accepts the same props, when rendered on web.

Since Zeego is directly built on top of Radix UI for Web, you can not use StyleSheet.create objects on Zeego's style props.

Instead, to style items, you can do one of the following:

Use inline style prop
Use className, common for Tailwind users a. You can optionally use CSS file imports or CSS modules
Use the create function to create your own component and style it however you want
Component API
Root
Required component at the root of your menu.

Prop Required Default Platforms
onOpenChange web, ios
onOpenWillChange ios
For more web props, see the Radix UI docs for DropdownMenu.Root.

Content
Holds all of the content for your menu.

See the Radix UI docs for DropdownMenu.Content to see usage for each prop.

Prop Required Default Platforms
side bottom web
sideOffset 0 web
align center web
alignOffset 0 web
collisionPadding 0 web
avoidCollisions true web
For more web props, see the Radix UI docs for DropdownMenu.Content.

Trigger
Wraps the trigger for your menu. The content will be anchored to the trigger.

Prop Required Default Platforms
style web, ios, android
action press ios, android
asChild false web, ios, android
The action can be longPress or press.

For more web props, see the Radix UI docs for DropdownMenu.Trigger.

Item
Dropdown menu item. Typically a row with text inside of it.

The key prop is required. The same key must not be used more than once in the same menu.

Prop Required Default Platforms
key Yes web, ios, android
disabled web, ios, android
destructive web, ios, android
hidden ios, android
style web
onSelect web
textValue web
onFocus web
onBlur web
On web, it will render its children and apply styles. On other platforms, it simply maps to a native menu item.

To render text, use the ItemTitle.

<DropdownMenu.Item key="item-1" onSelect={() => console.log('item-1 selected')}>
<DropdownMenu.ItemTitle>Item Title</DropdownMenu.ItemTitle>
</DropdownMenu.Item>
For more web props, see the Radix UI docs for DropdownMenu.Item.

ItemTitle
The style prop will optionally style text on web.

Prop Required Default Platforms
style web,
children Yes web , ios, android
ItemTitle accepts either a string or React element as the child. A string is the most common usage.

<DropdownMenu.Item key="cars">
<DropdownMenu.ItemTitle>Cars</DropdownMenu.ItemTitle>
</DropdownMenu.Item>
React element child
ItemTitle supports passing a text node as the child. However, you must pass a textValue prop to the parent Item for this to work. It will error otherwise.

<DropdownMenu.Item
// this is required when ItemTitle has a React element child
textValue="Cars"
key="cars"

> <DropdownMenu.ItemTitle>

    <Text>
      Cars
    </Text>

<DropdownMenu.ItemTitle>
</DropdownMenu.Item>
This is useful for rendering custom text components on Web. The textValue prop supplied to Item will get used on iOS and Android as the title. On Web, textValue will be used for typeahead purposes, but it will not affect rendering.

ItemIcon
To render an icon on web, pass the icon component as a child.

For iOS and Android, use the respective platform's name as the prop.

On iOS, it renders an SF Symbol if you provide one.

Prop Required Default Platforms
ios ios
androidIconName android
children web
style web
className web
<DropdownMenu.ItemIcon
ios={{
    name: '0.circle.fill', // required
    pointSize: 5,
    weight: 'semibold',
    scale: 'medium',
    // can also be a color string. Requires iOS 15+
    hierarchicalColor: {
      dark: 'blue',
      light: 'green',
    },
    // alternative to hierarchical color. Requires iOS 15+
    paletteColors: [
      {
        dark: 'blue',
        light: 'green',
      },
    ],
  }}

>   <MySvgIconForWeb />
> </DropdownMenu.ItemIcon>
> ItemImage
> Renders an image inside of the item. Works on Web and iOS. On Android, it will be ignored.

Prop Required Default Platforms
source web, ios
style web
resizeMode web
height web
width web
fadeDuration 0 web
accessibilityLabel web
For local images with require or import:

<DropdownMenu.ItemImage
source={require('./image.png')}
height={300}
width={300}
/>
For remote images, you can use the source prop with a URL.

<DropdownMenu.ItemImage
source={{
    uri: `https://my-image-url`,
  }}
height={300}
width={300}
/>
ItemImage with Expo Web / Metro Web
If you are using Solito, Vite, Next.js, or most web-only frameworks, then this does not apply to you.

However, as of Zeego v2, locally-imported images will not work as-is with Metro Web/Expo Web.

To fix this, you should create a custom ItemImage component which wraps Image from react-native:

import { Image } from 'react-native'
import \* as DropdownMenu from 'zeego/dropdown-menu'
const ItemImage = DropdownMenu.create<
React.ComponentProps<typeof DropdownMenu.ItemImage>

> ((props) => {
> return <Image {...props} />
> }, 'ItemImage')
> ItemSubtitle
> Receives children as a string. The style prop will optionally style text on web.

Prop Required Default Platforms
style web,
className web
children web , ios
Android menu items do not currently support subtitles.

Group
Used to group multiple items.

On iOS, items will visually group with a divider like Group Item 1 and Group Item 2 below:

On iOS, you can use the horizontal prop render items like so:

image
Prop Required Default Platforms
children web , ios, android
horizontal ios
To add a title to the group, pass a Label component inside of it:

<DropdownMenu.Group>
<DropdownMenu.Label>Fernando</DropdownMenu.Label>
</DropdownMenu.Group>
For more web props, see the Radix UI docs for DropdownMenu.Group.

CheckboxItem
Usage is similar to Item with added checkbox features.

Prop Required Default Platforms
key Yes web, ios, android
value Yes web, ios, android
disabled web , ios, android
destructive web , ios, android
onValueChange web , ios, android
hidden web , ios, android
textValue web
style web
onFocus web
onBlur web
<DropdownMenu.CheckboxItem
value="on" // or "off" or "mixed"
onValueChange={(next, previous) => {
// update state here
}}
key="fernando"

> <DropdownMenu.ItemIndicator />
> </DropdownMenu.CheckboxItem>
> You can also use a boolean for value, as of 1.3.0:

<DropdownMenu.CheckboxItem
value={true}
onValueChange={(next, previous) => {
// next and previous will still use "on" and "off"
}}
key="fernando"

> <DropdownMenu.ItemIndicator />
> </DropdownMenu.CheckboxItem>
> For more web props, see the Radix UI docs for DropdownMenu.CheckboxItem.

There are a few subtle differences, such as onValueChange vs onCheckedChange, and the Zeego's result being "on" or "off" instead of true or false in the change callback.

ItemIndicator
Used inside of CheckboxItem, the ItemIndicator only renders when the item is checked. This lets you conditionally render a checkmark.

You should pass a checkmark icon as a child for web. On iOS and Android, the built-in checkmark will be used instead.

Prop Required Default Platforms
style web
className web
children web
<DropdownMenu.ItemIndicator>
<CheckmarkIcon /> {/_ Renders on Web only _/}
</DropdownMenu.ItemIndicator>
For more web props, see the Radix UI docs for DropdownMenu.ItemIndicator.

Label
Renders a label. It won't be focusable using arrow keys.

On iOS & Android, only one label is supported (unless it is inside a submenu). It will be displayed at the top of the menu.

Prop Required Default Platforms
style web
className web
children Yes web, ios, android
<DropdownMenu.Label>My Label</DropdownMenu.Label>
Best used within a Group.

For more web props, see the Radix UI docs for DropdownMenu.Label.

Arrow
Renders an arrow on web only. This helps point the content to the trigger. The Arrow must be rendered inside of Content.

By default, Radix renders the arrow as an <svg> element. You can customize the SVG arrow color by passing a fill prop, className, or style object with a fill property.

caution
Because the arrow is an <svg> element, its style prop is not React Native compatible. Styling it with React Native libraries may not work as expected. If you would like to render a custom styled <View>, use the asChild prop instead of wrapping this component.

Prop Required Default Platforms
width 10 web
height 5 web
fill web
style web
className web
asChild false web
See the Radix UI docs for DropdownMenu.Arrow.

Separator
Renders a content separator on web only.

Prop Required Default Platforms
style web
className web
See the Radix UI docs for DropdownMenu.Separator.

Sub
<DropdownMenu.Root>
<DropdownMenu.Trigger>
<Button />
</DropdownMenu.Trigger>
<DropdownMenu.Content>
<DropdownMenu.Sub>
<DropdownMenu.SubTrigger key="sub-menu-trigger">
<DropdownMenu.ItemTitle>Sub Menu</DropdownMenu.ItemTitle>
</DropdownMenu.SubTrigger>
<DropdownMenu.SubContent>
<DropdownMenu.Item key="sub-menu-item">
<DropdownMenu.ItemTitle>Sub Menu Item</DropdownMenu.ItemTitle>
</DropdownMenu.Item>
</DropdownMenu.SubContent>
</DropdownMenu.Sub>
</DropdownMenu.Content>
</DropdownMenu.Root>
Renders the parts of a submenu.

Prop Required Default Platforms
onOpenChange web
SubContent
See the Radix UI docs for DropdownMenu.SubContent to see usage for each prop.

Prop Required Default Platforms
side bottom web
sideOffset 0 web
align center web
alignOffset 0 web
collisionPadding 0 web
avoidCollisions true web
SubTrigger
An item that opens a submenu. Must be rendered inside DropdownMenu.Sub.

Prop Required Default Platforms
key Yes web, ios, android
disabled web , ios, android
destructive web , ios, android
hidden ios, android
style web
onSelect web
textValue web
onFocus web
onBlur web
For more web props, see the Radix UI docs for DropdownMenu.SubTrigger.

Context Menu
import \* as ContextMenu from 'zeego/context-menu'
A menu component anchored to an element. On web, the menu is triggered by a right click. On iOS & Android, it is triggered by a long press.

Platform behavior
Web: Uses Radix UI's unstyled Context Menu component
iOS & Android: Uses each platform's built-in native context menu component
Features
Zeego's menu includes Radix UI's features:

Can be controlled or uncontrolled.
Supports submenus with configurable reading direction.
Supports items, labels, & groups of items.
Supports checkable items (single or multiple) with an optional indeterminate state.
Supports modal and non-modal modes.
Customize the side, alignment, offsets, & collision handling.
Optionally render a pointing arrow.
Focus is fully managed.
Full keyboard navigation.
Typeahead support.
Dismissing and layering behavior is highly customizable.
Plus other unique ones:

Custom element preview on iOS
SF Symbols on iOS with color customization
Android system icons
Images on menu items (remote images coming soon)
Installation
Make sure you've followed the getting started guide.

Usage
import \* as ContextMenu from 'zeego/context-menu'
export function MyMenu() {
return (
<ContextMenu.Root>
<ContextMenu.Trigger>
<Button />
</ContextMenu.Trigger>
<ContextMenu.Content>
<ContextMenu.Preview>{() => <Preview />}</ContextMenu.Preview>
<ContextMenu.Label />
<ContextMenu.Item>
<ContextMenu.ItemTitle />
</ContextMenu.Item>
<ContextMenu.Group>
<ContextMenu.Item />
</ContextMenu.Group>
<ContextMenu.CheckboxItem>
<ContextMenu.ItemIndicator />
</ContextMenu.CheckboxItem>
<ContextMenu.Sub>
<ContextMenu.SubTrigger />
<ContextMenu.SubContent />
</ContextMenu.Sub>
<ContextMenu.Separator />
<ContextMenu.Arrow />
</ContextMenu.Content>
</ContextMenu.Root>
)
}
Web Usage
As of Zeego v2, any component available on Radix UI's ContextMenu is also available on Zeego's ContextMenu, and accepts the same props, when rendered on web.

Since Zeego is directly built on top of Radix UI for Web, you can not use StyleSheet.create objects on Zeego's style props.

Instead, to style items, you can do one of the following:

Use inline style prop
Use className, common for Tailwind users a. You can optionally use CSS file imports or CSS modules
Use the create function to create your own component and style it however you want
Component API
Root
Required component at the root of your menu.

Prop Required Default Platforms
onOpenChange web, ios
onOpenWillChange ios
For more web props, see the Radix UI docs for ContextMenu.Root.

Content
Holds all of the content for your menu.

See the Radix UI docs for ContextMenu.Content to see usage for each prop.

Prop Required Default Platforms
side bottom web
sideOffset 0 web
align center web
alignOffset 0 web
collisionPadding 0 web
avoidCollisions true web
For more web props, see the Radix UI docs for ContextMenu.Content.

Trigger
Wraps the trigger for your menu. The content will be anchored to the trigger.

Prop Required Default Platforms
style web, ios, android
action longPress ios, android
asChild false web, ios, android
The action can be longPress or press.

For more web props, see the Radix UI docs for ContextMenu.Trigger.

Preview
Render a custom component when the context menu is visible on iOS.

Requires passing a function as a child.

The child element won't mount until the menu has been opened.

Prop Required Default Platforms
style ios
size ios
onPress ios
isResizeAnimated true ios
borderRadius ios
backgroundColor ios
preferredCommitStyle ios
<ContextMenu.Preview
// optional props:
preferredCommitStyle="pop" // or "dismiss"
backgroundColor={{
    // or a color string directly
    dark: 'black',
    light: 'white',
  }}

> {() => <Preview />}
> </ContextMenu.Preview>
> Item
> Context menu item. Typically a row with text inside of it.

The key prop is required. The key must be unique within the entire menu, including submenus.

Prop Required Default Platforms
key Yes web, ios, android
disabled web, ios, android
destructive web, ios, android
hidden ios, android
style web
onSelect web, android, ios
textValue web
onFocus web
onBlur web
On web, Item will render its a component as its child and apply styles. On other platforms, it simply renders a native menu item, and styles do not apply.

To render text inside of an item, use the ItemTitle.

<ContextMenu.Item key="item-1" onSelect={() => console.log('item-1 selected')}>
<ContextMenu.ItemTitle>Item Title</ContextMenu.ItemTitle>
</ContextMenu.Item>
For more web props, see the Radix UI docs for ContextMenu.Item.

ItemTitle
The style prop will optionally style text on web.

Prop Required Default Platforms
style web,
children Yes web , ios, android
ItemTitle either a string or React element as the child. A string is the most common usage. If you don't use a string, you must pass a textValue prop to the parent Item for it to work. It will error otherwise.

<ContextMenu.Item key="cars">
<ContextMenu.ItemTitle>Cars</ContextMenu.ItemTitle>
</ContextMenu.Item>
React element child
ItemTitle supports passing a text node as the child. However, you must pass a textValue prop to the parent Item for this to work. It will error otherwise.

<ContextMenu.Item
// this is required when ItemTitle has a React element child
textValue="Cars"
key="cars"

> <ContextMenu.ItemTitle>

    <Text>
      Cars
    </Text>

<ContextMenu.ItemTitle>
</ContextMenu.Item>
The textValue prop will become the title on iOS and Android as the title. On Web, textValue will be used for typeahead, but it will not affect rendering.

ItemIcon
To render an icon on web, pass the icon component as a child.

For iOS and Android, use the ios prop and androidIconName prop.

On iOS, it renders an SF Symbol if you provide one.

On Android, it renders a Material Icon.

Prop Required Default Platforms
ios ios
androidIconName android
children web
style web
className web
<ContextMenu.ItemIcon
ios={{
    name: '0.circle.fill', // required
    pointSize: 5,
    weight: 'semibold',
    scale: 'medium',
    // can also be a color string. Requires iOS 15+
    hierarchicalColor: {
      dark: 'blue',
      light: 'green',
    },
    // alternative to hierarchical color. Requires iOS 15+
    paletteColors: [
      {
        dark: 'blue',
        light: 'green',
      },
    ],
  }}

>   <MySvgIconForWeb />
> </ContextMenu.ItemIcon>
> ItemImage
> Renders an image inside of the item. Works on Web and iOS. On Android, it will be ignored.

Prop Required Default Platforms
source web, ios
style web
resizeMode web
height web
width web
fadeDuration 0 web
accessibilityLabel web
<ContextMenu.ItemImage
source={require('./image.png')}
height={300}
width={300}
/>
Once it works, usage will work like so:

<ContextMenu.ItemImage
source={{
    uri: `https://my-image-url`,
  }}
height={300}
width={300}
/>
ItemImage with Expo Web / Metro Web
If you are using Solito, Vite, Next.js, or most web-only frameworks, then this does not apply to you.

However, as of Zeego v2, locally-imported images will not work as-is with Metro Web/Expo Web.

To fix this, you should create a custom ItemImage component which wraps Image from react-native:

import { Image } from 'react-native'
import \* as ContextMenu from 'zeego/context-menu'
const ItemImage = ContextMenu.create<
React.ComponentProps<typeof ContextMenu.ItemImage>

> ((props) => {
> return <Image {...props} />
> }, 'ItemImage')
> ItemSubtitle
> Receives children as a string. The style prop will optionally style text on web.

Prop Required Default Platforms
style web,
className web
children web , ios
Android menu items do not currently support subtitles.

Group
Used to group multiple items.

On iOS, items will visually group with a divider like Group Item 1 and Group Item 2 below:

On iOS, you can use the horizontal prop render items like so:

image
Prop Required Default Platforms
children web , ios, android
horizontal ios
To add a title to the group, pass a Label component inside of it:

<ContextMenu.Group>
<ContextMenu.Label>Fernando's List</ContextMenu.Label>
<ContextMenu.Item key="patos">
<ContextMenu.ItemTitle>PATOS Shoes</ContextMenu.ItemTitle>
</ContextMenu.Item>
<ContextMenu.Item key="moti">
<ContextMenu.ItemTitle>Moti</ContextMenu.ItemTitle>
</ContextMenu.Item>
<ContextMenu.Item key="solito">
<ContextMenu.ItemTitle>Solito</ContextMenu.ItemTitle>
</ContextMenu.Item>
</ContextMenu.Group>
For more web props, see the Radix UI docs for ContextMenu.Group.

CheckboxItem
Usage is similar to Item with added checkbox features.

Prop Required Default Platforms
key Yes web, ios, android
value Yes web, ios, android
disabled web , ios, android
destructive web , ios, android
onValueChange web , ios, android
hidden web , ios, android
textValue web
style web
onFocus web
onBlur web
<ContextMenu.CheckboxItem
value="on" // or "off" or "mixed"
onValueChange={(next, previous) => {
// update state here
}}
key="fernando"

> <ContextMenu.ItemIndicator />
> </ContextMenu.CheckboxItem>
> You can also use a boolean for value, as of 1.3.0:

<ContextMenu.CheckboxItem
value={true}
onValueChange={(next, previous) => {
// next and previous will still use "on" and "off"
}}
key="fernando"

> <ContextMenu.ItemIndicator />
> </ContextMenu.CheckboxItem>
> For more web props, see the Radix UI docs for ContextMenu.CheckboxItem.

There are a few subtle differences, such as onValueChange vs onCheckedChange, and the Zeego's result being "on" or "off" instead of true or false in the change callback.

ItemIndicator
Used inside of CheckboxItem, the ItemIndicator only renders when the item is checked. This lets you conditionally render a checkmark.

You should pass a checkmark icon as a child for web. On iOS and Android, the built-in checkmark will be used instead.

Prop Required Default Platforms
style web
className web
children web
<ContextMenu.ItemIndicator>
<CheckmarkIcon /> {/_ Renders on Web only _/}
</ContextMenu.ItemIndicator>
For more web props, see the Radix UI docs for ContextMenu.ItemIndicator.

Label
Renders a label. It won't be focusable using arrow keys.

On iOS & Android, only one label is supported (unless it is inside a submenu). It will be displayed at the top of the menu.

Prop Required Default Platforms
style web
className web
children Yes web, ios, android
<ContextMenu.Label>My Label</ContextMenu.Label>
Best used within a Group.

For more web props, see the Radix UI docs for ContextMenu.Label.

Arrow
Renders an arrow on web only. This helps point the content to the trigger. The Arrow must be rendered inside of Content.

By default, Radix renders the arrow as an <svg> element. You can customize the SVG arrow color by passing a fill prop, className, or style object with a fill property.

caution
Because the arrow is an <svg> element, its style prop is not React Native compatible. Styling it with React Native libraries may not work as expected. If you would like to render a custom styled <View>, use the asChild prop instead of wrapping this component.

Prop Required Default Platforms
width 10 web
height 5 web
fill web
style web
className web
asChild false web
See the Radix UI docs for ContextMenu.Arrow.

Separator
Renders a content separator on web only.

Prop Required Default Platforms
style web
className web
See the Radix UI docs for ContextMenu.Separator.

Sub
<ContextMenu.Root>
<ContextMenu.Trigger>
<Button />
</ContextMenu.Trigger>
<ContextMenu.Content>
<ContextMenu.Sub>
<ContextMenu.SubTrigger key="sub-menu-trigger">
<ContextMenu.ItemTitle>Sub Menu</ContextMenu.ItemTitle>
</ContextMenu.SubTrigger>
<ContextMenu.SubContent>
<ContextMenu.Item key="sub-menu-item">
<ContextMenu.ItemTitle>Sub Menu Item</ContextMenu.ItemTitle>
</ContextMenu.Item>
</ContextMenu.SubContent>
</ContextMenu.Sub>
</ContextMenu.Content>
</ContextMenu.Root>
Renders the parts of a submenu.

Prop Required Default Platforms
onOpenChange web
children web, ios, android
See the Radix UI docs for ContextMenu.Sub.

SubContent
See the Radix UI docs for ContextMenu.SubContent to see usage for each prop.

Prop Required Default Platforms
side bottom web
sideOffset 0 web
align center web
alignOffset 0 web
collisionPadding 0 web
avoidCollisions true web
children web, ios, android
For more web props, see the Radix UI docs for ContextMenu.SubContent.

SubTrigger
An item that opens a submenu. Must be rendered inside ContextMenu.Sub.

Prop Required Default Platforms
key Yes web, ios, android
disabled web , ios, android
destructive web , ios, android
hidden ios, android
style web
onSelect web
textValue web
onFocus web
onBlur web
children web, ios, android
For more web props, see the Radix UI docs for ContextMenu.SubTrigger.

Tailwind / Nativewind
Zero config ⚡️
As of Zeego 2, Zeego uses plain Radix UI on Web and therefore does not require any configuration for using Tailwind CSS or Nativewind.
