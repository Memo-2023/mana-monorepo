import React, { useState, useMemo, useEffect } from 'react';
import StoryCardSkeleton from '../components/molecules/StoryCardSkeleton';
import { View, StyleSheet, FlatList, Pressable, Dimensions, ScrollView, Platform, TouchableOpacity, SectionList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { useRouter } from 'expo-router';
import { useStories } from '../hooks/useStories';
import StoryCard from '../components/molecules/StoryCard';
import CreateStoryCard from '../components/molecules/CreateStoryCard';
import Text from '../components/atoms/Text';
import Icon from '../components/atoms/Icon';
import CommonHeader from '../components/molecules/CommonHeader';
import SearchBar from '../components/molecules/SearchBar';
import FilterChip from '../components/atoms/FilterChip';
import { dataService } from '../src/utils/dataService';
import type { Character } from '../types/character';
import Toast from 'react-native-toast-message';

export default function StoriesScreen() {
  const { allStories, loading, refreshStories } = useStories();
  const router = useRouter();
  const [isSearchVisible, setIsSearchVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'favorites' | string>('all');
  const [characters, setCharacters] = useState<(Character & { id: string })[]>([]);
  const [charactersLoading, setCharactersLoading] = useState(true);

  // Filtere archivierte Geschichten aus und gruppiere nach Typ
  const { centralStories, userStories } = useMemo(() => {
    const nonArchived = allStories.filter(story => story.archived !== true);
    const central = nonArchived.filter(story => 
      story.visibility === 'central' || 
      story.visibility === 'featured' ||
      story.is_central === true
    );
    const user = nonArchived.filter(story => 
      !story.visibility || 
      story.visibility === 'private' ||
      (story.visibility !== 'central' && story.visibility !== 'featured' && !story.is_central)
    );
    return { centralStories: central, userStories: user };
  }, [allStories]);
  
  const nonArchivedStories = useMemo(() => {
    return allStories.filter(story => story.archived !== true);
  }, [allStories]);

  // Load characters for filter
  useEffect(() => {
    const loadCharacters = async () => {
      try {
        setCharactersLoading(true);
        const charactersList = await dataService.getCharacters();
        const nonArchivedCharacters = charactersList.filter(char => char.archived !== true);

        // Sort by createdAt desc
        nonArchivedCharacters.sort((a, b) => {
          const dateA = new Date(a.createdAt || 0).getTime();
          const dateB = new Date(b.createdAt || 0).getTime();
          return dateB - dateA;
        });

        setCharacters(nonArchivedCharacters);
        setCharactersLoading(false);
      } catch (error) {
        console.error('Error loading characters:', error);
        setCharactersLoading(false);
      }
    };

    loadCharacters();
  }, []);

  // Get unique character IDs from stories
  const characterIdsWithStories = useMemo(() => {
    const ids = new Set<string>();
    nonArchivedStories.forEach(story => {
      // Check both camelCase and snake_case variations
      const charId = story.characterId || (story as any).character_id;
      if (charId) {
        ids.add(charId);
      }
    });
    console.log('📊 Character IDs with stories:', Array.from(ids));
    console.log('📖 Sample story characterId:', nonArchivedStories[0]?.characterId || (nonArchivedStories[0] as any)?.character_id);
    return ids;
  }, [nonArchivedStories]);

  // Filter characters that have at least one story
  const charactersWithStories = useMemo(() => {
    const filtered = characters.filter(char => characterIdsWithStories.has(char.id));
    console.log('👥 Total characters:', characters.length);
    console.log('✅ Characters with stories:', filtered.length);
    console.log('📝 Characters with stories:', filtered.map(c => ({ id: c.id, name: c.name })));
    return filtered;
  }, [characters, characterIdsWithStories]);

  // Count stories per character
  const storyCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    nonArchivedStories.forEach(story => {
      // Check both camelCase and snake_case variations
      const charId = story.characterId || (story as any).character_id;
      if (charId) {
        counts[charId] = (counts[charId] || 0) + 1;
      }
    });
    console.log('📊 Story counts per character:', counts);
    return counts;
  }, [nonArchivedStories]);

  // Count favorites
  const favoritesCount = useMemo(() => {
    return nonArchivedStories.filter(story => story.is_favorite === true).length;
  }, [nonArchivedStories]);

  const handleSearchPress = () => {
    setIsSearchVisible(true);
  };

  const handleCloseSearch = () => {
    setIsSearchVisible(false);
    setSearchQuery('');
  };

  const filteredSections = useMemo(() => {
    const sections = [];
    let stories = nonArchivedStories;

    // Apply character filter
    if (activeFilter !== 'all' && activeFilter !== 'favorites') {
      stories = stories.filter(story => {
        const charId = story.characterId || (story as any).character_id;
        return charId === activeFilter;
      });
    }

    // Apply favorites filter
    if (activeFilter === 'favorites') {
      stories = stories.filter(story => story.is_favorite === true);
    }

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      stories = stories.filter(story =>
        story?.prompt?.toLowerCase().includes(query) ||
        story?.title?.toLowerCase().includes(query)
      );
    }

    // Group by central vs user stories
    const central = stories.filter(story =>
      story.visibility === 'central' ||
      story.visibility === 'featured' ||
      story.is_central === true
    );
    const user = stories.filter(story =>
      !story.visibility ||
      story.visibility === 'private' ||
      (story.visibility !== 'central' && story.visibility !== 'featured' && !story.is_central)
    );

    if (searchQuery.trim() || activeFilter !== 'all') {
      // Show filtered results
      if (central.length > 0) {
        sections.push({
          title: 'Märchenzauber Geschichten',
          data: central,
          isCentral: true
        });
      }
      if (user.length > 0 || (central.length === 0 && activeFilter === 'all')) {
        sections.push({
          title: activeFilter === 'favorites' ? 'Favoriten' : 'Deine Geschichten',
          data: central.length === 0 && activeFilter === 'all' ? [null, ...user] : user,
          isCentral: false
        });
      }
    } else {
      // Default view (no filters)
      if (central.length > 0) {
        sections.push({
          title: 'Märchenzauber Geschichten',
          data: [null, ...central],
          isCentral: true
        });
      }
      if (user.length > 0 || central.length === 0) {
        sections.push({
          title: 'Deine Geschichten',
          data: central.length > 0 ? user : [null, ...user],
          isCentral: false
        });
      }
    }

    return sections;
  }, [centralStories, userStories, nonArchivedStories, searchQuery, activeFilter]);

  const SearchButton = () => (
    <TouchableOpacity
      onPress={handleSearchPress}
      style={styles.searchButton}
      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
    >
      <Icon
        set="ionicons"
        name="search-outline"
        size={24}
        color="#ffffff"
        containerStyle="round"
        containerColor="rgba(255, 255, 255, 0.1)"
        containerSize={40}
      />
    </TouchableOpacity>
  );
  const screenWidth = Dimensions.get('window').width;
  const isWideScreen = screenWidth > 1000;
  
  // Calculate container width
  const containerWidth = isWideScreen ? 600 : screenWidth;
  const cardWidth = Math.min((containerWidth - 48) / 2, 280); // max card width of 280px

  const handleCreateStory = () => {
    router.push('/createStory');
  };

  const handleFavoriteToggle = async (storyId: string, isFavorite: boolean) => {
    try {
      console.log('❤️ Toggle favorite:', storyId, 'to', isFavorite);
      await dataService.toggleFavorite(storyId, isFavorite);
      // Refresh the stories list to get updated data
      await refreshStories();
      console.log('✅ Favorite toggled successfully');

      // Show success toast
      Toast.show({
        type: 'success',
        text1: isFavorite ? '❤️ Zu Favoriten hinzugefügt!' : '❤️ Aus Favoriten entfernt',
        position: 'top',
        topOffset: 60,
        visibilityTime: 2000,
      });
    } catch (error) {
      console.error('❌ Error toggling favorite:', error);
      Toast.show({
        type: 'error',
        text1: 'Fehler',
        text2: 'Favoriten-Status konnte nicht geändert werden. Bei anhaltenden Problemen helfen wir gerne unter support@manacore.ai weiter.',
        position: 'top',
        topOffset: 60,
        visibilityTime: 2000,
      });
    }
  };

  const renderStoryItem = ({ item, index, section }) => {
    if (item === null) {
      return (
        <View style={styles.cardContainer}>
          <CreateStoryCard onPress={handleCreateStory} width={cardWidth} />
        </View>
      );
    }
    return (
      <View style={styles.cardContainer}>
        <StoryCard
          story={item}
          width={cardWidth}
          showBadge={section?.isCentral || item.visibility === 'central' || item.visibility === 'featured'}
          badgeText={item.visibility === 'featured' ? '⭐ Featured' : '✨ Märchenzauber'}
          showFavorite={!section?.isCentral}
          onFavoriteToggle={handleFavoriteToggle}
        />
      </View>
    );
  };
  
  const renderSectionHeader = ({ section }) => {
    if (!section.title) return null;
    // Don't show "Deine Geschichten" header if it's the only section
    if (section.title === 'Deine Geschichten' && filteredSections.length === 1 && !searchQuery.trim()) {
      return null;
    }
    return (
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>{section.title}</Text>
        {section.isCentral && (
          <View style={styles.sectionBadge}>
            <Text style={styles.sectionBadgeText}>Offiziell</Text>
          </View>
        )}
      </View>
    );
  };

  const renderSkeletonItem = ({ index }) => {
    if (index === 0) {
      return (
        <View style={styles.cardContainer}>
          <CreateStoryCard onPress={handleCreateStory} width={cardWidth} />
        </View>
      );
    }
    return (
      <View style={styles.cardContainer}>
        <StoryCardSkeleton width={cardWidth} />
      </View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <CommonHeader
          title="Geschichten"
          rightComponent={<SearchButton />}
        />
        <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollViewContent}>
          {isSearchVisible && (
            <SearchBar
              visible={isSearchVisible}
              value={searchQuery}
              onChangeText={setSearchQuery}
              onClose={handleCloseSearch}
            />
          )}

          <View style={styles.container}>
            <View style={styles.sectionContainer}>
              <FlatList
                  data={[null, ...Array(5)]} // Create Button + 5 Skeletons
                  renderItem={renderSkeletonItem}
                  keyExtractor={(_, index) => `skeleton-${index}`}
                  numColumns={2}
                  showsVerticalScrollIndicator={false}
                  contentContainerStyle={styles.listContent}
                  columnWrapperStyle={styles.row}
                  scrollEnabled={false}
                />
            </View>
          </View>
        </ScrollView>

        {/* Floating Filter Bar - Loading State */}
        <View style={styles.floatingFilterContainer}>
          {Platform.OS === 'ios' ? (
            <BlurView intensity={80} tint="dark" style={styles.filterBar}>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.filterBarContent}
              >
                <FilterChip
                  label="Alle"
                  active={activeFilter === 'all'}
                  onPress={() => setActiveFilter('all')}
                />
                <FilterChip
                  label="Favoriten"
                  active={false}
                  onPress={() => {}}
                  icon="heart"
                  count={0}
                />
              </ScrollView>
            </BlurView>
          ) : (
            <View style={[styles.filterBar, styles.filterBarAndroid]}>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.filterBarContent}
              >
                <FilterChip
                  label="Alle"
                  active={activeFilter === 'all'}
                  onPress={() => setActiveFilter('all')}
                />
                <FilterChip
                  label="Favoriten"
                  active={false}
                  onPress={() => {}}
                  icon="heart"
                  count={0}
                />
              </ScrollView>
            </View>
          )}
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <CommonHeader 
        title="Geschichten" 
        rightComponent={<SearchButton />}
      />
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollViewContent}>
        {isSearchVisible && (
          <SearchBar
            visible={isSearchVisible}
            value={searchQuery}
            onChangeText={setSearchQuery}
            onClose={handleCloseSearch}
          />
        )}

        <View style={styles.container}>
          {filteredSections.length === 0 || filteredSections.every(s => s.data.length === 0) ? (
            // Empty State
            <View style={styles.emptyStateContainer}>
              <Icon
                set="ionicons"
                name={activeFilter === 'favorites' ? 'heart-outline' : 'book-outline'}
                size={64}
                color="#666666"
              />
              <Text style={styles.emptyStateTitle}>
                {activeFilter === 'favorites'
                  ? 'Noch keine Favoriten'
                  : searchQuery.trim()
                  ? 'Keine Geschichten gefunden'
                  : 'Keine Geschichten'}
              </Text>
              <Text style={styles.emptyStateSubtext}>
                {activeFilter === 'favorites'
                  ? 'Markiere Geschichten als Favoriten über das Herz-Symbol'
                  : searchQuery.trim()
                  ? 'Versuche es mit einem anderen Suchbegriff'
                  : 'Erstelle deine erste Geschichte'}
              </Text>
            </View>
          ) : (
            filteredSections.map((section, sectionIndex) => (
              <View key={`section-${sectionIndex}`} style={styles.sectionContainer}>
                {renderSectionHeader({ section })}
                <FlatList
                  data={section.data}
                  renderItem={({ item, index }) => renderStoryItem({ item, index, section })}
                  keyExtractor={(item, index) => item?.id || `create-${sectionIndex}`}
                  numColumns={2}
                  showsVerticalScrollIndicator={false}
                  contentContainerStyle={styles.listContent}
                  columnWrapperStyle={styles.row}
                  scrollEnabled={false}
                />
              </View>
            ))
          )}
        </View>
      </ScrollView>

      {/* Floating Filter Bar */}
      <View style={styles.floatingFilterContainer}>
        {Platform.OS === 'ios' ? (
          <BlurView intensity={80} tint="dark" style={styles.filterBar}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.filterBarContent}
            >
              <FilterChip
                label="Alle"
                active={activeFilter === 'all'}
                onPress={() => setActiveFilter('all')}
              />
              <FilterChip
                label="Favoriten"
                active={activeFilter === 'favorites'}
                onPress={() => setActiveFilter('favorites')}
                icon="heart"
                count={favoritesCount}
              />
              {charactersWithStories.map(character => (
                <FilterChip
                  key={character.id}
                  label={character.name}
                  active={activeFilter === character.id}
                  onPress={() => setActiveFilter(character.id)}
                  count={storyCounts[character.id]}
                />
              ))}
            </ScrollView>
          </BlurView>
        ) : (
          <View style={[styles.filterBar, styles.filterBarAndroid]}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.filterBarContent}
            >
              <FilterChip
                label="Alle"
                active={activeFilter === 'all'}
                onPress={() => setActiveFilter('all')}
              />
              <FilterChip
                label="Favoriten"
                active={activeFilter === 'favorites'}
                onPress={() => setActiveFilter('favorites')}
                icon="heart"
                count={favoritesCount}
              />
              {charactersWithStories.map(character => (
                <FilterChip
                  key={character.id}
                  label={character.name}
                  active={activeFilter === character.id}
                  onPress={() => setActiveFilter(character.id)}
                  count={storyCounts[character.id]}
                />
              ))}
            </ScrollView>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  searchButton: {
    padding: 8,
    marginRight: -8,
  },
  safeArea: {
    flex: 1,
    backgroundColor: '#181818',
  },
  scrollView: {
    flex: 1,
    width: '100%',
  },
  scrollViewContent: {
    flexGrow: 1,
    paddingTop: 72,
    paddingBottom: 140, // Extra space for floating filter bar
  },
  container: {
    flex: 1,
    maxWidth: 600,
    alignSelf: 'center',
    width: '100%',
    paddingHorizontal: 16,
  },
  listContent: {
    paddingBottom: 16,
  },
  row: {
    justifyContent: 'space-between',
    width: '100%',
  },
  cardContainer: {
    marginBottom: 16,
  },
  sectionContainer: {
    marginTop: 24,
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 24,
    ...(Platform.OS === 'android'
      ? { fontFamily: 'Grandstander_700Bold' }
      : { fontFamily: 'Grandstander_700Bold', fontWeight: '700' as const }
    ),
    color: '#ffffff',
  },
  sectionBadge: {
    marginLeft: 8,
    backgroundColor: '#FFD700',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  sectionBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#181818',
  },
  emptyStateContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 80,
    paddingHorizontal: 32,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    marginTop: 16,
    textAlign: 'center',
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#999999',
    marginTop: 8,
    textAlign: 'center',
    lineHeight: 20,
  },
  // Floating Filter Bar
  floatingFilterContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 100,
  },
  filterBar: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    paddingBottom: Platform.OS === 'ios' ? 32 : 16, // Extra padding for iOS home indicator
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 12,
  },
  filterBarAndroid: {
    backgroundColor: 'rgba(24, 24, 24, 0.95)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  filterBarContent: {
    gap: 8,
    paddingRight: 16,
  },
});
