import React, { useState, useEffect } from 'react';
import { View, Pressable, useColorScheme, Alert, Platform, ActionSheetIOS } from 'react-native';
import { Icon } from './Icon';
import { useListStore, List } from '~/store/listStore';
import { useIsDarkMode } from '~/store/settingsStore';
import usePremiumStore from '~/store/premiumStore';
import { PremiumLimitDialog } from './PremiumLimitDialog';
import * as Haptics from 'expo-haptics';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { useTranslation } from 'react-i18next';

// Disable ContextMenu due to rendering issues - use ActionSheet/Alert instead
// The @expo/ui ContextMenu is unstable and can cause the icon to disappear
let ContextMenu: any = null;
let Host: any = null;
let ExpoButton: any = null;

interface QuickAddToListProps {
	quoteId: string;
	iconSize?: number;
	iconColor?: string;
}

export default function QuickAddToList({
	quoteId,
	iconSize = 28,
	iconColor = 'rgba(255,255,255,0.8)',
}: QuickAddToListProps) {
	const isDarkMode = useIsDarkMode();
	const colorScheme = useColorScheme();
	const { t } = useTranslation();
	const [addedLists, setAddedLists] = useState<string[]>([]);
	const [showPremiumDialog, setShowPremiumDialog] = useState(false);
	const iconScale = useSharedValue(1);

	const {
		lists,
		addQuoteToList,
		removeQuoteFromList,
		getQuoteLists,
		isQuoteInList,
		initializeLists,
		createList,
	} = useListStore();

	const { isPremium, canCreateCollection, getRemainingCollections, MAX_WEEKLY_COLLECTIONS } =
		usePremiumStore();

	useEffect(() => {
		initializeLists();
	}, []);

	const handlePress = () => {
		Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
		iconScale.value = withSpring(1.2, {}, () => {
			iconScale.value = withSpring(1);
		});

		// Get lists that already contain this quote
		const existingLists = getQuoteLists(quoteId);
		setAddedLists(existingLists.map((p) => p.id));

		// If ContextMenu is not available, use ActionSheet on iOS or Alert on Android
		if (!ContextMenu && Platform.OS === 'ios') {
			showIOSActionSheet();
		} else if (!ContextMenu) {
			showAndroidAlert();
		}
	};

	const showIOSActionSheet = () => {
		const options = [
			...lists.map((p) => {
				const isInList = isQuoteInList(p.id, quoteId);
				return isInList ? `✓ ${p.name}` : p.name;
			}),
			t('lists.createNew'),
			t('common.cancel'),
		];

		ActionSheetIOS.showActionSheetWithOptions(
			{
				options,
				cancelButtonIndex: options.length - 1,
				title: t('lists.addToList'),
			},
			(buttonIndex) => {
				if (buttonIndex < lists.length) {
					handleToggleList(lists[buttonIndex]);
				} else if (buttonIndex === lists.length) {
					handleCreateNewList();
				}
			}
		);
	};

	const showAndroidAlert = () => {
		Alert.alert(t('lists.addToList'), t('lists.chooseOrCreate'), [
			...lists.map((p) => ({
				text: isQuoteInList(p.id, quoteId) ? `✓ ${p.name}` : p.name,
				onPress: () => handleToggleList(p),
			})),
			{
				text: t('lists.createNew'),
				onPress: handleCreateNewList,
			},
			{
				text: t('common.cancel'),
				style: 'cancel',
			},
		]);
	};

	const handleToggleList = (list: List) => {
		if (isQuoteInList(list.id, quoteId)) {
			// Remove from list
			removeQuoteFromList(list.id, quoteId);
			setAddedLists(addedLists.filter((id) => id !== list.id));
			Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
		} else {
			// Add to list
			addQuoteToList(list.id, quoteId);
			setAddedLists([...addedLists, list.id]);
			Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
		}

		// Context menu closes automatically after selection
	};

	const handleCreateNewList = () => {
		// Check premium limits before allowing creation
		if (!isPremium && !canCreateCollection()) {
			setShowPremiumDialog(true);
			return;
		}

		Alert.prompt(
			t('lists.newList'),
			t('lists.newListPrompt'),
			[
				{
					text: t('common.cancel'),
					style: 'cancel',
				},
				{
					text: t('lists.create'),
					onPress: (name) => {
						if (name && name.trim()) {
							const newListId = createList(name.trim());

							// Check if creation was successful (returns empty string if limit reached)
							if (newListId) {
								// Add the current quote to the new list
								addQuoteToList(newListId, quoteId);
								setAddedLists([...addedLists, newListId]);
								Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
							} else {
								// Show premium dialog if creation failed due to limits
								setShowPremiumDialog(true);
							}
						}
					},
				},
			],
			'plain-text',
			t('lists.newListPlaceholder')
		);
	};

	const iconAnimatedStyle = useAnimatedStyle(() => ({
		transform: [{ scale: iconScale.value }],
	}));

	// Use ActionSheet/Alert for reliable rendering
	// ContextMenu (@expo/ui) was causing the icon to disappear intermittently
	return (
		<>
			<Pressable onPress={handlePress} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
				<Animated.View style={iconAnimatedStyle}>
					<Icon name="add-outline" size={iconSize} color={iconColor} />
				</Animated.View>
			</Pressable>

			<PremiumLimitDialog
				visible={showPremiumDialog}
				onClose={() => setShowPremiumDialog(false)}
				limitType="collections"
				remaining={getRemainingCollections()}
				max={MAX_WEEKLY_COLLECTIONS}
			/>
		</>
	);
}
