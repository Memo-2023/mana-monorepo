import React, { useEffect, useState } from 'react';
import Skeleton from '../atoms/Skeleton';
import { View, FlatList, StyleSheet, TouchableOpacity, useWindowDimensions } from 'react-native';
import Avatar from '../atoms/Avatar';
import Text from '../atoms/Text';
import { useDebugBorders } from '../../hooks/useDebugBorders';
import type { Character } from '../../types/character';
import { dataService } from '../../src/utils/dataService';
import { useFocusEffect } from 'expo-router';

interface CharacterListProps {
  onCharacterPress?: (character: Character & { id: string }) => void;
  createButton?: React.ReactNode;
  selectedCharacterId?: string | null;
  selectable?: boolean;
  avatarSize?: number;
}

const useResponsiveLayout = () => {
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  const isTablet = windowWidth >= 768 && windowWidth < 1400;
  const isDesktop = windowWidth >= 1400;
  const isLandscape = windowWidth > windowHeight;
  const isTabletPortrait = isTablet && !isLandscape;
  const isTabletLandscape = isTablet && isLandscape;

  return {
    offset: isDesktop ? 400 : 0,
    isTablet,
    isTabletPortrait,
    isTabletLandscape,
    isDesktop,
    // Keep for backward compatibility
    isWideScreen: isDesktop
  };
};

export default function CharacterList({
  onCharacterPress,
  createButton,
  selectedCharacterId,
  selectable = false,
  avatarSize = 100
}: CharacterListProps) {
  const containerDebug = useDebugBorders('#FF0000');
  const cardDebug = useDebugBorders('#00FF00');
  const listDebug = useDebugBorders('#0000FF');
  const avatarDebug = useDebugBorders('#FF00FF');
  const [characters, setCharacters] = useState<(Character & { id: string })[]>([]);
  const [loading, setLoading] = useState(true);
  const { offset, isTablet, isTabletPortrait, isTabletLandscape, isDesktop, isWideScreen } = useResponsiveLayout();

  // Use useFocusEffect instead of useEffect to reload characters when screen comes into focus
  // This ensures the list refreshes after archiving a character
  useFocusEffect(
    React.useCallback(() => {
      const loadCharacters = async () => {
        try {
          setLoading(true);
          const charactersList = await dataService.getCharacters();

          // Backend already filters out archived characters
          // Sort by createdAt desc (backend already does this, but keeping for consistency)
          charactersList.sort((a, b) => {
            const dateA = new Date(a.createdAt || 0).getTime();
            const dateB = new Date(b.createdAt || 0).getTime();
            return dateB - dateA;
          });

          setCharacters(charactersList);
          setLoading(false);
        } catch (error) {
          console.error('Error loading characters:', error);
          setLoading(false);
        }
      };

      loadCharacters();
    }, [])
  );

  const renderCharacter = ({ item }: { item: Character & { id: string } }) => {
    const isSelected = selectable && selectedCharacterId === item.id;
    const cardWidth = isTabletPortrait ? 220 : isTabletLandscape ? 180 : 140;
    return (
      <TouchableOpacity
        style={[
          styles.characterCard,
          { width: cardWidth },
          cardDebug
        ]}
        onPress={() => onCharacterPress?.(item)}
      >
        <View style={[avatarDebug, styles.avatarContainer]}>
          <Avatar
            imageUrl={item.imageUrl || (item as any).image_url}
            name={item.name}
            size={avatarSize}
            showName={true}
            isSelected={isSelected}
            blurhash={item.blur_hash}
            isFeatured={(item as any).isFeatured}
          />
        </View>
      </TouchableOpacity>
    );
  };

  const renderSpacer = () => isDesktop ? <View style={[styles.spacer, { width: offset }]} /> : null;

  const SkeletonCharacter = () => {
    const cardWidth = isTabletPortrait ? 220 : isTabletLandscape ? 180 : 140;
    return (
      <TouchableOpacity style={[styles.characterCard, { width: cardWidth }, cardDebug]} disabled>
        <View style={[avatarDebug, styles.skeletonAvatarContainer, { height: avatarSize }]}>
          <Skeleton style={[styles.skeletonAvatar, { width: avatarSize, height: avatarSize, borderRadius: avatarSize / 2 }]} />
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    const cardWidth = isTabletPortrait ? 220 : isTabletLandscape ? 180 : 140;
    return (
      <View style={[isDesktop ? styles.gridContainer : styles.container, containerDebug]}>
        <FlatList
          horizontal={!isDesktop}
          key={isDesktop ? 'grid' : 'horizontal'}
          numColumns={isDesktop ? 6 : undefined}
          showsHorizontalScrollIndicator={false}
          data={isDesktop ? [null, 1, 2, 3, 4, 5] : [null, 1, 2, 3]}
          renderItem={({ index }) => {
            if (index === 0) {
              return (
                <View style={[styles.characterCard, { width: cardWidth }, cardDebug]}>
                  {createButton || <SkeletonCharacter />}
                </View>
              );
            }
            return <SkeletonCharacter />;
          }}
          keyExtractor={(_, index) => `skeleton-${index}`}
          contentContainerStyle={isDesktop ? styles.gridContentCharacters : styles.listContent}
          initialNumToRender={6}
          removeClippedSubviews={false}
        />
      </View>
    );
  }

  if (characters.length === 0 && !createButton) {
    return (
      <View style={[styles.container, containerDebug]}>
        <Text color="#CCCCCC">Keine Charaktere gefunden</Text>
      </View>
    );
  }

  const cardWidth = isTabletPortrait ? 220 : isTabletLandscape ? 180 : 140;

  return (
    <View style={[isDesktop ? styles.gridContainer : styles.container, containerDebug]}>
      <FlatList
        style={listDebug}
        data={[null, ...characters]}
        renderItem={({ item, index }) => {
          if (index === 0 || item === null) {
            return (
              <View style={[styles.characterCard, { width: cardWidth }, cardDebug]}>
                {createButton}
              </View>
            );
          }
          return renderCharacter({ item });
        }}
        keyExtractor={(item, index) => item?.id || `spacer-${index}`}
        horizontal={!isDesktop}
        key={isDesktop ? 'grid' : 'horizontal'}
        numColumns={isDesktop ? 6 : undefined}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={isDesktop ? styles.gridContentCharacters : styles.listContent}
        initialNumToRender={6}
        removeClippedSubviews={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  avatarContainer: {
    shadowColor: "#000",
    shadowOffset: {
      width: 4,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 8,
  },
  skeletonAvatarContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    height: 100, // Match the avatar size
  },
  skeletonAvatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#2C2C2C',
  },
  container: {
    marginTop: 4,
    marginBottom: 0,
    width: '100%',
    minHeight: 200,
  },
  gridContainer: {
    marginTop: 4,
    marginBottom: 16,
    width: '100%',
  },
  listContent: {
    paddingRight: 16,
    paddingLeft: 16,
  },
  gridContentCharacters: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  characterCard: {
    width: 140,
    marginRight: 8,
    marginBottom: 16,
  },
  spacer: {
    width: 400,
  },
});
