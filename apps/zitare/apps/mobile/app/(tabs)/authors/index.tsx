import React, { useEffect, useState, useMemo, useRef } from 'react';
import {
	View,
	Text,
	FlatList,
	Pressable,
	TouchableOpacity,
	Dimensions,
	ActivityIndicator,
} from 'react-native';
import BottomSheet from '@gorhom/bottom-sheet';
import { LinearGradient } from 'expo-linear-gradient';
import { Icon } from '~/components/Icon';
import { useQuotesStore } from '~/store/quotesStore';
import { useRouter, useLocalSearchParams, Stack } from 'expo-router';
import { LoadingScreen } from '~/components/common/LoadingScreen';
import { useIsDarkMode } from '~/store/settingsStore';
import * as Haptics from 'expo-haptics';
import { GlassTabSelector } from '~/components/common/GlassTabSelector';
import Animated, {
	FadeInDown,
	useSharedValue,
	useAnimatedScrollHandler,
	useAnimatedStyle,
	withSpring,
} from 'react-native-reanimated';
import { useTranslation } from 'react-i18next';
import type { Author } from '@zitare/shared';
import { LIST_ITEM_CLASSES, LIST_CONTAINER_PADDING } from '~/constants/layout';
import AuthorCard from '~/components/AuthorCard';
import { useTheme } from '~/hooks/useTheme';
import { useShare } from '~/hooks/useShare';
import {
	AuthorFilterBottomSheet,
	AuthorFilters,
} from '~/components/authors/AuthorFilterBottomSheet';
import { ActiveFilterChips } from '~/components/authors/ActiveFilterChips';
import { filterAuthors } from '~/utils/authorFilters';

const AnimatedFlatList = Animated.createAnimatedComponent(FlatList);
const { height: screenHeight } = Dimensions.get('window');

// Reimplement AuthorCardItem to use new AuthorCard component
function AuthorCardItem({
	item,
	index,
	isDarkMode,
	isAuthorFavorite,
	toggleAuthorFavorite,
	router,
	getAuthorGradient,
	t,
}: {
	item: Author;
	index: number;
	isDarkMode: boolean;
	isAuthorFavorite: (id: string) => boolean;
	toggleAuthorFavorite: (author: Author) => void;
	router: any;
	getAuthorGradient: (index: number) => string[];
	t: any;
}) {
	const { shareAuthor, copyAuthorToClipboard } = useShare();
	const quoteCount = item.quoteIds?.length || 0;
	const isFavorite = isAuthorFavorite(item.id);
	const likeScale = useSharedValue(1);

	const handleFavorite = (e: any) => {
		e.stopPropagation();
		Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
		likeScale.value = withSpring(1.3, {}, () => {
			likeScale.value = withSpring(1);
		});
		toggleAuthorFavorite(item);
	};

	const handleShare = (e: any) => {
		e.stopPropagation();
		shareAuthor(item);
	};

	const handleCopyToClipboard = (e: any) => {
		e.stopPropagation();
		copyAuthorToClipboard(item);
	};

	const likeAnimatedStyle = useAnimatedStyle(() => ({
		transform: [{ scale: likeScale.value }],
	}));

	return (
		<Animated.View
			entering={FadeInDown.delay(index * 50).duration(400)}
			className={LIST_ITEM_CLASSES.wrapper}
		>
			<Pressable
				onPress={() => {
					Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
					router.push(`/author/${item.id}`);
				}}
			>
				{/* Gradient border like QuoteCard */}
				<LinearGradient
					colors={getAuthorGradient(index)}
					start={{ x: 0, y: 0 }}
					end={{ x: 1, y: 1 }}
					style={{
						borderRadius: 24,
						padding: 1,
					}}
				>
					<View className="bg-black/40 rounded-3xl backdrop-blur-xl">
						<View className="p-5">
							{/* Name and Profession */}
							<View className="mb-3">
								<Text
									style={{
										fontFamily: 'Georgia',
										fontSize: 22,
										lineHeight: 28,
										color: 'white',
										fontWeight: '400',
									}}
								>
									{item.name}
								</Text>
								{item.profession && item.profession.length > 0 && (
									<Text className="text-white/60 text-sm mt-1">{item.profession.join(' · ')}</Text>
								)}
							</View>

							{/* Biography - larger and more prominent */}
							{(item.biography?.short || item.biography?.long) && (
								<Text
									style={{
										fontSize: 15,
										lineHeight: 22,
										color: 'rgba(255,255,255,0.7)',
										marginBottom: 12,
									}}
									numberOfLines={3}
								>
									{item.biography.short || item.biography.long}
								</Text>
							)}

							{/* Bottom section with quote count and favorite button */}
							<View className="flex-row items-center justify-between">
								<View className="flex-row items-center">
									<Icon name="document-text-outline" size={20} color="rgba(255,255,255,0.4)" />
									<Text className="text-white/40 text-sm ml-1">
										{t('common.quotes_count', { count: quoteCount })}
									</Text>
									{item.era && (
										<>
											<Text className="text-white/20 text-sm mx-2">·</Text>
											<Text className="text-white/40 text-sm">{item.era}</Text>
										</>
									)}
								</View>

								{/* Action Buttons */}
								<View className="flex-row items-center gap-3">
									{/* Copy Button */}
									<Pressable
										onPress={handleCopyToClipboard}
										hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
									>
										<Icon name="copy-outline" size={22} color="rgba(255,255,255,0.7)" />
									</Pressable>

									{/* Share Button */}
									<Pressable
										onPress={handleShare}
										hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
									>
										<Icon name="share-outline" size={22} color="rgba(255,255,255,0.7)" />
									</Pressable>

									{/* Favorite Button */}
									<Pressable
										onPress={handleFavorite}
										hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
									>
										<Animated.View style={likeAnimatedStyle}>
											<Icon
												name={isFavorite ? 'heart' : 'heart-outline'}
												size={24}
												color={isFavorite ? '#ff6b6b' : 'rgba(255,255,255,0.8)'}
											/>
										</Animated.View>
									</Pressable>
								</View>
							</View>
						</View>
					</View>
				</LinearGradient>
			</Pressable>
		</Animated.View>
	);
}

export default function AuthorsScreen() {
	const router = useRouter();
	const params = useLocalSearchParams();
	const { q: searchQuery } = params;
	const { t } = useTranslation();
	const {
		authors,
		initializeStore,
		isLoading,
		isInitialized,
		toggleAuthorFavorite,
		isAuthorFavorite,
		getFavoriteAuthors,
	} = useQuotesStore();
	const isDarkMode = useIsDarkMode();
	const { colors } = useTheme();
	const [sortBy, setSortBy] = useState<'name' | 'quotes'>('name');
	const [activeFilter, setActiveFilter] = useState<'all' | 'favorites'>('all');
	const [viewMode, setViewMode] = useState<'card' | 'list'>('list');
	const [filters, setFilters] = useState<AuthorFilters>({
		epochs: [],
		professions: [],
		nationalities: [],
		quoteCount: [],
		special: [],
	});
	const scrollY = useSharedValue(0);
	const bottomSheetRef = useRef<BottomSheet>(null);

	// useShare hook must be called at component level, not in render functions
	const { shareAuthor, copyAuthorToClipboard } = useShare();

	useEffect(() => {
		initializeStore();
	}, [initializeStore]);

	// Filter authors based on search query, active filter, and advanced filters, then sort
	const filteredAndSortedAuthors = useMemo(() => {
		if (!authors) return [];

		let filtered = authors;

		// Apply active filter first (all vs favorites)
		if (activeFilter === 'favorites') {
			const favoriteAuthors = getFavoriteAuthors();
			filtered = favoriteAuthors;
		}

		// Apply search filter if active
		if (searchQuery && searchQuery.trim()) {
			const query = searchQuery.toLowerCase();
			filtered = filtered.filter(
				(author) =>
					author.name.toLowerCase().includes(query) ||
					(author.profession && author.profession.some((p) => p.toLowerCase().includes(query))) ||
					(author.biography?.short && author.biography.short.toLowerCase().includes(query)) ||
					(author.biography?.long && author.biography.long.toLowerCase().includes(query))
			);
		}

		// Apply advanced filters
		filtered = filterAuthors(filtered, filters);

		// Sort filtered results
		const sorted = [...filtered];
		sorted.sort((a, b) => {
			if (sortBy === 'name') {
				return a.name.localeCompare(b.name);
			} else {
				const aCount = a.quoteIds?.length || 0;
				const bCount = b.quoteIds?.length || 0;
				return bCount - aCount; // Absteigend nach Anzahl
			}
		});

		return sorted;
	}, [authors, sortBy, searchQuery, filters, activeFilter, getFavoriteAuthors]);

	const handleRemoveFilter = (category: keyof AuthorFilters, value: string) => {
		setFilters((prev) => ({
			...prev,
			[category]: prev[category].filter((v) => v !== value),
		}));
	};

	const handleClearAllFilters = () => {
		setFilters({
			epochs: [],
			professions: [],
			nationalities: [],
			quoteCount: [],
			special: [],
		});
	};

	const hasActiveFilters = Object.values(filters).some((arr) => arr.length > 0);

	// Get favorite authors count
	const favoriteAuthors = getFavoriteAuthors();

	// Tab handling for segmented control
	const tabs = [
		{ key: 'all', label: t('common.all'), count: authors?.length || 0 },
		{ key: 'favorites', label: t('navigation.favorites'), count: favoriteAuthors?.length || 0 },
	];

	const handleTabChange = (tabKey: string) => {
		setActiveFilter(tabKey as 'all' | 'favorites');
	};

	const scrollHandler = useAnimatedScrollHandler({
		onScroll: (event) => {
			scrollY.value = event.contentOffset.y;
		},
	});

	// Get gradient colors based on author index or name
	const getAuthorGradient = (index: number) => {
		const gradients = isDarkMode
			? [
					['#9333EA', '#7C3AED'], // Purple
					['#EC4899', '#F472B6'], // Pink
					['#3B82F6', '#0EA5E9'], // Blue
					['#10B981', '#34D399'], // Green
					['#F59E0B', '#F97316'], // Amber
					['#06B6D4', '#14B8A6'], // Cyan
				]
			: [
					['#7C3AED', '#6D28D9'], // Purple (darker for light mode)
					['#DB2777', '#BE185D'], // Pink (darker for light mode)
					['#2563EB', '#1D4ED8'], // Blue (darker for light mode)
					['#059669', '#047857'], // Green (darker for light mode)
					['#D97706', '#B45309'], // Amber (darker for light mode)
					['#0891B2', '#0E7490'], // Cyan (darker for light mode)
				];
		return gradients[index % gradients.length];
	};

	// Calculate card height for vertical mode
	const TAB_BAR_HEIGHT = 80;
	const STATUS_BAR_HEIGHT = 44;
	const CARD_HEIGHT = screenHeight - STATUS_BAR_HEIGHT - TAB_BAR_HEIGHT - 100;

	// Render einzelner Autor als Card
	const renderAuthorItem = ({ item, index }: { item: Author; index: number }) => {
		// Handle actions
		const handleShare = (e?: any) => {
			if (e) e.stopPropagation();
			shareAuthor(item);
		};

		const handleCopy = (e?: any) => {
			if (e) e.stopPropagation();
			copyAuthorToClipboard(item);
		};

		if (viewMode === 'card') {
			return (
				<AuthorCard
					author={item}
					index={index}
					variant="vertical"
					isFavorite={isAuthorFavorite(item.id)}
					onToggleFavorite={() => toggleAuthorFavorite(item)}
					onPress={() => {
						Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
						router.push(`/author/${item.id}`);
					}}
					scrollY={scrollY}
					cardHeight={CARD_HEIGHT}
				/>
			);
		}

		// List view - use the original AuthorCardItem
		return (
			<AuthorCardItem
				item={item}
				index={index}
				isDarkMode={isDarkMode}
				isAuthorFavorite={isAuthorFavorite}
				toggleAuthorFavorite={toggleAuthorFavorite}
				router={router}
				getAuthorGradient={getAuthorGradient}
				t={t}
			/>
		);
	};

	if (isLoading) {
		return <LoadingScreen message={t('authors.loadingAuthors')} />;
	}

	return (
		<>
			<Stack.Screen
				options={{
					title: t('navigation.authors'),
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
						</View>
					),
					headerRightContainerStyle: {
						paddingRight: 16,
					},
				}}
			/>
			<View style={{ flex: 1, backgroundColor: colors.background }}>
				{/* Loading State */}
				{!isInitialized || isLoading ? (
					<View className="flex-1 justify-center items-center">
						<ActivityIndicator size="large" color={isDarkMode ? '#ffffff' : '#000000'} />
						<Text className={`${isDarkMode ? 'text-white/60' : 'text-black/60'} mt-4`}>
							{t('common.loading')}
						</Text>
					</View>
				) : (
					<>
						{/* Active Filter Chips */}
						<ActiveFilterChips
							filters={filters}
							onRemoveFilter={handleRemoveFilter}
							onClearAll={handleClearAllFilters}
						/>

						{/* Authors List */}
						{filteredAndSortedAuthors.length === 0 ? (
							<View className="flex-1 justify-center items-center px-6" style={{ paddingTop: 100 }}>
								<Icon
									name="people-outline"
									size={64}
									color={isDarkMode ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)'}
								/>
								<Text
									className={`${isDarkMode ? 'text-white/60' : 'text-black/60'} text-lg mt-4 text-center font-semibold`}
								>
									{searchQuery && searchQuery.trim()
										? t('authors.noSearchResults')
										: t('authors.noAuthors')}
								</Text>
								{searchQuery && searchQuery.trim() && (
									<Text
										className={`${isDarkMode ? 'text-white/40' : 'text-black/40'} text-sm mt-2 text-center`}
									>
										No authors found for &quot;{searchQuery}&quot;
									</Text>
								)}
							</View>
						) : (
							<AnimatedFlatList
								data={filteredAndSortedAuthors}
								renderItem={renderAuthorItem}
								keyExtractor={(item) => item.id}
								showsVerticalScrollIndicator={false}
								contentContainerStyle={{
									paddingTop: LIST_CONTAINER_PADDING.top,
									paddingBottom:
										viewMode === 'list' ? LIST_CONTAINER_PADDING.bottom + 80 : CARD_HEIGHT * 0.1,
								}}
								onScroll={scrollHandler}
								scrollEventThrottle={16}
								pagingEnabled={viewMode === 'card'}
								snapToInterval={viewMode === 'card' ? CARD_HEIGHT : undefined}
								snapToAlignment={viewMode === 'card' ? 'start' : undefined}
								decelerationRate={viewMode === 'card' ? 'fast' : 'normal'}
								getItemLayout={
									viewMode === 'card'
										? (data, index) => ({
												length: CARD_HEIGHT,
												offset: CARD_HEIGHT * index,
												index,
											})
										: undefined
								}
							/>
						)}

						{/* Glass Tab Selector at bottom - positioned above tab bar */}
						<View className="absolute bottom-24 left-0 right-0 z-10">
							<GlassTabSelector
								tabs={tabs}
								activeTab={activeFilter}
								onTabChange={handleTabChange}
							/>
						</View>
					</>
				)}
			</View>

			{/* Filter Bottom Sheet */}
			<AuthorFilterBottomSheet
				bottomSheetRef={bottomSheetRef}
				filters={filters}
				onFiltersChange={setFilters}
				onClearAll={handleClearAllFilters}
			/>
		</>
	);
}
