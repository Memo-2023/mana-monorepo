import React from 'react';
import { View, Pressable } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '~/features/theme/ThemeProvider';
import Text from '~/components/atoms/Text';
import Icon from '~/components/atoms/Icon';
import colors from '~/tailwind.config.js';

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

interface TagCardProps {
  tag: Tag;
  onEdit: (tag: Tag) => void;
  onDelete: (tag: Tag) => void;
  onTogglePin: (tag: Tag) => void;
  isDark: boolean;
  onPress?: (tag: Tag) => void;
  onLongPress?: () => void;
  isEditMode?: boolean;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  isFirst?: boolean;
  isLast?: boolean;
}

/**
 * TagCard displays a tag with its color indicator and action buttons
 * for editing, deleting, and pinning/unpinning
 */
const TagCard = ({
  tag,
  onEdit,
  onDelete,
  onTogglePin,
  isDark,
  onPress,
  onLongPress,
  isEditMode = false,
  onMoveUp,
  onMoveDown,
  isFirst = false,
  isLast = false,
}: TagCardProps) => {
  const { t } = useTranslation();
  const { themeVariant } = useTheme();
  
  const tagName = tag.name || t('tags.unnamed', 'Unbenannt');
  const tagColor = (tag.style && tag.style.color) ? tag.style.color : '#FF6B6B';
  const isPinned = tag.is_pinned || false;
  
  // Debug log for color
  console.debug(`TagCard: ${tagName} color: ${tagColor}, style:`, tag.style);
  
  // Background colors for the icon containers
  const iconBgColor = isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)';
  const pinnedIconBgColor = isPinned ? 'rgba(255, 149, 0, 0.15)' : iconBgColor;
  
  // Dynamic background color from tailwind config
  const backgroundColor = isDark 
    ? ((colors as any).theme?.extend?.colors?.dark)?.[themeVariant]?.contentBackground 
    : ((colors as any).theme?.extend?.colors)?.[themeVariant]?.contentBackground;
  
  // Get border color from theme like MemoPreview
  const borderColor = isDark
    ? ((colors as any).theme?.extend?.colors?.dark)?.[themeVariant]?.border || '#424242'
    : ((colors as any).theme?.extend?.colors)?.[themeVariant]?.border || '#e6e6e6';
  
  const handlePress = () => {
    if (onPress) {
      onPress(tag);
    }
  };
  
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: 12,
        marginBottom: 16,
        backgroundColor,
        borderWidth: 1,
        borderColor: borderColor,
      }}
    >
      <Pressable
        onPress={handlePress}
        onLongPress={onLongPress}
        style={[
          {
            flex: 1,
            flexDirection: 'row',
            alignItems: 'center',
            paddingVertical: 16,
            paddingLeft: 12,
            paddingRight: 20
          },
          ({ pressed }) => pressed ? { opacity: 0.7 } : undefined
        ]}
      >
        <View
          style={{
            width: 24,
            height: 24,
            borderRadius: 12,
            backgroundColor: tagColor,
            borderWidth: 1,
            borderColor: isDark ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.1)',
            minWidth: 24,
            minHeight: 24,
            marginRight: 10
          }}
        />
        <Text
          style={{
            flex: 1,
            fontSize: 16,
            fontWeight: '500',
            color: isDark ? '#FFFFFF' : '#000000'
          }}
          numberOfLines={1}
          ellipsizeMode="tail"
        >
          {tagName}
        </Text>
      </Pressable>
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingRight: 8 }}>
        {isEditMode ? (
          <>
            {/* Reorder buttons in edit mode */}
            <Icon
              name="chevron-up"
              size={22}
              color={isFirst ? (isDark ? '#555555' : '#CCCCCC') : (isDark ? '#CCCCCC' : '#666666')}
              asButton
              buttonBackgroundColor={iconBgColor}
              onPress={!isFirst ? onMoveUp : undefined}
              disabled={isFirst}
            />

            <View style={{ width: 12 }} />

            <Icon
              name="chevron-down"
              size={22}
              color={isLast ? (isDark ? '#555555' : '#CCCCCC') : (isDark ? '#CCCCCC' : '#666666')}
              asButton
              buttonBackgroundColor={iconBgColor}
              onPress={!isLast ? onMoveDown : undefined}
              disabled={isLast}
            />
          </>
        ) : (
          <>
            {/* Normal mode buttons */}
            <Icon
              name="trash-outline"
              size={22}
              color={isDark ? '#CCCCCC' : '#666666'}
              asButton
              buttonBackgroundColor={iconBgColor}
              onPress={() => onDelete(tag)}
            />

            <View style={{ width: 12 }} />

            <Icon
              name="pencil-outline"
              size={22}
              color={isDark ? '#CCCCCC' : '#666666'}
              asButton
              buttonBackgroundColor={iconBgColor}
              onPress={() => onEdit(tag)}
            />

            <View style={{ width: 12 }} />

            <Icon
              name={isPinned ? 'pin' : 'pin-outline'}
              size={22}
              color={isPinned ? '#FF9500' : (isDark ? '#CCCCCC' : '#666666')}
              asButton
              buttonBackgroundColor={pinnedIconBgColor}
              onPress={() => onTogglePin(tag)}
            />
          </>
        )}
      </View>
    </View>
  );
};

// Styles wurden durch NativeWind-Klassen ersetzt

export default TagCard;
