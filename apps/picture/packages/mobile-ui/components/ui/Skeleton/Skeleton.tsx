import { useEffect } from 'react';
import { View, ViewStyle } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  interpolate,
} from 'react-native-reanimated';

export type SkeletonProps = {
  /** Width of skeleton */
  width?: number | string;
  /** Height of skeleton */
  height?: number | string;
  /** Border radius */
  borderRadius?: number;
  /** Background color */
  backgroundColor?: string;
  /** Shimmer color */
  shimmerColor?: string;
  /** Animation duration in ms */
  duration?: number;
  /** Additional styles */
  style?: ViewStyle;
  /** Variant for common shapes */
  variant?: 'rect' | 'circle' | 'text';
};

/**
 * Loading skeleton with shimmer animation.
 *
 * @example
 * ```tsx
 * // Rectangle
 * <Skeleton width={200} height={100} />
 *
 * // Circle (avatar)
 * <Skeleton variant="circle" width={50} height={50} />
 *
 * // Text line
 * <Skeleton variant="text" width="80%" />
 * ```
 */
export function Skeleton({
  width = '100%',
  height = 20,
  borderRadius,
  backgroundColor = '#E5E7EB',
  shimmerColor = '#F3F4F6',
  duration = 1500,
  style,
  variant = 'rect',
}: SkeletonProps) {
  const shimmerValue = useSharedValue(0);

  useEffect(() => {
    shimmerValue.value = withRepeat(
      withTiming(1, { duration }),
      -1,
      false
    );
  }, [duration]);

  const animatedStyle = useAnimatedStyle(() => {
    const opacity = interpolate(
      shimmerValue.value,
      [0, 0.5, 1],
      [0.3, 0.6, 0.3]
    );
    return { opacity };
  });

  // Variant-specific styles
  const getVariantStyles = (): ViewStyle => {
    switch (variant) {
      case 'circle':
        return {
          borderRadius: typeof width === 'number' ? width / 2 : 9999,
        };
      case 'text':
        return {
          borderRadius: 4,
          height: 16,
        };
      default:
        return {};
    }
  };

  const finalBorderRadius = borderRadius !== undefined
    ? borderRadius
    : variant === 'text'
    ? 4
    : variant === 'circle'
    ? 9999
    : 8;

  return (
    <View
      style={[
        {
          width,
          height,
          backgroundColor,
          borderRadius: finalBorderRadius,
          overflow: 'hidden',
        },
        getVariantStyles(),
        style,
      ]}
    >
      <Animated.View
        style={[
          {
            width: '100%',
            height: '100%',
            backgroundColor: shimmerColor,
          },
          animatedStyle,
        ]}
      />
    </View>
  );
}

/**
 * Group of skeleton elements for common loading patterns.
 *
 * @example
 * ```tsx
 * // Card skeleton
 * <SkeletonGroup>
 *   <Skeleton variant="circle" width={50} height={50} />
 *   <Skeleton variant="text" width="70%" />
 *   <Skeleton variant="text" width="50%" />
 * </SkeletonGroup>
 * ```
 */
export function SkeletonGroup({
  children,
  spacing = 12,
  style,
}: {
  children: React.ReactNode;
  spacing?: number;
  style?: ViewStyle;
}) {
  return (
    <View style={[{ gap: spacing }, style]}>
      {children}
    </View>
  );
}
