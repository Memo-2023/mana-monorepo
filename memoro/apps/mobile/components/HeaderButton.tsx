import { forwardRef } from 'react';
import { Pressable, View, StyleSheet } from 'react-native';
import * as Haptics from 'expo-haptics';
import { useTheme } from '~/features/theme/ThemeProvider';
import Icon from '~/components/atoms/Icon';
import NotificationBadge from '~/components/atoms/NotificationBadge';
import { useUnuploadedCount } from '~/features/storage/hooks/useUnuploadedCount';
import { useInitializeUploadStatus } from '~/features/storage/store/uploadStatusStore';

export const HeaderButton = forwardRef<typeof Pressable, { onPress?: () => void }>(
  ({ onPress }, ref) => {
    const { tw } = useTheme();

    // Initialize upload status store
    useInitializeUploadStatus();

    // Get count of unuploaded audio files
    const unuploadedCount = useUnuploadedCount();

    const handlePress = async () => {
      try {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      } catch (error) {
        console.debug('Haptic feedback error:', error);
      }
      onPress?.();
    };

    return (
      <View style={styles.container}>
        <Pressable ref={ref} onPress={handlePress}>
          {({ pressed }) => (
            <Icon
              name="settings-outline"
              size={24}
              useThemeColor
              className={tw(`${pressed ? 'opacity-50' : 'opacity-100'}`)}
            />
          )}
        </Pressable>
        {unuploadedCount > 0 && (
          <NotificationBadge
            count={unuploadedCount}
            size="small"
            style={styles.badge}
          />
        )}
      </View>
    );
  }
);

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    marginRight: 16,
  },
  badge: {
    position: 'absolute',
    top: -2,
    right: -2,
    zIndex: 10,
  },
});
