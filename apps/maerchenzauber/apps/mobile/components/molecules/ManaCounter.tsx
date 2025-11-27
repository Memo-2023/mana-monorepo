import React from 'react';
import { StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import Text from '../atoms/Text';
import { useManaBalance } from '../../hooks/useManaBalance';
import ManaIcon from '../icons/ManaIcon';

interface ManaCounterProps {
	onPress?: () => void;
	size?: 'small' | 'medium' | 'large';
}

export default function ManaCounter({ onPress, size = 'medium' }: ManaCounterProps) {
	const router = useRouter();
	const { manaBalance, loading } = useManaBalance();

	const handlePress = () => {
		if (onPress) {
			onPress();
		} else {
			router.push('/subscription');
		}
	};

	const formatManaBalance = (balance: number | null): string => {
		if (balance === null) return '0';
		if (balance >= 10000) {
			return `${Math.floor(balance / 1000)}K`;
		}
		return balance.toString();
	};

	const sizeConfig = {
		small: {
			iconSize: 16,
			fontSize: 13,
			paddingVertical: 6,
			paddingLeft: 6,
			paddingRight: 12,
			minWidth: 60,
		},
		medium: {
			iconSize: 22,
			fontSize: 16,
			paddingVertical: 8,
			paddingLeft: 8,
			paddingRight: 16,
			minWidth: 70,
		},
		large: {
			iconSize: 26,
			fontSize: 20,
			paddingVertical: 10,
			paddingLeft: 10,
			paddingRight: 18,
			minWidth: 80,
		},
	};

	const config = sizeConfig[size];

	return (
		<TouchableOpacity
			onPress={handlePress}
			style={[
				styles.container,
				{
					paddingVertical: config.paddingVertical,
					paddingLeft: config.paddingLeft,
					paddingRight: config.paddingRight,
					minWidth: config.minWidth,
				},
			]}
			hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
		>
			<ManaIcon size={config.iconSize} color="#4A9EFF" />
			{loading ? (
				<ActivityIndicator size="small" color="#4A9EFF" />
			) : (
				<Text style={[styles.balance, { fontSize: config.fontSize }]}>
					{formatManaBalance(manaBalance)}
				</Text>
			)}
		</TouchableOpacity>
	);
}

const styles = StyleSheet.create({
	container: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 3,
		backgroundColor: 'rgba(74, 158, 255, 0.15)',
		borderRadius: 20,
	},
	balance: {
		fontWeight: '700',
		color: '#4A9EFF',
		minWidth: 20,
	},
});
