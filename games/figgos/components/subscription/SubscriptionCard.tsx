import React from 'react';
import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../utils/ThemeContext';
import SubscriptionButton from './SubscriptionButton';

export interface SubscriptionPlanProps {
	id: string;
	name: string;
	price: number;
	priceUnit: string;
	priceBreakdown?: string;
	initialMana: number;
	dailyMana: number;
	maxMana: number;
	canGiftMana: boolean;
	popular?: boolean;
	billingCycle?: 'monthly' | 'yearly';
	monthlyEquivalent?: number;
}

interface SubscriptionCardProps {
	plan: SubscriptionPlanProps;
	onSelect: (planId: string) => void;
}

export const SubscriptionCard: React.FC<SubscriptionCardProps> = ({ plan, onSelect }) => {
	const { theme } = useTheme();

	const formatPrice = (price: number) => {
		return `${price.toFixed(2).replace('.', ',')}€`;
	};

	return (
		<View
			className={`bg-[rgba(255,255,255,0.05)] rounded-xl p-4 border ${plan.popular ? 'border-primary' : 'border-[rgba(255,255,255,0.1)]'}`}
			style={plan.popular ? { borderColor: theme.colors.primary } : {}}
		>
			{plan.popular && (
				<View
					className="absolute top-[-10px] right-4 rounded-xl px-2.5 py-1"
					style={{ backgroundColor: theme.colors.primary }}
				>
					<Text className="text-black text-xs font-bold">Beliebt</Text>
				</View>
			)}

			{/* Titel und Preis nebeneinander */}
			<View className="flex-row justify-between items-center mb-4">
				<Text className="text-white text-xl font-bold">{plan.name}</Text>
				<Text className="text-white text-xl font-bold">
					{formatPrice(plan.price)}
					<Text className="text-sm"> {plan.priceUnit}</Text>
				</Text>
			</View>

			{plan.priceBreakdown && (
				<Text className="text-[rgba(255,255,255,0.7)] text-xs text-right mb-4">
					{plan.priceBreakdown}
				</Text>
			)}

			{/* Beschreibungen in einer Komponente */}
			<View className="bg-[rgba(255,255,255,0.03)] rounded-lg p-4 mb-5">
				{/* Titel mit Icons */}
				<View className="flex-row items-center justify-between mb-4">
					<View className="flex-row items-center">
						<Ionicons name="gift-outline" size={18} color={theme.colors.primary} className="mr-2" />
						<Text className="text-[rgba(255,255,255,0.7)] text-sm">Geschenk</Text>
					</View>
					<View className="flex-row items-center">
						<Ionicons
							name="refresh-outline"
							size={18}
							color={theme.colors.primary}
							className="mr-2"
						/>
						<Text className="text-[rgba(255,255,255,0.7)] text-sm">Regeneration</Text>
					</View>
					<View className="flex-row items-center">
						<Ionicons name="save-outline" size={18} color={theme.colors.primary} className="mr-2" />
						<Text className="text-[rgba(255,255,255,0.7)] text-sm">Speicher</Text>
					</View>
				</View>

				{/* Tabellenwerte mit größeren Zahlen */}
				<View className="flex-row justify-between">
					<View className="flex-1 items-center">
						<Text className="text-white text-xl font-semibold">{plan.initialMana}</Text>
					</View>
					<View className="flex-1 items-center">
						<Text className="text-white text-xl font-semibold">{plan.dailyMana}/Tag</Text>
					</View>
					<View className="flex-1 items-center">
						<Text className="text-white text-xl font-semibold">Max. {plan.maxMana}</Text>
					</View>
				</View>
			</View>

			{/* Mana verschenken Badge für bezahlte Pläne */}
			{plan.id !== 'free' && plan.canGiftMana && (
				<View className="flex-row items-center justify-center mb-4">
					<Ionicons name="gift" size={16} color={theme.colors.primary} className="mr-1" />
					<Text className="text-[rgba(255,255,255,0.7)] text-sm">Mana verschenken möglich</Text>
				</View>
			)}

			<SubscriptionButton
				label="Auswählen"
				onPress={() => onSelect(plan.id)}
				iconName="chevron-forward"
				variant={plan.popular ? 'accent' : 'primary'}
			/>

			{/* Mana verschenken Info unter dem Button für Free-Tier */}
			{plan.id === 'free' && (
				<Text className="text-[rgba(255,255,255,0.5)] text-xs text-center mt-3">
					Im kostenlosen Plan ist das Verschenken von Mana nicht möglich.
				</Text>
			)}
		</View>
	);
};

export default SubscriptionCard;
