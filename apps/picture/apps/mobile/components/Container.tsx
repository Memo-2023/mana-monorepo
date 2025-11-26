import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '~/contexts/ThemeContext';

export const Container = ({ children }: { children: React.ReactNode }) => {
  const { theme } = useTheme();
  return (
    <SafeAreaView
      className="flex flex-1 m-6"
      style={{ backgroundColor: theme.colors.background }}
    >
      {children}
    </SafeAreaView>
  );
};
