import React from 'react';
import { View, Pressable, ViewStyle, PressableProps } from 'react-native';
import { Text } from '../Text';
import { Icon } from '../Icon';

export type ToggleOption<T = string> = {
	value: T;
	label: string;
	icon?: string;
};

export type ToggleGroupProps<T = string> = {
	/** Options to display */
	options: ToggleOption<T>[];
	/** Currently selected value */
	value: T;
	/** Callback when value changes */
	onChange: (value: T) => void;
	/** Disable all options */
	disabled?: boolean;
	/** Background color for unselected options */
	backgroundColor?: string;
	/** Border color for unselected options */
	borderColor?: string;
	/** Background color for selected option */
	selectedBackgroundColor?: string;
	/** Border color for selected option */
	selectedBorderColor?: string;
	/** Text color for unselected options */
	textColor?: string;
	/** Text color for selected option */
	selectedTextColor?: string;
	/** Icon color for unselected options */
	iconColor?: string;
	/** Icon color for selected option */
	selectedIconColor?: string;
	/** Size of the toggle */
	size?: 'sm' | 'md' | 'lg';
	/** Additional styles */
	style?: ViewStyle;
};

const sizeConfig = {
	sm: {
		paddingVertical: 8,
		paddingHorizontal: 12,
		iconSize: 16,
		gap: 6,
	},
	md: {
		paddingVertical: 12,
		paddingHorizontal: 16,
		iconSize: 20,
		gap: 8,
	},
	lg: {
		paddingVertical: 16,
		paddingHorizontal: 20,
		iconSize: 24,
		gap: 10,
	},
};

export function ToggleGroup<T = string>({
	options,
	value,
	onChange,
	disabled = false,
	backgroundColor = '#F3F4F6',
	borderColor = '#E5E7EB',
	selectedBackgroundColor = '#3B82F6',
	selectedBorderColor = '#3B82F6',
	textColor = '#111827',
	selectedTextColor = '#FFFFFF',
	iconColor = '#6B7280',
	selectedIconColor = '#FFFFFF',
	size = 'md',
	style,
}: ToggleGroupProps<T>) {
	const config = sizeConfig[size];

	return (
		<View style={[{ flexDirection: 'row', gap: config.gap }, style]}>
			{options.map((option) => {
				const isSelected = value === option.value;

				return (
					<Pressable
						key={String(option.value)}
						onPress={() => !disabled && onChange(option.value)}
						disabled={disabled}
						style={({ pressed }) => ({
							backgroundColor: isSelected ? selectedBackgroundColor : backgroundColor,
							borderColor: isSelected ? selectedBorderColor : borderColor,
							borderWidth: 1,
							flex: 1,
							flexDirection: 'row',
							alignItems: 'center',
							justifyContent: 'center',
							paddingVertical: config.paddingVertical,
							paddingHorizontal: config.paddingHorizontal,
							borderRadius: 12,
							opacity: disabled ? 0.5 : pressed ? 0.7 : 1,
						})}
					>
						{option.icon && (
							<Icon
								name={option.icon}
								size={config.iconSize}
								color={isSelected ? selectedIconColor : iconColor}
								style={{ marginRight: config.gap }}
							/>
						)}
						<Text
							variant={size === 'sm' ? 'caption' : 'body'}
							weight="medium"
							color={isSelected ? selectedTextColor : textColor}
						>
							{option.label}
						</Text>
					</Pressable>
				);
			})}
		</View>
	);
}
