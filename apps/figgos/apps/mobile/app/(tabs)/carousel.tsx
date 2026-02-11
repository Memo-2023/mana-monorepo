import { useRef, useState, useCallback } from 'react';
import {
	View,
	Text,
	Image,
	Pressable,
	Animated,
	Dimensions,
	ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import type { FigureResponse, FigureRarity } from '@figgos/shared';
import { api } from '../../services/api';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = SCREEN_WIDTH * 0.65;
const CARD_HEIGHT = CARD_WIDTH * 1.45;
const SPACING = 14;
const SIDE_SPACE = (SCREEN_WIDTH - CARD_WIDTH) / 2;

const RARITY_COLORS: Record<FigureRarity, string> = {
	common: 'rgb(136, 136, 170)',
	rare: 'rgb(100, 180, 255)',
	epic: 'rgb(180, 130, 255)',
	legendary: 'rgb(255, 185, 30)',
};

export default function CarouselScreen() {
	const router = useRouter();
	const scrollX = useRef(new Animated.Value(0)).current;
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

	if (loading) {
		return (
			<SafeAreaView className="flex-1 bg-background items-center justify-center" edges={['top']}>
				<ActivityIndicator color="rgb(255, 204, 0)" size="large" />
			</SafeAreaView>
		);
	}

	if (figures.length === 0) {
		return (
			<SafeAreaView className="flex-1 bg-background items-center justify-center" edges={['top']}>
				<Text className="text-muted-foreground" style={{ fontSize: 16, fontWeight: '700' }}>
					No figures yet
				</Text>
			</SafeAreaView>
		);
	}

	return (
		<SafeAreaView className="flex-1 bg-background" edges={['top']}>
			<View style={{ paddingHorizontal: 20, paddingTop: 24, paddingBottom: 16 }}>
				<Text
					className="text-foreground"
					style={{ fontSize: 28, fontWeight: '900', letterSpacing: -0.5 }}
				>
					Showcase
				</Text>
			</View>

			<View style={{ flex: 1, justifyContent: 'center' }}>
				<Animated.FlatList
					data={figures}
					keyExtractor={(item) => item.id}
					horizontal
					showsHorizontalScrollIndicator={false}
					snapToInterval={CARD_WIDTH + SPACING}
					decelerationRate="fast"
					contentContainerStyle={{
						paddingHorizontal: SIDE_SPACE,
						alignItems: 'center',
					}}
					onScroll={Animated.event([{ nativeEvent: { contentOffset: { x: scrollX } } }], {
						useNativeDriver: true,
					})}
					renderItem={({ item, index }) => {
						const inputRange = [
							(index - 1) * (CARD_WIDTH + SPACING),
							index * (CARD_WIDTH + SPACING),
							(index + 1) * (CARD_WIDTH + SPACING),
						];

						const scale = scrollX.interpolate({
							inputRange,
							outputRange: [0.85, 1, 0.85],
							extrapolate: 'clamp',
						});

						const opacity = scrollX.interpolate({
							inputRange,
							outputRange: [0.5, 1, 0.5],
							extrapolate: 'clamp',
						});

						const rotate = scrollX.interpolate({
							inputRange,
							outputRange: ['4deg', '0deg', '-4deg'],
							extrapolate: 'clamp',
						});

						return (
							<Animated.View
								style={{
									width: CARD_WIDTH,
									marginRight: SPACING,
									transform: [{ scale }, { rotate }],
									opacity,
								}}
							>
								<Pressable
									onPress={() => router.push(`/card/v2/${item.id}` as any)}
									className="active:opacity-90"
								>
									<View
										style={{
											width: CARD_WIDTH,
											height: CARD_HEIGHT,
											borderRadius: 14,
											overflow: 'hidden',
										}}
									>
										{item.imageUrl ? (
											<Image
												source={{ uri: item.imageUrl }}
												style={{ width: '100%', height: '100%' }}
												resizeMode="cover"
											/>
										) : (
											<View
												className="bg-surface items-center justify-center"
												style={{
													width: '100%',
													height: '100%',
													borderWidth: 2,
													borderColor: RARITY_COLORS[item.rarity],
													borderRadius: 14,
												}}
											>
												<Text
													className="text-foreground"
													style={{ fontSize: 14, fontWeight: '800' }}
												>
													{item.name}
												</Text>
											</View>
										)}
									</View>
								</Pressable>
							</Animated.View>
						);
					}}
				/>
			</View>

			<View className="flex-row items-center justify-center" style={{ paddingBottom: 24, gap: 8 }}>
				{figures.map((figure, i) => {
					const inputRange = [
						(i - 1) * (CARD_WIDTH + SPACING),
						i * (CARD_WIDTH + SPACING),
						(i + 1) * (CARD_WIDTH + SPACING),
					];

					const dotScale = scrollX.interpolate({
						inputRange,
						outputRange: [1, 1.4, 1],
						extrapolate: 'clamp',
					});

					const dotOpacity = scrollX.interpolate({
						inputRange,
						outputRange: [0.3, 1, 0.3],
						extrapolate: 'clamp',
					});

					return (
						<Animated.View
							key={figure.id}
							style={{
								width: 8,
								height: 8,
								borderRadius: 4,
								backgroundColor: RARITY_COLORS[figure.rarity],
								transform: [{ scale: dotScale }],
								opacity: dotOpacity,
							}}
						/>
					);
				})}
			</View>
		</SafeAreaView>
	);
}
