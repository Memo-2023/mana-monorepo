import React from 'react';
import { TouchableOpacity, View, Text, StyleSheet, useWindowDimensions } from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useTheme } from '../ThemeProvider';

interface CreateItemButtonProps {
	onPress: () => void;
	variant?: 'card' | 'button';
	width?: number | 'auto';
	title?: string;
	buttonText?: string;
	icon?: keyof typeof MaterialIcons.glyphMap;
	buttonIcon?: keyof typeof MaterialIcons.glyphMap;
}

export const CreateItemButton: React.FC<CreateItemButtonProps> = ({
	onPress,
	variant = 'card',
	width = 'auto',
	title = 'Create New Item',
	buttonText = 'Create New',
	icon = 'add',
	buttonIcon = 'add-circle-outline',
}) => {
	const { theme } = useTheme();

	if (variant === 'button') {
		return (
			<TouchableOpacity
				style={[styles.createButton, { backgroundColor: theme.colors.primary }]}
				onPress={onPress}
			>
				<MaterialIcons name={buttonIcon} size={24} color="#FFFFFF" />
				<Text style={[styles.createButtonText, { color: '#FFFFFF' }]}>{buttonText}</Text>
			</TouchableOpacity>
		);
	}

	return (
		<TouchableOpacity
			style={[styles.itemContainer, { width }, { backgroundColor: 'transparent' }]}
			onPress={onPress}
		>
			<View style={styles.itemContent}>
				<View
					style={[styles.imageContainer, { backgroundColor: theme.colors.backgroundSecondary }]}
				>
					<View style={styles.placeholderContainer}>
						<MaterialIcons name={icon} size={48} color={theme.colors.textPrimary} />
					</View>
				</View>
				<View style={styles.textContainer}>
					<Text style={[styles.title, { color: theme.colors.textPrimary }]}>{title}</Text>
				</View>
			</View>
		</TouchableOpacity>
	);
};

const styles = StyleSheet.create({
	itemContainer: {
		marginVertical: 0,
		marginHorizontal: 0,
		borderRadius: 8,
		overflow: 'hidden',
		borderWidth: 1,
		borderColor: 'transparent',
	},
	itemContent: {
		flex: 1,
		gap: 8,
	},
	imageContainer: {
		aspectRatio: 16 / 9,
		borderRadius: 8,
		overflow: 'hidden',
	},
	placeholderContainer: {
		flex: 1,
		justifyContent: 'center',
		alignItems: 'center',
	},
	textContainer: {
		padding: 0,
		marginTop: 12,
	},
	title: {
		fontSize: 20,
		fontWeight: '600',
	},
	createButton: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'center',
		padding: 12,
		borderRadius: 8,
		marginTop: 16,
	},
	createButtonText: {
		marginLeft: 8,
		fontSize: 18,
		fontWeight: '600',
	},
});
