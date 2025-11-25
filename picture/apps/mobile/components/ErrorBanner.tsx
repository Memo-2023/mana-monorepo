import { View, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Text } from './Text';
import { useTheme } from '~/contexts/ThemeContext';

type ErrorBannerProps = {
  message: string;
  onDismiss: () => void;
};

export function ErrorBanner({ message, onDismiss }: ErrorBannerProps) {
  const { theme } = useTheme();

  return (
    <View
      style={{
        position: 'absolute',
        top: 60,
        left: 16,
        right: 16,
        backgroundColor: theme.colors.error || '#ef4444',
        borderRadius: 12,
        padding: 16,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        zIndex: 1000,
        ...theme.shadows.lg,
      }}
    >
      <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center' }}>
        <Ionicons name="alert-circle" size={20} color="white" style={{ marginRight: 12 }} />
        <Text style={{ color: 'white', flex: 1 }}>{message}</Text>
      </View>
      <Pressable onPress={onDismiss} hitSlop={8}>
        <Ionicons name="close" size={20} color="white" />
      </Pressable>
    </View>
  );
}
