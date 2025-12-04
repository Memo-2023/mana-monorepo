import React from 'react';
import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../utils/ThemeContext';

export interface CostItem {
	action: string;
	cost: number;
	icon: keyof typeof Ionicons.glyphMap;
}

interface CostCardProps {
	title: string;
	costs: CostItem[];
}

export const CostCard: React.FC<CostCardProps> = ({ title, costs }) => {
	const { theme } = useTheme();

	return (
		<View className="bg-[rgba(255,255,255,0.05)] rounded-xl p-4 border border-[rgba(255,255,255,0.1)] h-full">
			<Text className="text-white text-xl font-bold mb-4">{title}</Text>

			<View className="space-y-3">
				{costs.map((item, index) => (
					<View key={index} className="flex-row justify-between items-center">
						<View className="flex-row items-center">
							<Ionicons name={item.icon} size={18} color={theme.colors.primary} />
							<Text className="text-[rgba(255,255,255,0.8)] text-sm ml-2">{item.action}</Text>
						</View>
						<Text className="text-white text-base font-semibold">{item.cost} Mana</Text>
					</View>
				))}
			</View>
		</View>
	);
};

export default CostCard;
