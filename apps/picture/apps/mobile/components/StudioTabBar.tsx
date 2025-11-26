import { useState, useEffect, useRef } from 'react';
import {
  View,
  ScrollView,
  Pressable,
  PlatformColor,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LiquidGlassView } from '@callstack/liquid-glass';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  interpolate,
} from 'react-native-reanimated';
import { useTheme } from '~/contexts/ThemeContext';
import { Text } from './Text';

type StudioTab = 'builder' | 'templates';

type StudioTabBarProps = {
  isMinimized?: boolean;
  scrollY?: number;
  activeTab: StudioTab;
  onTabChange: (tab: StudioTab) => void;
  generateBarExpanded?: boolean;
};

export function StudioTabBar({
  isMinimized: externalIsMinimized = false,
  scrollY = 0,
  activeTab,
  onTabChange,
  generateBarExpanded = false,
}: StudioTabBarProps) {
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const [manuallyExpanded, setManuallyExpanded] = useState(false);
  const lastScrollY = useRef(0);

  // Track scroll changes and close if scrolling while manually opened
  useEffect(() => {
    const scrollDiff = Math.abs(scrollY - lastScrollY.current);

    // If user scrolls more than 20px, close the bar
    if (scrollDiff > 20 && manuallyExpanded) {
      setManuallyExpanded(false);
    }

    lastScrollY.current = scrollY;
  }, [scrollY]);

  // Determine if bar should be minimized - always stay minimized unless manually expanded
  const isMinimized = !manuallyExpanded;

  // Animation value: 0 = FAB, 1 = full bar
  const animationProgress = useSharedValue(0);

  // Shared value for generate bar expanded state - starts at 0
  const generateBarExpandedShared = useSharedValue(0);

  // Animate when minimized state changes
  useEffect(() => {
    animationProgress.value = withTiming(isMinimized ? 0 : 1, {
      duration: 300,
    });
  }, [isMinimized]);

  // Update shared value when generateBarExpanded changes
  useEffect(() => {
    generateBarExpandedShared.value = withTiming(generateBarExpanded ? 1 : 0, {
      duration: 300,
    });
  }, [generateBarExpanded]);

  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          left: 24,
          right: 24,
          zIndex: 2,
        },
        useAnimatedStyle(() => {
          const baseBottom = interpolate(
            animationProgress.value,
            [0, 1],
            [insets.bottom + 122, insets.bottom + 129] // Lower when minimized (FAB), higher when expanded (bar)
          );

          // Move up 4px when generate bar is expanded
          const offset = generateBarExpandedShared.value * 4;

          return {
            bottom: baseBottom + offset,
          };
        }),
      ]}
    >
      <Pressable
        onPress={() => {
          if (isMinimized) {
            setManuallyExpanded(true);
          }
        }}
        disabled={!isMinimized}
      >
        <Animated.View
          style={[
            {
              overflow: 'hidden',
            },
            useAnimatedStyle(() => {
              // FAB size: 52x52
              const width = interpolate(
                animationProgress.value,
                [0, 1],
                [52, 400] // FAB width to full bar width
              );
              const height = interpolate(
                animationProgress.value,
                [0, 1],
                [52, 60] // FAB height to bar height
              );
              const borderRadius = interpolate(
                animationProgress.value,
                [0, 1],
                [26, 999] // FAB round to bar round
              );

              return {
                width: animationProgress.value === 1 ? '100%' : width,
                height,
                borderRadius,
                ...theme.shadows.lg,
              };
            }),
          ]}
        >
          {/* FAB Icon - only visible when minimized */}
          <Animated.View
            style={[
              {
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                borderRadius: 26,
                overflow: 'hidden',
              },
              useAnimatedStyle(() => ({
                opacity: interpolate(animationProgress.value, [0, 0.3], [1, 0]),
                transform: [
                  {
                    scale: interpolate(animationProgress.value, [0, 0.3], [1, 0.8]),
                  },
                ],
              })),
            ]}
            pointerEvents={isMinimized ? 'auto' : 'none'}
          >
            <LiquidGlassView
              effect="regular"
              interactive={true}
              colorScheme="system"
              style={{
                flex: 1,
                justifyContent: 'center',
                alignItems: 'center',
                borderRadius: 26,
                overflow: 'hidden',
              }}
            >
              <View>
                <Ionicons
                  name={activeTab === 'builder' ? 'construct' : 'albums'}
                  size={20}
                  color={PlatformColor('labelColor')}
                />
              </View>
            </LiquidGlassView>
          </Animated.View>

          {/* Full Bar Content - only visible when not minimized */}
          <Animated.View
            style={[
              {
                width: '100%',
              },
              useAnimatedStyle(() => ({
                opacity: interpolate(animationProgress.value, [0.7, 1], [0, 1]),
              })),
            ]}
            pointerEvents={isMinimized ? 'none' : 'auto'}
          >
            <LiquidGlassView
              effect="regular"
              interactive={true}
              colorScheme="system"
              style={{ borderRadius: 999, overflow: 'hidden', width: '100%' }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 8, paddingHorizontal: 12, gap: 8 }}>
                {/* Builder Tab */}
                <Pressable
                  onPress={() => onTabChange('builder')}
                  style={{
                    flex: 1,
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'center',
                    paddingHorizontal: 16,
                    paddingVertical: 8,
                    borderRadius: 999,
                    borderWidth: 2,
                    borderColor: activeTab === 'builder' ? theme.colors.primary.default : PlatformColor('separatorColor'),
                    backgroundColor: activeTab === 'builder' ? theme.colors.primary.default : 'transparent',
                  }}
                >
                  <Ionicons
                    name="construct"
                    size={16}
                    color={activeTab === 'builder' ? 'white' : PlatformColor('labelColor')}
                    style={{ marginRight: 6 }}
                  />
                  <Text style={{ color: activeTab === 'builder' ? 'white' : PlatformColor('labelColor'), fontSize: 14, fontWeight: '600' }}>
                    Prompt Builder
                  </Text>
                </Pressable>

                {/* Templates Tab */}
                <Pressable
                  onPress={() => onTabChange('templates')}
                  style={{
                    flex: 1,
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'center',
                    paddingHorizontal: 16,
                    paddingVertical: 8,
                    borderRadius: 999,
                    borderWidth: 2,
                    borderColor: activeTab === 'templates' ? theme.colors.primary.default : PlatformColor('separatorColor'),
                    backgroundColor: activeTab === 'templates' ? theme.colors.primary.default : 'transparent',
                  }}
                >
                  <Ionicons
                    name="albums"
                    size={16}
                    color={activeTab === 'templates' ? 'white' : PlatformColor('labelColor')}
                    style={{ marginRight: 6 }}
                  />
                  <Text style={{ color: activeTab === 'templates' ? 'white' : PlatformColor('labelColor'), fontSize: 14, fontWeight: '600' }}>
                    Vorlagen
                  </Text>
                </Pressable>
              </View>
            </LiquidGlassView>
          </Animated.View>
        </Animated.View>
      </Pressable>
    </Animated.View>
  );
}
