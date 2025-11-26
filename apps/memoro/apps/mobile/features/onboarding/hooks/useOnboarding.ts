import { useState, useEffect } from 'react';
import { safeStorage } from '~/features/auth/utils/safeStorage';

// Storage key for onboarding status
const ONBOARDING_STORAGE_KEY = 'onboarding_completed';

/**
 * Hook to manage onboarding state
 * @returns Object containing onboarding state and functions
 */
const useOnboarding = () => {
  const [isFirstLaunch, setIsFirstLaunch] = useState<boolean | null>(null);
  const [onboardingVisible, setOnboardingVisible] = useState(false);

  // Check if this is the first app launch
  useEffect(() => {
    const checkFirstLaunch = async () => {
      try {
        const onboardingCompleted = await safeStorage.getItem<boolean>(ONBOARDING_STORAGE_KEY);
        
        // If onboardingCompleted is null, this is the first launch
        const isFirst = onboardingCompleted === null;
        setIsFirstLaunch(isFirst);
        
        // Show onboarding modal on first launch
        if (isFirst) {
          setOnboardingVisible(true);
        }
      } catch (error) {
        console.debug('Error checking first launch status:', error);
        // Default to not showing onboarding if there's an error
        setIsFirstLaunch(false);
      }
    };

    checkFirstLaunch();
  }, []);

  /**
   * Mark onboarding as completed
   */
  const completeOnboarding = async () => {
    try {
      await safeStorage.setItem(ONBOARDING_STORAGE_KEY, true);
      setOnboardingVisible(false);
      setIsFirstLaunch(false);
    } catch (error) {
      console.debug('Error marking onboarding as completed:', error);
    }
  };

  /**
   * Reset onboarding status (for testing)
   */
  const resetOnboarding = async () => {
    try {
      await safeStorage.removeItem(ONBOARDING_STORAGE_KEY);
      setIsFirstLaunch(true);
    } catch (error) {
      console.debug('Error resetting onboarding status:', error);
    }
  };

  /**
   * Manually show onboarding
   */
  const showOnboarding = () => {
    setOnboardingVisible(true);
  };

  /**
   * Hide onboarding without marking as completed
   */
  const hideOnboarding = () => {
    setOnboardingVisible(false);
  };

  return {
    isFirstLaunch,
    onboardingVisible,
    completeOnboarding,
    resetOnboarding,
    showOnboarding,
    hideOnboarding,
  };
};

export default useOnboarding;
