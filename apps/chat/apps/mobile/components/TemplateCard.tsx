import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@react-navigation/native';
import { useAppTheme } from '../theme/ThemeProvider';

// Typ für die Template-Props
interface TemplateCardProps {
	id: string;
	name: string;
	description?: string | null;
	systemPrompt: string;
	color?: string;
	isDefault?: boolean;
	onPress: (id: string) => void;
	onEdit?: (id: string) => void;
	onDelete?: (id: string) => void;
	onSetDefault?: (id: string) => void;
}

export default function TemplateCard({
	id,
	name,
	description,
	systemPrompt,
	color = '#0A84FF',
	isDefault = false,
	onPress,
	onEdit,
	onDelete,
	onSetDefault,
}: TemplateCardProps) {
	const { colors } = useTheme();
	const { isDarkMode } = useAppTheme();

	const backgroundColor = isDarkMode ? '#2C2C2E' : '#FFFFFF';
	const textColor = isDarkMode ? '#FFFFFF' : '#000000';
	const secondaryTextColor = isDarkMode ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.7)';

	// Kürze den System-Prompt für die Anzeige
	const truncatedPrompt =
		systemPrompt.length > 80 ? systemPrompt.substring(0, 80) + '...' : systemPrompt;

	return (
		<TouchableOpacity
			style={[styles.container, { backgroundColor }, isDefault && styles.defaultContainer]}
			onPress={() => onPress(id)}
		>
			{/* Farbiger Indikator am linken Rand */}
			<View style={[styles.colorIndicator, { backgroundColor: color }]} />

			<View style={styles.content}>
				<View style={styles.header}>
					<Text style={[styles.name, { color: textColor }]}>{name}</Text>

					{isDefault && (
						<View style={styles.defaultBadge}>
							<Text style={styles.defaultText}>Standard</Text>
						</View>
					)}
				</View>

				{description && (
					<Text style={[styles.description, { color: secondaryTextColor }]} numberOfLines={2}>
						{description}
					</Text>
				)}

				<Text style={[styles.prompt, { color: secondaryTextColor }]} numberOfLines={2}>
					{truncatedPrompt}
				</Text>
			</View>

			{/* Aktionen */}
			<View style={styles.actions}>
				{onSetDefault && !isDefault && (
					<TouchableOpacity style={styles.actionButton} onPress={() => onSetDefault(id)}>
						<Ionicons name="star-outline" size={20} color={isDarkMode ? '#FFFFFF' : '#666666'} />
					</TouchableOpacity>
				)}

				{onEdit && (
					<TouchableOpacity style={styles.actionButton} onPress={() => onEdit(id)}>
						<Ionicons name="pencil" size={20} color={isDarkMode ? '#FFFFFF' : '#666666'} />
					</TouchableOpacity>
				)}

				{onDelete && (
					<TouchableOpacity style={styles.actionButton} onPress={() => onDelete(id)}>
						<Ionicons name="trash-outline" size={20} color={isDarkMode ? '#FFFFFF' : '#666666'} />
					</TouchableOpacity>
				)}
			</View>
		</TouchableOpacity>
	);
}

const styles = StyleSheet.create({
	container: {
		flexDirection: 'row',
		borderRadius: 12,
		marginBottom: 12,
		overflow: 'hidden',
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.1,
		shadowRadius: 4,
		elevation: 3,
	},
	defaultContainer: {
		borderWidth: 1,
		borderColor: '#0A84FF',
	},
	colorIndicator: {
		width: 8,
		alignSelf: 'stretch',
	},
	content: {
		flex: 1,
		padding: 16,
	},
	header: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		marginBottom: 8,
	},
	name: {
		fontSize: 16,
		fontWeight: '600',
		flex: 1,
	},
	defaultBadge: {
		backgroundColor: '#0A84FF',
		paddingHorizontal: 6,
		paddingVertical: 2,
		borderRadius: 4,
		marginLeft: 8,
	},
	defaultText: {
		color: 'white',
		fontSize: 10,
		fontWeight: '600',
	},
	description: {
		fontSize: 14,
		marginBottom: 8,
	},
	prompt: {
		fontSize: 12,
		fontStyle: 'italic',
	},
	actions: {
		padding: 8,
		justifyContent: 'center',
	},
	actionButton: {
		padding: 8,
	},
});
