import '../global.css';

import { useEffect, useState } from 'react';
import { Platform, View, AppState } from 'react-native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { AuthProvider, useAuth } from '~/contexts/AuthContext';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { preloadModels } from '~/store/modelStore';
import { ErrorBoundary } from '~/components/ErrorBoundary';
import { ThemeProvider } from '~/contexts/ThemeContext';
import { logger } from '~/utils/logger';

export const unstable_settings = {
  // Ensure that reloading on `/modal` keeps a back button present.
  initialRouteName: '(tabs)',
};

function RootLayoutNav() {
  const { user, loading } = useAuth();
  const segments = useSegments();
  const router = useRouter();
  const [isNavigating, setIsNavigating] = useState(false);

  useEffect(() => {
    // Prevent navigation during loading or if already navigating
    if (loading || isNavigating) {
      console.log('⏳ Skipping navigation:', { loading, isNavigating });
      return;
    }

    const inAuthGroup = segments[0] === '(auth)';

    console.log('🔄 Auth routing check:', {
      hasUser: !!user,
      userId: user?.id,
      currentSegment: segments[0],
      inAuthGroup
    });

    // Use requestAnimationFrame to defer navigation and prevent timing issues
    const navigationTimeout = requestAnimationFrame(() => {
      try {
        if (!user && !inAuthGroup) {
          // Redirect to login if not authenticated
          console.log('🔒 Redirecting to login...');
          setIsNavigating(true);
          router.replace('/(auth)/login');
          setIsNavigating(false);
        } else if (user && inAuthGroup) {
          // Redirect to main app if authenticated
          console.log('✅ Redirecting to tabs...');
          setIsNavigating(true);
          router.replace('/(tabs)');
          setIsNavigating(false);

          // TEMPORARY FIX: Disabled preload to debug crash
          // TODO: Re-enable with proper error handling after navigation completes
          // setTimeout(() => {
          //   preloadModels().catch(err => {
          //     logger.error('Failed to preload models:', err);
          //   });
          // }, 1000);
        } else {
          console.log('ℹ️ No navigation needed');
        }
      } catch (error) {
        logger.error('Navigation error:', error);
        setIsNavigating(false);
      }
    });

    return () => {
      cancelAnimationFrame(navigationTimeout);
    };
  }, [user, segments, loading, isNavigating]);

  return (
    <Stack>
      <Stack.Screen name="(auth)/login" options={{ headerShown: false }} />
      <Stack.Screen name="(auth)/register" options={{ headerShown: false }} />
      <Stack.Screen name="(auth)/reset-password" options={{ headerShown: false }} />
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="modal" options={{ presentation: 'modal' }} />
    </Stack>
  );
}

export default function RootLayout() {
  // For web, ensure the app fills the viewport
  if (Platform.OS === 'web') {
    return (
      <GestureHandlerRootView style={{ flex: 1 }}>
        <ThemeProvider>
          <ErrorBoundary>
            <View style={{ flex: 1, backgroundColor: '#000000' }}>
              <AuthProvider>
                <RootLayoutNav />
              </AuthProvider>
            </View>
          </ErrorBoundary>
        </ThemeProvider>
      </GestureHandlerRootView>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider>
        <ErrorBoundary>
          <SafeAreaProvider>
            <AuthProvider>
              <RootLayoutNav />
            </AuthProvider>
          </SafeAreaProvider>
        </ErrorBoundary>
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}
