import React, { useState, useEffect } from 'react';
import { Pressable, View, StyleSheet, ActivityIndicator } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '~/features/theme/ThemeProvider';
import Text from '~/components/atoms/Text';
import Icon from '~/components/atoms/Icon';
import { isActiveBlueprintForUser, toggleBlueprintActive } from '~/features/blueprints/lib/activeBlueprintService';
import tagEvents from '~/features/tags/tagEvents';
import colors from '~/tailwind.config.js';
import { STANDARD_BLUEPRINT_ID } from '~/features/blueprints/constants';

interface BlueprintCardProps {
  id: string;
  name: {
    de?: string;
    en?: string;
  };
  description?: {
    de?: string;
    en?: string;
  };
  category?: {
    id: string;
    name: {
      de?: string;
      en?: string;
    } | string;
    style?: { color?: string; [key: string]: any } | string;
  };
  isPublic: boolean;
  createdAt: string;
  onPress: (id: string) => void;
  onActiveStatusChange?: (id: string, isActive: boolean) => void;
  showCategory?: boolean;
}

/**
 * BlueprintCard displays a blueprint item with name, description, and metadata
 * in a styled card format with proper localization support
 */
const BlueprintCard = ({ 
  id, 
  name, 
  description, 
  category,
  isPublic, 
  createdAt, 
  onPress,
  onActiveStatusChange,
  showCategory = false
}: BlueprintCardProps) => {
  const { i18n } = useTranslation();
  const { isDark, themeVariant } = useTheme();
  
  const [isActive, setIsActive] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  
  const currentLanguage = i18n.language.startsWith('de') ? 'de' : 'en';
  const displayName = name?.[currentLanguage] || name?.en || name?.de || 'Unnamed Blueprint';
  const displayDescription = description?.[currentLanguage] || description?.en || description?.de || '';
  
  // Get category display name and color
  let categoryName = '';
  let categoryColor = '#808080';
  
  if (category) {
    // Parse category name
    if (category.name) {
      if (typeof category.name === 'string') {
        try {
          const nameObj = JSON.parse(category.name);
          categoryName = nameObj[currentLanguage] || nameObj.en || nameObj.de || '';
        } catch (e) {
          categoryName = category.name;
        }
      } else {
        categoryName = category.name[currentLanguage] || category.name.en || category.name.de || '';
      }
    }
    
    // Parse category color
    if (category.style) {
      if (typeof category.style === 'string') {
        try {
          const styleObj = JSON.parse(category.style);
          categoryColor = styleObj.color || '#808080';
        } catch (e) {
          categoryColor = '#808080';
        }
      } else {
        categoryColor = category.style.color || '#808080';
      }
    }
    
    // Validate color format (should be hex)
    if (!categoryColor.startsWith('#')) {
      categoryColor = '#808080';
    }
  }
  
  // Lade den Aktivierungsstatus beim Mounten der Komponente
  useEffect(() => {
    const loadActiveStatus = async () => {
      try {
        const active = await isActiveBlueprintForUser(id);
        setIsActive(active);
      } catch (error) {
        console.debug('Fehler beim Laden des Aktivierungsstatus:', error);
      }
    };
    
    loadActiveStatus();
  }, [id]);
  
  // Funktion zum Umschalten des Aktivierungsstatus
  const handleToggleActive = async (event: any) => {
    // Verhindere, dass das Event zum Parent-Element propagiert
    event.stopPropagation();
    
    try {
      setIsLoading(true);
      const newStatus = !isActive;
      const success = await toggleBlueprintActive(id, newStatus);
      
      if (success) {
        setIsActive(newStatus);
        if (onActiveStatusChange) {
          onActiveStatusChange(id, newStatus);
        }
        
        // Event emittieren für andere Komponenten
        tagEvents.emitBlueprintPinned(id, newStatus);
      }
    } catch (error) {
      console.debug('Fehler beim Umschalten des Aktivierungsstatus:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Get border color from theme
  const borderColor = isDark
    ? ((colors as any).theme?.extend?.colors?.dark)?.[themeVariant]?.border || '#424242'
    : ((colors as any).theme?.extend?.colors)?.[themeVariant]?.border || '#e6e6e6';
  
  // Get background color from theme
  const backgroundColor = isDark 
    ? ((colors as any).theme?.extend?.colors?.dark)?.[themeVariant]?.contentBackground 
    : ((colors as any).theme?.extend?.colors)?.[themeVariant]?.contentBackground;

  return (
    <Pressable
      style={[
        styles.container,
        { 
          backgroundColor,
          borderWidth: 1,
          borderColor
        }
      ]}
      onPress={() => onPress(id)}
    >
      <View style={styles.header}>
        <Text 
          style={[styles.name, { color: isDark ? '#FFFFFF' : '#000000' }]}
          numberOfLines={1}
          ellipsizeMode="tail"
        >
          {displayName}
        </Text>
        <View style={styles.iconContainer}>
          {/* {isPublic && (
            <Icon name="globe-outline" size={16} color={isDark ? '#AAAAAA' : '#666666'} />
          )} */}
          <Pressable 
            onPress={handleToggleActive}
            style={[
              styles.activeButton,
              {
                backgroundColor: isActive 
                  ? 'rgba(255, 149, 0, 0.15)' 
                  : isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)',
                borderRadius: 8,
                padding: 8,
                opacity: id === STANDARD_BLUEPRINT_ID ? 0.5 : 1,
              }
            ]}
            disabled={isLoading || id === STANDARD_BLUEPRINT_ID}
          >
            {isLoading ? (
              <ActivityIndicator size="small" color={isDark ? '#AAAAAA' : '#666666'} />
            ) : (
              <Icon 
                name={isActive ? 'pin' : 'pin-outline'} 
                size={20} 
                color={isActive ? '#FF9500' : isDark ? '#AAAAAA' : '#666666'} 
              />
            )}
          </Pressable>
        </View>
      </View>
      
      {displayDescription ? (
        <Text 
          style={[styles.description, { color: isDark ? '#CCCCCC' : '#666666' }]}
          numberOfLines={2}
        >
          {displayDescription}
        </Text>
      ) : undefined}
      
      {showCategory && category && categoryName ? (
        <View style={styles.categoryContainer}>
          <View 
            style={[
              styles.categoryTag,
              { 
                backgroundColor: `${categoryColor}33`, // 20% opacity in hex
                borderColor: categoryColor,
              }
            ]}
          >
            <Text 
              style={[
                styles.categoryText,
                { color: categoryColor }
              ]}
              numberOfLines={1}
            >
              {categoryName}
            </Text>
          </View>
        </View>
      ) : undefined}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  name: {
    fontSize: 18,
    fontWeight: 'bold',
    flex: 1,
    marginRight: 8,
  },
  description: {
    fontSize: 14,
    marginBottom: 8,
  },
  iconContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  activeButton: {
    // padding moved inline for better visual feedback
  },
  categoryContainer: {
    flexDirection: 'row',
    marginTop: 4,
  },
  categoryTag: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
  },
  categoryText: {
    fontSize: 11,
    fontWeight: '600',
  },
});

export default BlueprintCard;
