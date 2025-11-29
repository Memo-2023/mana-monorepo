import React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import Text from './Text';
import Icon from './Icon';

interface FilterChipProps {
	label: string;
	active: boolean;
	onPress: () => void;
	icon?: string;
	iconSet?: 'ionicons' | 'material';
	count?: number;
}

export default function FilterChip({
	label,
	active,
	onPress,
	icon,
	iconSet = 'ionicons',
	count,
}: FilterChipProps) {
	return (
		<TouchableOpacity
			onPress={onPress}
			style={[styles.chip, active && styles.chipActive]}
			activeOpacity={0.7}
		>
			{icon && <Icon set={iconSet} name={icon} size={16} color={active ? '#181818' : '#FFFFFF'} />}
			<Text style={[styles.chipText, active && styles.chipTextActive]}>{label}</Text>
			{count !== undefined && count > 0 && (
				<View style={[styles.countBadge, active && styles.countBadgeActive]}>
					<Text style={[styles.countText, active && styles.countTextActive]}>{count}</Text>
				</View>
			)}
		</TouchableOpacity>
	);
}

const styles = StyleSheet.create({
	chip: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 6,
		paddingHorizontal: 14,
		paddingVertical: 8,
		borderRadius: 20,
		backgroundColor: 'rgba(255, 255, 255, 0.1)',
		borderWidth: 1,
		borderColor: 'rgba(255, 255, 255, 0.15)',
	},
	chipActive: {
		backgroundColor: '#FFD700',
		borderColor: '#FFD700',
	},
	chipText: {
		fontSize: 14,
		fontWeight: '600',
		color: '#FFFFFF',
	},
	chipTextActive: {
		color: '#181818',
	},
	countBadge: {
		minWidth: 20,
		paddingHorizontal: 6,
		paddingVertical: 2,
		borderRadius: 10,
		backgroundColor: 'rgba(255, 255, 255, 0.2)',
		alignItems: 'center',
		justifyContent: 'center',
	},
	countBadgeActive: {
		backgroundColor: 'rgba(24, 24, 24, 0.2)',
	},
	countText: {
		fontSize: 11,
		fontWeight: '700',
		color: '#FFFFFF',
	},
	countTextActive: {
		color: '#181818',
	},
});
