import { View, Text, Image, Pressable, ScrollView, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { CARDS, type CardData } from '../../data/cards';
import type { FigureRarity } from '@figgos/shared';

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

function ShelfRow({ rarity, cards }: { rarity: FigureRarity; cards: CardData[] }) {
	const router = useRouter();
	const color = RARITY_COLORS[rarity];

	if (cards.length === 0) return null;

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
				{cards.map((card, i) => (
					<Pressable
						key={card.id}
						onPress={() => router.push(`/card/v2/${card.id}` as any)}
						className="active:opacity-80"
						style={{ marginRight: i < cards.length - 1 ? OVERLAP : 0 }}
					>
						<View
							style={{
								width: CARD_WIDTH,
								height: CARD_HEIGHT,
								borderRadius: 10,
								overflow: 'hidden',
							}}
						>
							<Image
								source={card.image}
								style={{ width: '100%', height: '100%' }}
								resizeMode="cover"
							/>
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
	const grouped = RARITY_ORDER.map((rarity) => ({
		rarity,
		cards: CARDS.filter((c) => c.rarity === rarity),
	}));

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

				{grouped.map(({ rarity, cards }) => (
					<ShelfRow key={rarity} rarity={rarity} cards={cards} />
				))}
			</ScrollView>
		</SafeAreaView>
	);
}
