import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { View, ScrollView, Pressable, ActivityIndicator, Animated } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '~/features/theme/ThemeProvider';
import Input from '~/components/atoms/Input';
import Icon from '~/components/atoms/Icon';
import Text from '~/components/atoms/Text';
import { formatLanguageDisplay } from '~/utils/languageDisplay';
import { useRecordingLanguage } from '~/features/audioRecordingV2';

export interface LanguageItem {
  code: string;
  nativeName: string;
  emoji: string;
  locale?: string;
  isExperimental?: boolean;
}

interface BaseLanguageSelectorProps {
  languages: Record<string, LanguageItem>;
  selectedLanguages: string[];
  onSelect: (languages: string[]) => void;
  mode?: 'single' | 'multi';
  showAutoDetect?: boolean;
  showExperimentalWarning?: boolean;
  loading?: boolean;
  placeholder?: string;
  searchPlaceholder?: string;
  height?: number;
  priorityLanguages?: string[];
  onClose?: () => void;
  autoSelectOnSingle?: boolean;
}

/**
 * Unified base component for all language selection needs.
 * Supports both single and multi-selection modes with consistent UI.
 */
const BaseLanguageSelector: React.FC<BaseLanguageSelectorProps> = ({
  languages,
  selectedLanguages,
  onSelect,
  mode = 'multi',
  showAutoDetect = false,
  showExperimentalWarning = false,
  loading = false,
  placeholder,
  searchPlaceholder,
  height = 450,
  priorityLanguages = ['de', 'en', 'fr', 'es', 'it'],
  onClose,
  autoSelectOnSingle = false,
}) => {
  const { t } = useTranslation();
  const { isDark, themeVariant } = useTheme();
  const { dialectChangeNotification, clearDialectNotification } = useRecordingLanguage();
  
  // State for search
  const [searchQuery, setSearchQuery] = useState('');
  
  // Animation value for notification
  const notificationOpacity = useState(new Animated.Value(0))[0];
  const notificationTranslateY = useState(new Animated.Value(-20))[0];

  // Get theme colors
  const getThemeColor = useCallback((colorKey: string) => {
    try {
      const colors = require('../../tailwind.config.js');
      if (isDark && colors.theme?.extend?.colors?.dark?.[themeVariant]) {
        return colors.theme.extend.colors.dark[themeVariant][colorKey];
      } else if (colors.theme?.extend?.colors?.[themeVariant]) {
        return colors.theme.extend.colors[themeVariant][colorKey];
      }
    } catch (e) {
      // Fallback colors
    }
    
    // Fallback colors
    if (isDark) {
      return {
        text: '#FFFFFF',
        contentBackground: '#1E1E1E',
        contentBackgroundHover: '#333333',
        border: '#374151',
        primary: '#f8d62b',
        secondary: 'rgba(255, 255, 255, 0.7)',
        muted: 'rgba(255, 255, 255, 0.5)',
      }[colorKey] || '#FFFFFF';
    } else {
      return {
        text: '#000000',
        contentBackground: '#FFFFFF',
        contentBackgroundHover: '#F5F5F5',
        border: '#E5E7EB',
        primary: '#f8d62b',
        secondary: 'rgba(0, 0, 0, 0.7)',
        muted: 'rgba(0, 0, 0, 0.5)',
      }[colorKey] || '#000000';
    }
  }, [isDark, themeVariant]);
  
  const themeColors = (require('../../tailwind.config.js') as any).theme?.extend?.colors as Record<string, any>;

  const textColor = getThemeColor('text');
  const hoverColor = getThemeColor('contentBackgroundHover');
  const borderColor = getThemeColor('border');
  const primaryColor = getThemeColor('primary');
  const secondaryColor = getThemeColor('secondary');
  const mutedColor = getThemeColor('muted');
  const contentBackgroundColor = getThemeColor('contentBackground');

  // Handle notification animation
  useEffect(() => {
    if (dialectChangeNotification) {
      // Animate in
      Animated.parallel([
        Animated.timing(notificationOpacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(notificationTranslateY, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      // Animate out
      Animated.parallel([
        Animated.timing(notificationOpacity, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(notificationTranslateY, {
          toValue: -20,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [dialectChangeNotification]);

  // Filter and sort languages
  const filteredLanguages = useMemo(() => {
    const entries = Object.entries(languages);
    
    // Filter based on search query
    const filtered = searchQuery.trim() 
      ? entries.filter(([code, language]) => {
          const query = searchQuery.toLowerCase();
          return (
            code.toLowerCase().includes(query) ||
            language.nativeName.toLowerCase().includes(query)
          );
        })
      : entries;
    
    // Sort languages with priority
    return filtered.sort((a, b) => {
      // "Auto" always first if enabled
      if (showAutoDetect) {
        if (a[0] === 'auto') return -1;
        if (b[0] === 'auto') return 1;
      }
      
      // Selected languages next (only in multi mode)
      if (mode === 'multi') {
        const aSelected = selectedLanguages.includes(a[0]);
        const bSelected = selectedLanguages.includes(b[0]);
        
        if (aSelected && !bSelected) return -1;
        if (!aSelected && bSelected) return 1;
      }
      
      // Priority languages
      const aPriority = priorityLanguages.indexOf(a[0]);
      const bPriority = priorityLanguages.indexOf(b[0]);
      
      if (aPriority !== -1 && bPriority !== -1) {
        return aPriority - bPriority;
      }
      if (aPriority !== -1) return -1;
      if (bPriority !== -1) return 1;
      
      // Official languages before experimental (if applicable)
      if (showExperimentalWarning) {
        const aExperimental = a[1].isExperimental || false;
        const bExperimental = b[1].isExperimental || false;
        
        if (!aExperimental && bExperimental) return -1;
        if (aExperimental && !bExperimental) return 1;
      }
      
      // Finally alphabetically by native name
      return a[1].nativeName.localeCompare(b[1].nativeName);
    });
  }, [searchQuery, languages, selectedLanguages, mode, showAutoDetect, priorityLanguages, showExperimentalWarning]);

  // Handle language selection
  const handleLanguagePress = useCallback((languageCode: string) => {
    if (mode === 'single') {
      onSelect([languageCode]);
      if (autoSelectOnSingle && onClose) {
        onClose();
      }
    } else {
      // Multi-select mode
      if (languageCode === 'auto' && showAutoDetect) {
        // If auto is selected, deselect all others
        if (selectedLanguages.includes('auto')) {
          onSelect([]);
        } else {
          onSelect(['auto']);
        }
      } else {
        // Remove auto if selecting a specific language
        const filteredSelection = selectedLanguages.filter(lang => lang !== 'auto');
        
        if (selectedLanguages.includes(languageCode)) {
          // Deselect
          onSelect(filteredSelection.filter(lang => lang !== languageCode));
        } else {
          // Select
          onSelect([...filteredSelection, languageCode]);
        }
      }
    }
  }, [mode, selectedLanguages, onSelect, showAutoDetect, autoSelectOnSingle, onClose]);

  // Handle search clear
  const handleClearSearch = useCallback(() => {
    setSearchQuery('');
  }, []);

  return (
    <View style={{ height, display: 'flex', flexDirection: 'column' }}>
      {/* In-Modal Notification */}
      {dialectChangeNotification && (
        <Animated.View
          style={{
            position: 'absolute',
            top: 10,
            left: 10,
            right: 10,
            backgroundColor: isDark
              ? themeColors?.dark?.[themeVariant]?.menuBackground || '#252525'
              : themeColors?.[themeVariant]?.menuBackground || '#DDDDDD',
            borderRadius: 16,
            padding: 16,
            opacity: notificationOpacity,
            transform: [{ translateY: notificationTranslateY }],
            zIndex: 10,
            elevation: 5,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 3.84,
          }}
        >
          {/* Icon and Title Row */}
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
            <View style={{
              backgroundColor: primaryColor,
              borderRadius: 6,
              padding: 4,
              marginRight: 8,
            }}>
              <Icon name="swap-horizontal" size={16} color={isDark ? '#000000' : '#000000'} />
            </View>
            <Text style={{ 
              color: textColor, 
              fontSize: 16,
              fontWeight: '600',
              flex: 1,
            }}>
              {t('recording.dialect_switch_title', 'Sprachvariante gewechselt')}
            </Text>
          </View>
          
          {/* Message */}
          <Text style={{ 
            color: textColor, 
            fontSize: 14,
            lineHeight: 20,
            marginLeft: 32,
          }}>
            {t('recording.dialect_switch_explanation', {
              oldDialect: dialectChangeNotification.oldDialect,
              newDialect: dialectChangeNotification.newDialect,
              defaultValue: `Die Transkription unterstützt nur eine Sprachvariante gleichzeitig. ${dialectChangeNotification.newDialect} ist jetzt aktiv, ${dialectChangeNotification.oldDialect} wurde deaktiviert.`
            })}
          </Text>
        </Animated.View>
      )}
      
      {/* Search Field - Unified Design */}
      <View style={{ 
        paddingHorizontal: 20, 
        paddingTop: 16,
        marginBottom: 16,
        position: 'relative',
      }}>
        <Input
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder={searchPlaceholder || t('common.search_language_count', { 
            count: Object.keys(languages).length, 
            defaultValue: `${Object.keys(languages).length} ${t('common.languages_search', 'Sprachen durchsuchen...')}` 
          })}
          style={{ paddingLeft: 44, paddingRight: searchQuery.length > 0 ? 44 : 16 }}
          autoCapitalize="none"
          autoCorrect={false}
          editable={!loading}
        />
        
        {/* Search Icon */}
        <View style={{
          position: 'absolute',
          left: 32,
          top: 16,
          bottom: 0,
          height: '100%',
          justifyContent: 'center',
          pointerEvents: 'none',
        }}>
          <Icon 
            name="search-outline" 
            size={20} 
            color={textColor} 
          />
        </View>
        
        {/* Clear Button */}
        {searchQuery.length > 0 && (
          <Pressable 
            style={{
              position: 'absolute',
              right: 12,
              height: '100%',
              width: 32,
              alignItems: 'center',
              justifyContent: 'center',
            }} 
            onPress={handleClearSearch}
            accessibilityLabel={t('common.clear_search', 'Suche zurücksetzen')}
            disabled={loading}
          >
            <Icon name="close" size={16} color={secondaryColor} />
          </Pressable>
        )}
      </View>
      
      {/* Language List */}
      <ScrollView style={{ flex: 1 }}>
        <View style={{ 
          gap: 8,
          paddingHorizontal: 20,
          paddingBottom: 24
        }}>
          {loading ? (
            <View style={{ 
              flex: 1, 
              justifyContent: 'center', 
              alignItems: 'center',
              paddingVertical: 40 
            }}>
              <ActivityIndicator size="large" color={primaryColor} />
            </View>
          ) : filteredLanguages.length > 0 ? (
            filteredLanguages.map(([code, language]) => {
              const isSelected = selectedLanguages.includes(code);
              const isExperimental = language.isExperimental || false;
              
              return (
                <Pressable
                  key={code}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    padding: 16,
                    backgroundColor: isSelected ? (mode === 'single' ? hoverColor : contentBackgroundColor) : 'transparent',
                    borderWidth: 1,
                    borderColor: isSelected && mode === 'multi' ? primaryColor : borderColor,
                    borderRadius: 12,
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 1 },
                    shadowOpacity: 0.1,
                    shadowRadius: 2,
                    elevation: 1,
                  }}
                  onPress={() => handleLanguagePress(code)}
                  accessibilityRole="button"
                  accessibilityLabel={`${language.nativeName} ${isSelected ? t('common.selected', 'ausgewählt') : ''}`}
                  disabled={loading}
                  android_ripple={{ 
                    color: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
                    borderless: false 
                  }}
                >
                  <Text style={{ fontSize: 20, marginRight: 16, lineHeight: 24 }}>
                    {language.emoji}
                  </Text>
                  
                  <View style={{ flex: 1 }}>
                    <Text
                      style={{
                        fontSize: 16,
                        fontWeight: isSelected ? '600' : '400',
                        color: textColor,
                      }}
                    >
                      {formatLanguageDisplay(code, language.nativeName, t)}
                      {isExperimental && showExperimentalWarning && ' ⚠️'}
                    </Text>
                    {isExperimental && showExperimentalWarning && (
                      <Text
                        style={{
                          fontSize: 12,
                          color: mutedColor,
                          marginTop: 2,
                        }}
                      >
                        {t('common.experimental', 'Experimentell')}
                      </Text>
                    )}
                  </View>
                  
                  {/* Selection Indicator */}
                  {mode === 'multi' && isSelected && (
                    <View
                      style={{
                        width: 28,
                        height: 28,
                        borderRadius: 14,
                        backgroundColor: primaryColor,
                        justifyContent: 'center',
                        alignItems: 'center',
                      }}
                    >
                      <Icon name="checkmark" size={18} color={isDark ? '#000000' : '#000000'} />
                    </View>
                  )}
                  
                  {mode === 'single' && isSelected && (
                    <Icon name="checkmark" size={20} color={primaryColor} />
                  )}
                </Pressable>
              );
            })
          ) : (
            <Text style={{ 
              padding: 16,
              textAlign: 'center',
              fontSize: 16,
              marginTop: 40,
              color: textColor
            }}>
              {t('common.no_results', 'Keine Ergebnisse gefunden')}
            </Text>
          )}
        </View>
      </ScrollView>
    </View>
  );
};

export default BaseLanguageSelector;