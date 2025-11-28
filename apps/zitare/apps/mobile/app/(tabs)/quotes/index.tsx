import { useRouter, useLocalSearchParams, Stack } from 'expo-router';
import {
	View,
	Text,
	ActivityIndicator,
	Dimensions,
	FlatList,
	TouchableOpacity,
} from 'react-native';
import { useQuotesStore } from '~/store/quotesStore';
import QuoteCard from '~/components/QuoteCard';
import * as Haptics from 'expo-haptics';
import { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import { Icon } from '~/components/Icon';
import { useIsDarkMode } from '~/store/settingsStore';
import { useTranslation } from 'react-i18next';
import { GlassTabSelector } from '~/components/common/GlassTabSelector';
import Animated, { useSharedValue, useAnimatedScrollHandler } from 'react-native-reanimated';
import { LIST_CONTAINER_PADDING } from '~/constants/layout';
import { useTheme } from '~/hooks/useTheme';
import { QuoteFilterSheet } from '~/components/quotes/QuoteFilterSheet';
import { ActiveQuoteFilterChips } from '~/components/quotes/ActiveQuoteFilterChips';
import {
	filterQuotes,
	QuoteFilters,
	hasActiveFilters as checkHasActiveFilters,
} from '~/utils/quoteFilters';
import BottomSheet from '@gorhom/bottom-sheet';

const { height: screenHeight } = Dimensions.get('window');
const STATUS_BAR_HEIGHT = 44; // iOS status bar
const TAB_BAR_HEIGHT = 80; // Tab bar height

const AnimatedFlatList = Animated.createAnimatedComponent(FlatList);

export default function Home() {
	const router = useRouter();
	const params = useLocalSearchParams();
	const { widgetQuoteId, q: searchQuery } = params;
	const { t } = useTranslation();
	const isDarkMode = useIsDarkMode();
	const { colors } = useTheme();
	const [displayedQuotes, setDisplayedQuotes] = useState([]);
	const [activeFilter, setActiveFilter] = useState<'recommended' | 'favorites'>('recommended');
	const [viewMode, setViewMode] = useState<'card' | 'list'>('card');
	const [filters, setFilters] = useState<QuoteFilters>({
		timePeriods: [],
		sourceTypes: [],
		categories: [],
		authorEras: [],
		special: [],
	});
	const flatListRef = useRef(null);
	const bottomSheetRef = useRef<BottomSheet>(null);
	const usedQuoteIds = useRef(new Set());
	const scrollY = useSharedValue(0);

	const { quotes, toggleFavorite, getFavorites, isLoading, isInitialized } = useQuotesStore();

	// Filter quotes based on active filter, advanced filters, and search query
	const filteredQuotes = useMemo(() => {
		// Safety check: ensure quotes array exists
		if (!quotes || !Array.isArray(quotes)) {
			return [];
		}

		let quotesToFilter = activeFilter === 'favorites' ? getFavorites() : quotes;

		// Apply advanced filters
		quotesToFilter = filterQuotes(quotesToFilter, filters);

		// Then apply search query if present
		if (searchQuery && typeof searchQuery === 'string' && searchQuery.trim()) {
			const query = searchQuery.toLowerCase().trim();
			quotesToFilter = quotesToFilter.filter(
				(quote) =>
					quote.text.toLowerCase().includes(query) ||
					(quote.author?.name && quote.author.name.toLowerCase().includes(query)) ||
					(quote.tags && quote.tags.some((tag: string) => tag.toLowerCase().includes(query)))
			);
		}

		return quotesToFilter;
	}, [quotes, activeFilter, getFavorites, searchQuery, filters]);

	// Height calculations
	const TOTAL_TOP_HEIGHT = STATUS_BAR_HEIGHT;
	const TAB_SELECTOR_HEIGHT = 60; // Height of TabSelector component
	const AVAILABLE_HEIGHT = screenHeight - TOTAL_TOP_HEIGHT - TAB_BAR_HEIGHT - TAB_SELECTOR_HEIGHT;
	const CARD_HEIGHT = AVAILABLE_HEIGHT * 0.9; // Cards take 90% of available height
	const VERTICAL_PADDING = (AVAILABLE_HEIGHT - CARD_HEIGHT) / 2; // Center padding

	// Handle widget deep link
	useEffect(() => {
		if (widgetQuoteId && quotes.length > 0 && displayedQuotes.length > 0) {
			// Find quote by hash value (matching Swift's hashValue)
			const targetQuote = quotes.find((q) => {
				// Simple hash calculation that should be more consistent
				const hash = Math.abs(
					q.text.split('').reduce((a: number, b: string) => {
						a = (a << 5) - a + b.charCodeAt(0);
						return a & a;
					}, 0)
				);
				return String(hash) === String(widgetQuoteId);
			});

			if (targetQuote) {
				// Check if quote is already in displayed quotes
				const existingIndex = displayedQuotes.findIndex((q: any) => q.id === targetQuote.id);

				if (existingIndex !== -1) {
					// Quote already displayed, scroll to it
					setTimeout(() => {
						flatListRef.current?.scrollToIndex({
							index: existingIndex,
							animated: true,
						});
					}, 500);
				} else {
					// Add quote to beginning of list (after daily quote)
					setDisplayedQuotes((prev) => [targetQuote, ...prev]);
					usedQuoteIds.current.add(targetQuote.id);

					// Scroll to the new quote
					setTimeout(() => {
						flatListRef.current?.scrollToIndex({
							index: 0,
							animated: true,
						});
					}, 500);
				}

				// Haptic feedback
				Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
			}
		}
	}, [widgetQuoteId, quotes, displayedQuotes]);

	// Initialize with random quotes when quotes are loaded
	useEffect(() => {
		// Only run once when initialized and quotes are available
		if (!isInitialized || !quotes || quotes.length === 0 || displayedQuotes.length > 0) {
			return;
		}

		// Add initial set of random quotes
		const initialQuotes = [];
		const availableQuotes = [...quotes]; // Create a copy to avoid mutating the original

		// Pre-load 5 random quotes
		for (let i = 0; i < Math.min(5, availableQuotes.length); i++) {
			const randomIndex = Math.floor(Math.random() * availableQuotes.length);
			const quote = availableQuotes[randomIndex];
			if (!usedQuoteIds.current.has(quote.id)) {
				initialQuotes.push(quote);
				usedQuoteIds.current.add(quote.id);
				availableQuotes.splice(randomIndex, 1);
			}
		}

		if (initialQuotes.length > 0) {
			setDisplayedQuotes(initialQuotes);
		}
	}, [isInitialized, quotes.length]); // Only depend on isInitialized and quotes.length, not quotes array

	// Update displayedQuotes when quotes change (for favorites)
	useEffect(() => {
		if (displayedQuotes.length > 0 && quotes.length > 0 && isInitialized) {
			setDisplayedQuotes((prevDisplayed) =>
				prevDisplayed
					.filter((displayedQuote) => displayedQuote && displayedQuote.id) // Filter out invalid quotes
					.map((displayedQuote) => {
						const updatedQuote = quotes.find((q) => q.id === displayedQuote.id);
						return updatedQuote || displayedQuote;
					})
			);
		}
	}, [quotes, displayedQuotes.length, isInitialized]);

	const loadMoreQuotes = useCallback(() => {
		if (!quotes || quotes.length === 0) return;

		const availableQuotes = quotes.filter((q) => !usedQuoteIds.current.has(q.id));

		if (availableQuotes.length === 0) {
			// Reset and start over
			usedQuoteIds.current.clear();
			// Restart with new quotes
			const newQuotes = [];
			const freshQuotes = quotes;
			for (let i = 0; i < Math.min(3, freshQuotes.length); i++) {
				const randomIndex = Math.floor(Math.random() * freshQuotes.length);
				const quote = freshQuotes[randomIndex];
				if (!usedQuoteIds.current.has(quote.id)) {
					newQuotes.push(quote);
					usedQuoteIds.current.add(quote.id);
					freshQuotes.splice(randomIndex, 1);
				}
			}
			setDisplayedQuotes((prev) => [...prev, ...newQuotes]);
			return;
		}

		// Add 3 more random quotes
		const newQuotes = [];
		for (let i = 0; i < Math.min(3, availableQuotes.length); i++) {
			const randomIndex = Math.floor(Math.random() * availableQuotes.length);
			const quote = availableQuotes[randomIndex];
			if (!usedQuoteIds.current.has(quote.id)) {
				newQuotes.push(quote);
				usedQuoteIds.current.add(quote.id);
				availableQuotes.splice(randomIndex, 1);
			}
		}

		if (newQuotes.length > 0) {
			setDisplayedQuotes((prev) => [...prev, ...newQuotes]);
		}
	}, [quotes]);

	const scrollHandler = useAnimatedScrollHandler({
		onScroll: (event) => {
			scrollY.value = event.contentOffset.y;
		},
	});

	const handleEndReached = () => {
		loadMoreQuotes();
	};

	// Author press handler - reusable
	const handleAuthorPress = useCallback(
		(quote: EnhancedQuote) => {
			const authorId = quote.authorId || quote.author?.id;
			if (authorId) {
				Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
				router.push(`/author/${authorId}`);
			}
		},
		[router]
	);

	// Get favorites count
	const favoriteQuotes = getFavorites();

	// Tab handling
	const tabs = [
		{ key: 'recommended', label: t('common.recommended') },
		{ key: 'favorites', label: t('navigation.favorites'), count: favoriteQuotes?.length || 0 },
	];

	const handleTabChange = (tabKey: string) => {
		setActiveFilter(tabKey as 'recommended' | 'favorites');
		// Scroll to top when switching tabs
		flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
	};

	// Filter handlers
	const handleRemoveFilter = (category: keyof QuoteFilters, value: string) => {
		setFilters((prev) => ({
			...prev,
			[category]: prev[category].filter((v) => v !== value),
		}));
	};

	const handleClearAllFilters = () => {
		setFilters({
			timePeriods: [],
			sourceTypes: [],
			categories: [],
			authorEras: [],
			special: [],
		});
	};

	const hasActiveFilters = checkHasActiveFilters(filters);

	// Use filtered quotes when searching, when favorites filter is active, or when filters are applied
	const quotesToShow =
		(searchQuery && searchQuery.trim()) || activeFilter === 'favorites' || hasActiveFilters
			? filteredQuotes
			: displayedQuotes;
	const allQuotes = quotesToShow;

	// Optimierung für FlatList mit getItemLayout
	const getItemLayout = useCallback(
		(data: any, index: number) => {
			return {
				length: CARD_HEIGHT,
				offset: CARD_HEIGHT * index,
				index,
			};
		},
		[CARD_HEIGHT]
	);

	const renderQuote = ({ item, index }: { item: EnhancedQuote; index: number }) => {
		// Use list view if viewMode is 'list'
		if (viewMode === 'list') {
			return (
				<View className="mb-5">
					<QuoteCard
						quote={item}
						onToggleFavorite={toggleFavorite}
						onAuthorPress={() => handleAuthorPress(item)}
					/>
				</View>
			);
		}

		// Otherwise use vertical card view
		return (
			<View style={{ position: 'relative', width: '100%' }}>
				<QuoteCard
					quote={item}
					variant="vertical"
					index={index}
					scrollY={scrollY}
					cardHeight={CARD_HEIGHT}
					onToggleFavorite={toggleFavorite}
					onAuthorPress={() => handleAuthorPress(item)}
				/>
			</View>
		);
	};

	// Show loading state while store is initializing
	if (!isInitialized || isLoading) {
		return (
			<View
				style={{
					flex: 1,
					backgroundColor: colors.background,
					justifyContent: 'center',
					alignItems: 'center',
				}}
			>
				<ActivityIndicator size="large" color={colors.primary} />
				<Text className={`${isDarkMode ? 'text-white' : 'text-black'} mt-4`}>
					{t('quotes.loadingQuotes')}
				</Text>
			</View>
		);
	}

	// Show loading state while store is initializing
	if (!isInitialized || isLoading) {
		return (
			<View
				style={{
					flex: 1,
					backgroundColor: colors.background,
					justifyContent: 'center',
					alignItems: 'center',
				}}
			>
				<ActivityIndicator size="large" color={isDarkMode ? '#ffffff' : '#000000'} />
				<Text className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'} mt-4`}>
					{t('common.loading')}
				</Text>
			</View>
		);
	}

	// Check if quotes are loaded after initialization
	if (!quotes || !Array.isArray(quotes) || quotes.length === 0) {
		return (
			<View
				style={{
					flex: 1,
					backgroundColor: colors.background,
					justifyContent: 'center',
					alignItems: 'center',
				}}
			>
				<Text className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>
					{t('quotes.noQuotes')}
				</Text>
			</View>
		);
	}

	return (
		<>
			<Stack.Screen
				options={{
					title: activeFilter === 'favorites' ? t('navigation.favorites') : t('navigation.quotes'),
					headerShown: true,
					headerTransparent: true,
					headerBlurEffect: isDarkMode ? 'dark' : 'light',
					headerStyle: {
						backgroundColor: 'transparent',
					},
					headerTintColor: isDarkMode ? '#ffffff' : '#000000',
					headerShadowVisible: false,
					headerTitleAlign: 'center',
					headerRight: () => (
						<View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
							<TouchableOpacity
								onPress={() => {
									Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
									bottomSheetRef.current?.snapToIndex(0);
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
									name="filter-outline"
									size={24}
									color={hasActiveFilters ? '#7c3aed' : isDarkMode ? '#ffffff' : '#000000'}
								/>
								{hasActiveFilters && (
									<View
										style={{
											position: 'absolute',
											top: 8,
											right: 8,
											width: 8,
											height: 8,
											borderRadius: 4,
											backgroundColor: '#7c3aed',
										}}
									/>
								)}
							</TouchableOpacity>
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
									name={viewMode === 'card' ? 'list-outline' : 'grid-outline'}
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
				{/* Active Filter Chips */}
				{hasActiveFilters && (
					<ActiveQuoteFilterChips
						filters={filters}
						onRemoveFilter={handleRemoveFilter}
						onClearAll={handleClearAllFilters}
					/>
				)}

				{/* Main Content */}
				<AnimatedFlatList
					ref={flatListRef}
					data={allQuotes}
					renderItem={renderQuote}
					keyExtractor={(item, index) => `${item.id}-${index}`}
					horizontal={false}
					pagingEnabled={false}
					showsHorizontalScrollIndicator={false}
					showsVerticalScrollIndicator={false}
					onEndReached={handleEndReached}
					onEndReachedThreshold={0.5}
					onScroll={scrollHandler}
					scrollEventThrottle={16}
					contentContainerStyle={{
						paddingTop: hasActiveFilters ? 24 : LIST_CONTAINER_PADDING.top,
						paddingBottom:
							viewMode === 'list'
								? LIST_CONTAINER_PADDING.bottom + 80
								: AVAILABLE_HEIGHT - VERTICAL_PADDING,
					}}
					snapToInterval={viewMode === 'list' ? undefined : CARD_HEIGHT}
					snapToAlignment={viewMode === 'list' ? undefined : 'start'}
					decelerationRate={viewMode === 'list' ? 'normal' : 'fast'}
					getItemLayout={viewMode === 'list' ? undefined : getItemLayout}
					removeClippedSubviews={true}
					initialNumToRender={3}
					maxToRenderPerBatch={5}
					windowSize={10}
					ListFooterComponent={
						allQuotes.length > 0 && activeFilter === 'recommended' ? (
							<View className="py-8">
								<ActivityIndicator size="small" color={isDarkMode ? '#ffffff' : '#000000'} />
								<Text className={`${isDarkMode ? 'text-white/30' : 'text-black/30'} text-xs mt-2`}>
									{t('quotes.loadMore')}
								</Text>
							</View>
						) : null
					}
				/>

				{/* Glass Tab Selector at bottom - positioned above tab bar */}
				<View className="absolute bottom-24 left-0 right-0 z-10">
					<GlassTabSelector tabs={tabs} activeTab={activeFilter} onTabChange={handleTabChange} />
				</View>
			</View>

			{/* Filter Sheet */}
			<QuoteFilterSheet
				bottomSheetRef={bottomSheetRef}
				filters={filters}
				onFiltersChange={setFilters}
				onClearAll={handleClearAllFilters}
			/>
		</>
	);
}
