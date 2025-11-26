import React, { useState, useMemo, useCallback } from 'react';
import { View, StyleSheet, FlatList, Dimensions, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import StoryCard from '../components/molecules/StoryCard';
import Text from '../components/atoms/Text';
import CommonHeader from '../components/molecules/CommonHeader';
import SearchBar from '../components/molecules/SearchBar';
import { usePublicStories } from '../hooks/usePublicStories';
import StoryCardSkeleton from '../components/molecules/StoryCardSkeleton';
import BottomFilterTabs, { type FilterTab } from '../components/molecules/BottomFilterTabs';

export default function DiscoverScreen() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<FilterTab>('popular');
  const [isSearchVisible, setIsSearchVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  const { 
    stories, 
    loading, 
    error,
    loadMore,
    hasMore,
    refresh,
    refreshing
  } = usePublicStories(activeTab);

  const screenWidth = Dimensions.get('window').width;
  const isWideScreen = screenWidth > 1000;
  const containerWidth = isWideScreen ? 600 : screenWidth;
  const cardWidth = Math.min((containerWidth - 48) / 2, 280);

  const handleSearchPress = useCallback(() => {
    setIsSearchVisible(true);
  }, []);

  const handleCloseSearch = useCallback(() => {
    setIsSearchVisible(false);
    setSearchQuery('');
  }, []);

  const handleTabPress = useCallback((tab: FilterTab) => {
    setActiveTab(tab);
  }, []);

  const filteredStories = useMemo(() => {
    if (!searchQuery.trim()) {
      return stories;
    }
    
    const query = searchQuery.toLowerCase().trim();
    return stories.filter(story => 
      story?.prompt?.toLowerCase().includes(query) ||
      story?.title?.toLowerCase().includes(query)
    );
  }, [stories, searchQuery]);

  const SearchButton = () => (
    <TouchableOpacity 
      onPress={handleSearchPress}
      style={styles.searchButton}
      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
    >
      <Ionicons name="search-outline" size={24} color="#ffffff" />
    </TouchableOpacity>
  );

  const renderStoryItem = ({ item }) => (
    <View style={styles.cardContainer}>
      <StoryCard 
        story={item} 
        width={cardWidth}
        showBadge={item.visibility === 'featured'}
        badgeText={item.visibility === 'featured' ? '⭐ Featured' : undefined}
        showVoteCount={true}
        voteCount={item.vote_count || 0}
      />
    </View>
  );

  const renderSkeletonItem = () => (
    <View style={styles.cardContainer}>
      <StoryCardSkeleton width={cardWidth} />
    </View>
  );

  const renderFooter = () => {
    if (!hasMore) return null;
    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator size="small" color="#ffffff" />
      </View>
    );
  };


  const renderEmptyState = () => {
    // Show coming soon message if backend endpoint not ready
    if (error?.includes('coming soon')) {
      return (
        <View style={styles.emptyState}>
          <Ionicons name="construct-outline" size={64} color="#FFD700" />
          <Text style={styles.emptyStateTitle}>Bald verfügbar!</Text>
          <Text style={styles.emptyStateText}>
            Die öffentliche Geschichten-Galerie wird bald verfügbar sein.
            {"\n\n"}Erstelle deine eigenen Geschichten und teile sie bald mit anderen.
          </Text>
        </View>
      );
    }
    
    return (
      <View style={styles.emptyState}>
        <Ionicons name="book-outline" size={64} color="#666" />
        <Text style={styles.emptyStateTitle}>Keine Geschichten gefunden</Text>
        <Text style={styles.emptyStateText}>
          {searchQuery ? 'Versuche es mit anderen Suchbegriffen' : 'Schau später nochmal vorbei'}
        </Text>
      </View>
    );
  };

  if (loading && !refreshing && stories.length === 0) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <CommonHeader 
          title="Entdecken" 
          rightComponent={<SearchButton />}
        />
        <ScrollView style={styles.scrollView}>
          <View style={styles.container}>
            <FlatList
              data={Array(6)}
              renderItem={renderSkeletonItem}
              keyExtractor={(_, index) => `skeleton-${index}`}
              numColumns={2}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.listContent}
              columnWrapperStyle={styles.row}
              scrollEnabled={false}
            />
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <CommonHeader 
        title="Entdecken" 
        rightComponent={<SearchButton />}
      />
      
      {isSearchVisible && (
        <SearchBar
          visible={isSearchVisible}
          value={searchQuery}
          onChangeText={setSearchQuery}
          onClose={handleCloseSearch}
        />
      )}

      <View style={styles.container}>
        <FlatList
          data={filteredStories}
          renderItem={renderStoryItem}
          keyExtractor={(item) => item.id}
          numColumns={2}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[
            styles.listContent,
            filteredStories.length === 0 && styles.emptyListContent
          ]}
          columnWrapperStyle={filteredStories.length > 0 ? styles.row : undefined}
          ListEmptyComponent={renderEmptyState}
          ListFooterComponent={renderFooter}
          onEndReached={loadMore}
          onEndReachedThreshold={0.5}
          refreshing={refreshing}
          onRefresh={refresh}
        />
      </View>
      
      <BottomFilterTabs
        activeTab={activeTab}
        onTabPress={handleTabPress}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#181818',
  },
  scrollView: {
    flex: 1,
    width: '100%',
    paddingTop: 100,
  },
  container: {
    flex: 1,
    padding: 16,
    maxWidth: 600,
    alignSelf: 'center',
    width: '100%',
  },
  searchButton: {
    padding: 8,
    marginRight: -8,
  },
  listContent: {
    paddingTop: 100,
    paddingBottom: 100, // Space for bottom tabs
  },
  emptyListContent: {
    flexGrow: 1,
  },
  row: {
    justifyContent: 'space-between',
    width: '100%',
  },
  cardContainer: {
    marginBottom: 16,
  },
  footerLoader: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ffffff',
    marginTop: 16,
  },
  emptyStateText: {
    fontSize: 14,
    color: '#999',
    marginTop: 8,
    textAlign: 'center',
  },
});