import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '~/contexts/ThemeContext';

export const Container = ({ children }: { children: React.ReactNode }) => {
	const { theme } = useTheme();
	return (
		<SafeAreaView className="m-6 flex flex-1" style={{ backgroundColor: theme.colors.background }}>
			{children}
		</SafeAreaView>
	);
};
