import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  Dimensions,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  interpolate,
  Extrapolate,
  withTiming,
  FadeIn,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { useOnboardingStore } from '~/store/onboardingStore';
import { useIsDarkMode } from '~/store/settingsStore';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface OnboardingPage {
  icon: string;
  iconColor: string;
  title: string;
  subtitle: string;
  description: string;
  gradientColors: string[];
}

const onboardingPages: OnboardingPage[] = [
  {
    icon: 'sparkles',
    iconColor: '#FFD700',
    title: 'Willkommen bei Zitare',
    subtitle: 'Entdecke tägliche Inspiration',
    description: 'Über 23.000 handverlesene Zitate von den größten Denkern der Geschichte.',
    gradientColors: ['#667eea', '#764ba2'],
  },
  {
    icon: 'heart',
    iconColor: '#FF6B6B',
    title: 'Sammle deine Favoriten',
    subtitle: 'Behalte, was dich bewegt',
    description: 'Speichere Zitate, die dich inspirieren, und greife jederzeit darauf zu.',
    gradientColors: ['#f093fb', '#f5576c'],
  },
  {
    icon: 'albums',
    iconColor: '#4ECDC4',
    title: 'Erstelle Sammlungen',
    subtitle: 'Organisiere deine Weisheiten',
    description: 'Gruppiere Zitate nach Themen, Stimmungen oder eigenen Kategorien.',
    gradientColors: ['#4facfe', '#00f2fe'],
  },
  {
    icon: 'people',
    iconColor: '#9B59B6',
    title: 'Entdecke Autoren',
    subtitle: 'Lerne die Denker kennen',
    description: 'Tauche ein in die Biografien und Gedankenwelten großer Persönlichkeiten.',
    gradientColors: ['#667eea', '#764ba2'],
  },
  {
    icon: 'phone-portrait-outline',
    iconColor: '#3498DB',
    title: 'Widget & Personalisierung',
    subtitle: 'Dein tägliches Zitat',
    description: 'Erhalte inspirierende Zitate direkt auf deinem Home-Bildschirm.',
    gradientColors: ['#6dd5ed', '#2193b0'],
  },
];

export default function AppleStyleOnboarding() {
  const [currentPage, setCurrentPage] = useState(0);
  const scrollViewRef = useRef<ScrollView>(null);
  const scrollX = useSharedValue(0);
  const router = useRouter();
  const isDarkMode = useIsDarkMode();
  const { completeOnboarding } = useOnboardingStore();

  const handleScroll = (event: any) => {
    const offsetX = event.nativeEvent.contentOffset.x;
    scrollX.value = offsetX;
    const pageIndex = Math.round(offsetX / SCREEN_WIDTH);
    if (pageIndex !== currentPage) {
      setCurrentPage(pageIndex);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  const handleContinue = () => {
    if (currentPage < onboardingPages.length - 1) {
      const nextPage = currentPage + 1;
      scrollViewRef.current?.scrollTo({
        x: nextPage * SCREEN_WIDTH,
        animated: true,
      });
      setCurrentPage(nextPage);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } else {
      handleComplete();
    }
  };

  const handleComplete = async () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    completeOnboarding();
    router.replace('/(tabs)/');
  };

  const handleSkip = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    handleComplete();
  };

  return (
    <View style={styles.container}>
      {/* Background Gradient */}
      <LinearGradient
        colors={isDarkMode ? ['#000000', '#1a1a1a'] : ['#ffffff', '#f0f0f0']}
        style={StyleSheet.absoluteFillObject}
      />

      <SafeAreaView style={styles.safeArea}>
        {/* Skip Button */}
        <Animated.View 
          entering={FadeIn.delay(500)}
          style={styles.skipContainer}
        >
          <TouchableOpacity onPress={handleSkip} style={styles.skipButton}>
            <Text style={[
              styles.skipText,
              { color: isDarkMode ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.6)' }
            ]}>
              Überspringen
            </Text>
          </TouchableOpacity>
        </Animated.View>

        {/* Pages */}
        <ScrollView
          ref={scrollViewRef}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onScroll={handleScroll}
          scrollEventThrottle={16}
          bounces={false}
        >
          {onboardingPages.map((page, index) => (
            <OnboardingPageComponent
              key={index}
              page={page}
              index={index}
              scrollX={scrollX}
              isDarkMode={isDarkMode}
            />
          ))}
        </ScrollView>

        {/* Bottom Controls */}
        <View style={styles.bottomContainer}>
          {/* Page Indicators */}
          <View style={styles.indicatorContainer}>
            {onboardingPages.map((_, index) => (
              <PageIndicator
                key={index}
                index={index}
                currentPage={currentPage}
                scrollX={scrollX}
                isDarkMode={isDarkMode}
              />
            ))}
          </View>

          {/* Continue Button */}
          <TouchableOpacity
            onPress={handleContinue}
            style={styles.continueButton}
            activeOpacity={0.8}
          >
            <BlurView
              intensity={80}
              tint={isDarkMode ? 'dark' : 'light'}
              style={styles.continueButtonBlur}
            >
              <Text style={[
                styles.continueButtonText,
                { color: isDarkMode ? '#ffffff' : '#000000' }
              ]}>
                {currentPage === onboardingPages.length - 1 ? 'Los geht\'s' : 'Weiter'}
              </Text>
            </BlurView>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </View>
  );
}

// Individual Page Component
function OnboardingPageComponent({
  page,
  index,
  scrollX,
  isDarkMode,
}: {
  page: OnboardingPage;
  index: number;
  scrollX: any;
  isDarkMode: boolean;
}) {
  const inputRange = [
    (index - 1) * SCREEN_WIDTH,
    index * SCREEN_WIDTH,
    (index + 1) * SCREEN_WIDTH,
  ];

  const animatedStyle = useAnimatedStyle(() => {
    const scale = interpolate(
      scrollX.value,
      inputRange,
      [0.8, 1, 0.8],
      Extrapolate.CLAMP
    );

    const opacity = interpolate(
      scrollX.value,
      inputRange,
      [0.5, 1, 0.5],
      Extrapolate.CLAMP
    );

    const translateY = interpolate(
      scrollX.value,
      inputRange,
      [50, 0, 50],
      Extrapolate.CLAMP
    );

    return {
      transform: [{ scale }, { translateY }],
      opacity,
    };
  });

  const iconAnimatedStyle = useAnimatedStyle(() => {
    const rotate = interpolate(
      scrollX.value,
      inputRange,
      [-15, 0, 15],
      Extrapolate.CLAMP
    );

    const scale = interpolate(
      scrollX.value,
      inputRange,
      [0.8, 1, 0.8],
      Extrapolate.CLAMP
    );

    return {
      transform: [
        { rotate: `${rotate}deg` },
        { scale },
      ],
    };
  });

  return (
    <View style={styles.pageContainer}>
      <Animated.View style={[styles.contentContainer, animatedStyle]}>
        {/* Icon with Gradient Background */}
        <View style={styles.iconWrapper}>
          <LinearGradient
            colors={page.gradientColors}
            style={styles.iconGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Animated.View style={iconAnimatedStyle}>
              <Ionicons
                name={page.icon as any}
                size={60}
                color="#ffffff"
              />
            </Animated.View>
          </LinearGradient>
        </View>

        {/* Title */}
        <Text style={[
          styles.title,
          { color: isDarkMode ? '#ffffff' : '#000000' }
        ]}>
          {page.title}
        </Text>

        {/* Subtitle */}
        <Text style={[
          styles.subtitle,
          { color: isDarkMode ? 'rgba(255,255,255,0.9)' : 'rgba(0,0,0,0.9)' }
        ]}>
          {page.subtitle}
        </Text>

        {/* Description */}
        <Text style={[
          styles.description,
          { color: isDarkMode ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.6)' }
        ]}>
          {page.description}
        </Text>
      </Animated.View>
    </View>
  );
}

// Page Indicator Component
function PageIndicator({
  index,
  currentPage,
  scrollX,
  isDarkMode,
}: {
  index: number;
  currentPage: number;
  scrollX: any;
  isDarkMode: boolean;
}) {
  const animatedStyle = useAnimatedStyle(() => {
    const inputRange = [
      (index - 1) * SCREEN_WIDTH,
      index * SCREEN_WIDTH,
      (index + 1) * SCREEN_WIDTH,
    ];

    const width = interpolate(
      scrollX.value,
      inputRange,
      [8, 24, 8],
      Extrapolate.CLAMP
    );

    const opacity = interpolate(
      scrollX.value,
      inputRange,
      [0.3, 1, 0.3],
      Extrapolate.CLAMP
    );

    return {
      width,
      opacity,
    };
  });

  return (
    <Animated.View
      style={[
        styles.indicator,
        animatedStyle,
        {
          backgroundColor: isDarkMode ? '#ffffff' : '#000000',
        },
      ]}
    />
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  skipContainer: {
    position: 'absolute',
    top: 60,
    right: 20,
    zIndex: 10,
  },
  skipButton: {
    padding: 10,
  },
  skipText: {
    fontSize: 17,
    fontWeight: '400',
  },
  pageContainer: {
    width: SCREEN_WIDTH,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
  },
  contentContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconWrapper: {
    marginBottom: 40,
  },
  iconGradient: {
    width: 120,
    height: 120,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 10,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 16,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 22,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 20,
  },
  description: {
    fontSize: 17,
    fontWeight: '400',
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 20,
  },
  bottomContainer: {
    position: 'absolute',
    bottom: 50,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  indicatorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 30,
    gap: 8,
  },
  indicator: {
    height: 8,
    borderRadius: 4,
    backgroundColor: '#000000',
  },
  continueButton: {
    borderRadius: 30,
    overflow: 'hidden',
  },
  continueButtonBlur: {
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 30,
    borderWidth: 0.5,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  continueButtonText: {
    fontSize: 17,
    fontWeight: '600',
    letterSpacing: -0.2,
  },
});