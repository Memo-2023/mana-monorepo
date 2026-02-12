import { useRef, useState, useCallback } from 'react';
import {
	View,
	Text,
	Image,
	Pressable,
	Animated,
	Dimensions,
	ActivityIndicator,
	Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from 'expo-router';
import type { FigureResponse, FigureRarity } from '@figgos/shared';
import { api } from '../../services/api';
import FlippableCard from '../../components/FlippableCard';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = SCREEN_WIDTH * 0.8;
const CARD_HEIGHT = CARD_WIDTH * 1.45;
const SPACING = 12;
const SIDE_SPACE = (SCREEN_WIDTH - CARD_WIDTH) / 2;

const RARITY_COLORS: Record<FigureRarity, string> = {
	common: 'rgb(136, 136, 170)',
	rare: 'rgb(100, 180, 255)',
	epic: 'rgb(180, 130, 255)',
	legendary: 'rgb(255, 185, 30)',
};

export default function CarouselScreen() {
	const scrollX = useRef(new Animated.Value(0)).current;
	const [figures, setFigures] = useState<FigureResponse[]>([]);
	const [loading, setLoading] = useState(true);
	const [selected, setSelected] = useState<FigureResponse | null>(null);

	useFocusEffect(
		useCallback(() => {
			api.figures
				.list()
				.then(async ({ figures }) => {
					const withImages = figures.filter((f) => f.imageUrl);
					const checks = await Promise.all(
						withImages.map(async (f) => {
							try {
								await Image.prefetch(f.imageUrl!);
								return f;
							} catch {
								return null;
							}
						})
					);
					setFigures(checks.filter((f): f is FigureResponse => f !== null));
				})
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
			<View style={{ paddingHorizontal: 20, paddingTop: 16, paddingBottom: 8 }}>
				<Text
					className="text-foreground"
					style={{ fontSize: 28, fontWeight: '900', letterSpacing: -0.5 }}
				>
					Showcase
				</Text>
			</View>
			<View style={{ flex: 1, justifyContent: 'center', marginTop: -80 }}>
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
								<Pressable onPress={() => setSelected(item)} className="active:opacity-90">
									<View
										style={{
											width: CARD_WIDTH,
											height: CARD_HEIGHT,
											borderRadius: 14,
											overflow: 'hidden',
										}}
									>
										<Image
											source={{ uri: item.imageUrl! }}
											style={{ width: '100%', height: '100%' }}
											resizeMode="cover"
										/>
									</View>
								</Pressable>
							</Animated.View>
						);
					}}
				/>
			</View>

			{/* Card Detail Overlay */}
			<Modal
				visible={selected !== null}
				transparent
				animationType="fade"
				onRequestClose={() => setSelected(null)}
			>
				<Pressable
					onPress={() => setSelected(null)}
					style={{
						flex: 1,
						backgroundColor: 'rgba(5, 5, 15, 0.92)',
						justifyContent: 'center',
						alignItems: 'center',
					}}
				>
					<Pressable onPress={() => {}}>
						{selected && (
							<View style={{ alignItems: 'center' }}>
								<Text
									className="text-muted-foreground"
									style={{
										fontSize: 12,
										fontWeight: '600',
										marginBottom: 12,
									}}
								>
									Drag to rotate · Double-tap to flip
								</Text>
								<FlippableCard figure={selected} maxWidth={SCREEN_WIDTH - 48} />
							</View>
						)}
					</Pressable>
				</Pressable>
			</Modal>
		</SafeAreaView>
	);
}
