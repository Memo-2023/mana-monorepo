import { useState, useRef, useCallback } from 'react';
import {
	View,
	Text,
	Image,
	Pressable,
	Animated,
	Dimensions,
	PanResponder,
	ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import type { FigureResponse, FigureRarity } from '@figgos/shared';
import { api } from '../../services/api';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = SCREEN_WIDTH * 0.72;
const CARD_HEIGHT = CARD_WIDTH * 1.45;
const VISIBLE_STACK = 4;
const SWIPE_THRESHOLD = 60;
const STACK_OFFSET = 22;

const RARITY_COLORS: Record<FigureRarity, string> = {
	common: 'rgb(136, 136, 170)',
	rare: 'rgb(100, 180, 255)',
	epic: 'rgb(180, 130, 255)',
	legendary: 'rgb(255, 185, 30)',
};

export default function StackScreen() {
	const router = useRouter();
	const [figures, setFigures] = useState<FigureResponse[]>([]);
	const [loading, setLoading] = useState(true);
	const [order, setOrder] = useState<number[]>([]);
	const [currentIndex, setCurrentIndex] = useState(0);
	const swipeY = useRef(new Animated.Value(0)).current;
	const isAnimating = useRef(false);

	useFocusEffect(
		useCallback(() => {
			api.figures
				.list()
				.then(({ figures }) => {
					setFigures(figures);
					setOrder(figures.map((_, i) => i));
					setCurrentIndex(0);
				})
				.finally(() => setLoading(false));
		}, [])
	);

	const dismissTop = useCallback(() => {
		if (isAnimating.current || figures.length === 0) return;
		isAnimating.current = true;

		Animated.timing(swipeY, {
			toValue: -500,
			duration: 250,
			useNativeDriver: true,
		}).start(() => {
			setOrder((prev) => [...prev.slice(1), prev[0]]);
			setCurrentIndex((prev) => (prev + 1) % figures.length);
			swipeY.setValue(0);
			isAnimating.current = false;
		});
	}, [swipeY, figures.length]);

	const snapBack = useCallback(() => {
		Animated.spring(swipeY, {
			toValue: 0,
			tension: 80,
			friction: 10,
			useNativeDriver: true,
		}).start();
	}, [swipeY]);

	const panResponder = useRef(
		PanResponder.create({
			onStartShouldSetPanResponder: () => false,
			onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dy) > 15,
			onPanResponderMove: (_, g) => {
				if (g.dy < 0) {
					swipeY.setValue(g.dy);
				}
			},
			onPanResponderRelease: (_, g) => {
				if (g.dy < -SWIPE_THRESHOLD || g.vy < -0.5) {
					dismissTop();
				} else {
					snapBack();
				}
			},
		})
	).current;

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

	const topFigure = figures[order[0]];

	const topOpacity = swipeY.interpolate({
		inputRange: [-200, 0],
		outputRange: [0.3, 1],
		extrapolate: 'clamp',
	});

	const stackHeight = CARD_HEIGHT + (VISIBLE_STACK - 1) * STACK_OFFSET;

	return (
		<SafeAreaView className="flex-1 bg-background" edges={['top']}>
			<View style={{ paddingHorizontal: 20, paddingTop: 24, paddingBottom: 8 }}>
				<Text
					className="text-foreground"
					style={{ fontSize: 28, fontWeight: '900', letterSpacing: -0.5 }}
				>
					Stack
				</Text>
				<Text className="text-muted-foreground" style={{ fontSize: 13, marginTop: 2 }}>
					Swipe up to browse
				</Text>
			</View>

			<View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingBottom: 20 }}>
				<View style={{ width: CARD_WIDTH, height: stackHeight }}>
					{order
						.slice(1, VISIBLE_STACK)
						.reverse()
						.map((cardIdx, reverseI) => {
							const depth = VISIBLE_STACK - 1 - reverseI;
							const figure = figures[cardIdx];
							if (!figure) return null;
							const shrink = depth * 8;
							return (
								<View
									key={`bg-${depth}-${figure.id}`}
									style={{
										position: 'absolute',
										top: depth * STACK_OFFSET,
										left: shrink / 2,
										width: CARD_WIDTH - shrink,
										height: CARD_HEIGHT,
										opacity: 1 - depth * 0.15,
									}}
								>
									<View
										style={{ width: '100%', height: '100%', borderRadius: 14, overflow: 'hidden' }}
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
													borderRadius: 14,
													borderWidth: 1,
													borderColor: 'rgb(50,50,80)',
												}}
											>
												<Text className="text-muted-foreground" style={{ fontSize: 11 }}>
													{figure.name}
												</Text>
											</View>
										)}
									</View>
								</View>
							);
						})}

					{topFigure && (
						<Animated.View
							{...panResponder.panHandlers}
							style={{
								position: 'absolute',
								top: 0,
								width: CARD_WIDTH,
								height: CARD_HEIGHT,
								transform: [{ translateY: swipeY }],
								opacity: topOpacity,
							}}
						>
							<Pressable
								onPress={() => router.push(`/card/v2/${topFigure.id}` as any)}
								className="active:opacity-90"
								style={{ width: '100%', height: '100%' }}
							>
								<View
									style={{ width: '100%', height: '100%', borderRadius: 14, overflow: 'hidden' }}
								>
									{topFigure.imageUrl ? (
										<Image
											source={{ uri: topFigure.imageUrl }}
											style={{ width: '100%', height: '100%' }}
											resizeMode="cover"
										/>
									) : (
										<View
											className="bg-surface items-center justify-center"
											style={{
												width: '100%',
												height: '100%',
												borderRadius: 14,
												borderWidth: 2,
												borderColor: RARITY_COLORS[topFigure.rarity],
											}}
										>
											<Text className="text-foreground" style={{ fontSize: 16, fontWeight: '800' }}>
												{topFigure.name}
											</Text>
										</View>
									)}
								</View>
							</Pressable>
						</Animated.View>
					)}
				</View>

				<View className="flex-row items-center" style={{ marginTop: 20, gap: 6 }}>
					{figures.map((figure, i) => (
						<View
							key={figure.id}
							style={{
								width: i === currentIndex ? 20 : 8,
								height: 8,
								borderRadius: 4,
								backgroundColor:
									i === currentIndex ? RARITY_COLORS[figure.rarity] : 'rgb(50, 50, 80)',
							}}
						/>
					))}
				</View>
			</View>
		</SafeAreaView>
	);
}
