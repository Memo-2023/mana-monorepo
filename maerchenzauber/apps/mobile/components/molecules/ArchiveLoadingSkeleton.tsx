import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Dimensions } from 'react-native';

interface ArchiveLoadingSkeletonProps {
  activeTab?: 'characters' | 'stories';
}

export default function ArchiveLoadingSkeleton({ activeTab = 'characters' }: ArchiveLoadingSkeletonProps) {
  const shimmerAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Shimmer animation
    const shimmerAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(shimmerAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(shimmerAnim, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    );
    shimmerAnimation.start();

    return () => shimmerAnimation.stop();
  }, []);

  const shimmerOpacity = shimmerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.6],
  });

  const { width: screenWidth } = Dimensions.get('window');
  const isWideScreen = screenWidth > 1000;
  const containerWidth = isWideScreen ? 600 : screenWidth;
  const avatarSize = isWideScreen ? 140 : Math.min(120, (screenWidth - 96) / 2);
  const cardWidth = Math.min((containerWidth - 48) / 2, 280);

  return (
    <View style={styles.container}>
      {/* Tab Switcher Skeleton */}
      <View style={styles.tabSwitcherContainer}>
        <Animated.View style={[styles.tabSkeleton, { opacity: shimmerOpacity }]} />
        <Animated.View style={[styles.tabSkeleton, { opacity: shimmerOpacity }]} />
      </View>

      {/* Content Grid */}
      <View style={styles.gridContainer}>
        {activeTab === 'characters' ? (
          // Characters Grid Skeleton
          <View style={styles.charactersGrid}>
            {[1, 2, 3, 4, 5, 6].map((item) => (
              <View key={item} style={styles.characterContainer}>
                <Animated.View
                  style={[
                    styles.avatarSkeleton,
                    {
                      width: avatarSize,
                      height: avatarSize,
                      borderRadius: avatarSize / 2,
                      opacity: shimmerOpacity
                    }
                  ]}
                />
                <Animated.View style={[styles.characterNameSkeleton, { opacity: shimmerOpacity }]} />
                <Animated.View style={[styles.buttonSkeleton, { opacity: shimmerOpacity }]} />
              </View>
            ))}
          </View>
        ) : (
          // Stories Grid Skeleton
          <View style={styles.storiesGrid}>
            {[1, 2, 3, 4].map((item) => (
              <View key={item} style={[styles.storyCardContainer, { width: cardWidth }]}>
                <Animated.View
                  style={[
                    styles.storyCardSkeleton,
                    {
                      width: cardWidth,
                      height: cardWidth * 1.4,
                      opacity: shimmerOpacity
                    }
                  ]}
                />
                <Animated.View style={[styles.buttonSkeleton, { opacity: shimmerOpacity }]} />
              </View>
            ))}
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    paddingTop: 80,
  },
  tabSwitcherContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    gap: 8,
  },
  tabSkeleton: {
    width: 120,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  gridContainer: {
    flex: 1,
  },
  charactersGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  characterContainer: {
    width: '48%',
    alignItems: 'center',
    marginBottom: 24,
  },
  avatarSkeleton: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  characterNameSkeleton: {
    width: '80%',
    height: 20,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    marginTop: 8,
  },
  buttonSkeleton: {
    width: 140,
    height: 36,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    marginTop: 8,
  },
  storiesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  storyCardContainer: {
    marginBottom: 24,
    alignItems: 'center',
  },
  storyCardSkeleton: {
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
});
