import { useState, useEffect, useCallback } from 'react';
import { View, Text, FlatList, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { api } from '~/services/api';
import type { FigureResponse, FigureRarity } from '@figgos/shared';

const RARITY_STYLES: Record<FigureRarity, { bg: string; text: string }> = {
	common: { bg: 'bg-rarity-common', text: 'text-rarity-common-foreground' },
	rare: { bg: 'bg-rarity-rare', text: 'text-rarity-rare-foreground' },
	epic: { bg: 'bg-rarity-epic', text: 'text-rarity-epic-foreground' },
	legendary: { bg: 'bg-rarity-legendary', text: 'text-rarity-legendary-foreground' },
};

function RarityBadge({ rarity }: { rarity: FigureRarity }) {
	const s = RARITY_STYLES[rarity];
	return (
		<View className={`${s.bg} px-2 py-0.5 rounded-full`}>
			<Text className={`${s.text} text-[10px] font-bold uppercase`}>{rarity}</Text>
		</View>
	);
}

function FigureCard({ figure }: { figure: FigureResponse }) {
	return (
		<View className="flex-1 bg-surface rounded-xl border border-border p-3 m-1.5 items-center">
			<View className="w-full aspect-square bg-muted rounded-lg items-center justify-center mb-2">
				<Text className="text-3xl">🎭</Text>
			</View>
			<Text className="text-sm font-semibold text-foreground text-center" numberOfLines={1}>
				{figure.name}
			</Text>
			<View className="mt-1">
				<RarityBadge rarity={figure.rarity} />
			</View>
		</View>
	);
}

export default function ShelfScreen() {
	const [figures, setFigures] = useState<FigureResponse[]>([]);
	const [loading, setLoading] = useState(true);
	const [refreshing, setRefreshing] = useState(false);

	const loadFigures = useCallback(async () => {
		try {
			const { figures: data } = await api.figures.list();
			setFigures(data);
		} catch (e) {
			console.error('Failed to load figures:', e);
		} finally {
			setLoading(false);
			setRefreshing(false);
		}
	}, []);

	useEffect(() => {
		loadFigures();
	}, [loadFigures]);

	const handleRefresh = () => {
		setRefreshing(true);
		loadFigures();
	};

	if (loading) {
		return (
			<SafeAreaView className="flex-1 bg-background items-center justify-center" edges={['bottom']}>
				<ActivityIndicator size="large" color="rgb(108, 92, 231)" />
			</SafeAreaView>
		);
	}

	return (
		<SafeAreaView className="flex-1 bg-background" edges={['bottom']}>
			<FlatList
				data={figures}
				keyExtractor={(item) => item.id}
				numColumns={2}
				contentContainerStyle={{ padding: 12 }}
				renderItem={({ item }) => <FigureCard figure={item} />}
				onRefresh={handleRefresh}
				refreshing={refreshing}
				ListEmptyComponent={
					<View className="flex-1 items-center justify-center pt-20">
						<Text className="text-4xl mb-4">📦</Text>
						<Text className="text-lg font-semibold text-foreground">No figures yet</Text>
						<Text className="text-muted-foreground mt-1 text-center">
							Head to the Create tab to generate your first figure!
						</Text>
					</View>
				}
			/>
		</SafeAreaView>
	);
}
