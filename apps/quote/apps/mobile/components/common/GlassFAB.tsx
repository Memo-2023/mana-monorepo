import React from 'react';
import { View, Pressable, ViewStyle } from 'react-native';
import { BlurView } from 'expo-blur';
import { Icon } from '~/components/Icon';
import { useIsDarkMode } from '~/store/settingsStore';
import * as Haptics from 'expo-haptics';
import Animated, { 
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  FadeIn,
  ZoomIn
} from 'react-native-reanimated';

interface GlassFABProps {
  onPress: () => void;
  icon?: string;
  size?: 'small' | 'medium' | 'large';
  position?: 'bottom-right' | 'bottom-left' | 'bottom-center';
  style?: ViewStyle;
  disabled?: boolean;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function GlassFAB({ 
  onPress, 
  icon = 'add',
  size = 'medium',
  position = 'bottom-right',
  style,
  disabled = false
}: GlassFABProps) {
  const isDarkMode = useIsDarkMode();
  const scale = useSharedValue(1);
  const rotation = useSharedValue(0);

  // Size configurations
  const sizes = {
    small: { container: 49, icon: 24, blur: 70 },
    medium: { container: 57, icon: 30, blur: 80 },
    large: { container: 65, icon: 36, blur: 90 }
  };

  const currentSize = sizes[size];

  // Position configurations
  const positions = {
    'bottom-right': 'bottom-28 right-7',
    'bottom-left': 'bottom-28 left-7',
    'bottom-center': 'bottom-28 left-1/2 -translate-x-1/2'
  };

  const handlePressIn = () => {
    if (!disabled) {
      scale.value = withSpring(0.92);
    }
  };

  const handlePressOut = () => {
    if (!disabled) {
      scale.value = withSpring(1);
    }
  };

  const handlePress = () => {
    if (!disabled) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      rotation.value = withSpring(rotation.value + 90);
      onPress();
    }
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: scale.value },
      { rotate: `${rotation.value}deg` }
    ]
  }));

  const opacityStyle = useAnimatedStyle(() => ({
    opacity: disabled ? 0.5 : 1
  }));

  return (
    <Animated.View 
      entering={FadeIn.delay(200).duration(400).springify()}
      className={`absolute ${positions[position]}`}
      style={[opacityStyle, style]}
    >
      <AnimatedPressable
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={handlePress}
        style={animatedStyle}
        disabled={disabled}
      >
        <View className="relative">
        {/* Outer glass container with clean border */}
        <View 
          className="rounded-full overflow-hidden shadow-xl"
          style={{
            width: currentSize.container,
            height: currentSize.container,
            borderWidth: 1,
            borderColor: isDarkMode 
              ? 'rgba(255, 255, 255, 0.2)' 
              : 'rgba(255, 255, 255, 0.8)',
          }}
        >
          <BlurView 
            intensity={currentSize.blur}
            tint={isDarkMode ? 'dark' : 'light'}
            style={{ flex: 1 }}
          />
          {/* Glass overlay - more subtle to show blur through */}
          <View 
            className="absolute inset-0" 
            style={{
              backgroundColor: isDarkMode 
                ? 'rgba(255, 255, 255, 0.05)' 
                : 'rgba(255, 255, 255, 0.3)',
            }}
          />
        </View>

        {/* Icon container - centered */}
        <View 
          className="absolute inset-0 rounded-full items-center justify-center"
        >
          <Icon
            name={icon}
            size={currentSize.icon}
            color={isDarkMode ? '#ffffff' : '#000000'}
          />
        </View>

        {/* Optional badge or notification dot */}
        {/* Can be added here if needed */}
      </View>
      </AnimatedPressable>
    </Animated.View>
  );
}