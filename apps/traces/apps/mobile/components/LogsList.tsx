import { FontAwesome } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, View, Text, FlatList, TouchableOpacity } from 'react-native';

import { LogEntry } from '~/app/(tabs)/logs';
import { useTheme } from '../utils/themeContext';

interface LogsListProps {
	logs: LogEntry[];
	isDarkMode?: boolean;
}

export const LogsList: React.FC<LogsListProps> = ({ logs, isDarkMode = false }) => {
	const { colors } = useTheme();
	const formatDate = (timestamp: number) => {
		const date = new Date(timestamp);
		return date.toLocaleDateString('de-DE', {
			day: '2-digit',
			month: '2-digit',
			year: 'numeric',
		});
	};

	const formatTime = (timestamp: number) => {
		const date = new Date(timestamp);
		return date.toLocaleTimeString('de-DE', {
			hour: '2-digit',
			minute: '2-digit',
			second: '2-digit',
		});
	};

	const getLevelIcon = (
		level: string
	): { name: React.ComponentProps<typeof FontAwesome>['name']; color: string } => {
		switch (level) {
			case 'info':
				return { name: 'info-circle', color: colors.primary };
			case 'warning':
				return { name: 'exclamation-triangle', color: isDarkMode ? '#FFC107' : '#FF9800' };
			case 'error':
				return { name: 'exclamation-circle', color: isDarkMode ? '#F44336' : '#F44336' };
			default:
				return { name: 'circle', color: isDarkMode ? '#AAAAAA' : '#888888' };
		}
	};

	const renderItem = ({ item }: { item: LogEntry }) => {
		const icon = getLevelIcon(item.level);

		return (
			<View
				style={[
					styles.item,
					isDarkMode && {
						backgroundColor: '#1E1E1E',
						shadowColor: '#000000',
						shadowOpacity: 0.3,
					},
				]}
			>
				<View style={styles.iconContainer}>
					<FontAwesome name={icon.name} size={20} color={icon.color} />
				</View>
				<View style={styles.contentContainer}>
					<View style={styles.headerRow}>
						<Text style={[styles.level, { color: icon.color }]}>{item.level.toUpperCase()}</Text>
						<Text style={[styles.timestamp, isDarkMode && { color: '#AAAAAA' }]}>
							{formatDate(item.timestamp)} {formatTime(item.timestamp)}
						</Text>
					</View>
					<Text style={[styles.message, isDarkMode && { color: '#FFFFFF' }]}>{item.message}</Text>
					{item.details && (
						<View style={[styles.detailsContainer, isDarkMode && { backgroundColor: '#2A2A2A' }]}>
							<Text style={[styles.detailsText, isDarkMode && { color: '#BBBBBB' }]}>
								{typeof item.details === 'object'
									? JSON.stringify(item.details, null, 2)
									: String(item.details)}
							</Text>
						</View>
					)}
				</View>
			</View>
		);
	};

	return (
		<FlatList
			data={[...logs].reverse()}
			renderItem={renderItem}
			keyExtractor={(item) => item.id}
			contentContainerStyle={[styles.listContent, isDarkMode && { backgroundColor: '#121212' }]}
			ListEmptyComponent={
				<View style={styles.emptyContainer}>
					<FontAwesome name="file-text-o" size={48} color={isDarkMode ? '#444444' : '#ccc'} />
					<Text style={[styles.emptyText, isDarkMode && { color: '#AAAAAA' }]}>
						Keine Logs vorhanden
					</Text>
					<Text style={[styles.emptySubtext, isDarkMode && { color: '#777777' }]}>
						Beim Start des Location-Trackings werden Logs generiert
					</Text>
				</View>
			}
		/>
	);
};

const styles = StyleSheet.create({
	listContent: {
		padding: 16,
		paddingBottom: 32,
	},
	item: {
		flexDirection: 'row',
		backgroundColor: 'white',
		borderRadius: 8,
		marginBottom: 12,
		padding: 12,
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 1 },
		shadowOpacity: 0.1,
		shadowRadius: 2,
		elevation: 2,
	},
	iconContainer: {
		width: 32,
		justifyContent: 'center',
		alignItems: 'center',
		marginRight: 12,
	},
	contentContainer: {
		flex: 1,
	},
	headerRow: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		marginBottom: 8,
		alignItems: 'center',
	},
	level: {
		fontSize: 12,
		fontWeight: 'bold',
		paddingHorizontal: 6,
		paddingVertical: 2,
		borderRadius: 4,
	},
	timestamp: {
		fontSize: 12,
		color: '#666',
	},
	message: {
		fontSize: 14,
		marginBottom: 8,
	},
	detailsContainer: {
		backgroundColor: '#f5f5f5',
		padding: 8,
		borderRadius: 4,
		marginTop: 4,
	},
	detailsText: {
		fontSize: 12,
		color: '#333',
		fontFamily: 'monospace',
	},
	emptyContainer: {
		alignItems: 'center',
		justifyContent: 'center',
		padding: 48,
	},
	emptyText: {
		fontSize: 16,
		fontWeight: 'bold',
		color: '#666',
		marginTop: 16,
	},
	emptySubtext: {
		fontSize: 14,
		color: '#999',
		textAlign: 'center',
		marginTop: 8,
	},
});
