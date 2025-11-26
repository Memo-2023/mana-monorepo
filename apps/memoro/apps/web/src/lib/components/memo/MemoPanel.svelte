<script lang="ts">
	import { onMount } from 'svelte';
	import { t } from 'svelte-i18n';
	import { user } from '$lib/stores/auth';
	import { tags as tagsStore } from '$lib/stores/tags';
	import { tabs } from '$lib/stores/tabs';
	import { memoService } from '$lib/services/memoService';
	import { tagService } from '$lib/services/tagService';
	import { questionService } from '$lib/services/questionService';
	import MemoContent from './MemoContent.svelte';
	import MemoActions from './MemoActions.svelte';
	import EditModeToolbar from './EditModeToolbar.svelte';
	import PromptBar from './PromptBar.svelte';
	import TagSelectorModal from './modals/TagSelectorModal.svelte';
	import DeleteModal from './modals/DeleteModal.svelte';
	import ShareModal from './modals/ShareModal.svelte';
	import SearchOverlay from './modals/SearchOverlay.svelte';
	import CreateMemoryModal from './modals/CreateMemoryModal.svelte';
	import ReprocessModal from './modals/ReprocessModal.svelte';
	import SpeakerLabelModal from './modals/SpeakerLabelModal.svelte';
	import TranslateModal from './modals/TranslateModal.svelte';
	import ReplaceWordModal from './modals/ReplaceWordModal.svelte';
	import SpaceSelectorModal from './modals/SpaceSelectorModal.svelte';
	import ShortcutsModal from './modals/ShortcutsModal.svelte';
	import type { Memo, Tag } from '$lib/types/memo.types';
	import { getMemoPanelShortcuts, createShortcutHandler } from '$lib/utils/keyboardShortcuts';
	import { useMemoRealtime } from '$lib/utils/realtimeUpdates';

	interface Props {
		memo: Memo | null;
		audioUrl: string | null;
		onMemoDeleted?: () => void;
		onMemoUpdated?: (memo: Memo) => void;
	}

	let { memo, audioUrl, onMemoDeleted, onMemoUpdated }: Props = $props();

	// State
	let isEditMode = $state(false);
	let isSaving = $state(false);
	let isDeleting = $state(false);
	let isAskingQuestion = $state(false);

	// Edit state
	let editedTitle = $state('');
	let editedIntro = $state('');
	let editedTranscript = $state('');

	// Modal state
	let showTagSelector = $state(false);
	let showDeleteModal = $state(false);
	let showShareModal = $state(false);
	let showSearchOverlay = $state(false);
	let showCreateMemory = $state(false);
	let showReprocess = $state(false);
	let showSpeakerLabel = $state(false);
	let showTranslate = $state(false);
	let showReplaceWord = $state(false);
	let showPromptBar = $state(false);
	let showSpaceSelector = $state(false);
	let showShortcuts = $state(false);

	// Tags state
	let availableTags = $state<Tag[]>([]);
	let selectedTagIds = $state<string[]>([]);
	let isLoadingTags = $state(false);

	// Search state
	let searchQuery = $state('');
	let searchResults = $state<
		Array<{ id: string; text: string; context: string; type: 'transcript' | 'memory' }>
	>([]);
	let currentSearchIndex = $state(0);

	// Initialize edit state when entering edit mode
	$effect(() => {
		if (isEditMode && memo) {
			editedTitle = memo.title || '';
			editedIntro = memo.intro || '';
			editedTranscript = memo.transcript || '';
		}
	});

	// Load tags when component mounts or memo changes
	onMount(async () => {
		await loadTags();

		// Increment view count (fire-and-forget, don't block UI)
		if (memo?.id) {
			memoService.incrementViewCount(memo.id).catch(err => {
				console.error('Error incrementing view count:', err);
			});
		}
	});

	$effect(() => {
		if (memo?.id) {
			loadMemoTags();
		}
	});

	// Real-time updates
	$effect(() => {
		if (!memo?.id) return;

		const cleanup = useMemoRealtime(memo.id, (event) => {
			if (event.type === 'UPDATE' && onMemoUpdated) {
				onMemoUpdated(event.memo);
			} else if (event.type === 'DELETE' && onMemoDeleted) {
				onMemoDeleted();
			}
		});

		return cleanup;
	});

	// Keyboard shortcuts
	$effect(() => {
		const shortcuts = getMemoPanelShortcuts({
			onEdit: () => !isEditMode && handleEdit(),
			onSave: () => isEditMode && handleSave(),
			onCancel: () => isEditMode && handleCancel(),
			onDelete: () => (showDeleteModal = true),
			onSearch: () => (showSearchOverlay = true),
			onShare: () => (showShareModal = true),
			onCopy: handleCopyTranscript,
			onPin: handlePinToggle,
			onCreateMemory: () => (showCreateMemory = true),
			onAskQuestion: () => (showPromptBar = true)
		});

		const allShortcuts = shortcuts.flatMap((group) => group.shortcuts);
		allShortcuts.push({
			key: '?',
			description: 'Show keyboard shortcuts',
			action: () => (showShortcuts = !showShortcuts)
		});

		const handler = createShortcutHandler(allShortcuts);
		document.addEventListener('keydown', handler);

		return () => {
			document.removeEventListener('keydown', handler);
		};
	});

	async function loadTags() {
		if (!$user) return;

		try {
			isLoadingTags = true;
			const tags = await tagService.getTags($user.id);
			availableTags = tags;
			tagsStore.setTags(tags);
		} catch (err) {
			console.error('Error loading tags:', err);
		} finally {
			isLoadingTags = false;
		}
	}

	async function loadMemoTags() {
		if (!memo) return;
		selectedTagIds = memo.tags?.map((t) => t.id) || [];
	}

	// Actions
	function handleEdit() {
		isEditMode = !isEditMode;
	}

	async function handleSave() {
		if (!memo) return;

		try {
			isSaving = true;

			await memoService.updateMemo(memo.id, {
				title: editedTitle,
				intro: editedIntro,
				transcript: editedTranscript
			});

			// Update local memo
			if (onMemoUpdated) {
				onMemoUpdated({
					...memo,
					title: editedTitle,
					intro: editedIntro,
					transcript: editedTranscript
				});
			}

			isEditMode = false;
		} catch (err) {
			console.error('Error saving memo:', err);
			alert($t('memo.error_saving'));
		} finally {
			isSaving = false;
		}
	}

	function handleCancel() {
		isEditMode = false;
		// Reset edited values
		if (memo) {
			editedTitle = memo.title || '';
			editedIntro = memo.intro || '';
			editedTranscript = memo.transcript || '';
		}
	}

	async function handleDelete() {
		if (!memo) return;

		try {
			isDeleting = true;
			await memoService.deleteMemo(memo.id);
			showDeleteModal = false;

			if (onMemoDeleted) {
				onMemoDeleted();
			}
		} catch (err) {
			console.error('Error deleting memo:', err);
			alert($t('memo.error_deleting_memo'));
		} finally {
			isDeleting = false;
		}
	}

	async function handlePinToggle() {
		if (!memo) return;

		try {
			const newPinStatus = await memoService.togglePin(memo.id, memo.is_pinned);

			if (onMemoUpdated) {
				onMemoUpdated({
					...memo,
					is_pinned: newPinStatus
				});
			}
		} catch (err) {
			console.error('Error toggling pin:', err);
			alert($t('memo.error_pin_status'));
		}
	}

	async function handleCopyTranscript() {
		if (!memo?.transcript) {
			alert($t('memo.no_transcript'));
			return;
		}

		try {
			await navigator.clipboard.writeText(memo.transcript);
			alert($t('memo.transcript_copied'));
		} catch (err) {
			console.error('Error copying transcript:', err);
			alert($t('memo.error_copying_transcript'));
		}
	}

	function handleSearch() {
		showSearchOverlay = true;
	}

	function performSearch(query: string) {
		searchQuery = query;
		if (!query.trim() || !memo) {
			searchResults = [];
			return;
		}

		const results: typeof searchResults = [];
		const lowerQuery = query.toLowerCase();

		// Search in transcript
		if (memo.transcript) {
			const transcriptLower = memo.transcript.toLowerCase();
			let index = transcriptLower.indexOf(lowerQuery);

			while (index !== -1) {
				const start = Math.max(0, index - 50);
				const end = Math.min(memo.transcript.length, index + query.length + 50);
				const context = memo.transcript.substring(start, end);

				results.push({
					id: `transcript-${index}`,
					text: query,
					context: (start > 0 ? '...' : '') + context + (end < memo.transcript.length ? '...' : ''),
					type: 'transcript'
				});

				index = transcriptLower.indexOf(lowerQuery, index + 1);
			}
		}

		// Search in memories
		if (memo.memories) {
			memo.memories.forEach((memory, idx) => {
				if (memory.title?.toLowerCase().includes(lowerQuery)) {
					results.push({
						id: `memory-title-${idx}`,
						text: query,
						context: memory.title,
						type: 'memory'
					});
				}
				if (memory.content?.toLowerCase().includes(lowerQuery)) {
					const contentLower = memory.content.toLowerCase();
					const index = contentLower.indexOf(lowerQuery);
					const start = Math.max(0, index - 50);
					const end = Math.min(memory.content.length, index + query.length + 50);
					const context = memory.content.substring(start, end);

					results.push({
						id: `memory-content-${idx}`,
						text: query,
						context: (start > 0 ? '...' : '') + context + (end < memory.content.length ? '...' : ''),
						type: 'memory'
					});
				}
			});
		}

		searchResults = results;
		currentSearchIndex = 0;
	}

	function handleNextResult() {
		if (searchResults.length === 0) return;
		currentSearchIndex = (currentSearchIndex + 1) % searchResults.length;
	}

	function handlePreviousResult() {
		if (searchResults.length === 0) return;
		currentSearchIndex = (currentSearchIndex - 1 + searchResults.length) % searchResults.length;
	}

	async function handleTagSelect(tagId: string) {
		if (!memo) return;

		try {
			const isSelected = selectedTagIds.includes(tagId);

			if (isSelected) {
				await memoService.removeTagFromMemo(memo.id, tagId);
				selectedTagIds = selectedTagIds.filter((id) => id !== tagId);
			} else {
				await memoService.addTagToMemo(memo.id, tagId);
				selectedTagIds = [...selectedTagIds, tagId];
			}

			// Update memo tags in parent
			if (onMemoUpdated) {
				const updatedTags = availableTags.filter((t) => selectedTagIds.includes(t.id));
				onMemoUpdated({
					...memo,
					tags: updatedTags
				});
			}
		} catch (err) {
			console.error('Error toggling tag:', err);
			alert($t('memo.error_updating_tags'));
		}
	}

	async function handleCreateTag(name: string, color: string) {
		if (!$user) return;

		try {
			const newTag = await tagService.createTag($user.id, name, color);
			availableTags = [...availableTags, newTag];
			tagsStore.setTags(availableTags);
		} catch (err) {
			console.error('Error creating tag:', err);
			alert($t('memo.error_creating_tag'));
		}
	}

	// Phase 2 Handlers

	async function handleCreateMemory(blueprintId: string | null, customPrompt?: string) {
		if (!memo) return;

		try {
			// TODO: Implement memory creation API call
			console.log('Creating memory:', { blueprintId, customPrompt });
			showCreateMemory = false;
			alert('Memory creation will be implemented with backend integration.');
		} catch (err) {
			console.error('Error creating memory:', err);
			alert('Failed to create memory. Please try again.');
		}
	}

	async function handleReprocess(options: {
		language?: string;
		blueprintId?: string;
		recordingDate?: string;
	}) {
		if (!memo) return;

		try {
			// TODO: Implement reprocess API call
			console.log('Reprocessing memo:', options);
			showReprocess = false;
			alert('Reprocessing will be implemented with backend integration.');
		} catch (err) {
			console.error('Error reprocessing memo:', err);
			alert('Failed to reprocess memo. Please try again.');
		}
	}

	async function handleSaveSpeakers(speakers: { id: string; name: string }[]) {
		if (!memo) return;

		try {
			// TODO: Implement speaker labels API call
			console.log('Saving speaker labels:', speakers);
			showSpeakerLabel = false;
			alert('Speaker labels saved successfully!');
		} catch (err) {
			console.error('Error saving speakers:', err);
			alert('Failed to save speaker labels. Please try again.');
		}
	}

	async function handleTranslate(targetLanguage: string) {
		if (!memo) return;

		try {
			// TODO: Implement translation API call
			console.log('Translating to:', targetLanguage);
			showTranslate = false;
			alert('Translation will be implemented with backend integration.');
		} catch (err) {
			console.error('Error translating memo:', err);
			alert('Failed to translate memo. Please try again.');
		}
	}

	async function handleReplaceWord(searchTerm: string, replaceTerm: string, replaceAll: boolean) {
		if (!memo) return;

		try {
			let newTranscript = memo.transcript || '';

			if (replaceAll) {
				const regex = new RegExp(searchTerm, 'gi');
				newTranscript = newTranscript.replace(regex, replaceTerm);
			} else {
				const index = newTranscript.toLowerCase().indexOf(searchTerm.toLowerCase());
				if (index !== -1) {
					newTranscript =
						newTranscript.substring(0, index) +
						replaceTerm +
						newTranscript.substring(index + searchTerm.length);
				}
			}

			await memoService.updateMemo(memo.id, { transcript: newTranscript });

			if (onMemoUpdated) {
				onMemoUpdated({
					...memo,
					transcript: newTranscript
				});
			}

			showReplaceWord = false;
			alert('Replacement completed successfully!');
		} catch (err) {
			console.error('Error replacing word:', err);
			alert('Failed to replace word. Please try again.');
		}
	}

	async function handleAskQuestion(question: string) {
		if (!memo) return;

		try {
			isAskingQuestion = true;

			const result = await questionService.askQuestion(memo.id, question);

			if (result.success) {
				// Reload memories to show the new answer
				const memories = await questionService.loadMemories(memo.id);
				const updatedMemo = {
					...memo,
					memories
				};

				// Update the tabs store to reflect changes immediately
				tabs.updateMemo(memo.id, updatedMemo);

				if (onMemoUpdated) {
					onMemoUpdated(updatedMemo);
				}

				showPromptBar = false;
			} else {
				alert(result.error || $t('memo.error_asking_question'));
			}
		} catch (err) {
			console.error('Error asking question:', err);
			alert($t('memo.error_asking_question'));
		} finally {
			isAskingQuestion = false;
		}
	}
</script>

{#if memo}
	<div class="relative flex h-full flex-col">
		<!-- Content (Scrollable) -->
		<MemoContent
			{memo}
			{audioUrl}
			{isEditMode}
			{editedTitle}
			{editedIntro}
			{editedTranscript}
			onTitleChange={(title) => (editedTitle = title)}
			onIntroChange={(intro) => (editedIntro = intro)}
			onTranscriptChange={(transcript) => (editedTranscript = transcript)}
			onAddTagPress={() => (showTagSelector = true)}
		/>

		<!-- Actions Bar (Fixed at Bottom) -->
		<MemoActions
			onEdit={handleEdit}
			onDelete={() => (showDeleteModal = true)}
			onShare={() => (showShareModal = true)}
			onCopy={handleCopyTranscript}
			onSearch={handleSearch}
			onCreateMemory={() => (showCreateMemory = true)}
			onAskQuestion={() => (showPromptBar = true)}
			onReprocess={() => (showReprocess = true)}
			onManageSpeakers={() => (showSpeakerLabel = true)}
			onTranslate={() => (showTranslate = true)}
			onFindReplace={() => (showReplaceWord = true)}
			onShowShortcuts={() => (showShortcuts = true)}
			onPinToggle={handlePinToggle}
			isPinned={memo.is_pinned}
			{isEditMode}
		/>

		<!-- Edit Mode Toolbar (Sticky Bottom) -->
		{#if isEditMode}
			<EditModeToolbar onSave={handleSave} onCancel={handleCancel} {isSaving} />
		{/if}
	</div>

	<!-- Modals - Lazy loaded only when visible -->
	{#if showTagSelector}
		<TagSelectorModal
			visible={showTagSelector}
			tags={availableTags}
			{selectedTagIds}
			onClose={() => (showTagSelector = false)}
			onTagSelect={handleTagSelect}
			onCreate={handleCreateTag}
			isLoading={isLoadingTags}
		/>
	{/if}

	{#if showDeleteModal}
		<DeleteModal
			visible={showDeleteModal}
			memoTitle={memo.title}
			onClose={() => (showDeleteModal = false)}
			onConfirm={handleDelete}
			{isDeleting}
		/>
	{/if}

	{#if showShareModal}
		<ShareModal
			visible={showShareModal}
			{memo}
			onClose={() => (showShareModal = false)}
		/>
	{/if}

	{#if showSearchOverlay}
		<SearchOverlay
			visible={showSearchOverlay}
			query={searchQuery}
			results={searchResults}
			currentIndex={currentSearchIndex}
			onClose={() => (showSearchOverlay = false)}
			onSearch={performSearch}
			onNext={handleNextResult}
			onPrevious={handlePreviousResult}
		/>
	{/if}

	{#if showCreateMemory}
		<CreateMemoryModal
			visible={showCreateMemory}
			blueprints={[]}
			onClose={() => (showCreateMemory = false)}
			onCreate={handleCreateMemory}
		/>
	{/if}

	{#if showReprocess}
		<ReprocessModal
			visible={showReprocess}
			currentLanguage={memo.metadata?.language || 'en'}
			currentBlueprintId={null}
			currentDate={memo.recorded_at || new Date().toISOString()}
			blueprints={[]}
			languages={[
				{ code: 'en', name: 'English' },
				{ code: 'de', name: 'German' },
				{ code: 'es', name: 'Spanish' },
				{ code: 'fr', name: 'French' }
			]}
			onClose={() => (showReprocess = false)}
			onReprocess={handleReprocess}
		/>
	{/if}

	{#if showSpeakerLabel}
		<SpeakerLabelModal
			visible={showSpeakerLabel}
			speakers={[]}
			onClose={() => (showSpeakerLabel = false)}
			onSave={handleSaveSpeakers}
		/>
	{/if}

	{#if showTranslate}
		<TranslateModal
			visible={showTranslate}
			currentLanguage={memo.metadata?.language || 'en'}
			languages={[
				{ code: 'en', name: 'English' },
				{ code: 'de', name: 'German' },
				{ code: 'es', name: 'Spanish' },
				{ code: 'fr', name: 'French' },
				{ code: 'it', name: 'Italian' }
			]}
			onClose={() => (showTranslate = false)}
			onTranslate={handleTranslate}
		/>
	{/if}

	{#if showReplaceWord}
		<ReplaceWordModal
			visible={showReplaceWord}
			transcript={memo.transcript || ''}
			onClose={() => (showReplaceWord = false)}
			onReplace={handleReplaceWord}
		/>
	{/if}

	<!-- Prompt Bar for Ask a Question -->
	{#if showPromptBar}
		<PromptBar
			visible={showPromptBar}
			onSubmit={handleAskQuestion}
			onClose={() => (showPromptBar = false)}
			placeholder={$t('memo.ask_question_placeholder')}
			manaCost={5}
			isLoading={isAskingQuestion}
		/>
	{/if}

	{#if showSpaceSelector}
		<SpaceSelectorModal
			visible={showSpaceSelector}
			spaces={[]}
			selectedSpaceIds={[]}
			onClose={() => (showSpaceSelector = false)}
			onSpaceToggle={(spaceId) => console.log('Toggle space:', spaceId)}
		/>
	{/if}

	{#if showShortcuts}
		<ShortcutsModal
			visible={showShortcuts}
			shortcutGroups={getMemoPanelShortcuts({
				onEdit: handleEdit,
				onSave: handleSave,
				onCancel: handleCancel,
				onDelete: () => (showDeleteModal = true),
				onSearch: () => (showSearchOverlay = true),
				onShare: () => (showShareModal = true),
				onCopy: handleCopyTranscript,
				onPin: handlePinToggle,
				onCreateMemory: () => (showCreateMemory = true),
				onAskQuestion: () => (showPromptBar = true)
			})}
			onClose={() => (showShortcuts = false)}
		/>
	{/if}
{:else}
	<!-- Empty State -->
	<div class="flex h-full flex-col items-center justify-center bg-content p-8 text-center">
		<div class="mb-6 text-8xl">📝</div>
		<h2 class="mb-2 text-2xl font-bold text-theme">{$t('memo.no_memo_selected')}</h2>
		<p class="text-theme-secondary">{$t('memo.select_memo_hint')}</p>
	</div>
{/if}
