import React, { useState, useMemo, useEffect, useCallback } from 'react';
import Skeleton from '../components/atoms/Skeleton';
import { View, StyleSheet, FlatList, Pressable, ScrollView, Platform, useWindowDimensions, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { useRouter, useFocusEffect } from 'expo-router';
import Avatar from '../components/atoms/Avatar';
import CreateCharacterAvatar from '../components/molecules/CreateCharacterAvatar';
import Text from '../components/atoms/Text';
import Icon from '../components/atoms/Icon';
import CommonHeader from '../components/molecules/CommonHeader';
import SearchBar from '../components/molecules/SearchBar';
import type { Character } from '../types/character';
import { dataService } from '../src/utils/dataService';

export default function CharactersScreen() {
  const [characters, setCharacters] = useState<(Character & { id: string })[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSearchVisible, setIsSearchVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const router = useRouter();
  const { width: screenWidth } = useWindowDimensions();

  const handleSearchPress = () => {
    setIsSearchVisible(true);
  };

  const handleCloseSearch = () => {
    setIsSearchVisible(false);
    setSearchQuery('');
  };

  const SearchButton = () => (
    <TouchableOpacity
      onPress={handleSearchPress}
      style={styles.searchButton}
      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
    >
      <Icon
        set="sf-symbols"
        name="magnifyingglass"
        size={24}
        color="#ffffff"
        containerStyle="round"
        containerColor="rgba(255, 255, 255, 0.1)"
        containerSize={40}
      />
    </TouchableOpacity>
  );

  const filteredCharacters = useMemo(() => {
    if (!searchQuery.trim()) return characters;

    const query = searchQuery.toLowerCase().trim();
    return characters.filter(character =>
      character?.name?.toLowerCase().includes(query) ||
      character?.personality?.toLowerCase().includes(query) ||
      character?.background?.toLowerCase().includes(query)
    );
  }, [characters, searchQuery]);

  // Responsive layout calculation
  const isTablet = screenWidth >= 768;
  const isWideScreen = screenWidth >= 1024;

  // Calculate number of columns based on screen width
  const numColumns = isWideScreen ? 4 : isTablet ? 3 : 2;

  // Calculate avatar size based on screen width and number of columns
  const containerPadding = isTablet ? 40 : 16;
  const itemPadding = 16;
  const maxContainerWidth = isWideScreen ? 1200 : isTablet ? 900 : 600;
  const effectiveWidth = Math.min(screenWidth - (containerPadding * 2), maxContainerWidth);
  const avatarSize = Math.floor((effectiveWidth - (itemPadding * 2 * numColumns)) / numColumns);

  // Load characters function - memoized to avoid recreating on every render
  const loadCharacters = useCallback(async () => {
    try {
      setLoading(true);
      const charactersList = await dataService.getCharacters();

      // Filter out archived characters
      const nonArchivedCharacters = charactersList.filter(char => {
        // Show characters that either don't have an archived field or where archived is not true
        return char.archived !== true;
      });

      // Sort by createdAt desc
      nonArchivedCharacters.sort((a, b) => {
        const dateA = new Date(a.createdAt || a.created_at || 0).getTime();
        const dateB = new Date(b.createdAt || b.created_at || 0).getTime();
        return dateB - dateA;
      });

      setCharacters(nonArchivedCharacters);
    } catch (error) {
      console.error('[CharactersScreen] Error loading characters:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Refresh characters when screen comes into focus (e.g., after importing a character)
  useFocusEffect(
    useCallback(() => {
      loadCharacters();
    }, [loadCharacters])
  );

  const handleCreateCharacter = () => {
    router.push('/createCharacter');
  };

  const handleCharacterPress = (character: Character & { id: string }) => {
    router.push(`/character/${character.id}`);
  };


  const renderCharacterItem = ({ item, index }) => {
    if (index === 0) {
      return (
        <View style={[styles.characterContainer, { width: `${100 / numColumns}%` }]}>
          <CreateCharacterAvatar onPress={handleCreateCharacter} size={avatarSize} />
        </View>
      );
    }

    return (
      <Pressable
        style={[styles.characterContainer, { width: `${100 / numColumns}%` }]}
        onPress={() => handleCharacterPress(item)}
      >
        <Avatar
          imageUrl={item.imageUrl || (item as any).image_url}
          name={item.name}
          size={avatarSize}
          showName={true}
          blurhash={item.blur_hash}
          isFeatured={(item as any).isFeatured}
        />
      </Pressable>
    );
  };

  const SkeletonCharacter = () => (
    <View style={[styles.characterContainer, { width: `${100 / numColumns}%` }]}>
      <View style={styles.skeletonWrapper}>
        <Skeleton style={[styles.skeletonAvatar, {
          width: avatarSize,
          height: avatarSize,
          borderRadius: avatarSize / 2,
        }]} />
        <Skeleton style={[styles.skeletonName, { width: avatarSize }]} />
      </View>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <CommonHeader
          title="Charaktere"
          rightComponent={<SearchButton />}
        />
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={[
            styles.scrollViewContent,
            { paddingHorizontal: containerPadding, maxWidth: maxContainerWidth, alignSelf: 'center', width: '100%' }
          ]}
        >
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
              data={[null, ...Array(5)]} // Ein Platz für Create-Button + 5 Skeleton Loader
              renderItem={({ index }) => (
                index === 0 ? (
                  <View style={[styles.characterContainer, { width: `${100 / numColumns}%` }]}>
                    <CreateCharacterAvatar onPress={handleCreateCharacter} size={avatarSize} />
                  </View>
                ) : (
                  <SkeletonCharacter key={`skeleton-${index}`} />
                )
              )}
              keyExtractor={(_, index) => `skeleton-${index}`}
              key={numColumns}
              numColumns={numColumns}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.listContent}
              scrollEnabled={false}
              initialNumToRender={6}
              maxToRenderPerBatch={6}
              windowSize={5}
            />
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <CommonHeader
        title="Charaktere"
        rightComponent={<SearchButton />}
      />
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollViewContent,
          { paddingHorizontal: containerPadding, maxWidth: maxContainerWidth, alignSelf: 'center', width: '100%' }
        ]}
      >
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
              data={[null, ...filteredCharacters]}
              renderItem={renderCharacterItem}
              keyExtractor={(item, index) => item?.id || 'create'}
              key={numColumns}
              numColumns={numColumns}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.listContent}
              scrollEnabled={false}
              initialNumToRender={6}
              maxToRenderPerBatch={6}
              windowSize={5}
            />
          </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  searchButton: {
    padding: 8,
    marginRight: -8,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
  },
  skeletonWrapper: {
    alignItems: 'center',
  },
  skeletonAvatar: {
    backgroundColor: '#2C2C2C',
    marginBottom: 8,
  },
  skeletonName: {
    height: 48,
    borderRadius: 4,
    backgroundColor: '#2C2C2C',
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
    paddingTop: 72, // Abstand für den Header (konsistent mit Homepage)
    paddingBottom: 120,
  },
  container: {
    flex: 1,
    alignSelf: 'center',
    width: '100%',
  },
  listContent: {
    paddingBottom: 16,
  },
  characterContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
});
