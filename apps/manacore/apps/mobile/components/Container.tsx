import { SafeAreaView, View } from 'react-native';
import { useTheme } from '~/utils/themeContext';

export const Container = ({ children }: { children: React.ReactNode }) => {
	const { isDarkMode } = useTheme();

	return (
		<SafeAreaView className={`flex flex-1 ${isDarkMode ? 'bg-gray-900' : 'bg-white'}`}>
			<View className="m-6 flex flex-1">{children}</View>
		</SafeAreaView>
	);
};
