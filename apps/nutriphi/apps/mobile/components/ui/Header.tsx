import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { SFSymbol } from './SFSymbol';

interface HeaderProps {
	title: string;
	onSettingsPress?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ title, onSettingsPress }) => {
	const handleSettingsPress = () => {
		if (onSettingsPress) {
			onSettingsPress();
		} else {
			router.push('/settings');
		}
	};

	return (
		<View className="flex-row items-center justify-between px-4 py-3">
			<Text className="text-2xl font-bold text-gray-900 dark:text-white">{title}</Text>
			<TouchableOpacity
				onPress={handleSettingsPress}
				className="p-2"
				accessibilityLabel="Settings"
				accessibilityRole="button"
			>
				<SFSymbol name="gearshape" fallbackIcon="cog" size={24} />
			</TouchableOpacity>
		</View>
	);
};
