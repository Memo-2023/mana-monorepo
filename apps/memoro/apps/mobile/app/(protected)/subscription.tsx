import React, { useState, useCallback, useEffect } from 'react';
import { View, Alert } from 'react-native';
import { Stack, useRouter, useFocusEffect } from 'expo-router';
import { useTheme } from '~/features/theme/ThemeProvider';
import SubscriptionPage from '~/features/subscription/SubscriptionPage';
import SubscriptionPageSkeleton from '~/features/subscription/SubscriptionPageSkeleton';
import SubscriptionMenu from '~/features/subscription/SubscriptionMenu';
import { B2BSubscriptionMessage } from '~/features/subscription/B2BSubscriptionMessage';
import { useHeader } from '~/features/menus/HeaderContext';
import { useTranslation } from 'react-i18next';
import { authService } from '~/features/auth/services/authService';
import colors from '~/tailwind.config.js';
import { usePageOnboarding } from '~/features/onboarding/contexts/OnboardingContext';
import { useAnalytics, useScreenTracking } from '~/features/analytics';

function SubscriptionScreen() {
	const { isDark, themeVariant, tw } = useTheme();
	const router = useRouter();
	const { t } = useTranslation();
	const [isB2BUser, setIsB2BUser] = useState<boolean | null>(null);
	const { track } = useAnalytics();

	// Track screen view
	useScreenTracking('subscription_page', {
		is_b2b: isB2BUser,
	});

	// Page onboarding
	const { showPageOnboardingToast, cleanupPageToast } = usePageOnboarding();

	// Check if user is B2B user
	useEffect(() => {
		const checkB2BStatus = async () => {
			try {
				const isB2B = await authService.isB2BUser();
				console.log('[SubscriptionScreen] B2B status:', isB2B);
				setIsB2BUser(isB2B);
			} catch (error) {
				console.error('Error checking B2B status:', error);
				setIsB2BUser(false); // Default to regular user on error
			}
		};

		checkB2BStatus();
	}, []);

	// Direct access to background color from tailwind config
	const pageBackgroundColor = isDark
		? (colors as any).theme?.extend?.colors?.dark?.[themeVariant]?.pageBackground
		: (colors as any).theme?.extend?.colors?.[themeVariant]?.pageBackground;

	// Funktion zum Wiederherstellen von Käufen
	const handleRestorePurchases = () => {
		// Track restore purchases
		track('subscription_restore_attempted');

		// In einer echten App würde hier die RevenueCat-Funktion aufgerufen werden
		Alert.alert(
			t('subscription.restore_title', 'Restore Purchases'),
			t('subscription.restore_message', 'Your purchases are being restored...')
		);

		// Simuliere eine Verzögerung
		setTimeout(() => {
			Alert.alert(
				t('subscription.restore_success', 'Success'),
				t('subscription.restore_success_message', 'Your purchases have been successfully restored.')
			);
			track('subscription_restore_completed');
		}, 1500);
	};

	// Header-Konfiguration mit dem useHeader-Hook aktualisieren
	const { updateConfig } = useHeader();

	// Header-Konfiguration aktualisieren, wenn die Seite fokussiert wird
	useFocusEffect(
		useCallback(() => {
			console.debug('Subscription page focused, updating header config');

			// Erstelle ein benutzerdefiniertes Element für das SubscriptionMenu mit dem gleichen Container wie HeaderMenu
			const subscriptionMenuElement = (
				<View style={{ marginRight: 18 }}>
					<SubscriptionMenu onRestorePurchases={handleRestorePurchases} />
				</View>
			);

			updateConfig({
				title: t('subscription.title', 'Buy Mana'),
				showBackButton: true,
				showMenu: false,
				rightIcons: [
					{
						name: 'ellipsis-vertical', // Wird nicht verwendet, aber erforderlich für die Typprüfung
						customElement: subscriptionMenuElement,
					},
				],
			});

			// Show onboarding toast for subscription page
			showPageOnboardingToast('subscription');

			// Header-Konfiguration zurücksetzen, wenn die Komponente unfokussiert wird
			return () => {
				// Cleanup page toast when leaving subscription page
				cleanupPageToast('subscription');

				console.debug('Subscription page unfocused');
			};
		}, [t])
	);

	// Show loading while checking B2B status
	if (isB2BUser === null) {
		return (
			<View className="flex-1" style={{ backgroundColor: pageBackgroundColor }}>
				<Stack.Screen options={{ headerShown: false }} />
				<SubscriptionPageSkeleton />
			</View>
		);
	}

	return (
		<View className="flex-1" style={{ backgroundColor: pageBackgroundColor }}>
			<Stack.Screen options={{ headerShown: false }} />

			{isB2BUser ? <B2BSubscriptionMessage /> : <SubscriptionPage />}
		</View>
	);
}

export default SubscriptionScreen;
