import React, { useState, useEffect, useCallback } from 'react';
import { getAuthenticatedClient } from '~/features/auth/lib/supabaseClient';
import { router } from 'expo-router';
import { Alert, Platform, ActionSheetIOS } from 'react-native';
import { useTranslation } from 'react-i18next';
import PillFilter from '~/components/molecules/PillFilter';
import tagEvents from '~/features/tags/tagEvents';
import { useToast } from '~/features/toast/contexts/ToastContext';

interface Tag {
  id: string;
  name: string;
  style?: { color?: string; [key: string]: any };
  is_pinned?: boolean;
  sort_order?: number;
  user_id?: string;
}

interface FilterItem {
  id: string;
  label: string;
  color?: string;
  isPinned?: boolean;
}

interface PillFilterProps {
  selectedTagIds: string[];
  onTagSelect: (tagIds: string[]) => void;
}

/**
 * PillFilter component that displays user tags in a horizontal scrollable list
 */
const TagPillFilter: React.FC<PillFilterProps> = ({ onTagSelect, selectedTagIds = [] }) => {
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { t } = useTranslation();
  const { showSuccess } = useToast();

  const fetchTags = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Verwende den authentifizierten Client
      const supabase = await getAuthenticatedClient();

      if (!supabase) {
        setError('Authentifizierung fehlgeschlagen.');
        return;
      }

      const { data, error } = await supabase
        .from('tags')
        .select('id, name, style, is_pinned, sort_order')
        .eq('is_pinned', true) // Nur Tags mit is_pinned: true
        .order('sort_order', { ascending: true });

      if (error) {
        console.debug('Fehler beim Laden der Tags:', error.message);
        setError('Tags konnten nicht geladen werden.');
        return;
      }

      setTags(data || []);
    } catch (err) {
      console.debug('Unerwarteter Fehler:', err);
      setError('Ein unerwarteter Fehler ist aufgetreten.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTags();

    // Event-Listener für Tag-Änderungen einrichten
    const tagCreatedUnsubscribe = tagEvents.onTagCreated(({ tagId, tag }) => {
      console.debug('PillFilter: Tag created event received', { tagId, tag });
      // Tags neu laden wenn ein neuer Tag erstellt wurde
      fetchTags();
    });

    const tagPinnedUnsubscribe = tagEvents.onTagPinned(({ tagId, isPinned }) => {
      console.debug('PillFilter: Tag pinned event received', { tagId, isPinned });
      // Tags neu laden, um die neue Reihenfolge zu berücksichtigen
      fetchTags();
    });

    const tagOrderChangedUnsubscribe = tagEvents.onTagOrderChanged(({ reorderedTagIds }) => {
      console.debug('PillFilter: Tag order changed event received', { reorderedTagIds });
      // Tags neu laden, um die neue Reihenfolge zu berücksichtigen
      fetchTags();
    });

    // Cleanup beim Unmounten
    return () => {
      tagCreatedUnsubscribe();
      tagPinnedUnsubscribe();
      tagOrderChangedUnsubscribe();
    };
  }, [fetchTags]);

  // Konvertiere Tags in das FilterItem-Format
  const filterItems: FilterItem[] = tags.map((tag) => ({
    id: tag.id,
    label: tag.name,
    color: tag.style?.color || '#808080',
    isPinned: tag.is_pinned || false,
  }));

  const handleSelectItem = (id: string) => {
    if (id === 'all') {
      // Wenn "Alle" ausgewählt wird, leere die Auswahl
      onTagSelect([]);
    } else if (selectedTagIds.includes(id)) {
      // Wenn der Tag bereits ausgewählt ist, entferne ihn
      onTagSelect(selectedTagIds.filter((tagId) => tagId !== id));
    } else {
      // Füge den Tag zur Auswahl hinzu
      onTagSelect([...selectedTagIds, id]);
    }
  };

  // Toggle pin status for a tag
  const handleTogglePin = async (tagId: string) => {
    try {
      // Find the tag in our local state
      const tag = tags.find((t) => t.id === tagId);
      if (!tag) return;

      // Get the current pin status
      const isPinned = tag.is_pinned || false;

      // Get authenticated client
      const supabase = await getAuthenticatedClient();

      if (!supabase) {
        console.debug('Authentication failed when toggling pin status');
        return;
      }

      // Update the tag's pin status
      const { error } = await supabase
        .from('tags')
        .update({ is_pinned: !isPinned })
        .eq('id', tagId);

      if (error) {
        console.debug('Error toggling pin status:', error);
        showSuccess('Tag konnte nicht angeheftet/losgelöst werden');
        return;
      }

      // Update local state
      setTags((prevTags) =>
        prevTags.map((t) => (t.id === tagId ? { ...t, is_pinned: !isPinned } : t))
      );

      // Show success toast
      showSuccess(!isPinned ? 'Tag wurde angeheftet' : 'Tag wurde losgelöst');

      // Event emittieren für andere Komponenten
      tagEvents.emitTagPinned(tagId, !isPinned);
    } catch (err) {
      console.debug('Unexpected error toggling pin:', err);
      showSuccess('Ein Fehler ist beim Anheften/Loslösen aufgetreten');
    }
  };

  // Navigate to tags page to edit a tag
  const handleEditTag = async (tagId: string) => {
    try {
      // Find the tag in our local state
      const tag = tags.find((t) => t.id === tagId);
      if (!tag) {
        console.debug('Tag not found for editing:', tagId);
        return;
      }

      // Navigate to tags page and pass parameters to open the edit modal
      router.push({
        pathname: '/(protected)/tags',
        params: {
          editTag: 'true',
          tagId: tagId,
        },
      } as any);
    } catch (err) {
      console.debug('Error navigating to edit tag:', err);
    }
  };

  // Delete a tag with confirmation
  const handleDeleteTag = async (tagId: string) => {
    try {
      // Find the tag in our local state
      const tag = tags.find((t) => t.id === tagId);
      if (!tag) {
        console.debug('Tag not found for deletion:', tagId);
        return;
      }

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
              await deleteTag(tagId);
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
                await deleteTag(tagId);
              },
            },
          ]
        );
      }
    } catch (err) {
      console.debug('Unexpected error in handleDeleteTag:', err);
    }
  };

  // Actual tag deletion
  const deleteTag = async (tagId: string) => {
    try {
      // Get authenticated client
      const supabase = await getAuthenticatedClient();

      if (!supabase) {
        console.debug('Authentication failed when deleting tag');
        return;
      }

      // Delete the tag
      const { error } = await supabase.from('tags').delete().eq('id', tagId);

      if (error) {
        console.debug('Error deleting tag:', error);
        showSuccess('Tag konnte nicht gelöscht werden');
        return;
      }

      // Update local state
      setTags((prevTags) => prevTags.filter((t) => t.id !== tagId));

      // Show success toast
      showSuccess('Tag wurde erfolgreich gelöscht');

      // If the deleted tag was selected, remove it from selection
      if (selectedTagIds.includes(tagId)) {
        onTagSelect(selectedTagIds.filter((id) => id !== tagId));
      }
    } catch (err) {
      console.debug('Unexpected error deleting tag:', err);
      showSuccess('Ein Fehler ist beim Löschen aufgetreten');
    }
  };

  // Create a custom props object that includes only the props that PillFilter accepts
  const pillFilterProps = {
    items: filterItems,
    selectedIds: selectedTagIds,
    onSelectItem: handleSelectItem,
    isLoading: loading,
    error,
    iconName: 'pricetag-outline' as const,
    iconNavigateTo: '/(protected)/tags',
    showAllOption: true,
    allOptionLabel: 'Alle',
    iconType: 'hashtag' as const,
    enableContextMenu: true,
    onTogglePin: handleTogglePin,
    onEdit: handleEditTag,
    onDelete: handleDeleteTag,
  };

  return <PillFilter {...pillFilterProps} />;
};

export default TagPillFilter;
