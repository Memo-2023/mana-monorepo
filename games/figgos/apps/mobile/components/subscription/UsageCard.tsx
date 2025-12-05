import React from 'react';
import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../utils/ThemeContext';

export interface UsageDataProps {
	total: number;
	lastWeek: number;
	lastMonth: number;
	currentMana: number;
	maxMana: number;
	history?: Array<{
		date: string;
		amount: number;
	}>;
}

interface UsageCardProps {
	title: string;
	usageData: UsageDataProps;
}

export const UsageCard: React.FC<UsageCardProps> = ({ title, usageData }) => {
	const { theme } = useTheme();

	// Berechnung des Prozentsatzes für den Fortschrittsbalken
	const manaPercentage = Math.min(
		100,
		Math.round((usageData.currentMana / usageData.maxMana) * 100)
	);

	return (
		<View className="bg-[rgba(255,255,255,0.05)] rounded-xl p-4 border border-[rgba(255,255,255,0.1)]">
			<Text className="text-white text-xl font-bold mb-4">{title}</Text>

			{/* Mana-Fortschrittsbalken */}
			<View className="mb-6">
				<View className="flex-row justify-between mb-1">
					<Text className="text-[rgba(255,255,255,0.7)] text-sm">Aktuelles Mana</Text>
					<Text className="text-white text-sm font-bold">
						{usageData.currentMana} / {usageData.maxMana}
					</Text>
				</View>
				<View className="h-2.5 bg-[rgba(255,255,255,0.1)] rounded-full overflow-hidden">
					<View
						className="h-full rounded-full"
						style={{
							width: `${manaPercentage}%`,
							backgroundColor: theme.colors.primary,
						}}
					/>
				</View>
			</View>

			{/* Nutzungsstatistiken */}
			<View className="space-y-4">
				<View className="flex-row justify-between items-center">
					<View className="flex-row items-center">
						<Ionicons name="time-outline" size={18} color="rgba(255,255,255,0.7)" />
						<Text className="text-[rgba(255,255,255,0.7)] text-sm ml-2">Letzte Woche</Text>
					</View>
					<Text className="text-white text-base font-bold">{usageData.lastWeek} Mana</Text>
				</View>

				<View className="flex-row justify-between items-center">
					<View className="flex-row items-center">
						<Ionicons name="calendar-outline" size={18} color="rgba(255,255,255,0.7)" />
						<Text className="text-[rgba(255,255,255,0.7)] text-sm ml-2">Letzter Monat</Text>
					</View>
					<Text className="text-white text-base font-bold">{usageData.lastMonth} Mana</Text>
				</View>

				<View className="flex-row justify-between items-center">
					<View className="flex-row items-center">
						<Ionicons name="analytics-outline" size={18} color="rgba(255,255,255,0.7)" />
						<Text className="text-[rgba(255,255,255,0.7)] text-sm ml-2">Insgesamt</Text>
					</View>
					<Text className="text-white text-base font-bold">{usageData.total} Mana</Text>
				</View>
			</View>
		</View>
	);
};

export default UsageCard;
