import React, { useState, useEffect, useRef } from 'react';
import { useFirstVisit } from '../hooks/useFirstVisit';
import { View, StyleSheet, Alert, ActivityIndicator, Platform, TouchableOpacity, Keyboard, useWindowDimensions, ScrollView, TextInput, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import Text from '../components/atoms/Text';
import Button from '../components/atoms/Button';
import TextField from '../components/atoms/TextField';
import { Image } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import CommonHeader from '../components/molecules/CommonHeader';
import TabSwitcher from '../components/molecules/TabSwitcher';
import PremiumCuddlyToyCard from '../components/molecules/PremiumCuddlyToyCard';
import { fetchWithAuth, isCreditError } from '../src/utils/api';
import { dataService } from '../src/utils/dataService';
import { usePostHog } from '../src/hooks/usePostHog';
import MagicalLoadingScreen from '../components/molecules/MagicalLoadingScreen';
import { router } from 'expo-router';
import type { Character, CustomImage } from '../types/character';
import { showErrorAlert } from '../src/components/ErrorAlert';
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
  const uploadTextPrimarySize = isTablet || isDesktop ? 24 : 18;
  const uploadTextSecondarySize = isTablet || isDesktop ? 18 : 14;
  const tipTextSize = isTablet || isDesktop ? 17 : 13;

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
    uploadTextPrimarySize,
    uploadTextSecondarySize,
    tipTextSize,
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
    <View style={styles.titleContainer}>
      <Text style={[styles.sectionTitle, { fontSize: titleSize }]}>{title}</Text>
      <TouchableOpacity onPress={onToggleInfo} style={styles.infoButton}>
        <MaterialIcons
          name={showInfo ? "help" : "help-outline"}
          size={iconSize}
          color={showInfo ? "#ffffff" : "#999999"}
        />
      </TouchableOpacity>
    </View>
  </View>
);

export default function CreateCharacter() {
  const [isLoading, setIsLoading] = useState(false);
  const [characterDescription, setCharacterDescription] = useState('');
  const [characterName, setCharacterName] = useState('');
  const [showNameInfo, setShowNameInfo] = useState(false);
  const [showDescriptionInfo, setShowDescriptionInfo] = useState(false);
  const [showPhotoInfo, setShowPhotoInfo] = useState(false);
  const [generatedImages, setGeneratedImages] = useState<Array<CustomImage>>([]);
  const [error, setError] = useState<string>('');
  const [selectedImage, setSelectedImage] = useState<CustomImage | null>(null);
  const [characterId, setCharacterId] = useState<string>('');
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'photo' | 'description'>('photo');
  const [loadingContext, setLoadingContext] = useState<'character' | 'cuddly_toy'>('character');

  // Ref to prevent race conditions from double-taps/rapid button presses
  // This guards against multiple simultaneous requests before React re-renders
  const isGeneratingRef = useRef(false);

  const {
    isTablet,
    isDesktop,
    sectionTitleSize,
    sectionInfoSize,
    infoIconSize,
    uploadTextPrimarySize,
    uploadTextSecondarySize,
    tipTextSize
  } = useResponsiveLayout();

  const dynamicStyles = {
    container: {
      maxWidth: 800,
      width: '100%',
      alignSelf: 'center',
      paddingHorizontal: 16
    },
    descriptionInput: {
      minHeight: (isTablet || isDesktop) ? 160 : 120
    }
  };
  
  const { showAllTooltips } = useFirstVisit('createCharacter');
  const posthog = usePostHog();

  useEffect(() => {
    posthog?.capture('character_write_page_viewed');
    if (showAllTooltips) {
      setShowNameInfo(true);
      setShowDescriptionInfo(true);
      setShowPhotoInfo(true);
    }
  }, [showAllTooltips]);

  interface GeneratedImageResponse {
    data: {
      images: Array<{
        description: string;
        imageUrl: string;
      }>;
      characterId: string;
    };
    error?: string;
  }

  const pickImage = async (useCamera: boolean = false) => {
    try {
      if (useCamera) {
        // Check camera permission
        const cameraPermission = await ImagePicker.getCameraPermissionsAsync();

        if (cameraPermission.status === 'undetermined') {
          const { status } = await ImagePicker.requestCameraPermissionsAsync();
          if (status !== 'granted') {
            Alert.alert(
              'Berechtigung erforderlich',
              'Wir benötigen Zugriff auf Ihre Kamera, um ein Foto zu machen.',
              [{ text: 'OK' }]
            );
            return;
          }
        } else if (cameraPermission.status === 'denied') {
          Alert.alert(
            'Berechtigung erforderlich',
            'Der Kamerazugriff wurde verweigert. Bitte aktivieren Sie die Berechtigung in den Einstellungen.',
            [
              { text: 'Abbrechen', style: 'cancel' },
              { text: 'Einstellungen öffnen', onPress: () => Linking.openSettings() }
            ]
          );
          return;
        } else if (cameraPermission.status !== 'granted') {
          Alert.alert(
            'Berechtigung erforderlich',
            'Wir benötigen Zugriff auf Ihre Kamera.',
            [{ text: 'OK' }]
          );
          return;
        }

        // Launch camera
        const result = await ImagePicker.launchCameraAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsEditing: true,
          aspect: [1, 1],
          quality: 0.8,
        });

        if (!result.canceled && result.assets && result.assets.length > 0) {
          const imageUri = result.assets[0].uri;
          console.log('Camera photo captured:', imageUri);
          setUploadedImage(imageUri);
        }
      } else {
        // Original library picker code
        const permissionResult = await ImagePicker.getMediaLibraryPermissionsAsync();

        if (permissionResult.status === 'undetermined') {
          const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
          if (status !== 'granted') {
            Alert.alert(
              'Berechtigung erforderlich',
              'Wir benötigen Ihre Erlaubnis, um auf Ihre Fotos zuzugreifen.',
              [{ text: 'OK' }]
            );
            return;
          }
        } else if (permissionResult.status === 'denied') {
          Alert.alert(
            'Berechtigung erforderlich',
            'Der Zugriff auf Ihre Fotobibliothek wurde verweigert. Bitte aktivieren Sie die Berechtigung in den Einstellungen.',
            [
              { text: 'Abbrechen', style: 'cancel' },
              { text: 'Einstellungen öffnen', onPress: () => Linking.openSettings() }
            ]
          );
          return;
        } else if (permissionResult.status !== 'granted') {
          Alert.alert(
            'Berechtigung erforderlich',
            'Wir benötigen Ihre Erlaubnis, um auf Ihre Fotos zuzugreifen.',
            [{ text: 'OK' }]
          );
          return;
        }

        const result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsEditing: true,
          aspect: [1, 1],
          quality: 0.8,
        });

        if (!result.canceled && result.assets && result.assets.length > 0) {
          const imageUri = result.assets[0].uri;
          console.log('Image selected:', imageUri);
          setUploadedImage(imageUri);
        } else {
          console.log('Image selection canceled or no assets');
        }
      }
    } catch (error) {
      console.error('Error with image picker:', error);
      Alert.alert(
        'Fehler',
        'Beim Öffnen ist ein Fehler aufgetreten. Bitte versuchen Sie es erneut.\n\nBei anhaltenden Problemen helfen wir gerne unter support@manacore.ai weiter.',
        [{ text: 'OK' }]
      );
    }
  };

  const showImageSourceOptions = () => {
    Alert.alert(
      'Foto auswählen',
      'Woher möchten Sie das Foto hochladen?',
      [
        { text: 'Kamera', onPress: () => pickImage(true) },
        { text: 'Fotobibliothek', onPress: () => pickImage(false) },
        { text: 'Abbrechen', style: 'cancel' }
      ]
    );
  };

  const handleGenerateFromImage = async () => {
    // CRITICAL: Check ref first to prevent race conditions from double-taps
    // This check happens synchronously BEFORE any state updates
    if (isGeneratingRef.current) {
      console.log('[CreateCharacter] Ignoring duplicate request - generation already in progress');
      return;
    }

    Keyboard.dismiss();
    setGeneratedImages([]);

    if (!characterName) {
      Alert.alert('Fehlende Angaben', 'Bitte geben Sie einen Namen ein.');
      return;
    }

    if (!uploadedImage) {
      Alert.alert('Kein Bild ausgewählt', 'Bitte wählen Sie ein Foto aus.');
      return;
    }

    // Track character creation started
    analytics.track('character_creation_started', { method: 'photo' });

    // Set ref immediately to block duplicate requests
    isGeneratingRef.current = true;
    setLoadingContext('cuddly_toy');
    setIsLoading(true);
    const startTime = Date.now();
    try {
      // Create FormData object for file upload
      const formData = new FormData();
      
      // In React Native, we need to handle file uploads differently
      // Extract file info from the URI
      const uriParts = uploadedImage.split('.');
      const fileType = uriParts[uriParts.length - 1] || 'jpg';
      
      // Create the file object in a React Native compatible way
      // This is the format that works with most backends including NestJS
      formData.append('image', {
        uri: uploadedImage,
        name: `photo.${fileType}`,
        type: `image/${fileType}`
      } as any);
      
      console.log('Image added to form data', { 
        uri: uploadedImage,
        name: `photo.${fileType}`,
        type: `image/${fileType}`
      });
      
      // Add the character name - make sure we're using the exact field name expected by the backend
      formData.append('name', characterName || 'Unnamed Character');
      
      // Log the FormData contents for debugging
      console.log('FormData prepared with name:', characterName);
      
      // When sending FormData, do NOT manually set the Content-Type header
      // The browser/fetch will automatically set it with the correct boundary
      const response = await fetchWithAuth('/character/generate-animal-from-image', {
        method: 'POST',
        // Let fetch set the Content-Type header with the correct boundary
        body: formData
      });
      
      const result = await response.json() as GeneratedImageResponse;
      console.log('API Response:', result); // Debug log

      if (result.error) {
        console.error('API Error:', result.error);
        Alert.alert('Error', result.error + '\n\nBei anhaltenden Problemen helfen wir gerne unter support@manacore.ai weiter.');
        return;
      }

      if (!result.data?.images || !Array.isArray(result.data.images)) {
        console.error('Unexpected API response format:', result);
        Alert.alert('Error', 'Unerwartetes Antwortformat vom Server\n\nBei anhaltenden Problemen helfen wir gerne unter support@manacore.ai weiter.');
        return;
      }

      // Validate the structure of each image object
      const validImages = result.data.images.filter(img =>
        img && typeof img === 'object' &&
        'imageUrl' in img &&
        typeof img.imageUrl === 'string'
      );

      if (validImages.length === 0) {
        console.error('No valid images in response:', result);
        Alert.alert('Error', 'Keine gültigen Bilder vom Server erhalten\n\nBei anhaltenden Problemen helfen wir gerne unter support@manacore.ai weiter.');
        return;
      }
      setCharacterId(result.data.characterId);
      setGeneratedImages(validImages);

      // Track successful character generation
      analytics.track('character_generation_completed', {
        characterId: result.data.characterId,
        name: characterName,
        method: 'photo',
        duration: Date.now() - startTime,
      });
    } catch (error) {
      console.error('Error generating character from image:', error);

      // Track failed character generation
      analytics.track('character_generation_failed', {
        method: 'photo',
        error: error instanceof Error ? error.message : 'unknown_error',
        duration: Date.now() - startTime,
      });

      // Only show alert for non-credit errors (credit errors are handled globally)
      if (!isCreditError(error)) {
        showErrorAlert({
          error: error as any,
          onRetry: () => handleGenerateFromImage(),
          onDismiss: () => console.log('Error dismissed'),
        });
      }
    } finally {
      setIsLoading(false);
      // Reset ref to allow new requests
      isGeneratingRef.current = false;
    }
  };

  const handleGenerateImage = async () => {
    // CRITICAL: Check ref first to prevent race conditions from double-taps
    // This check happens synchronously BEFORE any state updates
    if (isGeneratingRef.current) {
      console.log('[CreateCharacter] Ignoring duplicate request - generation already in progress');
      return;
    }

    Keyboard.dismiss();
    setGeneratedImages([]);
    if (!characterName || !characterDescription) {
      Alert.alert('Fehlende Angaben', 'Bitte geben Sie einen Namen und eine Beschreibung ein.');
      return;
    }

    // Track character creation started and description entered
    analytics.track('character_creation_started', { method: 'description' });
    analytics.track('character_description_entered', {
      descriptionLength: characterDescription.length,
    });

    // Set ref immediately to block duplicate requests
    isGeneratingRef.current = true;
    setIsLoading(true);
    const startTime = Date.now();
    try {
      const response = await fetchWithAuth('/character/generate-animal', {
        method: 'POST',
        body: JSON.stringify({
          description: characterDescription,
          name: characterName || 'Unnamed Character'
        })
      });

      const result = await response.json() as GeneratedImageResponse;
      console.log('API Response:', result); // Debug log

      if (result.error) {
        console.error('API Error:', result.error);
        Alert.alert('Error', result.error + '\n\nBei anhaltenden Problemen helfen wir gerne unter support@manacore.ai weiter.');
        return;
      }

      if (!result.data?.images || !Array.isArray(result.data.images)) {
        console.error('Unexpected API response format:', result);
        Alert.alert('Error', 'Unerwartetes Antwortformat vom Server\n\nBei anhaltenden Problemen helfen wir gerne unter support@manacore.ai weiter.');
        return;
      }

      // Validate the structure of each image object
      const validImages = result.data.images.filter(img =>
        img && typeof img === 'object' &&
        'imageUrl' in img &&
        typeof img.imageUrl === 'string'
      );

      if (validImages.length === 0) {
        console.error('No valid images in response:', result);
        Alert.alert('Error', 'Keine gültigen Bilder vom Server erhalten\n\nBei anhaltenden Problemen helfen wir gerne unter support@manacore.ai weiter.');
        return;
      }
      setCharacterId(result.data.characterId);
      setGeneratedImages(validImages);

      // Track successful character generation
      analytics.track('character_generation_completed', {
        characterId: result.data.characterId,
        name: characterName,
        method: 'description',
        duration: Date.now() - startTime,
      });
    } catch (error) {
      console.error('Error generating character:', error);

      // Track failed character generation
      analytics.track('character_generation_failed', {
        method: 'description',
        error: error instanceof Error ? error.message : 'unknown_error',
        duration: Date.now() - startTime,
      });

      // Only show alert for non-credit errors (credit errors are handled globally)
      if (!isCreditError(error)) {
        showErrorAlert({
          error: error as any,
          onRetry: () => handleGenerateImage(),
          onDismiss: () => console.log('Error dismissed'),
        });
      }
    } finally {
      setIsLoading(false);
      // Reset ref to allow new requests
      isGeneratingRef.current = false;
    }
  };

  const handleCreateCharacter = async (selectedImage: CustomImage | null) => {
    Keyboard.dismiss();
    if (!characterName) {
      Alert.alert('Fehlende Angaben', 'Bitte geben Sie einen Namen ein.');
      return;
    }
    
    // Wenn generierte Bilder vorhanden sind, ist keine Beschreibung erforderlich
    if (generatedImages.length === 0 && !characterDescription) {
      Alert.alert('Fehlende Angaben', 'Bitte geben Sie eine Beschreibung ein.');
      return;
    }

    try {
      setIsLoading(true);
      
      const characterData = {
        characterDescriptionPrompt: selectedImage?.description,
        imageUrl: selectedImage?.imageUrl
      };
      
      await dataService.updateCharacter(characterId, characterData);
      
      posthog?.capture('character_updated_successfully', { character_id: characterId });
      router.replace('/');
    } catch (error) {
      console.error('Error creating character:', error);

      // Show error alert with retry option
      showErrorAlert({
        error: error as any,
        onRetry: () => handleCreateCharacter(selectedImage),
        onDismiss: () => console.log('Error dismissed'),
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <CommonHeader title="Neuer Charakter" />
        <View style={styles.mainContainer}>
          <KeyboardAwareScrollView
            contentContainerStyle={styles.scrollContainer}
            enableOnAndroid={true}
            enableAutomaticScroll={true}
            keyboardShouldPersistTaps="handled"
            extraScrollHeight={Platform.OS === 'ios' ? 120 : 40}
            keyboardOpeningTime={0}>
            <View style={styles.centeredWrapper}>
              <View style={styles.container}>
              {/* Premium Cuddly Toy Feature Card */}
              {generatedImages.length === 0 && activeTab === 'photo' && !uploadedImage && (
                <View style={styles.cardWrapper}>
                  <PremiumCuddlyToyCard onPress={showImageSourceOptions} />
                </View>
              )}

              {/* Character information section */}
              <View style={[styles.section, styles.firstSection]}>
                <SectionHeader
                  title="Name deines Charakters"
                  showInfo={showNameInfo}
                  onToggleInfo={() => setShowNameInfo(!showNameInfo)}
                  titleSize={sectionTitleSize}
                  iconSize={infoIconSize}
                />
                {showNameInfo && (
                  <Text style={[styles.sectionInfo, { fontSize: sectionInfoSize, lineHeight: sectionInfoSize * 1.4 }]}>
                    Gib deinem Charakter einen Namen. Der Name wird in der Geschichte und in allen Dialogen verwendet.
                  </Text>
                )}
                <View style={styles.sectionContent}>
                  {/* Character name field */}
                  <View style={{marginBottom: 16}}>
                    <View style={{ marginTop: 8}}>
                      <TextField
                        placeholder="z.B. Luna die Mondprinzessin, Max der mutige Ritter..."
                        value={characterName}
                        onChangeText={setCharacterName}
                        variant="large"
                      />
                    </View>
                  </View>

                  {/* Tab Switcher für Foto/Beschreibung */}
                  {generatedImages.length === 0 && (
                    <>
                      <TabSwitcher
                        options={[
                          { key: 'photo', label: 'Foto' },
                          { key: 'description', label: 'Beschreibung' }
                        ]}
                        activeKey={activeTab}
                        onTabChange={(key) => setActiveTab(key as 'photo' | 'description')}
                      />
                      
                      {/* Photo upload section */}
                      {activeTab === 'photo' && (
                        <View style={styles.uploadSection}>
                          <SectionHeader
                            title="Foto hochladen"
                            showInfo={showPhotoInfo}
                            onToggleInfo={() => setShowPhotoInfo(!showPhotoInfo)}
                            titleSize={sectionTitleSize}
                            iconSize={infoIconSize}
                          />
                          {showPhotoInfo && (
                            <Text style={[styles.sectionInfo, { fontSize: sectionInfoSize, lineHeight: sectionInfoSize * 1.4 }]}>
                              Lade ein Foto von einem Kuscheltier hoch, um daraus einen einzigartigen Charakter zu erstellen. Das Foto wird in einen Charakter für deine Geschichte umgewandelt. Fotos von Menschen funktionieren nicht.
                            </Text>
                          )}
                          {showPhotoInfo && (
                            <View style={styles.uploadTips}>
                              <Text style={[styles.tipText, { fontSize: tipTextSize, lineHeight: tipTextSize * 1.4 }]}>💡 Für beste Ergebnisse: gute Beleuchtung, neutraler Hintergrund</Text>
                            </View>
                          )}
                          <View style={styles.uploadContainer}>
                            {uploadedImage ? (
                              <View style={styles.previewContainer}>
                                <View style={styles.previewImageWrapper}>
                                  <Image
                                    source={{ uri: uploadedImage }}
                                    style={styles.previewImage}
                                    resizeMode="cover"
                                  />
                                  <View style={styles.previewBadge}>
                                    <MaterialCommunityIcons name="teddy-bear" size={16} color="#FFD700" />
                                    <Text style={styles.previewBadgeText}>Kuscheltier erkannt</Text>
                                  </View>
                                </View>
                                <TouchableOpacity
                                  style={styles.changeButton}
                                  onPress={showImageSourceOptions}
                                >
                                  <MaterialIcons name="photo-camera" size={18} color="#FFD700" />
                                  <Text style={styles.changeButtonText}>Anderes Foto wählen</Text>
                                </TouchableOpacity>
                              </View>
                            ) : (
                              <TouchableOpacity
                                style={styles.uploadButton}
                                onPress={showImageSourceOptions}
                              >
                                <View style={styles.uploadIconContainer}>
                                  <MaterialCommunityIcons name="teddy-bear" size={48} color="#FFD700" />
                                </View>
                                <Text style={[styles.uploadTextPrimary, { fontSize: uploadTextPrimarySize }]}>Foto hochladen</Text>
                                <Text style={[styles.uploadTextSecondary, { fontSize: uploadTextSecondarySize, lineHeight: uploadTextSecondarySize * 1.4 }]}>Mache ein Foto vom Kuscheltier deines Kindes</Text>
                              </TouchableOpacity>
                            )}
                          </View>
                          <View style={[styles.uploadButtonContainer, {marginTop: 16}]}>
                            <Button
                              title="Erstellen"
                              onPress={handleGenerateFromImage}
                              variant="primary"
                              size="lg"
                              iconName="arrow.right"
                              iconSet="sf-symbols"
                              iconPosition="right"
                              disabled={isLoading || !uploadedImage || !characterName}
                              style={{opacity: isLoading || !uploadedImage || !characterName ? 0.5 : 1}}
                            />
                          </View>
                        </View>
                      )}
                      
                      {/* Character description field */}
                      {activeTab === 'description' && (
                        <View style={{marginBottom: 8}}>
                          <SectionHeader
                            title="Beschreibung"
                            showInfo={showDescriptionInfo}
                            onToggleInfo={() => setShowDescriptionInfo(!showDescriptionInfo)}
                            titleSize={sectionTitleSize}
                            iconSize={infoIconSize}
                          />
                          {showDescriptionInfo && (
                            <Text style={[styles.sectionInfo, { fontSize: sectionInfoSize, lineHeight: sectionInfoSize * 1.4 }]}>
                              Beschreibe deinen Charakter mit eigenen Worten. Du kannst Aussehen, Persönlichkeit, Hintergrund oder besondere Fähigkeiten angeben. Die KI wird aus deiner Beschreibung einen vollständigen Charakter generieren.
                            </Text>
                          )}
                          <View style={{ marginTop: 16 }}>
                            <View style={{ marginBottom: 16 }}>
                              <TextField
                                placeholder="z.B. Ein kleiner Drache mit glitzernden blauen Schuppen, der gerne Abenteuer erlebt und immer fröhlich ist. Er trägt einen goldenen Schal und kann kleine Funken spucken..."
                                value={characterDescription}
                                onChangeText={setCharacterDescription}
                                multiline
                                variant="large"
                              />
                            </View>
                          </View>
                          
                          <Button
                            title="Erstellen"
                            onPress={handleGenerateImage}
                            variant="primary"
                            size="lg"
                            iconName="arrow.right"
                            iconSet="sf-symbols"
                            iconPosition="right"
                            disabled={!characterName || !characterDescription || isLoading}
                            style={{marginTop: 0, opacity: (!characterName || !characterDescription || isLoading) ? 0.5 : 1}}
                          />
                        </View>
                      )}
                    </>
                  )}
                </View>
              </View>
              
              {/* Generated images display section */}
              {generatedImages.length > 0 && (
                <View style={styles.characterHeader}>
                  <Text style={[styles.sectionTitle, { fontSize: sectionTitleSize }]}>Wähle dein Profilbild</Text>
                  <View style={styles.headerContainer}>
                    <View style={styles.imagesWrapper}>
                      <View style={styles.imagesContainer}>
                        <View style={styles.imageRow}>
                          {generatedImages.length > 0 && (
                            <TouchableOpacity 
                              style={[styles.imageContainer, selectedImage?.imageUrl === generatedImages[0]?.imageUrl && styles.selectedImage]}
                              onPress={() => setSelectedImage(generatedImages[0])}
                            >
                              <Image
                                source={{ uri: generatedImages[0].imageUrl }}
                                style={styles.characterImage}
                                resizeMode="cover"
                              />
                            </TouchableOpacity>
                          )}

                          {generatedImages.length > 1 && (
                            <TouchableOpacity 
                              style={[styles.imageContainer, selectedImage?.imageUrl === generatedImages[1]?.imageUrl && styles.selectedImage]}
                              onPress={() => setSelectedImage(generatedImages[1])}
                            >
                              <Image
                                source={{ uri: generatedImages[1].imageUrl }}
                                style={styles.characterImage}
                                resizeMode="cover"
                              />
                            </TouchableOpacity>
                          )}
                        </View>

                        {generatedImages.length > 2 && (
                          <TouchableOpacity 
                            style={[styles.imageContainer, selectedImage?.imageUrl === generatedImages[2]?.imageUrl && styles.selectedImage]}
                            onPress={() => setSelectedImage(generatedImages[2])}
                          >
                            <Image
                              source={{ uri: generatedImages[2].imageUrl }}
                              style={styles.characterImage}
                              resizeMode="cover"
                            />
                          </TouchableOpacity>
                        )}
                      </View>
                      <TouchableOpacity 
                        style={styles.redoButton}
                        onPress={handleGenerateImage}
                        disabled={isLoading}
                      >
                        <MaterialIcons name="refresh" size={24} color="#ffffff" />
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              )}
              </View>
            </View>
          </KeyboardAwareScrollView>
          
          {/* Create character button */}
          {selectedImage?.imageUrl && (
            <View style={styles.stickyButtonContainer}>
              <Button
                title="Charakter erstellen"
                onPress={() => handleCreateCharacter(selectedImage)}
                variant="primary"
                size="lg"
                iconName="person.badge.plus"
                iconSet="sf-symbols"
                iconPosition="right"
                style={{
                  width: '100%',
                  maxWidth: 400,
                  alignSelf: 'center',
                  opacity: !selectedImage || isLoading ? 0.5 : 1
                }}
              />
            </View>
          )}
        </View>
      </SafeAreaView>
      {isLoading && <MagicalLoadingScreen context={loadingContext} />}
    </>
  );
}

const styles = StyleSheet.create({
  uploadButtonContainer: {
    marginTop: 0,
    width: '100%',
  },
  uploadSection: {
    width: '100%',
    marginBottom: 8,
  },
  uploadContainer: {
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 16,
  },
  uploadTips: {
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
    borderRadius: 8,
    padding: 12,
    marginTop: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.2)',
  },
  tipText: {
    fontSize: 13,
    color: '#FFD700',
    lineHeight: 18,
  },
  uploadButton: {
    width: '100%',
    minHeight: 180,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#FFD700',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 215, 0, 0.05)',
    paddingVertical: 24,
    paddingHorizontal: 20,
  },
  uploadIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 215, 0, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  uploadTextPrimary: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFD700',
    marginBottom: 8,
    textAlign: 'center',
  },
  uploadTextSecondary: {
    fontSize: 14,
    color: '#CCCCCC',
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 24,
  },
  previewContainer: {
    width: '100%',
    alignItems: 'center',
  },
  previewImageWrapper: {
    width: '100%',
    position: 'relative',
    marginBottom: 16,
  },
  previewImage: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#FFD700',
  },
  previewBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.3)',
  },
  previewBadgeText: {
    color: '#FFD700',
    fontSize: 12,
    fontWeight: '600',
  },
  changeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    backgroundColor: '#333333',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.3)',
    gap: 8,
  },
  changeButtonText: {
    color: '#FFD700',
    fontSize: 15,
    fontWeight: '600',
  },
  orText: {
    textAlign: 'center',
    marginTop: 24,
    marginBottom: 0,
    fontSize: 16,
    color: '#999999',
  },
  characterHeader: {
    alignItems: 'center',
    marginBottom: 32,
    width: '100%',
  },
  headerContainer: {
    width: '100%',
    alignItems: 'center',
    maxWidth: '100%',
    paddingHorizontal: 16,
    marginTop: 32,
  },
  redoButton: {
    position: 'absolute',
    right: -12,
    bottom: -12,
    backgroundColor: '#333333',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    opacity: 0.8,
  },
  imagesWrapper: {
    position: 'relative',
    width: '100%',
    maxWidth: 600,
    alignItems: 'center',
  },
  imagesContainer: {
    flexDirection: 'column',
    alignItems: 'center',
    gap: 16,
    maxWidth: '100%',
    width: '100%',
  },
  imageRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
    flexWrap: 'wrap',
    marginBottom: 16,
  },
  imageContainer: {
    width: 150,
    height: 150,
    borderRadius: 75,
    overflow: 'hidden',
    backgroundColor: '#333333',
  },
  characterImage: {
    width: '100%',
    height: '100%',
    borderRadius: 90,
  },
  placeholderContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectedImage: {
    borderWidth: 4,
    borderColor: '#ffffff',
  },
  noImagesText: {
    color: '#ffffff',
    textAlign: 'center',
    padding: 20,
    fontSize: 16,
  },
  sectionTitle: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '600',
  },

  safeArea: {
    flex: 1,
    backgroundColor: '#1a1a1a'
  },
  scrollContainer: {
    flexGrow: 1,
    minHeight: '100%',
    paddingTop: 72,
    paddingBottom: 120,
  },
  centeredWrapper: {
    width: '100%',
    maxWidth: 1200,
    alignSelf: 'center',
  },
  mainContainer: {
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
  container: {
    padding: 20,
    alignItems: 'center',
  },
  cardWrapper: {
    width: '100%',
    maxWidth: 600,
    alignSelf: 'center',
  },
  section: {
    marginBottom: 24,
    backgroundColor: '#2a2a2a',
    borderRadius: 12,
    padding: 16,
    width: '100%',
    maxWidth: 600,
    alignSelf: 'center',
  },
  firstSection: {
    marginTop: 12
  },
  sectionHeader: {
    marginBottom: 4
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionInfo: {
    color: '#cccccc',
    marginBottom: 8,
    fontSize: 18,
    lineHeight: 26
  },
  sectionContent: {
    gap: 16
  },
  input: {
    backgroundColor: '#333333',
    borderRadius: 8,
    padding: 12,
    color: '#ffffff'
  },
  descriptionInput: {
    backgroundColor: '#333333',
    borderRadius: 8,
    padding: 12,
    color: '#ffffff',
    textAlignVertical: 'top'
  },
  button: {
    marginTop: 8
  },
  infoButton: {
    padding: 8
  },

  stickyButtonContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#1a1a1a',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#333333',
  },
  stickyButton: {
    width: '100%',
    maxWidth: 600,
    alignSelf: 'center',
  }
});
