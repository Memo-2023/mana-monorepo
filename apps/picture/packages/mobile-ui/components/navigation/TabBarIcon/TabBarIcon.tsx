import React from 'react';
import { ViewStyle } from 'react-native';
import { Icon } from '../../ui/Icon';

export type TabBarIconProps = {
	/** Icon name */
	name: string;
	/** Icon color */
	color: string;
	/** Icon size */
	size?: number;
	/** Is the tab focused */
	focused?: boolean;
	/** Additional styles */
	style?: ViewStyle;
};

export function TabBarIcon({ name, color, size = 28, focused = false, style }: TabBarIconProps) {
	return (
		<Icon
			name={name}
			size={size}
			color={color}
			style={[
				{
					marginBottom: -3, // Optical alignment for tab bars
				},
				style,
			]}
		/>
	);
}
