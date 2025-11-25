import { useState, useCallback } from 'react';
import {
  FlatList,
  RefreshControl,
  View,
  ScrollView,
  ActivityIndicator,
  Pressable,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Stack, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '~/contexts/AuthContext';
import { useTheme } from '~/contexts/ThemeContext';
import { useArchiveFetching } from '~/hooks/useArchiveFetching';
import { ImageCard } from '~/components/ImageCard';
import { EmptyState } from '~/components/EmptyState';
import { ErrorBanner } from '~/components/ErrorBanner';
import { Text } from '~/components/Text';
import { ImageItem } from '~/types/gallery';
import { FLATLIST_PERFORMANCE_PROPS } from '~/constants/gallery';
import { batchRestoreImages, batchDeleteArchivedImages } from '~/services/archiveService';

export default function ArchiveScreen() {
  const { user } = useAuth();
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const [error, setError] = useState<string | null>(null);
  const [selectedImages, setSelectedImages] = useState<Set<string>>(new Set());
  const [isSelecting, setIsSelecting] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const { pagination, loadMore, onRefresh, fetchArchivedImages } = useArchiveFetching({
    userId: user?.id,
    onError: (err) => setError('Fehler beim Laden der archivierten Bilder'),
  });

  const toggleSelection = (imageId: string) => {
    const newSelection = new Set(selectedImages);
    if (newSelection.has(imageId)) {
      newSelection.delete(imageId);
    } else {
      newSelection.add(imageId);
    }
    setSelectedImages(newSelection);
  };

  const handleSelectAll = () => {
    if (selectedImages.size === pagination.items.length) {
      setSelectedImages(new Set());
    } else {
      setSelectedImages(new Set(pagination.items.map(img => img.id)));
    }
  };

  const handleBatchRestore = async () => {
    if (selectedImages.size === 0) return;

    Alert.alert(
      'Bilder wiederherstellen',
      `${selectedImages.size} Bild(er) in die Galerie verschieben?`,
      [
        { text: 'Abbrechen', style: 'cancel' },
        {
          text: 'Wiederherstellen',
          onPress: async () => {
            setIsProcessing(true);
            try {
              await batchRestoreImages(Array.from(selectedImages));
              Alert.alert('✓', 'Bilder wurden wiederhergestellt');
              setSelectedImages(new Set());
              setIsSelecting(false);
              fetchArchivedImages(0, false);
            } catch (error) {
              console.error('Batch restore error:', error);
              Alert.alert('Fehler', 'Bilder konnten nicht wiederhergestellt werden');
            } finally {
              setIsProcessing(false);
            }
          },
        },
      ]
    );
  };

  const handleBatchDelete = async () => {
    if (selectedImages.size === 0) return;

    Alert.alert(
      'Bilder löschen',
      `${selectedImages.size} Bild(er) endgültig löschen? Diese Aktion kann nicht rückgängig gemacht werden.`,
      [
        { text: 'Abbrechen', style: 'cancel' },
        {
          text: 'Löschen',
          style: 'destructive',
          onPress: async () => {
            setIsProcessing(true);
            try {
              await batchDeleteArchivedImages(Array.from(selectedImages));
              Alert.alert('✓', 'Bilder wurden gelöscht');
              setSelectedImages(new Set());
              setIsSelecting(false);
              fetchArchivedImages(0, false);
            } catch (error) {
              console.error('Batch delete error:', error);
              Alert.alert('Fehler', 'Bilder konnten nicht gelöscht werden');
            } finally {
              setIsProcessing(false);
            }
          },
        },
      ]
    );
  };

  const renderImage = useCallback(
    ({ item }: { item: ImageItem }) => (
      <Pressable
        onPress={() => {
          if (isSelecting) {
            toggleSelection(item.id);
          } else {
            router.push(`/image/${item.id}`);
          }
        }}
        onLongPress={() => {
          if (!isSelecting) {
            setIsSelecting(true);
            toggleSelection(item.id);
          }
        }}
      >
        <View style={{ position: 'relative' }}>
          <ImageCard
            id={item.id}
            publicUrl={item.public_url}
            prompt={item.prompt}
            createdAt={item.created_at}
            isFavorite={item.is_favorite}
            model={item.model}
            tags={item.tags}
            viewMode="grid3"
            blurhash={item.blurhash}
            onToggleFavorite={() => {}}
          />
          {isSelecting && (
            <View
              style={{
                position: 'absolute',
                top: 8,
                right: 8,
                width: 28,
                height: 28,
                borderRadius: 14,
                backgroundColor: selectedImages.has(item.id)
                  ? theme.colors.primary.default
                  : 'rgba(0,0,0,0.5)',
                borderWidth: 2,
                borderColor: '#fff',
                justifyContent: 'center',
                alignItems: 'center',
              }}
            >
              {selectedImages.has(item.id) && (
                <Ionicons name="checkmark" size={16} color="#fff" />
              )}
            </View>
          )}
        </View>
      </Pressable>
    ),
    [isSelecting, selectedImages, theme]
  );

  if (pagination.loading) {
    return (
      <>
        <Stack.Screen
          options={{
            title: 'Archiv',
            headerShown: true,
            headerBackTitle: 'Zurück',
          }}
        />
        <ScrollView
          style={{ flex: 1, backgroundColor: theme.colors.background }}
          contentInsetAdjustmentBehavior="automatic"
        >
          <View style={{ padding: 20, alignItems: 'center' }}>
            <ActivityIndicator size="large" color={theme.colors.primary.default} />
          </View>
        </ScrollView>
      </>
    );
  }

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Archiv',
          headerShown: true,
          headerBackTitle: 'Zurück',
          headerRight: () =>
            pagination.items.length > 0 ? (
              <Pressable
                onPress={() => {
                  if (isSelecting) {
                    setIsSelecting(false);
                    setSelectedImages(new Set());
                  } else {
                    setIsSelecting(true);
                  }
                }}
                style={{ paddingHorizontal: 16 }}
              >
                <Text color="primary" weight="semibold">
                  {isSelecting ? 'Fertig' : 'Auswählen'}
                </Text>
              </Pressable>
            ) : null,
        }}
      />

      {error && <ErrorBanner message={error} onDismiss={() => setError(null)} />}

      {pagination.items.length === 0 ? (
        <ScrollView
          style={{ flex: 1, backgroundColor: theme.colors.background }}
          contentInsetAdjustmentBehavior="automatic"
        >
          <EmptyState
            icon="📦"
            title="Archiv ist leer"
            description="Archivierte Bilder erscheinen hier. Du kannst Bilder über das Kontext-Menü archivieren."
          />
        </ScrollView>
      ) : (
        <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
          <FlatList
            data={pagination.items}
            renderItem={renderImage}
            keyExtractor={(item) => item.id}
            numColumns={3}
            style={{ flex: 1 }}
            contentInsetAdjustmentBehavior="automatic"
            contentContainerStyle={{
              paddingTop: insets.top,
              paddingBottom: insets.bottom + (isSelecting ? 100 : 20),
            }}
            ListHeaderComponent={
              <View
                style={{
                  paddingHorizontal: 12,
                  paddingBottom: 16,
                  backgroundColor: theme.colors.surface,
                  borderBottomWidth: 1,
                  borderBottomColor: theme.colors.border,
                }}
              >
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 8,
                  }}
                >
                  <Ionicons
                    name="information-circle-outline"
                    size={20}
                    color={theme.colors.text.secondary}
                  />
                  <Text variant="bodySmall" color="secondary">
                    Archivierte Bilder werden in der Galerie ausgeblendet
                  </Text>
                </View>
              </View>
            }
            refreshControl={
              <RefreshControl refreshing={pagination.refreshing} onRefresh={onRefresh} />
            }
            onEndReached={loadMore}
            onEndReachedThreshold={0.5}
            ListFooterComponent={
              pagination.loadingMore ? (
                <View className="py-4">
                  <ActivityIndicator size="small" color={theme.colors.primary.default} />
                </View>
              ) : null
            }
            {...FLATLIST_PERFORMANCE_PROPS}
          />

          {/* Batch Actions Bar */}
          {isSelecting && (
            <View
              style={{
                position: 'absolute',
                bottom: insets.bottom,
                left: 0,
                right: 0,
                backgroundColor: theme.colors.surface,
                borderTopWidth: 1,
                borderTopColor: theme.colors.border,
                padding: 16,
                gap: 12,
              }}
            >
              {/* Selection Info */}
              <View
                style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <Text variant="body" weight="semibold">
                  {selectedImages.size} ausgewählt
                </Text>
                <Pressable onPress={handleSelectAll}>
                  <Text color="primary" weight="semibold">
                    {selectedImages.size === pagination.items.length
                      ? 'Keine auswählen'
                      : 'Alle auswählen'}
                  </Text>
                </Pressable>
              </View>

              {/* Action Buttons */}
              <View style={{ flexDirection: 'row', gap: 12 }}>
                <Pressable
                  onPress={handleBatchRestore}
                  disabled={selectedImages.size === 0 || isProcessing}
                  style={{
                    flex: 1,
                    backgroundColor:
                      selectedImages.size === 0 || isProcessing
                        ? theme.colors.input
                        : theme.colors.primary.default,
                    borderRadius: 12,
                    paddingVertical: 14,
                    alignItems: 'center',
                    flexDirection: 'row',
                    justifyContent: 'center',
                    gap: 8,
                  }}
                >
                  {isProcessing ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <>
                      <Ionicons name="arrow-undo-outline" size={20} color="#fff" />
                      <Text
                        variant="body"
                        weight="semibold"
                        style={{ color: '#fff' }}
                      >
                        Wiederherstellen
                      </Text>
                    </>
                  )}
                </Pressable>

                <Pressable
                  onPress={handleBatchDelete}
                  disabled={selectedImages.size === 0 || isProcessing}
                  style={{
                    backgroundColor:
                      selectedImages.size === 0 || isProcessing
                        ? theme.colors.input
                        : '#ef4444',
                    borderRadius: 12,
                    paddingVertical: 14,
                    paddingHorizontal: 16,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Ionicons
                    name="trash-outline"
                    size={20}
                    color={selectedImages.size === 0 || isProcessing ? theme.colors.text.tertiary : '#fff'}
                  />
                </Pressable>
              </View>
            </View>
          )}
        </View>
      )}
    </>
  );
}
