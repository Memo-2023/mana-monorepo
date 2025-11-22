import React, { useState, useEffect, useCallback } from 'react';
import { View, Dimensions } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '~/features/theme/ThemeProvider';
import { router } from 'expo-router';
import Text from '~/components/atoms/Text';
import Button from '~/components/atoms/Button';
import BaseModal from '~/components/atoms/BaseModal';
import { isActiveBlueprintForUser, toggleBlueprintActive } from '~/features/blueprints/lib/activeBlueprintService';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import colors from '~/tailwind.config.js';
import { STANDARD_BLUEPRINT_ID } from '~/features/blueprints/constants';

const { width, height } = Dimensions.get('window');

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
}

interface BlueprintModalProps {
  visible: boolean;
  onClose: () => void;
  blueprint: {
    id: string;
    name: {
      de?: string;
      en?: string;
    };
    description?: {
      de?: string;
      en?: string;
    };
    prompts?: Prompt[];
  } | null;
  currentLanguage: string;
}

/**
 * Modal zur Anzeige von Blueprint-Details
 * 
 * Zeigt Titel, Beschreibung und die zugehörigen Prompts eines Blueprints an
 */
const BlueprintModal: React.FC<BlueprintModalProps> = ({
  visible,
  onClose,
  blueprint,
  currentLanguage
}) => {
  const { t } = useTranslation();
  const { isDark, themeVariant } = useTheme();
  const [isActive, setIsActive] = useState<boolean>(false);
  const [isActivating, setIsActivating] = useState<boolean>(false);
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Direkter Zugriff auf die Datenbank mit dem anon key für öffentliche Daten
  // Definiere den Typ für den Supabase-Client
  const directSupabase: SupabaseClient = createClient(
    'https://npgifbrwhftlbrbaglmi.supabase.co',
    'sb_publishable_HlAZpB4BxXaMcfOCNx6VJA_-64NTxu4'
  );
  
  // Lade Prompts für den Blueprint, wenn das Modal geöffnet wird
  useEffect(() => {
    if (visible && blueprint) {
      loadPrompts();
    }
  }, [visible, blueprint?.id]);
  
  // Lade Prompts für den aktuellen Blueprint
  const loadPrompts = async () => {
    if (!blueprint) return;
    
    try {
      setLoading(true);
      setError(null);
      
      // Zuerst die Prompt-IDs abrufen
      const { data: promptLinks, error: promptLinksError } = await directSupabase
        .from('prompt_blueprints')
        .select('prompt_id')
        .eq('blueprint_id', blueprint.id);
      
      if (promptLinksError) {
        setError(t('blueprints.error_loading_prompts', 'Fehler beim Laden der Prompts'));
        setPrompts([]);
        return;
      }
      
      if (!promptLinks || promptLinks.length === 0) {
        setPrompts([]);
        return;
      }
      
      // Prompt-IDs extrahieren
      const promptIds = promptLinks.map((link: { prompt_id: string }) => link.prompt_id);
      
      // Versuche die RPC-Funktion für die Prompts
      const { data: promptsData, error: promptsError } = await directSupabase
        .rpc('get_prompts_by_ids', { prompt_ids: promptIds });
      
      // Wenn die RPC-Funktion nicht existiert, versuche eine alternative Abfrage
      if (promptsError) {
        // Einzelne Abfragen für jeden Prompt-ID
        const prompts = [];
        for (const id of promptIds) {
          const { data, error } = await directSupabase
            .from('prompts')
            .select('*')
            .eq('id', id);
          
          if (data && data.length > 0) {
            prompts.push(data[0]);
          }
        }
        
        // Sort prompts using the same logic as memories: first by sort_order ascending, then by created_at descending
        const sortedPrompts = prompts.sort((a, b) => {
          // First sort by sort_order (ascending)
          if (a.sort_order !== undefined && b.sort_order !== undefined) {
            if (a.sort_order !== b.sort_order) {
              return a.sort_order - b.sort_order;
            }
          } else if (a.sort_order !== undefined) {
            return -1; // a has sort_order, b doesn't, so a comes first
          } else if (b.sort_order !== undefined) {
            return 1; // b has sort_order, a doesn't, so b comes first
          }
          
          // Then sort by created_at (descending - newest first)
          if (a.created_at && b.created_at) {
            return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
          }
          
          return 0;
        });
        
        // Verwende die manuell gesammelten und sortierten Prompts
        if (sortedPrompts.length > 0) {
          return setPrompts(sortedPrompts);
        }
      }
      
      if (promptsError) {
        setError(t('blueprints.error_loading_prompts', 'Fehler beim Laden der Prompts'));
        setPrompts([]);
        return;
      }
      
      if (!promptsData || promptsData.length === 0) {
        setPrompts([]);
        return;
      }
      
      // Sort prompts using the same logic as memories: first by sort_order ascending, then by created_at descending
      const sortedPromptsData = [...promptsData].sort((a, b) => {
        // First sort by sort_order (ascending)
        if (a.sort_order !== undefined && b.sort_order !== undefined) {
          if (a.sort_order !== b.sort_order) {
            return a.sort_order - b.sort_order;
          }
        } else if (a.sort_order !== undefined) {
          return -1; // a has sort_order, b doesn't, so a comes first
        } else if (b.sort_order !== undefined) {
          return 1; // b has sort_order, a doesn't, so b comes first
        }
        
        // Then sort by created_at (descending - newest first)
        if (a.created_at && b.created_at) {
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        }
        
        return 0;
      });
      
      setPrompts(sortedPromptsData);
    } catch (err: any) {
      setError(t('common.unexpected_error', 'Ein unerwarteter Fehler ist aufgetreten'));
      setPrompts([]);
    } finally {
      setLoading(false);
    }
  };
  
  // Lade den Aktivierungsstatus, wenn das Modal geöffnet wird
  useEffect(() => {
    if (visible && blueprint?.id) {
      const loadActiveStatus = async () => {
        try {
          const active = await isActiveBlueprintForUser(blueprint.id);
          setIsActive(active);
        } catch (error) {
          console.debug('Fehler beim Laden des Aktivierungsstatus:', error);
        }
      };
      
      loadActiveStatus();
    }
  }, [visible, blueprint?.id]);
  
  // Funktion zum Umschalten des Aktivierungsstatus
  const handleToggleActive = useCallback(async () => {
    if (!blueprint?.id) return;
    
    try {
      setIsActivating(true);
      const newStatus = !isActive;
      const success = await toggleBlueprintActive(blueprint.id, newStatus);
      
      if (success) {
        setIsActive(newStatus);
      }
    } catch (error) {
      console.debug('Fehler beim Umschalten des Aktivierungsstatus:', error);
    } finally {
      setIsActivating(false);
    }
  }, [blueprint?.id, isActive]);
  
  // Handler für den Aufnehmen-Button
  const handleStartRecording = useCallback(async () => {
    if (!blueprint?.id) return;
    
    try {
      // Speichere die Blueprint-ID im AsyncStorage für die Homepage
      await AsyncStorage.setItem('selectedBlueprintId', blueprint.id);
      
      // Schließe das Modal
      onClose();
      
      // Navigiere zur Homepage
      router.push('/(protected)/(tabs)/');
      
      console.debug('Navigiere zur Homepage mit Blueprint:', blueprint.id);
    } catch (error) {
      console.debug('Fehler beim Speichern der Blueprint-ID:', error);
    }
  }, [blueprint?.id, onClose]);
  
  // Fallback auf Englisch, wenn die aktuelle Sprache nicht verfügbar ist
  const lang = currentLanguage.startsWith('de') ? 'de' : 'en';
  
  // Extrahiere die lokalisierten Werte
  const displayName = blueprint?.name?.[lang] || blueprint?.name?.en || blueprint?.name?.de || '';
  const displayDescription = blueprint?.description?.[lang] || blueprint?.description?.en || blueprint?.description?.de || '';
  
  // Hintergrundfarben basierend auf dem Theme
  const backgroundColor = isDark ? '#1A1A1A' : '#F5F5F5';
  const textColor = isDark ? '#FFFFFF' : '#000000';
  const secondaryTextColor = isDark ? '#CCCCCC' : '#666666';
  
  if (!blueprint) return null;
  
  // Benutzerdefinierter Footer für das Modal
  const customFooter = (
    <View className='w-full'>
      <Button
        title={t('blueprints.record', 'Aufnehmen')}
        iconName="mic-outline"
        variant="primary"
        onPress={handleStartRecording}
        style={{ width: '100%' }}
      />
      <View className='h-3' />
      <Button
        title={isActive ? t('blueprints.unpin', 'Entpinnen') : t('blueprints.pin', 'Anpinnen')}
        iconName={isActive ? 'pin' : 'pin-outline'}
        variant={isActive ? 'primary' : 'secondary'}
        onPress={handleToggleActive}
        disabled={isActivating || blueprint?.id === STANDARD_BLUEPRINT_ID}
        loading={isActivating}
        style={{ width: '100%', opacity: blueprint?.id === STANDARD_BLUEPRINT_ID ? 0.5 : 1 }}
      />
    </View>
  );

  return (
    <BaseModal
      isVisible={visible}
      onClose={onClose}
      title={`${t('blueprints.template_prefix', 'Vorlage:')} ${displayName}`}
      animationType='fade'
      footerContent={customFooter}
    >
      <View className='w-full'>
        <View className='mb-4'>
          <Text className={`text-base ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            {displayDescription}
          </Text>
        </View>
        
        <View className='w-full'>
          <Text className={`text-lg font-bold mb-3 ${isDark ? 'text-white' : 'text-gray-900'}`}>
            {t('blueprints.prompts', 'Prompts')}
          </Text>
          
          <View style={{ minHeight: 200 }}>
            {loading ? (
            <View className='space-y-3'>
              {/* Skeleton Loader für 3 Prompts */}
              {[1, 2, 3].map((index) => (
                <View 
                  key={index}
                  className={`p-3 rounded-lg ${isDark ? 'bg-gray-800' : 'bg-gray-100'}`}
                >
                  {/* Skeleton für Titel */}
                  <View 
                    className={`h-4 rounded mb-2 ${isDark ? 'bg-gray-700' : 'bg-gray-300'}`}
                    style={{ width: `${60 + (index * 15)}%` }}
                  />
                  {/* Skeleton für Text - 2 Zeilen */}
                  <View 
                    className={`h-3 rounded mb-1 ${isDark ? 'bg-gray-700' : 'bg-gray-300'}`}
                    style={{ width: '100%' }}
                  />
                  <View 
                    className={`h-3 rounded ${isDark ? 'bg-gray-700' : 'bg-gray-300'}`}
                    style={{ width: `${70 + (index * 10)}%` }}
                  />
                </View>
              ))}
            </View>
          ) : error ? (
            <View className='py-4'>
              <Text className='text-red-500'>
                {error}
              </Text>
            </View>
          ) : prompts.length === 0 ? (
            <View className='py-4'>
              <Text className={`${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                {t('blueprints.no_prompts_available', 'Keine Prompts für diesen Blueprint verfügbar.')}
              </Text>
            </View>
          ) : (
            <View>
              {prompts.map((prompt, index) => {
                // Get theme colors
                const backgroundColor = isDark 
                  ? ((colors as any).theme?.extend?.colors?.dark)?.[themeVariant]?.contentBackgroundHover || '#2D2D2D'
                  : ((colors as any).theme?.extend?.colors)?.[themeVariant]?.contentBackgroundHover || '#F8F9FA';
                
                const borderColor = isDark
                  ? ((colors as any).theme?.extend?.colors?.dark)?.[themeVariant]?.border || '#374151'
                  : ((colors as any).theme?.extend?.colors)?.[themeVariant]?.border || '#E5E7EB';
                
                return (
                  <View 
                    key={prompt.id} 
                    style={{
                      backgroundColor,
                      borderWidth: 1,
                      borderColor,
                      borderRadius: 12,
                      marginBottom: 12,
                      padding: 16,
                      shadowColor: '#000',
                      shadowOffset: { width: 0, height: 1 },
                      shadowOpacity: isDark ? 0.3 : 0.1,
                      shadowRadius: 2,
                      elevation: 2,
                    }}
                  >
                    {/* Content */}
                    <View style={{ flex: 1 }}>
                      <Text 
                        style={{
                          fontSize: 16,
                          fontWeight: '600',
                          color: isDark ? '#FFFFFF' : '#111827',
                          marginBottom: 4,
                          lineHeight: 20,
                        }}
                      >
                        {prompt.memory_title?.[lang] || prompt.memory_title?.en || prompt.memory_title?.de || t('blueprints.unnamed_prompt', 'Unbenannter Prompt')}
                      </Text>
                      <Text 
                        style={{
                          fontSize: 14,
                          color: isDark ? '#D1D5DB' : '#6B7280',
                          lineHeight: 18,
                        }}
                        numberOfLines={2}
                        ellipsizeMode="tail"
                      >
                        {prompt.prompt_text?.[lang] || prompt.prompt_text?.en || prompt.prompt_text?.de || ''}
                      </Text>
                    </View>
                  </View>
                );
              })}
            </View>
          )}
          </View>
        </View>
      </View>
    </BaseModal>
  );
};

export default BlueprintModal;
