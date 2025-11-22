import React from 'react';
import StoryCardSkeleton from '../components/molecules/StoryCardSkeleton';
import { View, FlatList, StyleSheet, useWindowDimensions, Pressable, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import { Redirect, useRouter } from 'expo-router';
import { useStories } from '../hooks/useStories';
import { useAuth } from '../src/contexts/AuthContext';
import StoryCard from '../components/molecules/StoryCard';
import CreateStoryCard from '../components/molecules/CreateStoryCard';
import CommonHeader from '../components/molecules/CommonHeader';
import { ScrollView } from 'react-native';
import CreateCharacterAvatar from '../components/molecules/CreateCharacterAvatar';
import CharacterList from '../components/molecules/CharacterList';
import PublicCharacterList from '../components/molecules/PublicCharacterList';
import PublicStoryList from '../components/molecules/PublicStoryList';
import { Ionicons } from '@expo/vector-icons';
import Text from '../components/atoms/Text';
import { useDebugBorders } from '../hooks/useDebugBorders';
import { useInitialCharacter } from '../hooks/useInitialCharacter';
import { useInitialStory } from '../hooks/useInitialStory';

const useResponsiveLayout = () => {
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  const isTablet = windowWidth >= 768 && windowWidth < 1400;
  const isDesktop = windowWidth >= 1400;
  const isLandscape = windowWidth > windowHeight;
  const isTabletPortrait = isTablet && !isLandscape;
  const isTabletLandscape = isTablet && isLandscape;

  return {
    offset: isDesktop ? Math.min((windowWidth - 1000) / 2, 400) : 0,
    maxContentWidth: isDesktop ? 1400 : '100%',
    horizontalPadding: isTablet ? 24 : isDesktop ? 40 : 16,
    isTablet,
    isTabletPortrait,
    isTabletLandscape,
    isDesktop,
    isLandscape,
    windowWidth,
    // Keep for backward compatibility
    isWideScreen: isDesktop,
    isVeryWideScreen: isDesktop
  };
};

export default function StorySelection() {
  // All hooks must be called before any conditional returns
  const safeAreaDebug = useDebugBorders('#FF0000', {
    backgroundColor: '#121212',
    borderWidth: 4,
    borderStyle: 'solid'
  });
  const scrollViewDebug = useDebugBorders('#00FF00', { borderStyle: 'dashed' });
  const containerDebug = useDebugBorders('#0000FF', { borderStyle: 'dashed' });
  const contentContainerDebug = useDebugBorders('#FF00FF', { borderStyle: 'dashed' });
  const sectionDebug = useDebugBorders('#FFA500', { borderStyle: 'dashed' });
  const listDebug = useDebugBorders('#00FFFF', { borderStyle: 'dashed' });
  const headerDebug = useDebugBorders('#FFFF00', { borderStyle: 'dashed' });
  const { initializing: characterInitializing } = useInitialCharacter();
const { initializing: storyInitializing } = useInitialStory();
  const { allStories, loading: storiesLoading } = useStories();
  // Filtere archivierte Geschichten aus
  const nonArchivedStories = React.useMemo(() => {
    const filtered = allStories.filter(story => story.archived !== true);
    return filtered;
  }, [allStories]);
  const router = useRouter();
  const { user, isLoading } = useAuth();
  const { offset, isWideScreen, isTablet, isTabletPortrait, isTabletLandscape, isDesktop, maxContentWidth, horizontalPadding, windowWidth } = useResponsiveLayout();
  const avatarSize = isTabletPortrait ? 200 : isTabletLandscape ? 160 : isDesktop ? 200 : 120;

  // State to track if public data is available
  const [hasPublicStories, setHasPublicStories] = React.useState(false);
  const [hasPublicCharacters, setHasPublicCharacters] = React.useState(false);

  // All handler functions should be defined using useCallback to prevent unnecessary re-renders
  const handleCreateStory = React.useCallback(() => {
    router.push('/createStory');
  }, [router]);

  const handleCreateCharacter = React.useCallback(() => {
    router.push('/createCharacter');
  }, [router]);


  const handleCharacterPress = React.useCallback((character: any) => {
    router.push(`/character/${character.id}`);
  }, [router]);

  const handlePublicCharacterPress = React.useCallback((character: any) => {
    // Navigate to public character details or show modal
    router.push(`/character/${character.id}`);
  }, [router]);

  const navigateToStories = React.useCallback(() => {
    router.push('/stories');
  }, [router]);

  const navigateToCharacters = React.useCallback(() => {
    router.push('/characters');
  }, [router]);

  const navigateToDiscover = React.useCallback(() => {
    router.push('/discover');
  }, [router]);

  const navigateToDiscoverCharacters = React.useCallback(() => {
    router.push('/discover-characters');
  }, [router]);

  const renderSectionHeader = React.useCallback((title: string, onPress: () => void) => {
    // Responsive font and icon sizes
    const headerFontSize = isTablet ? 32 : 24;
    const chevronSize = isTablet ? 36 : 28;

    return (
      <View style={[styles.sectionHeaderWrapper, isDesktop && styles.sectionHeaderWrapperWide]}>
        <Pressable
          onPress={onPress}
          style={({ pressed }) => [
            styles.sectionHeaderContainer,
            pressed && styles.sectionHeaderPressed,
            headerDebug
          ]}
        >
          <View style={styles.headerTextContainer}>
            <Text style={[styles.headerText, { fontSize: headerFontSize }]}>{title}</Text>
            <Ionicons
              name="chevron-forward"
              size={chevronSize}
              color="#FFFFFF"
              style={styles.chevron}
            />
          </View>
        </Pressable>
      </View>
    );
  }, [isDesktop, isTablet, headerDebug]);

  // Early return for loading and authentication
  if (isLoading) {
    return null;
  }

  if (!user) {
    return <Redirect href="/login" />;
  }







  const renderStoryItem = ({ item, index }) => {
    // iPad Portrait (Hochformat): Groß und prominent
    // iPad Landscape (Querformat): Kleiner, damit nichts abgeschnitten wird
    const cardWidth = isTabletPortrait ? 500 : isTabletLandscape ? 330 : 240;
    const createCardWidth = isTabletPortrait ? 400 : isTabletLandscape ? 260 : 180;
    // CreateStoryCard: Gleiche Höhe wie die StoryCard für einheitliches Aussehen
    const cardHeight = cardWidth * 1.5; // ASPECT_RATIO from StoryCard

    if (index === 0) {
      return (
        <View style={[styles.storyContainer, sectionDebug]}>
          <CreateStoryCard onPress={handleCreateStory} width={createCardWidth} height={cardHeight} />
        </View>
      );
    }
    return (
      <View style={[styles.storyContainer, sectionDebug]}>
        <StoryCard story={item} width={cardWidth} />
      </View>
    );
  };

  return (
    <SafeAreaView style={[styles.safeArea, safeAreaDebug]} edges={['top']}>
      <CommonHeader
        title="Märchenzauber"
        showBackButton={false}
        showSettingsButton={true}
        showManaButton={true}
        level={1}
        showLogo={false}
      />
      <ScrollView 
        style={[styles.mainContainer, containerDebug]}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {Platform.OS === 'ios' ? (
          <BlurView
            tint="dark"
            intensity={25}
            style={styles.headerBackground}
          />
        ) : (
          <View style={[styles.headerBackground, { backgroundColor: 'rgba(24, 24, 24, 0.9)' }]} />
        )}
        <View style={[styles.contentContainer, contentContainerDebug]}>
            <View style={styles.firstSectionHeader}>
              {renderSectionHeader('Deine Geschichten', navigateToStories)}
            </View>
            {storiesLoading ? (
              <FlatList
                data={[null, ...Array(3)]} // Create Button + 3 Skeletons
                renderItem={({ index }) => {
                  const cardWidth = isTabletPortrait ? 500 : isTabletLandscape ? 330 : 240;
                  const createCardWidth = isTabletPortrait ? 400 : isTabletLandscape ? 260 : 180;
                  const cardHeight = cardWidth * 1.5;
                  return (
                    <View style={[styles.storyContainer, sectionDebug]}>
                      {index === 0 ? (
                        <CreateStoryCard onPress={handleCreateStory} width={createCardWidth} height={cardHeight} />
                      ) : (
                        <StoryCardSkeleton width={cardWidth} />
                      )}
                    </View>
                  );
                }}
                keyExtractor={(_, index) => `skeleton-${index}`}
                horizontal={!isDesktop}
                key={isDesktop ? 'grid' : 'horizontal'}
                numColumns={isDesktop ? 3 : undefined}
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={[
                  isDesktop ? styles.gridContent : styles.listContent,
                  listDebug
                ]}
                initialNumToRender={4}
                removeClippedSubviews={false}
              />
            ) : (
              <FlatList
                data={[null, ...(nonArchivedStories || [])]}
                renderItem={renderStoryItem}
                keyExtractor={(item, index) => item?.id || `spacer-${index}`}
                horizontal={!isDesktop}
                key={isDesktop ? 'grid' : 'horizontal'}
                numColumns={isDesktop ? 3 : undefined}
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={[
                  isDesktop ? styles.gridContent : styles.listContent,
                  listDebug
                ]}
                initialNumToRender={4}
                removeClippedSubviews={false}
              />
            )}
            
            {renderSectionHeader('Deine Charaktere', navigateToCharacters)}
            <CharacterList
              onCharacterPress={handleCharacterPress}
              createButton={<CreateCharacterAvatar onPress={handleCreateCharacter} size={avatarSize} />}
              avatarSize={avatarSize}
            />

            {/* {hasPublicStories && renderSectionHeader('Öffentliche Geschichten', navigateToDiscover)}
            <PublicStoryList limit={8} onDataLoaded={setHasPublicStories} /> */}

            {/* {hasPublicCharacters && renderSectionHeader('Öffentliche Charaktere', navigateToDiscoverCharacters)}
            <PublicCharacterList
              onCharacterPress={handlePublicCharacterPress}
              limit={10}
              onDataLoaded={setHasPublicCharacters}
            /> */}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerBackground: {
    position: 'absolute',
    top: -16,
    left: 0,
    right: 0,
    height: 100,
  },
  safeArea: {
    flex: 1,
    backgroundColor: '#181818',
  },
  mainContainer: {
    flex: 1,
    width: '100%',
  },
  scrollContent: {
    paddingTop: 72, // Abstand für den Header (reduziert von 80)
    paddingBottom: 120, // Ausreichend Abstand unten, auch wenn keine öffentlichen Inhalte
  },
  contentContainer: {
    width: '100%',
    maxWidth: 1200,
    alignSelf: 'center',
  },
  firstSectionHeader: {
    marginTop: 0, // Erste Section ohne extra Abstand
  },
  sectionHeaderWrapper: {
    marginTop: 20, // Reduzierter Abstand zwischen Sections
    paddingHorizontal: 16,
  },
  sectionHeaderWrapperWide: {
    width: '100%',
  },
  sectionHeaderContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    marginBottom: 12,
  },
  sectionHeaderPressed: {
    opacity: 0.7,
  },
  headerTextContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerText: {
    ...(Platform.OS === 'android'
      ? { fontFamily: 'Grandstander_700Bold' }
      : { fontFamily: 'Grandstander_700Bold', fontWeight: '700' as const }
    ),
    color: '#FFFFFF',
  },
  chevron: {
    marginLeft: 8,
    marginTop: -2,
  },
  listContent: {
    paddingLeft: 16,
    paddingRight: 16,
    paddingBottom: 4,
  },
  gridContent: {
    paddingBottom: 16,
    gap: 16,
  },
  storyContainer: {
    marginRight: 20,
    marginBottom: 8,
  },
  spacer: {
  },
});
