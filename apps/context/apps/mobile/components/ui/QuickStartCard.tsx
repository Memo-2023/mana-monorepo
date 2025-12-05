import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '~/utils/theme/theme';
import { Text } from '~/components/ui/Text';

interface QuickStartItemProps {
	title: string;
	icon?: keyof typeof Ionicons.glyphMap;
	onPress: () => void;
}

interface QuickStartCardProps {
	title: string;
	description: string;
	items: QuickStartItemProps[];
}

const QuickStartItem: React.FC<QuickStartItemProps> = ({ title, icon, onPress }) => {
	const { isDark, themeName } = useTheme();

	// Hilfsfunktion zum Abrufen von Theme-Farben
	const getThemeColor = (theme: string, shade: number): string => {
		if (theme === 'blue') {
			const blueColors: { [key: number]: string } = {
				100: '#dbeafe',
				200: '#bfdbfe',
				500: '#3b82f6',
				600: '#2563eb',
				800: '#1e40af',
				900: '#1e3a8a',
			};
			return blueColors[shade] || '#3b82f6';
		} else if (theme === 'green') {
			const greenColors: { [key: number]: string } = {
				100: '#dcfce7',
				200: '#bbf7d0',
				500: '#22c55e',
				600: '#16a34a',
				800: '#166534',
				900: '#14532d',
			};
			return greenColors[shade] || '#22c55e';
		} else if (theme === 'purple') {
			const purpleColors: { [key: number]: string } = {
				100: '#f3e8ff',
				200: '#e9d5ff',
				500: '#a855f7',
				600: '#9333ea',
				800: '#6b21a8',
				900: '#581c87',
			};
			return purpleColors[shade] || '#a855f7';
		}

		// Fallback auf Indigo-Farben
		const indigoColors: { [key: number]: string } = {
			100: '#e0e7ff',
			200: '#c7d2fe',
			500: '#6366f1',
			600: '#4f46e5',
			800: '#3730a3',
			900: '#312e81',
		};
		return indigoColors[shade] || '#6366f1';
	};

	return (
		<TouchableOpacity
			style={[
				styles.item,
				{
					backgroundColor: isDark ? '#1f2937' : '#ffffff',
					borderColor: isDark ? '#374151' : '#e5e7eb',
				},
			]}
			onPress={onPress}
			activeOpacity={0.7}
		>
			{icon && (
				<Ionicons
					name={icon}
					size={24}
					color={isDark ? getThemeColor(themeName, 500) : getThemeColor(themeName, 600)}
					style={styles.itemIcon}
				/>
			)}
			<Text
				style={[
					styles.itemTitle,
					{
						color: isDark ? '#f9fafb' : '#111827',
					},
				]}
			>
				{title}
			</Text>
		</TouchableOpacity>
	);
};

export const QuickStartCard: React.FC<QuickStartCardProps> = ({ title, description, items }) => {
	const { isDark } = useTheme();

	return (
		<View
			style={[
				styles.container,
				{
					backgroundColor: isDark ? '#1f2937' : '#ffffff',
					borderColor: isDark ? '#374151' : '#e5e7eb',
				},
			]}
		>
			<Text
				style={[
					styles.title,
					{
						color: isDark ? '#f9fafb' : '#111827',
					},
				]}
			>
				{title}
			</Text>
			<Text
				style={[
					styles.description,
					{
						color: isDark ? '#d1d5db' : '#4b5563',
					},
				]}
			>
				{description}
			</Text>
			<View style={styles.itemsContainer}>
				{items.map((item, index) => (
					<QuickStartItem key={index} title={item.title} icon={item.icon} onPress={item.onPress} />
				))}
			</View>
		</View>
	);
};

const styles = StyleSheet.create({
	container: {
		borderRadius: 8,
		borderWidth: 1,
		padding: 16,
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 1 },
		shadowOpacity: 0.1,
		shadowRadius: 2,
		elevation: 2,
	},
	title: {
		fontSize: 20,
		fontWeight: 'bold',
		marginBottom: 8,
	},
	description: {
		fontSize: 14,
		marginBottom: 16,
	},
	itemsContainer: {
		flexDirection: 'row',
		flexWrap: 'wrap',
		marginHorizontal: -8,
	},
	item: {
		borderRadius: 8,
		borderWidth: 1,
		padding: 16,
		alignItems: 'center',
		justifyContent: 'center',
		marginHorizontal: 8,
		marginBottom: 16,
		flex: 1,
		minWidth: 120,
	},
	itemIcon: {
		marginBottom: 8,
	},
	itemTitle: {
		fontSize: 14,
		fontWeight: '500',
		textAlign: 'center',
	},
});
