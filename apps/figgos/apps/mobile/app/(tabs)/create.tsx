import { useState } from 'react';
import {
	View,
	Text,
	TextInput,
	Pressable,
	ScrollView,
	KeyboardAvoidingView,
	Platform,
	ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { api } from '~/services/api';
import type { FigureResponse, FigureRarity } from '@figgos/shared';

const RARITY_STYLES: Record<FigureRarity, { bg: string; text: string }> = {
	common: { bg: 'bg-rarity-common', text: 'text-rarity-common-foreground' },
	rare: { bg: 'bg-rarity-rare', text: 'text-rarity-rare-foreground' },
	epic: { bg: 'bg-rarity-epic', text: 'text-rarity-epic-foreground' },
	legendary: { bg: 'bg-rarity-legendary', text: 'text-rarity-legendary-foreground' },
};

function RarityBadge({ rarity }: { rarity: FigureRarity }) {
	const s = RARITY_STYLES[rarity];
	return (
		<View className={`${s.bg} px-3 py-1 rounded-full`}>
			<Text className={`${s.text} text-xs font-bold uppercase`}>{rarity}</Text>
		</View>
	);
}

export default function CreateScreen() {
	const [name, setName] = useState('');
	const [description, setDescription] = useState('');
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [result, setResult] = useState<FigureResponse | null>(null);

	const handleGenerate = async () => {
		if (!name.trim() || !description.trim()) {
			setError('Please enter a name and description');
			return;
		}
		setLoading(true);
		setError(null);
		try {
			const { figure } = await api.figures.create(name.trim(), description.trim());
			setResult(figure);
		} catch (e: any) {
			setError(e.message || 'Failed to create figure');
		} finally {
			setLoading(false);
		}
	};

	const handleReset = () => {
		setName('');
		setDescription('');
		setResult(null);
		setError(null);
	};

	if (result) {
		return (
			<SafeAreaView className="flex-1 bg-background" edges={['bottom']}>
				<ScrollView className="flex-1 px-6 pt-4">
					<View className="bg-surface rounded-2xl border border-border p-6 items-center">
						<View className="w-48 h-48 bg-muted rounded-xl items-center justify-center mb-4">
							<Text className="text-4xl">🎭</Text>
						</View>
						<Text className="text-xl font-bold text-foreground">{result.name}</Text>
						<Text className="text-sm text-muted-foreground mt-1 text-center">
							{result.userInput.description}
						</Text>
						<View className="mt-3">
							<RarityBadge rarity={result.rarity} />
						</View>
					</View>

					<Pressable
						onPress={handleReset}
						className="bg-primary rounded-lg py-3 mt-6 mb-8 active:opacity-80"
					>
						<Text className="text-primary-foreground text-center font-semibold">
							Create Another
						</Text>
					</Pressable>
				</ScrollView>
			</SafeAreaView>
		);
	}

	return (
		<SafeAreaView className="flex-1 bg-background" edges={['bottom']}>
			<KeyboardAvoidingView
				behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
				className="flex-1"
			>
				<ScrollView className="flex-1 px-6 pt-4">
					<Text className="text-2xl font-bold text-foreground mb-2">Create a Figure</Text>
					<Text className="text-muted-foreground mb-6">
						Describe your character and we'll generate a collectible figure.
					</Text>

					<Text className="text-sm font-medium text-foreground mb-1">Name</Text>
					<TextInput
						className="bg-surface border border-border rounded-lg px-4 py-3 text-foreground mb-4"
						placeholder="e.g. Captain Thunderstrike"
						placeholderTextColor="rgb(99 110 114)"
						value={name}
						onChangeText={setName}
						maxLength={200}
					/>

					<Text className="text-sm font-medium text-foreground mb-1">Description</Text>
					<TextInput
						className="bg-surface border border-border rounded-lg px-4 py-3 text-foreground mb-4"
						placeholder="e.g. A cyberpunk warrior with lightning gauntlets"
						placeholderTextColor="rgb(99 110 114)"
						value={description}
						onChangeText={setDescription}
						multiline
						numberOfLines={3}
						style={{ textAlignVertical: 'top', minHeight: 80 }}
						maxLength={2000}
					/>

					{error && <Text className="text-destructive text-center mb-4">{error}</Text>}

					<Pressable
						onPress={handleGenerate}
						disabled={loading}
						className={`bg-primary rounded-lg py-4 active:opacity-80 ${loading ? 'opacity-50' : ''}`}
					>
						{loading ? (
							<View className="flex-row items-center justify-center">
								<ActivityIndicator color="white" size="small" />
								<Text className="text-primary-foreground font-semibold ml-2">Generating...</Text>
							</View>
						) : (
							<Text className="text-primary-foreground text-center font-semibold text-base">
								Generate Figure
							</Text>
						)}
					</Pressable>
				</ScrollView>
			</KeyboardAvoidingView>
		</SafeAreaView>
	);
}
