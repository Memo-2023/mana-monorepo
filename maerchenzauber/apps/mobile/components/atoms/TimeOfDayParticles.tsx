/**
 * TimeOfDayParticles Component
 * Renders animated particles based on time of day (birds, clouds, lanterns, stars)
 * Reusable for EndScreen, SplashScreen, or any other screen
 */

import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Dimensions } from 'react-native';
import { TimeOfDayTheme } from '../../src/constants/timeOfDayThemes';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface TimeOfDayParticlesProps {
  theme: TimeOfDayTheme;
  intensity?: 'low' | 'medium' | 'high'; // Controls animation speed
}

export default function TimeOfDayParticles({
  theme,
  intensity = 'medium'
}: TimeOfDayParticlesProps) {
  const particles = useRef<Animated.Value[]>([]).current;

  // Initialize animation values
  useEffect(() => {
    particles.length = 0;
    for (let i = 0; i < theme.particleCount; i++) {
      particles.push(new Animated.Value(0));
    }
  }, [theme.particleCount]);

  // Start animations
  useEffect(() => {
    const animations = particles.map((particle, index) => {
      const delay = index * 300; // Stagger animations
      const duration = getDuration(theme.particleType, intensity);

      return Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(particle, {
            toValue: 1,
            duration,
            useNativeDriver: true,
          }),
        ])
      );
    });

    animations.forEach(anim => anim.start());

    return () => {
      animations.forEach(anim => anim.stop());
    };
  }, [particles, theme.particleType, intensity]);

  const renderParticle = (particle: Animated.Value, index: number) => {
    const particleStyle = getParticleStyle(particle, index, theme);

    return (
      <Animated.View
        key={`particle-${index}`}
        style={[
          styles.particle,
          particleStyle,
          {
            backgroundColor: theme.particleColors[index % theme.particleColors.length],
          },
        ]}
      />
    );
  };

  return (
    <View style={styles.container} pointerEvents="none">
      {particles.map((particle, index) => renderParticle(particle, index))}
    </View>
  );
}

// Helper: Get animation duration based on particle type and intensity
function getDuration(particleType: string, intensity: 'low' | 'medium' | 'high'): number {
  const baseSpeed = {
    low: 1.5,
    medium: 1.0,
    high: 0.7,
  }[intensity];

  const durations = {
    birds: 8000,
    clouds: 12000,
    lanterns: 6000,
    stars: 3000,
  };

  return (durations[particleType as keyof typeof durations] || 8000) * baseSpeed;
}

// Helper: Get particle position and animation style
function getParticleStyle(
  particle: Animated.Value,
  index: number,
  theme: TimeOfDayTheme
): any {
  const { particleType } = theme;

  // Random initial positions
  const startY = Math.random() * SCREEN_HEIGHT;
  const startX = Math.random() * SCREEN_WIDTH;

  switch (particleType) {
    case 'birds':
      // Birds fly from right to left, slightly wavy
      return {
        width: 8,
        height: 8,
        borderRadius: 4,
        opacity: particle.interpolate({
          inputRange: [0, 0.1, 0.9, 1],
          outputRange: [0, 1, 1, 0],
        }),
        transform: [
          {
            translateX: particle.interpolate({
              inputRange: [0, 1],
              outputRange: [SCREEN_WIDTH + 20, -20],
            }),
          },
          {
            translateY: particle.interpolate({
              inputRange: [0, 0.5, 1],
              outputRange: [startY * 0.3, startY * 0.3 - 15, startY * 0.3], // Slight wave motion
            }),
          },
        ],
      };

    case 'clouds':
      // Clouds float slowly from left to right
      return {
        width: 30 + index * 5,
        height: 15,
        borderRadius: 15,
        opacity: 0.6,
        transform: [
          {
            translateX: particle.interpolate({
              inputRange: [0, 1],
              outputRange: [-50, SCREEN_WIDTH + 50],
            }),
          },
          {
            translateY: startY * 0.4,
          },
        ],
      };

    case 'lanterns':
      // Lanterns float up slowly with slight sway
      return {
        width: 12,
        height: 12,
        borderRadius: 6,
        opacity: particle.interpolate({
          inputRange: [0, 0.1, 0.9, 1],
          outputRange: [0, 0.8, 0.8, 0],
        }),
        transform: [
          {
            translateX: particle.interpolate({
              inputRange: [0, 0.5, 1],
              outputRange: [startX, startX + 10, startX], // Slight sway
            }),
          },
          {
            translateY: particle.interpolate({
              inputRange: [0, 1],
              outputRange: [SCREEN_HEIGHT + 20, -20],
            }),
          },
        ],
      };

    case 'stars':
      // Stars twinkle in place
      return {
        width: 3 + (index % 3),
        height: 3 + (index % 3),
        borderRadius: 2,
        opacity: particle.interpolate({
          inputRange: [0, 0.5, 1],
          outputRange: [0.3, 1, 0.3], // Twinkle effect
        }),
        transform: [
          {
            translateX: startX,
          },
          {
            translateY: startY,
          },
          {
            scale: particle.interpolate({
              inputRange: [0, 0.5, 1],
              outputRange: [0.8, 1.2, 0.8], // Pulse effect
            }),
          },
        ],
      };

    default:
      return {};
  }
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    height: '100%',
    overflow: 'hidden',
  },
  particle: {
    position: 'absolute',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
  },
});
