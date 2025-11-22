import React, { useEffect, useRef } from 'react';
import { View, Animated, ViewStyle } from 'react-native';
import { useTheme } from '~/features/theme/ThemeProvider';

interface DotsAnimationProps {
  size?: number;
  style?: ViewStyle;
  color?: string;
  dotSize?: number;
}

/**
 * Drei pulsierende Punkte
 * Subtil und unaufdringlich - perfekt für inline Loading States
 */
export function DotsAnimation({
  size = 60,
  style,
  color,
  dotSize = 12
}: DotsAnimationProps) {
  const { colors } = useTheme();

  const dot1Anim = useRef(new Animated.Value(0.4)).current;
  const dot2Anim = useRef(new Animated.Value(0.4)).current;
  const dot3Anim = useRef(new Animated.Value(0.4)).current;

  const dotColor = color || colors.primary;

  useEffect(() => {
    const createDotAnimation = (animValue: Animated.Value, delay: number) => {
      return Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(animValue, {
            toValue: 1,
            duration: 400,
            useNativeDriver: true,
          }),
          Animated.timing(animValue, {
            toValue: 0.4,
            duration: 400,
            useNativeDriver: true,
          }),
          Animated.delay(400),
        ])
      );
    };

    const animations = Animated.parallel([
      createDotAnimation(dot1Anim, 0),
      createDotAnimation(dot2Anim, 200),
      createDotAnimation(dot3Anim, 400),
    ]);

    animations.start();

    return () => animations.stop();
  }, [dot1Anim, dot2Anim, dot3Anim]);

  return (
    <View style={[{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 }, style]}>
      <Animated.View
        style={{
          width: dotSize,
          height: dotSize,
          borderRadius: dotSize / 2,
          backgroundColor: dotColor,
          opacity: dot1Anim,
        }}
      />
      <Animated.View
        style={{
          width: dotSize,
          height: dotSize,
          borderRadius: dotSize / 2,
          backgroundColor: dotColor,
          opacity: dot2Anim,
        }}
      />
      <Animated.View
        style={{
          width: dotSize,
          height: dotSize,
          borderRadius: dotSize / 2,
          backgroundColor: dotColor,
          opacity: dot3Anim,
        }}
      />
    </View>
  );
}
