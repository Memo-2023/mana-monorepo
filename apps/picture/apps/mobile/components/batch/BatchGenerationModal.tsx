import React, { useState } from 'react';
import {
	Modal,
	View,
	Text,
	TextInput,
	ScrollView,
	Pressable,
	KeyboardAvoidingView,
	Platform,
	Alert,
	ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Button } from '../Button';
import { useBatchStore, BatchPrompt } from '~/store/batchStore';
import { useModelSelection } from '~/store/modelStore';
import { aspectRatios } from '~/hooks/useImageGeneration';

interface BatchGenerationModalProps {
	isOpen: boolean;
	onClose: () => void;
	onSuccess?: (batchId: string) => void;
}

export function BatchGenerationModal({ isOpen, onClose, onSuccess }: BatchGenerationModalProps) {
	const [batchName, setBatchName] = useState('');
	const [prompts, setPrompts] = useState<BatchPrompt[]>([{ text: '' }]);
	const [selectedAspectRatio, setSelectedAspectRatio] = useState(aspectRatios[0]);
	const [steps, setSteps] = useState(30);
	const [guidanceScale, setGuidanceScale] = useState(7.5);

	const { createBatch, isCreatingBatch } = useBatchStore();
	const {
		models,
		selectedModel,
		setSelectedModel,
		loadModels,
		isLoading: modelsLoading,
	} = useModelSelection();

	// Models are preloaded at app start, only load if error occurred
	React.useEffect(() => {
		if (isOpen && models.length === 0 && !modelsLoading) {
			loadModels();
		}
	}, [isOpen, models.length, modelsLoading]);

	const addPrompt = () => {
		if (prompts.length < 10) {
			setPrompts([...prompts, { text: '' }]);
		}
	};

	const removePrompt = (index: number) => {
		if (prompts.length > 1) {
			setPrompts(prompts.filter((_, i) => i !== index));
		}
	};

	const updatePrompt = (index: number, text: string) => {
		const updated = [...prompts];
		updated[index] = { ...updated[index], text };
		setPrompts(updated);
	};

	const handleSubmit = async () => {
		// Validate
		const validPrompts = prompts.filter((p) => p.text.trim().length > 0);
		if (validPrompts.length === 0) {
			Alert.alert('Fehler', 'Mindestens ein Prompt ist erforderlich');
			return;
		}

		if (!selectedModel) {
			Alert.alert('Fehler', 'Bitte wähle ein Modell aus');
			return;
		}

		try {
			const batchId = await createBatch(
				validPrompts,
				{
					model_id: selectedModel.id,
					model_version: selectedModel.version,
					width: selectedAspectRatio.width,
					height: selectedAspectRatio.height,
					steps: steps,
					guidance_scale: guidanceScale,
				},
				batchName || undefined
			);

			// Reset form
			setBatchName('');
			setPrompts([{ text: '' }]);

			onSuccess?.(batchId);
			onClose();
		} catch (err) {
			Alert.alert('Fehler', 'Batch konnte nicht erstellt werden');
			console.error('Batch creation error:', err);
		}
	};

	const validPromptCount = prompts.filter((p) => p.text.trim().length > 0).length;

	return (
		<Modal
			visible={isOpen}
			animationType="slide"
			presentationStyle="pageSheet"
			onRequestClose={onClose}
		>
			<SafeAreaView className="flex-1 bg-dark-bg">
				<KeyboardAvoidingView
					behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
					className="flex-1"
				>
					{/* Header */}
					<View className="flex-row items-center justify-between border-b border-dark-border p-4">
						<Pressable onPress={onClose} className="p-2">
							<Ionicons name="close" size={24} color="white" />
						</Pressable>
						<Text className="text-lg font-bold text-white">
							Batch Generation ({validPromptCount}/10)
						</Text>
						<View style={{ width: 40 }} />
					</View>

					<ScrollView className="flex-1 p-4">
						{/* Batch Name */}
						<View className="mb-4">
							<Text className="mb-2 text-sm font-medium text-gray-300">Batch Name (optional)</Text>
							<TextInput
								className="rounded-lg border border-dark-border bg-dark-input px-4 py-3 text-base text-gray-100"
								placeholder="z.B. Landschaften, Portraits..."
								placeholderTextColor="#6b7280"
								value={batchName}
								onChangeText={setBatchName}
							/>
						</View>

						{/* Model Selection */}
						<View className="mb-4">
							<Text className="mb-2 text-sm font-medium text-gray-300">Modell</Text>
							{modelsLoading ? (
								<View className="rounded-lg bg-dark-surface py-4">
									<ActivityIndicator size="small" color="#6366f1" />
								</View>
							) : (
								<ScrollView horizontal showsHorizontalScrollIndicator={false}>
									<View className="flex-row">
										{models.map((model) => (
											<Pressable
												key={model.id}
												onPress={() => setSelectedModel(model)}
												className={`mr-2 rounded-lg border px-3 py-2 ${
													selectedModel?.id === model.id
														? 'border-indigo-600 bg-indigo-600'
														: 'border-dark-border bg-dark-surface'
												}`}
											>
												<Text
													className={
														selectedModel?.id === model.id ? 'text-white' : 'text-gray-300'
													}
												>
													{model.display_name}
												</Text>
											</Pressable>
										))}
									</View>
								</ScrollView>
							)}
						</View>

						{/* Aspect Ratio */}
						<View className="mb-4">
							<Text className="mb-2 text-sm font-medium text-gray-300">Seitenverhältnis</Text>
							<ScrollView horizontal showsHorizontalScrollIndicator={false}>
								<View className="flex-row">
									{aspectRatios.map((ratio) => (
										<Pressable
											key={ratio.value}
											onPress={() => setSelectedAspectRatio(ratio)}
											className={`mr-2 rounded-lg border px-3 py-2 ${
												selectedAspectRatio.value === ratio.value
													? 'border-indigo-600 bg-indigo-600'
													: 'border-dark-border bg-dark-surface'
											}`}
										>
											<Text
												className={
													selectedAspectRatio.value === ratio.value ? 'text-white' : 'text-gray-300'
												}
											>
												{ratio.icon} {ratio.label}
											</Text>
										</Pressable>
									))}
								</View>
							</ScrollView>
						</View>

						{/* Settings */}
						<View className="mb-4 rounded-lg bg-dark-surface p-4">
							<Text className="mb-3 text-sm font-medium text-gray-300">
								Gemeinsame Einstellungen
							</Text>
							<View className="space-y-2">
								<View className="flex-row justify-between">
									<Text className="text-gray-400">Größe</Text>
									<Text className="font-medium text-gray-200">
										{selectedAspectRatio.width} x {selectedAspectRatio.height}
									</Text>
								</View>
								<View className="flex-row justify-between">
									<Text className="text-gray-400">Steps</Text>
									<Text className="font-medium text-gray-200">{steps}</Text>
								</View>
								<View className="flex-row justify-between">
									<Text className="text-gray-400">Guidance Scale</Text>
									<Text className="font-medium text-gray-200">{guidanceScale}</Text>
								</View>
							</View>
						</View>

						{/* Prompts */}
						<View className="mb-4">
							<Text className="mb-2 text-sm font-medium text-gray-300">Prompts</Text>
							{prompts.map((prompt, index) => (
								<View key={index} className="mb-3 flex-row items-start">
									<Text className="mr-2 mt-3 min-w-[20px] text-gray-400">{index + 1}.</Text>
									<TextInput
										className="min-h-[80px] flex-1 rounded-lg border border-dark-border bg-dark-input px-4 py-3 text-base text-gray-100"
										placeholder="Beschreibe dein Bild..."
										placeholderTextColor="#6b7280"
										value={prompt.text}
										onChangeText={(text) => updatePrompt(index, text)}
										multiline
										textAlignVertical="top"
									/>
									{prompts.length > 1 && (
										<Pressable onPress={() => removePrompt(index)} className="ml-2 mt-3 p-2">
											<Ionicons name="trash-outline" size={20} color="#ef4444" />
										</Pressable>
									)}
								</View>
							))}

							{prompts.length < 10 && (
								<Pressable
									onPress={addPrompt}
									className="flex-row items-center justify-center rounded-lg border border-dark-border bg-dark-surface px-4 py-3"
								>
									<Ionicons name="add-circle-outline" size={20} color="#818cf8" />
									<Text className="ml-2 text-indigo-400">Prompt hinzufügen</Text>
								</Pressable>
							)}
						</View>

						{/* Submit Buttons */}
						<View className="mb-8 flex-row space-x-2">
							<View className="flex-1">
								<Button
									title="Abbrechen"
									onPress={onClose}
									variant="secondary"
									disabled={isCreatingBatch}
								/>
							</View>
							<View className="flex-1">
								<Button
									title={isCreatingBatch ? 'Erstelle...' : `Batch generieren (${validPromptCount})`}
									onPress={handleSubmit}
									disabled={isCreatingBatch || validPromptCount === 0 || !selectedModel}
								/>
							</View>
						</View>
					</ScrollView>
				</KeyboardAvoidingView>
			</SafeAreaView>
		</Modal>
	);
}
