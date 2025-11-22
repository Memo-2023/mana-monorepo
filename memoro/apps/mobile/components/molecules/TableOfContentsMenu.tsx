import React, { useMemo } from 'react';
import { Platform, View } from 'react-native';
import Icon from '~/components/atoms/Icon';
import { useTheme } from '~/features/theme/ThemeProvider';
import { useTranslation } from 'react-i18next';

// @expo/ui ContextMenu - use appropriate platform import
import { ContextMenu as ContextMenuiOS, Button as ButtoniOS, Host as HostiOS } from '@expo/ui/swift-ui';
import { ContextMenu as ContextMenuAndroid, Button as ButtonAndroid } from '@expo/ui/jetpack-compose';

// Select the correct components based on platform
const ContextMenu = Platform.OS === 'ios' ? ContextMenuiOS : ContextMenuAndroid;
const ExpoButton = Platform.OS === 'ios' ? ButtoniOS : ButtonAndroid;
const Host = Platform.OS === 'ios' ? HostiOS : View;

interface TableOfContentsItem {
  id: string;
  title: string;
  icon: string;
  onPress: () => void;
}

interface TableOfContentsMenuProps {
  items: TableOfContentsItem[];
}

// Maximum number of items to prevent performance issues
const MAX_MENU_ITEMS = 50;

/**
 * TableOfContentsMenu - Ein natives Dropdown-Menü für die Navigation innerhalb eines Memos
 *
 * Zeigt verschiedene Abschnitte wie Überschrift, Memory-Titel, Audiodatei, Transkript an
 * und ermöglicht das Scrollen zu diesen Abschnitten.
 * Nutzt @expo/ui ContextMenu für native Menus auf iOS und Android.
 */
const TableOfContentsMenu: React.FC<TableOfContentsMenuProps> = ({
  items,
}) => {
  const { isDark } = useTheme();
  const { t } = useTranslation();

  const iconColor = isDark ? '#FFFFFF' : '#000000';

  const getSystemIconForIcon = (iconName: string) => {
    switch (iconName) {
      case 'text-outline':
        return 'textformat';
      case 'document-text-outline':
        return 'doc.text';
      case 'reader-outline':
        return 'book';
      case 'play-outline':
        return 'play.circle';
      case 'document-outline':
        return 'doc.plaintext';
      default:
        return 'doc.text';
    }
  };

  // Centralized sorting function - memoized to prevent redundant calculations
  const sortedItems = useMemo(() => {
    const order = {
      'document-outline': 0,       // Transcript (first in array, appears at top)
      'play-outline': 1,           // Audio
      'document-text-outline': 2,  // Old Memories icon
      'reader-outline': 2,         // New Memories/Summary icon
      'text-outline': 3,           // Title (last in array, appears at bottom)
    };
    // Limit items to prevent performance issues
    const limitedItems = items.slice(0, MAX_MENU_ITEMS);
    return [...limitedItems].sort((a, b) => {
      return (order[a.icon as keyof typeof order] ?? 999) - (order[b.icon as keyof typeof order] ?? 999);
    });
  }, [items]);

  // Menu items
  const menuItems = useMemo(() => {
    return sortedItems.map((item) => ({
      key: item.id,
      title: item.title,
      systemIcon: getSystemIconForIcon(item.icon),
      onSelect: item.onPress,
    }));
  }, [sortedItems]);

  return (
    <Host>
      <ContextMenu>
        <ContextMenu.Items>
          {menuItems.map((item) => (
            <ExpoButton
              key={item.key}
              {...(Platform.OS === 'ios' && { systemImage: item.systemIcon })}
              onPress={item.onSelect}
            >
              {item.title}
            </ExpoButton>
          ))}
        </ContextMenu.Items>

        <ContextMenu.Trigger>
          <View
            style={{
              width: '100%',
              height: '100%',
              justifyContent: 'center',
              alignItems: 'center',
            }}
          >
            <Icon name="reader-outline" size={24} color={iconColor} />
          </View>
        </ContextMenu.Trigger>
      </ContextMenu>
    </Host>
  );
};

export default TableOfContentsMenu;