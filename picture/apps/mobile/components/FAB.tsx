import { Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import Animated, {
  useAnimatedStyle,
  withSpring,
  useSharedValue,
} from 'react-native-reanimated';
import { useTheme } from '~/contexts/ThemeContext';

type FABProps = {
  icon: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
  bottom?: number;
  right?: number;
  left?: number;
  color?: string;
};

export function FAB({ icon, onPress, bottom = 100, right, left, color }: FABProps) {
  const { theme } = useTheme();
  const fabColor = color || theme.colors.primary.default;
  const iconColor = color === theme.colors.surface ? theme.colors.text.primary : 'white';
  const pressScale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { scale: pressScale.value },
      ],
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
      ]}
    >
      <Pressable
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        className="rounded-full shadow-2xl overflow-hidden"
        style={{
          shadowColor: fabColor,
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.4,
          shadowRadius: 8,
          elevation: 8,
        }}
      >
        <BlurView
          intensity={80}
          tint="systemChromeMaterialDark"
          className="p-4"
        >
          <Ionicons
            name={icon}
            size={24}
            color={iconColor}
          />
        </BlurView>
      </Pressable>
    </Animated.View>
  );
}
