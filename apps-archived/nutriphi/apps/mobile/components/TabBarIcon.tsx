import { StyleSheet } from 'react-native';
import { SFSymbol } from './ui/SFSymbol';

interface TabBarIconProps {
	sfSymbol: string;
	fallbackIcon: string;
	color: string;
}

export const TabBarIcon = ({ sfSymbol, fallbackIcon, color }: TabBarIconProps) => {
	return (
		<SFSymbol
			name={sfSymbol}
			fallbackIcon={fallbackIcon as any}
			color={color}
			size={24}
			style={styles.tabBarIcon}
		/>
	);
};

export const styles = StyleSheet.create({
	tabBarIcon: {
		marginBottom: -3,
	},
});
