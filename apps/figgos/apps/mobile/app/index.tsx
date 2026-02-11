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
import type { FigureResponse, FigureRarity } from '@figgos/shared';

// ── Rarity ──

const RARITY_SHADOW: Record<FigureRarity, string> = {
	common: 'rgb(80, 90, 100)',
	rare: 'rgb(60, 120, 180)',
	epic: 'rgb(120, 80, 180)',
	legendary: 'rgb(180, 130, 20)',
};

function RarityBadge({ rarity }: { rarity: FigureRarity }) {
	const shadowColor = RARITY_SHADOW[rarity];
	const bgClass = `bg-rarity-${rarity}`;
	const fgClass = `text-rarity-${rarity}-foreground`;
	return (
		<View style={{ position: 'relative', alignSelf: 'center' }}>
			<View
				style={{
					position: 'absolute',
					top: 3,
					left: 2,
					right: -2,
					bottom: -3,
					borderRadius: 999,
					backgroundColor: shadowColor,
				}}
			/>
			<View
				className={`${bgClass} rounded-full`}
				style={{
					paddingHorizontal: 20,
					paddingVertical: 8,
					borderWidth: 2,
					borderColor: 'rgba(255,255,255,0.2)',
				}}
			>
				<Text
					className={`${fgClass}`}
					style={{ fontSize: 12, fontWeight: '900', letterSpacing: 2, textTransform: 'uppercase' }}
				>
					{rarity}
				</Text>
			</View>
		</View>
	);
}

// ── Screen ──

export default function CreateScreen() {
	const [name, setName] = useState('');
	const [description, setDescription] = useState('');
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [result, setResult] = useState<FigureResponse | null>(null);

	const handleGenerate = async () => {
		if (!name.trim() || !description.trim()) {
			setError('Give your figure a name and a story');
			return;
		}
		setLoading(true);
		setError(null);
		try {
			await new Promise((r) => setTimeout(r, 1500));
			const rarities: FigureRarity[] = [
				'common',
				'common',
				'common',
				'rare',
				'rare',
				'epic',
				'legendary',
			];
			setResult({
				id: 'mock-id',
				userId: 'mock-user',
				name: name.trim(),
				userInput: { description: description.trim() },
				imageUrl: null,
				rarity: rarities[Math.floor(Math.random() * rarities.length)],
				isPublic: false,
				isArchived: false,
				createdAt: new Date().toISOString(),
				updatedAt: new Date().toISOString(),
			});
		} catch (e: any) {
			setError(e.message || 'Something went wrong');
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

	// ── Result ──
	if (result) {
		return (
			<SafeAreaView className="flex-1 bg-background" edges={['top']}>
				<ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 40 }}>
					<View className="px-6 pt-8 items-center">
						{/* Badge */}
						<View
							className="bg-secondary rounded mb-5"
							style={{
								paddingHorizontal: 14,
								paddingVertical: 4,
								transform: [{ rotate: '-2deg' }],
							}}
						>
							<Text
								className="text-secondary-foreground"
								style={{
									fontSize: 11,
									fontWeight: '900',
									letterSpacing: 3,
									textTransform: 'uppercase',
								}}
							>
								Unboxing
							</Text>
						</View>

						{/* Figure Card */}
						<View className="w-full" style={{ position: 'relative' }}>
							<View
								className="bg-primary-dark rounded-lg"
								style={{ position: 'absolute', top: 5, left: 5, right: -5, bottom: -5 }}
							/>
							<View
								className="bg-surface rounded-lg"
								style={{ borderWidth: 3, borderColor: 'rgb(255, 204, 0)', padding: 24 }}
							>
								{/* Image */}
								<View
									className="bg-input rounded-lg self-center items-center justify-center mb-5"
									style={{
										width: 200,
										height: 200,
										borderWidth: 2,
										borderColor: 'rgb(50, 50, 80)',
									}}
								>
									<Text className="text-muted-foreground" style={{ fontSize: 12 }}>
										Image coming soon
									</Text>
								</View>

								<Text
									className="text-foreground text-center"
									style={{ fontSize: 22, fontWeight: '900', letterSpacing: -0.3 }}
								>
									{result.name}
								</Text>
								<Text
									className="text-muted-foreground text-center mt-3"
									style={{ fontSize: 14, lineHeight: 20 }}
								>
									{result.userInput.description}
								</Text>

								<View className="mt-4">
									<RarityBadge rarity={result.rarity} />
								</View>
							</View>
						</View>

						{/* Create Another */}
						<View className="w-full mt-8">
							<Pressable onPress={handleReset} className="active:opacity-90">
								<View style={{ position: 'relative' }}>
									<View
										style={{
											position: 'absolute',
											top: 5,
											left: 3,
											right: -3,
											bottom: -5,
											borderRadius: 8,
											backgroundColor: 'rgb(0, 150, 120)',
										}}
									/>
									<View
										className="bg-accent rounded-lg items-center justify-center"
										style={{
											paddingVertical: 16,
											borderWidth: 2,
											borderColor: 'rgba(255,255,255,0.15)',
										}}
									>
										<Text
											style={{
												fontSize: 16,
												fontWeight: '900',
												color: 'rgb(15, 15, 30)',
												letterSpacing: 1,
												textTransform: 'uppercase',
											}}
										>
											Create Another
										</Text>
									</View>
								</View>
							</Pressable>
						</View>
					</View>
				</ScrollView>
			</SafeAreaView>
		);
	}

	// ── Create ──
	return (
		<SafeAreaView className="flex-1 bg-background" edges={['top']}>
			<KeyboardAvoidingView
				behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
				className="flex-1"
			>
				<ScrollView
					className="flex-1"
					contentContainerStyle={{ paddingBottom: 40 }}
					keyboardShouldPersistTaps="handled"
				>
					{/* Header */}
					<View className="px-6 pt-10 pb-8 items-center">
						<View
							className="bg-secondary rounded mb-2"
							style={{
								paddingHorizontal: 14,
								paddingVertical: 4,
								transform: [{ rotate: '-2deg' }],
							}}
						>
							<Text
								className="text-secondary-foreground"
								style={{
									fontSize: 11,
									fontWeight: '900',
									letterSpacing: 3,
									textTransform: 'uppercase',
								}}
							>
								New Drop
							</Text>
						</View>
						<Text
							className="text-foreground text-center"
							style={{ fontSize: 32, fontWeight: '900', letterSpacing: -1 }}
						>
							CREATE YOUR{'\n'}FIGGO
						</Text>
					</View>

					{/* Form */}
					<View className="px-6">
						{/* Name */}
						<Text
							className="text-primary mb-2"
							style={{
								fontSize: 13,
								fontWeight: '900',
								letterSpacing: 3,
								textTransform: 'uppercase',
							}}
						>
							Name
						</Text>
						<View style={{ position: 'relative', marginBottom: 24 }}>
							<View
								className="bg-primary-dark rounded-lg"
								style={{ position: 'absolute', top: 5, left: 5, right: -5, bottom: -5 }}
							/>
							<TextInput
								className="bg-input text-foreground rounded-lg"
								style={{
									borderWidth: 3,
									borderColor: 'rgb(255, 204, 0)',
									paddingHorizontal: 16,
									height: 52,
									fontSize: 16,
								}}
								placeholder="Captain Thunderstrike"
								placeholderTextColor="rgb(136, 136, 170)"
								value={name}
								onChangeText={setName}
								maxLength={200}
							/>
						</View>

						{/* Story */}
						<Text
							className="text-primary mb-2"
							style={{
								fontSize: 13,
								fontWeight: '900',
								letterSpacing: 3,
								textTransform: 'uppercase',
							}}
						>
							Story
						</Text>
						<View style={{ position: 'relative', marginBottom: 24 }}>
							<View
								className="bg-primary-dark rounded-lg"
								style={{ position: 'absolute', top: 5, left: 5, right: -5, bottom: -5 }}
							/>
							<TextInput
								className="bg-input text-foreground rounded-lg"
								style={{
									borderWidth: 3,
									borderColor: 'rgb(255, 204, 0)',
									paddingHorizontal: 16,
									paddingVertical: 14,
									fontSize: 16,
									minHeight: 120,
									textAlignVertical: 'top',
								}}
								placeholder="A cyberpunk warrior with lightning gauntlets..."
								placeholderTextColor="rgb(136, 136, 170)"
								value={description}
								onChangeText={setDescription}
								multiline
								numberOfLines={4}
								maxLength={2000}
							/>
						</View>

						{/* Error */}
						{error && (
							<View
								className="bg-destructive/10 rounded-lg mb-4"
								style={{ borderWidth: 2, borderColor: 'rgba(255, 80, 80, 0.3)', padding: 12 }}
							>
								<Text
									className="text-destructive text-center"
									style={{ fontSize: 14, fontWeight: '600' }}
								>
									{error}
								</Text>
							</View>
						)}

						{/* Generate Button */}
						<Pressable
							onPress={handleGenerate}
							disabled={loading}
							className={`active:opacity-90 ${loading ? 'opacity-60' : ''}`}
						>
							<View style={{ position: 'relative' }}>
								<View
									className="bg-primary-dark rounded-lg"
									style={{ position: 'absolute', top: 6, left: 4, right: -4, bottom: -6 }}
								/>
								<View
									className="bg-primary rounded-lg items-center justify-center"
									style={{ paddingVertical: 18, borderWidth: 3, borderColor: 'rgb(255, 224, 102)' }}
								>
									{loading ? (
										<View className="flex-row items-center">
											<ActivityIndicator color="rgb(15, 15, 30)" size="small" />
											<Text
												className="text-primary-foreground ml-2"
												style={{
													fontSize: 18,
													fontWeight: '900',
													letterSpacing: 2,
													textTransform: 'uppercase',
												}}
											>
												Rolling...
											</Text>
										</View>
									) : (
										<Text
											className="text-primary-foreground"
											style={{
												fontSize: 18,
												fontWeight: '900',
												letterSpacing: 2,
												textTransform: 'uppercase',
											}}
										>
											Generate Figgo
										</Text>
									)}
								</View>
							</View>
						</Pressable>
					</View>
				</ScrollView>
			</KeyboardAvoidingView>
		</SafeAreaView>
	);
}
