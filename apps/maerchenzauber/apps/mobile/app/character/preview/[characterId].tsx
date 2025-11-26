import React, { useEffect, useState } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
  ScrollView,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { fetchWithAuth } from '../../../src/utils/api';
import { useAuth } from '../../../src/contexts/AuthContext';
import Text from '../../../components/atoms/Text';
import { Image } from 'expo-image';
import Button from '../../../components/atoms/Button';
import CommonHeader from '../../../components/molecules/CommonHeader';
import { Ionicons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
import MagicalLoadingScreen from '../../../components/molecules/MagicalLoadingScreen';

interface SharedCharacter {
  id: string;
  name: string;
  image_url: string;
  user_description: string;
  character_description: string;
  images_data?: Array<{
    image_url: string;
    description: string;
  }>;
  is_animal: boolean;
  animal_type?: string;
  user_id: string;
  blur_hash?: string;
}

export default function CharacterPreview() {
  const { characterId, shareCode } = useLocalSearchParams<{
    characterId: string;
    shareCode?: string;
  }>();
  const router = useRouter();
  const { user, loading: authLoading, isAuthenticated } = useAuth();

  const [character, setCharacter] = useState<SharedCharacter | null>(null);
  const [loading, setLoading] = useState(true);
  const [importing, setImporting] = useState(false);
  const [selectedImage, setSelectedImage] = useState(0);

  const { width: screenWidth } = Dimensions.get('window');
  const isWideScreen = screenWidth > 1000;

  useEffect(() => {
    // Guard 1: Validate character ID early
    if (!characterId) {
      console.error('[CharacterPreview] No character ID provided');
      setLoading(false);
      Alert.alert('Error', 'No character ID provided', [
        { text: 'OK', onPress: () => router.back() }
      ]);
      return;
    }

    // Guard 2: Wait for auth to initialize
    if (authLoading) {
      console.log('[CharacterPreview] Waiting for auth initialization...');
      return;
    }

    // Guard 3: Check if user is authenticated
    // If shareCode is provided, we can use the public endpoint (no auth required)
    // Otherwise, the /character/shared endpoint requires authentication
    if (!shareCode && (!isAuthenticated || !user)) {
      console.error('[CharacterPreview] User not authenticated and no share code provided, redirecting to login');
      setLoading(false);
      Alert.alert(
        'Anmeldung erforderlich',
        'Du musst angemeldet sein, um geteilte Charaktere anzusehen.',
        [
          {
            text: 'Anmelden',
            onPress: () => {
              try {
                // Use push instead of replace to avoid snapshot crashes
                router.push('/login');
              } catch (error) {
                console.error('[CharacterPreview] Failed to navigate to login:', error);
                router.push('/(tabs)/(story)');
              }
            }
          },
          {
            text: 'Abbrechen',
            style: 'cancel',
            onPress: () => {
              try {
                // Use push instead of replace to avoid snapshot crashes
                router.push('/(tabs)/(story)');
              } catch (error) {
                console.error('[CharacterPreview] Failed to navigate to home:', error);
              }
            }
          }
        ]
      );
      return;
    }

    console.log('[CharacterPreview] Auth ready, loading character...');
    console.log('[CharacterPreview] Character ID for loading:', characterId);
    console.log('[CharacterPreview] User ID:', user?.sub);

    // Guard 4: Properly handle the async function call with comprehensive error handling
    const loadCharacterSafely = async () => {
      try {
        console.log('[CharacterPreview] Starting loadCharacterSafely...');
        await loadSharedCharacter();
        console.log('[CharacterPreview] loadCharacterSafely completed successfully');
      } catch (error) {
        console.error('[CharacterPreview] Unhandled error in loadCharacterSafely:', error);
        console.error('[CharacterPreview] Error stack:', error instanceof Error ? error.stack : 'No stack');
        // Error is already handled inside loadSharedCharacter
        // This catch prevents any unhandled promise rejections from crashing the app
        setLoading(false);
      }
    };

    loadCharacterSafely();
  }, [characterId, authLoading, isAuthenticated, user]);

  const loadSharedCharacter = async () => {
    // Guard: Double-check character ID
    if (!characterId) {
      console.error('[CharacterPreview] loadSharedCharacter called without characterId');
      Alert.alert('Error', 'No character ID provided');
      try {
        router.back();
      } catch (navError) {
        console.error('[CharacterPreview] Navigation error in loadSharedCharacter:', navError);
        router.replace('/(tabs)/(story)');
      }
      return;
    }

    try {
      setLoading(true);
      console.log('[CharacterPreview] Step 1: Starting fetch for character:', characterId);

      console.log('[CharacterPreview] Step 2: Calling API...');
      // If shareCode is provided, use public endpoint (no auth required)
      // Otherwise, use authenticated shared endpoint
      const endpoint = shareCode
        ? `/characters/public/${characterId}/${shareCode}`
        : `/character/shared/${characterId}`;

      console.log('[CharacterPreview] Using endpoint:', endpoint);

      const response = await (shareCode
        ? // Public endpoint - no auth required
          fetch(
            `${process.env.EXPO_PUBLIC_STORYTELLER_BACKEND_URL}${endpoint}`,
            {
              method: 'GET',
              headers: {
                'Content-Type': 'application/json',
              },
            }
          )
        : // Authenticated endpoint
          fetchWithAuth(endpoint, {
            method: 'GET',
          }));

      console.log('[CharacterPreview] Step 3: Received response, status:', response?.status);

      // Guard: Validate response
      if (!response) {
        console.error('[CharacterPreview] Step 3.1: No response received');
        throw new Error('No response received from server');
      }

      console.log('[CharacterPreview] Step 4: Parsing JSON...');
      const result = await response.json();
      console.log('[CharacterPreview] Step 5: Parsed JSON, result:', result ? 'exists' : 'null');

      // Guard: Validate result structure
      if (!result) {
        console.error('[CharacterPreview] Step 5.1: Result is null/undefined');
        throw new Error('Invalid response format');
      }

      if (!response.ok || result.error) {
        console.error('[CharacterPreview] Step 5.2: Response not OK or has error', {
          ok: response.ok,
          error: result.error,
          status: response.status
        });
        throw new Error(result.error || `Server error: ${response.status}`);
      }

      // Guard: Validate character data
      // Public endpoint returns character directly, authenticated endpoint wraps in data
      const characterData = shareCode ? result : result.data;
      if (!characterData) {
        console.error('[CharacterPreview] Step 5.3: No character data in result');
        throw new Error('No character data in response');
      }

      console.log('[CharacterPreview] Step 6: Setting character state...');
      // Map public endpoint response format to expected format
      if (shareCode) {
        setCharacter({
          id: characterData.id,
          name: characterData.name,
          image_url: characterData.imageUrls?.[0] || '',
          user_description: characterData.description || '',
          character_description: characterData.description || '',
          images_data: characterData.imageUrls?.map((url: string) => ({
            image_url: url,
            description: '',
          })) || [],
          is_animal: characterData.isAnimal || false,
          animal_type: characterData.animalType,
          user_id: '', // Not needed for public characters
          blur_hash: characterData.blur_hash,
        });
      } else {
        setCharacter(characterData);
      }
      console.log('[CharacterPreview] Step 7: Character loaded successfully:', characterData.name);
    } catch (error) {
      console.error('[CharacterPreview] Error loading character:', error);

      // Determine user-friendly error message
      let errorMessage = 'Dieser Charakter ist nicht zum Teilen verfügbar oder existiert nicht.';
      let errorTitle = 'Charakter nicht gefunden';

      if (error instanceof Error) {
        if (error.message.includes('timeout') || error.message.includes('timed out')) {
          errorMessage = 'Die Anfrage hat zu lange gedauert. Bitte überprüfe deine Internetverbindung und versuche es erneut.';
          errorTitle = 'Verbindungs-Timeout';
        } else if (error.message.includes('Network') || error.message.includes('fetch')) {
          errorMessage = 'Verbindung zum Server nicht möglich. Bitte überprüfe deine Internetverbindung.';
          errorTitle = 'Verbindungsfehler';
        } else if (error.message.includes('Not authenticated')) {
          errorMessage = 'Deine Sitzung ist abgelaufen. Bitte melde dich erneut an.';
          errorTitle = 'Authentifizierung erforderlich';
        }
      }

      Alert.alert(
        errorTitle,
        errorMessage,
        [
          {
            text: 'OK',
            onPress: () => {
              try {
                router.back();
              } catch (navError) {
                console.error('[CharacterPreview] Navigation error after error alert:', navError);
                router.replace('/(tabs)/(story)');
              }
            }
          }
        ]
      );
    } finally {
      setLoading(false);
    }
  };

  const handleImport = async () => {
    if (!character || !user) {
      Alert.alert(
        'Authentifizierung erforderlich',
        'Du musst angemeldet sein, um Charaktere zu importieren.'
      );
      return;
    }

    // Check if user is trying to import their own character
    if (character.user_id === user.sub) {
      Alert.alert(
        'Import nicht möglich',
        'Du kannst deinen eigenen Charakter nicht importieren. Dieser Charakter ist bereits in deiner Bibliothek.'
      );
      return;
    }

    Alert.alert(
      'Charakter importieren',
      `"${character.name}" für 10 Credits zu deiner Bibliothek hinzufügen?`,
      [
        { text: 'Abbrechen', style: 'cancel' },
        {
          text: 'Importieren (10 Credits)',
          onPress: async () => {
            try {
              setImporting(true);
              console.log('[CharacterPreview] Importing character:', characterId);

              const response = await fetchWithAuth(
                `/character/import/${characterId}`,
                {
                  method: 'POST',
                }
              );

              const result = await response.json();

              if (!response.ok || result.error) {
                if (result.error?.includes('insufficient credits')) {
                  throw new Error(
                    'Du benötigst 10 Credits, um diesen Charakter zu importieren. Bitte kaufe mehr Credits.'
                  );
                }
                throw new Error(result.error || 'Charakter konnte nicht importiert werden');
              }

              Toast.show({
                type: 'success',
                text1: 'Charakter importiert!',
                text2: `${character.name} wurde zu deiner Bibliothek hinzugefügt`,
                position: 'top',
                topOffset: 60,
              });

              console.log(
                '[CharacterPreview] Character imported successfully:',
                result.data.id
              );

              // Navigate back to character list to show the newly imported character
              // The useFocusEffect in characters.tsx will trigger and refresh the list
              router.push('/characters');
            } catch (error) {
              console.error('[CharacterPreview] Error importing character:', error);
              Alert.alert(
                'Import fehlgeschlagen',
                error instanceof Error
                  ? error.message
                  : 'Dieser Charakter konnte nicht importiert werden. Bitte versuche es erneut.'
              );
            } finally {
              setImporting(false);
            }
          },
        },
      ]
    );
  };

  // Show loading screen while auth or character data is loading
  if (loading || authLoading) {
    return <MagicalLoadingScreen context="character" />;
  }

  if (!character) {
    return (
      <SafeAreaView style={styles.container}>
        <CommonHeader title="Charakter nicht gefunden" showBackButton />
        <View style={styles.errorContainer}>
          <Ionicons name="sad-outline" size={64} color="#999" />
          <Text style={styles.errorText}>Charakter nicht verfügbar</Text>
        </View>
      </SafeAreaView>
    );
  }

  const currentImage =
    character.images_data && character.images_data[selectedImage]
      ? character.images_data[selectedImage].image_url
      : character.image_url;

  return (
    <SafeAreaView style={styles.container}>
      <CommonHeader
        title="Charakter importieren"
        showBackButton
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Character Image */}
        <View style={styles.imageContainer}>
          <Image
            source={{ uri: currentImage }}
            style={[
              styles.characterImage,
              {
                width: isWideScreen ? 300 : 240,
                height: isWideScreen ? 300 : 240,
                borderRadius: isWideScreen ? 150 : 120,
              },
            ]}
            contentFit="cover"
            placeholder={character.blur_hash}
            transition={0}
            recyclingKey={characterId}
            cachePolicy="memory-disk"
            // Disable transition to prevent race conditions during deeplink navigation
            // The transition animation can conflict with CoreGraphics layer destruction
            // recyclingKey helps expo-image properly cleanup and reuse image instances
          />
        </View>

        {/* Image Selector */}
        {character.images_data && character.images_data.length > 1 && (
          <View style={styles.imageSelectorContainer}>
            {character.images_data.map((img, index) => (
              <TouchableOpacity
                key={index}
                onPress={() => setSelectedImage(index)}
                style={[
                  styles.imageSelector,
                  selectedImage === index && styles.imageSelectorActive,
                ]}
              >
                <Image
                  source={{ uri: img.image_url }}
                  style={styles.imageSelectorImage}
                  contentFit="cover"
                  transition={0}
                  cachePolicy="memory-disk"
                  recyclingKey={`${characterId}-${index}`}
                />
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Character Info */}
        <View style={styles.infoSection}>
          <Text style={styles.characterName}>{character.name}</Text>

          {character.animal_type && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>
                {character.animal_type}
              </Text>
            </View>
          )}
        </View>

        {/* Import Button */}
        <View style={styles.actionContainer}>
          <Button
            title={importing ? 'Importiere...' : 'Zu meiner Bibliothek hinzufügen (10 Credits)'}
            onPress={handleImport}
            disabled={importing}
            style={styles.importButton}
          />

          {importing && (
            <ActivityIndicator
              size="small"
              color="#FF6B9D"
              style={styles.loader}
            />
          )}

          <Text style={styles.helpText}>
            Das Importieren dieses Charakters erstellt eine Kopie in deiner Bibliothek, die du für Geschichten verwenden kannst.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a2e',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  errorText: {
    marginTop: 16,
    fontSize: 18,
    color: '#999',
  },
  imageContainer: {
    alignItems: 'center',
    marginVertical: 20,
  },
  characterImage: {
    backgroundColor: '#2a2a3e',
  },
  imageSelectorContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
    marginVertical: 16,
  },
  imageSelector: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 2,
    borderColor: 'transparent',
    overflow: 'hidden',
  },
  imageSelectorActive: {
    borderColor: '#FF6B9D',
  },
  imageSelectorImage: {
    width: '100%',
    height: '100%',
  },
  infoSection: {
    width: '100%',
    maxWidth: 600,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    padding: 20,
    marginVertical: 16,
  },
  characterName: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 12,
  },
  badge: {
    backgroundColor: 'rgba(255, 107, 157, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    alignSelf: 'center',
    marginBottom: 16,
  },
  badgeText: {
    color: '#FF6B9D',
    fontSize: 14,
    fontWeight: '600',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ffffff',
    marginTop: 16,
    marginBottom: 8,
  },
  description: {
    fontSize: 16,
    color: '#cccccc',
    lineHeight: 24,
  },
  actionContainer: {
    width: '100%',
    maxWidth: 600,
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 40,
  },
  importButton: {
    width: '100%',
    marginBottom: 16,
  },
  loader: {
    marginVertical: 8,
  },
  helpText: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    marginTop: 8,
    paddingHorizontal: 20,
    lineHeight: 20,
  },
});
