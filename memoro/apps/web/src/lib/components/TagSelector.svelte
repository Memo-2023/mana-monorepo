<script lang="ts">
	import { onMount } from 'svelte';
	import { supabase } from '$lib/supabaseClient';
	import { TagService } from '$lib/services/tagService';
	import { tags } from '$lib/stores/tags';
	import TagBadge from './TagBadge.svelte';
	import type { Tag } from '$lib/types/memo.types';

	let {
		userId,
		selectedTags = [],
		onTagsChange
	}: {
		userId: string;
		selectedTags: Tag[];
		onTagsChange: (tags: Tag[]) => void;
	} = $props();

	let isOpen = $state(false);
	let searchQuery = $state('');
	let isCreatingTag = $state(false);
	let newTagName = $state('');
	let newTagColor = $state('#3b82f6');

	const tagService = new TagService(supabase);

	onMount(async () => {
		if ($tags.length === 0) {
			const allTags = await tagService.getTags(userId);
			tags.setTags(allTags);
		}
	});

	$effect(() => {
		const filteredTags = $tags.filter((tag) =>
			tag.name.toLowerCase().includes(searchQuery.toLowerCase())
		);
	});

	function toggleTag(tag: Tag) {
		const isSelected = selectedTags.some((t) => t.id === tag.id);
		if (isSelected) {
			onTagsChange(selectedTags.filter((t) => t.id !== tag.id));
		} else {
			onTagsChange([...selectedTags, tag]);
		}
	}

	function removeTag(tag: Tag) {
		onTagsChange(selectedTags.filter((t) => t.id !== tag.id));
	}

	async function createNewTag() {
		if (!newTagName.trim()) return;

		try {
			const tag = await tagService.createTag(userId, newTagName, newTagColor);
			tags.addTag(tag);
			onTagsChange([...selectedTags, tag]);
			newTagName = '';
			newTagColor = '#3b82f6';
			isCreatingTag = false;
		} catch (error) {
			console.error('Error creating tag:', error);
			alert('Failed to create tag');
		}
	}

	let filteredTags = $derived(
		$tags.filter(
			(tag) =>
				tag.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
				!selectedTags.some((t) => t.id === tag.id)
		)
	);
</script>

<div class="relative">
	<!-- Selected Tags Display -->
	<div class="mb-2">
		<label class="mb-2 block text-sm font-medium">Tags</label>
		<div class="flex flex-wrap gap-2">
			{#each selectedTags as tag (tag.id)}
				<TagBadge {tag} removable onRemove={() => removeTag(tag)} />
			{/each}
			<button
				onclick={() => (isOpen = !isOpen)}
				class="rounded-full border-2 border-dashed border-gray-300 px-3 py-1 text-sm text-gray-600 transition-colors hover:border-blue-500 hover:text-blue-600 dark:border-gray-600 dark:text-gray-400"
			>
				+ Add Tag
			</button>
		</div>
	</div>

	<!-- Dropdown -->
	{#if isOpen}
		<div class="absolute top-full left-0 z-50 mt-2 w-72 rounded-lg border border-gray-200 bg-white p-4 shadow-lg dark:border-gray-700 dark:bg-gray-800">
			<!-- Search -->
			<input
				type="search"
				bind:value={searchQuery}
				placeholder="Search tags..."
				class="input-field mb-3"
			/>

			<!-- Tag List -->
			<div class="mb-3 max-h-48 space-y-1 overflow-y-auto">
				{#each filteredTags as tag (tag.id)}
					<button
						onclick={() => toggleTag(tag)}
						class="flex w-full items-center gap-2 rounded-lg p-2 transition-colors bg-content-hover"
					>
						<div
							class="h-4 w-4 rounded-full"
							style="background-color: {tag.color || '#3b82f6'}"
						></div>
						<span class="flex-1 text-left text-sm">{tag.name}</span>
					</button>
				{:else}
					<p class="py-4 text-center text-sm text-gray-500">No tags found</p>
				{/each}
			</div>

			<!-- Create New Tag -->
			{#if !isCreatingTag}
				<button
					onclick={() => (isCreatingTag = true)}
					class="w-full rounded-lg border-2 border-dashed border-gray-300 p-2 text-sm text-gray-600 transition-colors hover:border-blue-500 hover:text-blue-600 dark:border-gray-600 dark:text-gray-400"
				>
					+ Create New Tag
				</button>
			{:else}
				<div class="space-y-2 border-t border-gray-200 pt-3 dark:border-gray-700">
					<input
						type="text"
						bind:value={newTagName}
						placeholder="Tag name"
						class="input-field"
						onkeydown={(e) => e.key === 'Enter' && createNewTag()}
					/>
					<div class="flex gap-2">
						<input type="color" bind:value={newTagColor} class="h-10 w-16 cursor-pointer" />
						<button onclick={createNewTag} class="btn-primary flex-1">Create</button>
						<button onclick={() => (isCreatingTag = false)} class="btn-secondary">Cancel</button>
					</div>
				</div>
			{/if}

			<!-- Close Button -->
			<button
				onclick={() => (isOpen = false)}
				class="absolute top-2 right-2 rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-700"
			>
				<svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
				</svg>
			</button>
		</div>
	{/if}
</div>

<style>
	/* Click outside to close */
	:global(body) {
		-webkit-tap-highlight-color: transparent;
	}
</style>
