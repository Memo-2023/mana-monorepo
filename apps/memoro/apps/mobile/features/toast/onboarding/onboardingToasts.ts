import { useToast } from '../contexts/ToastContext';
import { useOnboardingStore, type PageName } from '~/features/onboarding';
import { useToastStore } from '../store/toastStore';
import { useTranslation } from 'react-i18next';
import { useEffect, useRef, useCallback, useState } from 'react';

interface PageOnboardingState {
	visible: boolean;
	pageName: PageName | null;
	title: string;
	message: string;
	features: Array<{ icon: string; title: string; description: string }>;
	actionLabel: string;
}

export const useOnboardingToasts = () => {
	const toast = useToast();
	const { t } = useTranslation();
	const completionToastShown = useRef(false);
	const [pageOnboardingModal, setPageOnboardingModal] = useState<PageOnboardingState>({
		visible: false,
		pageName: null,
		title: '',
		message: '',
		features: [],
		actionLabel: '',
	});

	const {
		hasSeenRecordingTutorial,
		hasCompletedFirstRecording,
		hasSeenCompletionCelebration,
		pageOnboardingSeen,
		isLoading,
		hasLoadedInitialState,
		loadOnboardingState,
		markRecordingTutorialSeen,
		markFirstRecordingCompleted,
		markCompletionCelebrationSeen,
		markPageOnboardingSeen,
		hasSeenPageOnboarding,
	} = useOnboardingStore();

	// Load onboarding state on mount only once
	useEffect(() => {
		loadOnboardingState();
	}, []); // Empty dependency array - only load once

	const showCompletionToast = () => {
		if (isLoading || hasSeenCompletionCelebration || completionToastShown.current) {
			return null;
		}

		completionToastShown.current = true;
		console.debug('Showing completion toast');

		// Clear any existing toasts first
		const { clearAll } = useToastStore.getState();
		clearAll();

		const toastId = toast.showToast({
			type: 'success',
			title: t('onboarding.completion.title'),
			message: t('onboarding.completion.message'),
			duration: 0, // Persistent
			action: {
				label: t('onboarding.completion.action'),
				onPress: () => {
					markCompletionCelebrationSeen();
					toast.hideToast(toastId);
				},
			},
		});

		return toastId;
	};

	const handleFirstRecordingCompleted = () => {
		markFirstRecordingCompleted();

		// Show completion toast after a delay
		setTimeout(() => {
			showCompletionToast();
		}, 1000);
	};

	const showPageOnboardingToast = useCallback(
		(pageName: PageName) => {
			// Don't show if still loading, not loaded yet, or already seen
			if (isLoading || !hasLoadedInitialState || hasSeenPageOnboarding(pageName)) {
				console.debug(
					`⏭️ Skipping onboarding for ${pageName} - already seen, loading, or not loaded yet`
				);
				return null;
			}

			// Don't show if there's already a modal showing
			if (pageOnboardingModal.visible) {
				console.debug(`⏭️ Skipping onboarding for ${pageName} - modal already showing`);
				return null;
			}

			console.debug(`Showing onboarding modal for page: ${pageName}`);

			// Build features array if available
			const features = [];

			// Check if this page has features defined in translations
			if (pageName === 'record') {
				// For recording home, build features from translations
				const recordingFeature = {
					icon: 'mic-outline',
					title: t(`onboarding.pages.${pageName}.features.recording.title`),
					description: t(`onboarding.pages.${pageName}.features.recording.description`),
				};
				const blueprintsFeature = {
					icon: 'document-text-outline',
					title: t(`onboarding.pages.${pageName}.features.blueprints.title`),
					description: t(`onboarding.pages.${pageName}.features.blueprints.description`),
				};
				const languageFeature = {
					icon: 'language-outline',
					title: t(`onboarding.pages.${pageName}.features.language.title`),
					description: t(`onboarding.pages.${pageName}.features.language.description`),
				};
				features.push(recordingFeature, blueprintsFeature, languageFeature);
				console.debug('🎯 Built recording features:', features);
			} else if (pageName === 'memos') {
				// For memos page, build features from translations
				const browseFeature = {
					icon: 'list-outline',
					title: t(`onboarding.pages.${pageName}.features.browse.title`),
					description: t(`onboarding.pages.${pageName}.features.browse.description`),
				};
				const searchFeature = {
					icon: 'search-outline',
					title: t(`onboarding.pages.${pageName}.features.search.title`),
					description: t(`onboarding.pages.${pageName}.features.search.description`),
				};
				const organizeFeature = {
					icon: 'checkmark-circle-outline',
					title: t(`onboarding.pages.${pageName}.features.organize.title`),
					description: t(`onboarding.pages.${pageName}.features.organize.description`),
				};
				features.push(browseFeature, searchFeature, organizeFeature);
				console.debug('🎯 Built memos features:', features);
			} else if (pageName === 'blueprints') {
				// For blueprints page, build features from translations
				const modesFeature = {
					icon: 'document-text-outline',
					title: t(`onboarding.pages.${pageName}.features.modes.title`),
					description: t(`onboarding.pages.${pageName}.features.modes.description`),
				};
				const pinFeature = {
					icon: 'pin-outline',
					title: t(`onboarding.pages.${pageName}.features.pin.title`),
					description: t(`onboarding.pages.${pageName}.features.pin.description`),
				};
				const feedbackFeature = {
					icon: 'chatbubble-outline',
					title: t(`onboarding.pages.${pageName}.features.feedback.title`),
					description: t(`onboarding.pages.${pageName}.features.feedback.description`),
				};
				features.push(modesFeature, pinFeature, feedbackFeature);
				console.debug('🎯 Built blueprints features:', features);
			} else if (pageName === 'tags') {
				// For tags page, build features from translations
				const sortFeature = {
					icon: 'color-palette-outline',
					title: t(`onboarding.pages.${pageName}.features.sort.title`),
					description: t(`onboarding.pages.${pageName}.features.sort.description`),
				};
				const pinFeature = {
					icon: 'pin-outline',
					title: t(`onboarding.pages.${pageName}.features.pin.title`),
					description: t(`onboarding.pages.${pageName}.features.pin.description`),
				};
				const configurableFeature = {
					icon: 'options-outline',
					title: t(`onboarding.pages.${pageName}.features.configurable.title`),
					description: t(`onboarding.pages.${pageName}.features.configurable.description`),
				};
				features.push(sortFeature, pinFeature, configurableFeature);
				console.debug('🎯 Built tags features:', features);
			} else if (pageName === 'audio_archive') {
				// For audio archive page, build features from translations
				const localFeature = {
					icon: 'download-outline',
					title: t(`onboarding.pages.${pageName}.features.local.title`),
					description: t(`onboarding.pages.${pageName}.features.local.description`),
				};
				const reuploadFeature = {
					icon: 'cloud-upload-outline',
					title: t(`onboarding.pages.${pageName}.features.reupload.title`),
					description: t(`onboarding.pages.${pageName}.features.reupload.description`),
				};
				features.push(localFeature, reuploadFeature);
				console.debug('🎯 Built audio_archive features:', features);
			} else if (pageName === 'subscription') {
				// For subscription page, build features from translations
				const manaFeature = {
					icon: 'flash-outline',
					title: t(`onboarding.pages.${pageName}.features.mana.title`),
					description: t(`onboarding.pages.${pageName}.features.mana.description`),
				};
				const flexibleFeature = {
					icon: 'card-outline',
					title: t(`onboarding.pages.${pageName}.features.flexible.title`),
					description: t(`onboarding.pages.${pageName}.features.flexible.description`),
				};
				const transparentFeature = {
					icon: 'analytics-outline',
					title: t(`onboarding.pages.${pageName}.features.transparent.title`),
					description: t(`onboarding.pages.${pageName}.features.transparent.description`),
				};
				const crossAppFeature = {
					icon: 'sync-outline',
					title: t(`onboarding.pages.${pageName}.features.cross_app.title`),
					description: t(`onboarding.pages.${pageName}.features.cross_app.description`),
				};
				features.push(manaFeature, flexibleFeature, transparentFeature, crossAppFeature);
				console.debug('🎯 Built subscription features:', features);
			} else if (pageName === 'memo_detail') {
				// For memo detail page, build features from translations
				const shareFeature = {
					icon: 'share-outline',
					title: t(`onboarding.pages.${pageName}.features.share.title`),
					description: t(`onboarding.pages.${pageName}.features.share.description`),
				};
				const extendFeature = {
					icon: 'mic-outline',
					title: t(`onboarding.pages.${pageName}.features.extend.title`),
					description: t(`onboarding.pages.${pageName}.features.extend.description`),
				};
				const editFeature = {
					icon: 'create-outline',
					title: t(`onboarding.pages.${pageName}.features.edit.title`),
					description: t(`onboarding.pages.${pageName}.features.edit.description`),
				};
				features.push(shareFeature, extendFeature, editFeature);
				console.debug('🎯 Built memo_detail features:', features);
			} else if (pageName === 'statistics') {
				// For statistics page, build features from translations
				const insightsFeature = {
					icon: 'pulse-outline',
					title: t(`onboarding.pages.${pageName}.features.insights.title`),
					description: t(`onboarding.pages.${pageName}.features.insights.description`),
				};
				const streaksFeature = {
					icon: 'flame-outline',
					title: t(`onboarding.pages.${pageName}.features.streaks.title`),
					description: t(`onboarding.pages.${pageName}.features.streaks.description`),
				};
				const analyticsFeature = {
					icon: 'location-outline',
					title: t(`onboarding.pages.${pageName}.features.analytics.title`),
					description: t(`onboarding.pages.${pageName}.features.analytics.description`),
				};
				features.push(insightsFeature, streaksFeature, analyticsFeature);
				console.debug('🎯 Built statistics features:', features);
			}

			console.debug('🎯 Final features array:', features);

			// Show modal instead of toast
			setPageOnboardingModal({
				visible: true,
				pageName,
				title: t(`onboarding.pages.${pageName}.title`),
				message: t(`onboarding.pages.${pageName}.message`),
				features,
				actionLabel: t(`onboarding.pages.${pageName}.action`),
			});

			return pageName;
		},
		[
			isLoading,
			hasLoadedInitialState,
			hasSeenPageOnboarding,
			t,
			pageOnboardingSeen,
			pageOnboardingModal.visible,
		]
	);

	const closePageOnboardingModal = useCallback(async () => {
		const { pageName } = pageOnboardingModal;
		if (pageName) {
			console.debug(`✅ Closing modal - Marking page onboarding as seen for: ${pageName}`);
			await markPageOnboardingSeen(pageName);
			console.debug(`✅ markPageOnboardingSeen completed for: ${pageName}`);
		}
		setPageOnboardingModal({
			visible: false,
			pageName: null,
			title: '',
			message: '',
			features: [],
			actionLabel: '',
		});
	}, [pageOnboardingModal, markPageOnboardingSeen]);

	const cleanupPageToast = useCallback(
		(pageName: PageName) => {
			if (pageOnboardingModal.pageName === pageName) {
				setPageOnboardingModal({
					visible: false,
					pageName: null,
					title: '',
					message: '',
					features: [],
					actionLabel: '',
				});
				console.debug(`Cleaned up onboarding modal for page: ${pageName}`);
			}
		},
		[pageOnboardingModal]
	);

	const resetOnboardingForTesting = () => {
		const { resetOnboarding } = useOnboardingStore.getState();
		resetOnboarding();
		completionToastShown.current = false;
		console.debug('🔄 Onboarding reset for testing');
	};

	return {
		showCompletionToast,
		showPageOnboardingToast,
		cleanupPageToast,
		handleFirstRecordingCompleted,
		hasCompletedFirstRecording,
		hasSeenCompletionCelebration,
		pageOnboardingSeen,
		hasSeenPageOnboarding,
		isLoading,
		resetOnboardingForTesting, // For testing purposes
		pageOnboardingModal,
		closePageOnboardingModal,
	};
};
