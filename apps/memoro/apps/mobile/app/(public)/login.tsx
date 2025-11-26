import { useEffect, useCallback } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { View } from 'react-native';
import Auth from '~/features/auth/auth';
import { OnboardingModal, useOnboarding } from '~/features/onboarding';
import { useTheme } from '~/features/theme/ThemeProvider';
import colors from '~/tailwind.config.js';

export default function Login() {
  const router = useRouter();
  const searchParams = useLocalSearchParams();
  const { onboardingVisible, completeOnboarding, showOnboarding } = useOnboarding();
  const { isDark, themeVariant } = useTheme();
  
  // Direkter Zugriff auf die Farben aus der Tailwind-Konfiguration
  const pageBackgroundColor = isDark 
    ? ((colors as any).theme?.extend?.colors?.dark)?.[themeVariant]?.background || '#121212' // Fallback für dunkles Theme
    : ((colors as any).theme?.extend?.colors)?.[themeVariant]?.background || '#FFFFFF'; // Fallback für helles Theme
  
  // Check if we should show the onboarding modal based on URL params
  useEffect(() => {
    if (searchParams.showOnboarding === 'true') {
      showOnboarding();
    }
  }, [searchParams.showOnboarding, showOnboarding]);

  // Handle closing the onboarding modal
  const handleCloseOnboarding = useCallback(() => {
    // First complete the onboarding
    completeOnboarding();
    
    // Then clear the URL parameter if it exists
    if (searchParams.showOnboarding === 'true') {
      // Replace the current URL without the parameter
      router.setParams({ showOnboarding: undefined });
    }
  }, [completeOnboarding, router, searchParams.showOnboarding]);

  return (
    <View style={{ flex: 1, backgroundColor: pageBackgroundColor }}>
      <Auth initialMode="initial" />
      <OnboardingModal 
        visible={onboardingVisible} 
        onClose={handleCloseOnboarding} 
      />
    </View>
  );
}
