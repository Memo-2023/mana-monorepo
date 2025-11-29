import React, { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { View, StyleSheet, Pressable, ActivityIndicator, Platform } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { useActionSheet } from '@expo/react-native-action-sheet';
import { router } from 'expo-router';
import * as Clipboard from 'expo-clipboard';
import { getAuthenticatedClient } from '~/features/auth/lib/supabaseClient';
import Text from '~/components/atoms/Text';
import Icon from '~/components/atoms/Icon';
import MemoPreview from '~/components/molecules/MemoPreview';
import MemoPreviewSkeleton from '~/components/molecules/MemoPreviewSkeleton';
import { useToast } from '~/features/toast/contexts/ToastContext';
import { useMemoStore } from '~/features/memos/store/memoStore';
import { useAllMemoUpdates } from '~/features/memos/contexts/MemoRealtimeContext';
import { useMemoPhotos } from '~/features/storage/hooks/useMemoPhotos';
import { memoRealtimeService } from '~/features/memos/services/memoRealtimeService';

// Pagination constants
const PAGE_SIZE = 20;

export interface MemoModel {
	id: string;
	title: string;
	created_at: string;
	source?: {
		type?: string;
		content?: string;
		duration_seconds?: number;
		audio_path?: string;
		transcript?: string;
	};
	is_archived: boolean;
	is_pinned?: boolean;
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
	};
}

interface MemoListProps {
	showArchived?: boolean | null;
	spaceId?: string;
	memos?: MemoModel[];
	tagIds?: string[];
	selectionMode?: boolean;
	selectedMemoIds?: string[];
	onMemoSelection?: (memoId: string, selected: boolean) => void;
	refreshTrigger?: number; // Trigger to force refresh
	onShare?: (memo: MemoModel) => void; // Callback for sharing a memo
	onMemosLoaded?: (memos: MemoModel[]) => void; // Callback when memos are loaded
	maintainScrollPosition?: boolean; // Whether to maintain scroll position on refresh
}

const MemoList = ({
	showArchived = null,
	spaceId,
	memos: propMemos,
	tagIds,
	selectionMode = false,
	selectedMemoIds = [],
	onMemoSelection,
	refreshTrigger = 0,
	onShare,
	onMemosLoaded,
	maintainScrollPosition = false,
}: MemoListProps) => {
	const [memos, setMemos] = useState<MemoModel[]>(propMemos || []);
	const [loading, setLoading] = useState(!propMemos);
	const [loadingMore, setLoadingMore] = useState(false);
	const [hasMore, setHasMore] = useState(true);
	const [page, setPage] = useState(0);
	const [retryCount, setRetryCount] = useState(0);
	const [networkError, setNetworkError] = useState(false);
	const [hasNewContent, setHasNewContent] = useState(false);
	const loadedMemoIds = useRef(new Set<string>());
	const updateTimerRef = useRef<ReturnType<typeof setTimeout>>(null);
	const hasLoadedFromDB = useRef(false); // Track if we've loaded from database
	const pendingUpdates = useRef<{
		inserts: MemoModel[];
		updates: Map<string, MemoModel>;
		deletes: Set<string>;
	}>({ inserts: [], updates: new Map(), deletes: new Set() });
	const { showActionSheetWithOptions } = useActionSheet();
	const { showSuccess, showError } = useToast();
	const flashListRef = useRef<FlashList<MemoModel>>(null);
	const scrollPositionRef = useRef({ index: 0, offset: 0 });
	const shouldMaintainScroll = useRef(false);

	// Get the latest memo ID from the store at the component level
	const latestMemoId = useMemoStore((state) => state.latestMemo?.id);

	// Photo status hook
	const { hasPhotos: getMemoHasPhotos, checkPhotoStatus } = useMemoPhotos();

	// Static theme colors to avoid useTheme hook issues
	const themeColors = useMemo(() => {
		return {
			primary: '#f8d62b',
			primaryWithOpacity: 'rgba(248, 214, 43, 0.5)',
			text: '#2c2c2c',
		};
	}, []);

	// Fetch memos function with pagination support
	const fetchMemos = useCallback(
		async (pageNumber: number = 0, append: boolean = false) => {
			try {
				// Debug log removed

				if (pageNumber === 0) {
					setLoading(true);
					loadedMemoIds.current.clear();
				} else {
					setLoadingMore(true);
				}

				// Verwende den authentifizierten Client
				const supabase = await getAuthenticatedClient();
				// Removed debug log('MemoList: Got authenticated client');

				// Base query for memos
				let query = supabase
					.from('memos')
					.select('id, title, created_at, source, is_archived, metadata, is_pinned')
					.order('is_pinned', { ascending: false })
					.order('created_at', { ascending: false });

				// Filter by archive status if specifically requested
				if (showArchived !== null) {
					query = query.eq('is_archived', showArchived);
					// Removed debug log('MemoList: Filtering by is_archived =', showArchived);
				}

				// If tag filtering is active, use optimized RPC function
				if (tagIds && tagIds.length > 0) {
					// Use the optimized RPC function to get memos with ALL tags in a single query
					const { data: memoIdsWithAllTags, error: tagError } = await supabase.rpc(
						'get_memos_with_all_tags',
						{ tag_ids: tagIds }
					);

					if (tagError) {
						console.error('Error fetching memos for tags:', tagError);
						setMemos([]);
						setLoading(false);
						return;
					}

					if (memoIdsWithAllTags && memoIdsWithAllTags.length > 0) {
						// Add filter for these memo IDs
						query = query.in(
							'id',
							memoIdsWithAllTags.map((m) => m.memo_id)
						);
					} else {
						// No memos with these tags, return empty array
						setMemos([]);
						setLoading(false);
						return;
					}
				}

				// If spaceId is provided, skip loading - spaces feature not yet implemented
				if (spaceId) {
					// Spaces feature is not yet implemented
					console.log(
						'MemoList: Spaces feature not yet implemented, skipping space-specific memos'
					);
					setMemos([]);
					setLoading(false);
					return;
				}

				// Add pagination
				const from = pageNumber * PAGE_SIZE;
				const to = from + PAGE_SIZE - 1;
				query = query.range(from, to);

				// Removed debug log('MemoList: Executing query...');
				const { data, error } = await query;

				if (error) {
					// Debug log removed
					return;
				}

				if (data) {
					if (append) {
						// For append operations, filter out duplicates
						const newMemos = data.filter((memo: MemoModel) => !loadedMemoIds.current.has(memo.id));
						newMemos.forEach((memo: MemoModel) => loadedMemoIds.current.add(memo.id));

						setMemos((prev) => [...prev, ...newMemos]);

						// Check photo status for newly loaded memos
						if (newMemos.length > 0) {
							const memoIds = newMemos.map((memo: MemoModel) => memo.id);
							checkPhotoStatus(memoIds);
						}
					} else {
						// For replace operations (pageNumber === 0), use all data and reset tracking
						loadedMemoIds.current.clear();
						data.forEach((memo: MemoModel) => loadedMemoIds.current.add(memo.id));

						setMemos(data);

						// Call onMemosLoaded only for initial database load
						if (!hasLoadedFromDB.current && onMemosLoaded) {
							onMemosLoaded(data);
							hasLoadedFromDB.current = true;
						}

						// Check photo status for all loaded memos
						if (data.length > 0) {
							const memoIds = data.map((memo: MemoModel) => memo.id);
							checkPhotoStatus(memoIds);
						}

						// Only scroll to top when explicitly refreshing (not when maintaining position)
						if (
							flashListRef.current &&
							data.length > 0 &&
							!maintainScrollPosition &&
							!shouldMaintainScroll.current
						) {
							// Use setTimeout to ensure the list has been rendered with new data
							setTimeout(() => {
								flashListRef.current?.scrollToIndex({ index: 0, animated: false });
							}, 100);
						} else if (shouldMaintainScroll.current && scrollPositionRef.current.index > 0) {
							// Restore scroll position after data reload
							setTimeout(() => {
								flashListRef.current?.scrollToIndex({
									index: Math.min(scrollPositionRef.current.index, data.length - 1),
									animated: false,
								});
								shouldMaintainScroll.current = false;
							}, 100);
						}
					}

					// Update hasMore based on whether we got a full page
					setHasMore(data.length === PAGE_SIZE);

					// Reset retry count and network error on success
					setRetryCount(0);
					setNetworkError(false);
				}
			} catch (error: any) {
				console.error('Error loading memos:', error);

				// Check if it's a network error
				const isNetworkError =
					error?.message?.toLowerCase().includes('network') ||
					error?.message?.toLowerCase().includes('fetch') ||
					error?.code === 'NETWORK_ERROR' ||
					!navigator.onLine;

				if (isNetworkError) {
					setNetworkError(true);
					if (pageNumber > 0) {
						// Only show error for pagination, not initial load
						showError('Unable to load more memos. Check your connection.');
					}
				}

				// Keep hasMore true to allow retry
				if (pageNumber > 0) {
					setHasMore(true);
				}

				// Implement retry with exponential backoff for pagination
				if (pageNumber > 0 && retryCount < 3 && isNetworkError) {
					const retryDelay = Math.min(1000 * Math.pow(2, retryCount), 5000);
					setTimeout(() => {
						setRetryCount((prev) => prev + 1);
						fetchMemos(pageNumber, append);
					}, retryDelay);
				}
			} finally {
				setLoading(false);
				setLoadingMore(false);
			}
		},
		[showArchived, spaceId, tagIds, checkPhotoStatus]
	);

	// Handle loading more memos on scroll
	const handleLoadMore = useCallback(() => {
		if (!loadingMore && hasMore && !loading) {
			// Don't update page until fetch succeeds
			const nextPage = page + 1;
			fetchMemos(nextPage, true)
				.then(() => {
					// Only update page on successful fetch
					setPage(nextPage);
				})
				.catch(() => {
					// Page remains unchanged on error, allowing retry
					console.log('Failed to load page', nextPage, '- page counter remains at', page);
				});
		}
	}, [loadingMore, hasMore, loading, page, fetchMemos]);

	// Process batched updates
	const processBatchedUpdates = useCallback(() => {
		const updates = pendingUpdates.current;
		if (updates.deletes.size === 0 && updates.updates.size === 0 && updates.inserts.length === 0) {
			return;
		}

		setMemos((prevMemos) => {
			let updatedMemos = [...prevMemos];

			// Apply deletes
			if (updates.deletes.size > 0) {
				updatedMemos = updatedMemos.filter((memo) => !updates.deletes.has(memo.id));
				updates.deletes.forEach((id) => loadedMemoIds.current.delete(id));
			}

			// Apply updates in-place
			if (updates.updates.size > 0) {
				updatedMemos = updatedMemos.map((memo) => {
					const update = updates.updates.get(memo.id);
					if (update) {
						// Log title changes for debugging
						if (memo.title !== update.title) {
							console.log(
								'MemoList: Title changed for memo',
								memo.id,
								'from',
								memo.title,
								'to',
								update.title
							);
						}
						// Force new object creation with all properties to ensure React detects the change
						return {
							...memo,
							...update,
							// Ensure timestamp is preserved or updated
							timestamp: update.timestamp || memo.timestamp,
							// Force a unique key to trigger re-render
							_updateKey: Date.now(),
						};
					}
					return memo;
				});
			}

			// Apply inserts
			if (updates.inserts.length > 0) {
				if (page === 0) {
					// We're at the top, prepend new memos
					const newMemos = updates.inserts.filter((memo) => !loadedMemoIds.current.has(memo.id));
					newMemos.forEach((memo) => loadedMemoIds.current.add(memo.id));

					// Combine and sort to maintain pinned/chronological order
					updatedMemos = [...newMemos, ...updatedMemos].sort((a, b) => {
						// Pinned items first
						if (a.is_pinned && !b.is_pinned) return -1;
						if (!a.is_pinned && b.is_pinned) return 1;
						// Then by created_at
						return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
					});

					// Check photo status for newly inserted memos
					if (newMemos.length > 0) {
						const memoIds = newMemos.map((memo) => memo.id);
						checkPhotoStatus(memoIds);

						// Auto-scroll to top with smooth animation when new memos arrive
						setTimeout(() => {
							if (flashListRef.current) {
								flashListRef.current.scrollToIndex({ index: 0, animated: true });
							}
						}, 100);
					}
				} else {
					// User has scrolled, show notification
					setHasNewContent(true);
				}
			}

			return updatedMemos;
		});

		// Clear pending updates
		pendingUpdates.current = { inserts: [], updates: new Map(), deletes: new Set() };
	}, [page, checkPhotoStatus]);

	// Subscribe to broadcast channels for visible memos to catch service_role updates
	useEffect(() => {
		const unsubscribeFunctions: (() => void)[] = [];

		// Subscribe to broadcasts for all visible memos
		memos.forEach((memo) => {
			const unsubscribe = memoRealtimeService.subscribeToBroadcastChannel(
				`memo-updates-${memo.id}`,
				async (payload) => {
					console.log('MemoList: Received broadcast for memo', memo.id, payload);

					try {
						// Fetch fresh memo data from Supabase
						const supabase = await getAuthenticatedClient();
						const { data: updatedMemo, error } = await supabase
							.from('memos')
							.select('*')
							.eq('id', memo.id)
							.single();

						if (error) {
							console.error('MemoList: Error fetching updated memo after broadcast:', error);
							return;
						}

						if (updatedMemo) {
							// Update the memo in the list immediately
							setMemos((prevMemos) => prevMemos.map((m) => (m.id === memo.id ? updatedMemo : m)));

							console.log('MemoList: Updated memo from broadcast', {
								id: updatedMemo.id,
								title: updatedMemo.title,
								headlineStatus: updatedMemo.metadata?.processing?.headline_and_intro?.status,
							});
						}
					} catch (error) {
						console.error('MemoList: Error processing broadcast update:', error);
					}
				}
			);

			unsubscribeFunctions.push(unsubscribe);
		});

		// Cleanup on unmount or memo list change
		return () => {
			unsubscribeFunctions.forEach((unsub) => unsub());
		};
	}, [memos.map((m) => m.id).join(',')]); // Re-subscribe when memo IDs change

	// Handle real-time memo updates with batching (postgres_changes)
	useAllMemoUpdates(
		(payload) => {
			console.log(
				'MemoList: Received postgres_changes update:',
				payload.event,
				payload.new?.id || payload.old?.id
			);

			// Log more details for debugging
			if (payload.event === 'UPDATE' && payload.new) {
				console.log('MemoList: UPDATE details:', {
					id: payload.new.id,
					title: payload.new.title,
					transcriptionStatus: payload.new.metadata?.processing?.transcription?.status,
					headlineStatus: payload.new.metadata?.processing?.headline_and_intro?.status,
				});

				// Check if this is a title update for a memo we're tracking
				const currentMemo = memos.find((m) => m.id === payload.new.id);
				if (currentMemo) {
					console.log(
						'MemoList: Found memo in current list, current title:',
						currentMemo.title,
						'new title:',
						payload.new.title
					);
				}
			}

			// Queue the update
			if (payload.event === 'DELETE' && payload.old?.id) {
				pendingUpdates.current.deletes.add(payload.old.id);
			} else if (payload.event === 'UPDATE' && payload.new) {
				pendingUpdates.current.updates.set(payload.new.id, payload.new);

				// Check if this update is for a memo that's also in our insert queue
				// This handles the case where a memo is inserted without a title, then quickly updated with one
				const insertIndex = pendingUpdates.current.inserts.findIndex(
					(m) => m.id === payload.new.id
				);
				if (insertIndex !== -1) {
					// Update the queued insert with the new data
					pendingUpdates.current.inserts[insertIndex] = payload.new;
				}

				// If this is an existing memo in our list, ensure we process the update quickly
				const existingMemoIndex = memos.findIndex((m) => m.id === payload.new.id);
				if (existingMemoIndex !== -1) {
					const existingMemo = memos[existingMemoIndex];
					// Check if this is a significant update (title change or processing status change)
					const isTitleUpdate = existingMemo.title !== payload.new.title;
					const isSignificantUpdate =
						isTitleUpdate ||
						((!existingMemo.title || existingMemo.title.trim() === '') &&
							payload.new.title &&
							payload.new.title.trim() !== '');

					// Process title updates immediately, other updates with short delay
					if (updateTimerRef?.current) {
						clearTimeout(updateTimerRef.current);
					}
					updateTimerRef.current = setTimeout(
						() => {
							processBatchedUpdates();
						},
						isTitleUpdate ? 0 : isSignificantUpdate ? 10 : 50
					); // Immediate for title updates
					return;
				}
			} else if (payload.event === 'INSERT' && payload.new) {
				// Check if memo passes current filters
				const memo = payload.new;
				const passesFilters =
					(showArchived === null || memo.is_archived === showArchived) && (!spaceId || true); // Space filtering would need additional check

				if (passesFilters) {
					// Check if we already have this memo in our list or updates (race condition protection)
					const alreadyExists =
						memos.some((m) => m.id === memo.id) ||
						pendingUpdates.current.updates.has(memo.id) ||
						pendingUpdates.current.inserts.some((m) => m.id === memo.id);

					if (!alreadyExists) {
						console.log('MemoList: INSERT details:', {
							id: memo.id,
							title: memo.title,
							created_at: memo.created_at,
							hasSource: !!memo.source,
							hasMetadata: !!memo.metadata,
							transcriptionStatus: memo.metadata?.processing?.transcription?.status,
							headlineStatus: memo.metadata?.processing?.headline_and_intro?.status,
						});
						pendingUpdates.current.inserts.push(memo);

						// Process inserts immediately for new memos
						if (updateTimerRef.current) {
							clearTimeout(updateTimerRef.current);
						}
						updateTimerRef.current = setTimeout(() => {
							processBatchedUpdates();
						}, 100); // Quick processing for new memos
						return; // Important: return here to avoid overriding the timer
					}
				}
			}

			// Clear existing timer (only if we didn't already set one above)
			if (updateTimerRef.current) {
				clearTimeout(updateTimerRef.current);
			}

			// Set new timer for batch processing
			updateTimerRef.current = setTimeout(() => {
				processBatchedUpdates();
			}, 500); // 500ms batch window
		},
		[showArchived, spaceId, tagIds, processBatchedUpdates, memos, page]
	);

	// Load memos on mount and dependency changes
	useEffect(() => {
		// Wenn Memos als Props übergeben werden, verwenden wir diese direkt
		if (propMemos) {
			setMemos(propMemos);
			setLoading(false);

			// Check photo status for prop memos as well
			if (propMemos.length > 0) {
				const memoIds = propMemos.map((memo) => memo.id);
				checkPhotoStatus(memoIds);
			}
			// Don't call onMemosLoaded for prop memos to avoid infinite loop
			return;
		}

		// Reset flags when dependencies change (but not for propMemos)
		hasLoadedFromDB.current = false;

		// When maintainScrollPosition is true, preserve the scroll position
		if (maintainScrollPosition) {
			shouldMaintainScroll.current = true;
		} else {
			// Reset pagination when dependencies change
			setPage(0);
			setHasMore(true);
			loadedMemoIds.current.clear();
		}

		// Memos laden, wenn die Komponente gemountet wird oder wenn sich Abhängigkeiten ändern
		fetchMemos(0, false);
	}, [
		showArchived,
		spaceId,
		propMemos,
		refreshTrigger,
		tagIds,
		fetchMemos,
		checkPhotoStatus,
		maintainScrollPosition,
	]);

	const handleMemoPress = (memoId: string) => {
		if (selectionMode) {
			// In selection mode, toggle selection instead of navigating
			const isSelected = selectedMemoIds.includes(memoId);
			onMemoSelection?.(memoId, !isSelected);
		} else {
			// Normal mode - navigate to memo detail
			// Defensive check to ensure we have a valid ID
			if (!memoId || memoId === 'undefined' || memoId === 'null') {
				console.error('MemoList: Attempted to navigate with invalid memo ID:', memoId);
				return;
			}
			router.push(`/(protected)/(memo)/${memoId}`);
		}
	};

	// Handle copying memo content
	const handleCopyMemo = async (memo: MemoModel) => {
		try {
			// Get authenticated client to fetch complete memo data
			const supabase = await getAuthenticatedClient();

			// Fetch complete memo data with intro
			const { data: fullMemo, error: memoError } = await supabase
				.from('memos')
				.select('*')
				.eq('id', memo.id)
				.single();

			if (memoError) {
				console.debug('Error fetching full memo for copy:', memoError);
				// Fallback to basic content if full memo fetch fails
			}

			// Fetch memories for this memo
			const { data: memories, error: memoriesError } = await supabase
				.from('memories')
				.select('*')
				.eq('memo_id', memo.id)
				.order('sort_order', { ascending: true })
				.order('created_at', { ascending: false });

			if (memoriesError) {
				console.debug('Error fetching memories for copy:', memoriesError);
				// Continue without memories
			}

			// Build the content string
			let content = `${fullMemo?.title || memo.title || 'Untitled'}\n\n`;

			// Add intro if available
			if (fullMemo?.intro) {
				content += `${fullMemo.intro}\n\n`;
			}

			// Add memories if available
			if (memories && memories.length > 0) {
				memories.forEach((memory: any) => {
					content += `${memory.title || 'Memory'}\n${memory.content}\n\n`;
				});
			}

			// Add transcript if available
			const transcript =
				fullMemo?.source?.content ||
				fullMemo?.source?.transcription ||
				fullMemo?.source?.transcript ||
				memo.source?.content;
			if (transcript) {
				content += `Transkript:\n${transcript}\n\n`;
			}

			await Clipboard.setStringAsync(content);

			showSuccess('Kompletter Memo-Inhalt wurde in die Zwischenablage kopiert');
		} catch (error) {
			console.debug('Fehler beim Kopieren des Memo-Inhalts:', error);
			showSuccess('Der Memo-Inhalt konnte nicht kopiert werden');
		}
	};

	// Handle pinning/unpinning memo
	const handlePinMemo = async (memo: MemoModel) => {
		try {
			const supabase = await getAuthenticatedClient();
			const newPinnedState = !memo.is_pinned;

			const { error } = await supabase
				.from('memos')
				.update({ is_pinned: newPinnedState })
				.eq('id', memo.id);

			if (error) {
				console.debug('Error toggling pin state:', error);
				showSuccess('Das Memo konnte nicht angeheftet/entfernt werden');
				return;
			}

			// Update the local state
			setMemos((prevMemos) =>
				prevMemos.map((m) => (m.id === memo.id ? { ...m, is_pinned: newPinnedState } : m))
			);

			// Refresh the list to ensure proper sorting (pinned items go to top)
			fetchMemos(0, false);

			showSuccess(newPinnedState ? 'Memo wurde angeheftet' : 'Anheftung wurde entfernt');
		} catch (error) {
			console.debug('Error in handlePinMemo:', error);
			showSuccess('Ein Fehler ist aufgetreten');
		}
	};

	const handleDeleteMemo = async (memoId: string, memoTitle: string) => {
		// Show confirmation dialog
		showActionSheetWithOptions(
			{
				options: ['Löschen', 'Abbrechen'],
				cancelButtonIndex: 1,
				destructiveButtonIndex: 0,
				title: 'Memo löschen',
				message: `Möchtest du "${memoTitle}" wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden.`,
			},
			async (selectedIndex) => {
				if (selectedIndex === 0) {
					// Delete confirmed
					try {
						// Removed debug log('Deleting memo:', memoId);

						// Get authenticated supabase client
						const supabase = await getAuthenticatedClient();

						// Get the memo to check if it has audio
						const { data: memoData } = await supabase
							.from('memos')
							.select('source')
							.eq('id', memoId)
							.single();

						// First, delete related memories
						const { error: memoriesError } = await supabase
							.from('memories')
							.delete()
							.eq('memo_id', memoId);

						if (memoriesError) {
							// Removed debug log('Error deleting related memories:', memoriesError.message);
							return;
						}

						// If there's audio, delete it from storage
						if (memoData?.source?.audio_path) {
							const audioPath = memoData.source.audio_path;
							if (audioPath) {
								const { error: storageError } = await supabase.storage
									.from('user-uploads')
									.remove([audioPath]);

								if (storageError) {
									// Removed debug log('Error deleting audio file:', storageError.message);
									// Continue with memo deletion even if audio deletion fails
								}
							}
						}

						// Finally, delete the memo itself
						const { error: memoError } = await supabase.from('memos').delete().eq('id', memoId);

						if (memoError) {
							// Removed debug log('Error deleting memo:', memoError.message);
							return;
						}

						// Update the local state to remove the deleted memo
						setMemos((prevMemos) => prevMemos.filter((memo) => memo.id !== memoId));

						// Fetch fresh data to ensure the list is up to date
						fetchMemos(0, false);

						// Show success toast
						showSuccess('Memo wurde erfolgreich gelöscht');
					} catch (error) {
						// Removed debug log('Error in handleDeleteMemo:', error);
					}
				}
			}
		);
	};

	const renderMemoItem = ({ item }: { item: MemoModel }) => {
		// Only the latest memo should react to global recording status
		const shouldReactToRecordingStatus = item.id === latestMemoId;

		// Format the memo for MemoPreview component with all necessary data
		const formattedMemo = {
			id: item.id,
			title: item.title || '', // Let useMemoProcessing handle empty title
			timestamp: new Date(item.created_at),
			// Wichtig: Vollständige Source- und Metadaten übergeben
			source: item.source,
			metadata: item.metadata,
			is_pinned: item.is_pinned || false,
			// Leeres Tags-Array, das von der MemoPreview-Komponente gefüllt wird
			tags: [],
		};

		// Check if this memo is selected
		const isSelected = selectedMemoIds.includes(item.id);

		// Debug: Check photo status
		const memoHasPhotos = getMemoHasPhotos(item.id);

		return (
			<View style={styles.memoItem}>
				{selectionMode && (
					<View
						style={[
							styles.selectionArea,
							isSelected && {
								backgroundColor: themeColors.primaryWithOpacity,
							},
						]}
					>
						<Pressable
							style={styles.selectionIndicator}
							onPress={() => onMemoSelection?.(item.id, !isSelected)}
						>
							<Icon
								name={isSelected ? 'checkmark-circle' : 'ellipse-outline'}
								size={24}
								color={themeColors.text}
							/>
						</Pressable>
					</View>
				)}
				<View
					style={[
						styles.memoPreviewContainer,
						selectionMode ? styles.memoPreviewContainerInSelectionMode : null,
					]}
				>
					<MemoPreview
						memo={formattedMemo}
						selectionMode={selectionMode}
						selected={selectedMemoIds.includes(item.id)}
						onSelect={(selected) => onMemoSelection && onMemoSelection(item.id, selected)}
						onPress={() => handleMemoPress(item.id)}
						reactToGlobalRecordingStatus={shouldReactToRecordingStatus}
						hasPhotos={memoHasPhotos}
						showMargins={true}
						onShare={() => {
							// Trigger the onShare callback if provided
							if (onShare) {
								onShare(item);
							}
						}}
						onCopy={() => handleCopyMemo(item)}
						onPinToTop={() => handlePinMemo(item)}
						onDelete={() => handleDeleteMemo(item.id, item.title || 'Untitled Memo')}
					/>
				</View>
			</View>
		);
	};

	const renderSkeletonList = () => (
		<View style={styles.listWrapper}>
			<View>
				{Array.from({ length: 10 }).map((_, index) => {
					// Calculate opacity fade-out towards the bottom
					const opacity = Math.max(0.2, 1 - index * 0.08);
					return (
						<View key={`skeleton-${index}`} style={{ opacity }}>
							<MemoPreviewSkeleton showMargins={true} />
						</View>
					);
				})}
			</View>
		</View>
	);

	const renderEmptyList = () => (
		<View style={styles.emptyContainer}>
			<Text variant="h2">Keine Einträge</Text>
			<Text variant="body" style={styles.emptyText}>
				{spaceId
					? 'Dieser Space enthält noch keine Memos.'
					: showArchived === true
						? 'Du hast noch keine archivierten Aufnahmen.'
						: showArchived === false
							? 'Du hast noch keine aktiven Aufnahmen.'
							: 'Du hast noch keine Aufnahmen erstellt.'}
			</Text>
		</View>
	);

	const renderFooter = () => {
		if (!loadingMore && !networkError) return null;

		return (
			<View style={styles.footer}>
				{loadingMore ? (
					<>
						<ActivityIndicator size="small" color="#666" />
						<Text variant="caption" style={styles.loadingText}>
							Lade weitere Memos...
						</Text>
					</>
				) : networkError && hasMore ? (
					<Pressable
						style={styles.retryButton}
						onPress={() => {
							setNetworkError(false);
							handleLoadMore();
						}}
					>
						<Icon name="refresh" size={20} color="#666" />
						<Text variant="caption" style={styles.retryText}>
							Tap to retry loading more memos
						</Text>
					</Pressable>
				) : null}
			</View>
		);
	};

	// Show skeleton loader during initial loading
	if (loading && memos.length === 0) {
		return renderSkeletonList();
	}

	return (
		<View style={styles.listWrapper}>
			{hasNewContent && page > 0 && (
				<Pressable
					style={styles.newContentBanner}
					onPress={() => {
						setPage(0);
						setHasNewContent(false);
						loadedMemoIds.current.clear();
						fetchMemos(0, false);
					}}
				>
					<Icon name="arrow-up" size={16} color="#fff" />
					<Text variant="caption" style={styles.newContentText}>
						New memos available - tap to refresh
					</Text>
				</Pressable>
			)}
			<FlashList
				ref={flashListRef}
				data={memos}
				renderItem={renderMemoItem}
				keyExtractor={(item) => item.id}
				showsVerticalScrollIndicator={Platform.OS !== 'web'}
				ListEmptyComponent={renderEmptyList}
				ListFooterComponent={renderFooter}
				contentContainerStyle={styles.listContent}
				estimatedItemSize={180}
				extraData={[selectedMemoIds, selectionMode, loadingMore, memos]}
				onEndReached={handleLoadMore}
				onEndReachedThreshold={0.3}
				onScroll={(event) => {
					// Save current scroll position
					const offset = event.nativeEvent.contentOffset.y;
					const index = Math.floor(offset / 180); // Using estimatedItemSize
					scrollPositionRef.current = { index, offset };
				}}
				scrollEventThrottle={100}
				// Web-specific props for better scrolling
				{...(Platform.OS === 'web'
					? {
							style: { flex: 1, overflow: 'auto' },
							showsVerticalScrollIndicator: true,
						}
					: {})}
			/>
		</View>
	);
};

const styles = StyleSheet.create({
	listWrapper: {
		flex: 1,
		width: '100%',
	},
	listContent: {
		paddingBottom: 20,
		// Removed paddingHorizontal - MemoPreview now manages its own spacing with showMargins prop
	},
	memoItem: {
		marginBottom: 12,
		flexDirection: 'row',
		alignItems: 'center',
	},
	// selectedMemoItem style is now dynamic and inline
	selectionArea: {
		borderTopLeftRadius: 12,
		borderBottomLeftRadius: 12,
		paddingVertical: 8,
		marginRight: 4,
	},
	selectionIndicator: {
		marginLeft: 4,
		width: 36,
		height: 36,
		justifyContent: 'center',
		alignItems: 'center',
		zIndex: 10,
	},
	memoPreviewContainer: {
		flex: 1,
		width: '100%',
		marginTop: 0,
	},
	memoPreviewContainerInSelectionMode: {
		width: '92%', // Macht das Element schmaler im Auswahlmodus
	},
	emptyContainer: {
		flex: 1,
		justifyContent: 'center',
		alignItems: 'center',
		padding: 20,
		marginTop: 40,
	},
	emptyText: {
		textAlign: 'center',
		marginTop: 16,
		opacity: 0.7,
	},
	footer: {
		paddingVertical: 20,
		alignItems: 'center',
		justifyContent: 'center',
	},
	loadingText: {
		marginTop: 8,
		opacity: 0.7,
	},
	retryButton: {
		flexDirection: 'row',
		alignItems: 'center',
		padding: 12,
		gap: 8,
	},
	retryText: {
		opacity: 0.7,
	},
	newContentBanner: {
		position: 'absolute',
		top: 0,
		left: 20,
		right: 20,
		backgroundColor: '#4CAF50',
		paddingVertical: 8,
		paddingHorizontal: 16,
		borderRadius: 20,
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'center',
		gap: 8,
		zIndex: 100,
		elevation: 4,
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.2,
		shadowRadius: 4,
	},
	newContentText: {
		color: '#fff',
		fontWeight: '600',
	},
});

export default MemoList;
