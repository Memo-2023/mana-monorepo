import React, { useEffect, useRef } from 'react';
import { Animated, ViewStyle, Easing } from 'react-native';

interface SkeletonAnimationProps {
  children: React.ReactNode;
  style?: ViewStyle;
  delay?: number;
}

export const SkeletonAnimation: React.FC<SkeletonAnimationProps> = ({ children, style, delay = 0 }) => {
  const animatedValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(animatedValue, {
          toValue: 1,
          duration: 800,
          easing: Easing.bezier(0.5, 0, 0.5, 1),
          useNativeDriver: true,
          delay,
        }),
        Animated.timing(animatedValue, {
          toValue: 0,
          duration: 800,
          easing: Easing.bezier(0.5, 0, 0.5, 1),
          useNativeDriver: true,
        }),
      ])
    );

    animation.start();

    return () => {
      animation.stop();
    };
  }, [animatedValue, delay]);

  const opacity = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0.4, 0.8],
  });

  return (
    <Animated.View style={[style, { opacity }]}>
      {children}
    </Animated.View>
  );
};