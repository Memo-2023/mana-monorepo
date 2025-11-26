import { StatusBar } from 'expo-status-bar';
import { Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '~/contexts/ThemeContext';

import { ScreenContent } from '~/components/ScreenContent';

export default function Modal() {
  const { theme } = useTheme();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <ScreenContent path="app/modal.tsx" title="Modal"></ScreenContent>
      <StatusBar style="light" />
    </SafeAreaView>
  );
}
