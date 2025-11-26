import { Stack, usePathname, useSegments } from 'expo-router';
import { ActivityIndicator, View, StyleSheet } from 'react-native';
import { useAuth } from '~/features/auth';
import LocationTracker from '~/features/location/LocationTracker';
import { useRecordingStore } from '~/features/audioRecordingV2/store/recordingStore';
import RecordingBar from '~/components/molecules/RecordingBar';
import Header from '~/features/menus/Header';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { HeaderProvider, useHeader } from '~/features/menus/HeaderContext';
import { useTranslation } from 'react-i18next';
import { useTheme } from '~/features/theme/ThemeProvider';
import colors from '~/tailwind.config.js';
import InsufficientCreditsModal from '~/components/molecules/InsufficientCreditsModal';
import { useInsufficientCreditsInterceptor } from '~/features/credits/hooks/useInsufficientCreditsInterceptor';
import { RatingPromptModal } from '~/features/rating/components/RatingPromptModal';
import { useRatingPrompt } from '~/features/rating/hooks/useRatingPrompt';
import { useEffect, useMemo } from 'react';
import PageOnboardingModal from '~/features/onboarding/components/PageOnboardingModal';
import { OnboardingProvider, usePageOnboarding } from '~/features/onboarding/contexts/OnboardingContext';

// Komponente, die den Header mit der Konfiguration aus dem HeaderContext verbindet
const HeaderWithConfig = () => {
  const { config } = useHeader();
  const { t } = useTranslation();
  const pathname = usePathname();
  
  // Bestimme, ob die aktuelle Seite die Homepage ist
  // Pfad endet mit '/' oder '/index'
  const isHomePage = pathname === '/' || pathname.endsWith('/index');
  
  // Bestimme, ob es sich um eine Memo-Detail-Seite handelt
  // In Expo Router werden die Route-Gruppen wie (memo) nicht in der URL angezeigt
  // Stattdessen schauen wir nach dem Muster /memo/[id] oder direkt nach einer UUID
  const isMemoDetailPage = pathname.match(/^\/[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/) !== null;
  
  // Übersetze den Titel, falls es ein einfacher String ist
  const translatedTitle = typeof config.title === 'string' 
    ? t(config.title, config.title) // Fallback auf den Original-Titel
    : config.title;
  
  return (
    <Header 
      title={translatedTitle}
      showBackButton={config.showBackButton}
      rightIcons={config.rightIcons}
      showMenu={config.showMenu}
      selectedTags={config.selectedTags}
      onTagRemove={config.onTagRemove}
      isHomePage={isHomePage} // Verwende die lokale isHomePage-Variable statt config.isHomePage
      scrollableTitle={config.scrollableTitle}
      showTitle={config.showTitle}
      isMemoDetailPage={isMemoDetailPage}
      backgroundColor={config.backgroundColor}
    />
  );
};

export default function ProtectedLayout() {
  const { isAuthenticated, loading } = useAuth();
  const pathname = usePathname();
  const segments = useSegments();
  const isRecording = useRecordingStore((state) => state.isRecording);
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  
  // Use the insufficient credits interceptor
  const {
    modalVisible,
    requiredCredits,
    availableCredits,
    operation,
    closeModal
  } = useInsufficientCreditsInterceptor();

  // Use the rating prompt hook
  const { showPromptModal, closePrompt, triggerPromptCheck } = useRatingPrompt();

  // Check for rating prompt on home page with a slight delay
  // This gives time for the memo to be created and the store to be updated
  useEffect(() => {
    const isHomePage = pathname === '/' || pathname.endsWith('/index');
    if (isHomePage) {
      const timer = setTimeout(() => {
        triggerPromptCheck();
      }, 2000); // 2 second delay after landing on home page

      return () => clearTimeout(timer);
    }
  }, [pathname, triggerPromptCheck]);

  // Bestimme, ob die RecordingBar angezeigt werden soll
  // Nicht auf der Home-Page anzeigen (Pfad endet mit '/' oder '/index')
  const isHomePage = pathname === '/' || pathname.endsWith('/index');
  const shouldShowRecordingBar = isRecording && !isHomePage;

  // Get theme colors - memoize to prevent recalculation
  const { isDark, themeVariant } = useTheme();
  const menuBackgroundColor = useMemo(() => {
    return isDark
      ? (colors.theme?.extend?.colors?.dark as any)?.[themeVariant]?.menuBackground
      : (colors.theme?.extend?.colors as any)?.[themeVariant]?.menuBackground;
  }, [isDark, themeVariant]);

  // Memoize styles to prevent recreation on every render
  const styles = useMemo(() => StyleSheet.create({
    container: {
      flex: 1,
      position: 'relative',
      backgroundColor: menuBackgroundColor,
    },
    content: {
      flex: 1,
      backgroundColor: menuBackgroundColor,
    },
    headerContainer: {
      width: '100%',
      zIndex: 1001,
      backgroundColor: menuBackgroundColor,
    },
    recordingBarContainer: {
      width: '100%',
      zIndex: 1000,
    }
  }), [menuBackgroundColor]);

  // Show loading indicator while checking authentication
  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size='large' />
      </View>
    );
  }

  // If not authenticated, return null and let root layout handle navigation
  if (!isAuthenticated) {
    return null;
  }

  // User is authenticated, show protected content
  return (
    <OnboardingProvider>
      <HeaderProvider>
        <LocationTracker />
      <View style={styles.container}>
        <View style={styles.headerContainer}>
          <HeaderWithConfig />
          
          {shouldShowRecordingBar && (
            <View style={styles.recordingBarContainer}>
              <RecordingBar 
                onRecordingComplete={(result, title, spaceId, blueprintId) => {
                  // Hier könnten wir zur Memo-Seite navigieren oder die UI aktualisieren
                   

                  console.debug(t('recording.completed'), { result, title, spaceId, blueprintId });
                }}
              />
            </View>
          )}
        </View>
        
        <View style={styles.content}>
          <Stack screenOptions={{
            headerShown: false,
            animation: 'none',
            animationDuration: 0,
          }}>
            <Stack.Screen name="(tabs)" />
          </Stack>
        </View>
      </View>
      
      {/* Global Insufficient Credits Modal */}
      <InsufficientCreditsModal
        isVisible={modalVisible}
        onClose={closeModal}
        requiredCredits={requiredCredits}
        availableCredits={availableCredits}
        operation={operation}
      />

      {/* Global Rating Prompt Modal */}
      <RatingPromptModal isVisible={showPromptModal} onClose={closePrompt} />

      <OnboardingModalWrapper />
      </HeaderProvider>
    </OnboardingProvider>
  );
}

// Separate component to access OnboardingContext
const OnboardingModalWrapper = () => {
  const { pageOnboardingModal, closePageOnboardingModal } = usePageOnboarding();

  return (
    <PageOnboardingModal
      visible={pageOnboardingModal.visible}
      onClose={closePageOnboardingModal}
      title={pageOnboardingModal.title}
      message={pageOnboardingModal.message}
      features={pageOnboardingModal.features}
      actionLabel={pageOnboardingModal.actionLabel}
    />
  );
};
