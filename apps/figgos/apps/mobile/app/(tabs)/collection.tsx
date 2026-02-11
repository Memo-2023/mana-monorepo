import { View, Text, Image, Pressable, FlatList, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { CARDS, type CardData } from '../../data/cards';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const GAP = 10;
const PADDING = 14;
const COLUMNS = 2;
const CARD_WIDTH = (SCREEN_WIDTH - PADDING * 2 - GAP * (COLUMNS - 1)) / COLUMNS;
const CARD_HEIGHT = CARD_WIDTH * 1.45;

function CardThumbnail({ card }: { card: CardData }) {
	const router = useRouter();

	return (
		<Pressable
			onPress={() => router.push(`/card/v2/${card.id}` as any)}
			style={{ width: CARD_WIDTH }}
			className="active:opacity-80"
		>
			<View
				style={{
					width: CARD_WIDTH,
					height: CARD_HEIGHT,
					borderRadius: 12,
					overflow: 'hidden',
				}}
			>
				<Image source={card.image} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
			</View>
		</Pressable>
	);
}

export default function CollectionScreen() {
	return (
		<SafeAreaView className="flex-1 bg-background" edges={['top']}>
			<View style={{ paddingHorizontal: PADDING, paddingTop: 24, paddingBottom: 16 }}>
				<Text
					className="text-foreground"
					style={{ fontSize: 28, fontWeight: '900', letterSpacing: -0.5 }}
				>
					Collection
				</Text>
				<Text className="text-muted-foreground" style={{ fontSize: 13, marginTop: 2 }}>
					{CARDS.length} {CARDS.length === 1 ? 'Figgo' : 'Figgos'}
				</Text>
			</View>

			<FlatList
				data={CARDS}
				numColumns={COLUMNS}
				keyExtractor={(item) => item.id}
				contentContainerStyle={{ paddingHorizontal: PADDING, paddingBottom: 40 }}
				columnWrapperStyle={{ gap: GAP, marginBottom: GAP }}
				renderItem={({ item }) => <CardThumbnail card={item} />}
			/>
		</SafeAreaView>
	);
}
