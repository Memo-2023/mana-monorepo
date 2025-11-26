import React, { useEffect, useRef } from 'react';
import { Animated, View, StyleSheet, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface ShimmerPlaceholderProps {
  style?: any;
  shimmerColors?: string[];
  children?: React.ReactNode;
}

export const ShimmerPlaceholder: React.FC<ShimmerPlaceholderProps> = ({
  style,
  shimmerColors,
  children,
}) => {
  const animatedValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.timing(animatedValue, {
        toValue: 1,
        duration: 1500,
        useNativeDriver: true,
      })
    );
    animation.start();

    return () => {
      animation.stop();
    };
  }, [animatedValue]);

  const translateX = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [-SCREEN_WIDTH, SCREEN_WIDTH],
  });

  const defaultShimmerColors = [
    'transparent',
    'rgba(255, 255, 255, 0.05)',
    'rgba(255, 255, 255, 0.1)',
    'rgba(255, 255, 255, 0.05)',
    'transparent',
  ];

  return (
    <View style={[styles.container, style]}>
      {children}
      <Animated.View
        style={[
          StyleSheet.absoluteFillObject,
          {
            transform: [{ translateX }],
          },
        ]}
      >
        <LinearGradient
          colors={shimmerColors || defaultShimmerColors}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.gradient}
        />
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
  },
  gradient: {
    flex: 1,
  },
});