import { useState, useCallback } from 'react';
import {
	View,
	Text,
	Image,
	Pressable,
	ScrollView,
	Dimensions,
	ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import type { FigureResponse, FigureRarity } from '@figgos/shared';
import { api } from '../../services/api';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = SCREEN_WIDTH * 0.32;
const CARD_HEIGHT = CARD_WIDTH * 1.45;
const OVERLAP = -16;

const RARITY_COLORS: Record<FigureRarity, string> = {
	common: 'rgb(136, 136, 170)',
	rare: 'rgb(100, 180, 255)',
	epic: 'rgb(180, 130, 255)',
	legendary: 'rgb(255, 185, 30)',
};

const RARITY_ORDER: FigureRarity[] = ['legendary', 'epic', 'rare', 'common'];
const RARITY_LABELS: Record<FigureRarity, string> = {
	legendary: 'LEGENDARY',
	epic: 'EPIC',
	rare: 'RARE',
	common: 'COMMON',
};

function ShelfRow({ rarity, figures }: { rarity: FigureRarity; figures: FigureResponse[] }) {
	const router = useRouter();
	const color = RARITY_COLORS[rarity];

	if (figures.length === 0) return null;

	return (
		<View style={{ marginBottom: 28 }}>
			<Text
				style={{
					fontSize: 11,
					fontWeight: '900',
					color,
					letterSpacing: 3,
					textTransform: 'uppercase',
					marginBottom: 10,
					paddingHorizontal: 20,
				}}
			>
				{RARITY_LABELS[rarity]}
			</Text>

			<ScrollView
				horizontal
				showsHorizontalScrollIndicator={false}
				contentContainerStyle={{ paddingHorizontal: 20 }}
			>
				{figures.map((figure, i) => (
					<Pressable
						key={figure.id}
						onPress={() => router.push(`/card/v2/${figure.id}` as any)}
						className="active:opacity-80"
						style={{ marginRight: i < figures.length - 1 ? OVERLAP : 0 }}
					>
						<View
							style={{
								width: CARD_WIDTH,
								height: CARD_HEIGHT,
								borderRadius: 10,
								overflow: 'hidden',
							}}
						>
							{figure.imageUrl ? (
								<Image
									source={{ uri: figure.imageUrl }}
									style={{ width: '100%', height: '100%' }}
									resizeMode="cover"
								/>
							) : (
								<View
									className="bg-surface items-center justify-center"
									style={{
										width: '100%',
										height: '100%',
										borderWidth: 1,
										borderColor: color,
										borderRadius: 10,
									}}
								>
									<Text
										className="text-muted-foreground"
										style={{ fontSize: 9, textAlign: 'center' }}
									>
										{figure.name}
									</Text>
								</View>
							)}
						</View>
					</Pressable>
				))}
			</ScrollView>

			<View
				style={{
					height: 4,
					marginHorizontal: 16,
					marginTop: 6,
					borderRadius: 2,
					backgroundColor: color,
					opacity: 0.25,
				}}
			/>
		</View>
	);
}

export default function ShelfScreen() {
	const [figures, setFigures] = useState<FigureResponse[]>([]);
	const [loading, setLoading] = useState(true);

	useFocusEffect(
		useCallback(() => {
			api.figures
				.list()
				.then(({ figures }) => setFigures(figures))
				.finally(() => setLoading(false));
		}, [])
	);

	const grouped = RARITY_ORDER.map((rarity) => ({
		rarity,
		figures: figures.filter((f) => f.rarity === rarity),
	}));

	if (loading) {
		return (
			<SafeAreaView className="flex-1 bg-background items-center justify-center" edges={['top']}>
				<ActivityIndicator color="rgb(255, 204, 0)" size="large" />
			</SafeAreaView>
		);
	}

	return (
		<SafeAreaView className="flex-1 bg-background" edges={['top']}>
			<ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
				<View style={{ paddingHorizontal: 20, paddingTop: 24, paddingBottom: 20 }}>
					<Text
						className="text-foreground"
						style={{ fontSize: 28, fontWeight: '900', letterSpacing: -0.5 }}
					>
						Shelf
					</Text>
				</View>

				{grouped.map(({ rarity, figures }) => (
					<ShelfRow key={rarity} rarity={rarity} figures={figures} />
				))}
			</ScrollView>
		</SafeAreaView>
	);
}
