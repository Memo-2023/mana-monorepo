import { useState, useEffect } from 'react';
import { Alert } from 'react-native';
import { router } from 'expo-router';
import { generateAndWait, type GenerationStatus } from '~/services/api/generate';
import { useAuth } from '~/contexts/AuthContext';
import { useModelSelection } from '~/store/modelStore';
import { useTagStore, Tag } from '~/store/tagStore';
import { usePromptStore } from '~/store/promptStore';
import { useGenerationDefaults } from '~/store/generationDefaultsStore';
import { useGeneratingImagesStore } from '~/store/generatingImagesStore';

// Define aspect ratios with common presets
export const aspectRatios = [
	{ label: '1:1', value: '1:1', width: 1024, height: 1024, icon: '⬜' },
	{ label: '16:9', value: '16:9', width: 1344, height: 768, icon: '📺' },
	{ label: '9:16', value: '9:16', width: 768, height: 1344, icon: '📱' },
	{ label: '4:3', value: '4:3', width: 1152, height: 896, icon: '🖼️' },
	{ label: '3:4', value: '3:4', width: 896, height: 1152, icon: '📷' },
	{ label: '3:2', value: '3:2', width: 1216, height: 832, icon: '🎞️' },
	{ label: '2:3', value: '2:3', width: 832, height: 1216, icon: '📸' },
	{ label: '21:9', value: '21:9', width: 1536, height: 640, icon: '🎬' },
	{ label: '9:21', value: '9:21', width: 640, height: 1536, icon: '📲' },
];

export function useImageGeneration() {
	const { user } = useAuth();
	const { prompt, setPrompt } = usePromptStore();
	const [isGenerating, setIsGenerating] = useState(false);

	// Get generation defaults
	const { defaultModelId, defaultAspectRatio } = useGenerationDefaults();

	// Initialize with defaults
	const defaultRatio = aspectRatios.find((r) => r.value === defaultAspectRatio) || aspectRatios[0];

	const [selectedAspectRatio, setSelectedAspectRatio] = useState(defaultRatio);
	const [selectedTags, setSelectedTags] = useState<Tag[]>([]);
	const [width, setWidth] = useState(defaultRatio.width);
	const [height, setHeight] = useState(defaultRatio.height);
	const [steps, setSteps] = useState(4);
	const [guidanceScale, setGuidanceScale] = useState(3.5);

	// Model selection
	const {
		models,
		selectedModel,
		isLoading: loadingModels,
		error: modelError,
		hasModels,
		setSelectedModel,
		loadModels,
		clearError,
	} = useModelSelection();

	// Tag management
	const { addTagsToImage } = useTagStore();

	// Models are now preloaded at app start in _layout.tsx
	// Only load if we somehow don't have models (e.g., after error)
	useEffect(() => {
		if (!loadingModels && !hasModels && !modelError) {
			const initModels = async () => {
				try {
					await loadModels();
				} catch (error) {
					console.error('Failed to load models initially:', error);
				}
			};
			initModels();
		}
	}, [loadingModels, hasModels, modelError]);

	// Set default model when models are loaded
	useEffect(() => {
		if (defaultModelId && models.length > 0 && !selectedModel) {
			const defaultModel = models.find((m) => m.id === defaultModelId);
			if (defaultModel) {
				setSelectedModel(defaultModel);
			}
		}
	}, [defaultModelId, models, selectedModel]);

	useEffect(() => {
		if (selectedModel) {
			setSteps(selectedModel.default_steps);
			setGuidanceScale(selectedModel.default_guidance_scale);

			const maxDimension = Math.min(selectedModel.max_width, selectedModel.max_height);
			const minDimension = Math.max(selectedModel.min_width, selectedModel.min_height);

			let newWidth = selectedAspectRatio.width;
			let newHeight = selectedAspectRatio.height;

			if (newWidth > maxDimension || newHeight > maxDimension) {
				const scale = maxDimension / Math.max(newWidth, newHeight);
				newWidth = Math.round(newWidth * scale);
				newHeight = Math.round(newHeight * scale);
			}

			if (newWidth < minDimension || newHeight < minDimension) {
				const scale = minDimension / Math.min(newWidth, newHeight);
				newWidth = Math.round(newWidth * scale);
				newHeight = Math.round(newHeight * scale);
			}

			setWidth(newWidth);
			setHeight(newHeight);
		}
	}, [selectedModel, selectedAspectRatio]);

	useEffect(() => {
		setWidth(selectedAspectRatio.width);
		setHeight(selectedAspectRatio.height);
	}, [selectedAspectRatio]);

	const { addGeneratingImage, completeGeneratingImage, failGeneratingImage } =
		useGeneratingImagesStore();

	const handleGenerate = async (options?: {
		navigateToGallery?: boolean;
		onSuccess?: (generationTime: number) => void;
	}) => {
		if (!prompt.trim()) {
			Alert.alert('Fehler', 'Bitte gib einen Prompt ein');
			return;
		}

		if (!user) {
			Alert.alert('Fehler', 'Du musst angemeldet sein');
			return;
		}

		if (!selectedModel) {
			Alert.alert('Fehler', 'Bitte wähle ein Modell aus');
			return;
		}

		setIsGenerating(true);

		// Add optimistic placeholder image IMMEDIATELY
		const tempId = addGeneratingImage({
			prompt: prompt.trim(),
			model_id: selectedModel.id,
			width,
			height,
		});

		// Navigate to gallery IMMEDIATELY
		if (options?.navigateToGallery !== false) {
			router.push('/(tabs)');
		}

		try {
			// Generate image via Backend API (synchronous mode)
			const result = await generateAndWait({
				prompt: prompt.trim(),
				modelId: selectedModel.id,
				width,
				height,
				steps,
				guidanceScale,
			});

			// Add tags if needed
			if (result.image?.id && selectedTags.length > 0) {
				await addTagsToImage(
					result.image.id,
					selectedTags.map((tag) => tag.id)
				);
			}

			// Mark as completed with real image data
			completeGeneratingImage(tempId, result.image, result.generationTimeSeconds || 0);

			// Clear form
			setPrompt('');
			setSelectedTags([]);

			// Call success callback with generation time
			options?.onSuccess?.(result.generationTimeSeconds || 0);
		} catch (error: any) {
			console.error('Generation error:', error);

			// Mark as failed
			failGeneratingImage(tempId, error.message || 'Generation failed');

			Alert.alert(
				'Fehler bei der Generierung',
				error.message || 'Etwas ist schiefgelaufen. Bitte versuche es erneut.'
			);
		} finally {
			setIsGenerating(false);
		}
	};

	const resetForm = () => {
		setPrompt('');
		setSelectedTags([]);
		setSelectedAspectRatio(aspectRatios[0]);
	};

	return {
		// State
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
		setSteps,
		guidanceScale,
		setGuidanceScale,

		// Model management
		models,
		selectedModel,
		loadingModels,
		modelError,
		hasModels,
		setSelectedModel,
		loadModels,
		clearError,

		// Actions
		handleGenerate,
		resetForm,
	};
}
