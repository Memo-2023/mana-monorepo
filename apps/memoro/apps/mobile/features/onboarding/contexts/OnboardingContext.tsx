import React, { createContext, useContext, ReactNode } from 'react';
import { useOnboardingToasts } from '~/features/toast/onboarding/onboardingToasts';

interface OnboardingContextValue {
	showPageOnboardingToast: (pageName: any) => void;
	cleanupPageToast: (pageName: any) => void;
	pageOnboardingModal: {
		visible: boolean;
		pageName: string | null;
		title: string;
		message: string;
		features: Array<{ icon: string; title: string; description: string }>;
		actionLabel: string;
	};
	closePageOnboardingModal: () => void;
	showCompletionToast: () => void;
	handleFirstRecordingCompleted: () => void;
	hasCompletedFirstRecording: boolean;
	hasSeenCompletionCelebration: boolean;
	pageOnboardingSeen: Record<string, boolean>;
	isLoading: boolean;
	resetOnboardingForTesting: () => void;
}

const OnboardingContext = createContext<OnboardingContextValue | undefined>(undefined);

export const OnboardingProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
	const onboardingData = useOnboardingToasts();

	return <OnboardingContext.Provider value={onboardingData}>{children}</OnboardingContext.Provider>;
};

export const usePageOnboarding = () => {
	const context = useContext(OnboardingContext);
	if (!context) {
		throw new Error('usePageOnboarding must be used within OnboardingProvider');
	}
	return context;
};
