import { useState, useCallback, useEffect, useMemo } from 'react';
import { Stack, router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import {
  View,
  ActionSheetIOS,
  Platform,
  Alert,
  FlatList,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Text from '~/components/atoms/Text';
import { useTheme, useThemeUpdate } from '~/features/theme/ThemeProvider';
import colors from '~/tailwind.config.js';
import { useHeader } from '~/features/menus/HeaderContext';
import Icon from '~/components/atoms/Icon';
import { getAuthenticatedClient } from '~/features/auth/lib/supabaseClient';
import { useAuth } from '~/features/auth/contexts/AuthContext';
import Button from '~/components/atoms/Button';
import { useTranslation } from 'react-i18next';
import TagCard from '~/features/tags/components/TagCard';
import { usePageOnboarding } from '~/features/onboarding/contexts/OnboardingContext';
import tagEvents from '~/features/tags/tagEvents';
import ActionButton from '~/components/atoms/ActionButton';
import SearchOverlay from '~/components/molecules/SearchOverlay';
import TagCardSkeleton from '~/features/tags/components/TagCardSkeleton';

// Definieren der Tag-Typen
interface Tag {
  id: string;
  name: string;
  style: { color?: string; [key: string]: any };
  description?: { [key: string]: any };
  user_id: string;
  created_at: string;
  updated_at: string;
  is_pinned?: boolean;
  sort_order?: number;
}

// Die TagElement-Komponente wurde durch die TagCard-Komponente aus '~/features/tags/components/TagCard' ersetzt

// Importiere die zentrale TagModal-Komponente
import TagModal from '@/features/tags/TagModal';

export default function TagsScreen() {
  const { tw, isDark, themeVariant } = useTheme();
  const { toggleTheme } = useThemeUpdate();
  const { user } = useAuth();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingTag, setEditingTag] = useState<Tag | null>(null);

  // Search state
  const [isSearchVisible, setIsSearchVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<number[]>([]);
  const [currentSearchIndex, setCurrentSearchIndex] = useState(0);

  // Edit mode state for reordering
  const [isEditMode, setIsEditMode] = useState(false);

  // Page onboarding
  const { showPageOnboardingToast, cleanupPageToast } = usePageOnboarding();

  // Get URL parameters
  const params = useLocalSearchParams();
  const editTagParam = params.editTag as string;
  const tagIdParam = params.tagId as string;

  // Callback für Theme-Toggle
  const handleThemeToggle = useCallback(() => {
    toggleTheme();
  }, [toggleTheme]);

  // Direkter Zugriff auf die Farben aus der Tailwind-Konfiguration
  const pageBackgroundColor = isDark
    ? (colors as any).theme?.extend?.colors?.dark?.[themeVariant]?.pageBackground
    : (colors as any).theme?.extend?.colors?.[themeVariant]?.pageBackground;

  // Tags laden
  const loadTags = useCallback(async () => {
    try {
      setLoading(true);
      // Authentifizierten Client holen
      const supabase = await getAuthenticatedClient();
       
      console.debug('TagsScreen: Got authenticated client for loading tags');

      if (!supabase) {
        console.debug('Authentication failed when loading tags');
        return;
      }

      const { data, error } = await supabase
        .from('tags')
        .select('*')
        .order('is_pinned', { ascending: false })
        .order('sort_order', { ascending: true })
        .order('created_at', { ascending: false });

      if (error) {
         
        console.debug('Fehler beim Laden der Tags:', error);
        throw error;
      }

       
      console.debug('TagsScreen: Loaded tags count:', data?.length || 0);
      setTags(data || []);
    } catch (error) {
       
      console.debug('Fehler beim Laden der Tags:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Filter tags based on search query
  const filteredTags = useMemo(() => {
    if (!searchQuery.trim()) {
      return tags;
    }

    const query = searchQuery.toLowerCase();
    const filtered = tags.filter((tag) => tag.name.toLowerCase().includes(query));

    // Update search results indices
    const indices = filtered.map((tag) => tags.indexOf(tag));
    setSearchResults(indices);

    return filtered;
  }, [tags, searchQuery]);

  // Handle search
  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query);
    setCurrentSearchIndex(0);
  }, []);

  // Toggle search visibility
  const handleToggleSearch = useCallback(() => {
    setIsSearchVisible(!isSearchVisible);
    if (isSearchVisible) {
      setSearchQuery('');
      setSearchResults([]);
      setCurrentSearchIndex(0);
    }
  }, [isSearchVisible]);

  // Navigate to next search result
  const navigateToNextSearchResult = useCallback(() => {
    if (searchResults.length > 0) {
      const nextIndex = (currentSearchIndex + 1) % searchResults.length;
      setCurrentSearchIndex(nextIndex);
    }
  }, [currentSearchIndex, searchResults]);

  // Navigate to previous search result
  const navigateToPreviousSearchResult = useCallback(() => {
    if (searchResults.length > 0) {
      const prevIndex =
        currentSearchIndex === 0 ? searchResults.length - 1 : currentSearchIndex - 1;
      setCurrentSearchIndex(prevIndex);
    }
  }, [currentSearchIndex, searchResults]);

  // Tags beim ersten Laden abrufen
  useEffect(() => {
    loadTags();
  }, [loadTags]);

  // Öffne das Edit-Modal automatisch, wenn die entsprechenden Parameter übergeben werden
  useEffect(() => {
    // Wenn Tags geladen sind und die Edit-Parameter vorhanden sind
    if (!loading && tags.length > 0 && editTagParam === 'true' && tagIdParam) {
      // Finde den Tag anhand der ID
      const tagToEdit = tags.find((tag) => tag.id === tagIdParam);
      if (tagToEdit) {
        // Setze den Tag zum Bearbeiten und öffne das Modal
        setEditingTag(tagToEdit);
        setModalVisible(true);
      }
    }
  }, [loading, tags, editTagParam, tagIdParam]);

  // Tag erstellen oder aktualisieren
  const handleSaveTag = async (name: string, color: string) => {
    try {
      // Authentifizierten Client holen
      const supabase = await getAuthenticatedClient();
       
      console.debug('TagsScreen: Got authenticated client for saving tag');

      if (!supabase) {
        console.debug('Authentication failed when saving tag');
        return;
      }

      if (editingTag) {
        // Tag aktualisieren
         
        console.debug('TagsScreen: Updating tag:', editingTag.id);

        const { error } = await supabase
          .from('tags')
          .update({
            name: name,
            style: { ...editingTag.style, color },
            updated_at: new Date().toISOString(),
          })
          .eq('id', editingTag.id);

        if (error) {
           
          console.debug('Fehler beim Aktualisieren des Tags:', error);
          throw error;
        }
      } else {
        // Neuen Tag erstellen
        if (!user || !user.id) {
           
          console.debug('TagsScreen: User not authenticated');
          throw new Error('User not authenticated');
        }

         
        console.debug('TagsScreen: Creating new tag for user:', user.id);

        const { data: newTag, error } = await supabase
          .from('tags')
          .insert({
            name: name,
            style: { color },
            user_id: user.id,
          })
          .select()
          .single();

        if (error) {
           
          console.debug('Fehler beim Speichern des Tags:', error);
          throw error;
        }

        // Emit TAG_CREATED event for other components
        if (newTag) {
          tagEvents.emitTagCreated(newTag.id, newTag);
        }
      }

      // Tags neu laden
      await loadTags();

      // Modal schließen nach erfolgreichem Speichern
      setModalVisible(false);
      setEditingTag(null);
       
      console.debug('TagsScreen: Tag saved successfully, modal closed');
    } catch (error) {
       
      console.debug('Fehler beim Speichern des Tags:', error);
    }
  };

  // Tag löschen mit Bestätigung
  const handleDeleteTag = (tag: Tag) => {
    const tagName = tag.name || t('tags.unnamed', 'Unbenannt');

    // Unterschiedliche Implementierung je nach Plattform
    if (Platform.OS === 'ios') {
      // iOS ActionSheet
      ActionSheetIOS.showActionSheetWithOptions(
        {
          title: t('tags.delete_tag', 'Tag löschen'),
          message: t(
            'tags.delete_confirmation',
            'Möchtest du den Tag "{{name}}" wirklich löschen?',
            { name: tagName }
          ),
          options: [t('common.cancel', 'Abbrechen'), t('common.delete', 'Löschen')],
          destructiveButtonIndex: 1,
          cancelButtonIndex: 0,
        },
        async (buttonIndex) => {
          if (buttonIndex === 1) {
            await deleteTag(tag);
          }
        }
      );
    } else {
      // Android Alert
      Alert.alert(
        t('tags.delete_tag', 'Tag löschen'),
        t('tags.delete_confirmation', 'Möchtest du den Tag "{{name}}" wirklich löschen?', {
          name: tagName,
        }),
        [
          {
            text: t('common.cancel', 'Abbrechen'),
            style: 'cancel',
          },
          {
            text: t('common.delete', 'Löschen'),
            style: 'destructive',
            onPress: async () => {
              await deleteTag(tag);
            },
          },
        ]
      );
    }
  };

  // Tatsächliches Löschen des Tags
  const deleteTag = async (tag: Tag) => {
    try {
      // Authentifizierten Client holen
      const supabase = await getAuthenticatedClient();
       
      console.debug('TagsScreen: Got authenticated client for deleting tag');

      if (!supabase) {
        console.debug('Authentication failed when deleting tag');
        return;
      }

      const { error } = await supabase.from('tags').delete().eq('id', tag.id);

      if (error) {
         
        console.debug('Fehler beim Löschen des Tags:', error);
        throw error;
      }

      // Tags neu laden
      loadTags();
    } catch (error) {
       
      console.debug('Fehler beim Löschen des Tags:', error);
    }
  };

  // Tag bearbeiten
  const handleEditTag = (tag: Tag) => {
    setEditingTag(tag);
    setModalVisible(true);
  };

  // Tag klicken - navigiere zur Memos-Seite mit diesem Tag gefiltert
  const handleTagPress = (tag: Tag) => {
    router.push(`/(protected)/(tabs)/memos?selectedTagIds=${tag.id}`);
  };

  // Move tag up in the list
  const handleMoveUp = async (tag: Tag) => {
    const currentIndex = tags.findIndex((t) => t.id === tag.id);
    if (currentIndex <= 0) return; // Already at the top

    const newTags = [...tags];
    [newTags[currentIndex - 1], newTags[currentIndex]] = [newTags[currentIndex], newTags[currentIndex - 1]];

    setTags(newTags);
    await updateTagOrder(newTags);
  };

  // Move tag down in the list
  const handleMoveDown = async (tag: Tag) => {
    const currentIndex = tags.findIndex((t) => t.id === tag.id);
    if (currentIndex >= tags.length - 1) return; // Already at the bottom

    const newTags = [...tags];
    [newTags[currentIndex], newTags[currentIndex + 1]] = [newTags[currentIndex + 1], newTags[currentIndex]];

    setTags(newTags);
    await updateTagOrder(newTags);
  };

  // Tag anheften/losheften
  const handleTogglePin = async (tag: Tag) => {
    try {
      // Authentifizierten Client holen
      const supabase = await getAuthenticatedClient();
       
      console.debug('TagsScreen: Got authenticated client for toggling pin');

      if (!supabase) {
        console.debug('Authentication failed when toggling pin');
        return;
      }

      // Optimistic update - update local state first to maintain position
      const updatedTags = tags.map((t) =>
        t.id === tag.id
          ? { ...t, is_pinned: !t.is_pinned, updated_at: new Date().toISOString() }
          : t
      );
      setTags(updatedTags);

      const { error } = await supabase
        .from('tags')
        .update({
          is_pinned: !tag.is_pinned,
          updated_at: new Date().toISOString(),
        })
        .eq('id', tag.id);

      if (error) {
         
        console.debug('Fehler beim Anheften/Abheften des Tags:', error);
        // Revert optimistic update on error
        setTags(tags);
        throw error;
      }

      // Event emittieren für andere Komponenten
      tagEvents.emitTagPinned(tag.id, !tag.is_pinned);
    } catch (error) {
       
      console.debug('Fehler beim Anheften/Abheften des Tags:', error);
    }
  };

  // Aktualisiere die Reihenfolge der Tags in der Datenbank
  const updateTagOrder = async (reorderedTags: Tag[]) => {
    try {
      // Authentifizierten Client holen
      const supabase = await getAuthenticatedClient();
       
      console.debug('TagsScreen: Got authenticated client for updating tag order');

      if (!supabase) {
        console.debug('Authentication failed when updating tag order');
        return;
      }

       
      console.debug('TagsScreen: Updating tag order for', reorderedTags.length, 'tags');
      console.debug(
        'TagsScreen: New order:',
        reorderedTags.map((tag, index) => ({ id: tag.id, name: tag.name, newOrder: index }))
      );

      // Verwende einzelne UPDATE-Statements für jedes Tag
      for (let index = 0; index < reorderedTags.length; index++) {
        const tag = reorderedTags[index];
        const { error } = await supabase
          .from('tags')
          .update({
            sort_order: index,
            updated_at: new Date().toISOString(),
          })
          .eq('id', tag.id);

        if (error) {
           
          console.debug(
            `Fehler beim Aktualisieren von Tag ${tag.id} (${tag.name}) auf Position ${index}:`,
            error
          );
          throw error;
        }
      }

       
      console.debug('TagsScreen: Tag order updated successfully');

      // Event emittieren für andere Komponenten
      const reorderedTagIds = reorderedTags.map((tag) => tag.id);
      tagEvents.emitTagOrderChanged(reorderedTagIds);
    } catch (error) {
       
      console.debug('Fehler beim Aktualisieren der Tag-Reihenfolge:', error);
      // Revert local state on error
      await loadTags();
    }
  };

  // Modal schließen
  const handleCloseModal = () => {
    setModalVisible(false);
    setEditingTag(null);
  };

  // Neuen Tag erstellen
  const handleAddTag = () => {
    setEditingTag(null);
    setModalVisible(true);
  };

  // Header-Konfiguration mit dem useHeader-Hook aktualisieren
  const { updateConfig } = useHeader();

  // Header-Konfiguration aktualisieren, wenn die Seite fokussiert wird
  useFocusEffect(
    useCallback(() => {
       
      console.debug('Tags page focused, updating header config');

      // Erstelle eine stabile Referenz auf die Funktion, um Endlosschleifen zu vermeiden
      const addTagHandler = () => {
        setEditingTag(null);
        setModalVisible(true);
      };

      updateConfig({
        title: t('tags.title', 'Tags'),
        showBackButton: true,
        showMenu: true,
        rightIcons: [
          {
            name: isEditMode ? 'checkmark' : 'swap-vertical-outline',
            onPress: () => setIsEditMode(!isEditMode),
            color: isEditMode ? colors.primary : undefined,
          },
        ],
      });

      // Show onboarding toast for tags page
      showPageOnboardingToast('tags');

      // Header-Konfiguration zurücksetzen, wenn die Komponente unfokussiert wird
      return () => {
        // Cleanup page toast when leaving tags page
        cleanupPageToast('tags');

         
        console.debug('Tags page unfocused');
      };
    }, [isEditMode, colors.primary, t])
  );

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />

      {/* Verwende die Farben aus der Tailwind-Konfiguration */}
      <View style={{ flex: 1, backgroundColor: pageBackgroundColor }}>
        {/* Header wurde ins globale Layout verschoben */}
        <View style={{ flex: 1, paddingHorizontal: 16 }}>
          {loading ? (
            <View style={{ flex: 1, marginHorizontal: -16 }}>
              <View style={{ paddingHorizontal: 16, paddingTop: 0, paddingBottom: 120 }}>
                {/* Render skeleton cards while loading */}
                {[...Array(20)].map((_, index) => (
                  <View key={`skeleton-${index}`} style={{ opacity: Math.max(0.5, 1 - index * 0.02) }}>
                    <TagCardSkeleton />
                  </View>
                ))}
              </View>
            </View>
          ) : tags.length === 0 && !loading ? (
            <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 20 }}>
              <Icon name="pricetags-outline" size={64} color={isDark ? '#555555' : '#CCCCCC'} />
              <Text
                style={{ marginTop: 16, textAlign: 'center', fontSize: 18, fontWeight: 'bold', color: isDark ? '#AAAAAA' : '#666666' }}>
                {t('tags.empty_state', 'Du hast noch keine Tags erstellt.')}
              </Text>
              <Text
                style={{ marginBottom: 24, marginTop: 8, textAlign: 'center', fontSize: 14, color: isDark ? '#888888' : '#999999' }}>
                {t('tags.empty_state_description', 'Tags helfen dir, deine Memos zu organizieren.')}
              </Text>
              <Button title={t('tags.create_tag', 'Tag erstellen')} onPress={handleAddTag} />
            </View>
          ) : (
            <View style={{ minHeight: '100%', flex: 1, marginHorizontal: -16 }}>
              <FlatList
                data={filteredTags}
                keyExtractor={(item) => item.id}
                contentContainerStyle={{
                  paddingBottom: 120,
                  paddingHorizontal: 16,
                  paddingTop: 0,
                }}
                renderItem={({ item, index }) => (
                  <TagCard
                    tag={item}
                    onPress={handleTagPress}
                    onEdit={() => handleEditTag(item)}
                    onDelete={() => handleDeleteTag(item)}
                    onTogglePin={() => handleTogglePin(item)}
                    isDark={isDark}
                    isEditMode={isEditMode}
                    onMoveUp={() => handleMoveUp(item)}
                    onMoveDown={() => handleMoveDown(item)}
                    isFirst={index === 0}
                    isLast={index === filteredTags.length - 1}
                  />
                )}
              />
            </View>
          )}
        </View>
      </View>

      {/* Dual Floating Action Buttons */}
      {!loading && tags.length === 0 ? null : (
        <View
          style={{
            position: 'absolute',
            bottom: insets.bottom + 12,
            right: 16,
            zIndex: 1000,
            flexDirection: 'row',
            gap: 17,
          }}>
          {/* Search Button (left) */}
          <ActionButton
            iconName="search-outline"
            size={28}
            buttonSize={56}
            active={isSearchVisible}
            activeColor={
              isDark
                ? colors.theme.extend.colors.dark[themeVariant].primary
                : colors.theme.extend.colors[themeVariant].primary
            }
            onPress={handleToggleSearch}
            style={{
              borderWidth: 1,
              borderColor: isDark ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.1)',
            }}
          />

          {/* Add Button (right) */}
          <ActionButton
            iconName="add"
            size={28}
            buttonSize={56}
            active={true}
            activeColor={
              isDark
                ? colors.theme.extend.colors.dark[themeVariant].secondary
                : colors.theme.extend.colors[themeVariant].secondary
            }
            onPress={handleAddTag}
            style={{
              borderWidth: 1,
              borderColor: isDark ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.1)',
            }}
          />
        </View>
      )}

      <TagModal
        isVisible={modalVisible}
        onClose={handleCloseModal}
        onCancel={handleCloseModal}
        onSave={handleSaveTag}
        editingTag={editingTag}
        isDark={isDark}
      />

      {/* Unified Search Overlay */}
      <SearchOverlay
        isVisible={isSearchVisible}
        onSearch={handleSearch}
        onClose={handleToggleSearch}
        placeholder={t('tags.search_placeholder', 'Tags durchsuchen...')}
        currentIndex={searchResults.length > 0 ? currentSearchIndex + 1 : 0}
        totalResults={searchResults.length}
        onNext={navigateToNextSearchResult}
        onPrevious={navigateToPreviousSearchResult}
        onChange={handleSearch}
        showBackdrop={false}
      />
    </>
  );
}

// Alle StyleSheet-Definitionen wurden durch NativeWind-Klassen ersetzt
