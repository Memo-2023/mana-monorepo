import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { View, FlatList } from 'react-native';
import { Stack, useRouter, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '~/features/theme/ThemeProvider';
import colors from '~/tailwind.config.js';
import Text from '~/components/atoms/Text';
import Icon from '~/components/atoms/Icon';
import { useHeader } from '~/features/menus/HeaderContext';
import { getAuthenticatedClient } from '~/features/auth/lib/supabaseClient';
import { authService } from '~/features/auth/services/authService';
import PillFilter from '~/components/molecules/PillFilter';
import BlueprintCard from '~/components/organisms/BlueprintCard';
import BlueprintCardSkeleton from '~/components/organisms/BlueprintCardSkeleton';
import BlueprintModal from '~/components/organisms/BlueprintModal';
import { getActiveBlueprintsForUser } from '~/features/blueprints/lib/activeBlueprintService';
import { usePageOnboarding } from '~/features/onboarding/contexts/OnboardingContext';
import SearchOverlay from '~/components/molecules/SearchOverlay';
import ActionButton from '~/components/atoms/ActionButton';

interface Prompt {
  id: string;
  memory_title: {
    de?: string;
    en?: string;
  };
  prompt_text: {
    de?: string;
    en?: string;
  };
  sort_order?: number;
  created_at?: string;
  updated_at?: string;
  blueprint_id?: string;
}

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
  category?: Category;
  is_public: boolean;
  created_at: string;
  updated_at: string;
  user_id: string;
  prompts?: Prompt[];
}

interface Category {
  id: string;
  name: {
    de?: string;
    en?: string;
  };
  description?: {
    de?: string;
    en?: string;
  };
  style?: { color?: string; [key: string]: any };
}

interface FilterItem {
  id: string;
  label: string;
  color?: string;
}

/**
 * Blueprints-Übersichtsseite
 * 
 * Zeigt alle verfügbaren Blueprints an und ermöglicht die Navigation
 * zu den Details eines Blueprints.
 */
export default function BlueprintsPage() {
  const router = useRouter();
  const { t, i18n } = useTranslation();
  const { isDark, tw, themeVariant } = useTheme();
  const params = useLocalSearchParams<{ openModal?: string; blueprintId?: string }>();
  const insets = useSafeAreaInsets();
  
  // Page onboarding
  const { showPageOnboardingToast, cleanupPageToast } = usePageOnboarding();
  
  // Direkter Zugriff auf die Farben aus der Tailwind-Konfiguration
  const pageBackgroundColor = isDark 
    ? ((colors as any).theme?.extend?.colors?.dark)?.[themeVariant]?.pageBackground 
    : ((colors as any).theme?.extend?.colors)?.[themeVariant]?.pageBackground;
  
  const [blueprints, setBlueprints] = useState<Blueprint[]>([]);
  const [filteredBlueprints, setFilteredBlueprints] = useState<Blueprint[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Search state
  const [isSearchVisible, setIsSearchVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<number[]>([]);
  const [currentSearchIndex, setCurrentSearchIndex] = useState(0);
  const [categoriesError, setCategoriesError] = useState<string | null>(null);
  
  // Modal-Zustände
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedBlueprint, setSelectedBlueprint] = useState<Blueprint | null>(null);
  const [activeBlueprints, setActiveBlueprints] = useState<string[]>([]);

  // Lade Blueprints und aktive Blueprints beim Mounten der Komponente
  useEffect(() => {
    const fetchBlueprints = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Verwende den authentifizierten Client für alle Anfragen
        const supabase = await getAuthenticatedClient();
        
        if (!supabase) {
          console.debug('Fehler: Kein authentifizierter Supabase-Client verfügbar');
          setError(t('blueprints.error_loading', 'Blueprints konnten nicht geladen werden.'));
          setLoading(false);
          return;
        }
        
        console.debug('Versuche, öffentliche Blueprints abzurufen...');
        
        // Öffentliche Blueprints abrufen
        const { data: blueprintsData, error: blueprintsError } = await supabase
          .from('blueprints')
          .select('id, name, description, is_public, created_at, updated_at, user_id, category')
          .eq('is_public', true)
          .order('created_at', { ascending: false });
        if (blueprintsError) {
          console.debug('Fehler beim Laden der Blueprints:', blueprintsError.message);
          setError(t('blueprints.error_loading', 'Blueprints konnten nicht geladen werden.'));
          return;
        }
        
        // Verbesserte Abfrage für Blueprints mit Prompts
        const blueprintsWithPrompts: Blueprint[] = [];
        
        try {
          // Sicherstellen, dass supabase nicht null ist
          if (!supabase) {
            throw new Error('Kein authentifizierter Supabase-Client verfügbar');
          }
          
          // Zuerst alle Prompt-Links auf einmal abrufen
          const { data: allPromptLinks, error: allPromptLinksError } = await supabase
            .from('prompt_blueprints')
            .select('blueprint_id, prompt_id');
          
          console.debug('Alle Prompt-Links:', JSON.stringify(allPromptLinks, null, 2));
          
          if (allPromptLinksError) {
            console.debug('Fehler beim Laden aller Prompt-Links:', allPromptLinksError.message);
          }
          
          // Alle Prompt-IDs extrahieren
          const allPromptIds = allPromptLinks?.map(link => link.prompt_id) || [];
          
          // Alle Prompts auf einmal abrufen
          const { data: allPrompts, error: allPromptsError } = await supabase
            .from('prompts')
            .select('*')
            .in('id', allPromptIds.length > 0 ? allPromptIds : ['no-prompts-found']);
          
          console.debug('Alle Prompts:', JSON.stringify(allPrompts, null, 2));
          
          if (allPromptsError) {
            console.debug('Fehler beim Laden aller Prompts:', allPromptsError.message);
          }
          
          // Gruppiere Prompt-Links nach Blueprint-ID
          const promptLinksByBlueprintId: Record<string, string[]> = {};
          
          if (allPromptLinks) {
            for (const link of allPromptLinks) {
              if (!promptLinksByBlueprintId[link.blueprint_id]) {
                promptLinksByBlueprintId[link.blueprint_id] = [];
              }
              promptLinksByBlueprintId[link.blueprint_id].push(link.prompt_id);
            }
          }
          
          console.debug('Prompt-Links nach Blueprint-ID:', JSON.stringify(promptLinksByBlueprintId, null, 2));
          
          // Erstelle ein Lookup für Prompts nach ID
          const promptsById: Record<string, any> = {};
          
          if (allPrompts) {
            for (const prompt of allPrompts) {
              promptsById[prompt.id] = prompt;
            }
          }
          
          console.debug('Prompts nach ID:', JSON.stringify(promptsById, null, 2));
          
          // Für jeden Blueprint die zugehörigen Prompts abrufen
          for (const blueprint of blueprintsData || []) {
            try {
              const blueprintId = blueprint.id;
              console.debug(`Verarbeite Blueprint ${blueprintId} (${blueprint.name?.de || blueprint.name?.en})...`);
              
              // Prompt-IDs für diesen Blueprint abrufen
              const promptIds = promptLinksByBlueprintId[blueprintId] || [];
              console.debug(`Prompt-IDs für Blueprint ${blueprintId}:`, promptIds);
              
              // Prompts für diesen Blueprint zusammenstellen
              const promptsForBlueprint = promptIds.map(id => promptsById[id]).filter(Boolean);
              console.debug(`Prompts für Blueprint ${blueprintId}:`, JSON.stringify(promptsForBlueprint, null, 2));
              console.debug(`Anzahl der Prompts für Blueprint ${blueprintId}: ${promptsForBlueprint.length}`);
              
              if (promptsForBlueprint.length > 0) {
                console.debug('Erster Prompt:', JSON.stringify(promptsForBlueprint[0], null, 2));
                console.debug('Prompt memory_title:', JSON.stringify(promptsForBlueprint[0].memory_title));
                console.debug('Prompt prompt_text:', JSON.stringify(promptsForBlueprint[0].prompt_text));
              }
              
              // Blueprint mit Prompts hinzufügen
              blueprintsWithPrompts.push({
                ...blueprint,
                prompts: promptsForBlueprint
              });
            } catch (err) {
              console.debug(`Fehler beim Verarbeiten von Blueprint ${blueprint.id}:`, err);
              blueprintsWithPrompts.push({
                ...blueprint,
                prompts: []
              });
            }
          }
        } catch (error) {
          console.debug('Unerwarteter Fehler beim Laden der Prompts:', error);
          // Setze die gefilterten Blueprints auf die Blueprints ohne Prompts
          // So werden zumindest die Blueprints angezeigt, auch wenn die Prompts fehlen
          setFilteredBlueprints(blueprintsData || []);
          setLoading(false);
        }
        
        // Konvertiere die Daten in das richtige Format für die Anzeige
        const typedData = blueprintsWithPrompts.length > 0 ? blueprintsWithPrompts : (blueprintsData || []);
        console.debug('Gefilterte öffentliche Blueprints mit Prompts:', typedData);
          
        // Überprüfe, ob die Daten korrekt sind
        if (typedData && typedData.length > 0) {
          console.debug('Anzahl der gefundenen Blueprints:', typedData.length);
          console.debug('Erster Blueprint mit Prompts:', JSON.stringify(typedData[0], null, 2));
        } else {
          console.debug('Keine öffentlichen Blueprints gefunden');
        }
        
        setBlueprints(typedData);
        setFilteredBlueprints(typedData);
      } catch (err) {
        console.debug('Unerwarteter Fehler:', err);
        setError(t('common.unexpected_error', 'Ein unerwarteter Fehler ist aufgetreten.'));
      } finally {
        setLoading(false);
      }
    };
    
    fetchBlueprints();
  }, []);

  const loadActiveBlueprints = async () => {
    try {
      const activeBlueprintIds = await getActiveBlueprintsForUser();
      setActiveBlueprints(activeBlueprintIds);
    } catch (error) {
      console.debug('Fehler beim Laden der aktiven Blueprints:', error);
    }
  };

  useEffect(() => {
    loadActiveBlueprints();
  }, []);

  // Handle URL parameters to open modal automatically
  useEffect(() => {
    if (params.openModal === 'true' && params.blueprintId && blueprints.length > 0) {
      const blueprint = blueprints.find(b => b.id === params.blueprintId);
      if (blueprint) {
        setSelectedBlueprint(blueprint);
        setModalVisible(true);
        // Clear the URL parameters to avoid reopening on navigation back
        router.setParams({ openModal: undefined, blueprintId: undefined });
      }
    }
  }, [params.openModal, params.blueprintId, blueprints]);

  // Extrahiere Kategorien aus den geladenen Blueprints
  useEffect(() => {
    if (blueprints.length > 0) {
      setCategoriesLoading(true);
      
      // Extrahiere unique Kategorien aus den Blueprints
      const uniqueCategories = new Map<string, Category>();
      
      blueprints.forEach(blueprint => {
        if (blueprint.category && blueprint.category.id) {
          uniqueCategories.set(blueprint.category.id, blueprint.category);
        }
      });
      
      const categoriesArray = Array.from(uniqueCategories.values());
      console.debug('Extrahierte Kategorien aus Blueprints:', categoriesArray);
      
      setCategories(categoriesArray);
      setCategoriesLoading(false);
      setCategoriesError(null);
    }
  }, [blueprints]);

  // Filtere Blueprints nach Kategorien und Suchbegriff
  useEffect(() => {
    let filtered = blueprints;
    
    // Filter by category
    if (selectedCategoryIds.length > 0) {
      filtered = filtered.filter(blueprint => 
        blueprint.category?.id && selectedCategoryIds.includes(blueprint.category.id)
      );
    }
    
    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((blueprint) => {
        const name = blueprint.name[i18n.language] || blueprint.name.en || '';
        const description = blueprint.description?.[i18n.language] || blueprint.description?.en || '';
        return name.toLowerCase().includes(query) || description.toLowerCase().includes(query);
      });
      
      // Update search results indices
      const indices = filtered.map((blueprint) => blueprints.indexOf(blueprint));
      setSearchResults(indices);
    } else {
      setSearchResults([]);
    }
    
    setFilteredBlueprints(filtered);
  }, [blueprints, selectedCategoryIds, searchQuery, i18n.language]);

  // Formatiere das Datum für die Anzeige
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  // Öffne das Blueprint-Modal mit den Details
  const handleOpenModal = (blueprintId: string) => {
    const blueprint = blueprints.find(b => b.id === blueprintId);
    if (blueprint) {
      setSelectedBlueprint(blueprint);
      setModalVisible(true);
    }
  };
  
  // Schließe das Modal
  const handleCloseModal = () => {
    setModalVisible(false);
  };

  // Behandle Änderungen am Aktivierungsstatus
  const handleActiveStatusChange = useCallback((blueprintId: string, isActive: boolean) => {
    setActiveBlueprints(prev => {
      if (isActive && !prev.includes(blueprintId)) {
        return [...prev, blueprintId];
      } else if (!isActive && prev.includes(blueprintId)) {
        return prev.filter(id => id !== blueprintId);
      }
      return prev;
    });
  }, []);
  
  // Handle category selection
  const handleCategorySelect = useCallback((id: string) => {
    if (id === 'all') {
      // Wenn "Alle" ausgewählt wird, leere die Auswahl
      setSelectedCategoryIds([]);
    } else if (selectedCategoryIds.includes(id)) {
      // Wenn die Kategorie bereits ausgewählt ist, entferne sie
      setSelectedCategoryIds(selectedCategoryIds.filter(categoryId => categoryId !== id));
    } else {
      // Füge die Kategorie zur Auswahl hinzu
      setSelectedCategoryIds([...selectedCategoryIds, id]);
    }
  }, [selectedCategoryIds]);
  
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
      const prevIndex = currentSearchIndex === 0 ? searchResults.length - 1 : currentSearchIndex - 1;
      setCurrentSearchIndex(prevIndex);
    }
  }, [currentSearchIndex, searchResults]);
  
  // Globaler Status, um parallele Token-Refreshes zu verhindern
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // Effekt zum Aktualisieren der Authentifizierung, wenn die Komponente geladen wird
  useEffect(() => {
    // Verhindere mehrfache Ausführung
    let isMounted = true;
    
    const refreshAuth = async () => {
      // Wenn bereits ein Refresh läuft, nicht erneut versuchen
      if (isRefreshing) {
        console.debug('Token-Refresh läuft bereits, überspringe...');
        return;
      }
      
      try {
        setIsRefreshing(true);
        
        // Prüfe, ob der Nutzer authentifiziert ist
        const isAuth = await authService.isAuthenticated();
        console.debug('Authentifizierungsstatus:', isAuth ? 'Authentifiziert' : 'Nicht authentifiziert');
        
        if (!isAuth && isMounted) {
          // Versuche, die Authentifizierung zu aktualisieren
          const refreshToken = await authService.getRefreshToken();
          if (refreshToken) {
            console.debug('Versuche, Token zu aktualisieren...');
            try {
              const { appToken, refreshToken: newRefreshToken } = await authService.refreshTokens(refreshToken);
              await authService.updateTokens(appToken, newRefreshToken);
              console.debug('Token erfolgreich aktualisiert');
            } catch (refreshError) {
              console.debug('Fehler beim Aktualisieren des Tokens:', refreshError);
              // Navigiere zur Login-Seite, wenn der Token-Refresh fehlschlägt
              router.replace('/(auth)/login');
            }
          }
        }
      } catch (error) {
        console.debug('Fehler bei der Authentifizierungsprüfung:', error);
      } finally {
        if (isMounted) {
          setIsRefreshing(false);
        }
      }
    };
    
    refreshAuth();
    
    // Cleanup-Funktion
    return () => {
      isMounted = false;
    };
  }, [isRefreshing, router]);

  // Konvertiere Kategorien in das FilterItem-Format
  const categoryFilterItems: FilterItem[] = useMemo(() => {
    return categories.map(category => {
      // Extrahiere den Namen aus dem JSON-Objekt
      const currentLanguage = i18n.language.startsWith('de') ? 'de' : 'en';
      let label = t('blueprints.unnamed_category', 'Unbenannte Kategorie');
      if (category.name) {
        if (typeof category.name === 'string') {
          try {
            // Versuche, den Namen als JSON zu parsen, falls er als String gespeichert ist
            const nameObj = JSON.parse(category.name);
            label = nameObj[currentLanguage] || nameObj.en || nameObj.de || t('blueprints.unnamed_category', 'Unbenannte Kategorie');
          } catch (e) {
            label = category.name;
          }
        } else {
          // Name ist bereits ein Objekt
          label = category.name[currentLanguage] || category.name.en || category.name.de || t('blueprints.unnamed_category', 'Unbenannte Kategorie');
        }
      }
      
      // Extrahiere die Farbe aus dem Style-Objekt
      let color = '#808080';
      if (category.style) {
        if (typeof category.style === 'string') {
          try {
            // Versuche, den Style als JSON zu parsen, falls er als String gespeichert ist
            const styleObj = JSON.parse(category.style);
            color = styleObj.color || '#808080';
          } catch (e) {
            // Verwende Standardfarbe
          }
        } else {
          // Style ist bereits ein Objekt
          color = category.style.color || '#808080';
        }
      }
      
      return {
        id: category.id,
        label,
        color
      };
    });
  }, [categories, i18n.language, t]);

  // Rendere ein Blueprint-Element mit der BlueprintCard-Komponente
  const renderBlueprintItem = ({ item }: { item: Blueprint }) => {
    return (
      <BlueprintCard
        key={item.id}
        id={item.id}
        name={item.name}
        description={item.description}
        category={item.category}
        isPublic={item.is_public}
        createdAt={item.created_at}
        onPress={handleOpenModal}
        onActiveStatusChange={handleActiveStatusChange}
        showCategory={selectedCategoryIds.length === 0} // Show category when "All" is selected
      />
    );
  };

  const { updateConfig } = useHeader();
  
  // Header-Konfiguration aktualisieren, wenn die Seite fokussiert wird
  useFocusEffect(
    useCallback(() => {
       
      console.debug('Blueprints page focused, updating header config');
      
      // Show onboarding toast for blueprints page
      showPageOnboardingToast('blueprints');
      
      // Convert selected categories to the format expected by Header
      const selectedCategoryItems = categories
        .filter(cat => selectedCategoryIds.includes(cat.id))
        .map(cat => {
          const currentLanguage = i18n.language.startsWith('de') ? 'de' : 'en';
          let name = t('blueprints.unnamed_category', 'Unbenannte Kategorie');
          if (cat.name) {
            if (typeof cat.name === 'string') {
              try {
                const nameObj = JSON.parse(cat.name);
                name = nameObj[currentLanguage] || nameObj.en || nameObj.de || name;
              } catch (e) {
                name = cat.name;
              }
            } else {
              name = cat.name[currentLanguage] || cat.name.en || cat.name.de || name;
            }
          }
          
          let color = '#808080';
          if (cat.style) {
            if (typeof cat.style === 'string') {
              try {
                const styleObj = JSON.parse(cat.style);
                color = styleObj.color || '#808080';
              } catch (e) {
                // Use default color
              }
            } else {
              color = cat.style.color || '#808080';
            }
          }
          
          return {
            id: cat.id,
            name,
            color
          };
        });
      
      updateConfig({
        title: t('blueprints.title', 'Modi'),
        showBackButton: true,
        showMenu: true,
        rightIcons: [],
        selectedTags: selectedCategoryItems,
        onTagRemove: (categoryId: string) => {
          setSelectedCategoryIds(prev => prev.filter(id => id !== categoryId));
        }
      });
      
      // Header-Konfiguration zurücksetzen, wenn die Komponente unfokussiert wird
      return () => {
        // Cleanup page toast when leaving blueprints page
        cleanupPageToast('blueprints');
        
         
        console.debug('Blueprints page unfocused');
        
        // Clear header configuration
        updateConfig({
          selectedTags: [],
          onTagRemove: undefined
        });
      };
    }, [categories, selectedCategoryIds, i18n.language, t])
  );

  return (
    <View className="flex-1 relative" style={{ backgroundColor: pageBackgroundColor }}>
      <Stack.Screen options={{ headerShown: false }} />
      
      {loading ? (
        <View className="flex-1 px-4 pt-0 pb-20">
          {/* Render skeleton cards while loading */}
          {[...Array(5)].map((_, index) => (
            <View key={`skeleton-${index}`} style={{ opacity: Math.max(0.3, 1 - index * 0.15) }}>
              <BlueprintCardSkeleton />
            </View>
          ))}
        </View>
      ) : error ? (
        <View className="flex-1 justify-center items-center p-5">
          <Text className="text-base text-center">{error}</Text>
        </View>
      ) : filteredBlueprints.length === 0 ? (
        <View className="flex-1 justify-center items-center p-5">
          <Icon name="document-outline" size={64} color={isDark ? '#FFFFFF' : '#000000'} />
          <Text className="text-base mt-4 mb-6 text-center">{t('blueprints.no_blueprints', 'Keine Blueprints gefunden')}</Text>
        </View>
      ) : (
        <View className="flex-1 px-4 pt-0 pb-20">
          <FlatList
            data={filteredBlueprints}
            keyExtractor={(item) => item.id}
            renderItem={renderBlueprintItem}
            contentContainerStyle={{ paddingBottom: 20 }}
          />
        </View>
      )}
      
      {/* Blueprint-Modal */}
      <BlueprintModal 
        visible={modalVisible}
        onClose={handleCloseModal}
        blueprint={selectedBlueprint}
        currentLanguage={i18n.language}
      />
      
      <View className="absolute bottom-0 left-0 right-0 z-10 border-t" style={{ 
        borderTopColor: 'rgba(150, 150, 150, 0.2)', 
        backgroundColor: pageBackgroundColor
      }}>
        <PillFilter
          items={categoryFilterItems}
          selectedIds={selectedCategoryIds}
          onSelectItem={handleCategorySelect}
          isLoading={categoriesLoading}
          error={categoriesError}
          showAllOption={true}
          allOptionLabel={t('blueprints.all_categories', 'Alle')}
          bottomInset={insets.bottom}
        />
      </View>
      
      {/* Search Button */}
      {blueprints.length > 0 && !loading && (
        <View
          style={{
            position: 'absolute',
            bottom: insets.bottom + 70,
            right: 20,
            zIndex: 1000,
          }}>
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
        </View>
      )}
      
      {/* Unified Search Overlay */}
      <SearchOverlay
        isVisible={isSearchVisible}
        onSearch={handleSearch}
        onClose={handleToggleSearch}
        placeholder={t('blueprints.search_placeholder', 'Blueprints durchsuchen...')}
        currentIndex={searchResults.length > 0 ? currentSearchIndex + 1 : 0}
        totalResults={searchResults.length}
        onNext={navigateToNextSearchResult}
        onPrevious={navigateToPreviousSearchResult}
        onChange={handleSearch}
        showBackdrop={false}
      />
    </View>
  );
}

// Styles wurden durch NativeWind-Klassen ersetzt
