import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, Pressable, TouchableOpacity } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { useQuotesStore, UserQuote, EnhancedQuote } from '~/store/quotesStore';
import { Icon } from '~/components/Icon';
import { useIsDarkMode, useSettingsStore } from '~/store/settingsStore';
import QuoteCard from '~/components/QuoteCard';
import * as Haptics from 'expo-haptics';
import { BlurView } from 'expo-blur';
import { GlassFAB } from '~/components/common/GlassFAB';
// DateTimePicker, Host, Button removed - no longer needed for inline editing
import Animated, {
	useAnimatedStyle,
	useSharedValue,
	withSpring,
	withTiming,
	runOnJS,
} from 'react-native-reanimated';
import { LIST_CONTAINER_PADDING, LIST_ITEM_CLASSES } from '~/constants/layout';
import { useTranslation } from 'react-i18next';
import { useTheme } from '~/hooks/useTheme';

export default function MyQuotes() {
	const router = useRouter();
	const isDarkMode = useIsDarkMode();
	const { colors } = useTheme();
	const { userName } = useSettingsStore();
	const { t } = useTranslation();
	const {
		getUserQuotes,
		addUserQuote,
		updateUserQuote,
		deleteUserQuote,
		toggleUserQuoteFavorite,
		initializeStore,
	} = useQuotesStore();

	// Note: Modal-based editing removed in favor of inline editing

	// View mode state
	const [viewMode, setViewMode] = useState<'card' | 'list'>('list');

	// Inline editing states
	const [isCreatingNew, setIsCreatingNew] = useState(false);
	const [newQuoteData, setNewQuoteData] = useState({
		text: '',
		author: userName || '',
		categories: '',
	});

	// Inline edit states for existing quotes
	const [editingQuoteId, setEditingQuoteId] = useState<string | null>(null);
	const [editQuoteData, setEditQuoteData] = useState({
		text: '',
		author: '',
		categories: '',
	});
	// showDatePicker removed - no longer needed for inline editing

	const fabScale = useSharedValue(1);
	const newQuoteScale = useSharedValue(0.98);
	const newQuoteOpacity = useSharedValue(0);
	const editQuoteScale = useSharedValue(1);
	const editQuoteOpacity = useSharedValue(1);

	useEffect(() => {
		initializeStore();
	}, []);

	const userQuotes = getUserQuotes();

	// Convert UserQuote to EnhancedQuote format for QuoteCard
	const convertUserQuoteToEnhanced = React.useCallback(
		(userQuote: UserQuote): EnhancedQuote => ({
			id: userQuote.id,
			text: userQuote.text,
			author: {
				id: `user-author-${userQuote.id}`,
				name: userQuote.author,
				profession: [],
			},
			authorId: `user-author-${userQuote.id}`,
			categories: userQuote.categories || [],
			tags: userQuote.categories || [],
			isFavorite: userQuote.isFavorite || false,
			source: userQuote.quoteDate
				? new Date(userQuote.quoteDate).toLocaleDateString('de-DE')
				: undefined,
			year: userQuote.quoteDate
				? new Date(userQuote.quoteDate).getFullYear().toString()
				: undefined,
			category: userQuote.categories?.[0] || 'personal',
		}),
		[]
	);

	// Create empty quote for inline creation
	const createEmptyQuote = React.useCallback(
		(): EnhancedQuote => ({
			id: 'new-quote-temp',
			text: newQuoteData.text,
			author: {
				id: 'new-author-temp',
				name: newQuoteData.author,
				profession: [],
			},
			authorId: 'new-author-temp',
			categories: newQuoteData.categories
				.split(',')
				.map((c) => c.trim())
				.filter((c) => c.length > 0),
			tags: [],
			isFavorite: false,
			source: undefined,
			year: undefined,
			category: 'personal',
		}),
		[newQuoteData]
	);

	// Create display data including potential new quote at top
	const displayQuotes = React.useMemo(() => {
		if (isCreatingNew) {
			const emptyQuote = createEmptyQuote();
			return [emptyQuote, ...userQuotes.map(convertUserQuoteToEnhanced)];
		}
		return userQuotes.map(convertUserQuoteToEnhanced);
	}, [isCreatingNew, userQuotes, createEmptyQuote, convertUserQuoteToEnhanced]);

	// Note: Modal-based editor functions removed in favor of inline editing

	const handleDelete = (id: string) => {
		Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
		deleteUserQuote(id);
	};

	// Inline editing functions
	const startInlineCreation = () => {
		setNewQuoteData({
			text: '',
			author: userName || '',
			categories: '',
		});
		setIsCreatingNew(true);

		// Animate new quote appearance - very subtle
		newQuoteScale.value = withSpring(1, { damping: 25, stiffness: 300, mass: 0.8 });
		newQuoteOpacity.value = withTiming(1, { duration: 100 });

		Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
	};

	const handleInlineTextChange = (text: string) => {
		setNewQuoteData((prev) => ({ ...prev, text }));
	};

	const handleInlineAuthorChange = (author: string) => {
		setNewQuoteData((prev) => ({ ...prev, author }));
	};

	const handleInlineCategoryChange = (categories: string) => {
		setNewQuoteData((prev) => ({ ...prev, categories }));
	};

	const saveInlineQuote = () => {
		if (!newQuoteData.text.trim()) return;

		const categories = newQuoteData.categories
			.split(',')
			.map((c) => c.trim())
			.filter((c) => c.length > 0);

		const finalAuthor = newQuoteData.author || userName || 'Ich';

		addUserQuote({
			text: newQuoteData.text,
			author: finalAuthor,
			categories,
			quoteDate: new Date().toISOString(),
		});

		// Animate out and reset
		newQuoteScale.value = withSpring(0.8, {}, () => {
			newQuoteScale.value = withSpring(1);
		});

		setIsCreatingNew(false);
		setNewQuoteData({
			text: '',
			author: userName || '',
			categories: '',
		});

		// Reset animation values
		newQuoteScale.value = 0.98;
		newQuoteOpacity.value = 0;

		Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
	};

	// Helper function to reset state safely
	const resetCreationState = () => {
		setIsCreatingNew(false);
		setNewQuoteData({
			text: '',
			author: userName || '',
			categories: '',
		});
		// Reset animation values
		newQuoteScale.value = 0.98;
		newQuoteOpacity.value = 0;
	};

	const cancelInlineCreation = () => {
		Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

		// Animate out before removing - subtle and fast
		newQuoteScale.value = withTiming(0.95, { duration: 100 });
		newQuoteOpacity.value = withTiming(0, { duration: 150 }, (finished) => {
			// Only reset if animation completed successfully
			if (finished) {
				runOnJS(resetCreationState)();
			}
		});
	};

	// Inline edit functions for existing quotes
	const startInlineEdit = (quote: UserQuote) => {
		setEditingQuoteId(quote.id);
		setEditQuoteData({
			text: quote.text,
			author: quote.author,
			categories: quote.categories?.join(', ') || '',
		});

		// Subtle animation feedback
		editQuoteScale.value = withSpring(0.98, { damping: 25, stiffness: 300, mass: 0.8 });
		editQuoteOpacity.value = withTiming(0.95, { duration: 100 });

		Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
	};

	const handleEditTextChange = (text: string) => {
		setEditQuoteData((prev) => ({ ...prev, text }));
	};

	const handleEditAuthorChange = (author: string) => {
		setEditQuoteData((prev) => ({ ...prev, author }));
	};

	const handleEditCategoryChange = (categories: string) => {
		setEditQuoteData((prev) => ({ ...prev, categories }));
	};

	const saveInlineEdit = () => {
		if (!editQuoteData.text.trim() || !editingQuoteId) return;

		const categories = editQuoteData.categories
			.split(',')
			.map((c) => c.trim())
			.filter((c) => c.length > 0);

		const finalAuthor = editQuoteData.author || userName || 'Ich';

		updateUserQuote(editingQuoteId, {
			text: editQuoteData.text,
			author: finalAuthor,
			categories,
			quoteDate:
				userQuotes.find((q) => q.id === editingQuoteId)?.quoteDate || new Date().toISOString(),
		});

		// Animate completion
		editQuoteScale.value = withSpring(1.02, {}, () => {
			editQuoteScale.value = withSpring(1);
		});
		editQuoteOpacity.value = withTiming(1, { duration: 150 });

		setEditingQuoteId(null);
		setEditQuoteData({
			text: '',
			author: '',
			categories: '',
		});

		Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
	};

	const cancelInlineEdit = () => {
		Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

		// Animate back to normal
		editQuoteScale.value = withSpring(1, { damping: 25, stiffness: 300 });
		editQuoteOpacity.value = withTiming(1, { duration: 150 });

		setEditingQuoteId(null);
		setEditQuoteData({
			text: '',
			author: '',
			categories: '',
		});
	};

	// fabAnimatedStyle removed - not needed for current FAB implementation

	const newQuoteAnimatedStyle = useAnimatedStyle(() => ({
		transform: [{ scale: newQuoteScale.value }],
		opacity: newQuoteOpacity.value,
	}));

	const editQuoteAnimatedStyle = useAnimatedStyle(() => ({
		transform: [{ scale: editQuoteScale.value }],
		opacity: editQuoteOpacity.value,
	}));

	const renderQuote = ({ item, index }: { item: EnhancedQuote; index: number }) => {
		const isNewQuote = item.id === 'new-quote-temp';
		const isBeingEdited = editingQuoteId === item.id;

		if (isNewQuote) {
			return (
				<Animated.View style={newQuoteAnimatedStyle} className="mb-5">
					<QuoteCard
						quote={item}
						variant="edit"
						editMode={true}
						onToggleFavorite={() => {}}
						onTextChange={handleInlineTextChange}
						onAuthorChange={handleInlineAuthorChange}
						onCategoryChange={handleInlineCategoryChange}
						onSave={saveInlineQuote}
						onCancel={cancelInlineCreation}
					/>
				</Animated.View>
			);
		}

		// Find original UserQuote for existing quotes
		const originalQuote = userQuotes.find((q) => q.id === item.id);
		if (!originalQuote) return null;

		// If this quote is being edited inline, show edit mode
		if (isBeingEdited) {
			const editQuote: EnhancedQuote = {
				...item,
				text: editQuoteData.text,
				author: {
					...item.author,
					name: editQuoteData.author,
				},
				categories: editQuoteData.categories
					.split(',')
					.map((c) => c.trim())
					.filter((c) => c.length > 0),
			};

			return (
				<Animated.View style={editQuoteAnimatedStyle} className="mb-5">
					<QuoteCard
						quote={editQuote}
						variant="edit"
						editMode={true}
						onToggleFavorite={() => {}}
						onTextChange={handleEditTextChange}
						onAuthorChange={handleEditAuthorChange}
						onCategoryChange={handleEditCategoryChange}
						onSave={saveInlineEdit}
						onCancel={cancelInlineEdit}
					/>
				</Animated.View>
			);
		}

		// Use different variant based on viewMode
		if (viewMode === 'card') {
			return (
				<View style={{ position: 'relative', width: '100%' }}>
					<QuoteCard
						quote={item}
						variant="vertical"
						index={index}
						cardHeight={600} // Adjust height as needed
						onToggleFavorite={() => toggleUserQuoteFavorite(originalQuote.id)}
						onAuthorPress={() => {}}
						onEdit={() => startInlineEdit(originalQuote)}
						onDelete={() => handleDelete(originalQuote.id)}
					/>
				</View>
			);
		}

		// List view (default)
		return (
			<View className="mb-5">
				<QuoteCard
					quote={item}
					onToggleFavorite={() => toggleUserQuoteFavorite(originalQuote.id)}
					onAuthorPress={() => {}} // Remove author press to avoid modal
					onEdit={() => startInlineEdit(originalQuote)}
					onDelete={() => handleDelete(originalQuote.id)}
				/>
			</View>
		);
	};

	return (
		<>
			<Stack.Screen
				options={{
					title: t('myQuotes.title'),
					headerShown: true,
					headerTransparent: true,
					headerBlurEffect: isDarkMode ? 'dark' : 'light',
					headerStyle: {
						backgroundColor: 'transparent',
					},
					headerTintColor: isDarkMode ? '#ffffff' : '#000000',
					headerShadowVisible: false,
					headerRight: () => (
						<View style={{ flexDirection: 'row', alignItems: 'center' }}>
							<TouchableOpacity
								onPress={() => {
									Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
									setViewMode(viewMode === 'card' ? 'list' : 'card');
								}}
								style={{
									justifyContent: 'center',
									alignItems: 'center',
									width: 44,
									height: 44,
									marginTop: -4,
								}}
							>
								<Icon
									name={viewMode === 'list' ? 'grid-outline' : 'list-outline'}
									size={24}
									color={isDarkMode ? '#ffffff' : '#000000'}
								/>
							</TouchableOpacity>
							<TouchableOpacity
								onPress={() => router.push('/settings')}
								style={{
									justifyContent: 'center',
									alignItems: 'center',
									width: 44,
									height: 44,
									marginTop: -4,
								}}
							>
								<Icon
									name="settings-outline"
									size={24}
									color={isDarkMode ? '#ffffff' : '#000000'}
								/>
							</TouchableOpacity>
						</View>
					),
					headerRightContainerStyle: {
						paddingRight: 16,
					},
				}}
			/>

			<View style={{ flex: 1, backgroundColor: colors.background }}>
				{userQuotes.length === 0 && !isCreatingNew ? (
					<View className="flex-1 justify-center items-center px-6" style={{ paddingTop: 100 }}>
						<Icon
							name="create-outline"
							size={64}
							color={isDarkMode ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)'}
						/>
						<Text
							className={`${isDarkMode ? 'text-white/60' : 'text-black/60'} text-lg mt-4 text-center font-semibold`}
						>
							{t('myQuotes.noQuotes')}
						</Text>
						<Text
							className={`${isDarkMode ? 'text-white/40' : 'text-black/40'} text-sm mt-2 text-center`}
						>
							{t('myQuotes.createFirst')}
						</Text>
					</View>
				) : (
					<FlatList
						data={displayQuotes}
						renderItem={renderQuote}
						keyExtractor={(item) => item.id}
						showsVerticalScrollIndicator={false}
						contentContainerStyle={{
							paddingBottom: LIST_CONTAINER_PADDING.bottom,
							paddingTop: LIST_CONTAINER_PADDING.top,
						}}
						pagingEnabled={viewMode === 'card'}
						snapToInterval={viewMode === 'card' ? 600 : undefined}
						snapToAlignment={viewMode === 'card' ? 'start' : undefined}
						decelerationRate={viewMode === 'card' ? 'fast' : 'normal'}
					/>
				)}

				{/* Floating Action Button */}
				{!isCreatingNew && (
					<GlassFAB
						onPress={startInlineCreation}
						icon="add"
						size="medium"
						position="bottom-right"
					/>
				)}

				{/* Modal-based editing removed - now using inline editing */}
			</View>
		</>
	);
}
