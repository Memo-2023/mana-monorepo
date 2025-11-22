Expo LinearGradient


A universal React component that renders a gradient view.

expo-linear-gradient provides a native React view that transitions between multiple colors in a linear direction.

Installation
Terminal

Copy

npx expo install expo-linear-gradient
If you are installing this in an existing React Native app, start by installing expo in your project. Then, follow the additional instructions as mentioned by the library's README under "Installation in bare React Native projects" section.

Usage
Linear Gradient

Copy


Open in Snack


import { StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

export default function App() {
  return (
    <View style={styles.container}>
      <LinearGradient
        // Background Linear Gradient
        colors={['rgba(0,0,0,0.8)', 'transparent']}
        style={styles.background}
      />
      <LinearGradient
        // Button Linear Gradient
        colors={['#4c669f', '#3b5998', '#192f6a']}
        style={styles.button}>
        <Text style={styles.text}>Sign in with Facebook</Text>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'orange',
  },
  background: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    height: 300,
  },
  button: {
    padding: 15,
    alignItems: 'center',
    borderRadius: 5,
  },
  text: {
    backgroundColor: 'transparent',
    fontSize: 15,
    color: '#fff',
  },
});

Show More
API
import { LinearGradient } from 'expo-linear-gradient';
Component
LinearGradient
Type: React.Component<LinearGradientProps>

Renders a native view that transitions between multiple colors in a linear direction.

LinearGradientProps

colors
Type: readonly
A readonly array of colors that represent stops in the gradient. At least two colors are required (for a single-color background, use the style.backgroundColor prop on a View component).

For TypeScript to know the provided array has 2 or more values, it should be provided "inline" or typed as const.

dither
Optional • Type: boolean • Default: true
Enables or disables paint dithering. Dithering can reduce the gradient color banding issue. Setting false may improve gradient rendering performance.

end
Optional • Type: LinearGradientPoint | null
For example, { x: 0.1, y: 0.2 } means that the gradient will end 10% from the left and 20% from the bottom.

On web, this only changes the angle of the gradient because CSS gradients don't support changing the end position.

locations
Optional • Type: readonly | null • Default: []
A readonly array that contains numbers ranging from 0 to 1, inclusive, and is the same length as the colors property. Each number indicates a color-stop location where each respective color should be located. If not specified, the colors will be distributed evenly across the gradient.

For example, [0.5, 0.8] would render:

the first color, solid, from the beginning of the gradient view to 50% through (the middle);
a gradient from the first color to the second from the 50% point to the 80% point; and
the second color, solid, from the 80% point to the end of the gradient view.
The color-stop locations must be ascending from least to greatest.

start
Optional • Type: LinearGradientPoint | null
For example, { x: 0.1, y: 0.2 } means that the gradient will start 10% from the left and 20% from the top.

On web, this only changes the angle of the gradient because CSS gradients don't support changing the starting position.

Inherited Props
ViewProps
Types
LinearGradientPoint
An object { x: number; y: number } or array [x, y] that represents the point at which the gradient starts or ends, as a fraction of the overall size of the gradient ranging from 0 to 1, inclusive.

Type: NativeLinearGradientPoint or object shaped as below:

Property	Type	Description
x	number	
A number ranging from 0 to 1, representing the position of gradient transformation.

y	number	
A number ranging from 0 to 1, representing the position of gradient transformation.

NativeLinearGradientPoint
Tuple: [x: number, y: number]