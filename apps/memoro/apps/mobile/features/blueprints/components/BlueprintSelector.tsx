import React, { useState, useEffect } from 'react';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import PillFilter from '~/components/molecules/PillFilter';
import { useTheme } from '~/features/theme/ThemeProvider';
import { useLanguage } from '~/features/i18n/LanguageContext';
import { getAuthenticatedClient } from '~/features/auth/lib/supabaseClient';
import {
  getActiveBlueprintsForUser,
  toggleBlueprintActive,
} from '../lib/activeBlueprintService';
import tagEvents from '~/features/tags/tagEvents';
import { STANDARD_BLUEPRINT_ID } from '../constants';

interface Blueprint {
  id: string;
  name: {
    de?: string;
    en?: string;
  };
  description?: {
    de?: string;
    en?: string;
  };
  is_public: boolean;
}

interface FilterItem {
  id: string;
  label: string;
  color?: string;
  isPinned?: boolean;
}

interface BlueprintSelectorProps {
  selectedBlueprintId: string | null;
  onSelectBlueprint: (blueprintId: string | null) => void;
}

/**
 * BlueprintSelector-Komponente
 *
 * Eine horizontal scrollbare Liste von Blueprints, aus denen der Benutzer wählen kann.
 * Zeigt öffentliche Blueprints an und ermöglicht die Auswahl eines Blueprints für die Aufnahme.
 */
const BlueprintSelector: React.FC<BlueprintSelectorProps> = ({
  selectedBlueprintId,
  onSelectBlueprint,
}) => {
  const { themeVariant } = useTheme();
  const { t } = useTranslation();
  const { currentLanguage } = useLanguage();
  const [blueprints, setBlueprints] = useState<Blueprint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeBlueprintIds, setActiveBlueprintIds] = useState<string[]>([]);

  // Fetch aktivierte Blueprints aus der Datenbank
  const fetchBlueprints = async () => {
    try {
      setLoading(true);
      setError(null);

      // Hole alle aktivierten Blueprint-IDs des Nutzers
      const activeIds = await getActiveBlueprintsForUser();
      setActiveBlueprintIds(activeIds);

      // Get authenticated client
      const supabase = await getAuthenticatedClient();

      // **WICHTIG: Ändere die Logik - zeige nur aktivierte Blueprints**
      const query = supabase
        .from('blueprints')
        .select('id, name, description, is_public')
        .order('created_at', { ascending: false });

      // Zeige nur aktivierte Blueprints an
      if (activeIds.length > 0) {
        query.in('id', activeIds);
      } else {
        // Wenn keine Blueprints aktiviert sind, zeige leere Liste
        setBlueprints([]);
        setLoading(false);
        return;
      }

      const { data, error } = await query;

      if (error) {
        console.debug('Fehler beim Laden der Blueprints:', error.message);
        setError('Blueprints konnten nicht geladen werden.');
        return;
      }

      setBlueprints(data || []);
    } catch (err) {
      console.debug('Unerwarteter Fehler:', err);
      setError('Ein unerwarteter Fehler ist aufgetreten.');
    } finally {
      setLoading(false);
    }
  };

  // Lade aktivierte Blueprints des Nutzers aus der Datenbank
  useEffect(() => {
    fetchBlueprints();

    // Event-Listener für Blueprint-Pinning-Änderungen einrichten
    const blueprintPinnedUnsubscribe = tagEvents.onBlueprintPinned(({ blueprintId, isPinned }) => {
      console.debug('BlueprintSelector: Blueprint pinned event received', {
        blueprintId,
        isPinned,
      });
      // Blueprints neu laden, um die Änderung zu berücksichtigen
      fetchBlueprints();
    });

    // Cleanup beim Unmounten
    return () => {
      blueprintPinnedUnsubscribe();
    };
  }, []);

  // Bestimme die Farben basierend auf dem Theme
  const getBlueprintColor = () => {
    if (themeVariant === 'nature') {
      return '#81C784';
    } else if (themeVariant === 'stone') {
      return '#90A4AE';
    } else if (themeVariant === 'ocean') {
      return '#4FC3F7';
    } else {
      // Lume theme
      return '#f8d62b';
    }
  };

  const themeColor = getBlueprintColor();

  // Bestimme die Sprache basierend auf der aktuellen UI-Sprache
  const lang = currentLanguage.startsWith('de') ? 'de' : 'en';

  // Konvertiere Blueprints in das FilterItem-Format
  const filterItems: FilterItem[] = blueprints.map((blueprint) => ({
    id: blueprint.id,
    label:
      blueprint.name?.[lang] ||
      blueprint.name?.en ||
      blueprint.name?.de ||
      t('blueprints.unnamed_blueprint', 'Unbenannter Modus'),
    isPinned: activeBlueprintIds.includes(blueprint.id),
  }));

  const handleSelectItem = (id: string) => {
    if (id === 'all') {
      // Use the standard blueprint ID instead of null
      onSelectBlueprint(STANDARD_BLUEPRINT_ID);
    } else {
      onSelectBlueprint(id);
    }
  };

  // Toggle blueprint active status
  const handleToggleActive = async (blueprintId: string) => {
    try {
      const isCurrentlyActive = activeBlueprintIds.includes(blueprintId);
      const success = await toggleBlueprintActive(blueprintId, !isCurrentlyActive);

      if (success) {
        // Update local state
        if (isCurrentlyActive) {
          setActiveBlueprintIds((prev) => prev.filter((id) => id !== blueprintId));
        } else {
          setActiveBlueprintIds((prev) => [...prev, blueprintId]);
        }

        // Refresh blueprints list to reflect changes
        const newActiveIds = await getActiveBlueprintsForUser();
        setActiveBlueprintIds(newActiveIds);

        // Update blueprints list by refetching
        fetchBlueprints();

        // Event emittieren für andere Komponenten
        tagEvents.emitBlueprintPinned(blueprintId, !isCurrentlyActive);
      }
    } catch (err) {
      console.debug('Error toggling blueprint active status:', err);
    }
  };

  // Navigate to blueprints page and open blueprint modal
  const handleShowBlueprintInfo = (blueprintId: string) => {
    router.push({
      pathname: '/(protected)/blueprints',
      params: {
        openModal: 'true',
        blueprintId: blueprintId,
      },
    } as any);
  };

  return (
    <PillFilter
      items={filterItems}
      selectedIds={selectedBlueprintId && selectedBlueprintId !== STANDARD_BLUEPRINT_ID ? [selectedBlueprintId] : []}
      onSelectItem={handleSelectItem}
      isLoading={loading}
      error={error}
      iconName="clipboard-outline"
      iconNavigateTo="/(protected)/blueprints"
      showAllOption={true}
      allOptionLabel={t('blueprints.standard_analysis', 'Standard')}
      iconType="plus"
      enableContextMenu={true}
      onTogglePin={handleToggleActive}
      onEdit={handleShowBlueprintInfo}
      editLabel="Info"
    />
  );
};

export default BlueprintSelector;
