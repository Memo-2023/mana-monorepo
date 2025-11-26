import { useState, useCallback } from 'react';
import {
  FlatList,
  RefreshControl,
  Pressable,
  View,
  ScrollView,
  ActivityIndicator,
  TextInput,
  Platform,
  NativeScrollEvent,
  NativeSyntheticEvent,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { GestureDetector } from 'react-native-gesture-handler';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '~/contexts/AuthContext';
import { useTheme } from '~/contexts/ThemeContext';
import { useTagStore } from '~/store/tagStore';
import { ImageSkeletonGrid } from '~/components/ImageSkeleton';
import { useViewStore } from '~/store/viewStore';
import { PAGINATION } from '~/constants';
import { Text } from '~/components/Text';
import { ImageCard } from '~/components/ImageCard';
import { ExploreSortBar } from '~/components/ExploreSortBar';
import { QuickGenerateBar } from '~/components/QuickGenerateBar';
import { EmptyState } from '~/components/EmptyState';
import { PageHeader } from '~/components/PageHeader';
import { ErrorBanner } from '~/components/ErrorBanner';
import { ExploreImageItem, SortMode } from '~/types/explore';
import { useExploreFetching } from '~/hooks/useExploreFetching';
import { useImageLikes } from '~/hooks/useImageLikes';
import { useExploreSearch } from '~/hooks/useExploreSearch';
import { useExplorePrefetch } from '~/hooks/useExplorePrefetch';
import { useGalleryGestures } from '~/hooks/useGalleryGestures';
import { FLATLIST_PERFORMANCE_PROPS, SCROLL_THRESHOLD } from '~/constants/gallery';

export default function ExploreScreen() {
  const { user } = useAuth();
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();

  // Local state
  const [sortMode, setSortMode] = useState<SortMode>('recent');
  const [searchQuery, setSearchQuery] = useState('');
  const [scrollY, setScrollY] = useState(0);
  const [generateBarExpanded, setGenerateBarExpanded] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Store hooks
  const { exploreViewMode, setExploreViewMode } = useViewStore();
  const { tags, selectedTags, toggleTagFilter, clearTagFilters } = useTagStore();

  // Custom hooks
  const { pagination, loadMore, onRefresh } = useExploreFetching({
    userId: user?.id,
    sortMode,
    onError: (err) => setError('Fehler beim Laden der Bilder'),
  });

  const { toggleLike } = useImageLikes({
    userId: user?.id,
    items: pagination.items,
    setItems: pagination.setItems,
    onError: (err) => setError('Fehler beim Liken'),
  });

  const { filteredImages } = useExploreSearch({
    items: pagination.items,
    searchQuery,
    selectedTags,
  });

  useExplorePrefetch({
    hasMore: pagination.hasMore,
    loading: pagination.loading,
    loadingMore: pagination.loadingMore,
    itemsLength: pagination.items.length,
    currentPage: pagination.page,
    viewMode: exploreViewMode,
    sortMode,
  });

  const { pinchGesture } = useGalleryGestures({
    viewMode: exploreViewMode,
    onViewModeChange: setExploreViewMode,
  });

  // Handlers
  const renderImage = useCallback(({ item }: { item: ExploreImageItem }) => (
    <ImageCard
      id={item.id}
      publicUrl={item.public_url}
      prompt={item.prompt}
      createdAt={item.created_at}
      model={item.model}
      tags={item.tags}
      viewMode={exploreViewMode}
      blurhash={item.blurhash}
      creatorUsername={item.creator?.username || undefined}
      likesCount={item.likes_count}
      userHasLiked={item.user_has_liked}
      onToggleLike={() => toggleLike(item.id, item.user_has_liked || false)}
    />
  ), [exploreViewMode, toggleLike]);

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const currentScrollY = event.nativeEvent.contentOffset.y;
    setScrollY(currentScrollY);
  };

  // Render states
  if (pagination.loading) {
    return (
      <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
        <ScrollView
          className="flex-1"
          contentInsetAdjustmentBehavior="automatic"
        >
          <PageHeader title="Entdecken" />
          <ImageSkeletonGrid count={6} viewMode={exploreViewMode} />
        </ScrollView>
      </View>
    );
  }

  if (filteredImages.length === 0) {
    return (
      <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
        <ScrollView
          className="flex-1"
          contentInsetAdjustmentBehavior="automatic"
        >
          <PageHeader title="Entdecken" />
          <EmptyState
            icon="🌍"
            title="Noch keine öffentlichen Bilder"
            description="Sei der Erste, der seine Kreationen mit der Community teilt!"
            padding={32}
          />
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      {/* Error Banner */}
      {error && <ErrorBanner message={error} onDismiss={() => setError(null)} />}

      <View style={{ flex: 1 }}>
        {/* Gallery Grid with Pinch Gesture */}
        <GestureDetector gesture={pinchGesture}>
          <FlatList
            data={filteredImages}
            renderItem={renderImage}
            keyExtractor={(item) => item.id}
            key={exploreViewMode} // Force re-render when view mode changes
            numColumns={exploreViewMode === 'single' ? 1 : exploreViewMode === 'grid3' ? 3 : 5}
            contentInsetAdjustmentBehavior="automatic"
            contentContainerStyle={{
              paddingTop: insets.top,
              paddingBottom: insets.bottom + 250
            }}
            ListHeaderComponent={
            <>
              <View style={{
                paddingHorizontal: 12,
                paddingBottom: 28,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}>
                <Text variant="title" weight="bold">Entdecken</Text>
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
                  <View style={{
                    backgroundColor: theme.colors.input,
                    borderRadius: 12,
                    paddingHorizontal: 12,
                    paddingVertical: 10,
                    flexDirection: 'row',
                    alignItems: 'center'
                  }}>
                    <Ionicons name="search" size={20} color={theme.colors.text.secondary} />
                    <TextInput
                      value={searchQuery}
                      onChangeText={setSearchQuery}
                      placeholder="Suche nach Prompts, Tags oder Creators..."
                      placeholderTextColor={theme.colors.text.tertiary}
                      style={{
                        flex: 1,
                        marginLeft: 8,
                        color: theme.colors.text.primary,
                        fontSize: 16
                      }}
                    />
                    {searchQuery.length > 0 && (
                      <Pressable onPress={() => setSearchQuery('')} style={{ padding: 4 }}>
                        <Ionicons name="close-circle" size={20} color={theme.colors.text.secondary} />
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
              <View className="py-4 pb-40">
                <ActivityIndicator size="small" color={theme.colors.primary.default} />
              </View>
            ) : null
          }
          {...FLATLIST_PERFORMANCE_PROPS}
          />
        </GestureDetector>
      </View>

      {/* Sort Bar - floating above generate bar */}
      {!pagination.loading && (
        <ExploreSortBar
          isMinimized={scrollY > SCROLL_THRESHOLD}
          scrollY={scrollY}
          sortMode={sortMode}
          onSortModeChange={setSortMode}
          tags={tags}
          selectedTags={selectedTags}
          onToggleTag={toggleTagFilter}
          onClearFilters={clearTagFilters}
          generateBarExpanded={generateBarExpanded}
        />
      )}

      {/* Quick Generate Bottom Bar */}
      <QuickGenerateBar
        isMinimized={scrollY > SCROLL_THRESHOLD}
        scrollY={scrollY}
        onGenerated={onRefresh}
        onExpandedChange={setGenerateBarExpanded}
      />
    </View>
  );
}
