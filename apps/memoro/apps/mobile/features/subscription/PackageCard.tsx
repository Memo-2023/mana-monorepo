import React from 'react';
import { View, Text } from 'react-native';
import { useTheme } from '../theme/ThemeProvider';
import { useTranslation } from 'react-i18next';
import SubscriptionButton from './SubscriptionButton';
import ManaIcon from './ManaIcon';
import colors from '~/tailwind.config.js';

export interface PackageProps {
	id: string;
	name: string;
	manaAmount: number;
	price: number;
	priceString: string;
	currencyCode: string;
	isTeamPackage?: boolean;
	isEnterprisePackage?: boolean;
	popular?: boolean;
}

interface PackageCardProps {
	package: PackageProps;
	onSelect: (packageId: string) => void;
}

export const PackageCard: React.FC<PackageCardProps> = ({ package: pkg, onSelect }) => {
	const { isDark, themeVariant, tw } = useTheme();
	const { t } = useTranslation();

	const formatPrice = (pkg: PackageProps) => {
		// Use priceString from RevenueCat if available, otherwise format the price
		return pkg.priceString || `${pkg.price.toFixed(2).replace('.', ',')}€`;
	};

	// Theme-aware colors using the same system as MemoPreview and SettingsToggle
	const themeColors = (colors as any).theme?.extend?.colors;
	const textColor = isDark ? '#FFFFFF' : '#000000';
	const secondaryTextColor = isDark ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.7)';
	const bgColor = isDark
		? themeColors?.dark?.[themeVariant]?.contentBackground || '#1E1E1E'
		: themeColors?.[themeVariant]?.contentBackground || '#FFFFFF';
	const borderColor = isDark
		? themeColors?.dark?.[themeVariant]?.border || '#424242'
		: themeColors?.[themeVariant]?.border || '#e6e6e6';
	const accentColor = '#4287f5'; // Konsistente Mana-Farbe für alle Abonnement-Komponenten
	const cardBgColor = isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)';

	// Package-specific colors and background sizes (blue variants)
	const getPackageStyles = () => {
		switch (pkg.id) {
			case 'Mana_Potion_Small_v1':
				return { bg: '#E3F2FD', icon: '#2196F3', bgSize: '45%' }; // Light blue 50 / Blue 500
			case 'Mana_Potion_Medium_v1':
				return { bg: '#BBDEFB', icon: '#1976D2', bgSize: '60%' }; // Light blue 100 / Blue 700
			case 'Mana_Potion_Large_v1':
				return { bg: '#90CAF9', icon: '#1565C0', bgSize: '75%' }; // Light blue 200 / Blue 800
			case 'Mana_Potion_Giant_v2':
				return { bg: '#64B5F6', icon: '#0D47A1', bgSize: '90%' }; // Light blue 300 / Blue 900
			default:
				return { bg: '#E1F5FE', icon: '#0288D1', bgSize: '50%' };
		}
	};

	const packageStyles = getPackageStyles();

	return (
		<View
			style={{
				backgroundColor: bgColor,
				borderRadius: 12,
				padding: 16,
				borderWidth: 1,
				borderColor: pkg.popular ? accentColor : borderColor,
			}}
		>
			{pkg.popular && (
				<View
					style={{
						position: 'absolute',
						top: -10,
						right: 16,
						backgroundColor: accentColor,
						borderRadius: 12,
						paddingHorizontal: 10,
						paddingVertical: 4,
					}}
				>
					<Text style={{ color: '#FFFFFF', fontSize: 12, fontWeight: 'bold' as const }}>
						{t('subscription.popular', 'Popular')}
					</Text>
				</View>
			)}

			{/* Package Name - full width */}
			<Text
				style={{
					color: textColor,
					fontSize: 18,
					fontWeight: 'bold' as const,
					marginBottom: 16,
					textAlign: 'center',
				}}
			>
				{pkg.name}
			</Text>

			{/* Three column layout */}
			<View
				style={{
					flexDirection: 'row',
					justifyContent: 'space-between',
					alignItems: 'center',
					marginBottom: 20,
					gap: 8,
				}}
			>
				{/* Mana Icon with background */}
				<View
					style={{
						flex: 1,
						aspectRatio: 1,
						backgroundColor: cardBgColor,
						borderRadius: 12,
						justifyContent: 'center',
						alignItems: 'center',
						minHeight: 80,
					}}
				>
					{/* Inner container that grows */}
					<View
						style={{
							width: packageStyles.bgSize,
							height: packageStyles.bgSize,
							backgroundColor: packageStyles.bg,
							borderRadius: 8,
							justifyContent: 'center',
							alignItems: 'center',
						}}
					>
						<ManaIcon size={32} color={packageStyles.icon} />
					</View>
				</View>

				{/* Mana Amount */}
				<View
					style={{
						flex: 1,
						aspectRatio: 1,
						backgroundColor: cardBgColor,
						borderRadius: 12,
						justifyContent: 'center',
						alignItems: 'center',
						minHeight: 80,
					}}
				>
					<Text
						style={{
							color: textColor,
							fontSize: 24,
							fontWeight: 'bold' as const,
							marginBottom: 2,
						}}
					>
						{pkg.manaAmount}
					</Text>
					<Text
						style={{
							color: secondaryTextColor,
							fontSize: 11,
							textAlign: 'center',
						}}
					>
						{t('subscription.mana', 'Mana')}
					</Text>
				</View>

				{/* Price */}
				<View
					style={{
						flex: 1,
						aspectRatio: 1,
						backgroundColor: cardBgColor,
						borderRadius: 12,
						justifyContent: 'center',
						alignItems: 'center',
						minHeight: 80,
					}}
				>
					<Text
						style={{
							color: textColor,
							fontSize: 22,
							fontWeight: 'bold' as const,
						}}
					>
						{formatPrice(pkg)}
					</Text>
					<Text
						style={{
							color: secondaryTextColor,
							fontSize: 10,
							marginTop: 2,
						}}
					>
						{t('subscription.one_time', 'Einmalig')}
					</Text>
				</View>
			</View>

			<SubscriptionButton
				label={t('subscription.buy', 'Buy')}
				onPress={() => onSelect(pkg.id)}
				iconName="arrow-forward-outline"
				leftIconName="cart-outline"
				variant={pkg.popular ? 'accent' : 'primary'}
			/>
		</View>
	);
};

export default PackageCard;
