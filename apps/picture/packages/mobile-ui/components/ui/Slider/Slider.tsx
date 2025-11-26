import { View, StyleSheet, ViewStyle } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  runOnJS,
  interpolate,
  Extrapolation,
} from 'react-native-reanimated';

export type SliderProps = {
  /** Minimum value */
  minimumValue: number;
  /** Maximum value */
  maximumValue: number;
  /** Current value */
  value: number;
  /** Callback when value changes */
  onValueChange: (value: number) => void;
  /** Color of the filled track */
  minimumTrackTintColor?: string;
  /** Color of the unfilled track */
  maximumTrackTintColor?: string;
  /** Color of the thumb */
  thumbTintColor?: string;
  /** Additional styles */
  style?: ViewStyle;
};

/**
 * Interactive slider component built with react-native-reanimated and gesture-handler.
 *
 * @example
 * ```tsx
 * const [value, setValue] = useState(50);
 *
 * <Slider
 *   minimumValue={0}
 *   maximumValue={100}
 *   value={value}
 *   onValueChange={setValue}
 * />
 * ```
 */
export function Slider({
  minimumValue,
  maximumValue,
  value,
  onValueChange,
  minimumTrackTintColor = '#6366f1',
  maximumTrackTintColor = '#374151',
  thumbTintColor = '#818cf8',
  style,
}: SliderProps) {
  const trackWidth = useSharedValue(0);
  const thumbPosition = useSharedValue(
    ((value - minimumValue) / (maximumValue - minimumValue)) * 100
  );

  const updateValue = (position: number) => {
    const percentage = Math.max(0, Math.min(position / trackWidth.value, 1));
    const newValue = minimumValue + percentage * (maximumValue - minimumValue);
    onValueChange(newValue);
  };

  const panGesture = Gesture.Pan()
    .onStart((e) => {
      const newPosition = e.x;
      thumbPosition.value = (newPosition / trackWidth.value) * 100;
      runOnJS(updateValue)(newPosition);
    })
    .onChange((e) => {
      const newPosition = Math.max(0, Math.min(e.x, trackWidth.value));
      thumbPosition.value = (newPosition / trackWidth.value) * 100;
      runOnJS(updateValue)(newPosition);
    });

  const tapGesture = Gesture.Tap().onStart((e) => {
    const newPosition = e.x;
    thumbPosition.value = (newPosition / trackWidth.value) * 100;
    runOnJS(updateValue)(newPosition);
  });

  const combinedGesture = Gesture.Race(panGesture, tapGesture);

  const thumbStyle = useAnimatedStyle(() => {
    const left = interpolate(
      thumbPosition.value,
      [0, 100],
      [0, trackWidth.value],
      Extrapolation.CLAMP
    );
    return {
      transform: [{ translateX: left - 12 }],
    };
  });

  const fillStyle = useAnimatedStyle(() => {
    return {
      width: `${thumbPosition.value}%`,
    };
  });

  // Update thumb position when value prop changes
  const currentPercentage =
    ((value - minimumValue) / (maximumValue - minimumValue)) * 100;
  if (Math.abs(thumbPosition.value - currentPercentage) > 0.1) {
    thumbPosition.value = currentPercentage;
  }

  return (
    <View style={[styles.container, style]}>
      <GestureDetector gesture={combinedGesture}>
        <View
          style={styles.track}
          onLayout={(e) => {
            trackWidth.value = e.nativeEvent.layout.width;
          }}
        >
          <View
            style={[styles.trackBackground, { backgroundColor: maximumTrackTintColor }]}
          />
          <Animated.View
            style={[
              styles.trackFill,
              { backgroundColor: minimumTrackTintColor },
              fillStyle,
            ]}
          />
          <Animated.View
            style={[styles.thumb, { backgroundColor: thumbTintColor }, thumbStyle]}
          />
        </View>
      </GestureDetector>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 40,
    justifyContent: 'center',
  },
  track: {
    height: 4,
    position: 'relative',
    justifyContent: 'center',
  },
  trackBackground: {
    height: 4,
    borderRadius: 2,
    position: 'absolute',
    width: '100%',
  },
  trackFill: {
    height: 4,
    borderRadius: 2,
    position: 'absolute',
  },
  thumb: {
    width: 24,
    height: 24,
    borderRadius: 12,
    position: 'absolute',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
});
