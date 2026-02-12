import { useState, useCallback } from 'react';
import {
	View,
	Text,
	Image,
	Pressable,
	FlatList,
	Dimensions,
	ActivityIndicator,
	Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import type { FigureResponse } from '@figgos/shared';
import { api } from '../../services/api';
import FlippableCard from '../../components/FlippableCard';
import { shareFigure } from '../../utils/share-figure';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const GAP = 10;
const PADDING = 14;
const COLUMNS = 2;
const CARD_WIDTH = (SCREEN_WIDTH - PADDING * 2 - GAP * (COLUMNS - 1)) / COLUMNS;
const CARD_HEIGHT = CARD_WIDTH * 1.45;

function CardThumbnail({
	figure,
	onPress,
}: {
	figure: FigureResponse;
	onPress: (f: FigureResponse) => void;
}) {
	return (
		<Pressable
			onPress={() => onPress(figure)}
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
				<Image
					source={{ uri: figure.imageUrl! }}
					style={{ width: '100%', height: '100%' }}
					resizeMode="contain"
				/>
			</View>
		</Pressable>
	);
}

export default function CollectionScreen() {
	const [figures, setFigures] = useState<FigureResponse[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [selected, setSelected] = useState<FigureResponse | null>(null);

	useFocusEffect(
		useCallback(() => {
			setLoading(true);
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
					setError(null);
				})
				.catch((e) => setError(e.message))
				.finally(() => setLoading(false));
		}, [])
	);

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
					{loading ? '...' : `${figures.length} ${figures.length === 1 ? 'Figgo' : 'Figgos'}`}
				</Text>
			</View>

			{loading ? (
				<View className="flex-1 items-center justify-center">
					<ActivityIndicator color="rgb(255, 204, 0)" size="large" />
				</View>
			) : error ? (
				<View className="flex-1 items-center justify-center px-6">
					<Text className="text-destructive text-center" style={{ fontSize: 14 }}>
						{error}
					</Text>
				</View>
			) : figures.length === 0 ? (
				<View className="flex-1 items-center justify-center px-6">
					<Text
						className="text-muted-foreground text-center"
						style={{ fontSize: 16, fontWeight: '700' }}
					>
						No figures yet
					</Text>
					<Text className="text-muted-foreground text-center mt-2" style={{ fontSize: 13 }}>
						Create your first Figgo!
					</Text>
				</View>
			) : (
				<FlatList
					data={figures}
					numColumns={COLUMNS}
					keyExtractor={(item) => item.id}
					contentContainerStyle={{ paddingHorizontal: PADDING, paddingBottom: 40 }}
					columnWrapperStyle={{ gap: GAP, marginBottom: GAP }}
					renderItem={({ item }) => <CardThumbnail figure={item} onPress={setSelected} />}
				/>
			)}

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
									style={{ fontSize: 12, fontWeight: '600', marginBottom: 12 }}
								>
									Drag to rotate · Double-tap to flip
								</Text>
								<FlippableCard figure={selected} maxWidth={SCREEN_WIDTH - 48} />
								<Pressable
									onPress={() => shareFigure(selected)}
									className="active:opacity-90"
									style={{ marginTop: 24 }}
								>
									<View style={{ position: 'relative' }}>
										<View
											className="bg-primary-dark rounded-lg"
											style={{ position: 'absolute', top: 5, left: 4, right: -4, bottom: -5 }}
										/>
										<View
											className="bg-primary rounded-lg flex-row items-center justify-center"
											style={{
												paddingHorizontal: 20,
												paddingVertical: 12,
												borderWidth: 3,
												borderColor: 'rgb(255, 224, 102)',
												gap: 8,
											}}
										>
											<Ionicons name="paper-plane" size={18} color="rgb(15, 15, 30)" />
											<Text
												style={{
													fontSize: 15,
													fontWeight: '900',
													letterSpacing: 2,
													textTransform: 'uppercase',
													color: 'rgb(15, 15, 30)',
												}}
											>
												Share It
											</Text>
										</View>
									</View>
								</Pressable>
							</View>
						)}
					</Pressable>
				</Pressable>
			</Modal>
		</SafeAreaView>
	);
}
