import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '~/utils/theme/theme';
import { Text } from '~/components/ui/Text';
import { useRouter } from 'expo-router';

interface ThemedSpaceCardProps {
	id: string;
	name: string;
	description: string | null;
	documentCount: number;
	tags?: string[];
}

export const ThemedSpaceCard: React.FC<ThemedSpaceCardProps> = ({
	id,
	name,
	description,
	documentCount,
	tags = [],
}) => {
	const { isDark, themeName } = useTheme();
	const router = useRouter();

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
				styles.container,
				{
					backgroundColor: isDark ? '#1f2937' : '#ffffff',
					borderColor: isDark ? '#374151' : '#e5e7eb',
				},
			]}
			onPress={() => router.push(`/spaces/${id}`)}
			activeOpacity={0.7}
		>
			<View style={styles.header}>
				<Text
					style={[
						styles.title,
						{
							color: isDark ? '#f9fafb' : '#111827',
						},
					]}
				>
					{name}
				</Text>
				<Ionicons
					name="folder-outline"
					size={20}
					color={isDark ? getThemeColor(themeName, 500) : getThemeColor(themeName, 600)}
					style={styles.icon}
				/>
			</View>

			{description && (
				<Text
					style={[
						styles.description,
						{
							color: isDark ? '#d1d5db' : '#4b5563',
						},
					]}
					numberOfLines={2}
				>
					{description}
				</Text>
			)}

			{tags.length > 0 && (
				<View style={styles.tagsContainer}>
					{tags.slice(0, 3).map((tag, index) => (
						<View
							key={index}
							style={[
								styles.tag,
								{
									backgroundColor: isDark
										? getThemeColor(themeName, 900)
										: getThemeColor(themeName, 100),
								},
							]}
						>
							<Text
								style={[
									styles.tagText,
									{
										color: isDark ? getThemeColor(themeName, 200) : getThemeColor(themeName, 800),
									},
								]}
							>
								{tag}
							</Text>
						</View>
					))}
					{tags.length > 3 && (
						<Text
							style={[
								styles.moreTag,
								{
									color: isDark ? '#9ca3af' : '#6b7280',
								},
							]}
						>
							+{tags.length - 3} mehr
						</Text>
					)}
				</View>
			)}

			<View style={styles.footer}>
				<Text
					style={[
						styles.documentCount,
						{
							color: isDark ? '#9ca3af' : '#6b7280',
						},
					]}
				>
					{documentCount} {documentCount === 1 ? 'Dokument' : 'Dokumente'}
				</Text>
				<TouchableOpacity
					style={[
						styles.viewButton,
						{
							backgroundColor: isDark
								? getThemeColor(themeName, 800)
								: getThemeColor(themeName, 100),
						},
					]}
					onPress={() => router.push(`/spaces/${id}`)}
				>
					<Text
						style={[
							styles.viewButtonText,
							{
								color: isDark ? getThemeColor(themeName, 200) : getThemeColor(themeName, 800),
							},
						]}
					>
						Öffnen
					</Text>
				</TouchableOpacity>
			</View>
		</TouchableOpacity>
	);
};

const styles = StyleSheet.create({
	container: {
		borderRadius: 8,
		borderWidth: 1,
		marginBottom: 12,
		padding: 16,
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 1 },
		shadowOpacity: 0.1,
		shadowRadius: 2,
		elevation: 2,
	},
	header: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		marginBottom: 8,
	},
	title: {
		fontSize: 18,
		fontWeight: '600',
		flex: 1,
	},
	icon: {
		marginLeft: 8,
	},
	description: {
		fontSize: 14,
		marginBottom: 12,
	},
	tagsContainer: {
		flexDirection: 'row',
		flexWrap: 'wrap',
		marginBottom: 12,
	},
	tag: {
		borderRadius: 9999,
		paddingHorizontal: 8,
		paddingVertical: 4,
		marginRight: 8,
		marginBottom: 8,
	},
	tagText: {
		fontSize: 12,
	},
	moreTag: {
		fontSize: 12,
		marginLeft: 4,
		alignSelf: 'center',
	},
	footer: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		marginTop: 8,
	},
	documentCount: {
		fontSize: 14,
	},
	viewButton: {
		paddingHorizontal: 12,
		paddingVertical: 6,
		borderRadius: 4,
	},
	viewButtonText: {
		fontSize: 12,
		fontWeight: '500',
	},
});
