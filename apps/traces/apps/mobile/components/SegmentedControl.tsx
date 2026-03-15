import { FontAwesome } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';

import { useTheme } from '~/utils/themeContext';

export interface SegmentedControlOption {
	value: string;
	label: string;
	icon: keyof typeof FontAwesome.glyphMap;
	badge?: number;
}

interface SegmentedControlProps {
	options: SegmentedControlOption[];
	activeValue: string;
	onChange: (value: string) => void;
	isDarkMode?: boolean;
}

export const SegmentedControl: React.FC<SegmentedControlProps> = ({
	options,
	activeValue,
	onChange,
	isDarkMode = false,
}) => {
	const { colors } = useTheme();

	return (
		<View style={[styles.container, isDarkMode && { backgroundColor: colors.backgroundSecondary }]}>
			{options.map((option) => {
				const isActive = activeValue === option.value;

				return (
					<TouchableOpacity
						key={option.value}
						style={[
							styles.button,
							isActive && [styles.activeButton, { backgroundColor: colors.primary }],
							isDarkMode && { backgroundColor: colors.backgroundTertiary },
						]}
						onPress={() => onChange(option.value)}
					>
						<FontAwesome
							name={option.icon}
							size={14}
							color={
								isActive ? '#FFFFFF' : isDarkMode ? colors.textSecondary : colors.textSecondary
							}
							style={styles.buttonIcon}
						/>
						<Text
							style={[
								styles.buttonText,
								isActive && styles.activeButtonText,
								!isActive && { color: isDarkMode ? colors.textSecondary : colors.textSecondary },
							]}
						>
							{option.label}
						</Text>
						{option.badge !== undefined && (
							<View style={[styles.badge, { backgroundColor: colors.warning }]}>
								<Text style={styles.badgeText}>{option.badge}</Text>
							</View>
						)}
					</TouchableOpacity>
				);
			})}
		</View>
	);
};

const styles = StyleSheet.create({
	container: {
		position: 'absolute',
		bottom: 0,
		left: 0,
		right: 0,
		flexDirection: 'row',
		backgroundColor: 'white',
		marginHorizontal: 16,
		marginBottom: 100,
		borderRadius: 8,
		shadowColor: '#000',
		shadowOffset: { width: 0, height: -2 },
		shadowOpacity: 0.1,
		shadowRadius: 4,
		elevation: 8,
		padding: 4,
	},
	button: {
		flex: 1,
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'center',
		paddingVertical: 12,
		borderRadius: 6,
		marginHorizontal: 4,
	},
	activeButton: {
		// backgroundColor set dynamically via colors.primary
	},
	buttonText: {
		fontSize: 12,
		color: '#666666',
		fontWeight: '500',
	},
	activeButtonText: {
		color: 'white',
		fontWeight: 'bold',
	},
	buttonIcon: {
		marginRight: 6,
	},
	badge: {
		// backgroundColor set dynamically via colors.warning
		borderRadius: 10,
		paddingHorizontal: 6,
		paddingVertical: 2,
		marginLeft: 6,
	},
	badgeText: {
		color: 'white',
		fontSize: 10,
		fontWeight: 'bold',
	},
});
