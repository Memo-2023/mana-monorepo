import { Text, View } from 'react-native';
import { useTheme } from '~/utils/ThemeContext';

type ScreenContentProps = {
	title: string;
	path: string;
	children?: React.ReactNode;
};

export const ScreenContent = ({ title, path, children }: ScreenContentProps) => {
	const { isDark, theme } = useTheme();

	return (
		<View className={`${styles.container} ${isDark ? 'bg-gray-900' : 'bg-white'}`}>
			<Text className={`${styles.title} ${isDark ? 'text-white' : 'text-black'}`}>{title}</Text>
			<View className={`${styles.separator} ${isDark ? 'bg-gray-700' : 'bg-gray-200'}`} />
			{children}
		</View>
	);
};
const styles = {
	container: `items-center flex-1 justify-center`,
	separator: `h-[1px] my-7 w-4/5 bg-gray-200`,
	title: `text-xl font-bold`,
};
