<script lang="ts">
	import { Plus, MagnifyingGlass, X } from '@manacore/shared-icons';
	import TagBadge from './TagBadge.svelte';
	import TagColorPicker from './TagColorPicker.svelte';
	import { DEFAULT_TAG_COLOR } from './constants';
	import type { Tag } from './constants';

	interface Props {
		tags: Tag[];
		selectedTags: Tag[];
		onTagsChange: (tags: Tag[]) => void;
		onCreateTag?: (name: string, color: string) => Promise<Tag>;
		placeholder?: string;
		addTagLabel?: string;
		searchPlaceholder?: string;
		createLabel?: string;
		maxTags?: number;
	}

	let {
		tags,
		selectedTags,
		onTagsChange,
		onCreateTag,
		placeholder = 'Tags hinzufügen...',
		addTagLabel = 'Tag hinzufügen',
		searchPlaceholder = 'Tag suchen...',
		createLabel = 'Erstellen',
		maxTags,
	}: Props = $props();

	let isOpen = $state(false);
	let searchQuery = $state('');
	let isCreating = $state(false);
	let newTagName = $state('');
	let newTagColor = $state(DEFAULT_TAG_COLOR);

	const filteredTags = $derived.by(() => {
		const selectedIds = new Set(selectedTags.map((t) => t.id));
		return tags
			.filter((tag) => !selectedIds.has(tag.id))
			.filter((tag) => tag.name.toLowerCase().includes(searchQuery.toLowerCase()));
	});

	const canAddMore = $derived(!maxTags || selectedTags.length < maxTags);

	function handleSelectTag(tag: Tag) {
		if (canAddMore) {
			onTagsChange([...selectedTags, tag]);
			searchQuery = '';
		}
	}

	function handleRemoveTag(tag: Tag) {
		onTagsChange(selectedTags.filter((t) => t.id !== tag.id));
	}

	async function handleCreateTag() {
		if (!onCreateTag || !newTagName.trim()) return;

		try {
			const createdTag = await onCreateTag(newTagName.trim(), newTagColor);
			onTagsChange([...selectedTags, createdTag]);
			newTagName = '';
			newTagColor = DEFAULT_TAG_COLOR;
			isCreating = false;
			searchQuery = '';
		} catch (error) {
			console.error('Failed to create tag:', error);
		}
	}

	function handleClickOutside(e: MouseEvent) {
		const target = e.target as HTMLElement;
		if (!target.closest('.tag-selector-container')) {
			isOpen = false;
			isCreating = false;
		}
	}

	function handleKeyDown(e: KeyboardEvent) {
		if (e.key === 'Escape') {
			isOpen = false;
			isCreating = false;
		}
	}
</script>

<svelte:window onclick={handleClickOutside} onkeydown={handleKeyDown} />

<div class="tag-selector-container relative">
	<!-- Selected Tags Display -->
	<div class="flex flex-wrap items-center gap-2 mb-2">
		{#each selectedTags as tag (tag.id)}
			<TagBadge {tag} removable onRemove={() => handleRemoveTag(tag)} />
		{/each}

		{#if canAddMore}
			<button
				type="button"
				onclick={() => (isOpen = !isOpen)}
				class="
					inline-flex items-center gap-1.5 px-3 py-1.5
					text-sm text-muted-foreground
					border border-dashed border-gray-300 dark:border-gray-600
					rounded-full
					hover:border-gray-400 dark:hover:border-gray-500
					hover:text-foreground
					transition-colors
				"
			>
				<Plus size={14} weight="bold" />
				<span>{addTagLabel}</span>
			</button>
		{/if}
	</div>

	<!-- Dropdown -->
	{#if isOpen}
		<div
			class="
				absolute z-50 mt-1 w-full min-w-[280px]
				bg-white dark:bg-gray-800
				border border-gray-200 dark:border-gray-700
				rounded-xl shadow-lg
				overflow-hidden
			"
		>
			<!-- Search Input -->
			<div class="p-3 border-b border-gray-100 dark:border-gray-700">
				<div class="relative">
					<MagnifyingGlass
						size={16}
						class="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
					/>
					<input
						type="text"
						bind:value={searchQuery}
						placeholder={searchPlaceholder}
						class="
							w-full pl-9 pr-3 py-2
							text-sm
							bg-gray-50 dark:bg-gray-900
							border border-gray-200 dark:border-gray-700
							rounded-lg
							focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent
						"
					/>
				</div>
			</div>

			<!-- Tag List -->
			<div class="max-h-48 overflow-y-auto p-2">
				{#if filteredTags.length > 0}
					{#each filteredTags as tag (tag.id)}
						<button
							type="button"
							onclick={() => handleSelectTag(tag)}
							class="
								w-full flex items-center gap-2 px-3 py-2
								text-sm text-left
								rounded-lg
								hover:bg-gray-100 dark:hover:bg-gray-700
								transition-colors
							"
						>
							<span
								class="w-3 h-3 rounded-full flex-shrink-0"
								style="background-color: {tag.color ?? tag.style?.color ?? DEFAULT_TAG_COLOR}"
							></span>
							<span class="truncate">{tag.name}</span>
						</button>
					{/each}
				{:else if searchQuery && !isCreating}
					<div class="px-3 py-2 text-sm text-muted-foreground text-center">Kein Tag gefunden</div>
				{/if}
			</div>

			<!-- Create New Tag -->
			{#if onCreateTag}
				<div class="p-3 border-t border-gray-100 dark:border-gray-700">
					{#if isCreating}
						<div class="space-y-3">
							<input
								type="text"
								bind:value={newTagName}
								{placeholder}
								class="
									w-full px-3 py-2
									text-sm
									bg-gray-50 dark:bg-gray-900
									border border-gray-200 dark:border-gray-700
									rounded-lg
									focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent
								"
								onkeydown={(e) => e.key === 'Enter' && handleCreateTag()}
							/>
							<TagColorPicker
								selectedColor={newTagColor}
								onColorChange={(c) => (newTagColor = c)}
								size="sm"
							/>
							<div class="flex items-center gap-2">
								<button
									type="button"
									onclick={() => (isCreating = false)}
									class="
										flex-1 px-3 py-1.5
										text-sm text-muted-foreground
										hover:bg-gray-100 dark:hover:bg-gray-700
										rounded-lg transition-colors
									"
								>
									<X size={14} class="inline mr-1" />
									Abbrechen
								</button>
								<button
									type="button"
									onclick={handleCreateTag}
									disabled={!newTagName.trim()}
									class="
										flex-1 px-3 py-1.5
										text-sm font-medium
										bg-primary text-primary-foreground
										rounded-lg
										hover:opacity-90 transition-opacity
										disabled:opacity-50 disabled:cursor-not-allowed
									"
								>
									{createLabel}
								</button>
							</div>
						</div>
					{:else}
						<button
							type="button"
							onclick={() => {
								isCreating = true;
								newTagName = searchQuery;
							}}
							class="
								w-full flex items-center justify-center gap-2 px-3 py-2
								text-sm font-medium
								text-primary
								hover:bg-primary/10
								rounded-lg transition-colors
							"
						>
							<Plus size={16} weight="bold" />
							<span>Neuen Tag erstellen</span>
						</button>
					{/if}
				</div>
			{/if}
		</div>
	{/if}
</div>
