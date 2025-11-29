import { create } from 'zustand';
import { getAuthenticatedClient } from '~/features/auth/lib/supabaseClient';

export interface MemoItem {
	id: string;
	title: string;
	timestamp?: Date;
	is_pinned?: boolean;
	isPlaceholder?: boolean; // Flag to indicate this is a placeholder during upload
	tags?: Array<{ id: string; text: string; color: string }>;
	space?: {
		id: string;
		name: string;
		color?: string;
	};
	source?: {
		type?: string;
		content?: string;
		audio_path?: string;
		transcript?: string;
	};
	metadata?: {
		processing?: {
			transcription?: {
				status?: string;
				timestamp?: string;
			};
			headline?: {
				status?: string;
				timestamp?: string;
			};
			headline_and_intro?: {
				status?: string;
				updated_at?: string;
			};
		};
		transcriptionStatus?: string;
		blueprintId?: string | null;
		audioFileId?: string; // ID of the audio file for upload status tracking
		stats?: {
			viewCount?: number;
			shareCount?: number;
			editCount?: number;
		};
	};
}

interface MemoState {
	latestMemo: MemoItem | null;
	isLoading: boolean;
	lastViewedMemoId: string | null;
	loadLatestMemo: () => Promise<void>;
	setLatestMemo: (memo: MemoItem | null) => void;
	setUploadingPlaceholder: (
		memoId: string,
		audioFileId: string,
		title?: string,
		spaceId?: string | null
	) => void;
	setLastViewedMemoId: (id: string | null) => void;
	incrementLocalViewCount: (id: string) => void;
	updateMemo: (memoId: string, updates: Partial<MemoItem>) => void;
}

export const useMemoStore = create<MemoState>((set, get) => ({
	latestMemo: null,
	isLoading: false,
	lastViewedMemoId: null,
	loadLatestMemo: async () => {
		try {
			set({ isLoading: true });
			const supabase = await getAuthenticatedClient();

			// Erste Abfrage: Hole die neuesten Memos
			// Wir sortieren nach created_at in absteigender Reihenfolge, um die neuesten Memos zuerst zu bekommen
			const { data, error } = await supabase.rpc('get_memos_with_location', {
				limit_count: 30,
				order_by: 'created_at',
				order_ascending: false,
			});

			if (error) {
				console.debug('Fehler beim Laden der letzten Memos:', error.message);
				return;
			}

			if (data && data.length > 0) {
				console.debug('Anzahl geladener Memos:', data.length);

				// Gruppiere Memos nach Pfad, um doppelte Einträge zu finden
				const memosByPath: Record<string, any[]> = {};

				// Zuerst alle Memos nach audio_path gruppieren
				data.forEach((memo) => {
					const path = memo.source?.audio_path;
					if (path) {
						if (!memosByPath[path]) {
							memosByPath[path] = [];
						}
						memosByPath[path].push(memo);
					} else {
						// Für Memos ohne Pfad verwenden wir die ID als Schlüssel
						const uniqueKey = `no-path-${memo.id}`;
						memosByPath[uniqueKey] = [memo];
					}
				});

				// Debug-Ausgabe für die gruppierten Memos
				console.debug('Gruppierte Memos nach Pfad:', Object.keys(memosByPath).length);

				// Finde das neueste Memo (das erste in der nach created_at absteigend sortierten Liste)
				const latestMemoByTimestamp = data[0];
				console.debug('Neuestes Memo nach Zeitstempel:', latestMemoByTimestamp.id);

				// Finde das Memo mit dem fortgeschrittensten Status für den Pfad des neuesten Memos
				let bestMemo = latestMemoByTimestamp; // Standardmäßig das neueste Memo

				// Hole den audio_path des neuesten Memos
				const latestMemoPath = latestMemoByTimestamp.source?.audio_path;

				if (latestMemoPath && memosByPath[latestMemoPath]?.length > 1) {
					// Es gibt mehrere Einträge für denselben Pfad
					console.debug(
						`Mehrere Einträge (${memosByPath[latestMemoPath].length}) für Pfad:`,
						latestMemoPath
					);

					// Suche nach einem Memo mit Titel (höchste Priorität)
					let completedMemo = memosByPath[latestMemoPath].find(
						(memo) =>
							memo.title && memo.title !== 'Unbenanntes Memo' && memo.title !== 'Neue Aufnahme'
					);

					// Wenn kein Memo mit Titel gefunden wurde, suche nach einem Memo mit abgeschlossener Headline-Generierung
					if (!completedMemo) {
						completedMemo = memosByPath[latestMemoPath].find(
							(memo) => memo.metadata?.processing?.headline_and_intro?.status === 'completed'
						);
					}

					// Wenn immer noch nichts gefunden wurde, suche nach einem Memo mit abgeschlossener Transkription
					if (!completedMemo) {
						completedMemo = memosByPath[latestMemoPath].find(
							(memo) => memo.metadata?.processing?.transcription?.status === 'completed'
						);
					}

					if (completedMemo) {
						console.debug('Memo mit abgeschlossener Transkription gefunden:', completedMemo.id);
						bestMemo = completedMemo;
					}
				}

				console.debug('Bestes Memo ausgewählt:', bestMemo.id);
				console.debug('Memo-Details:', {
					id: bestMemo.id,
					title: bestMemo.title,
					audio_path: bestMemo.source?.audio_path,
					transcriptionStatus:
						bestMemo.metadata?.processing?.transcription?.status ||
						bestMemo.metadata?.transcriptionStatus,
					headlineStatus: bestMemo.metadata?.processing?.headline_and_intro?.status,
					hasTranscript: !!(bestMemo.transcript || bestMemo.source?.transcript),
				});

				// Formatiere das Memo für die MemoPreview-Komponente
				// Use recording start time if available, otherwise use created_at
				const timestamp = bestMemo.metadata?.recordingStartedAt
					? new Date(bestMemo.metadata.recordingStartedAt)
					: new Date(bestMemo.created_at);

				set({
					latestMemo: {
						id: bestMemo.id,
						title: bestMemo.title || 'Unbenanntes Memo',
						timestamp: timestamp,
						is_pinned: bestMemo.is_pinned || false,
						// Füge Source und Metadaten hinzu
						source: bestMemo.source,
						metadata: {
							...bestMemo.metadata,
							stats: bestMemo.metadata?.stats || {
								viewCount: 0,
								shareCount: 0,
								editCount: 0,
							},
						},
					},
				});
			} else {
				set({ latestMemo: null });
			}
		} catch (error) {
			console.debug('Fehler beim Laden des letzten Memos:', error);
		} finally {
			set({ isLoading: false });
		}
	},
	setLatestMemo: (memo) => set({ latestMemo: memo }),
	setUploadingPlaceholder: (memoId, audioFileId, title, spaceId) => {
		const placeholderMemo: MemoItem = {
			id: memoId,
			title: title || 'New Recording',
			timestamp: new Date(),
			isPlaceholder: true,
			source: {
				type: 'audio',
			},
			metadata: {
				audioFileId,
				transcriptionStatus: 'uploading',
				stats: {
					viewCount: 0,
					shareCount: 0,
					editCount: 0,
				},
			},
			...(spaceId && {
				space: {
					id: spaceId,
					name: '', // Will be populated by MemoPreview
				},
			}),
		};
		console.log('[MemoStore] Setting uploading placeholder memo:', memoId);
		set({ latestMemo: placeholderMemo });
	},
	setLastViewedMemoId: (id) => set({ lastViewedMemoId: id }),
	incrementLocalViewCount: (id) =>
		set((state) => {
			const { latestMemo } = state;
			if (latestMemo && latestMemo.id === id) {
				const currentViewCount = latestMemo.metadata?.stats?.viewCount || 0;
				return {
					latestMemo: {
						...latestMemo,
						metadata: {
							...latestMemo.metadata,
							stats: {
								...latestMemo.metadata?.stats,
								viewCount: currentViewCount + 1,
								shareCount: latestMemo.metadata?.stats?.shareCount || 0,
								editCount: latestMemo.metadata?.stats?.editCount || 0,
							},
						},
					},
				};
			}
			return state;
		}),
	updateMemo: (memoId, updates) =>
		set((state) => {
			const { latestMemo } = state;

			// Update the latest memo if it matches the ID
			if (latestMemo && latestMemo.id === memoId) {
				// Create a completely new object to ensure React detects the change
				const updatedMemo: MemoItem = {
					id: latestMemo.id,
					title: updates.title !== undefined ? updates.title : latestMemo.title,
					timestamp: updates.timestamp || latestMemo.timestamp,
					is_pinned: updates.is_pinned !== undefined ? updates.is_pinned : latestMemo.is_pinned,
					tags: updates.tags || latestMemo.tags,
					space: updates.space || latestMemo.space,
					// Deep merge metadata if present in updates
					metadata: updates.metadata
						? {
								...latestMemo.metadata,
								...updates.metadata,
								// Deep merge processing if present
								processing: updates.metadata.processing
									? {
											...latestMemo.metadata?.processing,
											...updates.metadata.processing,
										}
									: latestMemo.metadata?.processing,
							}
						: latestMemo.metadata,
					// Deep merge source if present
					source: updates.source
						? {
								...latestMemo.source,
								...updates.source,
							}
						: latestMemo.source,
				};

				console.log(
					`MemoStore: Updated memo ${memoId} in store - title changed from "${latestMemo.title}" to "${updatedMemo.title}"`
				);

				return { latestMemo: updatedMemo };
			}

			return state;
		}),
}));
