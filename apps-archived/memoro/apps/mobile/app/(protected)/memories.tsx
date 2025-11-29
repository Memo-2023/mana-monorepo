import React, { useEffect, useState, useCallback } from 'react';
import { router, useFocusEffect } from 'expo-router';
import { View, StyleSheet, ActivityIndicator, RefreshControl, Alert } from 'react-native';
import PillFilter from '~/components/molecules/PillFilter';
import { FlashList } from '@shopify/flash-list';
import { useTranslation } from 'react-i18next';
import { useTheme } from '~/features/theme/ThemeProvider';
import { useHeader } from '~/features/menus/HeaderContext';
import { getAuthenticatedClient } from '~/features/auth/lib/supabaseClient';
import Text from '~/components/atoms/Text';
import Icon from '~/components/atoms/Icon';
import colors from '~/tailwind.config.js';
import Memory from '~/components/organisms/Memory';
import * as Clipboard from 'expo-clipboard';

// Memory-Modell entsprechend der Datenbankstruktur
interface MemoryModel {
	id: string;
	memo_id: string;
	content: string;
	title: string;
	created_at: string;
	updated_at: string;
	metadata?: {
		type?: string;
		prompt_id?: string;
		created_by?: string;
		blueprint_id?: string;
	};
}

// Memo-Modell für die Anzeige der zugehörigen Memos
interface MemoModel {
	id: string;
	title: string;
	created_at: string;
	intro?: string;
}

// Filter-Item für die PillFilter-Komponente
interface FilterItem {
	id: string;
	label: string;
	color?: string;
}

export default function Memories() {
	const { isDark, themeVariant, tw } = useTheme();
	const { t } = useTranslation();
	const { updateConfig } = useHeader();

	// Direkter Zugriff auf die Farben aus der Tailwind-Konfiguration
	const pageBackgroundColor = isDark
		? (colors as any).theme?.extend?.colors?.dark?.[themeVariant]?.pageBackground
		: (colors as any).theme?.extend?.colors?.[themeVariant]?.pageBackground;

	const [memories, setMemories] = useState<MemoryModel[]>([]);
	const [memos, setMemos] = useState<Record<string, MemoModel>>({});
	const [loading, setLoading] = useState(true);
	const [refreshing, setRefreshing] = useState(false);
	const [error, setError] = useState<string | null>(null);

	// Neue States für die Filterung
	const [filterItems, setFilterItems] = useState<FilterItem[]>([]);
	const [selectedFilterIds, setSelectedFilterIds] = useState<string[]>([]);
	const [filteredMemories, setFilteredMemories] = useState<MemoryModel[]>([]);

	// Header-Konfiguration mit useFocusEffect aktualisieren, um sicherzustellen, dass sie bei jeder Navigation zur Seite aktualisiert wird
	useFocusEffect(
		// Wir verwenden useCallback ohne Abhängigkeiten, um eine Endlosschleife zu vermeiden

		useCallback(() => {
			// Header-Konfiguration definieren
			const headerConfig = {
				title: t('memories.title', 'Memories'),
				showBackButton: true, // Zurück-Button anzeigen, da die Seite nicht mehr in den Tabs ist
				showMenu: true, // Menü-Icon anzeigen
				rightIcons: [], // Keine zusätzlichen Icons auf der rechten Seite
			};

			// Header-Konfiguration aktualisieren
			updateConfig(headerConfig);

			// Cleanup-Funktion, die beim Verlassen der Seite aufgerufen wird
			return () => {
				// Hier könnte man den Header zurücksetzen, falls nötig
			};
		}, [])
	);

	// Funktion zum Extrahieren einzigartiger Titel aus Memories für Filter-Pills
	const extractFilterItemsFromMemories = useCallback((memories: MemoryModel[]) => {
		// Sammle einzigartige Titel
		const uniqueTitles = new Set<string>();
		memories.forEach((memory) => {
			if (memory.title) {
				uniqueTitles.add(memory.title);
			}
		});

		// Konvertiere zu FilterItems
		const items: FilterItem[] = Array.from(uniqueTitles).map((title) => ({
			id: title, // Verwende den Titel als ID
			label: title,
			color: '#4FC3F7', // Standard-Farbe für alle Filter-Pills
		}));

		return items;
	}, []);

	// Funktion zum Filtern der Memories basierend auf ausgewählten Filtern
	const filterMemories = useCallback(() => {
		if (selectedFilterIds.length === 0) {
			// Wenn keine Filter ausgewählt sind, zeige alle Memories
			setFilteredMemories(memories);
		} else {
			// Filtere Memories basierend auf ausgewählten Titeln
			const filtered = memories.filter((memory) => selectedFilterIds.includes(memory.title));
			setFilteredMemories(filtered);
		}
	}, [memories, selectedFilterIds]);

	// Handler für die Auswahl eines Filters
	const handleFilterSelect = useCallback(
		(filterId: string) => {
			if (filterId === 'all') {
				// "Alle" Option wurde gewählt, setze ausgewählte Filter zurück
				setSelectedFilterIds([]);
			} else if (selectedFilterIds.includes(filterId)) {
				// Filter ist bereits ausgewählt, entferne ihn
				setSelectedFilterIds((prev) => prev.filter((id) => id !== filterId));
			} else {
				// Füge neuen Filter hinzu
				setSelectedFilterIds((prev) => [...prev, filterId]);
			}
		},
		[selectedFilterIds]
	);

	// Aktualisiere gefilterte Memories, wenn sich die Filter ändern
	useEffect(() => {
		filterMemories();
	}, [filterMemories, selectedFilterIds]);

	// Funktion zum Laden der Memories
	const fetchMemories = useCallback(async () => {
		try {
			setLoading(true);
			setError(null);

			// Verwende den authentifizierten Client
			const supabase = await getAuthenticatedClient();

			// Lade alle Memories
			const { data: memoriesData, error: memoriesError } = await supabase
				.from('memories')
				.select('*')
				.order('sort_order', { ascending: true })
				.order('created_at', { ascending: false });

			if (memoriesError) {
				throw memoriesError;
			}

			if (memoriesData) {
				setMemories(memoriesData);

				// Extrahiere Filter-Items aus den geladenen Memories
				const items = extractFilterItemsFromMemories(memoriesData);
				setFilterItems(items);

				// Setze die gefilterten Memories initial auf alle Memories
				setFilteredMemories(memoriesData);

				// Lade die zugehörigen Memos für jede Memory
				const memoIds = memoriesData.map((memory) => memory.memo_id);
				const uniqueMemoIds = [...new Set(memoIds)].filter(Boolean);

				if (uniqueMemoIds.length > 0) {
					const { data: memosData, error: memosError } = await supabase
						.from('memos')
						.select('id, title, created_at, intro')
						.in('id', uniqueMemoIds);

					if (memosError) {
						throw memosError;
					}

					if (memosData) {
						// Erstelle ein Objekt mit Memo-IDs als Schlüssel für schnellen Zugriff
						const memosMap: Record<string, MemoModel> = {};
						memosData.forEach((memo) => {
							memosMap[memo.id] = memo;
						});

						setMemos(memosMap);
					}
				}
			}
		} catch (error) {
			console.error('Error fetching memories:', error);
			setError('Failed to load memories. Please try again.');
		} finally {
			setLoading(false);
			setRefreshing(false);
		}
	}, [extractFilterItemsFromMemories]);

	// Memories beim ersten Laden abrufen
	useEffect(() => {
		fetchMemories();
	}, [fetchMemories]);

	// Aktualisieren der Memories bei Fokus auf die Seite
	useFocusEffect(
		useCallback(() => {
			fetchMemories();
		}, [fetchMemories])
	);

	// Pull-to-Refresh-Funktion
	const onRefresh = useCallback(() => {
		setRefreshing(true);
		fetchMemories();
	}, [fetchMemories]);

	// Funktionen für Memory-Aktionen
	const handleCopyMemory = useCallback(
		async (content: string) => {
			try {
				await Clipboard.setStringAsync(content);
				Alert.alert(
					t('common.success', 'Erfolg'),
					t('memories.copied_to_clipboard', 'Inhalt in die Zwischenablage kopiert')
				);
			} catch (error) {
				console.debug('Fehler beim Kopieren in die Zwischenablage:', error);
			}
		},
		[t]
	);

	// Funktion zum Öffnen des zugehörigen Memos
	const handleMemoPress = (memoId: string) => {
		// Navigiere zur Memo-Detailansicht
		router.push({
			pathname: '/(protected)/(memo)/[id]',
			params: { id: memoId },
		});
	};

	// Render-Funktion für ein Memory-Element
	const renderMemoryItem = ({ item }: { item: MemoryModel }) => {
		const memo = memos[item.memo_id];
		const memoryType = item.metadata?.type || 'standard';
		const isBlueprint = memoryType === 'blueprint';

		return (
			<View style={styles.memoryContainer}>
				<Memory
					key={item.id}
					title={item.title}
					content={item.content}
					defaultExpanded={true}
					onCopy={() => handleCopyMemory(item.content)}
					createdAt={item.created_at}
					onMemoPress={memo ? () => handleMemoPress(memo.id) : undefined}
				/>
			</View>
		);
	};

	// Render-Funktion für leere Liste
	const renderEmptyList = () => {
		if (loading) return null;

		return (
			<View style={styles.emptyContainer}>
				<Icon name="document-text-outline" size={48} color="#AAAAAA" />
				<Text style={styles.emptyText}>{t('memories.no_memories', 'Keine Memories gefunden')}</Text>
				<Text style={styles.emptySubtext}>
					{t(
						'memories.create_memories_hint',
						'Memories werden automatisch erstellt, wenn du Blueprints verwendest.'
					)}
				</Text>
			</View>
		);
	};

	return (
		<View style={[styles.container, { backgroundColor: pageBackgroundColor }]}>
			{loading && memories.length === 0 ? (
				<View style={styles.loadingContainer}>
					<ActivityIndicator size="large" color="#4FC3F7" />
					<Text style={styles.loadingText}>{t('common.loading', 'Wird geladen...')}</Text>
				</View>
			) : (
				<>
					{/* Verwende gefilterte Memories statt aller Memories */}
					<FlashList
						data={filteredMemories}
						renderItem={renderMemoryItem}
						estimatedItemSize={200}
						ListEmptyComponent={renderEmptyList}
						contentContainerStyle={styles.listContent}
						refreshControl={
							<RefreshControl
								refreshing={refreshing}
								onRefresh={onRefresh}
								colors={['#4FC3F7']}
								tintColor="#4FC3F7"
							/>
						}
					/>
				</>
			)}

			{/* PillFilter für die Titelfilterung am unteren Rand */}
			{!loading && (
				<View style={styles.pillFilterContainer}>
					<PillFilter
						items={filterItems}
						selectedIds={selectedFilterIds}
						onSelectItem={handleFilterSelect}
						isLoading={loading}
						error={error}
						showAllOption={true}
						allOptionLabel={t('memories.all', 'Alle')}
						iconType="hashtag"
					/>
				</View>
			)}

			{error && (
				<View style={styles.errorContainer}>
					<Text style={styles.errorText}>{error}</Text>
				</View>
			)}
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		width: '100%',
	},

	pillFilterContainer: {
		position: 'absolute',
		bottom: 0,
		left: 0,
		right: 0,
		zIndex: 10,
	},

	loadingContainer: {
		flex: 1,
		justifyContent: 'center',
		alignItems: 'center',
	},
	loadingText: {
		marginTop: 12,
		fontSize: 16,
		color: '#888888',
	},
	listContent: {
		paddingHorizontal: 16,
		paddingTop: 16,
		paddingBottom: 60, // Platz für den PillFilter am unteren Rand
		flexGrow: 1,
	},
	memoryContainer: {
		marginBottom: 16,
		// Remove padding since Memory component has its own styling
	},
	emptyContainer: {
		flex: 1,
		justifyContent: 'center',
		alignItems: 'center',
		paddingHorizontal: 32,
		paddingVertical: 64,
	},
	emptyText: {
		fontSize: 18,
		fontWeight: 'bold',
		color: '#888888',
		marginTop: 16,
		textAlign: 'center',
	},
	emptySubtext: {
		fontSize: 14,
		color: '#888888',
		marginTop: 8,
		textAlign: 'center',
	},
	errorContainer: {
		padding: 16,
		backgroundColor: '#FFEBEE',
		margin: 16,
		borderRadius: 8,
	},
	errorText: {
		color: '#D32F2F',
		textAlign: 'center',
	},
});
