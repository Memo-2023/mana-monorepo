import { useState } from 'react';
import { View, Text, Pressable, Image, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { CARDS } from '../../../data/cards';
import type { FigureRarity } from '@figgos/shared';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CONTAINER_WIDTH = SCREEN_WIDTH - 48;
const CONTAINER_HEIGHT = CONTAINER_WIDTH * 1.5;

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

const SPRING_CONFIG = { damping: 20, stiffness: 200, mass: 0.8 };

export default function CardDetailV2Screen() {
	const { id } = useLocalSearchParams<{ id: string }>();
	const router = useRouter();
	const card = CARDS.find((c) => c.id === id);

	// Track the actual rendered image size
	const [imageSize, setImageSize] = useState({ width: CONTAINER_WIDTH, height: CONTAINER_HEIGHT });

	const handleImageLayout = (e: { nativeEvent: { layout: { width: number; height: number } } }) => {
		// Image uses contain, so we can read the actual layout
		// But we need the source dimensions to compute the real rendered area
	};

	// Use Image.resolveAssetSource to get original dimensions, then compute contain size
	const computeContainSize = (srcW: number, srcH: number) => {
		const ratio = Math.min(CONTAINER_WIDTH / srcW, CONTAINER_HEIGHT / srcH);
		setImageSize({
			width: Math.round(srcW * ratio),
			height: Math.round(srcH * ratio),
		});
	};

	// Rotation around vertical axis only
	const rotateY = useSharedValue(0);
	const savedRotateY = useSharedValue(0);

	const pan = Gesture.Pan()
		.onUpdate((e) => {
			rotateY.value = savedRotateY.value + e.translationX * 0.5;
		})
		.onEnd(() => {
			const normalised = ((rotateY.value % 360) + 360) % 360;
			let target: number;
			if (normalised < 90) {
				target = 0;
			} else if (normalised < 270) {
				target = 180;
			} else {
				target = 360;
			}
			const diff = target - normalised;
			const snapTo = rotateY.value + diff;
			savedRotateY.value = snapTo % 360;
			rotateY.value = withSpring(snapTo, SPRING_CONFIG);
		});

	// Double tap to do a full flip
	const doubleTap = Gesture.Tap()
		.numberOfTaps(2)
		.onEnd(() => {
			const target = savedRotateY.value + 180;
			savedRotateY.value = target % 360;
			rotateY.value = withSpring(target, { damping: 18, stiffness: 150, mass: 1 });
		});

	const composed = Gesture.Race(doubleTap, pan);

	const frontStyle = useAnimatedStyle(() => ({
		transform: [{ perspective: 1200 }, { rotateY: `${rotateY.value}deg` }],
		backfaceVisibility: 'hidden' as const,
	}));

	const backStyle = useAnimatedStyle(() => ({
		transform: [{ perspective: 1200 }, { rotateY: `${rotateY.value + 180}deg` }],
		backfaceVisibility: 'hidden' as const,
	}));

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
			<View
				className="flex-row items-center justify-between"
				style={{ paddingHorizontal: 20, paddingVertical: 12 }}
			>
				<Pressable onPress={() => router.back()} className="active:opacity-70">
					<Text className="text-primary" style={{ fontSize: 16, fontWeight: '700' }}>
						← Back
					</Text>
				</Pressable>
				<Text className="text-muted-foreground" style={{ fontSize: 12, fontWeight: '600' }}>
					V2 — Gesture 3D
				</Text>
			</View>

			<View className="flex-1 items-center justify-center">
				<GestureDetector gesture={composed}>
					<View style={{ width: imageSize.width, height: imageSize.height }}>
						{/* ── Front: just the image ── */}
						<Animated.View
							style={[
								{
									position: 'absolute',
									width: imageSize.width,
									height: imageSize.height,
								},
								frontStyle,
							]}
						>
							<Image
								source={card.image}
								style={{ width: '100%', height: '100%' }}
								resizeMode="contain"
								onLoad={(e) => {
									const { width: srcW, height: srcH } = e.nativeEvent.source;
									computeContainSize(srcW, srcH);
								}}
							/>
						</Animated.View>

						{/* ── Back ── */}
						<Animated.View
							style={[
								{
									position: 'absolute',
									width: imageSize.width,
									height: imageSize.height,
								},
								backStyle,
							]}
						>
							{/* Shadow layer */}
							<View
								style={{
									position: 'absolute',
									top: 5,
									left: 5,
									right: -5,
									bottom: -5,
									borderRadius: 16,
									backgroundColor: RARITY_COLORS[card.rarity],
									opacity: 0.3,
								}}
							/>
							{/* Card back */}
							<View
								className="bg-surface rounded-2xl"
								style={{
									flex: 1,
									borderWidth: 3,
									borderColor: RARITY_COLORS[card.rarity],
									padding: 20,
									justifyContent: 'space-between',
								}}
							>
								{/* Header */}
								<View>
									<View
										className="bg-secondary rounded self-start mb-2"
										style={{
											paddingHorizontal: 10,
											paddingVertical: 2,
											transform: [{ rotate: '-2deg' }],
										}}
									>
										<Text
											className="text-secondary-foreground"
											style={{
												fontSize: 9,
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
										style={{ fontSize: 20, fontWeight: '900', letterSpacing: -0.5 }}
									>
										{card.name}
									</Text>
									<Text
										style={{
											fontSize: 10,
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
								<Text
									className="text-muted-foreground"
									style={{ fontSize: 13, lineHeight: 20 }}
									numberOfLines={5}
								>
									{card.description}
								</Text>

								{/* Stats */}
								<View>
									<Text
										style={{
											fontSize: 10,
											fontWeight: '900',
											letterSpacing: 3,
											textTransform: 'uppercase',
											color: RARITY_COLORS[card.rarity],
											marginBottom: 6,
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
											paddingHorizontal: 10,
											paddingVertical: 3,
											backgroundColor: RARITY_COLORS[card.rarity],
										}}
									>
										<Text
											style={{
												fontSize: 9,
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
										style={{ fontSize: 9, fontWeight: '600', letterSpacing: 1 }}
									>
										#{card.id.split('-').pop()?.toUpperCase()}
									</Text>
								</View>
							</View>
						</Animated.View>
					</View>
				</GestureDetector>

				{/* Hint */}
				<Text
					className="text-muted-foreground mt-6"
					style={{ fontSize: 11, fontWeight: '600', letterSpacing: 1 }}
				>
					Drag to rotate · Double-tap to flip
				</Text>
			</View>
		</SafeAreaView>
	);
}

function StatBar({ label, value, color }: { label: string; value: number; color: string }) {
	return (
		<View className="flex-row items-center mb-1.5" style={{ gap: 6 }}>
			<Text
				className="text-muted-foreground"
				style={{ fontSize: 10, fontWeight: '900', width: 26, letterSpacing: 1 }}
			>
				{label}
			</Text>
			<View
				className="flex-1 bg-input rounded-full"
				style={{ height: 8, borderWidth: 1, borderColor: 'rgb(50, 50, 80)' }}
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
				style={{ fontSize: 10, fontWeight: '800', width: 22, textAlign: 'right' }}
			>
				{value}
			</Text>
		</View>
	);
}
