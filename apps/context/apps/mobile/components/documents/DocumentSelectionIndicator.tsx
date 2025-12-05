import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '~/utils/theme/theme';

interface DocumentSelectionIndicatorProps {
	isSelected: boolean;
	onToggle: () => void;
}

export const DocumentSelectionIndicator: React.FC<DocumentSelectionIndicatorProps> = ({
	isSelected,
	onToggle,
}) => {
	const { isDark } = useTheme();

	return (
		<TouchableOpacity
			style={[
				styles.container,
				{
					backgroundColor: isSelected
						? isDark
							? 'rgba(99, 102, 241, 0.08)'
							: 'rgba(79, 70, 229, 0.05)'
						: 'transparent',
				},
			]}
			onPress={onToggle}
			activeOpacity={0.7}
		>
			<View
				style={[
					styles.indicator,
					{
						backgroundColor: isSelected ? (isDark ? '#6366f1' : '#4f46e5') : 'transparent',
						borderColor: isSelected
							? isDark
								? '#6366f1'
								: '#4f46e5'
							: isDark
								? '#4b5563'
								: '#d1d5db',
					},
				]}
			>
				{isSelected && <Ionicons name="checkmark" size={16} color="#ffffff" style={styles.icon} />}
			</View>
		</TouchableOpacity>
	);
};

const styles = StyleSheet.create({
	container: {
		position: 'absolute',
		right: 0,
		top: 0,
		bottom: 0,
		width: 40,
		justifyContent: 'center',
		alignItems: 'center',
		zIndex: 10,
	},
	indicator: {
		width: 20,
		height: 20,
		borderRadius: 0, // Eckige Border
		borderWidth: 1,
		justifyContent: 'center',
		alignItems: 'center',
	},
	icon: {
		marginTop: -1,
	},
});
