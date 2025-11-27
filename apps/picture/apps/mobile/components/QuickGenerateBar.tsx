import { useState, useEffect, useRef } from 'react';
import {
	View,
	TextInput,
	ScrollView,
	KeyboardAvoidingView,
	Platform,
	ActivityIndicator,
	Keyboard,
	ViewStyle,
	TextStyle,
	Pressable,
	PlatformColor,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LiquidGlassView } from '@callstack/liquid-glass';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import ContextMenu from 'react-native-context-menu-view';
import Animated, {
	useSharedValue,
	useAnimatedStyle,
	withTiming,
	interpolate,
} from 'react-native-reanimated';
import { useImageGeneration, aspectRatios } from '~/hooks/useImageGeneration';
import { TagInput } from '~/components/tags/TagInput';
import { ImageCountSelector } from './ImageCountSelector';
import { ModelSelector } from './ModelSelector';
import { AspectRatioSelector } from './AspectRatioSelector';
import { RateLimitIndicator } from './RateLimitIndicator';
import { BatchProgressTracker } from './batch/BatchProgressTracker';
import { useBatchStore } from '~/store/batchStore';
import { Button } from './Button';
import { useTheme } from '~/contexts/ThemeContext';
import { Text } from './Text';

type QuickGenerateBarProps = {
	onGenerated?: () => void;
	isMinimized?: boolean;
	scrollY?: number;
	onExpandedChange?: (expanded: boolean) => void;
};

// Tab bar height constants
const TAB_BAR_HEIGHT = 49; // Standard iOS tab bar height
const TAB_BAR_WITH_SAFE_AREA = 83; // Tab bar height including safe area on devices with home indicator

export function QuickGenerateBar({
	onGenerated,
	isMinimized: externalIsMinimized = false,
	scrollY = 0,
	onExpandedChange,
}: QuickGenerateBarProps) {
	const insets = useSafeAreaInsets();
	const { theme } = useTheme();
	const [isExpanded, setIsExpanded] = useState(false);
	const [keyboardHeight, setKeyboardHeight] = useState(0);
	const [imageCount, setImageCount] = useState(1);
	const [showAdvanced, setShowAdvanced] = useState(false);
	const [manuallyExpanded, setManuallyExpanded] = useState(false);
	const lastScrollY = useRef(0);

	// Track scroll changes and close if scrolling while expanded/manually opened
	useEffect(() => {
		const scrollDiff = Math.abs(scrollY - lastScrollY.current);

		// If user scrolls more than 20px, close the bar
		if (scrollDiff > 20 && (manuallyExpanded || isExpanded)) {
			setManuallyExpanded(false);
			setIsExpanded(false);
		}

		lastScrollY.current = scrollY;
	}, [scrollY]);

	// Reset manual expansion when external minimized changes to true
	useEffect(() => {
		if (externalIsMinimized) {
			setManuallyExpanded(false);
			setIsExpanded(false);
			onExpandedChange?.(false);
		}
	}, [externalIsMinimized]);

	// Notify parent when expanded state changes
	useEffect(() => {
		if (onExpandedChange) {
			onExpandedChange(isExpanded);
		}
	}, [isExpanded, onExpandedChange]);

	// Determine if bar should be minimized
	const isMinimized = externalIsMinimized && !manuallyExpanded;

	// Animation value: 0 = FAB, 1 = full bar
	const animationProgress = useSharedValue(1);

	// Animate when minimized state changes
	useEffect(() => {
		animationProgress.value = withTiming(isMinimized ? 0 : 1, {
			duration: 300,
		});
	}, [isMinimized]);

	const {
		prompt,
		setPrompt,
		isGenerating,
		selectedAspectRatio,
		setSelectedAspectRatio,
		selectedTags,
		setSelectedTags,
		steps,
		setSteps,
		guidanceScale,
		setGuidanceScale,
		models,
		selectedModel,
		loadingModels,
		hasModels,
		setSelectedModel,
		handleGenerate,
	} = useImageGeneration();

	const { createBatch, activeBatches } = useBatchStore();

	// Get active processing batches
	const processingBatches = Array.from(activeBatches.values()).filter(
		(b) => b.status === 'processing'
	);

	// Position the bar above filter bar on gallery page
	const isGalleryPage = onGenerated !== undefined; // Gallery page passes onGenerated
	const filterBarHeight = isGalleryPage ? 90 : 0; // Height of FABs + offset
	const [bottomPosition, setBottomPosition] = useState(filterBarHeight);

	// Handle keyboard events
	useEffect(() => {
		const keyboardWillShow = Keyboard.addListener(
			Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
			(event) => {
				setKeyboardHeight(event.endCoordinates.height);
				setBottomPosition(event.endCoordinates.height);
			}
		);

		const keyboardWillHide = Keyboard.addListener(
			Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
			(event) => {
				setKeyboardHeight(0);
				setBottomPosition(filterBarHeight);
			}
		);

		return () => {
			keyboardWillShow.remove();
			keyboardWillHide.remove();
		};
	}, [insets.bottom, filterBarHeight, isExpanded]);

	const toggleExpanded = () => {
		const newExpanded = !isExpanded;
		setIsExpanded(newExpanded);
		onExpandedChange?.(newExpanded);

		// Dismiss keyboard when collapsing
		if (!newExpanded) {
			Keyboard.dismiss();
		}
	};

	const handleQuickGenerate = async () => {
		if (imageCount > 1) {
			// Multi-generation using batch
			const prompts = Array(imageCount)
				.fill(null)
				.map((_, i) => ({
					text: prompt,
					seed: Math.floor(Math.random() * 1000000) + i,
				}));

			try {
				await createBatch(
					prompts,
					{
						model_id: selectedModel?.id || '',
						model_version: selectedModel?.version || '',
						width: selectedAspectRatio.width,
						height: selectedAspectRatio.height,
						steps: steps,
						guidance_scale: guidanceScale,
					},
					`Quick: ${prompt.substring(0, 30)}... (${imageCount}x)`
				);

				// Reset and close
				setPrompt('');
				setImageCount(1);
				onGenerated?.();
				setIsExpanded(false);
				Keyboard.dismiss();
			} catch (error) {
				console.error('Multi-generation error:', error);
			}
		} else {
			// Single generation
			handleGenerate({
				navigateToGallery: false,
				onSuccess: () => {
					onGenerated?.();
					setIsExpanded(false);
					Keyboard.dismiss();
				},
			});
		}
	};

	const containerStyle: ViewStyle = {
		backgroundColor: 'transparent',
		borderRadius: isExpanded ? 16 : 999,
		overflow: 'hidden',
	};

	const mainBarStyle: ViewStyle = {
		backgroundColor: 'transparent',
	};

	const inputStyle: ViewStyle & TextStyle = {
		flex: 1,
		backgroundColor: theme.colors.input,
		borderWidth: 2,
		borderColor: PlatformColor('separatorColor'),
		borderRadius: 999,
		paddingHorizontal: 16,
		paddingVertical: 12,
		marginRight: 12,
		color: PlatformColor('labelColor'),
		fontSize: 16,
		fontWeight: '600',
		maxHeight: 120,
	};

	const labelStyle: TextStyle = {
		fontSize: 14,
		fontWeight: '500',
		color: theme.colors.text.secondary,
		marginBottom: 8,
	};

	const backdropStyle: ViewStyle = {
		position: 'absolute',
		top: 0,
		left: 0,
		right: 0,
		bottom: 0,
		backgroundColor: `${theme.colors.background}80`,
		zIndex: 1,
	};

	return (
		<>
			{/* Backdrop for expanded state */}
			{isExpanded && (
				<Button
					variant="ghost"
					className="absolute bottom-0 left-0 right-0 top-0 rounded-none"
					style={backdropStyle}
					onPress={() => {
						toggleExpanded();
						Keyboard.dismiss();
					}}
				/>
			)}

			{/* Expanded Settings Panel - Separate from bar */}
			{isExpanded && (
				<View
					style={{
						position: 'absolute',
						left: 14,
						right: 14,
						bottom: bottomPosition + 80,
						zIndex: 100,
						maxHeight: '70%',
					}}
				>
					<LiquidGlassView
						effect="regular"
						interactive={false}
						colorScheme="system"
						style={{ borderRadius: 16, overflow: 'hidden' }}
					>
						<ScrollView style={{ maxHeight: '100%' }}>
							<View className="space-y-4 p-4">
								{/* Active Batch Progress */}
								{processingBatches.length > 0 && (
									<View>
										<Text variant="label" color="secondary" style={{ marginBottom: 8 }}>
											Aktive Generierungen
										</Text>
										{processingBatches.slice(0, 2).map((batch) => (
											<View key={batch.id} style={{ marginBottom: 8 }}>
												<BatchProgressTracker
													batchId={batch.id}
													compact={true}
													onComplete={() => {
														onGenerated?.();
													}}
												/>
											</View>
										))}
									</View>
								)}

								{/* Model Selection */}
								<View>
									<ModelSelector
										models={models}
										selectedModel={selectedModel}
										onSelectModel={setSelectedModel}
										loading={loadingModels}
										disabled={isGenerating}
									/>
								</View>

								{/* Aspect Ratio */}
								<View>
									<AspectRatioSelector
										aspectRatios={aspectRatios}
										selectedAspectRatio={selectedAspectRatio}
										onSelectAspectRatio={setSelectedAspectRatio}
										disabled={isGenerating}
									/>
								</View>

								{/* Image Count */}
								<View>
									<Text variant="label" color="secondary">
										Anzahl Bilder
									</Text>
									<ImageCountSelector
										value={imageCount}
										onChange={setImageCount}
										disabled={isGenerating}
										style="default"
										label=""
										max={5}
									/>
								</View>

								{/* Tags */}
								<View>
									<Text variant="label" color="secondary">
										Tags
									</Text>
									<TagInput
										selectedTags={selectedTags}
										onTagsChange={setSelectedTags}
										placeholder="Tags hinzufügen..."
										maxTags={5}
									/>
								</View>

								{/* Advanced Settings Toggle */}
								<View className="py-2">
									<Button
										variant="ghost"
										onPress={() => setShowAdvanced(!showAdvanced)}
										className="w-full"
									>
										<View className="flex-row items-center justify-center">
											<Text style={{ color: theme.colors.text.secondary, marginRight: 4 }}>
												{showAdvanced ? 'Weniger Optionen' : 'Mehr Optionen'}
											</Text>
											<Ionicons
												name={showAdvanced ? 'chevron-up' : 'chevron-down'}
												size={16}
												color={theme.colors.text.secondary}
											/>
										</View>
									</Button>
								</View>

								{/* Advanced Settings */}
								{showAdvanced && (
									<View>
										<View className="flex-row space-x-4">
											<View className="flex-1">
												<Text variant="label" color="secondary" style={{ marginBottom: 4 }}>
													Steps
												</Text>
												<TextInput
													style={inputStyle as any}
													value={steps.toString()}
													onChangeText={(text) => setSteps(parseInt(text) || 4)}
													keyboardType="numeric"
													placeholder="4"
													placeholderTextColor={theme.colors.text.tertiary}
												/>
											</View>
											<View className="flex-1">
												<Text variant="label" color="secondary" style={{ marginBottom: 4 }}>
													Guidance
												</Text>
												<TextInput
													style={inputStyle as any}
													value={guidanceScale.toString()}
													onChangeText={(text) => setGuidanceScale(parseFloat(text) || 3.5)}
													keyboardType="numeric"
													placeholder="3.5"
													placeholderTextColor={theme.colors.text.tertiary}
												/>
											</View>
										</View>

										{/* Rate Limit Indicator - inside advanced settings */}
										<View style={{ marginTop: 16 }}>
											<RateLimitIndicator compact={true} />
										</View>
									</View>
								)}
							</View>
						</ScrollView>
					</LiquidGlassView>
				</View>
			)}

			<Animated.View
				style={{
					position: 'absolute',
					left: isExpanded ? 14 : 24,
					right: isExpanded ? 14 : 24,
					zIndex: 2,
					bottom: bottomPosition,
				}}
			>
				<Pressable
					onPress={() => {
						if (isMinimized) {
							setManuallyExpanded(true);
						}
					}}
					disabled={!isMinimized}
				>
					<Animated.View
						style={[
							{
								overflow: 'hidden',
							},
							useAnimatedStyle(() => {
								const width = interpolate(
									animationProgress.value,
									[0, 1],
									[52, 400] // FAB width to full bar width
								);
								const height = interpolate(
									animationProgress.value,
									[0, 1],
									[52, 64] // FAB height to bar height
								);
								const borderRadius = interpolate(
									animationProgress.value,
									[0, 1],
									[26, isExpanded ? 16 : 999] // FAB round to bar round
								);

								return {
									width: animationProgress.value === 1 ? '100%' : width,
									height,
									borderRadius,
									...theme.shadows.lg,
								};
							}),
						]}
					>
						{/* FAB Icon - only visible when minimized */}
						<Animated.View
							style={[
								{
									position: 'absolute',
									top: 0,
									left: 0,
									right: 0,
									bottom: 0,
									borderRadius: 26,
									overflow: 'hidden',
								},
								useAnimatedStyle(() => ({
									opacity: interpolate(animationProgress.value, [0, 0.3], [1, 0]),
									transform: [
										{
											scale: interpolate(animationProgress.value, [0, 0.3], [1, 0.8]),
										},
									],
								})),
							]}
							pointerEvents={isMinimized ? 'auto' : 'none'}
						>
							<LiquidGlassView
								effect="regular"
								interactive={true}
								colorScheme="system"
								style={{
									flex: 1,
									justifyContent: 'center',
									alignItems: 'center',
									borderRadius: 26,
									overflow: 'hidden',
								}}
							>
								<Ionicons name="sparkles" size={20} color={PlatformColor('labelColor')} />
							</LiquidGlassView>
						</Animated.View>

						{/* Full Bar Content - only visible when not minimized */}
						<Animated.View
							style={[
								{
									width: '100%',
								},
								useAnimatedStyle(() => ({
									opacity: interpolate(animationProgress.value, [0.7, 1], [0, 1]),
								})),
							]}
							pointerEvents={isMinimized ? 'none' : 'auto'}
						>
							<LiquidGlassView
								effect="regular"
								interactive={true}
								colorScheme="system"
								style={{ borderRadius: 999, overflow: 'hidden', width: '100%' }}
							>
								<View style={[containerStyle, { width: '100%' }]}>
									{/* Main Bar */}
									<View
										style={[
											mainBarStyle,
											{
												flexDirection: 'row',
												alignItems: 'center',
												paddingVertical: 8,
												paddingHorizontal: 16,
											},
										]}
									>
										{/* Settings Button with Context Menu */}
										<ContextMenu
											actions={[
												{ title: 'Alle Optionen anzeigen', systemIcon: 'slider.horizontal.3' },
												{ title: 'Modell wählen', systemIcon: 'cpu' },
												{
													title: 'Seitenverhältnis',
													systemIcon: 'rectangle.portrait.and.arrow.right',
												},
												{ title: 'Anzahl Bilder', systemIcon: 'photo.stack' },
												{ title: 'Tags verwalten', systemIcon: 'tag' },
											]}
											onPress={(e) => {
												const index = e.nativeEvent.index;
												if (index === 0) {
													// Show all options
													toggleExpanded();
												} else {
													// For now, just open expanded view for all options
													// Could implement individual option modals later
													setIsExpanded(true);
												}
											}}
											previewBackgroundColor="transparent"
										>
											<Button
												icon={isExpanded ? 'close' : 'ellipsis-horizontal'}
												iconSize={24}
												iconColor={PlatformColor('labelColor')}
												variant={isExpanded ? 'primary' : 'ghost'}
												disabled={isGenerating}
												onPress={toggleExpanded}
												className="mr-3"
											/>
										</ContextMenu>

										{/* Input */}
										<TextInput
											style={inputStyle}
											placeholder="Beschreibe dein Bild..."
											placeholderTextColor={PlatformColor('placeholderTextColor')}
											value={prompt}
											onChangeText={setPrompt}
											editable={!isGenerating}
											multiline
											returnKeyType="send"
											blurOnSubmit={false}
											onSubmitEditing={handleQuickGenerate}
										/>

										{/* Send Button */}
										<Button
											icon="arrow-forward"
											iconSize={24}
											iconColor={PlatformColor('labelColor')}
											variant={!prompt.trim() || !selectedModel ? 'secondary' : 'primary'}
											loading={isGenerating}
											disabled={!prompt.trim() || isGenerating || !selectedModel}
											onPress={handleQuickGenerate}
										/>
									</View>
								</View>
							</LiquidGlassView>
						</Animated.View>
					</Animated.View>
				</Pressable>
			</Animated.View>
		</>
	);
}
