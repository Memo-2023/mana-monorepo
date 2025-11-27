import React, { useEffect } from 'react';
import { View, Pressable, Platform, Dimensions } from 'react-native';
import Text from '~/components/Text';
import * as Haptics from 'expo-haptics';
import { useIsDarkMode } from '~/store/settingsStore';
import Animated, { 
  FadeInDown, 
  useSharedValue, 
  useAnimatedStyle, 
  withSpring,
  withTiming,
  interpolate,
  Extrapolate,
  runOnJS
} from 'react-native-reanimated';
import { BlurView } from 'expo-blur';

interface Tab {
  key: string;
  label: string;
  count?: number;
}

interface GlassTabSelectorProps {
  tabs: Tab[];
  activeTab: string;
  onTabChange: (tab: string) => void;
  animationDelay?: number;
}

const { width: screenWidth } = Dimensions.get('window');

export function GlassTabSelector({ tabs, activeTab, onTabChange, animationDelay = 200 }: GlassTabSelectorProps) {
  const isDarkMode = useIsDarkMode();
  const isIOS = Platform.OS === 'ios';
  
  // Animation values
  const activeIndex = tabs.findIndex(tab => tab.key === activeTab);
  const containerHorizontalPadding = 48; // px-6 = 24px on each side
  const availableWidth = screenWidth - containerHorizontalPadding;
  const tabWidth = availableWidth / tabs.length;

  const translateX = useSharedValue(activeIndex * tabWidth);
  const indicatorWidth = useSharedValue(tabWidth);
  const indicatorOpacity = useSharedValue(1);
  const isFirstRender = useSharedValue(true);

  useEffect(() => {
    // Calculate position for active tab (no extra offset needed)
    const newPosition = activeIndex * tabWidth;

    // Skip animation on first render
    if (isFirstRender.value) {
      translateX.value = newPosition;
      indicatorWidth.value = tabWidth;
      isFirstRender.value = false;
      return;
    }

    // Morph effect: briefly fade out, move, then fade in
    indicatorOpacity.value = withTiming(0.8, { duration: 100 }, () => {
      translateX.value = withSpring(newPosition, {
        damping: 20,
        stiffness: 200,
        mass: 0.8
      });
      indicatorOpacity.value = withTiming(1, { duration: 200 });
    });

    // Set indicator width to match tab width
    indicatorWidth.value = withSpring(tabWidth, {
      damping: 18,
      stiffness: 180,
    });
  }, [activeIndex, tabWidth]);

  const animatedIndicatorStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateX: translateX.value }],
      width: indicatorWidth.value,
      opacity: indicatorOpacity.value,
    };
  });

  if (!isIOS) {
    // Fallback to regular TabSelector on Android
    const TabSelector = require('./TabSelector').TabSelector;
    return <TabSelector tabs={tabs} activeTab={activeTab} onTabChange={onTabChange} animationDelay={animationDelay} />;
  }

  return (
    <View>
      {/* Glass Effect Container Background */}
      <View className="px-6 mb-6">
        <View className="relative">
          {/* Blur Background Layer for entire container */}
          <View className="absolute inset-0 rounded-full overflow-hidden">
            <BlurView 
              intensity={30} 
              tint={isDarkMode ? 'dark' : 'light'}
              style={{ flex: 1 }}
            />
            {/* Glass overlay with subtle gradient */}
            <View 
              className="absolute inset-0" 
              style={{
                backgroundColor: isDarkMode 
                  ? 'rgba(255, 255, 255, 0.08)' 
                  : 'rgba(255, 255, 255, 0.5)',
                borderWidth: 0.5,
                borderColor: isDarkMode 
                  ? 'rgba(255, 255, 255, 0.15)' 
                  : 'rgba(255, 255, 255, 0.8)',
                borderRadius: 999,
              }}
            />
          </View>

          {/* Tab buttons container - no extra padding */}
          <View className="relative">
            {/* Animated active indicator that slides behind tabs */}
            <Animated.View
              style={[
                {
                  position: 'absolute',
                  top: 0,
                  bottom: 0,
                  borderRadius: 999,
                  overflow: 'hidden',
                },
                animatedIndicatorStyle
              ]}
            >
              <BlurView 
                intensity={60} 
                tint={isDarkMode ? 'light' : 'dark'}
                style={{ flex: 1 }}
              />
              <View 
                className="absolute inset-0" 
                style={{
                  backgroundColor: isDarkMode 
                    ? 'rgba(255, 255, 255, 0.95)' 
                    : 'rgba(0, 0, 0, 0.88)',
                  borderWidth: 0.5,
                  borderColor: isDarkMode 
                    ? 'rgba(255, 255, 255, 0.3)' 
                    : 'rgba(0, 0, 0, 0.2)',
                  borderRadius: 999,
                }}
              />
            </Animated.View>

            {/* Tab buttons - now in a flex row */}
            <View className="flex-row">
              {tabs.map((tab, index) => {
                const isActive = activeTab === tab.key;
                
                // Individual tab animations
                const tabScale = useSharedValue(1);
                const textOpacity = useSharedValue(isActive ? 1 : 0.7);
                
                useEffect(() => {
                  textOpacity.value = withTiming(isActive ? 1 : 0.7, { duration: 300 });
                }, [isActive]);
                
                const animatedTabStyle = useAnimatedStyle(() => ({
                  transform: [{ scale: tabScale.value }],
                }));
                
                const animatedTextStyle = useAnimatedStyle(() => ({
                  opacity: textOpacity.value,
                }));
                
                return (
                  <Pressable
                    key={tab.key}
                    onPressIn={() => {
                      tabScale.value = withSpring(0.95);
                    }}
                    onPressOut={() => {
                      tabScale.value = withSpring(1);
                    }}
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      onTabChange(tab.key);
                    }}
                    style={{ width: tabWidth }}
                  >
                    <Animated.View style={[{ position: 'relative' }, animatedTabStyle]}>
                      {/* Tab content - consistent padding for all tabs */}
                      <View className="py-2.5 px-4 rounded-full">
                        <Animated.Text 
                          style={[
                            {
                              textAlign: 'center',
                              fontWeight: '500',
                              fontSize: 15,
                              color: isActive 
                                ? (isDarkMode ? '#000000' : '#FFFFFF')
                                : (isDarkMode ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.6)')
                            },
                            animatedTextStyle
                          ]}
                        >
                          {tab.label}
                          {tab.count !== undefined && ` (${tab.count})`}
                        </Animated.Text>
                      </View>
                    </Animated.View>
                  </Pressable>
                );
              })}
            </View>
          </View>
        </View>
      </View>
    </View>
  );
}