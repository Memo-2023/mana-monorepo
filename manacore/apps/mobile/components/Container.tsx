import { SafeAreaView, View } from 'react-native';
import { useTheme } from '~/utils/themeContext';

export const Container = ({ children }: { children: React.ReactNode }) => {
  const { isDarkMode } = useTheme();
  
  return (
    <SafeAreaView className={`flex flex-1 ${isDarkMode ? 'bg-gray-900' : 'bg-white'}`}>
      <View className="flex flex-1 m-6">{children}</View>
    </SafeAreaView>
  );
};
