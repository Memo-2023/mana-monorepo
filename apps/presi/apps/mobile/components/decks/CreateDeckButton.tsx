import React from 'react';
import { TouchableOpacity, View, Text, StyleSheet, useWindowDimensions } from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useTheme } from '../ThemeProvider';

interface CreateDeckButtonProps {
	onPress: () => void;
	variant?: 'card' | 'button';
	width?: number | 'auto';
}

export const CreateDeckButton: React.FC<CreateDeckButtonProps> = ({
	onPress,
	variant = 'card',
	width = 'auto',
}) => {
	const { theme } = useTheme();

	if (variant === 'button') {
		return (
			<TouchableOpacity
				style={[styles.createButton, { backgroundColor: theme.colors.primary }]}
				onPress={onPress}
			>
				<MaterialIcons name="add-circle-outline" size={24} color="#FFFFFF" />
				<Text style={[styles.createButtonText, { color: '#FFFFFF' }]}>Create your first deck</Text>
			</TouchableOpacity>
		);
	}

	return (
		<TouchableOpacity
			style={[styles.deckContainer, { width }, { backgroundColor: 'transparent' }]}
			onPress={onPress}
		>
			<View style={styles.deckContent}>
				<View
					style={[styles.imageContainer, { backgroundColor: theme.colors.backgroundSecondary }]}
				>
					<View style={styles.placeholderContainer}>
						<MaterialIcons name="add" size={48} color={theme.colors.textPrimary} />
					</View>
				</View>
				<View style={styles.textContainer}>
					<Text style={[styles.title, { color: theme.colors.textPrimary }]}>Create New Deck</Text>
				</View>
			</View>
		</TouchableOpacity>
	);
};

const styles = StyleSheet.create({
	deckContainer: {
		marginVertical: 8,
		marginHorizontal: 8,
		borderRadius: 12,
		overflow: 'hidden',
	},
	deckContent: {
		flex: 1,
	},
	imageContainer: {
		aspectRatio: 16 / 9,
		borderRadius: 12,
		overflow: 'hidden',
	},
	placeholderContainer: {
		flex: 1,
		justifyContent: 'center',
		alignItems: 'center',
	},
	textContainer: {
		padding: 12,
	},
	title: {
		fontSize: 16,
		fontWeight: '600',
	},
	createButton: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'center',
		padding: 16,
		borderRadius: 12,
		marginTop: 16,
	},
	createButtonText: {
		marginLeft: 8,
		fontSize: 16,
		fontWeight: '600',
	},
});
