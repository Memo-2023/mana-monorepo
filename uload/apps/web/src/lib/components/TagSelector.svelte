<script lang="ts">
	import type { Tag } from '$lib/pocketbase';
	import { pb, generateTagSlug, DEFAULT_TAG_COLORS } from '$lib/pocketbase';
	import TagBadge from './TagBadge.svelte';

	interface Props {
		userId: string;
		selectedTags?: Tag[];
		onchange?: (tags: Tag[]) => void;
		placeholder?: string;
	}

	let { userId, selectedTags = [], onchange, placeholder = 'Add tags...' }: Props = $props();

	let availableTags = $state<Tag[]>([]);
	let searchQuery = $state('');
	let isDropdownOpen = $state(false);
	let isCreatingTag = $state(false);
	let newTagName = $state('');
	let selectedTagIds = $state<Set<string>>(new Set(selectedTags.map((t) => t.id)));
	let inputElement: HTMLInputElement;

	$effect(() => {
		loadUserTags();
	});

	async function loadUserTags() {
		try {
			const tags = await pb.collection('tags').getList<Tag>(1, 100, {
				filter: `user_id="${userId}"`,
				sort: '-usage_count,name'
			});
			availableTags = tags.items;
		} catch (err) {
			console.error('Failed to load tags:', err);
		}
	}

	function handleInputFocus() {
		isDropdownOpen = true;
	}

	function handleInputBlur(e: FocusEvent) {
		// Delay to allow clicking on dropdown items
		setTimeout(() => {
			if (!inputElement?.contains(e.relatedTarget as Node)) {
				isDropdownOpen = false;
				isCreatingTag = false;
				newTagName = '';
			}
		}, 200);
	}

	async function toggleTag(tag: Tag) {
		if (selectedTagIds.has(tag.id)) {
			selectedTagIds.delete(tag.id);
			selectedTags = selectedTags.filter((t) => t.id !== tag.id);
		} else {
			selectedTagIds.add(tag.id);
			selectedTags = [...selectedTags, tag];
		}

		if (onchange) {
			onchange(selectedTags);
		}
	}

	async function createNewTag() {
		if (!newTagName.trim()) return;

		try {
			const randomColor = DEFAULT_TAG_COLORS[Math.floor(Math.random() * DEFAULT_TAG_COLORS.length)];
			const newTag = await pb.collection('tags').create<Tag>({
				name: newTagName.trim(),
				slug: generateTagSlug(newTagName.trim()),
				color: randomColor,
				user_id: userId,
				is_public: false,
				usage_count: 0
			});

			availableTags = [...availableTags, newTag];
			await toggleTag(newTag);

			newTagName = '';
			isCreatingTag = false;
			searchQuery = '';
		} catch (err) {
			console.error('Failed to create tag:', err);
		}
	}

	function removeTag(tag: Tag) {
		selectedTagIds.delete(tag.id);
		selectedTags = selectedTags.filter((t) => t.id !== tag.id);

		if (onchange) {
			onchange(selectedTags);
		}
	}

	const filteredTags = $derived(
		availableTags.filter(
			(tag) =>
				tag.name.toLowerCase().includes(searchQuery.toLowerCase()) && !selectedTagIds.has(tag.id)
		)
	);

	const canCreateNewTag = $derived(
		searchQuery.trim() &&
			!availableTags.some((tag) => tag.name.toLowerCase() === searchQuery.toLowerCase())
	);
</script>

<div class="space-y-2">
	{#if selectedTags.length > 0}
		<div class="flex flex-wrap gap-2">
			{#each selectedTags as tag}
				<TagBadge {tag} removable onremove={() => removeTag(tag)} />
			{/each}
		</div>
	{/if}

	<div class="relative">
		<input
			bind:this={inputElement}
			bind:value={searchQuery}
			type="text"
			{placeholder}
			onfocus={handleInputFocus}
			onblur={handleInputBlur}
			class="w-full rounded-md border border-theme-border bg-theme-surface px-3 py-2 text-theme-text placeholder-theme-text-muted focus:ring-2 focus:ring-theme-accent focus:outline-none"
		/>

		{#if isDropdownOpen && (filteredTags.length > 0 || canCreateNewTag || isCreatingTag)}
			<div
				class="absolute top-full right-0 left-0 z-50 mt-1 max-h-60 overflow-auto rounded-md border border-theme-border bg-white shadow-lg dark:bg-gray-800"
			>
				{#if isCreatingTag}
					<div class="border-b border-theme-border p-3">
						<div class="flex gap-2">
							<input
								bind:value={newTagName}
								type="text"
								placeholder="Enter tag name"
								class="flex-1 rounded border border-theme-border bg-theme-surface px-2 py-1 text-sm focus:ring-1 focus:ring-theme-accent focus:outline-none"
								onkeydown={(e) => {
									if (e.key === 'Enter') {
										e.preventDefault();
										createNewTag();
									} else if (e.key === 'Escape') {
										isCreatingTag = false;
										newTagName = '';
									}
								}}
							/>
							<button
								onclick={createNewTag}
								class="rounded bg-theme-primary px-3 py-1 text-sm text-white hover:bg-theme-primary-hover"
							>
								Add
							</button>
							<button
								onclick={() => {
									isCreatingTag = false;
									newTagName = '';
								}}
								class="rounded bg-gray-200 px-3 py-1 text-sm text-gray-700 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
							>
								Cancel
							</button>
						</div>
					</div>
				{/if}

				{#each filteredTags as tag}
					<button
						onclick={() => toggleTag(tag)}
						class="flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition-colors hover:bg-gray-100 dark:hover:bg-gray-700"
					>
						<TagBadge {tag} size="sm" />
					</button>
				{/each}

				{#if canCreateNewTag && !isCreatingTag}
					<button
						onclick={() => {
							isCreatingTag = true;
							newTagName = searchQuery;
						}}
						class="flex w-full items-center gap-2 border-t border-theme-border px-3 py-2 text-left text-sm text-theme-accent hover:bg-gray-100 dark:hover:bg-gray-700"
					>
						<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M12 4v16m8-8H4"
							/>
						</svg>
						Create "{searchQuery}"
					</button>
				{/if}
			</div>
		{/if}
	</div>
</div>
