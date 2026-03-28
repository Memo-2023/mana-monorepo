import React, { useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import { formatCreditCost } from '../operations';

interface CreditToastProps {
	/** The operation name or description */
	operation: string;
	/** Amount of credits consumed (positive) or refunded (negative) */
	amount: number;
	/** Remaining balance after the transaction */
	remainingBalance?: number;
	/** Toast type */
	type?: 'success' | 'error' | 'warning';
	/** Whether the toast is visible */
	visible?: boolean;
	/** Callback when toast should be dismissed */
	onDismiss?: () => void;
	/** Auto-dismiss timeout in ms (0 = no auto-dismiss) */
	autoDismissMs?: number;
	/** i18n labels */
	labels?: {
		credits?: string;
		remaining?: string;
		insufficient?: string;
	};
}

export function CreditToast({
	operation,
	amount,
	remainingBalance,
	type = 'success',
	visible = true,
	onDismiss,
	autoDismissMs = 4000,
	labels = {},
}: CreditToastProps) {
	const {
		remaining: remainingLabel = 'remaining',
		insufficient: insufficientLabel = 'Insufficient credits',
	} = labels;

	const fadeAnim = React.useRef(new Animated.Value(0)).current;
	const slideAnim = React.useRef(new Animated.Value(-20)).current;

	const isDeduction = amount > 0;
	const formattedAmount = formatCreditCost(Math.abs(amount));
	const formattedRemaining =
		remainingBalance !== undefined ? formatCreditCost(remainingBalance) : null;

	useEffect(() => {
		if (visible) {
			Animated.parallel([
				Animated.timing(fadeAnim, {
					toValue: 1,
					duration: 200,
					useNativeDriver: true,
				}),
				Animated.timing(slideAnim, {
					toValue: 0,
					duration: 200,
					useNativeDriver: true,
				}),
			]).start();

			if (autoDismissMs > 0 && onDismiss) {
				const timer = setTimeout(onDismiss, autoDismissMs);
				return () => clearTimeout(timer);
			}
		} else {
			Animated.parallel([
				Animated.timing(fadeAnim, {
					toValue: 0,
					duration: 150,
					useNativeDriver: true,
				}),
				Animated.timing(slideAnim, {
					toValue: -20,
					duration: 150,
					useNativeDriver: true,
				}),
			]).start();
		}
		return undefined;
	}, [visible, autoDismissMs, onDismiss, fadeAnim, slideAnim]);

	if (!visible) return null;

	const getTypeStyles = () => {
		switch (type) {
			case 'success':
				return {
					iconBg: styles.iconBgSuccess,
					icon: '✓',
					iconColor: '#22c55e',
				};
			case 'error':
				return {
					iconBg: styles.iconBgError,
					icon: '✕',
					iconColor: '#ef4444',
				};
			case 'warning':
				return {
					iconBg: styles.iconBgWarning,
					icon: '⚠',
					iconColor: '#f59e0b',
				};
			default:
				return {
					iconBg: styles.iconBgSuccess,
					icon: '✓',
					iconColor: '#22c55e',
				};
		}
	};

	const typeStyles = getTypeStyles();

	return (
		<Animated.View
			style={[
				styles.container,
				{
					opacity: fadeAnim,
					transform: [{ translateY: slideAnim }],
				},
			]}
		>
			<View style={[styles.iconWrapper, typeStyles.iconBg]}>
				<Text style={[styles.iconText, { color: typeStyles.iconColor }]}>{typeStyles.icon}</Text>
			</View>

			<View style={styles.content}>
				<Text style={styles.operation} numberOfLines={1}>
					{operation}
				</Text>
				<View style={styles.details}>
					{type === 'error' ? (
						<Text style={styles.amountError}>{insufficientLabel}</Text>
					) : (
						<>
							<Text style={[styles.amount, !isDeduction && styles.amountRefund]}>
								{isDeduction ? '-' : '+'}
								{formattedAmount}
							</Text>
							{formattedRemaining !== null && (
								<Text style={styles.remaining}>
									({formattedRemaining} {remainingLabel})
								</Text>
							)}
						</>
					)}
				</View>
			</View>

			{onDismiss && (
				<TouchableOpacity
					style={styles.dismissButton}
					onPress={onDismiss}
					hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
				>
					<Text style={styles.dismissIcon}>✕</Text>
				</TouchableOpacity>
			)}
		</Animated.View>
	);
}

const styles = StyleSheet.create({
	container: {
		flexDirection: 'row',
		alignItems: 'flex-start',
		gap: 12,
		paddingHorizontal: 16,
		paddingVertical: 14,
		borderRadius: 12,
		backgroundColor: 'rgba(255, 255, 255, 0.95)',
		borderWidth: 1,
		borderColor: 'rgba(0, 0, 0, 0.1)',
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 4 },
		shadowOpacity: 0.15,
		shadowRadius: 8,
		elevation: 5,
		minWidth: 280,
		maxWidth: 400,
	},
	iconWrapper: {
		width: 24,
		height: 24,
		borderRadius: 12,
		alignItems: 'center',
		justifyContent: 'center',
	},
	iconBgSuccess: {
		backgroundColor: 'rgba(34, 197, 94, 0.1)',
	},
	iconBgError: {
		backgroundColor: 'rgba(239, 68, 68, 0.1)',
	},
	iconBgWarning: {
		backgroundColor: 'rgba(245, 158, 11, 0.1)',
	},
	iconText: {
		fontSize: 12,
		fontWeight: '700',
	},
	content: {
		flex: 1,
	},
	operation: {
		fontSize: 14,
		fontWeight: '500',
		color: '#1f2937',
		marginBottom: 4,
	},
	details: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 6,
	},
	amount: {
		fontSize: 12,
		fontWeight: '600',
		color: '#ef4444',
	},
	amountRefund: {
		color: '#22c55e',
	},
	amountError: {
		fontSize: 12,
		fontWeight: '600',
		color: '#ef4444',
	},
	remaining: {
		fontSize: 12,
		color: '#6b7280',
	},
	dismissButton: {
		width: 20,
		height: 20,
		alignItems: 'center',
		justifyContent: 'center',
		borderRadius: 4,
	},
	dismissIcon: {
		fontSize: 12,
		color: '#9ca3af',
	},
});

export default CreditToast;
