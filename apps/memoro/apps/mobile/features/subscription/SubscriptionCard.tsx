import React from 'react';
import { View, Text } from 'react-native';
import { useTheme } from '../theme/ThemeProvider';
import { useTranslation } from 'react-i18next';
import SubscriptionButton from './SubscriptionButton';
import ManaIcon from './ManaIcon';
import colors from '~/tailwind.config.js';

export interface SubscriptionPlanProps {
	id: string;
	name: string;
	price: number;
	priceString: string;
	currencyCode: string;
	priceBreakdown?: string;
	monthlyMana: number;
	canGiftMana: boolean;
	popular?: boolean;
	billingCycle?: 'monthly' | 'yearly';
	monthlyEquivalent?: number;
	isTeamSubscription?: boolean;
	isEnterpriseSubscription?: boolean;
}

interface SubscriptionCardProps {
	plan: SubscriptionPlanProps;
	onSelect: (planId: string) => void;
	isCurrentPlan?: boolean;
	isLegacy?: boolean;
}

export const SubscriptionCard: React.FC<SubscriptionCardProps> = ({
	plan,
	onSelect,
	isCurrentPlan = false,
	isLegacy = false,
}) => {
	const { isDark, themeVariant, tw } = useTheme();
	const { t } = useTranslation();

	const formatPrice = (plan: SubscriptionPlanProps) => {
		// Use priceString from RevenueCat if available, otherwise format the price
		return plan.priceString || `${plan.price.toFixed(2).replace('.', ',')}€`;
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
	const accentColor = '#4287f5'; // Konsistente Mana-Farbe (identisch mit Tailwind mana)
	const cardBgColor = isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)';

	// Tier-specific background colors and sizes for Mana icon
	const getTierStyles = () => {
		switch (plan.id) {
			case 'free':
				return { bg: '#F5F5F5', icon: '#9E9E9E', bgSize: '30%' }; // Smallest background
			case 'Mana_Stream_Small_v1':
			case 'Mana_Stream_Small_Yearly_v1':
				return { bg: '#E3F2FD', icon: '#2196F3', bgSize: '45%' }; // Light blue 50 / Blue 500
			case 'Mana_Stream_Medium_v1':
			case 'Mana_Stream_Medium_Yearly_v1':
				return { bg: '#BBDEFB', icon: '#1976D2', bgSize: '60%' }; // Light blue 100 / Blue 700
			case 'Mana_Stream_Large_v1':
			case 'Mana_Stream_Large_Yearly_v1':
				return { bg: '#90CAF9', icon: '#1565C0', bgSize: '75%' }; // Light blue 200 / Blue 800
			case 'Mana_Stream_Giant_v1':
			case 'Mana_Stream_Giant_Yearly_v1':
				return { bg: '#64B5F6', icon: '#0D47A1', bgSize: '90%' }; // Light blue 300 / Blue 900 - Max size
			default:
				// Legacy plans get a neutral blue and medium size
				return { bg: '#E1F5FE', icon: '#0288D1', bgSize: '50%' };
		}
	};

	const tierStyles = getTierStyles();

	return (
		<View
			style={{
				backgroundColor: isCurrentPlan
					? isDark
						? 'rgba(66, 135, 245, 0.1)'
						: 'rgba(66, 135, 245, 0.05)'
					: bgColor,
				borderRadius: 12,
				padding: 16,
				borderWidth: isCurrentPlan ? 2 : 1,
				borderColor: isCurrentPlan ? accentColor : plan.popular ? accentColor : borderColor,
			}}
		>
			{isCurrentPlan && (
				<View
					style={{
						position: 'absolute',
						top: -10,
						left: 16,
						backgroundColor: accentColor,
						borderRadius: 12,
						paddingHorizontal: 10,
						paddingVertical: 4,
					}}
				>
					<Text style={{ color: '#FFFFFF', fontSize: 12, fontWeight: 'bold' as const }}>
						{isLegacy
							? t('subscription.legacy_plan', 'Legacy Plan')
							: t('subscription.current_plan', 'Current Plan')}
					</Text>
				</View>
			)}
			{plan.popular && !isCurrentPlan && (
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
					<Text style={{ color: '#000000', fontSize: 12, fontWeight: 'bold' as const }}>
						{t('subscription.popular', 'Popular')}
					</Text>
				</View>
			)}

			{/* Tier Name - full width */}
			<Text
				style={{
					color: textColor,
					fontSize: 18,
					fontWeight: 'bold' as const,
					marginBottom: 16,
					textAlign: 'center',
				}}
			>
				{plan.name}
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
							width: tierStyles.bgSize,
							height: tierStyles.bgSize,
							backgroundColor: tierStyles.bg,
							borderRadius: 8,
							justifyContent: 'center',
							alignItems: 'center',
						}}
					>
						<ManaIcon size={32} color={tierStyles.icon} />
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
						{plan.monthlyMana}
					</Text>
					<Text
						style={{
							color: secondaryTextColor,
							fontSize: 11,
							textAlign: 'center',
						}}
					>
						{t('subscription.per_month', 'pro Monat')}
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
						{formatPrice(plan)}
					</Text>
					<Text
						style={{
							color: secondaryTextColor,
							fontSize: 11,
							marginTop: 2,
						}}
					>
						{plan.billingCycle === 'yearly'
							? t('subscription.per_year', 'pro Jahr')
							: t('subscription.per_month', 'pro Monat')}
					</Text>
					{plan.billingCycle === 'yearly' && plan.monthlyEquivalent && (
						<Text
							style={{
								color: secondaryTextColor,
								fontSize: 9,
								marginTop: 1,
							}}
						>
							({plan.monthlyEquivalent.toFixed(2).replace('.', ',')}€/Mo)
						</Text>
					)}
				</View>
			</View>

			{/* Button nur anzeigen wenn es NICHT der Free Plan ist */}
			{plan.id !== 'free' && (
				<SubscriptionButton
					label={
						isCurrentPlan
							? isLegacy
								? t('subscription.your_legacy_plan', 'Your Legacy Plan')
								: t('subscription.your_plan', 'Your Plan')
							: t('subscription.buy', 'Buy')
					}
					onPress={() => onSelect(plan.id)}
					iconName={isCurrentPlan ? 'checkmark-circle-outline' : 'arrow-forward-outline'}
					variant={isCurrentPlan ? 'secondary' : plan.popular ? 'accent' : 'primary'}
					disabled={isCurrentPlan}
				/>
			)}
		</View>
	);
};

export default SubscriptionCard;
