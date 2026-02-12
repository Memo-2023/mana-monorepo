import { useState, useRef, useEffect } from 'react';
import {
	View,
	Text,
	TextInput,
	Pressable,
	ScrollView,
	KeyboardAvoidingView,
	Platform,
	ActivityIndicator,
	Image,
	Alert,
	Dimensions,
} from 'react-native';
import type { ScrollView as ScrollViewType } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, {
	useSharedValue,
	useAnimatedStyle,
	withRepeat,
	withTiming,
	withSequence,
	Easing,
	FadeIn,
	FadeOut,
} from 'react-native-reanimated';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import type { FigureResponse } from '@figgos/shared';
import { api } from '../../services/api';
import FlippableCard from '../../components/FlippableCard';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = SCREEN_WIDTH - 64;
const PLACEHOLDER_HEIGHT = CARD_WIDTH * 1.5;

// Random placeholder from our cole cards
const PLACEHOLDER_IMAGES = [
	require('../../assets/images/cole-common.png'),
	require('../../assets/images/cole-rare.png'),
	require('../../assets/images/cole-epic.png'),
	require('../../assets/images/cole-kraft.png'),
];

const LOADING_MESSAGES = [
	'Rolling rarity...',
	'Crafting backstory...',
	'Forging stats...',
	'Designing figure...',
	'Painting details...',
	'Assembling packaging...',
	'Almost there...',
];

// ── Screen ──

export default function CreateScreen() {
	const [name, setName] = useState('');
	const [description, setDescription] = useState('');
	const storyRef = useRef<TextInput>(null);
	const scrollRef = useRef<ScrollViewType>(null);
	const storyLayoutY = useRef(0);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [result, setResult] = useState<FigureResponse | null>(null);
	const [imageUri, setImageUri] = useState<string | null>(null);
	const [loadingMsg, setLoadingMsg] = useState(0);
	const [placeholderImg] = useState(
		() => PLACEHOLDER_IMAGES[Math.floor(Math.random() * PLACEHOLDER_IMAGES.length)]
	);

	const pickImage = () => {
		Alert.alert('Reference Photo', 'How would you like to add a photo?', [
			{
				text: 'Take a Selfie',
				onPress: async () => {
					const { status } = await ImagePicker.requestCameraPermissionsAsync();
					if (status !== 'granted') {
						setError('Camera permission is required for selfies');
						return;
					}
					const result = await ImagePicker.launchCameraAsync({
						allowsEditing: true,
						quality: 0.7,
						cameraType: ImagePicker.CameraType.front,
					});
					if (!result.canceled && result.assets[0]) {
						setImageUri(result.assets[0].uri);
					}
				},
			},
			{
				text: 'Choose from Library',
				onPress: async () => {
					const result = await ImagePicker.launchImageLibraryAsync({
						mediaTypes: ['images'],
						allowsEditing: true,
						quality: 0.7,
					});
					if (!result.canceled && result.assets[0]) {
						setImageUri(result.assets[0].uri);
					}
				},
			},
			{ text: 'Cancel', style: 'cancel' },
		]);
	};

	// Cycle loading messages
	useEffect(() => {
		if (!loading) return;
		const interval = setInterval(() => {
			setLoadingMsg((prev) => (prev + 1) % LOADING_MESSAGES.length);
		}, 2500);
		return () => clearInterval(interval);
	}, [loading]);

	const prepareImage = async (uri: string): Promise<string> => {
		const result = await ImageManipulator.manipulateAsync(uri, [{ resize: { width: 512 } }], {
			compress: 0.8,
			format: ImageManipulator.SaveFormat.JPEG,
			base64: true,
		});
		return result.base64!;
	};

	const handleGenerate = async () => {
		if (!name.trim() || !description.trim()) {
			setError('Give your figure a name and a story');
			return;
		}
		setLoading(true);
		setError(null);
		setLoadingMsg(0);
		try {
			let faceImage: string | undefined;
			if (imageUri) {
				faceImage = await prepareImage(imageUri);
			}
			const { figure } = await api.figures.create(name.trim(), description.trim(), 'en', faceImage);
			setLoading(false);
			if (figure.status === 'failed') {
				setError(figure.errorMessage || 'Generation failed — try a different description');
				return;
			}
			setResult(figure);
		} catch (e: any) {
			setError(e.message || 'Something went wrong');
			setLoading(false);
		}
	};

	const handleReset = () => {
		setName('');
		setDescription('');
		setResult(null);
		setError(null);
		setImageUri(null);
	};

	// ── Loading / Generating ──
	if (loading) {
		return (
			<SafeAreaView className="flex-1 bg-background" edges={['top']}>
				{/* Banner + hint */}
				<View className="items-center" style={{ paddingTop: 16, paddingBottom: 8 }}>
					<View
						className="bg-secondary rounded mb-2"
						style={{
							paddingHorizontal: 18,
							paddingVertical: 6,
							transform: [{ rotate: '-2deg' }],
						}}
					>
						<Text
							className="text-secondary-foreground"
							style={{
								fontSize: 14,
								fontWeight: '900',
								letterSpacing: 3,
								textTransform: 'uppercase',
							}}
						>
							Generating
						</Text>
					</View>
					<Text className="text-muted-foreground" style={{ fontSize: 13, fontWeight: '600' }}>
						{LOADING_MESSAGES[loadingMsg]}
					</Text>
				</View>

				{/* Blurred placeholder card — shifted slightly upward */}
				<View className="flex-1 items-center justify-center" style={{ paddingBottom: 120 }}>
					<View style={{ width: CARD_WIDTH, height: PLACEHOLDER_HEIGHT }}>
						<Animated.Image
							entering={FadeIn.duration(400)}
							source={placeholderImg}
							style={{
								width: CARD_WIDTH,
								height: PLACEHOLDER_HEIGHT,
								borderRadius: 16,
								opacity: 0.25,
							}}
							resizeMode="cover"
							blurRadius={20}
						/>
						<PulsingOverlay width={CARD_WIDTH} height={PLACEHOLDER_HEIGHT} />
					</View>
				</View>
			</SafeAreaView>
		);
	}

	// ── Result ──
	if (result) {
		return (
			<SafeAreaView className="flex-1 bg-background" edges={['top']}>
				{/* Banner + hint */}
				<View className="items-center" style={{ paddingTop: 16, paddingBottom: 8 }}>
					<View
						className="bg-secondary rounded mb-2"
						style={{
							paddingHorizontal: 18,
							paddingVertical: 6,
							transform: [{ rotate: '-2deg' }],
						}}
					>
						<Text
							className="text-secondary-foreground"
							style={{
								fontSize: 14,
								fontWeight: '900',
								letterSpacing: 3,
								textTransform: 'uppercase',
							}}
						>
							Unboxing
						</Text>
					</View>
					<Text className="text-muted-foreground" style={{ fontSize: 13, fontWeight: '600' }}>
						Drag to rotate · Double-tap to flip
					</Text>
				</View>

				{/* Flippable Card — shifted slightly upward */}
				<View className="flex-1 items-center justify-center" style={{ paddingBottom: 120 }}>
					<FlippableCard figure={result} maxWidth={CARD_WIDTH} />
				</View>

				{/* Create Another — overlaid at bottom, above tab bar */}
				<View
					style={{
						position: 'absolute',
						bottom: 110,
						left: 0,
						right: 0,
						alignItems: 'center',
					}}
				>
					<Pressable onPress={handleReset} className="active:opacity-80">
						<View
							className="bg-accent rounded-full flex-row items-center"
							style={{
								paddingHorizontal: 16,
								paddingVertical: 8,
								borderWidth: 2,
								borderColor: 'rgba(255,255,255,0.15)',
								gap: 6,
							}}
						>
							<Text
								style={{
									fontSize: 13,
									fontWeight: '900',
									color: 'rgb(15, 15, 30)',
									letterSpacing: 1,
									textTransform: 'uppercase',
								}}
							>
								+ Create Another
							</Text>
						</View>
					</Pressable>
				</View>
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
					ref={scrollRef}
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
								returnKeyType="next"
								blurOnSubmit={false}
								onSubmitEditing={() => {
									storyRef.current?.focus();
									scrollRef.current?.scrollTo({ y: storyLayoutY.current - 20, animated: true });
								}}
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
							onLayout={(e) => {
								storyLayoutY.current = e.nativeEvent.layout.y;
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
								ref={storyRef}
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
								onFocus={() => {
									scrollRef.current?.scrollToEnd({ animated: true });
								}}
							/>
						</View>

						{/* Reference Photo */}
						<View style={{ position: 'relative', marginBottom: 24 }}>
							<View
								className="bg-primary-dark rounded-lg"
								style={{ position: 'absolute', top: 3, left: 3, right: -3, bottom: -3 }}
							/>
							{imageUri ? (
								<View
									className="bg-input rounded-lg flex-row items-center"
									style={{
										borderWidth: 3,
										borderColor: 'rgb(255, 204, 0)',
										paddingHorizontal: 14,
										paddingVertical: 10,
										gap: 10,
									}}
								>
									<Image
										source={{ uri: imageUri }}
										style={{
											width: 40,
											height: 40,
											borderRadius: 20,
											borderWidth: 2,
											borderColor: 'rgb(255, 204, 0)',
										}}
									/>
									<Text
										className="text-foreground"
										style={{ fontSize: 14, fontWeight: '600', flex: 1 }}
									>
										Photo added
									</Text>
									<Pressable
										onPress={() => setImageUri(null)}
										className="active:opacity-70"
										style={{
											width: 28,
											height: 28,
											borderRadius: 14,
											backgroundColor: 'rgba(255, 80, 80, 0.2)',
											alignItems: 'center',
											justifyContent: 'center',
										}}
									>
										<Text style={{ fontSize: 14, fontWeight: '800', color: 'rgb(255, 80, 80)' }}>
											×
										</Text>
									</Pressable>
								</View>
							) : (
								<Pressable onPress={pickImage} className="active:opacity-80">
									<View
										className="bg-input rounded-lg flex-row items-center"
										style={{
											borderWidth: 3,
											borderColor: 'rgb(255, 204, 0)',
											paddingHorizontal: 14,
											paddingVertical: 12,
										}}
									>
										<Text style={{ fontSize: 20 }}>📷</Text>
										<Text
											className="text-muted-foreground"
											style={{ fontSize: 14, fontWeight: '600', flex: 1, marginLeft: 10 }}
										>
											Add a face photo
										</Text>
										<Text
											className="text-muted-foreground"
											style={{ fontSize: 10, fontWeight: '600', marginRight: 4 }}
										>
											optional
										</Text>
										<Text className="text-muted-foreground" style={{ fontSize: 16 }}>
											›
										</Text>
									</View>
								</Pressable>
							)}
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
												Generating...
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

// ── Pulsing shimmer overlay for loading card ──
function PulsingOverlay({ width, height }: { width: number; height: number }) {
	const opacity = useSharedValue(0.3);

	useEffect(() => {
		opacity.value = withRepeat(
			withSequence(
				withTiming(0.7, { duration: 1200, easing: Easing.inOut(Easing.ease) }),
				withTiming(0.3, { duration: 1200, easing: Easing.inOut(Easing.ease) })
			),
			-1,
			false
		);
	}, []);

	const style = useAnimatedStyle(() => ({
		opacity: opacity.value,
	}));

	return (
		<Animated.View
			style={[
				{
					position: 'absolute',
					top: 0,
					left: 0,
					width,
					height,
					borderRadius: 16,
					backgroundColor: 'rgb(255, 204, 0)',
				},
				style,
			]}
		/>
	);
}
