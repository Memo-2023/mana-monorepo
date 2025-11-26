import React, { useEffect, useRef } from 'react';
import { View, Animated, ViewStyle } from 'react-native';
import MemoroLogo from '~/components/atoms/MemoroLogo';
import { useTheme } from '~/features/theme/ThemeProvider';

interface LogoSpinnerAnimationProps {
  size?: number;
  style?: ViewStyle;
  color?: string;
}

/**
 * MemoroLogo mit rotierendem Ring
 * Perfekte Balance zwischen Branding und Loading-Indikator
 */
export function LogoSpinnerAnimation({
  size = 100,
  style,
  color
}: LogoSpinnerAnimationProps) {
  const { colors } = useTheme();
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const logoColor = color || colors.primary;
  const logoSize = size * 0.4; // Logo ist 40% der Gesamtgröße - mehr Abstand zum Ring
  const ringThickness = 5; // Dickerer Ring für bessere Sichtbarkeit

  useEffect(() => {
    // Rotation für den Ring
    const rotateAnimation = Animated.loop(
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 1500,
        useNativeDriver: true,
      })
    );

    // Subtiler Pulse für das Logo
    const pulseAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(scaleAnim, {
          toValue: 1.05,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
        }),
      ])
    );

    rotateAnimation.start();
    pulseAnimation.start();

    return () => {
      rotateAnimation.stop();
      pulseAnimation.stop();
    };
  }, [rotateAnim, scaleAnim]);

  const rotate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <View style={[{ alignItems: 'center', justifyContent: 'center', width: size, height: size }, style]}>
      {/* Rotierender Ring */}
      <Animated.View
        style={{
          position: 'absolute',
          width: size,
          height: size,
          borderRadius: size / 2,
          borderWidth: ringThickness,
          borderColor: 'transparent',
          borderTopColor: logoColor,
          borderRightColor: logoColor,
          opacity: 0.6,
          transform: [{ rotate }],
        }}
      />

      {/* Logo in der Mitte */}
      <Animated.View
        style={{
          transform: [{ scale: scaleAnim }],
        }}>
        <MemoroLogo size={logoSize} color={logoColor} />
      </Animated.View>
    </View>
  );
}
