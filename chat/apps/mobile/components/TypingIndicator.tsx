import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Animated, Easing } from 'react-native';
import { useTheme } from '@react-navigation/native';

type TypingIndicatorProps = {
  dotCount?: number;
  dotSize?: number;
  dotColor?: string;
  style?: any;
};

export default function TypingIndicator({
  dotCount = 3,
  dotSize = 8,
  dotColor,
  style,
}: TypingIndicatorProps) {
  const { colors } = useTheme();
  const [animations] = useState(() => 
    Array.from({ length: dotCount }).map(() => new Animated.Value(0))
  );

  // Dotfarbe wird entweder von Prop oder vom Theme übernommen
  const actualDotColor = dotColor || colors.text;

  useEffect(() => {
    // Animiere jeden Punkt mit einer Verzögerung
    const animateDots = () => {
      const animationSequence = animations.map((anim, i) => 
        Animated.sequence([
          // Verzögerung für jeden Punkt
          Animated.delay(i * 150),
          // Animation nach oben
          Animated.timing(anim, {
            toValue: 1,
            duration: 400,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          // Animation zurück nach unten
          Animated.timing(anim, {
            toValue: 0,
            duration: 400,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          // Verzögerung am Ende
          Animated.delay((dotCount - i - 1) * 150),
        ])
      );

      // Starte alle Animationen parallel und in einer Schleife
      Animated.loop(Animated.parallel(animationSequence)).start();
    };

    animateDots();

    // Cleanup beim Unmount
    return () => {
      animations.forEach(anim => anim.stopAnimation());
    };
  }, [animations, dotCount]);

  return (
    <View style={[styles.container, style]}>
      {animations.map((anim, index) => (
        <Animated.View
          key={index}
          style={[
            styles.dot,
            {
              width: dotSize, 
              height: dotSize,
              backgroundColor: actualDotColor,
              borderRadius: dotSize / 2,
              marginHorizontal: dotSize / 3,
              transform: [
                {
                  translateY: anim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, -dotSize],
                  }),
                },
              ],
            },
          ]}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 10,
  },
  dot: {
    opacity: 0.6,
  },
});