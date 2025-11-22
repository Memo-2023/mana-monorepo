import React, { useMemo } from 'react';
import { Platform, View, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import Icon from '~/components/atoms/Icon';
import { useTheme } from '~/features/theme/ThemeProvider';
import { useTranslation } from 'react-i18next';
import { useUnuploadedCount } from '~/features/storage/hooks/useUnuploadedCount';
import { useInitializeUploadStatus } from '~/features/storage/store/uploadStatusStore';
import NotificationBadge from '~/components/atoms/NotificationBadge';

// @expo/ui ContextMenu - use appropriate platform import
import { ContextMenu as ContextMenuiOS, Button as ButtoniOS, Host as HostiOS } from '@expo/ui/swift-ui';
import { ContextMenu as ContextMenuAndroid, Button as ButtonAndroid } from '@expo/ui/jetpack-compose';

// Select the correct components based on platform
const ContextMenu = Platform.OS === 'ios' ? ContextMenuiOS : ContextMenuAndroid;
const ExpoButton = Platform.OS === 'ios' ? ButtoniOS : ButtonAndroid;
const Host = Platform.OS === 'ios' ? HostiOS : View; // Android doesn't need Host

interface HeaderMenuProps {
  onThemeToggle?: () => void;
}

/**
 * Header-Menü-Komponente
 *
 * Eine Dropdown-Menü-Komponente für den Header, die verschiedene Aktionen anbietet.
 * Nutzt @expo/ui ContextMenu für native Menus auf iOS und Android.
 */
const HeaderMenu: React.FC<HeaderMenuProps> = () => {
  const router = useRouter();
  const { isDark } = useTheme();
  const { t } = useTranslation();

  // Initialize upload status store
  useInitializeUploadStatus();

  // Get count of unuploaded audio files
  const unuploadedCount = useUnuploadedCount();

  const iconColor = isDark ? '#FFFFFF' : '#000000';

  // Menu items
  const menuItems = useMemo(() => {
    // Build archive title with count if there are unuploaded files
    const archiveTitle = unuploadedCount > 0
      ? `${t('header_menu.audio_archive', 'Audio Archiv')} (${unuploadedCount})`
      : t('header_menu.audio_archive', 'Audio Archiv');

    return [
      // Organisation section
      {
        key: 'tags',
        title: t('menu.tags', 'Tags'),
        systemIcon: 'tag',
        onSelect: () => router.push('/(protected)/tags'),
      },
      {
        key: 'statistics',
        title: t('menu.statistics', 'Statistiken'),
        systemIcon: 'chart.bar',
        onSelect: () => router.push('/(protected)/statistics'),
      },

      // Recordings section
      {
        key: 'blueprints',
        title: t('menu.blueprints', 'Modi'),
        systemIcon: 'list.bullet.clipboard',
        onSelect: () => router.push('/(protected)/blueprints'),
      },
      {
        key: 'upload',
        title: t('header_menu.upload_audio', 'Audio hochladen'),
        systemIcon: 'icloud.and.arrow.up',
        onSelect: () => router.push('/(protected)/(tabs)/memos?openUploadModal=true'),
      },
      {
        key: 'archive',
        title: archiveTitle,
        systemIcon: 'waveform',
        onSelect: () => router.push('/(protected)/audio-archive'),
      },

      // Account section
      {
        key: 'subscription',
        title: t('menu.subscription', 'Abonnement'),
        systemIcon: 'drop.fill',
        onSelect: () => router.push('/(protected)/subscription'),
      },
      {
        key: 'settings',
        title: t('menu.settings', 'Einstellungen'),
        systemIcon: 'gear',
        onSelect: () => router.push('/(protected)/settings'),
      },
    ];
  }, [t, router, unuploadedCount]);

  return (
    <Host>
      <ContextMenu key={`menu-${unuploadedCount}`} style={{ padding: 12 }}>
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
          <View style={{ paddingRight: -20, paddingTop: 16, paddingBottom: 8, paddingLeft: 12, position: 'relative' }}>
            <View style={{ transform: [{ rotate: '90deg' }] }}>
              <Icon
                name="ellipsis-vertical"
                size={24}
                color={iconColor}
              />
            </View>
            {unuploadedCount > 0 && (
              <NotificationBadge
                count={unuploadedCount}
                size="small"
                style={styles.badge}
              />
            )}
          </View>
        </ContextMenu.Trigger>
      </ContextMenu>
    </Host>
  );
};

const styles = StyleSheet.create({
  badge: {
    position: 'absolute',
    top: 12,
    right: -8,
    zIndex: 10,
  },
});

export default HeaderMenu;
