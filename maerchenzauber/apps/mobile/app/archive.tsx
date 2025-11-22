import React, { useState, useCallback } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Dimensions, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import CommonHeader from '../components/molecules/CommonHeader';
import Text from '../components/atoms/Text';
import Avatar from '../components/atoms/Avatar';
import StoryCard from '../components/molecules/StoryCard';
import ArchiveLoadingSkeleton from '../components/molecules/ArchiveLoadingSkeleton';
import TabSwitcher from '../components/molecules/TabSwitcher';
import { Ionicons } from '@expo/vector-icons';
import type { Character } from '../types/character';
import type { Story } from '../types/Story';
import { dataService } from '../src/utils/dataService';

export default function ArchiveScreen() {
  const [activeTab, setActiveTab] = useState<'characters' | 'stories'>('characters');
  const [archivedCharacters, setArchivedCharacters] = useState<(Character & { id: string })[]>([]);
  const [archivedStories, setArchivedStories] = useState<(Story & { id: string })[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const { width: screenWidth } = Dimensions.get('window');
  const isWideScreen = screenWidth > 1000;
  
  // Calculate container width and card sizes (optimized for faster loading)
  const containerWidth = isWideScreen ? 600 : screenWidth;
  const cardWidth = Math.min((containerWidth - 48) / 2, 280); // max card width of 280px
  const avatarSize = isWideScreen ? 140 : Math.min(120, (screenWidth - 96) / 2); // Reduced from 180/150 for faster loading

  // Use useFocusEffect to reload archived content when screen comes into focus
  // This ensures the list refreshes after archiving/unarchiving
  useFocusEffect(
    useCallback(() => {
      const loadArchivedContent = async () => {
        try {
          setLoading(true);

          // Load all characters INCLUDING archived ones, then filter for archived
          const allCharacters = await dataService.getCharacters(true);
          const archivedCharactersList = allCharacters.filter(char => char.archived === true);

          // Sort by createdAt desc
          archivedCharactersList.sort((a, b) => {
            const dateA = new Date(a.createdAt || 0).getTime();
            const dateB = new Date(b.createdAt || 0).getTime();
            return dateB - dateA;
          });

          setArchivedCharacters(archivedCharactersList);

          // Load all stories INCLUDING archived ones, then filter for archived
          const allStories = await dataService.getStories(true);
          const archivedStoriesList = allStories.filter(story => story.archived === true);

          // Sort by createdAt desc
          archivedStoriesList.sort((a, b) => {
            const dateA = new Date(a.createdAt || 0).getTime();
            const dateB = new Date(b.createdAt || 0).getTime();
            return dateB - dateA;
          });

          setArchivedStories(archivedStoriesList);
        } catch (error) {
          console.error('Error loading archived content:', error);
        } finally {
          setLoading(false);
        }
      };

      loadArchivedContent();
    }, [])
  );

  const handleCharacterPress = (character: Character & { id: string }) => {
    router.push(`/character/${character.id}`);
  };

  const handleUnarchiveCharacter = async (character: Character & { id: string }) => {
    try {
      Alert.alert(
        "Charakter entarchivieren",
        `Möchtest du deinen Charakter ${character.name} wirklich aus dem Archiv holen?`,
        [
          {
            text: "Abbrechen",
            style: "cancel"
          },
          {
            text: "Entarchivieren",
            onPress: async () => {
              try {
                await dataService.updateCharacter(character.id, { archived: false });

                // Update the list of archived characters
                setArchivedCharacters(prev => prev.filter(c => c.id !== character.id));

                // Navigate back to home screen to trigger refresh
                Alert.alert(
                  "Erfolg",
                  `${character.name} wurde erfolgreich entarchiviert und ist jetzt auf deiner Startseite sichtbar.`,
                  [
                    {
                      text: "OK",
                      onPress: () => router.push('/')
                    }
                  ]
                );
              } catch (error) {
                console.error('Error unarchiving character:', error);
                Alert.alert("Fehler", "Beim Entarchivieren ist ein Fehler aufgetreten.\n\nBei anhaltenden Problemen helfen wir gerne unter support@manacore.ai weiter.");
              }
            }
          }
        ]
      );
    } catch (error) {
      console.error('Error unarchiving character:', error);
      Alert.alert("Fehler", "Beim Entarchivieren ist ein Fehler aufgetreten.\n\nBei anhaltenden Problemen helfen wir gerne unter support@manacore.ai weiter.");
    }
  };

  const handleUnarchiveStory = async (story: Story & { id: string }) => {
    try {
      Alert.alert(
        "Geschichte entarchivieren",
        `Möchtest du deine Geschichte "${story.title}" wirklich aus dem Archiv holen?`,
        [
          {
            text: "Abbrechen",
            style: "cancel"
          },
          {
            text: "Entarchivieren",
            onPress: async () => {
              try {
                await dataService.updateStory(story.id, { archived: false });

                // Update the list of archived stories
                setArchivedStories(prev => prev.filter(s => s.id !== story.id));

                // Navigate back to home screen to trigger refresh
                Alert.alert(
                  "Erfolg",
                  `Die Geschichte wurde erfolgreich entarchiviert und ist jetzt auf deiner Startseite sichtbar.`,
                  [
                    {
                      text: "OK",
                      onPress: () => router.push('/')
                    }
                  ]
                );
              } catch (error) {
                console.error('Error unarchiving story:', error);
                Alert.alert("Fehler", "Beim Entarchivieren ist ein Fehler aufgetreten.\n\nBei anhaltenden Problemen helfen wir gerne unter support@manacore.ai weiter.");
              }
            }
          }
        ]
      );
    } catch (error) {
      console.error('Error unarchiving story:', error);
      Alert.alert("Fehler", "Beim Entarchivieren ist ein Fehler aufgetreten.\n\nBei anhaltenden Problemen helfen wir gerne unter support@manacore.ai weiter.");
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <CommonHeader title="Archiv" />
        <View style={[styles.container, { maxWidth: containerWidth }]}>
          <ArchiveLoadingSkeleton activeTab={activeTab} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <CommonHeader title="Archiv" />
      <View style={[styles.container, { maxWidth: containerWidth }]}>
        <TabSwitcher
          options={[
            { key: 'characters', label: 'Charaktere' },
            { key: 'stories', label: 'Geschichten' }
          ]}
          activeKey={activeTab}
          onTabChange={(key) => setActiveTab(key as 'characters' | 'stories')}
        />

        <ScrollView 
          style={styles.scrollView} 
          contentContainerStyle={styles.scrollViewContent}
          showsVerticalScrollIndicator={false}
        >
          {activeTab === 'characters' ? (
            archivedCharacters.length > 0 ? (
              <View style={styles.charactersGrid}>
                {archivedCharacters.map(character => (
                  <View key={character.id} style={styles.characterContainer}>
                    <TouchableOpacity 
                      style={styles.characterImageContainer}
                      onPress={() => handleCharacterPress(character)}
                    >
                      <Avatar
                        imageUrl={character.imageUrl || (character as any).image_url}
                        name={character.name}
                        size={avatarSize}
                        blurhash={character.blur_hash}
                      />
                      <Text style={styles.characterName}>{character.name}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={styles.unarchiveButton}
                      onPress={() => handleUnarchiveCharacter(character)}
                    >
                      <Ionicons name="arrow-undo-outline" size={20} color="#FFFFFF" />
                      <Text style={styles.unarchiveText}>Entarchivieren</Text>
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            ) : (
              <View style={styles.emptyContainer}>
                <Ionicons name="archive-outline" size={64} color="#555555" />
                <Text style={styles.emptyText}>Keine archivierten Charaktere</Text>
              </View>
            )
          ) : (
            archivedStories.length > 0 ? (
              <View style={styles.storiesGrid}>
                {archivedStories.map(story => (
                  <View key={story.id} style={styles.storyCardContainer}>
                    <StoryCard story={story} width={cardWidth} />
                    <TouchableOpacity 
                      style={styles.unarchiveButton}
                      onPress={() => handleUnarchiveStory(story)}
                    >
                      <Ionicons name="arrow-undo-outline" size={20} color="#FFFFFF" />
                      <Text style={styles.unarchiveText}>Entarchivieren</Text>
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            ) : (
              <View style={styles.emptyContainer}>
                <Ionicons name="archive-outline" size={64} color="#555555" />
                <Text style={styles.emptyText}>Keine archivierten Geschichten</Text>
              </View>
            )
          )}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#181818',
  },
  container: {
    flex: 1,
    padding: 16,
    paddingTop: 80, // Deutlich größerer Abstand oben, damit die Tabs nicht hinter dem Header versteckt werden
    alignSelf: 'center',
    width: '100%',
  },

  scrollView: {
    flex: 1,
  },
  scrollViewContent: {
    flexGrow: 1,
    paddingBottom: 0,
  },
  charactersGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  storiesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  characterContainer: {
    width: '48%',
    alignItems: 'center',
    marginBottom: 24,
  },
  characterImageContainer: {
    alignItems: 'center',
  },
  characterName: {
    marginTop: 8,
    fontSize: 16,
    textAlign: 'center',
    color: '#FFFFFF',
  },
  storyCardContainer: {
    marginBottom: 24,
    alignItems: 'center',
  },
  unarchiveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#444444',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    marginTop: 8,
  },
  unarchiveText: {
    color: '#FFFFFF',
    marginLeft: 4,
    fontSize: 14,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 64,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 18,
    color: '#AAAAAA',
  },
});
