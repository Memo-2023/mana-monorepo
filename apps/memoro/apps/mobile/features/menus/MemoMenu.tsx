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

interface MemoMenuProps {
  onPin?: () => void;
  onDelete?: () => void;
  onCopyTranscript?: () => void;
  onReplaceWord?: () => void;
  onLabelSpeakers?: () => void;
  onSearch?: () => void;
  onTranslate?: () => void;
  onAskQuestion?: () => void;
  onCreateMemory?: () => void;
  onAddPhoto?: () => void;
  onReprocess?: () => void;
  isPinned?: boolean;
  hasStructuredTranscript?: boolean;
}

/**
 * MemoMenu-Komponente
 *
 * Ein Dropdown-Menü für Memo-Aktionen.
 * Nutzt @expo/ui ContextMenu für native Menus auf iOS und Android.
 */
const MemoMenu: React.FC<MemoMenuProps> = ({
  onPin,
  onDelete,
  onCopyTranscript,
  onReplaceWord,
  onLabelSpeakers,
  onSearch,
  onTranslate,
  onAskQuestion,
  onCreateMemory,
  onAddPhoto,
  onReprocess,
  isPinned = false,
  hasStructuredTranscript = false,
}) => {
  const { isDark } = useTheme();
  const { t } = useTranslation();

  const iconColor = isDark ? '#FFFFFF' : '#000000';

  // Build menu items
  const menuItems = useMemo(() => {
    const items = [];

    // AI Features
    if (onAskQuestion) {
      items.push({
        key: 'ask_question',
        title: t('memo_menu.ask_question', 'Frage stellen'),
        systemIcon: 'bubble.left',
        onSelect: onAskQuestion,
      });
    }

    if (onCreateMemory) {
      items.push({
        key: 'create_memory',
        title: t('memo_menu.create_memory', 'Memory erstellen'),
        systemIcon: 'book',
        onSelect: onCreateMemory,
      });
    }

    if (onTranslate) {
      items.push({
        key: 'translate',
        title: t('memo_menu.translate', 'Übersetzen'),
        systemIcon: 'globe',
        onSelect: onTranslate,
      });
    }

    if (onReprocess) {
      items.push({
        key: 'reprocess',
        title: t('memo_menu.reprocess', 'Erneut verarbeiten'),
        systemIcon: 'arrow.clockwise',
        onSelect: onReprocess,
      });
    }

    // Edit Features
    if (onAddPhoto) {
      items.push({
        key: 'add_photo',
        title: t('memo_menu.add_photo', 'Foto hinzufügen'),
        systemIcon: 'photo',
        onSelect: onAddPhoto,
      });
    }

    if (onReplaceWord) {
      items.push({
        key: 'replace_word',
        title: t('memo_menu.replace_word', 'Wort ersetzen'),
        systemIcon: 'arrow.left.arrow.right',
        onSelect: onReplaceWord,
      });
    }

    if (onLabelSpeakers && hasStructuredTranscript) {
      items.push({
        key: 'label_speakers',
        title: t('memo_menu.label_speakers', 'Sprecher benennen'),
        systemIcon: 'person.2',
        onSelect: onLabelSpeakers,
      });
    }

    if (onSearch) {
      items.push({
        key: 'search',
        title: t('memo_menu.search', 'Suchen'),
        systemIcon: 'magnifyingglass',
        onSelect: onSearch,
      });
    }

    // Actions
    if (onCopyTranscript) {
      items.push({
        key: 'copy_transcript',
        title: t('memo_menu.copy_transcript', 'Transkript kopieren'),
        systemIcon: 'doc.on.doc',
        onSelect: onCopyTranscript,
      });
    }

    if (onPin) {
      items.push({
        key: 'pin',
        title: isPinned ? t('memo_menu.unpin', 'Lösen') : t('memo_menu.pin', 'Anpinnen'),
        systemIcon: isPinned ? 'pin.slash' : 'pin.fill',
        onSelect: onPin,
      });
    }

    if (onDelete) {
      items.push({
        key: 'delete',
        title: t('memo_menu.delete', 'Löschen'),
        systemIcon: 'trash',
        destructive: true,
        onSelect: onDelete,
      });
    }

    return items;
  }, [
    t,
    onAskQuestion,
    onCreateMemory,
    onTranslate,
    onReprocess,
    onAddPhoto,
    onReplaceWord,
    onLabelSpeakers,
    onSearch,
    onCopyTranscript,
    onPin,
    onDelete,
    isPinned,
    hasStructuredTranscript,
  ]);

  return (
    <Host>
      <ContextMenu>
        <ContextMenu.Items>
          {menuItems.map((item) => (
            <ExpoButton
              key={item.key}
              {...(Platform.OS === 'ios' && { systemImage: item.systemIcon })}
              {...(item.destructive && Platform.OS === 'android' && { color: '#FF3B30' })}
              onPress={item.onSelect}
            >
              {item.title}
            </ExpoButton>
          ))}
        </ContextMenu.Items>

        <ContextMenu.Trigger>
          <View style={{ padding: 12 }}>
            <Icon name="ellipsis-vertical" size={24} color={iconColor} />
          </View>
        </ContextMenu.Trigger>
      </ContextMenu>
    </Host>
  );
};

export default MemoMenu;
