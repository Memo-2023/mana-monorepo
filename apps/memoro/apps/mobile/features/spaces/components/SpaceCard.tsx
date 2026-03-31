import React from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import { useTheme } from '~/features/theme/ThemeProvider';
import Text from '~/components/atoms/Text';
import Icon from '~/components/atoms/Icon';
import colors from '~/tailwind.config.js';
import { Space } from '~/features/spaces';

interface SpaceCardProps {
	space: Space;
	onPress: (id: string) => void;
	onEdit?: (space: Space) => void;
	onDelete?: (space: Space) => void;
}

const SpaceCard: React.FC<SpaceCardProps> = (props) => {
	const { space, onPress, onEdit, onDelete } = props;
	const { isDark, themeVariant } = useTheme();

	// Background colors
	const iconBgColor = isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)';
	const backgroundColor = isDark
		? (colors as any).theme?.extend?.colors?.dark?.[themeVariant]?.contentBackground
		: (colors as any).theme?.extend?.colors?.[themeVariant]?.contentBackground;

	// Render badge if space is default
	const renderBadge = () => {
		if (!space.isDefault) return null;

		return (
			<View style={[styles.badge, { backgroundColor: space.color || '#78909C' }]}>
				<Text style={styles.badgeText}>Standard</Text>
			</View>
		);
	};

	// Render description if available
	const renderDescription = () => {
		if (!space.description) return null;

		return (
			<Text
				style={[
					styles.spaceDescription,
					{ color: isDark ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.7)' },
				]}
				numberOfLines={2}
				ellipsizeMode="tail"
			>
				{space.description}
			</Text>
		);
	};

	// Render edit button if callback provided
	const renderEditButton = () => {
		if (!onEdit) return null;

		return (
			<View style={styles.actionContainer}>
				<Pressable
					onPress={() => onEdit(space)}
					style={({ pressed }) => [styles.spaceAction, pressed && styles.spaceActionPressed]}
				>
					<View style={[styles.iconContainer, { backgroundColor: iconBgColor }]}>
						<Icon name="pencil-outline" size={24} color={isDark ? '#CCCCCC' : '#666666'} />
					</View>
				</Pressable>
			</View>
		);
	};

	// Render delete/leave button if callback provided
	const renderDeleteButton = () => {
		if (!onDelete) return null;

		return (
			<View style={styles.actionContainer}>
				<Pressable
					onPress={() => onDelete(space)}
					style={({ pressed }) => [styles.spaceAction, pressed && styles.spaceActionPressed]}
				>
					<View style={[styles.iconContainer, { backgroundColor: iconBgColor }]}>
						{space.isOwner ? (
							<Icon name="trash-outline" size={24} color={isDark ? '#CCCCCC' : '#666666'} />
						) : (
							<Icon name="exit-outline" size={24} color={isDark ? '#CCCCCC' : '#666666'} />
						)}
					</View>
				</Pressable>
			</View>
		);
	};

	// Render action buttons if any callbacks provided
	const renderActions = () => {
		if (!onEdit && !onDelete) return null;

		return (
			<View style={styles.spaceActions}>
				{renderEditButton()}
				{renderDeleteButton()}
			</View>
		);
	};

	return (
		<View style={[styles.spaceElement, { backgroundColor }]}>
			<Pressable style={styles.spaceContent} onPress={() => onPress(space.id)}>
				<View
					style={[styles.spaceColorIndicator, { backgroundColor: space.color || '#78909C' }]}
				></View>
				<View style={styles.spaceInfo}>
					<Text style={[styles.spaceName, { color: isDark ? '#FFFFFF' : '#000000' }]}>
						{space.name || 'Unbenannt'}
					</Text>
					{renderDescription()}
					{renderBadge()}
				</View>
			</Pressable>

			<View style={styles.memoCountWrapper}>
				<View
					style={[
						styles.memoCountContainer,
						{ borderColor: isDark ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.2)' },
					]}
				>
					<Text
						style={[
							styles.spaceCount,
							{ color: isDark ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.7)' },
						]}
					>
						{space.memoCount || 0} Memos
					</Text>
				</View>
			</View>

			{renderActions()}
		</View>
	);
};

const styles = StyleSheet.create({
	spaceElement: {
		flexDirection: 'row',
		alignItems: 'center',
		borderRadius: 12,
		marginBottom: 16,
		borderWidth: 1.5,
		borderColor: 'rgba(0, 0, 0, 0.1)',
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 1 },
		shadowOpacity: 0.1,
		shadowRadius: 2,
		elevation: 2,
		minHeight: 120, // Erhöhte Höhe der Komponente
	},
	spaceContent: {
		flex: 1,
		flexDirection: 'row',
		alignItems: 'center',
		paddingVertical: 20, // Mehr vertikaler Abstand
		paddingHorizontal: 20,
	},
	spaceInfo: {
		flex: 1,
	},
	spaceColorIndicator: {
		width: 28, // Größerer Farbindikator
		height: 28, // Größerer Farbindikator
		borderRadius: 14,
		marginRight: 16, // Mehr Abstand zum Text
		borderWidth: 1,
		borderColor: 'rgba(0, 0, 0, 0.1)',
	},
	spaceName: {
		fontSize: 20, // Größerer Titel
		fontWeight: '600', // Etwas fetter
		marginBottom: 4, // Abstand zur Beschreibung
	},
	spaceDescription: {
		fontSize: 14,
		marginTop: 2,
	},
	memoCountWrapper: {
		position: 'absolute',
		bottom: 12,
		left: 64, // Abstand vom linken Rand, nach dem Farbindikator
	},
	memoCountContainer: {
		borderWidth: 1,
		borderRadius: 12,
		paddingVertical: 4,
		paddingHorizontal: 8,
		borderColor: 'rgba(0, 0, 0, 0.2)',
	},
	spaceCount: {
		fontSize: 12,
	},
	badge: {
		paddingHorizontal: 6,
		paddingVertical: 2,
		borderRadius: 4,
		alignSelf: 'flex-start',
		marginTop: 8,
	},
	badgeText: {
		color: '#FFFFFF',
		fontSize: 10,
		fontWeight: 'bold',
	},
	spaceActions: {
		flexDirection: 'row',
		paddingRight: 12,
		alignItems: 'center',
	},
	actionContainer: {
		marginLeft: 8,
		borderRadius: 8,
		overflow: 'hidden',
	},
	iconContainer: {
		width: 40,
		height: 40,
		justifyContent: 'center',
		alignItems: 'center',
		borderRadius: 8,
	},
	spaceAction: {
		borderRadius: 8,
	},
	spaceActionPressed: {
		opacity: 0.7,
		backgroundColor: 'rgba(0, 0, 0, 0.05)',
	},
});

export default SpaceCard;
