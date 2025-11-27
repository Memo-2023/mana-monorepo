import React, { useEffect } from 'react';
import { View, Text, ScrollView, Pressable, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useBatchStore } from '~/store/batchStore';
import { router } from 'expo-router';

interface BatchProgressTrackerProps {
	batchId: string;
	onComplete?: () => void;
	onItemClick?: (itemId: string) => void;
	compact?: boolean;
}

export function BatchProgressTracker({
	batchId,
	onComplete,
	onItemClick,
	compact = false,
}: BatchProgressTrackerProps) {
	const {
		activeBatches,
		loadBatch,
		subscribeToBatch,
		unsubscribeFromBatch,
		retryFailed,
		cancelBatch,
	} = useBatchStore();

	const batch = activeBatches.get(batchId);

	useEffect(() => {
		// Load and subscribe to batch
		loadBatch(batchId);
		subscribeToBatch(batchId);

		return () => {
			unsubscribeFromBatch(batchId);
		};
	}, [batchId]);

	useEffect(() => {
		// Check if batch is complete
		if (batch && batch.status === 'completed' && onComplete) {
			onComplete();
		}
	}, [batch?.status]);

	if (!batch) {
		return (
			<View className="rounded-lg bg-dark-surface p-4">
				<ActivityIndicator size="small" color="#818cf8" />
			</View>
		);
	}

	const progressPercentage =
		batch.total_count > 0
			? ((batch.completed_count + batch.failed_count) / batch.total_count) * 100
			: 0;

	const getStatusIcon = (status: string) => {
		switch (status) {
			case 'completed':
				return <Ionicons name="checkmark-circle" size={20} color="#10b981" />;
			case 'failed':
				return <Ionicons name="close-circle" size={20} color="#ef4444" />;
			case 'processing':
				return <ActivityIndicator size="small" color="#818cf8" />;
			case 'pending':
				return <Ionicons name="time-outline" size={20} color="#6b7280" />;
			default:
				return null;
		}
	};

	const getStatusColor = (status: string) => {
		switch (status) {
			case 'completed':
				return 'text-green-500';
			case 'failed':
				return 'text-red-500';
			case 'processing':
				return 'text-indigo-500';
			default:
				return 'text-gray-500';
		}
	};

	if (compact) {
		// Compact view for in-screen display
		return (
			<View className="mb-2 rounded-lg bg-dark-surface p-3">
				<View className="mb-2 flex-row items-center justify-between">
					<Text className="text-sm font-semibold text-white">
						{batch.name || 'Batch Generation'}
					</Text>
					<Text className={`text-xs ${getStatusColor(batch.status)}`}>
						{batch.completed_count}/{batch.total_count}
					</Text>
				</View>

				{/* Progress Bar */}
				<View className="h-2 overflow-hidden rounded-full bg-dark-input">
					<View
						className="h-full rounded-full bg-indigo-600"
						style={{ width: `${progressPercentage}%` }}
					/>
				</View>

				{batch.failed_count > 0 && (
					<Pressable onPress={() => retryFailed(batchId)} className="mt-2 flex-row items-center">
						<Ionicons name="refresh" size={14} color="#ef4444" />
						<Text className="ml-1 text-xs text-red-500">
							{batch.failed_count} fehlgeschlagen - Wiederholen
						</Text>
					</Pressable>
				)}
			</View>
		);
	}

	// Full view
	return (
		<View className="rounded-lg bg-dark-surface p-4">
			{/* Header */}
			<View className="mb-4">
				<Text className="mb-1 text-lg font-bold text-white">
					{batch.name || 'Batch Generation'}
				</Text>
				<Text className="text-sm text-gray-400">
					Status: <Text className={getStatusColor(batch.status)}>{batch.status}</Text>
				</Text>
			</View>

			{/* Overall Progress */}
			<View className="mb-4">
				<View className="mb-2 flex-row justify-between">
					<Text className="text-sm text-gray-400">Gesamt: {progressPercentage.toFixed(0)}%</Text>
					<Text className="text-sm text-gray-400">
						{batch.completed_count + batch.failed_count}/{batch.total_count}
					</Text>
				</View>
				<View className="h-3 overflow-hidden rounded-full bg-dark-input">
					<View
						className="h-full rounded-full bg-indigo-600"
						style={{ width: `${progressPercentage}%` }}
					/>
				</View>
			</View>

			{/* Statistics */}
			<View className="mb-4 flex-row justify-around border-y border-dark-border py-2">
				<View className="items-center">
					<Text className="text-2xl font-bold text-green-500">{batch.completed_count}</Text>
					<Text className="text-xs text-gray-400">Fertig</Text>
				</View>
				<View className="items-center">
					<Text className="text-2xl font-bold text-indigo-500">{batch.processing_count || 0}</Text>
					<Text className="text-xs text-gray-400">Läuft</Text>
				</View>
				<View className="items-center">
					<Text className="text-2xl font-bold text-gray-500">{batch.pending_count || 0}</Text>
					<Text className="text-xs text-gray-400">Wartend</Text>
				</View>
				<View className="items-center">
					<Text className="text-2xl font-bold text-red-500">{batch.failed_count}</Text>
					<Text className="text-xs text-gray-400">Fehler</Text>
				</View>
			</View>

			{/* Items List */}
			{batch.items && batch.items.length > 0 && (
				<ScrollView className="max-h-64">
					{batch.items.map((item, index) => (
						<Pressable
							key={item.id}
							onPress={() => {
								if (item.status === 'completed' && onItemClick) {
									onItemClick(item.id);
								}
							}}
							disabled={item.status !== 'completed'}
							className="flex-row items-center border-b border-dark-border py-2"
						>
							<Text className="mr-3 min-w-[20px] text-gray-400">{index + 1}.</Text>
							<View className="mr-3">{getStatusIcon(item.status)}</View>
							<Text className="flex-1 text-sm text-gray-300" numberOfLines={1}>
								{item.prompt}
							</Text>
							{item.retry_count && item.retry_count > 0 && (
								<Text className="ml-2 text-xs text-yellow-500">Retry {item.retry_count}</Text>
							)}
						</Pressable>
					))}
				</ScrollView>
			)}

			{/* Actions */}
			<View className="mt-4 flex-row justify-between">
				{batch.status === 'processing' && (
					<Pressable
						onPress={() => cancelBatch(batchId)}
						className="flex-row items-center rounded-lg bg-red-900/20 px-3 py-2"
					>
						<Ionicons name="stop-circle-outline" size={16} color="#ef4444" />
						<Text className="ml-1 text-sm text-red-500">Abbrechen</Text>
					</Pressable>
				)}

				{batch.failed_count > 0 && (
					<Pressable
						onPress={() => retryFailed(batchId)}
						className="flex-row items-center rounded-lg bg-yellow-900/20 px-3 py-2"
					>
						<Ionicons name="refresh-outline" size={16} color="#eab308" />
						<Text className="ml-1 text-sm text-yellow-500">Fehler wiederholen</Text>
					</Pressable>
				)}

				{batch.status === 'completed' && (
					<Pressable
						onPress={() => router.push('/(tabs)')}
						className="flex-row items-center rounded-lg bg-green-900/20 px-3 py-2"
					>
						<Ionicons name="images-outline" size={16} color="#10b981" />
						<Text className="ml-1 text-sm text-green-500">Zur Galerie</Text>
					</Pressable>
				)}
			</View>
		</View>
	);
}
