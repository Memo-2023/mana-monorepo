import React, { useState, useCallback } from 'react';
import { View, StyleSheet, Pressable, Animated } from 'react-native';
import MemoList, { MemoModel } from './MemoList';
import SearchBar from './SearchBar';
import Icon from '~/components/atoms/Icon';
import Text from '~/components/atoms/Text';
import { useTheme } from '~/features/theme/ThemeProvider';
import { useMemoListSearch } from '~/features/memos/hooks/useMemoListSearch';
import { useTranslation } from 'react-i18next';

interface SearchableMemoListProps {
  showArchived?: boolean | null;
  spaceId?: string;
  tagIds?: string[];
  selectionMode?: boolean;
  selectedMemoIds?: string[];
  onMemoSelection?: (memoId: string, selected: boolean) => void;
  refreshTrigger?: number;
  onShare?: (memo: MemoModel) => void;
  onMemosLoaded?: (memos: MemoModel[]) => void;
}

const SearchableMemoList: React.FC<SearchableMemoListProps> = ({
  showArchived,
  spaceId,
  tagIds,
  selectionMode,
  selectedMemoIds,
  onMemoSelection,
  refreshTrigger,
  onShare,
  onMemosLoaded,
}) => {
  const { isDark, themeVariant } = useTheme();
  const { t } = useTranslation();
  const [isSearchMode, setIsSearchMode] = useState(false);
  const [allMemos, setAllMemos] = useState<MemoModel[]>([]);
  const searchAnimation = useState(new Animated.Value(0))[0];

  // Use the search hook
  const { searchQuery, setSearchQuery, filteredMemos, searchCount, isSearching, clearSearch } =
    useMemoListSearch(allMemos, {
      searchFields: ['title', 'intro', 'transcript', 'tags'],
      minSearchLength: 2,
      includeArchived: showArchived || false,
    });

  // Callback when memos are loaded from MemoList
  const handleMemosLoaded = useCallback(
    (memos: MemoModel[]) => {
      setAllMemos(memos);
      onMemosLoaded?.(memos);
    },
    [onMemosLoaded]
  );

  // Toggle search mode with animation
  const toggleSearchMode = useCallback(() => {
    const newMode = !isSearchMode;
    setIsSearchMode(newMode);

    Animated.timing(searchAnimation, {
      toValue: newMode ? 1 : 0,
      duration: 200,
      useNativeDriver: true,
    }).start();

    if (!newMode) {
      clearSearch();
    }
  }, [isSearchMode, searchAnimation, clearSearch]);

  // Handle search close
  const handleSearchClose = useCallback(() => {
    setIsSearchMode(false);
    clearSearch();

    Animated.timing(searchAnimation, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start();
  }, [searchAnimation, clearSearch]);

  // Determine which memos to display
  const memosToDisplay = isSearching ? filteredMemos : allMemos;

  return (
    <View style={styles.container}>
      {/* Search Bar with animation */}
      {isSearchMode && (
        <Animated.View
          style={[
            styles.searchBarContainer,
            {
              opacity: searchAnimation,
              transform: [
                {
                  translateY: searchAnimation.interpolate({
                    inputRange: [0, 1],
                    outputRange: [-50, 0],
                  }),
                },
              ],
            },
          ]}>
          <SearchBar
            onSearch={setSearchQuery}
            onClose={handleSearchClose}
            placeholder={t('memo.searchPlaceholder', 'Suche in Titel, Inhalt, Tags...')}
            autoFocus={true}
            totalResults={isSearching ? searchCount : 0}
            currentIndex={isSearching && searchCount > 0 ? 1 : 0}
          />
        </Animated.View>
      )}

      {/* Search Button (floating) */}
      {!isSearchMode && !selectionMode && (
        <Pressable
          style={[
            styles.searchButton,
            {
              backgroundColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)',
              borderColor: isDark ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.1)',
            },
          ]}
          onPress={toggleSearchMode}>
          <Icon name="search-outline" size={20} color={isDark ? '#FFFFFF' : '#000000'} />
          <Text style={[styles.searchButtonText, { color: isDark ? '#FFFFFF' : '#000000' }]}>
            {t('common.search', 'Suche')}
          </Text>
        </Pressable>
      )}

      {/* Memo List */}
      <MemoList
        showArchived={showArchived}
        spaceId={spaceId}
        memos={memosToDisplay}
        tagIds={tagIds}
        selectionMode={selectionMode}
        selectedMemoIds={selectedMemoIds}
        onMemoSelection={onMemoSelection}
        refreshTrigger={refreshTrigger}
        onShare={onShare}
        onMemosLoaded={handleMemosLoaded}
      />

      {/* No Results Message */}
      {isSearching && searchCount === 0 && searchQuery.length >= 2 && (
        <View style={styles.noResultsContainer}>
          <Icon
            name="search-outline"
            size={48}
            color={isDark ? 'rgba(255, 255, 255, 0.3)' : 'rgba(0, 0, 0, 0.3)'}
          />
          <Text
            style={[
              styles.noResultsText,
              { color: isDark ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.5)' },
            ]}>
            {t('memo.noSearchResults', 'Keine Memos für')} "{searchQuery}"{' '}
            {t('memo.found', 'gefunden')}
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'relative',
  },
  searchBarContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
  },
  searchButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    gap: 8,
    zIndex: 90,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  searchButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  noResultsContainer: {
    position: 'absolute',
    top: '40%',
    left: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  noResultsText: {
    fontSize: 16,
    textAlign: 'center',
    marginTop: 16,
  },
});

export default SearchableMemoList;
