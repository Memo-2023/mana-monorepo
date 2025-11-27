import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, SafeAreaView, TouchableOpacity } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useTheme } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

import ModelCard from '../components/ModelCard';
import { getModels } from '../services/modelService';
import { Model } from '../types';
import { availableModels } from '../config/azure';

export default function ModelSelectionScreen() {
	const { colors } = useTheme();
	const router = useRouter();
	const params = useLocalSearchParams();
	const initialMessage = (params.initialMessage as string) || '';
	const [models, setModels] = useState<Model[]>(availableModels);
	const [selectedModelId, setSelectedModelId] = useState<string>(availableModels[0].id);
	const [loading, setLoading] = useState(true);

	// Extrahiere mögliche Space ID aus den Parametern
	const spaceId = (params.spaceId as string) || null;

	useEffect(() => {
		// Lade Modelle vom Service
		const loadModels = async () => {
			try {
				setLoading(true);
				const modelsList = await getModels();
				setModels(modelsList);

				// Setze das erste Modell als Standard, wenn noch keins ausgewählt ist
				if (!selectedModelId && modelsList.length > 0) {
					setSelectedModelId(modelsList[0].id);
				}
			} catch (error) {
				console.error('Fehler beim Laden der Modelle:', error);
			} finally {
				setLoading(false);
			}
		};

		loadModels();
	}, []);

	const handleSelectModel = (id: string) => {
		setSelectedModelId(id);
	};

	const handleStart = () => {
		// Navigiere zum Konversationsscreen mit ausgewähltem Modell und initialem Text
		router.push({
			pathname: '/conversation/new',
			params: {
				initialMessage,
				modelId: selectedModelId,
				mode: 'free',
				...(spaceId && { spaceId }), // Füge spaceId hinzu, wenn vorhanden
			},
		});
	};

	return (
		<SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
			<View style={styles.header}>
				<TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
					<Ionicons name="arrow-back" size={24} color={colors.text} />
				</TouchableOpacity>
				<Text style={[styles.title, { color: colors.text }]}>Modell auswählen</Text>
			</View>

			<Text style={[styles.subtitle, { color: colors.text + 'CC' }]}>
				Wähle das KI-Modell, mit dem du chatten möchtest
			</Text>

			{loading ? (
				<View style={styles.loadingContainer}>
					<Text style={[styles.loadingText, { color: colors.text + '80' }]}>
						Modelle werden geladen...
					</Text>
				</View>
			) : (
				<FlatList
					data={models}
					keyExtractor={(item) => item.id}
					renderItem={({ item }) => (
						<ModelCard
							id={item.id}
							name={item.name}
							description={item.description}
							isSelected={item.id === selectedModelId}
							onSelect={handleSelectModel}
							model={item}
						/>
					)}
					contentContainerStyle={styles.listContent}
				/>
			)}

			<View style={styles.footer}>
				<TouchableOpacity
					style={[styles.startButton, { backgroundColor: colors.primary }]}
					onPress={handleStart}
				>
					<Text style={styles.startButtonText}>Konversation starten</Text>
					<Ionicons name="arrow-forward" size={18} color="white" />
				</TouchableOpacity>
			</View>
		</SafeAreaView>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
	},
	header: {
		flexDirection: 'row',
		alignItems: 'center',
		paddingHorizontal: 16,
		paddingTop: 16,
		paddingBottom: 8,
	},
	backButton: {
		marginRight: 16,
		padding: 4,
	},
	title: {
		fontSize: 24,
		fontWeight: 'bold',
	},
	subtitle: {
		paddingHorizontal: 16,
		marginBottom: 16,
		fontSize: 16,
	},
	listContent: {
		paddingHorizontal: 16,
		paddingBottom: 100,
	},
	loadingContainer: {
		flex: 1,
		justifyContent: 'center',
		alignItems: 'center',
	},
	loadingText: {
		fontSize: 16,
	},
	footer: {
		position: 'absolute',
		bottom: 0,
		left: 0,
		right: 0,
		paddingHorizontal: 16,
		paddingVertical: 16,
		borderTopWidth: StyleSheet.hairlineWidth,
		borderTopColor: 'rgba(0,0,0,0.1)',
		backgroundColor: 'rgba(255,255,255,0.9)',
	},
	startButton: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'center',
		borderRadius: 12,
		paddingVertical: 16,
	},
	startButtonText: {
		color: 'white',
		fontSize: 16,
		fontWeight: '600',
		marginRight: 8,
	},
});
