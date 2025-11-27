import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Modal, FlatList, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAppTheme } from '../theme/ThemeProvider';
import { Model } from '../types';
import { availableModels } from '../config/azure';
import { getModels } from '../services/modelService';

// Verwende Modelle aus der Konfiguration
const FALLBACK_MODELS: Model[] = availableModels;

type ModelDropdownProps = {
	selectedModelId: string;
	onSelectModel: (id: string) => void;
};

export default function ModelDropdown({ selectedModelId, onSelectModel }: ModelDropdownProps) {
	const { isDarkMode } = useAppTheme();
	const [isModalVisible, setIsModalVisible] = useState(false);
	const [models, setModels] = useState<Model[]>(FALLBACK_MODELS);
	const [loading, setLoading] = useState(false);

	// Lade die Modelle vom ModelService
	useEffect(() => {
		const fetchModels = async () => {
			try {
				setLoading(true);
				const modelsList = await getModels();
				setModels(modelsList);
			} catch (err) {
				console.error('Fehler beim Laden der Modelle:', err);
				setModels(FALLBACK_MODELS);
			} finally {
				setLoading(false);
			}
		};

		fetchModels();
	}, []);

	const selectedModel = models.find((model) => model.id === selectedModelId) || models[0];

	return (
		<View>
			<TouchableOpacity
				onPress={() => setIsModalVisible(true)}
				className={`flex-row items-center rounded-lg px-2 py-1 ${isDarkMode ? 'bg-[#2C2C2E]' : 'bg-gray-100'}`}
			>
				<Text className={`text-sm font-medium ${isDarkMode ? 'text-white' : 'text-black'}`}>
					{selectedModel.name}
				</Text>
				<Ionicons
					name="chevron-down"
					size={16}
					color={isDarkMode ? '#FFFFFF' : '#000000'}
					style={{ marginLeft: 4 }}
				/>
			</TouchableOpacity>

			<Modal
				visible={isModalVisible}
				transparent={true}
				animationType="fade"
				onRequestClose={() => setIsModalVisible(false)}
			>
				<TouchableOpacity
					style={styles.modalOverlay}
					activeOpacity={1}
					onPress={() => setIsModalVisible(false)}
				>
					<View
						className={`mx-4 rounded-xl p-4 ${isDarkMode ? 'bg-[#1C1C1E]' : 'bg-white'}`}
						style={styles.modalContent}
					>
						<Text className={`mb-4 text-lg font-bold ${isDarkMode ? 'text-white' : 'text-black'}`}>
							Modell auswählen
						</Text>

						{loading ? (
							<View className="items-center py-4">
								<Text className={`${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
									Modelle werden geladen...
								</Text>
							</View>
						) : (
							<FlatList
								data={models}
								keyExtractor={(item) => item.id}
								renderItem={({ item }) => (
									<TouchableOpacity
										className={`mb-2 flex-row items-center rounded-lg p-3 ${
											item.id === selectedModelId
												? isDarkMode
													? 'bg-blue-900/30'
													: 'bg-blue-100'
												: isDarkMode
													? 'bg-[#2C2C2E]'
													: 'bg-gray-100'
										}`}
										onPress={() => {
											onSelectModel(item.id);
											setIsModalVisible(false);
										}}
									>
										<View className="mr-3 h-8 w-8 items-center justify-center rounded-full bg-blue-500/20">
											<Ionicons name="chatbubble-ellipses-outline" size={16} color="#0A84FF" />
										</View>

										<View className="flex-1">
											<Text className={`font-medium ${isDarkMode ? 'text-white' : 'text-black'}`}>
												{item.name}
											</Text>
											<Text
												className={`mt-1 text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}
												numberOfLines={1}
											>
												{item.description}
											</Text>
											{item.parameters?.deployment && (
												<Text
													className={`mt-1 text-xs ${isDarkMode ? 'text-blue-400' : 'text-blue-500'}`}
													numberOfLines={1}
												>
													{item.parameters.deployment}
												</Text>
											)}
										</View>

										{item.id === selectedModelId && (
											<View className="h-6 w-6 items-center justify-center rounded-full bg-blue-500">
												<Ionicons name="checkmark" size={14} color="#FFFFFF" />
											</View>
										)}
									</TouchableOpacity>
								)}
							/>
						)}

						<TouchableOpacity
							className={`mt-3 items-center rounded-lg py-3 ${isDarkMode ? 'bg-[#0A84FF]' : 'bg-[#0A84FF]'}`}
							onPress={() => setIsModalVisible(false)}
						>
							<Text className="font-medium text-white">Schließen</Text>
						</TouchableOpacity>
					</View>
				</TouchableOpacity>
			</Modal>
		</View>
	);
}

const styles = StyleSheet.create({
	modalOverlay: {
		flex: 1,
		backgroundColor: 'rgba(0, 0, 0, 0.5)',
		justifyContent: 'center',
	},
	modalContent: {
		maxHeight: '80%',
	},
});
