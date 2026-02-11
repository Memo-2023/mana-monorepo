import { useState, useCallback } from 'react';
import {
	View,
	Text,
	Image,
	Pressable,
	FlatList,
	Dimensions,
	ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import type { FigureResponse } from '@figgos/shared';
import { api } from '../../services/api';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const GAP = 10;
const PADDING = 14;
const COLUMNS = 2;
const CARD_WIDTH = (SCREEN_WIDTH - PADDING * 2 - GAP * (COLUMNS - 1)) / COLUMNS;
const CARD_HEIGHT = CARD_WIDTH * 1.45;

function CardThumbnail({ figure }: { figure: FigureResponse }) {
	const router = useRouter();

	return (
		<Pressable
			onPress={() => router.push(`/card/v2/${figure.id}` as any)}
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
							borderWidth: 2,
							borderColor: 'rgb(50, 50, 80)',
							borderRadius: 12,
						}}
					>
						<Text className="text-muted-foreground" style={{ fontSize: 11 }}>
							{figure.name}
						</Text>
					</View>
				)}
			</View>
		</Pressable>
	);
}

export default function CollectionScreen() {
	const [figures, setFigures] = useState<FigureResponse[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	useFocusEffect(
		useCallback(() => {
			setLoading(true);
			api.figures
				.list()
				.then(({ figures }) => {
					setFigures(figures);
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
					renderItem={({ item }) => <CardThumbnail figure={item} />}
				/>
			)}
		</SafeAreaView>
	);
}
