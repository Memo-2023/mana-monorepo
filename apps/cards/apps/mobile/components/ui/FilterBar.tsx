import React from 'react';
import { View, ScrollView, Pressable } from 'react-native';
import { Text } from './Text';
import { Icon } from './Icon';
import { useThemeColors } from '~/utils/themeUtils';

export type FilterOption = {
	id: string;
	label: string;
	icon?: string;
	iconLibrary?: 'Ionicons' | 'FontAwesome' | 'MaterialIcons' | 'Feather';
	count?: number;
};

interface FilterBarProps {
	options: FilterOption[];
	activeFilter: string;
	onFilterChange: (filterId: string) => void;
}

export const FilterBar: React.FC<FilterBarProps> = ({ options, activeFilter, onFilterChange }) => {
	const colors = useThemeColors();

	return (
		<View
			style={{
				backgroundColor: colors.background,
				borderTopWidth: 1,
				borderTopColor: colors.border,
				shadowColor: '#000',
				shadowOffset: { width: 0, height: -2 },
				shadowOpacity: 0.05,
				shadowRadius: 3,
				elevation: 5,
			}}
		>
			<ScrollView
				horizontal
				showsHorizontalScrollIndicator={false}
				contentContainerStyle={{
					paddingHorizontal: 16,
					paddingVertical: 12,
				}}
			>
				{options.map((option) => {
					const isActive = activeFilter === option.id;

					return (
						<Pressable
							key={option.id}
							onPress={() => onFilterChange(option.id)}
							style={({ pressed }) => ({
								flexDirection: 'row',
								alignItems: 'center',
								paddingHorizontal: 16,
								paddingVertical: 8,
								borderRadius: 20,
								backgroundColor: isActive ? colors.primary : colors.muted,
								opacity: pressed ? 0.7 : 1,
								marginRight: 8,
							})}
						>
							{option.icon && (
								<Icon
									name={option.icon}
									size={16}
									library={option.iconLibrary || 'Ionicons'}
									color={isActive ? 'white' : colors.mutedForeground}
									style={{ marginRight: 6 }}
								/>
							)}
							<Text
								style={{
									color: isActive ? 'white' : colors.mutedForeground,
									fontSize: 14,
									fontWeight: '600',
								}}
							>
								{option.label}
							</Text>
							{option.count !== undefined && (
								<View
									style={{
										backgroundColor: isActive ? 'rgba(255,255,255,0.2)' : colors.background,
										paddingHorizontal: 6,
										paddingVertical: 2,
										borderRadius: 10,
										marginLeft: 6,
									}}
								>
									<Text
										style={{
											color: isActive ? 'white' : colors.mutedForeground,
											fontSize: 12,
											fontWeight: '600',
										}}
									>
										{option.count}
									</Text>
								</View>
							)}
						</Pressable>
					);
				})}
			</ScrollView>
		</View>
	);
};
