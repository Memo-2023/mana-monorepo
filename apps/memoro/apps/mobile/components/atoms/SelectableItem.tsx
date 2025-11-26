import React from 'react';
import { View, Pressable, StyleSheet, Platform } from 'react-native';
import { useTheme } from '~/features/theme/ThemeProvider';
import Text from '~/components/atoms/Text';
import Icon from '~/components/atoms/Icon';

const tailwindConfig = require('../../tailwind.config.js');

interface SelectableItemProps {
  title: string;
  isSelected: boolean;
  onToggle: () => void;
  renderContent?: () => React.ReactNode;
}

/**
 * Eine wiederverwendbare Komponente für auswählbare Elemente mit Checkbox.
 * Kann für verschiedene Auswahlszenarien verwendet werden, z.B. in Bottom Sheets oder Listen.
 */
const SelectableItem = ({
  title,
  isSelected,
  onToggle,
  renderContent,
}: SelectableItemProps): React.ReactElement => {
  const { isDark, themeVariant } = useTheme();

  // Get theme background color
  const getThemeBackgroundColor = () => {
    try {
      if (tailwindConfig && tailwindConfig.theme && tailwindConfig.theme.extend && tailwindConfig.theme.extend.colors) {
        const colors = tailwindConfig.theme.extend.colors;
        
        if (isDark && colors.dark && colors.dark[themeVariant]) {
          return isSelected 
            ? colors.dark[themeVariant].contentBackgroundHover 
            : colors.dark[themeVariant].contentBackground;
        } else if (colors[themeVariant]) {
          return isSelected 
            ? colors[themeVariant].contentBackgroundHover 
            : colors[themeVariant].contentBackground;
        }
      }
      
      // Fallback
      return isSelected 
        ? (isDark ? 'rgba(60, 60, 60, 0.8)' : 'rgba(220, 220, 220, 0.8)')
        : (isDark ? 'rgba(40, 40, 40, 0.8)' : 'rgba(240, 240, 240, 0.8)');
    } catch (e) {
      console.debug('Error loading theme colors:', e);
      return isSelected 
        ? (isDark ? 'rgba(60, 60, 60, 0.8)' : 'rgba(220, 220, 220, 0.8)')
        : (isDark ? 'rgba(40, 40, 40, 0.8)' : 'rgba(240, 240, 240, 0.8)');
    }
  };

  // Get primary button color for checkbox
  const getPrimaryButtonColor = () => {
    try {
      if (tailwindConfig && tailwindConfig.theme && tailwindConfig.theme.extend && tailwindConfig.theme.extend.colors) {
        const colors = tailwindConfig.theme.extend.colors;
        
        if (isDark && colors.dark && colors.dark[themeVariant] && colors.dark[themeVariant].primaryButton) {
          return colors.dark[themeVariant].primaryButton;
        } else if (colors[themeVariant] && colors[themeVariant].primaryButton) {
          return colors[themeVariant].primaryButton;
        }
      }
      
      // Fallback
      return '#f8d62b';
    } catch (e) {
      console.debug('Error loading theme colors:', e);
      return '#f8d62b';
    }
  };
  
  const styles = StyleSheet.create({
    container: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: getThemeBackgroundColor(),
      borderRadius: 8,
      borderWidth: 1,
      borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 1,
      ...(Platform.OS !== 'android' && {
        elevation: 1,
      }),
      padding: 12,
    },
    checkbox: {
      width: 24,
      height: 24,
      borderRadius: 4,
      borderWidth: 2,
      borderColor: isDark ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.3)',
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 16,
    },
    checkboxSelected: {
      backgroundColor: getPrimaryButtonColor(),
      borderColor: getPrimaryButtonColor(),
    },
    contentContainer: {
      flex: 1,
    },
    title: {
      fontSize: 16,
      fontWeight: 'bold',
      color: isDark ? '#FFFFFF' : '#000000',
    },
  });
  
  return (
    <Pressable 
      style={styles.container}
      onPress={onToggle}
    >
      <View style={[
        styles.checkbox,
        isSelected && styles.checkboxSelected
      ]}>
        {isSelected && (
          <Icon name="checkmark" size={12} color="#FFFFFF" />
        )}
      </View>
      <View style={styles.contentContainer}>
        <Text 
          style={styles.title}
          numberOfLines={1}
          ellipsizeMode="tail"
        >
          {title}
        </Text>
        {renderContent && renderContent()}
      </View>
    </Pressable>
  );
};

export default SelectableItem;
