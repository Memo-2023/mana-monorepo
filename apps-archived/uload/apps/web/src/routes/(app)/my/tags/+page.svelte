<script lang="ts">
	import type { PageData, ActionData } from './$types';
	import { enhance } from '$app/forms';
	import TagBadge from '$lib/components/TagBadge.svelte';
	import TagList from '$lib/components/TagList.svelte';
	import TagStats from '$lib/components/tags/TagStats.svelte';
	import ViewToggle from '$lib/components/ViewToggle.svelte';
	import { page } from '$app/stores';
	import { DEFAULT_TAG_COLORS } from '$lib/pocketbase';
	import { viewModes } from '$lib/stores/viewModes';
	import { Search, ArrowUpDown } from 'lucide-svelte';

	let { data, form }: { data: PageData; form: ActionData } = $props();
	let showForm = $state(false);
	let isSubmitting = $state(false);
	let searchQuery = $state('');
	let sortBy = $state<'name' | 'date' | 'usage' | 'links' | 'clicks'>('usage');
	let sortOrder = $state<'asc' | 'desc'>('desc');

	let selectedColor = $state(DEFAULT_TAG_COLORS[0]);

	// Multi-select states
	let isSelectMode = $state(false);
	let selectedTags = $state<Set<string>>(new Set());
	let showMergeModal = $state(false);
	let mergeTargetTag = $state<string>('');

	// Filter and sort tags
	let filteredAndSortedTags = $derived.by(() => {
		let tags = data.tags || [];

		// Filter by search query
		if (searchQuery) {
			tags = tags.filter((tag) => tag.name.toLowerCase().includes(searchQuery.toLowerCase()));
		}

		// Sort tags
		return [...tags].sort((a, b) => {
			let compareValue = 0;

			switch (sortBy) {
				case 'name':
					compareValue = a.name.localeCompare(b.name);
					break;
				case 'date':
					compareValue = new Date(b.created).getTime() - new Date(a.created).getTime();
					break;
				case 'usage':
					compareValue = (b.usage_count || 0) - (a.usage_count || 0);
					break;
				case 'links':
					compareValue = (b.linkCount || 0) - (a.linkCount || 0);
					break;
				case 'clicks':
					compareValue = (b.totalClicks || 0) - (a.totalClicks || 0);
					break;
			}

			return sortOrder === 'asc' ? -compareValue : compareValue;
		});
	});

	function toggleSortOrder() {
		sortOrder = sortOrder === 'asc' ? 'desc' : 'asc';
	}

	function toggleSelectMode() {
		isSelectMode = !isSelectMode;
		if (!isSelectMode) {
			selectedTags.clear();
			selectedTags = selectedTags; // Trigger reactivity
		}
	}

	function toggleTagSelection(tagId: string) {
		if (selectedTags.has(tagId)) {
			selectedTags.delete(tagId);
		} else {
			selectedTags.add(tagId);
		}
		selectedTags = selectedTags; // Trigger reactivity
	}

	function toggleSelectAll() {
		if (selectedTags.size === filteredAndSortedTags.length) {
			selectedTags.clear();
			selectedTags = selectedTags; // Trigger reactivity
		} else {
			selectedTags = new Set(filteredAndSortedTags.map((t) => t.id));
		}
	}

	async function bulkDelete() {
		if (selectedTags.size === 0) return;

		if (
			!confirm(
				`Möchten Sie wirklich ${selectedTags.size} Tag(s) löschen? Alle Verknüpfungen zu Links werden entfernt.`
			)
		) {
			return;
		}

		const formData = new FormData();
		formData.append('action', 'bulk-delete');
		formData.append('tagIds', JSON.stringify(Array.from(selectedTags)));

		try {
			const response = await fetch('?/bulkAction', {
				method: 'POST',
				body: formData,
			});

			if (response.ok) {
				selectedTags.clear();
				selectedTags = selectedTags; // Trigger reactivity
				isSelectMode = false;
				window.location.reload();
			}
		} catch (error) {
			alert('Fehler beim Löschen der Tags');
		}
	}

	async function mergeTags() {
		if (selectedTags.size < 2 || !mergeTargetTag) return;

		const formData = new FormData();
		formData.append('action', 'bulk-merge');
		formData.append('tagIds', JSON.stringify(Array.from(selectedTags)));
		formData.append('targetTagId', mergeTargetTag);

		try {
			const response = await fetch('?/bulkAction', {
				method: 'POST',
				body: formData,
			});

			if (response.ok) {
				showMergeModal = false;
				selectedTags.clear();
				selectedTags = selectedTags; // Trigger reactivity
				isSelectMode = false;
				mergeTargetTag = '';
				window.location.reload();
			}
		} catch (error) {
			alert('Fehler beim Zusammenführen der Tags');
		}
	}
</script>

<div class="min-h-screen bg-theme-background">
	<div class="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
		<div class="mb-6 flex items-center justify-between">
			<h1 class="text-3xl font-bold text-theme-text">Tags</h1>
			<div class="flex items-center gap-4">
				{#if isSelectMode && selectedTags.size > 0}
					<!-- Bulk action buttons -->
					<button
						onclick={() => (showMergeModal = true)}
						class="flex items-center gap-2 rounded-lg border border-theme-border bg-theme-surface px-3 py-2 text-theme-text transition-all hover:bg-theme-surface-hover"
						title="Merge selected tags"
					>
						<svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M4 6h16M4 12h16M4 18h7"
							/>
						</svg>
						<span class="font-medium">Zusammenführen</span>
					</button>
					<button
						onclick={bulkDelete}
						class="flex items-center gap-2 rounded-lg border border-red-500 bg-red-50 px-3 py-2 text-red-600 transition-all hover:bg-red-100"
						title="Delete selected tags"
					>
						<svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
							/>
						</svg>
						<span class="font-medium">Löschen ({selectedTags.size})</span>
					</button>
					<div class="h-6 w-px bg-theme-border"></div>
				{/if}

				{#if $viewModes.tags !== 'stats'}
					<button
						onclick={toggleSelectMode}
						class="flex items-center gap-2 rounded-lg border border-theme-border px-3 py-2 text-theme-text transition-all hover:bg-theme-surface-hover {isSelectMode
							? 'bg-theme-primary text-white hover:bg-theme-primary-hover'
							: 'bg-theme-surface'}"
						title={isSelectMode ? 'Exit select mode' : 'Enter select mode'}
					>
						<svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
							/>
						</svg>
						<span class="font-medium">{isSelectMode ? 'Fertig' : 'Auswählen'}</span>
					</button>
				{/if}
				<ViewToggle
					currentView={$viewModes.tags}
					onViewChange={(view) => viewModes.setTagsView(view)}
					showStats={true}
				/>
				<button
					onclick={() => (showForm = !showForm)}
					class="rounded-lg bg-theme-primary px-4 py-2 font-medium text-white shadow-lg transition-all hover:scale-105 hover:bg-theme-primary-hover"
				>
					{showForm ? 'Cancel' : '+ New Tag'}
				</button>
			</div>
		</div>

		<!-- Search and Sort Controls (hide in stats view) -->
		{#if $viewModes.tags !== 'stats'}
			<div class="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
				<div class="relative max-w-md flex-1">
					<Search class="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-theme-text-muted" />
					<input
						type="text"
						bind:value={searchQuery}
						placeholder="Search tags..."
						class="w-full rounded-lg border border-theme-border bg-theme-surface py-2 pl-10 pr-4 text-theme-text placeholder-theme-text-muted focus:outline-none focus:ring-2 focus:ring-theme-accent"
					/>
				</div>

				<div class="flex items-center gap-2">
					<label for="sort-select" class="text-sm font-medium text-theme-text">Sort by:</label>
					<select
						id="sort-select"
						bind:value={sortBy}
						class="rounded-lg border border-theme-border bg-theme-surface px-3 py-2 text-sm text-theme-text focus:outline-none focus:ring-2 focus:ring-theme-accent"
					>
						<option value="name">Name</option>
						<option value="date">Date Created</option>
						<option value="usage">Usage Count</option>
						<option value="links">Number of Links</option>
						<option value="clicks">Total Clicks</option>
					</select>
					<button
						onclick={toggleSortOrder}
						class="rounded-lg border border-theme-border bg-theme-surface p-2 text-theme-text transition-all hover:bg-theme-surface-hover"
						aria-label="Toggle sort order"
					>
						<ArrowUpDown class="h-4 w-4" />
					</button>
				</div>
			</div>
		{/if}

		{#if showForm}
			<div class="mb-8 rounded-xl border border-theme-border bg-theme-surface p-6 shadow-xl sm:p-8">
				<h2 class="mb-4 text-xl font-semibold text-theme-text">Create New Tag</h2>

				<form
					method="POST"
					action="?/create"
					use:enhance={() => {
						isSubmitting = true;
						return async ({ update }) => {
							await update();
							isSubmitting = false;
							showForm = false;
							selectedColor = DEFAULT_TAG_COLORS[0];
						};
					}}
				>
					<div class="space-y-4">
						<div>
							<label for="name" class="mb-1 block text-sm font-medium text-theme-text">
								Tag Name
							</label>
							<input
								type="text"
								id="name"
								name="name"
								required
								placeholder="e.g. Work, Personal, Important"
								class="w-full rounded-md border border-theme-border bg-theme-surface px-3 py-2 text-theme-text placeholder-theme-text-muted focus:outline-none focus:ring-2 focus:ring-theme-accent"
							/>
						</div>

						<div>
							<span class="mb-2 block text-sm font-medium text-theme-text"> Color </span>
							<div class="flex flex-wrap gap-2" role="group" aria-label="Tag color selection">
								{#each DEFAULT_TAG_COLORS as color}
									<button
										type="button"
										onclick={() => (selectedColor = color)}
										class="h-10 w-10 rounded border-2 transition-all hover:scale-110 {selectedColor ===
										color
											? 'border-theme-text'
											: 'border-theme-border'}"
										style="background-color: {color}"
										aria-label="Select color {color}"
									></button>
								{/each}
							</div>
							<input type="hidden" name="color" value={selectedColor} />
						</div>

						<div>
							<label class="flex items-center space-x-3">
								<input
									type="checkbox"
									name="is_public"
									class="h-4 w-4 rounded border-theme-border text-theme-primary focus:ring-theme-accent"
								/>
								<span class="text-sm font-medium text-theme-text">
									Make this tag public (visible on your profile)
								</span>
							</label>
						</div>

						<div class="flex items-center gap-2">
							<span class="text-sm text-theme-text-muted">Preview:</span>
							<TagBadge
								tag={{
									id: 'preview',
									name: 'Preview Tag',
									color: selectedColor,
									user_id: '',
									slug: '',
									is_public: false,
									created: '',
									updated: '',
								}}
								size="md"
							/>
						</div>

						<button
							type="submit"
							disabled={isSubmitting}
							class="flex w-full items-center justify-center rounded-lg bg-theme-primary px-4 py-3 font-medium text-white transition duration-200 hover:bg-theme-primary-hover disabled:cursor-not-allowed disabled:opacity-50"
						>
							{isSubmitting ? 'Creating...' : 'Create Tag'}
						</button>
					</div>
				</form>

				{#if form?.error}
					<div
						class="mt-4 rounded border border-red-400 bg-red-100 p-3 text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400"
					>
						{form.error}
					</div>
				{/if}
			</div>
		{/if}

		<!-- Select All checkbox when in select mode -->
		{#if isSelectMode && filteredAndSortedTags.length > 0}
			<div
				class="mb-4 flex items-center gap-4 rounded-lg border border-theme-border bg-theme-surface p-4"
			>
				<label class="flex cursor-pointer items-center gap-2">
					<input
						type="checkbox"
						checked={selectedTags.size === filteredAndSortedTags.length}
						onchange={toggleSelectAll}
						class="h-4 w-4 rounded border-theme-border text-theme-primary focus:ring-theme-primary"
					/>
					<span class="font-medium text-theme-text">
						{selectedTags.size === filteredAndSortedTags.length
							? 'Alle abwählen'
							: 'Alle auswählen'}
					</span>
				</label>
				<span class="text-theme-text-muted">
					{selectedTags.size} von {filteredAndSortedTags.length} ausgewählt
				</span>
			</div>
		{/if}

		{#if $viewModes.tags === 'stats'}
			<TagStats tags={filteredAndSortedTags} totalLinks={data.totalLinks || 0} period="30d" />
		{:else}
			<TagList
				tags={filteredAndSortedTags}
				viewMode={$viewModes.tags}
				{isSelectMode}
				{selectedTags}
				onToggleSelect={toggleTagSelection}
			/>
		{/if}
	</div>
</div>

<!-- Merge Tags Modal -->
{#if showMergeModal}
	<div class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
		<div class="w-full max-w-md rounded-xl bg-theme-surface p-6 shadow-2xl">
			<div class="mb-4 flex items-center justify-between">
				<h3 class="text-lg font-semibold text-theme-text">Tags zusammenführen</h3>
				<button
					onclick={() => (showMergeModal = false)}
					class="rounded-lg p-1 transition-colors hover:bg-theme-surface-hover"
				>
					<svg
						class="h-5 w-5 text-theme-text-muted"
						fill="none"
						stroke="currentColor"
						viewBox="0 0 24 24"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M6 18L18 6M6 6l12 12"
						/>
					</svg>
				</button>
			</div>

			<div class="space-y-4">
				<p class="text-sm text-theme-text-muted">
					Wählen Sie den Ziel-Tag aus. Alle Links der anderen {selectedTags.size - 1} Tags werden auf
					diesen Tag übertragen:
				</p>

				<div class="max-h-60 space-y-2 overflow-y-auto">
					{#each filteredAndSortedTags.filter((t) => selectedTags.has(t.id)) as tag}
						<label
							class="flex cursor-pointer items-center gap-2 rounded p-2 hover:bg-theme-surface-hover"
						>
							<input
								type="radio"
								name="merge-target"
								value={tag.id}
								bind:group={mergeTargetTag}
								class="h-4 w-4 border-theme-border text-theme-primary focus:ring-theme-primary"
							/>
							<TagBadge {tag} size="sm" />
							<span class="text-theme-text">{tag.name}</span>
						</label>
					{/each}
				</div>

				<div class="flex gap-2">
					<button
						onclick={mergeTags}
						disabled={!mergeTargetTag}
						class="flex-1 rounded-lg bg-theme-primary px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-theme-primary-hover disabled:cursor-not-allowed disabled:opacity-50"
					>
						Tags zusammenführen
					</button>
					<button
						onclick={() => {
							showMergeModal = false;
							mergeTargetTag = '';
						}}
						class="flex-1 rounded-lg border border-theme-border bg-theme-surface px-4 py-2 text-sm font-medium text-theme-text transition-colors hover:bg-theme-surface-hover"
					>
						Abbrechen
					</button>
				</div>
			</div>
		</div>
	</div>
{/if}
