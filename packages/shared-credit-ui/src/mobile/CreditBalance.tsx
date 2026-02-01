import React from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native';
import { formatCreditCost } from '@manacore/credit-operations';

interface CreditBalanceProps {
	/** Current credit balance */
	balance: number;
	/** Free credits remaining (optional) */
	freeCredits?: number;
	/** Whether the balance is loading */
	loading?: boolean;
	/** Callback when "Buy Credits" is pressed */
	onBuyPress?: () => void;
	/** Whether to show as compact (header) or expanded */
	variant?: 'compact' | 'expanded';
	/** Low balance threshold for warning */
	lowBalanceThreshold?: number;
	/** i18n labels */
	labels?: {
		credits?: string;
		freeCredits?: string;
		buyCredits?: string;
		lowBalance?: string;
	};
}

export function CreditBalance({
	balance,
	freeCredits = 0,
	loading = false,
	onBuyPress,
	variant = 'compact',
	lowBalanceThreshold = 10,
	labels = {},
}: CreditBalanceProps) {
	const {
		credits: creditsLabel = 'Credits',
		freeCredits: freeCreditsLabel = 'free',
		buyCredits: buyCreditsLabel = 'Buy',
		lowBalance: lowBalanceLabel = 'Low balance',
	} = labels;

	const totalCredits = balance + freeCredits;
	const isLowBalance = totalCredits < lowBalanceThreshold;
	const formattedBalance = formatCreditCost(totalCredits);

	if (loading) {
		return (
			<View style={[styles.container, variant === 'compact' ? styles.compact : styles.expanded]}>
				<ActivityIndicator size="small" color="#3b82f6" />
			</View>
		);
	}

	if (variant === 'compact') {
		return (
			<TouchableOpacity
				style={[styles.compactButton, isLowBalance && styles.compactButtonLow]}
				onPress={onBuyPress}
				activeOpacity={0.7}
			>
				<Text style={[styles.icon, isLowBalance && styles.iconLow]}>⚡</Text>
				<Text style={[styles.compactValue, isLowBalance && styles.valueLow]}>
					{formattedBalance}
				</Text>
				{onBuyPress && <Text style={styles.plusIcon}>+</Text>}
			</TouchableOpacity>
		);
	}

	return (
		<View style={styles.expanded}>
			<View style={styles.header}>
				<View style={styles.titleRow}>
					<Text style={styles.iconLarge}>⚡</Text>
					<Text style={styles.title}>{creditsLabel}</Text>
				</View>
				<Text style={styles.largeValue}>{formattedBalance}</Text>
			</View>

			{freeCredits > 0 && (
				<Text style={styles.freeCredits}>
					{formatCreditCost(freeCredits)} {freeCreditsLabel}
				</Text>
			)}

			{isLowBalance && (
				<View style={styles.warning}>
					<Text style={styles.warningIcon}>⚠️</Text>
					<Text style={styles.warningText}>{lowBalanceLabel}</Text>
				</View>
			)}

			{onBuyPress && (
				<TouchableOpacity style={styles.buyButton} onPress={onBuyPress} activeOpacity={0.8}>
					<Text style={styles.buyButtonText}>{buyCreditsLabel}</Text>
				</TouchableOpacity>
			)}
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		alignItems: 'center',
		justifyContent: 'center',
	},
	compact: {
		height: 32,
	},
	expanded: {
		padding: 16,
		borderRadius: 12,
		backgroundColor: 'rgba(255, 255, 255, 0.9)',
		borderWidth: 1,
		borderColor: 'rgba(0, 0, 0, 0.1)',
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.1,
		shadowRadius: 4,
		elevation: 3,
	},
	compactButton: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 6,
		paddingHorizontal: 12,
		paddingVertical: 6,
		borderRadius: 999,
		backgroundColor: 'rgba(0, 0, 0, 0.05)',
	},
	compactButtonLow: {
		backgroundColor: 'rgba(239, 68, 68, 0.1)',
	},
	icon: {
		fontSize: 14,
		color: '#3b82f6',
	},
	iconLow: {
		color: '#ef4444',
	},
	iconLarge: {
		fontSize: 18,
	},
	compactValue: {
		fontSize: 14,
		fontWeight: '600',
		color: '#1f2937',
	},
	valueLow: {
		color: '#dc2626',
	},
	plusIcon: {
		marginLeft: 2,
		fontSize: 14,
		fontWeight: '700',
		color: '#6b7280',
		opacity: 0.6,
	},
	header: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		marginBottom: 8,
	},
	titleRow: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 8,
	},
	title: {
		fontSize: 14,
		fontWeight: '600',
		color: '#6b7280',
	},
	largeValue: {
		fontSize: 24,
		fontWeight: '700',
		color: '#1f2937',
	},
	freeCredits: {
		fontSize: 12,
		color: '#6b7280',
		marginBottom: 12,
	},
	warning: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 6,
		padding: 8,
		marginBottom: 12,
		borderRadius: 8,
		backgroundColor: 'rgba(239, 68, 68, 0.1)',
	},
	warningIcon: {
		fontSize: 14,
	},
	warningText: {
		fontSize: 12,
		fontWeight: '500',
		color: '#dc2626',
	},
	buyButton: {
		paddingVertical: 10,
		paddingHorizontal: 16,
		borderRadius: 8,
		backgroundColor: '#3b82f6',
		alignItems: 'center',
	},
	buyButtonText: {
		fontSize: 14,
		fontWeight: '600',
		color: '#ffffff',
	},
});

export default CreditBalance;
