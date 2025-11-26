import React, { useState, useEffect } from 'react';
import { useFirstVisit } from '../hooks/useFirstVisit';
import { View, StyleSheet, Platform, useWindowDimensions, Keyboard, Alert, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MagicalLoadingScreen from '../components/molecules/MagicalLoadingScreen';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import Icon from '../components/atoms/Icon';
import { callStoryteller, isCreditError } from '../src/utils/api';
import { useAuth } from '../src/contexts/AuthContext';
import Text from '../components/atoms/Text';
import Button from '../components/atoms/Button';
import TextField from '../components/atoms/TextField';
import { router } from 'expo-router';
import CommonHeader from '../components/molecules/CommonHeader';
import { Character } from '../types/character';
import { usePostHog } from '../src/hooks/usePostHogWeb';
import { showErrorAlert } from '../src/components/ErrorAlert';
import CreateCharacterAvatar from '../components/molecules/CreateCharacterAvatar';
import CharacterList from '../components/molecules/CharacterList';

import { analytics } from '../src/services/analytics';

const useResponsiveLayout = () => {
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  const isTablet = windowWidth >= 768 && windowWidth < 1400;
  const isDesktop = windowWidth >= 1400;
  const isLandscape = windowWidth > windowHeight;
  const isTabletPortrait = isTablet && !isLandscape;
  const isTabletLandscape = isTablet && isLandscape;

  // Font sizes
  const sectionTitleSize = isTablet || isDesktop ? 26 : 18;
  const sectionInfoSize = isTablet || isDesktop ? 22 : 18;
  const infoIconSize = isTablet || isDesktop ? 32 : 24;

  return {
    isTablet,
    isTabletPortrait,
    isTabletLandscape,
    isDesktop,
    isLandscape,
    windowWidth,
    sectionTitleSize,
    sectionInfoSize,
    infoIconSize,
  };
};
const SectionHeader = ({ title, showInfo, onToggleInfo, titleSize, iconSize }: {
  title: string;
  showInfo: boolean;
  onToggleInfo: () => void;
  titleSize: number;
  iconSize: number;
}) => (
  <View style={styles.sectionHeader}>
    <Text style={[styles.sectionTitle, { fontSize: titleSize }]}>{title}</Text>
    <TouchableOpacity onPress={onToggleInfo} style={styles.infoButton}>
      <Icon
        set="sf-symbols"
        name={showInfo ? "questionmark.circle.fill" : "questionmark.circle"}
        size={iconSize}
        color={showInfo ? "#ffffff" : "#999999"}
      />
    </TouchableOpacity>
  </View>
);

export default function CreateStory() {
  const [storyText, setStoryText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedCharacter, setSelectedCharacter] = useState<(Character & { id: string }) | null>(null);
  const [showCharacterInfo, setShowCharacterInfo] = useState(false);
  const [showStoryInfo, setShowStoryInfo] = useState(false);

  const { isTabletPortrait, isTabletLandscape, isDesktop, sectionTitleSize, sectionInfoSize, infoIconSize } = useResponsiveLayout();
  const avatarSize = isTabletPortrait ? 200 : isTabletLandscape ? 160 : isDesktop ? 200 : 120;

  const { showAllTooltips } = useFirstVisit('createStory');
  const posthog = usePostHog();
  const { user, isAuthenticated } = useAuth();

  useEffect(() => {
    if (showAllTooltips) {
      setShowCharacterInfo(true);
      setShowStoryInfo(true);
    }
  }, [showAllTooltips]);

  useEffect(() => {
    posthog?.capture('story_creation_page_viewed');
  }, []);

  const handleCreateCharacter = () => {
    router.push('/createCharacter');
  };

  const handleWriteStory = async () => {
    Keyboard.dismiss();

    // Track story creation started with prompt entered
    if (selectedCharacter) {
      analytics.track('story_creation_started', {
        characterId: selectedCharacter.id,
        characterName: selectedCharacter.name,
      });

      analytics.track('story_prompt_entered', {
        promptLength: storyText.length,
        language: 'de', // TODO: Get from user settings
      });
    }

    if (!storyText.trim()) {
      posthog?.capture('story_creation_error', { error: 'empty_story' });
      Alert.alert('Fehler', 'Bitte geben Sie eine Geschichte ein.');
      return;
    }

    if (!selectedCharacter) {
      posthog?.capture('story_creation_error', { error: 'no_character_selected' });
      Alert.alert('Fehler', 'Bitte wählen Sie einen Charakter aus.');
      return;
    }

    let apiStartTime = 0;
    try {
      setIsLoading(true);

      if (!isAuthenticated || !user) {
        throw new Error('Nicht authentifiziert');
      }

      apiStartTime = Date.now();
      const data = await callStoryteller('/story/animal', 'POST', {
        storyDescription: storyText,
        characters: [selectedCharacter?.id],
      });
      console.log(data);
      const apiDuration = Date.now() - apiStartTime;

      // Track successful story generation
      analytics.track('story_generation_completed', {
        storyId: data?.storyData?.storyId || 'unknown',
        characterId: selectedCharacter.id,
        duration: apiDuration,
        pageCount: 10, // Stories are 10 pages
        language: 'de', // TODO: Get from user settings
      });

      setStoryText('');
      
      const storyId = data?.storyData?.storyId
      if(!storyId){
        console.info('No storyId received');
        router.push('/');
        return;
      }

      router.replace(`/story/${storyId}`);
      
    } catch (error) {
      console.error(error);

      // Track failed story generation
      analytics.track('story_generation_failed', {
        characterId: selectedCharacter.id,
        error: error instanceof Error ? error.message : 'unknown_error',
        duration: Date.now() - apiStartTime,
      });

      // Only show alert for non-credit errors (credit errors are handled globally)
      if (!isCreditError(error)) {
        showErrorAlert({
          error: error as any,
          onRetry: () => handleWriteStory(),
          onDismiss: () => console.log('Error dismissed'),
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleCharacterSelect = (character: Character & { id: string }) => {
    setSelectedCharacter(character);
    posthog?.capture('character_selected_for_story', {
      character_id: character.id,
      character_name: character.name
    });
  };

  return (
    <>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <CommonHeader title="Geschichte erstellen" />

        <View style={styles.mainContainer}>
          <KeyboardAwareScrollView
            contentContainerStyle={styles.contentContainer}
            enableOnAndroid={true}
            enableAutomaticScroll={true}
            keyboardShouldPersistTaps="handled"
            extraScrollHeight={Platform.OS === 'ios' ? 120 : 150}
            keyboardOpeningTime={0}>
            <View style={styles.centeredWrapper}>
              <View style={[styles.section, styles.firstSection]}>
                <View style={styles.container}>
                <SectionHeader
                  title="Wähle deinen Charakter"
                  showInfo={showCharacterInfo}
                  onToggleInfo={() => setShowCharacterInfo(!showCharacterInfo)}
                  titleSize={sectionTitleSize}
                  iconSize={infoIconSize}
                />
                {showCharacterInfo && (
                  <Text style={[styles.sectionInfo, { fontSize: sectionInfoSize, lineHeight: sectionInfoSize * 1.4 }]}>
                    Wähle einen deiner Charaktere aus, der die Hauptrolle in deiner Geschichte spielen soll.
                    Der ausgewählte Charakter wird mit seinen Eigenschaften in die Geschichte eingebaut.
                  </Text>
                )}
              </View>
              <CharacterList
                onCharacterPress={handleCharacterSelect}
                createButton={<CreateCharacterAvatar onPress={handleCreateCharacter} size={avatarSize} />}
                selectedCharacterId={selectedCharacter?.id}
                selectable={true}
                avatarSize={avatarSize}
              />
            </View>

              <View style={styles.container}>
                <View style={styles.section}>
                <SectionHeader
                  title="Beschreibe deine Geschichte"
                  showInfo={showStoryInfo}
                  onToggleInfo={() => setShowStoryInfo(!showStoryInfo)}
                  titleSize={sectionTitleSize}
                  iconSize={infoIconSize}
                />
                {showStoryInfo && (
                  <Text style={[styles.sectionInfo, { fontSize: sectionInfoSize, lineHeight: sectionInfoSize * 1.4 }]}>
                    Beschreibe hier deine Geschichtsidee. Du kannst den Handlungsablauf, die Stimmung und wichtige Ereignisse beschreiben.
                    Die KI wird daraus eine passende Geschichte mit deinem ausgewählten Charakter erstellen und diese illustrieren.
                  </Text>
                )}
                <TextField
                  placeholder="z.B. Mein Charakter geht auf eine magische Reise durch einen verzauberten Wald und trifft dort sprechende Tiere..."
                  value={storyText}
                  onChangeText={setStoryText}
                  multiline
                  numberOfLines={6}
                  variant="large"
                  placeholderTextColor="#666666"
                />
                <Button
                  onPress={handleWriteStory}
                  title="Geschichte erstellen"
                  variant="primary"
                  size="lg"
                  iconName="chevron.right"
                  iconSet="sf-symbols"
                  iconPosition="right"
                  style={styles.submitButton}
                  disabled={isLoading || !selectedCharacter}
                />

                </View>
              </View>
            </View>
          </KeyboardAwareScrollView>
        </View>
      </SafeAreaView>
      {isLoading && <MagicalLoadingScreen context="story" />}
    </>
  );
}

import { Image } from 'expo-image';

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#181818',
  },
  mainContainer: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
  },
  contentContainer: {
    flexGrow: 1,
    paddingTop: 72,
    paddingBottom: Platform.OS === 'android' ? 200 : 120,
  },
  centeredWrapper: {
    width: '100%',
    maxWidth: 1200,
    alignSelf: 'center',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  infoButton: {
    padding: 4,
    marginTop: -4,
  },
  sectionInfo: {
    color: '#999999',
    fontSize: 18,
    lineHeight: 26,
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  container: {
    padding: 12,
    maxWidth: 600,
    alignSelf: 'center',
    width: '100%',
  },
  section: {
    marginBottom: 16,
  },
  firstSection: {
    marginTop: 0,
    width: '100%',
  },
  sectionTitle: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
    flex: 1,
  },
  description: {
    fontSize: 16,
    lineHeight: 24,
    color: '#ffffff',
    marginBottom: 24,
    opacity: 0.9,
  },
  submitButton: {
    borderRadius: 12,
    padding: 14,
    marginTop: 8,
  },
});
