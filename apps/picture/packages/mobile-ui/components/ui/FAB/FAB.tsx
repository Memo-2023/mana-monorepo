import { Pressable, ViewStyle } from 'react-native';
import Animated, {
  useAnimatedStyle,
  withSpring,
  useSharedValue,
} from 'react-native-reanimated';
import { Icon } from '../Icon/Icon';

export type FABProps = {
  /** Icon name */
  icon: string;
  /** Press handler */
  onPress: () => void;
  /** Position from bottom */
  bottom?: number;
  /** Position from right (default positioning) */
  right?: number;
  /** Position from left (alternative positioning) */
  left?: number;
  /** Background color */
  backgroundColor?: string;
  /** Icon color */
  iconColor?: string;
  /** Icon size */
  iconSize?: number;
  /** Additional styles */
  style?: ViewStyle;
};

/**
 * Floating Action Button with spring animation.
 *
 * @example
 * ```tsx
 * <FAB
 *   icon="add"
 *   onPress={() => console.log('Pressed')}
 * />
 *
 * <FAB
 *   icon="camera"
 *   backgroundColor="#10B981"
 *   onPress={() => {}}
 *   bottom={20}
 *   right={20}
 * />
 * ```
 */
export function FAB({
  icon,
  onPress,
  bottom = 100,
  right,
  left,
  backgroundColor = '#3B82F6',
  iconColor = '#FFFFFF',
  iconSize = 24,
  style,
}: FABProps) {
  const pressScale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: pressScale.value }],
    };
  });

  const handlePressIn = () => {
    pressScale.value = withSpring(0.9, {
      damping: 10,
      stiffness: 400,
    });
  };

  const handlePressOut = () => {
    pressScale.value = withSpring(1, {
      damping: 10,
      stiffness: 400,
    });
  };

  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          ...(left !== undefined ? { left } : { right: right ?? 16 }),
          bottom: bottom,
          zIndex: 10,
        },
        animatedStyle,
        style,
      ]}
    >
      <Pressable
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={{
          backgroundColor,
          borderRadius: 28,
          width: 56,
          height: 56,
          justifyContent: 'center',
          alignItems: 'center',
          shadowColor: backgroundColor,
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.4,
          shadowRadius: 8,
          elevation: 8,
        }}
      >
        <Icon name={icon} size={iconSize} color={iconColor} />
      </Pressable>
    </Animated.View>
  );
}
