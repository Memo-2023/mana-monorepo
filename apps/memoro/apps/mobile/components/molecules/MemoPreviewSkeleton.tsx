import React, { useEffect, useRef } from 'react';
import { View, Animated } from 'react-native';
import { useTheme } from '~/features/theme/ThemeProvider';

interface MemoPreviewSkeletonProps {
  showMargins?: boolean;
}

/**
 * Skeleton loader for MemoPreview component
 * Matches exact MemoPreview structure and dimensions with pulsing animation
 */
const MemoPreviewSkeleton = ({ showMargins = true }: MemoPreviewSkeletonProps) => {
  const { colors } = useTheme();
  const pulseAnim = useRef(new Animated.Value(0.4)).current;

  // Theme-aware colors
  const skeletonColor = colors.skeleton;
  const backgroundColor = colors.contentBackground;
  const borderColor = colors.border;

  // Pulsing animation effect
  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0.4,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    );

    pulse.start();

    return () => pulse.stop();
  }, [pulseAnim]);

  return (
    <View style={{
      backgroundColor,
      borderRadius: 16,
      borderWidth: 1,
      borderColor,
      minHeight: 140,
      ...(showMargins && {
        marginLeft: 16,
        marginRight: 16,
      }),
      flexShrink: 0,
      marginBottom: 12,
    }}>
      <View style={{ flex: 1, paddingTop: 16, paddingHorizontal: 16 }}>
        <View style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}>
          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Animated.View style={{
                height: 14,
                width: 60,
                backgroundColor: skeletonColor,
                borderRadius: 3,
                marginRight: 4,
                opacity: pulseAnim,
              }} />
              <Animated.View style={{
                width: 4,
                height: 4,
                backgroundColor: skeletonColor,
                borderRadius: 2,
                marginHorizontal: 4,
                opacity: pulseAnim,
              }} />
              <Animated.View style={{
                height: 14,
                width: 40,
                backgroundColor: skeletonColor,
                borderRadius: 3,
                marginRight: 4,
                opacity: pulseAnim,
              }} />
              <Animated.View style={{
                width: 4,
                height: 4,
                backgroundColor: skeletonColor,
                borderRadius: 2,
                marginHorizontal: 4,
                opacity: pulseAnim,
              }} />
              <Animated.View style={{
                height: 14,
                width: 35,
                backgroundColor: skeletonColor,
                borderRadius: 3,
                opacity: pulseAnim,
              }} />
            </View>
          </View>

          <View style={{ maxWidth: 120, flexShrink: 0 }}>
            <Animated.View style={{
              height: 20,
              width: 80,
              backgroundColor: skeletonColor,
              borderRadius: 10,
              opacity: pulseAnim,
            }} />
          </View>
        </View>

        <View style={{ marginTop: 8, marginBottom: 4 }}>
          <Animated.View style={{
            height: 18,
            width: 280,
            backgroundColor: skeletonColor,
            borderRadius: 4,
            marginBottom: 2,
            opacity: pulseAnim,
          }} />
          <Animated.View style={{
            height: 18,
            width: 200,
            backgroundColor: skeletonColor,
            borderRadius: 4,
            opacity: pulseAnim,
          }} />
        </View>
      </View>

      <View style={{
        marginTop: 4,
        minHeight: 32,
        paddingBottom: 10,
        paddingHorizontal: 16,
      }}>
        <View style={{
          flexDirection: 'row',
          alignItems: 'center',
          flexWrap: 'wrap',
        }}>
          <Animated.View style={{
            height: 24,
            width: 65,
            backgroundColor: skeletonColor,
            borderRadius: 12,
            marginRight: 8,
            marginBottom: 4,
            opacity: pulseAnim,
          }} />
          <Animated.View style={{
            height: 24,
            width: 85,
            backgroundColor: skeletonColor,
            borderRadius: 12,
            marginRight: 8,
            marginBottom: 4,
            opacity: pulseAnim,
          }} />
          <Animated.View style={{
            height: 24,
            width: 50,
            backgroundColor: skeletonColor,
            borderRadius: 12,
            marginBottom: 4,
            opacity: pulseAnim,
          }} />
        </View>
      </View>
    </View>
  );
};

export default MemoPreviewSkeleton;