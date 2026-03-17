import { View } from 'react-native';

import { useTheme } from '../utils/themeContext';

type ThemeWrapperProps = {
	children: React.ReactNode;
	className?: string;
};

export const ThemeWrapper: React.FC<ThemeWrapperProps> = ({ children, className = '' }) => {
	const { isDarkMode } = useTheme();

	return (
		<View
			className={`${isDarkMode ? 'dark bg-background-dark' : 'bg-background-light'} flex-1 ${className}`}
		>
			{children}
		</View>
	);
};
