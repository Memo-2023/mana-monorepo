import React from 'react';
import { Switch as RNSwitch, SwitchProps } from 'react-native';
import { useTheme } from '../ThemeProvider';

export interface CustomSwitchProps extends Omit<SwitchProps, 'trackColor' | 'thumbColor'> {
	value: boolean;
	onValueChange: (value: boolean) => void;
}

export function Switch({ value, onValueChange, ...props }: CustomSwitchProps) {
	const { colors } = useTheme();

	return (
		<RNSwitch
			value={value}
			onValueChange={onValueChange}
			trackColor={{
				false: colors.muted,
				true: colors.primary,
			}}
			thumbColor={value ? colors.background : colors.mutedForeground}
			ios_backgroundColor={colors.muted}
			{...props}
		/>
	);
}
