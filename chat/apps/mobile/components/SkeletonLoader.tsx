import React, { useEffect, useState } from 'react';
import { View, Animated, Easing, StyleSheet } from 'react-native';
import { useTheme } from '@react-navigation/native';

type SkeletonLoaderProps = {
  lines?: number;
  animated?: boolean;
  style?: any;
};

export default function SkeletonLoader({ 
  lines = 3, 
  animated = true,
  style
}: SkeletonLoaderProps) {
  const { colors } = useTheme();
  const [fadeAnim] = useState(new Animated.Value(0.3));

  useEffect(() => {
    if (animated) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(fadeAnim, {
            toValue: 0.8,
            duration: 800,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(fadeAnim, {
            toValue: 0.3,
            duration: 800,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ])
      ).start();
    }
  }, [fadeAnim, animated]);

  // Erstelle verschiedene Längen für die Zeilen
  const getRandomWidth = (index: number) => {
    // Erste und letzte Zeile sind kürzer
    if (index === 0) return { width: '70%' };
    if (index === lines - 1) return { width: '40%' };
    
    // Zufällige Breite für die Zeilen dazwischen
    const widths = ['85%', '90%', '75%', '95%'];
    return { width: widths[index % widths.length] };
  };

  return (
    <View style={[styles.container, style]}>
      {Array.from({ length: lines }).map((_, index) => (
        <Animated.View
          key={index}
          style={[
            styles.line,
            getRandomWidth(index),
            { 
              backgroundColor: colors.text + '20',
              opacity: fadeAnim,
              marginBottom: index === lines - 1 ? 0 : 8
            },
          ]}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    maxWidth: '80%',
    alignSelf: 'flex-start',
  },
  line: {
    height: 15,
    borderRadius: 4,
  },
});