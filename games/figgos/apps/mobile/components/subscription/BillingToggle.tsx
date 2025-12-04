import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { useTheme } from '../../utils/ThemeContext';
import SubscriptionButton from './SubscriptionButton';

export type BillingCycle = 'monthly' | 'yearly';

interface BillingToggleProps {
	billingCycle: BillingCycle;
	onChange: (cycle: BillingCycle) => void;
	yearlyDiscount?: string;
}

export const BillingToggle: React.FC<BillingToggleProps> = ({
	billingCycle,
	onChange,
	yearlyDiscount = '50%',
}) => {
	const { theme } = useTheme();

	return (
		<View className="flex-row bg-[rgba(255,255,255,0.05)] rounded-lg mb-6 p-1 md:max-w-md md:mx-auto">
			<Pressable
				className={`flex-1 py-3 items-center rounded-md flex-row justify-center ${billingCycle === 'monthly' ? 'bg-[rgba(255,255,255,0.1)]' : ''}`}
				onPress={() => onChange('monthly')}
			>
				<Text
					className={`text-white text-sm md:text-base font-medium ${billingCycle === 'monthly' ? 'font-semibold' : ''}`}
					style={billingCycle === 'monthly' ? { color: theme.colors.primary } : {}}
				>
					Monatlich
				</Text>
			</Pressable>
			<Pressable
				className={`flex-1 py-3 items-center rounded-md flex-row justify-center ${billingCycle === 'yearly' ? 'bg-[rgba(255,255,255,0.1)]' : ''}`}
				onPress={() => onChange('yearly')}
			>
				<Text
					className={`text-white text-sm md:text-base font-medium ${billingCycle === 'yearly' ? 'font-semibold' : ''}`}
					style={billingCycle === 'yearly' ? { color: theme.colors.primary } : {}}
				>
					Jährlich
				</Text>
				{yearlyDiscount && (
					<View
						className="bg-primary rounded-xl px-2 py-0.5 ml-2"
						style={{ backgroundColor: theme.colors.primary }}
					>
						<Text className="text-black text-[10px] md:text-xs font-bold">
							{yearlyDiscount} Rabatt
						</Text>
					</View>
				)}
			</Pressable>
		</View>
	);
};

export default BillingToggle;
