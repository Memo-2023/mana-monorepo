import { ViewStyle } from 'react-native';

export const getSkeletonColor = (isDark: boolean, themeColors: any): string => {
  return themeColors.skeleton || (isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(128, 128, 128, 0.2)');
};

export const skeletonBase: ViewStyle = {
  overflow: 'hidden',
  position: 'relative',
};

export const skeletonText = (height: number = 16): ViewStyle => ({
  height,
  borderRadius: 4,
});

export const skeletonBox = (width: number | string, height: number): ViewStyle => ({
  width,
  height,
  borderRadius: 8,
});

export const skeletonCircle = (size: number): ViewStyle => ({
  width: size,
  height: size,
  borderRadius: size / 2,
});

export const skeletonContainer: ViewStyle = {
  padding: 16,
};

export const skeletonRow: ViewStyle = {
  flexDirection: 'row',
  alignItems: 'center',
};

export const skeletonSpacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
} as const;