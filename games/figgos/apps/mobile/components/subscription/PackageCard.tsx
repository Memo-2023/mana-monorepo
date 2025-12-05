import React from 'react';
import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../utils/ThemeContext';
import SubscriptionButton from './SubscriptionButton';

export interface PackageProps {
	id: string;
	name: string;
	manaAmount: number;
	price: number;
	isTeamPackage?: boolean;
	popular?: boolean;
}

interface PackageCardProps {
	package: PackageProps;
	onSelect: (packageId: string) => void;
}

export const PackageCard: React.FC<PackageCardProps> = ({ package: pkg, onSelect }) => {
	const { theme } = useTheme();

	const formatPrice = (price: number) => {
		return `${price.toFixed(2).replace('.', ',')}€`;
	};

	return (
		<View
			className={`bg-[rgba(255,255,255,${pkg.isTeamPackage ? '0.08' : '0.05'})] rounded-xl p-4 border ${pkg.isTeamPackage ? 'border-primary' : 'border-[rgba(255,255,255,0.1)]'}`}
			style={pkg.isTeamPackage ? { borderColor: theme.colors.primary } : {}}
		>
			{pkg.isTeamPackage && (
				<View
					className="absolute top-[-10px] right-4 rounded-xl px-2.5 py-1"
					style={{ backgroundColor: theme.colors.primary }}
				>
					<Text className="text-black text-xs font-bold">Team</Text>
				</View>
			)}

			<Text className="text-white text-xl font-bold mb-2">{pkg.name}</Text>
			<Text className="text-white text-2xl font-bold mb-1">{pkg.manaAmount} Mana</Text>
			<Text className="text-white text-xl font-bold">{formatPrice(pkg.price)}</Text>
			<Text className="text-[rgba(255,255,255,0.7)] text-sm mt-1 mb-4">
				({formatPrice(pkg.price / pkg.manaAmount)} pro Mana)
			</Text>

			<View className="mt-4">
				<SubscriptionButton
					label="Auswählen"
					onPress={() => onSelect(pkg.id)}
					iconName="chevron-forward"
					variant={pkg.popular ? 'accent' : 'primary'}
				/>
			</View>
		</View>
	);
};

export default PackageCard;
