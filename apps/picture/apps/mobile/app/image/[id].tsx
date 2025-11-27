import { useEffect, useState, useRef, useCallback } from 'react';
import {
  Alert,
  Dimensions,
  Share,
  Pressable,
  View,
  ActivityIndicator,
  StyleSheet,
  Platform,
} from 'react-native';
import { Image } from 'expo-image';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useAuth } from '~/contexts/AuthContext';
import { useTheme } from '~/contexts/ThemeContext';
import * as FileSystem from 'expo-file-system/legacy';
import * as MediaLibrary from 'expo-media-library';
import * as Clipboard from 'expo-clipboard';
import * as Sharing from 'expo-sharing';
import { Ionicons } from '@expo/vector-icons';
import { GestureHandlerRootView, Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  runOnJS,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import PagerView from 'react-native-pager-view';
import { useTagStore, Tag } from '~/store/tagStore';
import { useViewStore } from '~/store/viewStore';
import { Text } from '~/components/Text';
import { RemixBottomSheet } from '~/components/remix/RemixBottomSheet';
import { getThumbnailUrl } from '~/utils/image';
import { archiveImage, restoreImage } from '~/services/archiveService';
import {
  getImages,
  toggleFavorite as apiToggleFavorite,
  publishImage,
  unpublishImage,
  deleteImage as apiDeleteImage,
  getGenerationDetails as apiGetGenerationDetails,
  type Image as ApiImage,
  type GenerationDetails,
} from '~/services/api/images';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

type ImageDetails = {
  id: string;
  publicUrl: string | null;
  prompt: string;
  negativePrompt?: string;
  model: string | null;
  width: number | null;
  height: number | null;
  createdAt: string;
  isFavorite: boolean;
  isPublic: boolean;
  generationId?: string;
  userId: string;
  fileSize: number | null;
  format: string | null;
  storagePath: string;
  archivedAt?: string | null;
};

// Separate component for zoomable image to use hooks properly
function ZoomableImage({
  item,
  uiVisible,
  setUiVisible,
  onClose
}: {
  item: ImageDetails;
  uiVisible: boolean;
  setUiVisible: (visible: boolean) => void;
  onClose: () => void;
}) {
  const scale = useSharedValue(1);
  const savedScale = useSharedValue(1);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const savedTranslateX = useSharedValue(0);
  const savedTranslateY = useSharedValue(0);
  const dismissProgress = useSharedValue(0);

  // Handle long press to open share dialog with image
  const handleLongPress = async () => {
    try {
      // Check if sharing is available
      const isAvailable = await Sharing.isAvailableAsync();
      if (!isAvailable) {
        Alert.alert('Fehler', 'Teilen ist auf diesem Gerät nicht verfügbar');
        return;
      }

      // Download image to cache directory
      const fileUri = `${FileSystem.cacheDirectory}picture_share_${item.id}.jpg`;

      const downloadResult = await FileSystem.downloadAsync(item.publicUrl!, fileUri);

      if (downloadResult.status !== 200) {
        throw new Error('Download failed');
      }

      // Share the local file using expo-sharing
      await Sharing.shareAsync(downloadResult.uri, {
        mimeType: 'image/jpeg',
        dialogTitle: `Prompt: ${item.prompt}`,
      });
    } catch (error) {
      console.error('Share error:', error);
      Alert.alert('Fehler', 'Bild konnte nicht geteilt werden');
    }
  };

  const pinchGesture = Gesture.Pinch()
    .onUpdate((event) => {
      scale.value = savedScale.value * event.scale;
    })
    .onEnd(() => {
      if (scale.value < 1) {
        scale.value = withSpring(1);
        translateX.value = withSpring(0);
        translateY.value = withSpring(0);
        savedScale.value = 1;
        savedTranslateX.value = 0;
        savedTranslateY.value = 0;
      } else {
        savedScale.value = scale.value;
      }
    });

  // Vertical pan gesture for pull-to-close (only when not zoomed)
  const verticalPanGesture = Gesture.Pan()
    .activeOffsetY([-10, 10])
    .failOffsetX([-10, 10])
    .onUpdate((event) => {
      if (scale.value === 1) {
        // Only allow downward or upward drag when not zoomed
        translateY.value = event.translationY;
        // Calculate dismiss progress (0 to 1)
        dismissProgress.value = Math.min(Math.abs(event.translationY) / 200, 1);
      }
    })
    .onEnd((event) => {
      if (scale.value === 1) {
        // If dragged down more than 100px, dismiss
        if (Math.abs(event.translationY) > 100) {
          runOnJS(onClose)();
        } else {
          // Spring back to original position
          translateY.value = withSpring(0);
          dismissProgress.value = withSpring(0);
        }
      }
    });

  const doubleTap = Gesture.Tap()
    .numberOfTaps(2)
    .onEnd(() => {
      if (scale.value > 1) {
        scale.value = withSpring(1);
        translateX.value = withSpring(0);
        translateY.value = withSpring(0);
        savedScale.value = 1;
        savedTranslateX.value = 0;
        savedTranslateY.value = 0;
      } else {
        scale.value = withSpring(2);
        savedScale.value = 2;
      }
    });

  const singleTap = Gesture.Tap()
    .numberOfTaps(1)
    .onEnd(() => {
      runOnJS(setUiVisible)(!uiVisible);
    });

  const longPress = Gesture.LongPress()
    .minDuration(500)
    .onStart(() => {
      runOnJS(handleLongPress)();
    });

  // Combine gestures - vertical pan, pinch, taps and long press
  const composed = Gesture.Race(
    longPress,
    doubleTap,
    Gesture.Simultaneous(verticalPanGesture, pinchGesture, singleTap)
  );

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { scale: scale.value },
    ],
  }));

  const containerStyle = useAnimatedStyle(() => ({
    opacity: 1 - dismissProgress.value * 0.5, // Fade out as dragging
  }));

  return (
    <Animated.View style={[{ width: screenWidth, height: screenHeight, backgroundColor: '#000' }, containerStyle]}>
      <GestureDetector gesture={composed}>
        <Animated.View style={[{ flex: 1 }, animatedStyle]}>
          <Image
            source={{ uri: getThumbnailUrl(item.publicUrl, 'full') || undefined }}
            style={{ width: screenWidth, height: screenHeight }}
            contentFit="contain"
            transition={300}
            cachePolicy="memory-disk"
            placeholder={{ uri: getThumbnailUrl(item.publicUrl, 'medium') || undefined }}
          />
        </Animated.View>
      </GestureDetector>
    </Animated.View>
  );
}

export default function ImageDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const { theme } = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  // Gallery navigation state
  const [allImages, setAllImages] = useState<ImageDetails[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const pagerRef = useRef<PagerView>(null);

  const [image, setImage] = useState<ImageDetails | null>(null);
  const [generation, setGeneration] = useState<GenerationDetails | null>(null);
  // GenerationDetails type is now imported from API
  const [loading, setLoading] = useState(true);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [imageTags, setImageTags] = useState<Tag[]>([]);
  const [showRemixSheet, setShowRemixSheet] = useState(false);
  const [showInfo, setShowInfo] = useState(false);
  const [uiVisible, setUiVisible] = useState(true);

  const { fetchImageTags, getImageTags } = useTagStore();
  const { setLastViewedImageId } = useViewStore();

  // Fetch all images for gallery navigation
  useEffect(() => {
    fetchAllImages();
  }, [user]);

  // Update current image details when index changes
  useEffect(() => {
    if (allImages.length > 0 && allImages[currentIndex]) {
      const currentImage = allImages[currentIndex];

      // Load all data together to prevent layout shifts
      const loadImageData = async () => {
        setDetailsLoading(true);

        // Set image immediately
        setImage(currentImage);

        // Load generation details and tags in parallel
        await Promise.all([
          currentImage.generationId ? fetchGenerationDetails(currentImage.generationId) : Promise.resolve(),
          fetchImageTags(currentImage.id).then(() => {
            const tags = getImageTags(currentImage.id);
            setImageTags(tags);
          })
        ]);

        setDetailsLoading(false);
      };

      loadImageData();

      // Save last viewed image ID to store
      setLastViewedImageId(currentImage.id);
    }
  }, [currentIndex, allImages]);

  const fetchAllImages = async () => {
    if (!user) return;

    try {
      // Fetch all images (non-archived) via API
      // Using a large limit to get all images for gallery navigation
      const imageData = await getImages({
        page: 1,
        limit: 1000, // Large limit to get all images
        archived: false,
      });

      if (imageData && imageData.length > 0) {
        // Map API response to ImageDetails type
        const imagesWithDetails: ImageDetails[] = imageData.map(img => ({
          id: img.id,
          publicUrl: img.publicUrl || null,
          prompt: img.prompt,
          negativePrompt: img.negativePrompt,
          model: img.model || null,
          width: img.width || null,
          height: img.height || null,
          createdAt: img.createdAt,
          isFavorite: img.isFavorite,
          isPublic: img.isPublic,
          generationId: img.generationId,
          userId: img.userId,
          fileSize: img.fileSize || null,
          format: img.format || null,
          storagePath: img.storagePath,
          archivedAt: img.archivedAt,
        }));

        setAllImages(imagesWithDetails);

        // Find initial index based on the id param
        const initialIndex = imagesWithDetails.findIndex(img => img.id === id);
        if (initialIndex !== -1) {
          setCurrentIndex(initialIndex);
        }
      }
    } catch (error) {
      console.error('Error fetching all images:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchGenerationDetails = async (generationId: string) => {
    if (!generationId) return;

    try {
      const genData = await apiGetGenerationDetails(generationId);
      if (genData) {
        setGeneration(genData);
      }
    } catch (error) {
      console.error('Error fetching generation details:', error);
    }
  };

  // Handle page change for PagerView
  const onPageSelected = (e: any) => {
    const newIndex = e.nativeEvent.position;
    setCurrentIndex(newIndex);
  };

  const toggleFavorite = async () => {
    if (!image) return;

    try {
      const newFavoriteStatus = !image.isFavorite;
      await apiToggleFavorite(image.id, newFavoriteStatus);
      setImage({ ...image, isFavorite: newFavoriteStatus });
    } catch (error) {
      console.error('Error toggling favorite:', error);
    }
  };

  const togglePublic = async () => {
    if (!image) return;

    try {
      if (image.isPublic) {
        await unpublishImage(image.id);
        setImage({ ...image, isPublic: false });
      } else {
        await publishImage(image.id);
        setImage({ ...image, isPublic: true });
      }
    } catch (error) {
      console.error('Error toggling public:', error);
    }
  };

  const handleDownload = async () => {
    if (!image?.publicUrl) return;

    setDownloading(true);
    try {
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Berechtigung verweigert', 'Zugriff auf Medienbibliothek ist erforderlich');
        return;
      }

      // Use cache directory for temporary download
      const fileUri = `${FileSystem.cacheDirectory}picture_${image.id}.${image.format || 'webp'}`;
      const downloadResult = await FileSystem.downloadAsync(image.publicUrl, fileUri);

      if (downloadResult.status !== 200) throw new Error('Download fehlgeschlagen');

      const asset = await MediaLibrary.createAssetAsync(downloadResult.uri);
      await MediaLibrary.createAlbumAsync('Picture App', asset, false);

      Alert.alert('Erfolg', 'Bild wurde in deiner Galerie gespeichert!');
    } catch (error) {
      console.error('Download error:', error);
      Alert.alert('Fehler', 'Bild konnte nicht heruntergeladen werden');
    } finally {
      setDownloading(false);
    }
  };

  const handleShare = async () => {
    if (!image?.publicUrl) return;

    try {
      // Check if sharing is available
      const isAvailable = await Sharing.isAvailableAsync();
      if (!isAvailable) {
        Alert.alert('Fehler', 'Teilen ist auf diesem Gerät nicht verfügbar');
        return;
      }

      // Download image to cache directory
      const fileUri = `${FileSystem.cacheDirectory}picture_share_${image.id}.jpg`;

      const downloadResult = await FileSystem.downloadAsync(image.publicUrl, fileUri);

      if (downloadResult.status !== 200) {
        throw new Error('Download failed');
      }

      // Share the local file using expo-sharing
      await Sharing.shareAsync(downloadResult.uri, {
        mimeType: 'image/jpeg',
        dialogTitle: `Prompt: ${image.prompt}`,
      });
    } catch (error) {
      console.error('Share error:', error);
      Alert.alert('Fehler', 'Bild konnte nicht geteilt werden');
    }
  };

  const handleCopyPrompt = async () => {
    if (!image?.prompt) return;

    await Clipboard.setStringAsync(image.prompt);
    Alert.alert('✓', 'Prompt kopiert!', [{ text: 'OK' }], { cancelable: true });
  };

  const handleArchiveToggle = async () => {
    if (!image) return;

    try {
      if (image.archivedAt) {
        // Restore from archive
        await restoreImage(image.id);
        Alert.alert('✓', 'Bild wurde wiederhergestellt', [
          { text: 'OK', onPress: () => router.back() }
        ]);
      } else {
        // Archive the image
        await archiveImage(image.id);
        Alert.alert('✓', 'Bild wurde archiviert', [
          { text: 'OK', onPress: () => router.back() }
        ]);
      }
    } catch (error) {
      console.error('Archive toggle error:', error);
      Alert.alert('Fehler', 'Aktion konnte nicht durchgeführt werden');
    }
  };

  const handleDelete = () => {
    Alert.alert(
      'Bild löschen',
      'Bist du sicher, dass du dieses Bild löschen möchtest?',
      [
        { text: 'Abbrechen', style: 'cancel' },
        {
          text: 'Löschen',
          style: 'destructive',
          onPress: async () => {
            setDeleting(true);
            try {
              await apiDeleteImage(id!);

              Alert.alert('Erfolg', 'Bild wurde gelöscht', [
                { text: 'OK', onPress: () => router.back() }
              ]);
            } catch (error) {
              console.error('Delete error:', error);
              Alert.alert('Fehler', 'Bild konnte nicht gelöscht werden');
            } finally {
              setDeleting(false);
            }
          },
        },
      ]
    );
  };

  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return '-';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1048576) return Math.round(bytes / 1024) + ' KB';
    return (bytes / 1048576).toFixed(2) + ' MB';
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <GestureHandlerRootView style={{ flex: 1, backgroundColor: '#000' }}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#000' }}>
          <ActivityIndicator size="large" color="#818cf8" />
        </View>
      </GestureHandlerRootView>
    );
  }

  if (!image) {
    return (
      <GestureHandlerRootView style={{ flex: 1, backgroundColor: '#000' }}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#000' }}>
          <Text color="tertiary">Bild nicht gefunden</Text>
        </View>
      </GestureHandlerRootView>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: '#000' }}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* Horizontal Swipeable Gallery */}
      <PagerView
        ref={pagerRef}
        style={{ flex: 1, backgroundColor: '#000' }}
        initialPage={currentIndex}
        onPageSelected={onPageSelected}
      >
        {allImages.map((item) => (
          <View key={item.id} style={{ flex: 1, backgroundColor: '#000' }}>
            <ZoomableImage
              item={item}
              uiVisible={uiVisible}
              setUiVisible={setUiVisible}
              onClose={() => router.back()}
            />
          </View>
        ))}
      </PagerView>

      {/* Top Bar - Back Button & Page Indicator */}
      {uiVisible && (
        <View
          style={{
            position: 'absolute',
            top: insets.top + 8,
            left: 0,
            right: 0,
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            paddingHorizontal: 16,
          }}
        >
          <Pressable
            onPress={() => router.back()}
            style={{
              width: 40,
              height: 40,
              borderRadius: 20,
              backgroundColor: 'rgba(0,0,0,0.5)',
              justifyContent: 'center',
              alignItems: 'center',
            }}
          >
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </Pressable>

          {/* Page Indicator */}
          {allImages.length > 1 && (
            <View
              style={{
                backgroundColor: 'rgba(0,0,0,0.5)',
                paddingHorizontal: 12,
                paddingVertical: 6,
                borderRadius: 12,
              }}
            >
              <Text variant="bodySmall" style={{ color: '#fff' }}>
                {currentIndex + 1} / {allImages.length}
              </Text>
            </View>
          )}

          <View style={{ flexDirection: 'row', gap: 8 }}>
            {/* Previous Button */}
            {allImages.length > 1 && (
              <Pressable
                onPress={() => {
                  if (currentIndex > 0) {
                    pagerRef.current?.setPage(currentIndex - 1);
                  }
                }}
                disabled={currentIndex === 0}
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 20,
                  backgroundColor: 'rgba(0,0,0,0.5)',
                  justifyContent: 'center',
                  alignItems: 'center',
                  opacity: currentIndex === 0 ? 0.3 : 1,
                }}
              >
                <Ionicons name="chevron-back" size={24} color="#fff" />
              </Pressable>
            )}

            {/* Next Button */}
            {allImages.length > 1 && (
              <Pressable
                onPress={() => {
                  if (currentIndex < allImages.length - 1) {
                    pagerRef.current?.setPage(currentIndex + 1);
                  }
                }}
                disabled={currentIndex === allImages.length - 1}
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 20,
                  backgroundColor: 'rgba(0,0,0,0.5)',
                  justifyContent: 'center',
                  alignItems: 'center',
                  opacity: currentIndex === allImages.length - 1 ? 0.3 : 1,
                }}
              >
                <Ionicons name="chevron-forward" size={24} color="#fff" />
              </Pressable>
            )}

            {/* Favorite Button */}
            <Pressable
              onPress={toggleFavorite}
              style={{
                width: 40,
                height: 40,
                borderRadius: 20,
                backgroundColor: 'rgba(0,0,0,0.5)',
                justifyContent: 'center',
                alignItems: 'center',
              }}
            >
              <Ionicons
                name={image.isFavorite ? 'heart' : 'heart-outline'}
                size={24}
                color={image.isFavorite ? '#ef4444' : '#fff'}
              />
            </Pressable>
          </View>
        </View>
      )}

      {/* Bottom Action Bar */}
      {uiVisible && (
        <View
          style={{
            position: 'absolute',
            bottom: insets.bottom + 16,
            left: 16,
            right: 16,
            flexDirection: 'row',
            justifyContent: 'space-around',
            alignItems: 'center',
            backgroundColor: 'rgba(0,0,0,0.8)',
            borderRadius: 24,
            paddingVertical: 12,
            paddingHorizontal: 8,
          }}
        >
          {/* Public/Private Toggle */}
          <Pressable
            onPress={togglePublic}
            style={styles.actionButton}
          >
            <Ionicons
              name={image.isPublic ? 'globe-outline' : 'lock-closed-outline'}
              size={24}
              color="#fff"
            />
          </Pressable>

          {/* Remix */}
          <Pressable
            onPress={() => setShowRemixSheet(true)}
            style={styles.actionButton}
          >
            <Ionicons name="color-wand-outline" size={24} color="#fff" />
          </Pressable>

          {/* Share (includes save to gallery) */}
          <Pressable
            onPress={handleShare}
            style={styles.actionButton}
          >
            <Ionicons name="share-outline" size={24} color="#fff" />
          </Pressable>

          {/* More Actions */}
          <Pressable
            onPress={() => {
              Alert.alert(
                'Aktionen',
                'Was möchtest du tun?',
                [
                  {
                    text: 'Bilddetails anzeigen',
                    onPress: () => setShowInfo(true),
                  },
                  {
                    text: 'Prompt kopieren',
                    onPress: handleCopyPrompt,
                  },
                  {
                    text: image.archivedAt ? 'Wiederherstellen' : 'Archivieren',
                    onPress: handleArchiveToggle,
                  },
                  {
                    text: 'Löschen',
                    style: 'destructive',
                    onPress: handleDelete,
                  },
                  { text: 'Abbrechen', style: 'cancel' },
                ]
              );
            }}
            style={styles.actionButton}
          >
            <Ionicons name="ellipsis-horizontal" size={24} color="#fff" />
          </Pressable>
        </View>
      )}

      {/* Info Bottom Sheet */}
      {showInfo && (
        <Pressable
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.7)',
          }}
          onPress={() => setShowInfo(false)}
        >
          <Pressable
            style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              backgroundColor: theme.colors.surface,
              borderTopLeftRadius: 24,
              borderTopRightRadius: 24,
              paddingTop: 24,
              paddingBottom: insets.bottom + 24,
              paddingHorizontal: 24,
              maxHeight: screenHeight * 0.7,
            }}
            onPress={(e) => e.stopPropagation()}
          >
            {/* Handle Bar */}
            <View
              style={{
                width: 40,
                height: 4,
                backgroundColor: '#666',
                borderRadius: 2,
                alignSelf: 'center',
                marginBottom: 20,
              }}
            />

            <Text variant="h3" weight="bold" style={{ marginBottom: 16 }}>
              Bilddetails
            </Text>

            {/* Prompt */}
            <View style={{ marginBottom: 16 }}>
              <Text variant="bodySmall" color="secondary" style={{ marginBottom: 4 }}>
                Prompt
              </Text>
              <Text variant="body">{image.prompt}</Text>
            </View>

            {/* Negative Prompt */}
            {image.negativePrompt && (
              <View style={{ marginBottom: 16 }}>
                <Text variant="bodySmall" color="secondary" style={{ marginBottom: 4 }}>
                  Negativer Prompt
                </Text>
                <Text variant="body">{image.negativePrompt}</Text>
              </View>
            )}

            {/* Tags - Always show section to prevent layout shift */}
            <View style={{ marginBottom: 16, minHeight: detailsLoading ? 40 : 0 }}>
              <Text variant="bodySmall" color="secondary" style={{ marginBottom: 8 }}>
                Tags
              </Text>
              {detailsLoading ? (
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                  <View style={{ width: 60, height: 28, backgroundColor: theme.colors.border, borderRadius: 12 }} />
                  <View style={{ width: 80, height: 28, backgroundColor: theme.colors.border, borderRadius: 12 }} />
                </View>
              ) : imageTags.length > 0 ? (
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                  {imageTags.map(tag => (
                    <View
                      key={tag.id}
                      style={{
                        paddingHorizontal: 12,
                        paddingVertical: 6,
                        borderRadius: 12,
                        backgroundColor: `${tag.color || '#888888'}20`,
                      }}
                    >
                      <Text style={{ color: tag.color || '#888888', fontSize: 12 }}>
                        #{tag.name}
                      </Text>
                    </View>
                  ))}
                </View>
              ) : (
                <Text variant="bodySmall" color="tertiary">Keine Tags</Text>
              )}
            </View>

            {/* Generation Parameters */}
            <View
              style={{
                backgroundColor: theme.colors.input,
                borderRadius: 12,
                padding: 16,
                marginBottom: 16,
              }}
            >
              <Text variant="bodySmall" weight="semibold" style={{ marginBottom: 12 }}>
                Generierung
              </Text>

              <View style={{ gap: 8 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <Text variant="bodySmall" color="secondary">Modell</Text>
                  <Text variant="bodySmall">{image.model}</Text>
                </View>

                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <Text variant="bodySmall" color="secondary">Größe</Text>
                  <Text variant="bodySmall">{image.width} × {image.height}</Text>
                </View>

                {/* Always show these rows to prevent layout shift */}
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <Text variant="bodySmall" color="secondary">Steps</Text>
                  {detailsLoading ? (
                    <View style={{ width: 30, height: 12, backgroundColor: theme.colors.border, borderRadius: 4 }} />
                  ) : (
                    <Text variant="bodySmall">{generation?.steps || '-'}</Text>
                  )}
                </View>

                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <Text variant="bodySmall" color="secondary">Guidance</Text>
                  {detailsLoading ? (
                    <View style={{ width: 30, height: 12, backgroundColor: theme.colors.border, borderRadius: 4 }} />
                  ) : (
                    <Text variant="bodySmall">{generation?.guidanceScale || '-'}</Text>
                  )}
                </View>

                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <Text variant="bodySmall" color="secondary">Zeit</Text>
                  {detailsLoading ? (
                    <View style={{ width: 40, height: 12, backgroundColor: theme.colors.border, borderRadius: 4 }} />
                  ) : (
                    <Text variant="bodySmall">{generation?.generationTimeSeconds ? `${generation.generationTimeSeconds}s` : '-'}</Text>
                  )}
                </View>

                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <Text variant="bodySmall" color="secondary">Dateigröße</Text>
                  <Text variant="bodySmall">{formatFileSize(image.fileSize)}</Text>
                </View>

                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <Text variant="bodySmall" color="secondary">Erstellt</Text>
                  <Text variant="bodySmall">{formatDate(image.createdAt)}</Text>
                </View>
              </View>
            </View>

            {/* Close Button */}
            <Pressable
              onPress={() => setShowInfo(false)}
              style={{
                backgroundColor: theme.colors.primary.default,
                borderRadius: 12,
                paddingVertical: 14,
                alignItems: 'center',
              }}
            >
              <Text variant="body" weight="semibold">Schließen</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      )}

      {/* Remix Bottom Sheet */}
      {image && image.publicUrl && (
        <RemixBottomSheet
          imageUrl={image.publicUrl}
          imageId={image.id}
          originalPrompt={image.prompt}
          isOpen={showRemixSheet}
          onClose={() => setShowRemixSheet(false)}
          onSuccess={(newImageId) => {
            router.push(`/image/${newImageId}`);
          }}
        />
      )}
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  actionButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
