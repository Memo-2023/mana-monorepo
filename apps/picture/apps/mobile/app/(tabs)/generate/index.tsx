import {
	KeyboardAvoidingView,
	Platform,
	ScrollView,
	TextInput,
	View,
	ActivityIndicator,
	Pressable,
} from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Button } from '~/components/Button';
import { PageHeader } from '~/components/PageHeader';
import { ModelSelector } from '~/components/ModelSelector';
import { AspectRatioSelector } from '~/components/AspectRatioSelector';
import { useImageGeneration, aspectRatios } from '~/hooks/useImageGeneration';
import { TagInput } from '~/components/tags/TagInput';
import { useBatchStore } from '~/store/batchStore';
import { BatchGenerationModal } from '~/components/batch/BatchGenerationModal';
import { BatchProgressTracker } from '~/components/batch/BatchProgressTracker';
import { RateLimitIndicator } from '~/components/RateLimitIndicator';
import { ImageCountSelector } from '~/components/ImageCountSelector';
import { PromptBuilder } from '~/components/prompt/PromptBuilder';
import { TemplateGallery } from '~/components/prompt/TemplateGallery';
import { PromptEnhancer } from '~/components/prompt/PromptEnhancer';
import { QuickGenerateBar } from '~/components/QuickGenerateBar';
import { StudioTabBar } from '~/components/StudioTabBar';
import { PromptTemplate } from '~/constants/promptTemplates';
import { useTheme } from '~/contexts/ThemeContext';
import { useState, useEffect } from 'react';
import { Text } from '~/components/Text';
import { useGenerationDefaults } from '~/store/generationDefaultsStore';

export default function GenerateScreen() {
	const { theme } = useTheme();
	const { defaultImageCount, useAdvancedByDefault } = useGenerationDefaults();
	const insets = useSafeAreaInsets();
	const {
		prompt,
		setPrompt,
		isGenerating,
		selectedAspectRatio,
		setSelectedAspectRatio,
		selectedTags,
		setSelectedTags,
		width,
		height,
		steps,
		guidanceScale,
		models,
		selectedModel,
		loadingModels,
		modelError,
		hasModels,
		setSelectedModel,
		handleGenerate,
		loadModels,
	} = useImageGeneration();

	const { isBatchModalOpen, openBatchModal, closeBatchModal, activeBatches, createBatch } =
		useBatchStore();

	const [imageCount, setImageCount] = useState(defaultImageCount);
	const [activeTab, setActiveTab] = useState<'builder' | 'templates'>('builder');
	const [showAdvanced, setShowAdvanced] = useState(useAdvancedByDefault);

	// Update imageCount when default changes
	useEffect(() => {
		setImageCount(defaultImageCount);
	}, [defaultImageCount]);

	// Update showAdvanced when default changes
	useEffect(() => {
		setShowAdvanced(useAdvancedByDefault);
	}, [useAdvancedByDefault]);
	const [scrollY, setScrollY] = useState(0);
	const [generateBarExpanded, setGenerateBarExpanded] = useState(false);

	// Get active processing batches
	const processingBatches = Array.from(activeBatches.values()).filter(
		(b) => b.status === 'processing'
	);

	const handleSelectTemplate = (template: PromptTemplate) => {
		// Simple template application - you could make this more sophisticated
		const placeholders = template.template.match(/\{[^}]+\}/g) || [];
		let filledTemplate = template.template;

		// For demo purposes, just remove placeholders
		placeholders.forEach((placeholder) => {
			filledTemplate = filledTemplate.replace(placeholder, '');
		});

		// Clean up double spaces and commas
		filledTemplate = filledTemplate.replace(/\s+/g, ' ').replace(/,\s*,/g, ',').trim();

		setPrompt(filledTemplate);
		setActiveTab('builder');
	};

	return (
		<View style={{ flex: 1, backgroundColor: theme.colors.background }}>
			<KeyboardAvoidingView
				behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
				className="flex-1"
			>
				<ScrollView
					className="flex-1"
					contentInsetAdjustmentBehavior="automatic"
					showsVerticalScrollIndicator={false}
					onScroll={(event) => {
						const currentScrollY = event.nativeEvent.contentOffset.y;
						setScrollY(currentScrollY);
					}}
					scrollEventThrottle={16}
				>
					<PageHeader title="Studio" />
					<View style={{ paddingHorizontal: 4 }}>
						{/* Show active batch progress if any */}
						{processingBatches.length > 0 && (
							<View className="mb-6">
								<Text variant="label" color="secondary" className="mb-2">
									Aktive Generierungen
								</Text>
								{processingBatches.slice(0, 2).map((batch) => (
									<BatchProgressTracker
										key={batch.id}
										batchId={batch.id}
										compact={true}
										onComplete={() => {
											router.push('/(tabs)');
										}}
									/>
								))}
							</View>
						)}

						<View className="space-y-6">
							{/* Templates Tab */}
							{activeTab === 'templates' ? (
								<TemplateGallery onSelectTemplate={handleSelectTemplate} />
							) : (
								<>
									{/* Prompt Builder */}
									<View
										style={{
											padding: 16,
											backgroundColor: theme.colors.surface,
											borderRadius: 12,
											borderWidth: 1,
											borderColor: theme.colors.border,
										}}
									>
										<PromptBuilder onPromptChange={setPrompt} initialPrompt={prompt} />
									</View>
								</>
							)}

							{/* Quick Settings - Only show in builder tab */}
							{activeTab === 'builder' && (
								<>
									{/* Model Selection */}
									<View>
										<Text
											variant="label"
											color="secondary"
											className="mb-2"
											style={{ opacity: 0.7, fontSize: 13 }}
										>
											Modell
										</Text>
										<ModelSelector
											models={models}
											selectedModel={selectedModel}
											onSelectModel={setSelectedModel}
											loading={loadingModels}
											error={modelError}
											onRetry={() => loadModels(true)}
											disabled={isGenerating}
										/>
									</View>

									{/* Aspect Ratio Selection */}
									<View>
										<Text
											variant="label"
											color="secondary"
											className="mb-2"
											style={{ opacity: 0.7, fontSize: 13 }}
										>
											Seitenverhältnis
										</Text>
										<AspectRatioSelector
											aspectRatios={aspectRatios}
											selectedAspectRatio={selectedAspectRatio}
											onSelectAspectRatio={setSelectedAspectRatio}
											disabled={isGenerating}
										/>
									</View>

									{/* Advanced Settings Toggle */}
									<Pressable
										onPress={() => setShowAdvanced(!showAdvanced)}
										style={{
											flexDirection: 'row',
											alignItems: 'center',
											justifyContent: 'space-between',
											padding: 14,
											backgroundColor: theme.colors.surface,
											borderRadius: 12,
											borderWidth: 1,
											borderColor: theme.colors.border,
										}}
									>
										<Text variant="body" weight="semibold" color="primary">
											Erweiterte Einstellungen
										</Text>
										<Ionicons
											name={showAdvanced ? 'chevron-up' : 'chevron-down'}
											size={20}
											color={theme.colors.text.secondary}
										/>
									</Pressable>

									{/* Tags - Always visible, not in advanced settings */}
									<View>
										<Text
											variant="label"
											color="secondary"
											className="mb-2"
											style={{ opacity: 0.7, fontSize: 13 }}
										>
											Tags (optional)
										</Text>
										<TagInput
											selectedTags={selectedTags}
											onTagsChange={setSelectedTags}
											placeholder="Tags hinzufügen..."
											maxTags={10}
										/>
									</View>

									{/* Advanced Settings - Collapsible */}
									{showAdvanced && (
										<View
											style={{
												padding: 16,
												backgroundColor: theme.colors.surface,
												borderRadius: 12,
												borderWidth: 1,
												borderColor: theme.colors.border,
												gap: 12,
											}}
										>
											{/* Image Count Selector */}
											<View>
												<ImageCountSelector
													value={imageCount}
													onChange={setImageCount}
													disabled={isGenerating}
													style="pills"
													label="Anzahl Varianten"
												/>
											</View>

											{/* Technical Details */}
											<View
												style={{
													paddingTop: 12,
													borderTopWidth: 1,
													borderTopColor: theme.colors.border,
												}}
											>
												<Text variant="bodySmall" color="secondary" className="mb-2">
													Technische Details
												</Text>
												<View className="space-y-2">
													<View className="flex-row items-center justify-between py-2">
														<Text variant="body" color="tertiary">
															Bildgröße
														</Text>
														<Text variant="body" color="primary" weight="medium">
															{width} × {height}
														</Text>
													</View>
													<View className="flex-row items-center justify-between py-2">
														<Text variant="body" color="tertiary">
															Steps
														</Text>
														<Text variant="body" color="primary" weight="medium">
															{steps}
														</Text>
													</View>
													<View className="flex-row items-center justify-between py-2">
														<Text variant="body" color="tertiary">
															Guidance Scale
														</Text>
														<Text variant="body" color="primary" weight="medium">
															{guidanceScale}
														</Text>
													</View>
												</View>
											</View>
										</View>
									)}
								</>
							)}
						</View>

						{/* Extra space for QuickGenerateBar */}
						<View style={{ height: 120 }} />
					</View>
				</ScrollView>
			</KeyboardAvoidingView>

			{/* Studio Tab Bar - floating above generate bar */}
			<StudioTabBar
				isMinimized={scrollY > 100}
				scrollY={scrollY}
				activeTab={activeTab}
				onTabChange={setActiveTab}
				generateBarExpanded={generateBarExpanded}
			/>

			{/* Quick Generate Bar - Always visible, never minimized */}
			<QuickGenerateBar
				isMinimized={false}
				scrollY={0}
				onGenerated={() => {
					// Navigate to gallery after generation
					router.push('/(tabs)');
				}}
				onExpandedChange={setGenerateBarExpanded}
			/>

			{/* Batch Generation Modal */}
			<BatchGenerationModal
				isOpen={isBatchModalOpen}
				onClose={closeBatchModal}
				onSuccess={() => {
					// Batch created successfully, modal will handle UI
				}}
			/>
		</View>
	);
}
