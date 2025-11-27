import { useState, useMemo, useRef, useCallback, useEffect } from 'react';
import {
	FlatList,
	RefreshControl,
	View,
	ScrollView,
	ActivityIndicator,
	NativeScrollEvent,
	NativeSyntheticEvent,
	Pressable,
	TextInput,
	PlatformColor,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { GestureDetector } from 'react-native-gesture-handler';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '~/contexts/AuthContext';
import { useTheme } from '~/contexts/ThemeContext';
import { useTagStore } from '~/store/tagStore';
import { useGeneratingImagesStore } from '~/store/generatingImagesStore';
import { GenerationToast } from '~/components/GenerationToast';
import { QuickGenerateBar } from '~/components/QuickGenerateBar';
import { ImageSkeletonGrid } from '~/components/ImageSkeleton';
import { FilterBar } from '~/components/FilterBar';
import { PageHeader } from '~/components/PageHeader';
import { useViewStore } from '~/store/viewStore';
import { PAGINATION } from '~/constants';
import { Text } from '~/components/Text';
import { ImageCard } from '~/components/ImageCard';
import { EmptyState } from '~/components/EmptyState';
import { ErrorBanner } from '~/components/ErrorBanner';
import { ImageItem, FilterMode } from '~/types/gallery';
import { useImageFetching } from '~/hooks/useImageFetching';
import { useGalleryGestures } from '~/hooks/useGalleryGestures';
import { useScrollRestoration } from '~/hooks/useScrollRestoration';
import { useImagePrefetch } from '~/hooks/useImagePrefetch';
import { useImageSearch } from '~/hooks/useImageSearch';
import { FLATLIST_PERFORMANCE_PROPS, SCROLL_THRESHOLD } from '~/constants/gallery';

export default function GalleryScreen() {
	const { user, loading: authLoading } = useAuth();
	const { theme } = useTheme();
	const insets = useSafeAreaInsets();
	const flatListRef = useRef<FlatList>(null);

	// Local state
	const [filterMode, setFilterMode] = useState<FilterMode>('all');
	const [scrollY, setScrollY] = useState(0);
	const [generateBarExpanded, setGenerateBarExpanded] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [showSearch, setShowSearch] = useState(false);
	const [searchQuery, setSearchQuery] = useState('');
	const [showToast, setShowToast] = useState(false);
	const [toastMessage, setToastMessage] = useState('');

	// Store hooks
	const { galleryViewMode, setGalleryViewMode, lastViewedImageId, setLastViewedImageId } =
		useViewStore();
	const { tags, selectedTags, toggleTagFilter, clearTagFilters } = useTagStore();
	const { getAllGeneratingImages } = useGeneratingImagesStore();

	// Custom hooks
	const { pagination, fetchImages, loadMore, onRefresh, toggleFavorite } = useImageFetching({
		userId: user?.id,
		filterMode,
		onError: (err) => setError('Fehler beim Laden der Bilder'),
	});

	const { pinchGesture } = useGalleryGestures({
		viewMode: galleryViewMode,
		onViewModeChange: setGalleryViewMode,
	});

	useScrollRestoration({
		flatListRef,
		lastViewedImageId,
		filteredImages: pagination.items,
		onClearLastViewed: () => setLastViewedImageId(null),
	});

	useImagePrefetch({
		hasMore: pagination.hasMore,
		loading: pagination.loading,
		loadingMore: pagination.loadingMore,
		itemsLength: pagination.items.length,
		currentPage: pagination.page,
		viewMode: galleryViewMode,
		userId: user?.id,
		filterMode,
	});

	// Get generating images and merge with real images
	const generatingImages = getAllGeneratingImages();

	// Convert generating images to ImageItem format for display
	const generatingImageItems: ImageItem[] = generatingImages
		.filter((img) => img.status === 'generating' || img.status === 'completed')
		.map(
			(img) =>
				({
					id: img.status === 'completed' && img.realImageId ? img.realImageId : img.tempId,
					prompt: img.prompt,
					publicUrl: img.status === 'completed' && img.imageUrl ? img.imageUrl : null,
					createdAt: new Date(img.startTime).toISOString(),
					isFavorite: false,
					model: img.model,
					tags: [],
					blurhash: null,
					// Mark as generating for special rendering (only while generating)
					_isGenerating: img.status === 'generating',
				}) as any
		);

	// Merge generating images at the START of the list
	// Filter out real images that match completed generating images (avoid duplicates)
	const completedImageIds = new Set(
		generatingImages
			.filter((img) => img.status === 'completed' && img.realImageId)
			.map((img) => img.realImageId)
	);
	const realImages = pagination.items.filter((img) => !completedImageIds.has(img.id));
	const allImages = [...generatingImageItems, ...realImages];

	// Filter images by search and tags
	const { filteredImages } = useImageSearch({
		items: allImages,
		searchQuery,
		selectedTags,
	});

	// Listen for completed generations and show toast
	useEffect(() => {
		const checkForCompletions = () => {
			const allGenerating = getAllGeneratingImages();
			const completed = allGenerating.find(
				(img) => img.status === 'completed' && img.generationTime
			);

			if (completed && completed.generationTime) {
				const timeInSeconds = completed.generationTime.toFixed(1);
				setToastMessage(`Bild in ${timeInSeconds}s generiert`);
				setShowToast(true);

				// Hide toast after showing
				setTimeout(() => setShowToast(false), 3000);
			}
		};

		// Check every 500ms for completed images
		const interval = setInterval(checkForCompletions, 500);
		return () => clearInterval(interval);
	}, []);

	// Handlers
	const renderImage = useCallback(
		({ item }: { item: ImageItem }) => (
			<ImageCard
				id={item.id}
				publicUrl={item.publicUrl}
				prompt={item.prompt}
				createdAt={item.createdAt}
				isFavorite={item.isFavorite}
				model={item.model}
				tags={item.tags}
				viewMode={galleryViewMode}
				blurhash={item.blurhash}
				isGenerating={(item as any)._isGenerating}
				onToggleFavorite={() => toggleFavorite(item.id, item.isFavorite)}
			/>
		),
		[galleryViewMode, toggleFavorite]
	);

	const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
		const currentScrollY = event.nativeEvent.contentOffset.y;
		setScrollY(currentScrollY);
	};

	const handleScrollToIndexFailed = (info: { index: number }) => {
		// Fallback: scroll to offset instead
		const wait = new Promise((resolve) => setTimeout(resolve, 500));
		wait.then(() => {
			flatListRef.current?.scrollToIndex({ index: info.index, animated: false });
		});
	};

	// Render states
	if (authLoading || pagination.loading) {
		return (
			<ScrollView
				style={{ flex: 1, backgroundColor: theme.colors.background }}
				contentInsetAdjustmentBehavior="automatic"
			>
				<PageHeader title="Galerie" />
				<ImageSkeletonGrid count={6} viewMode={galleryViewMode} />
			</ScrollView>
		);
	}

	// Not logged in
	if (!user) {
		return (
			<ScrollView
				style={{ flex: 1, backgroundColor: theme.colors.background }}
				contentInsetAdjustmentBehavior="automatic"
			>
				<PageHeader title="Galerie" />
				<EmptyState
					icon="🔐"
					title="Nicht angemeldet"
					description="Bitte melde dich an, um deine Bilder zu sehen."
				/>
			</ScrollView>
		);
	}

	if (filteredImages.length === 0) {
		return (
			<ScrollView
				style={{ flex: 1, backgroundColor: theme.colors.background }}
				contentInsetAdjustmentBehavior="automatic"
			>
				<PageHeader title="Galerie" />
				<EmptyState
					icon="🔍"
					title="Keine Bilder gefunden"
					description={
						searchQuery.trim()
							? 'Keine Bilder mit dieser Suche gefunden.'
							: selectedTags.length > 0
								? 'Keine Bilder mit den ausgewählten Tags.'
								: filterMode === 'favorites'
									? 'Du hast noch keine Favoriten.'
									: 'Beginne mit der Generierung deines ersten Bildes!'
					}
				/>
			</ScrollView>
		);
	}

	return (
		<>
			{/* Error Banner */}
			{error && <ErrorBanner message={error} onDismiss={() => setError(null)} />}

			{/* Gallery Grid */}
			<GestureDetector gesture={pinchGesture}>
				<FlatList
					ref={flatListRef}
					data={filteredImages}
					renderItem={renderImage}
					keyExtractor={(item) => item.id}
					key={galleryViewMode} // Force re-render when view mode changes
					numColumns={galleryViewMode === 'single' ? 1 : galleryViewMode === 'grid3' ? 3 : 5}
					onScrollToIndexFailed={handleScrollToIndexFailed}
					style={{ flex: 1, backgroundColor: theme.colors.background }}
					contentInsetAdjustmentBehavior="automatic"
					contentContainerStyle={{
						paddingTop: insets.top,
						paddingBottom: insets.bottom + 250, // Extra padding for native tab bar, filter bar and toggle button
					}}
					ListHeaderComponent={
						<>
							<View
								style={{
									paddingHorizontal: 12,
									paddingBottom: 28,
									flexDirection: 'row',
									alignItems: 'center',
									justifyContent: 'space-between',
								}}
							>
								<Text variant="title" weight="bold">
									Galerie
								</Text>
								<Pressable onPress={() => setShowSearch(!showSearch)} style={{ padding: 8 }}>
									<Ionicons
										name={showSearch ? 'close' : 'search'}
										size={24}
										color={theme.colors.text.primary}
									/>
								</Pressable>
							</View>

							{/* Search Bar - shown when toggled */}
							{showSearch && (
								<View style={{ paddingHorizontal: 12, paddingBottom: 16 }}>
									<View
										style={{
											backgroundColor: theme.colors.input,
											borderRadius: 12,
											paddingHorizontal: 12,
											paddingVertical: 10,
											flexDirection: 'row',
											alignItems: 'center',
										}}
									>
										<Ionicons name="search" size={20} color={theme.colors.text.secondary} />
										<TextInput
											value={searchQuery}
											onChangeText={setSearchQuery}
											placeholder="Suche nach Prompts, Tags oder Modellen..."
											placeholderTextColor={theme.colors.text.tertiary}
											style={{
												flex: 1,
												marginLeft: 8,
												color: theme.colors.text.primary,
												fontSize: 16,
											}}
										/>
										{searchQuery.length > 0 && (
											<Pressable onPress={() => setSearchQuery('')} style={{ padding: 4 }}>
												<Ionicons
													name="close-circle"
													size={20}
													color={theme.colors.text.secondary}
												/>
											</Pressable>
										)}
									</View>
								</View>
							)}
						</>
					}
					refreshControl={
						<RefreshControl refreshing={pagination.refreshing} onRefresh={onRefresh} />
					}
					onScroll={handleScroll}
					scrollEventThrottle={16}
					onEndReached={loadMore}
					onEndReachedThreshold={PAGINATION.LOAD_MORE_THRESHOLD}
					ListFooterComponent={
						pagination.loadingMore ? (
							<View className="py-4">
								<ActivityIndicator size="small" color={theme.colors.primary.default} />
							</View>
						) : null
					}
					{...FLATLIST_PERFORMANCE_PROPS}
				/>
			</GestureDetector>

			{/* Filter Bar - floating above generate bar */}
			{!pagination.loading && (
				<FilterBar
					isMinimized={scrollY > SCROLL_THRESHOLD}
					scrollY={scrollY}
					filterMode={filterMode}
					onFilterModeChange={setFilterMode}
					tags={tags}
					selectedTags={selectedTags}
					onToggleTag={toggleTagFilter}
					onClearFilters={() => {
						clearTagFilters();
						setFilterMode('all');
					}}
					generateBarExpanded={generateBarExpanded}
				/>
			)}

			{/* Quick Generate Bottom Bar */}
			<QuickGenerateBar
				isMinimized={scrollY > SCROLL_THRESHOLD}
				scrollY={scrollY}
				onGenerated={() => {
					// Fetch new images without showing full loading
					fetchImages(0, false);
				}}
				onExpandedChange={setGenerateBarExpanded}
			/>

			{/* Generation Toast */}
			{showToast && (
				<GenerationToast message={toastMessage} onDismiss={() => setShowToast(false)} />
			)}
		</>
	);
}
