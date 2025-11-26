import { useEffect } from 'react';
import { View, Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  interpolate,
} from 'react-native-reanimated';
import { useTheme } from '~/contexts/ThemeContext';
import { useViewStore, ViewMode } from '~/store/viewStore';

const { width } = Dimensions.get('window');

type ImageSkeletonProps = {
  viewMode?: ViewMode;
};

export function ImageSkeleton({ viewMode: propViewMode }: ImageSkeletonProps) {
  const { theme } = useTheme();
  const { galleryViewMode } = useViewStore();
  const viewMode = propViewMode || galleryViewMode;
  const shimmerValue = useSharedValue(0);

  useEffect(() => {
    shimmerValue.value = withRepeat(
      withTiming(1, { duration: 1500 }),
      -1,
      false
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => {
    const opacity = interpolate(
      shimmerValue.value,
      [0, 0.5, 1],
      [0.3, 0.5, 0.3]
    );
    return { opacity };
  });

  // Calculate image size based on view mode (same logic as ImageCard)
  const getImageSize = () => {
    const spacing = 4;
    switch (viewMode) {
      case 'single':
        return width - spacing * 2;
      case 'grid3':
        return (width - spacing * 4) / 3;
      case 'grid5':
        return (width - spacing * 6) / 5;
      default:
        return width - spacing * 2;
    }
  };

  const imageSize = getImageSize();
  const isSingleColumn = viewMode === 'single';

  return (
    <View
      style={{
        width: imageSize,
        marginHorizontal: 4,
        marginBottom: isSingleColumn ? 24 : 2,
      }}
    >
      {/* Image Skeleton */}
      <View
        style={{
          width: imageSize,
          height: imageSize,
          backgroundColor: theme.colors.surface,
          borderRadius: viewMode === 'grid5' ? 4 : 8,
          overflow: 'hidden',
        }}
      >
        <Animated.View
          style={[
            { width: '100%', height: '100%', backgroundColor: theme.colors.input },
            animatedStyle
          ]}
        />
      </View>

      {/* Text Skeleton - Only for single column */}
      {isSingleColumn && (
        <View style={{ paddingTop: 12, paddingHorizontal: 4 }}>
          <View
            style={{
              height: 16,
              backgroundColor: theme.colors.surface,
              borderRadius: 4,
              overflow: 'hidden',
              width: '80%',
            }}
          >
            <Animated.View
              style={[
                { width: '100%', height: '100%', backgroundColor: theme.colors.input },
                animatedStyle
              ]}
            />
          </View>
        </View>
      )}
    </View>
  );
}

type ImageSkeletonGridProps = {
  count?: number;
  viewMode?: ViewMode;
};

export function ImageSkeletonGrid({ count = 6, viewMode }: ImageSkeletonGridProps) {
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
      {Array.from({ length: count }).map((_, index) => (
        <ImageSkeleton key={index} viewMode={viewMode} />
      ))}
    </View>
  );
}