import React from 'react';
import { TouchableOpacity, Text, View } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  interpolate,
} from 'react-native-reanimated';
import { SFSymbol } from './SFSymbol';

interface FloatingActionButtonProps {
  onPress: () => void;
  icon?: string;
  sfSymbol?: string;
  fallbackIcon?: string;
  disabled?: boolean;
  size?: 'normal' | 'large';
  position?: 'right' | 'center' | 'left';
}

const AnimatedTouchableOpacity = Animated.createAnimatedComponent(TouchableOpacity);

export const FloatingActionButton: React.FC<FloatingActionButtonProps> = ({
  onPress,
  icon = '+',
  sfSymbol,
  fallbackIcon,
  disabled = false,
  size = 'normal',
  position = 'right',
}) => {
  const pressed = useSharedValue(false);

  const animatedStyle = useAnimatedStyle(() => {
    const scale = interpolate(pressed.value ? 1 : 0, [0, 1], [1, 0.95]);

    return {
      transform: [{ scale: withSpring(scale) }],
    };
  });

  const handlePressIn = () => {
    pressed.value = true;
  };

  const handlePressOut = () => {
    pressed.value = false;
  };

  const getContainerStyle = () => {
    const base = { position: 'absolute' as const, bottom: 24, zIndex: 50 };
    switch (position) {
      case 'center':
        return {
          ...base,
          width: '100%',
          alignItems: 'center' as const,
        };
      case 'left':
        return { ...base, left: 24 };
      case 'right':
      default:
        return { ...base, right: 24 };
    }
  };

  const getSizeStyle = () => {
    switch (size) {
      case 'large':
        return { width: 80, height: 80 };
      case 'normal':
      default:
        return { width: 64, height: 64 };
    }
  };

  const getIconSize = () => {
    switch (size) {
      case 'large':
        return 32;
      case 'normal':
      default:
        return 24;
    }
  };

  const getTextSize = () => {
    switch (size) {
      case 'large':
        return 'text-3xl';
      case 'normal':
      default:
        return 'text-2xl';
    }
  };

  const renderIcon = () => {
    if (sfSymbol && fallbackIcon) {
      return (
        <SFSymbol
          name={sfSymbol}
          fallbackIcon={fallbackIcon as any}
          size={getIconSize()}
          color="white"
        />
      );
    }
    return <Text className={`${getTextSize()} font-light text-white`}>{icon}</Text>;
  };

  const combinedStyle = [
    animatedStyle,
    getSizeStyle(),
    position === 'center' ? {} : getContainerStyle(),
  ];

  const containerStyle = position === 'center' ? getContainerStyle() : {};

  if (position === 'center') {
    return (
      <View style={containerStyle}>
        <AnimatedTouchableOpacity
          onPress={onPress}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          disabled={disabled}
          activeOpacity={0.8}
          style={[animatedStyle, getSizeStyle()]}
          className={`
            items-center justify-center rounded-full shadow-lg
            ${disabled ? 'bg-gray-400' : 'bg-indigo-500'}
          `}>
          {renderIcon()}
        </AnimatedTouchableOpacity>
      </View>
    );
  }

  return (
    <AnimatedTouchableOpacity
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled}
      activeOpacity={0.8}
      style={combinedStyle}
      className={`
        items-center justify-center rounded-full shadow-lg
        ${disabled ? 'bg-gray-400' : 'bg-indigo-500'}
      `}>
      {renderIcon()}
    </AnimatedTouchableOpacity>
  );
};
