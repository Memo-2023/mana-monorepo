import React, { useState } from 'react';
import {
  ScrollView, View, StyleSheet, Pressable,
} from 'react-native';
import Pill from '~/components/atoms/Pill';
import Icon from '~/components/atoms/Icon';
import Text from '~/components/atoms/Text';
import { useTheme } from '~/features/theme/ThemeProvider';
import { useTranslation } from 'react-i18next';
import colors from '~/tailwind.config.js';

interface TagItem {
  id: string;
  text: string;
  color?: string;
  big?: boolean;
  selected?: boolean;
}

interface TagListProps {
  tags: TagItem[];
  horizontal?: boolean;
  showAddButton?: boolean;
  showAddButtonText?: boolean;
  onTagPress?: (id: string) => void;
  onAddPress?: () => void;
}

function TagList({
  tags,
  horizontal = false,
  showAddButton = true,
  showAddButtonText = true,
  onTagPress,
  onAddPress,
}: TagListProps) {
  const { isDark, themeVariant } = useTheme();
  const { t } = useTranslation();
  const [isHovered, setIsHovered] = useState(false);

  // Farben aus der Tailwind-Konfiguration
  const themeColors = (colors as any).theme?.extend?.colors;
  
  // Verwende secondaryButton aus der Tailwind-Konfiguration
  const backgroundColor = isDark 
    ? themeColors?.dark?.[themeVariant]?.secondaryButton || '#1E1E1E'
    : themeColors?.[themeVariant]?.secondaryButton || '#EDE89B';
    
  const hoverBackgroundColor = isDark
    ? themeColors?.dark?.[themeVariant]?.menuBackgroundHover || '#333333'
    : themeColors?.[themeVariant]?.menuBackgroundHover || '#cccccc';
  
  const textColor = isDark ? '#FFFFFF' : '#000000';
  const borderColor = isDark 
    ? themeColors?.dark?.[themeVariant]?.border || '#424242'
    : themeColors?.[themeVariant]?.border || '#e6e6e6';
  const primaryColor = isDark 
    ? themeColors?.dark?.[themeVariant]?.primary || '#f8d62b'
    : themeColors?.[themeVariant]?.primary || '#f8d62b';

  const styles = StyleSheet.create({
    container: {
      position: 'relative',
      width: '100%',
      minHeight: 30,
    },
    scrollView: {
      flexGrow: 0,
      width: '100%',
    },
    tagWrapper: {
      flexDirection: 'row',
      flexWrap: 'nowrap',
      alignItems: 'center',
      gap: 6,
      minHeight: 30,
      paddingHorizontal: 20,
    },
    addButton: {
      paddingHorizontal: 14, // Match Pill's horizontal padding
      paddingVertical: 6,    // Match Pill's vertical padding
      justifyContent: 'center',
      alignItems: 'center',
      alignSelf: 'flex-start', // Match Pill's alignSelf
      backgroundColor,
      borderWidth: 1,
      borderColor,
      borderRadius: 999, // Maximale Rundung für immer runden Button
      flexDirection: 'row',
      gap: 2,
      minWidth: showAddButtonText ? 40 : 28, // Match Pill's minWidth for consistency
      marginRight: 2,
      // Remove explicit height to let content determine size naturally
    },
    addButtonText: {
      color: textColor,
      fontWeight: '500',
      textAlign: 'center', // Ensure text is centered
      // fontSize and lineHeight handled by Text component's "small" variant
    },
    addButtonHovered: {
      backgroundColor: hoverBackgroundColor,
      borderColor: primaryColor,
    },
  });

  const handleTagPress = (tagId: string) => {
    if (onTagPress) {
      onTagPress(tagId);
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView
        horizontal={horizontal}
        showsHorizontalScrollIndicator={false}
        showsVerticalScrollIndicator={false}
        style={styles.scrollView}
        contentContainerStyle={styles.tagWrapper}
      >
        {showAddButton && (
          <Pressable
            style={[
              styles.addButton,
              isHovered && styles.addButtonHovered
            ]}
            onPress={onAddPress}
            onPressIn={() => setIsHovered(true)}
            onPressOut={() => setIsHovered(false)}
            hitSlop={8}
          >
            <Icon
              name="add-outline"
              size={18}
              color={textColor}
            />
            {showAddButtonText && (
              <Text 
                variant="small"
                style={styles.addButtonText}
                numberOfLines={1}
                ellipsizeMode="tail"
              >
                {t('tags.add_tag', 'Add Tag')}
              </Text>
            )}
          </Pressable>
        )}
        {tags.filter(tag => tag.id).map((tag) => (
          <Pill
            key={tag.id}
            label={tag.text}
            color={tag.color || primaryColor}
            onPress={() => handleTagPress(tag.id)}
            isSelected={tag.selected}
            size="small"
            maxLength={15}
            style={{
              backgroundColor: `${tag.color || primaryColor}33`,
              borderColor: `${tag.color || primaryColor}77`,
            }}
          />
        ))}
      </ScrollView>
    </View>
  );
}

export default TagList;
