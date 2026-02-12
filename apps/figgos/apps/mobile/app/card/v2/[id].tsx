import { useState, useEffect } from 'react';
import { View, Text, Pressable, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import type { FigureResponse } from '@figgos/shared';
import { api } from '../../../services/api';
import FlippableCard from '../../../components/FlippableCard';

export default function CardDetailV2Screen() {
	const { id } = useLocalSearchParams<{ id: string }>();
	const router = useRouter();
	const [figure, setFigure] = useState<FigureResponse | null>(null);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		if (!id) return;
		api.figures
			.get(id)
			.then(({ figure }) => setFigure(figure))
			.catch(() => setFigure(null))
			.finally(() => setLoading(false));
	}, [id]);

	if (loading) {
		return (
			<SafeAreaView className="flex-1 bg-background items-center justify-center">
				<ActivityIndicator color="rgb(255, 204, 0)" size="large" />
			</SafeAreaView>
		);
	}

	if (!figure) {
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
					Drag to rotate · Double-tap to flip
				</Text>
			</View>

			<View className="flex-1 items-center justify-center">
				<FlippableCard figure={figure} />
			</View>
		</SafeAreaView>
	);
}
