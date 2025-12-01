import React, { useEffect, useState } from 'react';
import { View, Pressable } from 'react-native';
import { Icon } from './Icon';
import { Text } from './Text';
import { getRateLimits, type RateLimits } from '~/services/api/profiles';
import { useAuth } from '~/contexts/AuthContext';
import { useTheme } from '~/contexts/ThemeContext';

interface RateLimitIndicatorProps {
	compact?: boolean;
	onRefresh?: () => void;
}

export function RateLimitIndicator({ compact = false, onRefresh }: RateLimitIndicatorProps) {
	const { user } = useAuth();
	const { theme } = useTheme();
	const [limits, setLimits] = useState<RateLimits | null>(null);
	const [loading, setLoading] = useState(true);
	const [expanded, setExpanded] = useState(false);

	const fetchLimits = async () => {
		if (!user) return;

		try {
			const data = await getRateLimits();
			setLimits(data);
		} catch (error) {
			console.error('Error fetching rate limits:', error);
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		fetchLimits();
		// Refresh every minute
		const interval = setInterval(fetchLimits, 60000);
		return () => clearInterval(interval);
	}, [user]);

	const formatResetTime = (resetAt: string) => {
		const reset = new Date(resetAt);
		const now = new Date();
		const diff = reset.getTime() - now.getTime();

		if (diff <= 0) return 'Resetting...';

		const hours = Math.floor(diff / (1000 * 60 * 60));
		const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

		if (hours > 0) return `${hours}h ${minutes}m`;
		return `${minutes}m`;
	};

	const getUsageColor = (used: number, limit: number) => {
		const percentage = (used / limit) * 100;
		if (percentage >= 90) return '#ef4444'; // red
		if (percentage >= 75) return '#eab308'; // yellow
		return '#10b981'; // green
	};

	if (loading || !limits) return null;

	const dailyPercentage = Math.min(100, (limits.daily_used / limits.daily_limit) * 100);
	const hourlyPercentage = Math.min(100, (limits.hourly_used / limits.hourly_limit) * 100);

	if (compact) {
		return (
			<Pressable
				onPress={() => setExpanded(!expanded)}
				style={{
					backgroundColor: theme.colors.surface,
					borderRadius: 8,
					padding: 8,
					marginBottom: 8,
				}}
			>
				<View className="flex-row items-center justify-between">
					<View className="flex-row items-center">
						<Icon
							name="speedometer-outline"
							size={16}
							color={getUsageColor(limits.daily_used, limits.daily_limit)}
						/>
						<Text variant="bodySmall" color="secondary" className="ml-2">
							{limits.daily_limit - limits.daily_used} daily left
						</Text>
					</View>
					<Icon
						name={expanded ? 'chevron-up' : 'chevron-down'}
						size={16}
						color={theme.colors.text.tertiary}
					/>
				</View>

				{expanded && (
					<View
						style={{
							marginTop: 8,
							paddingTop: 8,
							borderTopWidth: 1,
							borderTopColor: theme.colors.border,
						}}
					>
						<View className="mb-1 flex-row justify-between">
							<Text variant="caption" color="tertiary">
								Hourly
							</Text>
							<Text variant="caption" color="secondary">
								{limits.hourly_used}/{limits.hourly_limit} (
								{formatResetTime(limits.hourly_reset_at)})
							</Text>
						</View>
						<View className="mb-1 flex-row justify-between">
							<Text variant="caption" color="tertiary">
								Active
							</Text>
							<Text variant="caption" color="secondary">
								{limits.active_generations}/{limits.max_concurrent}
							</Text>
						</View>
						<View className="flex-row justify-between">
							<Text variant="caption" color="tertiary">
								All Time
							</Text>
							<Text variant="caption" color="secondary">
								{limits.total_all_time}
							</Text>
						</View>
					</View>
				)}
			</Pressable>
		);
	}

	return (
		<View style={{ backgroundColor: theme.colors.surface, borderRadius: 8, padding: 16 }}>
			<View className="mb-3 flex-row items-center justify-between">
				<Text variant="bodySmall" weight="semibold" color="primary">
					Usage Limits
				</Text>
				{onRefresh && (
					<Pressable onPress={onRefresh} className="p-1">
						<Icon name="refresh-outline" size={16} color={theme.colors.text.tertiary} />
					</Pressable>
				)}
			</View>

			{/* Daily Limit */}
			<View className="mb-3">
				<View className="mb-1 flex-row justify-between">
					<Text variant="caption" color="tertiary">
						Daily Limit
					</Text>
					<Text variant="caption" color="secondary">
						{limits.daily_used}/{limits.daily_limit} • Resets in{' '}
						{formatResetTime(limits.daily_reset_at)}
					</Text>
				</View>
				<View
					style={{
						height: 8,
						backgroundColor: theme.colors.input,
						borderRadius: 9999,
						overflow: 'hidden',
					}}
				>
					<View
						style={{
							height: '100%',
							borderRadius: 9999,
							width: `${dailyPercentage}%`,
							backgroundColor: getUsageColor(limits.daily_used, limits.daily_limit),
						}}
					/>
				</View>
			</View>

			{/* Hourly Limit */}
			<View className="mb-3">
				<View className="mb-1 flex-row justify-between">
					<Text variant="caption" color="tertiary">
						Hourly Limit
					</Text>
					<Text variant="caption" color="secondary">
						{limits.hourly_used}/{limits.hourly_limit} • Resets in{' '}
						{formatResetTime(limits.hourly_reset_at)}
					</Text>
				</View>
				<View
					style={{
						height: 8,
						backgroundColor: theme.colors.input,
						borderRadius: 9999,
						overflow: 'hidden',
					}}
				>
					<View
						style={{
							height: '100%',
							borderRadius: 9999,
							width: `${hourlyPercentage}%`,
							backgroundColor: getUsageColor(limits.hourly_used, limits.hourly_limit),
						}}
					/>
				</View>
			</View>

			{/* Additional Stats */}
			<View
				style={{
					flexDirection: 'row',
					justifyContent: 'space-around',
					paddingTop: 8,
					borderTopWidth: 1,
					borderTopColor: theme.colors.border,
				}}
			>
				<View className="items-center">
					<Text
						variant="h4"
						weight="bold"
						style={{ color: getUsageColor(limits.active_generations, limits.max_concurrent) }}
					>
						{limits.active_generations}
					</Text>
					<Text variant="caption" color="tertiary">
						Active
					</Text>
				</View>
				<View className="items-center">
					<Text variant="h4" weight="bold" color="secondary">
						{limits.max_concurrent}
					</Text>
					<Text variant="caption" color="tertiary">
						Max Parallel
					</Text>
				</View>
				<View className="items-center">
					<Text variant="h4" weight="bold" style={{ color: theme.colors.primary.default }}>
						{limits.total_all_time}
					</Text>
					<Text variant="caption" color="tertiary">
						Total
					</Text>
				</View>
			</View>
		</View>
	);
}
