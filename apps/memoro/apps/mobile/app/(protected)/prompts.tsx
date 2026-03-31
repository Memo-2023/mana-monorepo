import React, { useEffect, useState, useCallback } from 'react';
import { useFocusEffect } from 'expo-router';
import {
	View,
	StyleSheet,
	ActivityIndicator,
	ScrollView,
	RefreshControl,
	Pressable,
	KeyboardAvoidingView,
	Platform,
	Alert,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '~/features/theme/ThemeProvider';
import { useHeader } from '~/features/menus/HeaderContext';
import { getAuthenticatedClient } from '~/features/auth/lib/supabaseClient';
import { useAuth } from '~/features/auth/contexts/AuthContext';
import Text from '~/components/atoms/Text';
import PromptPreview from '~/components/molecules/PromptPreview';
import PromptCreationBar from '~/components/molecules/PromptCreationBar';
import PromptEditModal from '~/components/organisms/PromptEditModal';
import PillFilter from '~/components/molecules/PillFilter';
import colors from '~/tailwind.config.js';

// Prompt-Modell entsprechend der Datenbankstruktur
interface PromptModel {
	id: string;
	created_at: string;
	updated_at: string;
	prompt_text: {
		de: string;
		en: string;
		[key: string]: string;
	};
	memory_title: {
		de: string;
		en: string;
		[key: string]: string;
	};
	is_public: boolean;
	user_id: string;
}

// Blueprint-Modell für die Anzeige verknüpfter Blueprints
interface BlueprintModel {
	id: string;
	name: {
		de: string;
		en: string;
		[key: string]: string;
	};
}

export default function Prompts() {
	const { isDark, themeVariant } = useTheme();
	const { t, i18n } = useTranslation();
	const { updateConfig } = useHeader();
	const { user } = useAuth();
	const currentLanguage = i18n.language || 'de';

	// Direkter Zugriff auf die Farben aus der Tailwind-Konfiguration
	const pageBackgroundColor = isDark
		? (colors as any).theme?.extend?.colors?.dark?.[themeVariant]?.pageBackground
		: (colors as any).theme?.extend?.colors?.[themeVariant]?.pageBackground;

	const [prompts, setPrompts] = useState<PromptModel[]>([]);
	const [filteredPrompts, setFilteredPrompts] = useState<PromptModel[]>([]);
	const [blueprintsByPrompt, setBlueprintsByPrompt] = useState<Record<string, BlueprintModel[]>>(
		{}
	);
	const [loading, setLoading] = useState(true);
	const [refreshing, setRefreshing] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [selectedFilter, setSelectedFilter] = useState<string[]>([]);

	// Header-Konfiguration mit useFocusEffect aktualisieren
	useFocusEffect(
		// Wir verwenden useCallback ohne Abhängigkeiten, um eine Endlosschleife zu vermeiden

		useCallback(() => {
			// Header-Konfiguration definieren
			const headerConfig = {
				title: t('prompts.title', 'Prompts'),
				showBackButton: true,
				rightIcons: [],
			};

			// Header-Konfiguration aktualisieren
			updateConfig(headerConfig);

			// Cleanup-Funktion, die beim Verlassen der Seite aufgerufen wird
			return () => {
				// Hier könnte man den Header zurücksetzen, falls nötig
			};
		}, [])
	);

	// Funktion zum Laden der Prompts
	const fetchPrompts = useCallback(async () => {
		try {
			setLoading(true);
			setError(null);

			// Verwende den authentifizierten Client
			const supabase = await getAuthenticatedClient();

			if (!supabase) {
				throw new Error('Konnte keinen authentifizierten Client erhalten');
			}

			// Lade alle Prompts (öffentliche und eigene)
			const { data: promptsData, error: promptsError } = await supabase
				.from('prompts')
				.select('*')
				.or(`is_public.eq.true,user_id.eq.${user?.id}`)
				.order('created_at', { ascending: false });

			if (promptsError) {
				throw promptsError;
			}

			if (promptsData) {
				setPrompts(promptsData);
				setFilteredPrompts(promptsData);

				// Lade die verknüpften Blueprints für jeden Prompt
				const promptIds = promptsData.map((prompt) => prompt.id);

				if (promptIds.length > 0) {
					// Lade die Verknüpfungen zwischen Prompts und Blueprints
					if (!supabase) {
						throw new Error('Konnte keinen authentifizierten Client erhalten');
					}

					const { data: linkData, error: linkError } = await supabase
						.from('prompt_blueprints')
						.select('prompt_id, blueprint_id')
						.in('prompt_id', promptIds);

					if (linkError) {
						throw linkError;
					}

					if (linkData && linkData.length > 0) {
						// Sammle alle Blueprint-IDs
						const blueprintIds = [...new Set(linkData.map((link) => link.blueprint_id))];

						// Lade die Blueprint-Details
						if (!supabase) {
							throw new Error('Konnte keinen authentifizierten Client erhalten');
						}

						const { data: blueprintsData, error: blueprintsError } = await supabase
							.from('blueprints')
							.select('id, name')
							.in('id', blueprintIds);

						if (blueprintsError) {
							throw blueprintsError;
						}

						if (blueprintsData) {
							// Erstelle eine Map von Prompt-ID zu Blueprints
							const blueprintMap: Record<string, BlueprintModel[]> = {};

							// Initialisiere leere Arrays für jeden Prompt
							promptIds.forEach((promptId) => {
								blueprintMap[promptId] = [];
							});

							// Fülle die Map mit den verknüpften Blueprints
							linkData.forEach((link) => {
								const blueprint = blueprintsData.find((bp) => bp.id === link.blueprint_id);
								if (blueprint) {
									blueprintMap[link.prompt_id].push(blueprint);
								}
							});

							setBlueprintsByPrompt(blueprintMap);
						}
					} else {
						// Keine Verknüpfungen gefunden, setze leere Map
						const emptyMap: Record<string, BlueprintModel[]> = {};
						promptIds.forEach((promptId) => {
							emptyMap[promptId] = [];
						});
						setBlueprintsByPrompt(emptyMap);
					}
				}
			}
		} catch (error) {
			console.error('Error fetching prompts:', error);
			setError('Failed to load prompts. Please try again.');
		} finally {
			setLoading(false);
			setRefreshing(false);
		}
	}, []);

	// Prompts beim ersten Laden abrufen
	useEffect(() => {
		fetchPrompts();
	}, [fetchPrompts]);

	// Pull-to-Refresh-Funktion
	const onRefresh = useCallback(() => {
		setRefreshing(true);
		fetchPrompts();
	}, [fetchPrompts]);

	// State für das Bearbeitungsmodal
	const [editModalVisible, setEditModalVisible] = useState(false);
	const [selectedPrompt, setSelectedPrompt] = useState<PromptModel | null>(null);

	// Funktion zum Anzeigen eines Prompts im Bearbeitungsmodal
	const handlePromptPress = useCallback(
		(promptId: string) => {
			// Finde den ausgewählten Prompt anhand der ID
			const prompt = prompts.find((p) => p.id === promptId);
			if (prompt) {
				setSelectedPrompt(prompt);
				setEditModalVisible(true);
			}
		},
		[prompts]
	);

	// Funktion zum Teilen eines Prompts
	const handleSharePrompt = useCallback((promptId: string) => {
		console.debug('Share prompt:', promptId);
		// Hier könnte die Teilen-Funktionalität implementiert werden
	}, []);

	// Funktion zum Kopieren eines Prompts
	const handleCopyPrompt = useCallback((promptId: string) => {
		console.debug('Copy prompt:', promptId);
		// Hier könnte die Kopieren-Funktionalität implementiert werden
	}, []);

	// Funktion zum Speichern eines bearbeiteten Prompts
	const handleUpdatePrompt = useCallback(
		async (title: string, promptText: string) => {
			if (!selectedPrompt) return;

			try {
				const supabase = await getAuthenticatedClient();

				if (!supabase) {
					throw new Error('Konnte keinen authentifizierten Client erhalten');
				}

				// Aktualisiere den Prompt in der Datenbank
				const { error } = await supabase
					.from('prompts')
					.update({
						memory_title: {
							...selectedPrompt.memory_title,
							[currentLanguage]: title,
						},
						prompt_text: {
							...selectedPrompt.prompt_text,
							[currentLanguage]: promptText,
						},
						updated_at: new Date().toISOString(),
					})
					.eq('id', selectedPrompt.id);

				if (error) {
					console.debug('Error updating prompt:', error);
					throw error;
				}

				// Aktualisiere die Liste der Prompts
				fetchPrompts();
			} catch (error) {
				console.error('Error updating prompt:', error);
				Alert.alert(
					t('prompts.update_error', 'Fehler beim Aktualisieren'),
					t('prompts.try_again', 'Bitte versuche es später erneut.')
				);
			}
		},
		[selectedPrompt, currentLanguage, fetchPrompts, t]
	);

	// Funktion zum Löschen eines Prompts
	const handleDeletePrompt = useCallback(async () => {
		if (!selectedPrompt) return;

		try {
			const supabase = await getAuthenticatedClient();

			if (!supabase) {
				throw new Error('Konnte keinen authentifizierten Client erhalten');
			}

			// Lösche den Prompt aus der Datenbank
			const { error } = await supabase.from('prompts').delete().eq('id', selectedPrompt.id);

			if (error) {
				console.debug('Error deleting prompt:', error);
				throw error;
			}

			// Aktualisiere die Liste der Prompts
			fetchPrompts();
		} catch (error) {
			console.error('Error deleting prompt:', error);
			Alert.alert(
				t('prompts.delete_error', 'Fehler beim Löschen'),
				t('prompts.try_again', 'Bitte versuche es später erneut.')
			);
		}
	}, [selectedPrompt, fetchPrompts, t]);

	// Funktion zum Erstellen eines neuen Prompts
	const handleCreatePrompt = useCallback(
		async (title: string, promptText: string) => {
			try {
				setLoading(true);

				// Verwende den authentifizierten Client
				const supabase = await getAuthenticatedClient();

				if (!supabase) {
					throw new Error('Konnte keinen authentifizierten Client erhalten');
				}

				// Verwende den aktuellen Benutzer aus dem Auth-Kontext statt ihn von Supabase zu holen
				if (!user || !user.id) {
					throw new Error('Benutzer nicht authentifiziert');
				}

				// Erstelle ein neues Prompt-Objekt mit der Benutzer-ID
				const newPrompt = {
					memory_title: {
						de: title,
						en: title, // Hier könnte man später eine Übersetzung implementieren
					},
					prompt_text: {
						de: promptText,
						en: promptText, // Hier könnte man später eine Übersetzung implementieren
					},
					is_public: false, // Standardmäßig nicht öffentlich
					user_id: user.id, // Verwende die ID aus dem Auth-Kontext
				};

				console.debug('Creating prompt with user_id:', user.id);

				// Speichere das neue Prompt in der Datenbank
				const { data, error } = await supabase.from('prompts').insert([newPrompt]).select();

				if (error) {
					console.debug('Database error when creating prompt:', error);
					throw error;
				}

				// Aktualisiere die Liste der Prompts
				fetchPrompts();
			} catch (error) {
				console.error('Error creating prompt:', error);
				setError('Failed to create prompt. Please try again.');
			} finally {
				setLoading(false);
			}
		},
		[fetchPrompts, user]
	);

	// Render-Funktion für einen Prompt
	const renderPrompt = (prompt: PromptModel) => {
		const linkedBlueprints = blueprintsByPrompt[prompt.id] || [];

		// Erstelle ein erweitertes Prompt-Objekt mit Blueprints für die PromptPreview-Komponente
		const promptWithBlueprints = {
			...prompt,
			blueprints: linkedBlueprints.map((blueprint) => ({
				id: blueprint.id,
				name: blueprint.name,
				color: '#FF9500', // Standard-Farbe für Blueprints
			})),
		};

		return (
			<PromptPreview
				key={prompt.id}
				prompt={promptWithBlueprints}
				onPress={() => handlePromptPress(prompt.id)}
				onShare={() => handleSharePrompt(prompt.id)}
				onCopy={() => handleCopyPrompt(prompt.id)}
			/>
		);
	};

	// Funktion zum Filtern der Prompts
	const filterPrompts = useCallback(
		(filter: string) => {
			console.debug('Filter selected:', filter);

			if (filter === 'all') {
				// Wenn "Alle" ausgewählt wurde, alle Filter zurücksetzen
				setSelectedFilter([]);
				setFilteredPrompts(prompts);
				return;
			}
			// Only show own prompts

			// Aktualisiere die ausgewählten Filter
			let newFilter: string[];

			if (selectedFilter.includes(filter)) {
				// Wenn der Filter bereits ausgewählt ist, entferne ihn
				newFilter = selectedFilter.filter((f) => f !== filter);
			} else {
				// Wenn der Filter noch nicht ausgewählt ist, füge ihn hinzu
				newFilter = [...selectedFilter, filter];
			}

			setSelectedFilter(newFilter);

			// Wende die Filter auf die Prompts an
			if (newFilter.length === 0) {
				// Keine Filter ausgewählt, zeige alle Prompts
				setFilteredPrompts(prompts);
			} else if (newFilter.includes('public') && newFilter.includes('own')) {
				// Beide Filter ausgewählt, zeige alle Prompts (entspricht keinem Filter)
				setFilteredPrompts(prompts);
			} else if (newFilter.includes('public')) {
				// Nur öffentliche Prompts anzeigen
				setFilteredPrompts(prompts.filter((prompt) => prompt.is_public));
			} else if (newFilter.includes('own')) {
				// Nur eigene Prompts anzeigen
				setFilteredPrompts(
					prompts.filter((prompt) => !prompt.is_public && prompt.user_id === user?.id)
				);
			}
		},
		[prompts, selectedFilter, user?.id]
	);

	// Aktualisiere die gefilterten Prompts, wenn sich die Prompts ändern
	useEffect(() => {
		// Wende die aktuellen Filter auf die neuen Prompts an
		if (selectedFilter.length === 0) {
			setFilteredPrompts(prompts);
		} else if (selectedFilter.includes('public') && selectedFilter.includes('own')) {
			setFilteredPrompts(prompts);
		} else if (selectedFilter.includes('public')) {
			setFilteredPrompts(prompts.filter((prompt) => prompt.is_public));
		} else if (selectedFilter.includes('own')) {
			setFilteredPrompts(
				prompts.filter((prompt) => !prompt.is_public && prompt.user_id === user?.id)
			);
		}
	}, [prompts, selectedFilter, user?.id]);

	// Render-Funktion für den Hauptinhalt
	const renderContent = () => {
		if (loading && !refreshing) {
			return (
				<View style={styles.loadingContainer}>
					<ActivityIndicator size="large" color="#FF9500" />
					<Text style={styles.loadingText}>{t('prompts.loading', 'Loading prompts...')}</Text>
				</View>
			);
		}

		if (error) {
			return (
				<View style={styles.errorContainer}>
					<Text style={styles.errorText}>{error}</Text>
					<Pressable style={styles.retryButton} onPress={fetchPrompts}>
						<Text style={styles.retryButtonText}>{t('prompts.retry', 'Retry')}</Text>
					</Pressable>
				</View>
			);
		}

		if (prompts.length === 0) {
			return (
				<View style={styles.emptyContainer}>
					<Text style={styles.emptyText}>{t('prompts.no_prompts', 'No prompts found')}</Text>
				</View>
			);
		}

		return (
			<ScrollView
				style={styles.scrollView}
				contentContainerStyle={styles.scrollViewContent}
				refreshControl={
					<RefreshControl
						refreshing={refreshing}
						onRefresh={onRefresh}
						colors={['#FF9500']}
						tintColor={isDark ? '#FFFFFF' : '#000000'}
					/>
				}
			>
				{filteredPrompts.map((prompt) => renderPrompt(prompt))}
			</ScrollView>
		);
	};

	// Filter-Optionen für die Pills
	const filterItems = [
		{
			id: 'own',
			label: t('prompts.filter_own', 'Eigene'),
		},
		{
			id: 'public',
			label: t('prompts.filter_public', 'Öffentlich'),
		},
	];

	return (
		<KeyboardAvoidingView
			style={[styles.container, { backgroundColor: pageBackgroundColor }]}
			behavior={Platform.OS === 'ios' ? 'padding' : undefined}
			keyboardVerticalOffset={Platform.OS === 'ios' ? 100 : 0}
		>
			<View style={styles.contentContainer}>
				<View style={{ alignItems: 'center', paddingBottom: 0, marginBottom: 24 }}>
					<Text
						style={{
							fontSize: 40,
							lineHeight: 40,
							fontWeight: '700',
							color: isDark ? '#FFFFFF' : '#000000',
							alignSelf: 'center',
						}}
						numberOfLines={1}
					>
						{t('prompts.title', 'Prompts')}
					</Text>
				</View>
				{renderContent()}
			</View>
			<PillFilter
				items={filterItems}
				selectedIds={selectedFilter}
				onSelectItem={filterPrompts}
				showAllOption={true}
				allOptionLabel={t('prompts.filter_all', 'Alle')}
				iconType="text"
			/>
			<PromptCreationBar
				onSubmit={handleCreatePrompt}
				titlePlaceholder={t('prompts.title_placeholder', 'Titel eingeben...')}
				promptPlaceholder={t('prompts.prompt_placeholder', 'Prompt eingeben...')}
				disabled={loading}
			/>

			{/* Prompt-Bearbeitungsmodal */}
			{selectedPrompt && (
				<PromptEditModal
					isVisible={editModalVisible}
					onClose={() => setEditModalVisible(false)}
					onSave={handleUpdatePrompt}
					onDelete={!selectedPrompt.is_public ? handleDeletePrompt : undefined}
					initialTitle={selectedPrompt.memory_title[currentLanguage] || ''}
					initialPromptText={selectedPrompt.prompt_text[currentLanguage] || ''}
					currentLanguage={currentLanguage}
				/>
			)}
		</KeyboardAvoidingView>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		width: '100%',
	},
	contentContainer: {
		flex: 1,
		width: '100%',
	},
	loadingContainer: {
		flex: 1,
		justifyContent: 'center',
		alignItems: 'center',
	},
	loadingText: {
		marginTop: 16,
		fontSize: 16,
		color: '#888888',
	},
	errorContainer: {
		flex: 1,
		justifyContent: 'center',
		alignItems: 'center',
		padding: 20,
	},
	errorText: {
		fontSize: 16,
		color: '#FF3B30',
		textAlign: 'center',
		marginBottom: 20,
	},
	retryButton: {
		backgroundColor: '#FF9500',
		paddingHorizontal: 20,
		paddingVertical: 10,
		borderRadius: 8,
	},
	retryButtonText: {
		color: '#FFFFFF',
		fontWeight: 'bold',
	},
	emptyContainer: {
		flex: 1,
		justifyContent: 'center',
		alignItems: 'center',
		padding: 20,
	},
	emptyText: {
		fontSize: 16,
		color: '#888888',
		textAlign: 'center',
	},
	scrollView: {
		flex: 1,
		width: '100%',
	},
	scrollViewContent: {
		paddingVertical: 16,
	},
});
