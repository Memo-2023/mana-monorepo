import { useState } from 'react';
import { View, Text, Image, Dimensions } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import type { FigureResponse, FigureRarity } from '@figgos/shared';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

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

interface FlippableCardProps {
	figure: FigureResponse;
	maxWidth?: number;
	maxHeight?: number;
}

export default function FlippableCard({ figure, maxWidth, maxHeight }: FlippableCardProps) {
	const mW = maxWidth ?? SCREEN_WIDTH - 48;
	const mH = maxHeight ?? SCREEN_HEIGHT * 0.7;

	// Card size starts at max bounds, then snaps to image aspect ratio on load
	const [cardSize, setCardSize] = useState({ width: mW, height: mH });
	const [imageLoaded, setImageLoaded] = useState(false);

	const onImageLoad = (srcW: number, srcH: number) => {
		// Fit the source image dimensions into max bounds
		const scale = Math.min(mW / srcW, mH / srcH);
		setCardSize({
			width: Math.round(srcW * scale),
			height: Math.round(srcH * scale),
		});
		setImageLoaded(true);
	};

	const { width: cardWidth, height: cardHeight } = cardSize;

	// ── Gestures ──
	const rotateY = useSharedValue(0);
	const savedRotateY = useSharedValue(0);

	const pan = Gesture.Pan()
		.onUpdate((e) => {
			rotateY.value = savedRotateY.value + e.translationX * 0.5;
		})
		.onEnd(() => {
			const normalised = ((rotateY.value % 360) + 360) % 360;
			let target: number;
			if (normalised < 90) target = 0;
			else if (normalised < 270) target = 180;
			else target = 360;
			const snapTo = rotateY.value + (target - normalised);
			savedRotateY.value = snapTo % 360;
			rotateY.value = withSpring(snapTo, SPRING_CONFIG);
		});

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

	const profile = figure.generatedProfile;
	const rarityColor = RARITY_COLORS[figure.rarity];

	return (
		<GestureDetector gesture={composed}>
			<View style={{ width: cardWidth, height: cardHeight }}>
				{/* ── Front ── */}
				<Animated.View
					style={[{ position: 'absolute', width: cardWidth, height: cardHeight }, frontStyle]}
				>
					{figure.imageUrl ? (
						<Image
							source={{ uri: figure.imageUrl }}
							style={{ width: cardWidth, height: cardHeight }}
							resizeMode="contain"
							onLoad={(e) => {
								const { width: w, height: h } = e.nativeEvent.source;
								onImageLoad(w, h);
							}}
						/>
					) : (
						<View
							className="bg-surface items-center justify-center rounded-2xl"
							style={{
								width: '100%',
								height: '100%',
								borderWidth: 3,
								borderColor: rarityColor,
							}}
						>
							<Text className="text-foreground" style={{ fontSize: 18, fontWeight: '800' }}>
								{figure.name}
							</Text>
							<Text className="text-muted-foreground mt-2" style={{ fontSize: 12 }}>
								{figure.status === 'failed' ? 'Generation failed' : 'No image'}
							</Text>
						</View>
					)}
				</Animated.View>

				{/* ── Back ── */}
				<Animated.View
					style={[
						{
							position: 'absolute',
							width: cardWidth,
							height: cardHeight,
							borderRadius: 16,
							overflow: 'hidden',
						},
						backStyle,
					]}
				>
					<View
						className="bg-surface rounded-2xl"
						style={{
							flex: 1,
							borderWidth: 3,
							borderColor: rarityColor,
							padding: 16,
							justifyContent: 'space-between',
						}}
					>
						{/* Header: name + subtitle */}
						<View>
							<Text
								className="text-foreground"
								style={{ fontSize: 18, fontWeight: '900', letterSpacing: -0.5 }}
							>
								{figure.name}
							</Text>
							{profile?.subtitle && (
								<Text
									style={{
										fontSize: 9,
										fontWeight: '800',
										letterSpacing: 2,
										textTransform: 'uppercase',
										marginTop: 1,
										color: rarityColor,
									}}
								>
									{profile.subtitle}
								</Text>
							)}
						</View>

						{/* Backstory */}
						<Text
							className="text-muted-foreground"
							style={{ fontSize: 11, lineHeight: 16 }}
							numberOfLines={4}
						>
							{profile?.backstory || figure.userInput.description}
						</Text>

						{/* Stats */}
						{profile?.stats && (
							<View>
								<StatBar label="ATK" value={profile.stats.attack} color={STAT_COLORS.attack} />
								<StatBar label="DEF" value={profile.stats.defense} color={STAT_COLORS.defense} />
								<StatBar label="SPL" value={profile.stats.special} color={STAT_COLORS.special} />
							</View>
						)}

						{/* Special Attack */}
						{profile?.specialAttack && (
							<View className="bg-input rounded" style={{ padding: 8 }}>
								<Text
									className="text-primary"
									style={{
										fontSize: 9,
										fontWeight: '900',
										letterSpacing: 1,
										textTransform: 'uppercase',
									}}
								>
									⚡ {profile.specialAttack.name}
								</Text>
								<Text
									className="text-muted-foreground"
									style={{ fontSize: 9, lineHeight: 13, marginTop: 2 }}
									numberOfLines={2}
								>
									{profile.specialAttack.description}
								</Text>
							</View>
						)}

						{/* Items */}
						{profile?.items && profile.items.length > 0 && (
							<View className="flex-row flex-wrap" style={{ gap: 4 }}>
								{profile.items.map((item) => (
									<View
										key={item.name}
										className="bg-input rounded-full"
										style={{ paddingHorizontal: 8, paddingVertical: 3 }}
									>
										<Text
											className="text-foreground"
											style={{ fontSize: 8, fontWeight: '800', letterSpacing: 0.5 }}
										>
											{item.name}
										</Text>
									</View>
								))}
							</View>
						)}

						{/* Bottom: rarity + ID */}
						<View className="flex-row items-center justify-between">
							<View
								className="rounded-full"
								style={{
									paddingHorizontal: 10,
									paddingVertical: 3,
									backgroundColor: rarityColor,
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
									{figure.rarity}
								</Text>
							</View>
							<Text
								className="text-muted-foreground"
								style={{ fontSize: 9, fontWeight: '600', letterSpacing: 1 }}
							>
								#{figure.id.split('-').pop()?.toUpperCase()}
							</Text>
						</View>
					</View>
				</Animated.View>
			</View>
		</GestureDetector>
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
