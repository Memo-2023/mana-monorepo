import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Platform } from 'react-native';
import { useTheme } from '~/utils/ThemeContext';

// Mapping von Icon-Namen für verschiedene Plattformen
const iconMap: Record<string, { ios: string; android: string }> = {
	community: { ios: 'people', android: 'people' },
	create: { ios: 'add-circle', android: 'add-circle' },
	shelf: { ios: 'grid', android: 'grid' },
};

export const TabBarIcon = (props: { name: string; color: string; focused?: boolean }) => {
	const { name, color, focused } = props;

	// Wähle das richtige Icon basierend auf der Plattform
	const mappedName = iconMap[name] || { ios: 'help-circle', android: 'help-circle' };
	const iconName = Platform.OS === 'ios' ? mappedName.ios : mappedName.android;

	// Bestimme den vollständigen Icon-Namen (mit oder ohne Outline)
	const fullIconName = (
		focused ? iconName : `${iconName}-outline`
	) as keyof typeof Ionicons.glyphMap;

	return <Ionicons name={fullIconName} size={26} style={styles.tabBarIcon} color={color} />;
};

export const styles = StyleSheet.create({
	tabBarIcon: {
		marginBottom: -3,
	},
});
