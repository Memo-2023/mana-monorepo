import { View, Text, Pressable, Image, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import Animated, {
	useSharedValue,
	useAnimatedStyle,
	withTiming,
	interpolate,
	Easing,
} from 'react-native-reanimated';
import { CARDS } from '../../data/cards';
import type { FigureRarity } from '@figgos/shared';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = SCREEN_WIDTH - 48;
const CARD_HEIGHT = CARD_WIDTH * 1.5;

const RARITY_COLORS: Record<FigureRarity, string> = {
	common: 'rgb(136, 136, 170)',
	rare: 'rgb(100, 180, 255)',
	epic: 'rgb(180, 130, 255)',
	legendary: 'rgb(255, 185, 30)',
};

const STAT_COLORS = {
	attack: 'rgb(255, 51, 102)',
	defense: 'rgb(0, 210, 170)',
	special: 'rgb(180, 130, 255)',
};

export default function CardDetailScreen() {
	const { id } = useLocalSearchParams<{ id: string }>();
	const router = useRouter();
	const card = CARDS.find((c) => c.id === id);

	const rotation = useSharedValue(0);
	const isFlipped = useSharedValue(false);

	const handleFlip = () => {
		const target = isFlipped.value ? 0 : 180;
		isFlipped.value = !isFlipped.value;
		rotation.value = withTiming(target, {
			duration: 600,
			easing: Easing.bezier(0.4, 0, 0.2, 1),
		});
	};

	const frontStyle = useAnimatedStyle(() => {
		const rotateY = interpolate(rotation.value, [0, 180], [0, 180]);
		return {
			transform: [{ perspective: 1200 }, { rotateY: `${rotateY}deg` }],
			backfaceVisibility: 'hidden' as const,
		};
	});

	const backStyle = useAnimatedStyle(() => {
		const rotateY = interpolate(rotation.value, [0, 180], [180, 360]);
		return {
			transform: [{ perspective: 1200 }, { rotateY: `${rotateY}deg` }],
			backfaceVisibility: 'hidden' as const,
		};
	});

	if (!card) {
		return (
			<SafeAreaView className="flex-1 bg-background items-center justify-center">
				<Text className="text-foreground" style={{ fontSize: 16 }}>
					Card not found
				</Text>
			</SafeAreaView>
		);
	}

	return (
		<SafeAreaView className="flex-1 bg-background" edges={['top']}>
			{/* Back button */}
			<Pressable
				onPress={() => router.back()}
				className="active:opacity-70"
				style={{ paddingHorizontal: 20, paddingVertical: 12 }}
			>
				<Text className="text-primary" style={{ fontSize: 16, fontWeight: '700' }}>
					← Back
				</Text>
			</Pressable>

			<View className="flex-1 items-center justify-center">
				<Pressable onPress={handleFlip}>
					<View style={{ width: CARD_WIDTH, height: CARD_HEIGHT }}>
						{/* ── Front: just the image ── */}
						<Animated.View
							style={[
								{
									position: 'absolute',
									width: CARD_WIDTH,
									height: CARD_HEIGHT,
								},
								frontStyle,
							]}
						>
							<Image
								source={card.image}
								style={{ width: '100%', height: '100%' }}
								resizeMode="contain"
							/>
						</Animated.View>

						{/* ── Back ── */}
						<Animated.View
							style={[
								{
									position: 'absolute',
									width: CARD_WIDTH,
									height: CARD_HEIGHT,
								},
								backStyle,
							]}
						>
							{/* Shadow layer */}
							<View
								style={{
									position: 'absolute',
									top: 6,
									left: 6,
									right: -6,
									bottom: -6,
									borderRadius: 16,
									backgroundColor: RARITY_COLORS[card.rarity],
									opacity: 0.4,
								}}
							/>
							{/* Card back */}
							<View
								className="bg-surface rounded-2xl"
								style={{
									flex: 1,
									borderWidth: 3,
									borderColor: RARITY_COLORS[card.rarity],
									padding: 24,
									justifyContent: 'space-between',
								}}
							>
								{/* Header */}
								<View>
									<View
										className="bg-secondary rounded self-start mb-3"
										style={{
											paddingHorizontal: 12,
											paddingVertical: 3,
											transform: [{ rotate: '-2deg' }],
										}}
									>
										<Text
											className="text-secondary-foreground"
											style={{
												fontSize: 10,
												fontWeight: '900',
												letterSpacing: 2,
												textTransform: 'uppercase',
											}}
										>
											Backstory
										</Text>
									</View>
									<Text
										className="text-foreground"
										style={{ fontSize: 22, fontWeight: '900', letterSpacing: -0.5 }}
									>
										{card.name}
									</Text>
									<Text
										style={{
											fontSize: 11,
											fontWeight: '800',
											letterSpacing: 2,
											textTransform: 'uppercase',
											marginTop: 2,
											color: RARITY_COLORS[card.rarity],
										}}
									>
										{card.subtitle}
									</Text>
								</View>

								{/* Description */}
								<View>
									<Text className="text-muted-foreground" style={{ fontSize: 14, lineHeight: 22 }}>
										{card.description}
									</Text>
								</View>

								{/* Stats */}
								<View>
									<Text
										className="mb-2"
										style={{
											fontSize: 11,
											fontWeight: '900',
											letterSpacing: 3,
											textTransform: 'uppercase',
											color: RARITY_COLORS[card.rarity],
										}}
									>
										Stats
									</Text>
									<StatBar label="ATK" value={card.stats.attack} color={STAT_COLORS.attack} />
									<StatBar label="DEF" value={card.stats.defense} color={STAT_COLORS.defense} />
									<StatBar label="SPL" value={card.stats.special} color={STAT_COLORS.special} />
								</View>

								{/* Bottom: rarity + ID */}
								<View className="flex-row items-center justify-between">
									<View
										className="rounded-full"
										style={{
											paddingHorizontal: 12,
											paddingVertical: 4,
											backgroundColor: RARITY_COLORS[card.rarity],
										}}
									>
										<Text
											style={{
												fontSize: 10,
												fontWeight: '900',
												letterSpacing: 1.5,
												textTransform: 'uppercase',
												color: 'rgb(15, 15, 30)',
											}}
										>
											{card.rarity}
										</Text>
									</View>
									<Text
										className="text-muted-foreground"
										style={{ fontSize: 10, fontWeight: '600', letterSpacing: 1 }}
									>
										#{card.id.split('-').pop()?.toUpperCase()}
									</Text>
								</View>
							</View>
						</Animated.View>
					</View>
				</Pressable>
			</View>
		</SafeAreaView>
	);
}

function StatBar({ label, value, color }: { label: string; value: number; color: string }) {
	return (
		<View className="flex-row items-center mb-2" style={{ gap: 8 }}>
			<Text
				className="text-muted-foreground"
				style={{ fontSize: 11, fontWeight: '900', width: 28, letterSpacing: 1 }}
			>
				{label}
			</Text>
			<View
				className="flex-1 bg-input rounded-full"
				style={{ height: 10, borderWidth: 1, borderColor: 'rgb(50, 50, 80)' }}
			>
				<View
					style={{
						width: `${value}%`,
						height: '100%',
						backgroundColor: color,
						borderRadius: 999,
					}}
				/>
			</View>
			<Text
				className="text-foreground"
				style={{ fontSize: 11, fontWeight: '800', width: 24, textAlign: 'right' }}
			>
				{value}
			</Text>
		</View>
	);
}
