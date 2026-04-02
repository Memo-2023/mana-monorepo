<script lang="ts">
	import Modal from '$lib/components/Modal.svelte';
	import type { Tag } from '$lib/types/memo.types';

	interface Props {
		visible: boolean;
		tags: Tag[];
		selectedTagIds: string[];
		onClose: () => void;
		onTagSelect: (tagId: string) => void;
		onCreate: (name: string, color: string) => void;
		isLoading?: boolean;
	}

	let {
		visible,
		tags,
		selectedTagIds,
		onClose,
		onTagSelect,
		onCreate,
		isLoading = false,
	}: Props = $props();

	let searchQuery = $state('');
	let isCreating = $state(false);
	let newTagName = $state('');
	let newTagColor = $state('#3B82F6');

	const filteredTags = $derived(
		tags.filter((tag) => tag.name.toLowerCase().includes(searchQuery.toLowerCase()))
	);

	const colors = [
		{ name: 'Blue', value: '#3B82F6' },
		{ name: 'Red', value: '#EF4444' },
		{ name: 'Green', value: '#10B981' },
		{ name: 'Yellow', value: '#F59E0B' },
		{ name: 'Purple', value: '#8B5CF6' },
		{ name: 'Pink', value: '#EC4899' },
		{ name: 'Indigo', value: '#6366F1' },
		{ name: 'Gray', value: '#6B7280' },
	];

	function handleCreateTag() {
		if (!newTagName.trim()) return;
		onCreate(newTagName.trim(), newTagColor);
		newTagName = '';
		newTagColor = '#3B82F6';
		isCreating = false;
	}

	function handleCancel() {
		isCreating = false;
		newTagName = '';
		newTagColor = '#3B82F6';
	}
</script>

<Modal {visible} {onClose} title="Manage Tags" maxWidth="md">
	{#snippet children()}
		<div class="space-y-4">
			<!-- Search Input -->
			<div class="relative">
				<input
					type="text"
					placeholder="Search tags..."
					bind:value={searchQuery}
					class="w-full rounded-lg border border-theme bg-content px-4 py-2 pl-10 text-theme focus:outline-none focus:ring-2 focus:ring-primary"
				/>
				<svg
					class="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-theme-secondary"
					fill="none"
					stroke="currentColor"
					viewBox="0 0 24 24"
				>
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
					/>
				</svg>
			</div>

			<!-- Create New Tag Section -->
			{#if isCreating}
				<div class="rounded-lg border border-theme bg-content p-4 space-y-3">
					<h4 class="font-semibold text-theme">Create New Tag</h4>

					<!-- Tag Name Input -->
					<input
						type="text"
						placeholder="Tag name..."
						bind:value={newTagName}
						class="w-full rounded-lg border border-theme bg-menu px-3 py-2 text-theme focus:outline-none focus:ring-2 focus:ring-primary"
					/>

					<!-- Color Selector -->
					<div class="space-y-2">
						<label class="text-sm font-medium text-theme-secondary">Color</label>
						<div class="flex flex-wrap gap-2">
							{#each colors as color}
								<button
									onclick={() => (newTagColor = color.value)}
									class="h-8 w-8 rounded-full transition-all {newTagColor === color.value
										? 'ring-2 ring-offset-2 ring-primary'
										: ''}"
									style="background-color: {color.value}"
									title={color.name}
								/>
							{/each}
						</div>
					</div>

					<!-- Actions -->
					<div class="flex gap-2">
						<button onclick={handleCreateTag} class="btn-primary flex-1">Create</button>
						<button onclick={handleCancel} class="btn-secondary flex-1">Cancel</button>
					</div>
				</div>
			{:else}
				<button onclick={() => (isCreating = true)} class="btn-secondary w-full">
					<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M12 4v16m8-8H4"
						/>
					</svg>
					<span>Create New Tag</span>
				</button>
			{/if}

			<!-- Tags List -->
			<div class="max-h-80 space-y-1 overflow-y-auto">
				{#if isLoading}
					<div class="flex items-center justify-center py-8">
						<div
							class="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"
						/>
					</div>
				{:else if filteredTags.length === 0}
					<div class="py-8 text-center">
						<p class="text-theme-secondary">
							{searchQuery ? 'No tags found' : 'No tags yet. Create your first tag!'}
						</p>
					</div>
				{:else}
					{#each filteredTags as tag (tag.id)}
						<button
							onclick={() => onTagSelect(tag.id)}
							class="flex w-full items-center justify-between rounded-lg p-3 transition-colors hover:bg-menu-hover {selectedTagIds.includes(
								tag.id
							)
								? 'bg-menu'
								: ''}"
						>
							<div class="flex items-center gap-3">
								<div
									class="h-4 w-4 rounded-full"
									style="background-color: {tag.color || '#gray'}"
								/>
								<span class="font-medium text-theme">{tag.name}</span>
							</div>

							{#if selectedTagIds.includes(tag.id)}
								<svg
									class="h-5 w-5 text-primary"
									fill="none"
									stroke="currentColor"
									viewBox="0 0 24 24"
								>
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
										d="M5 13l4 4L19 7"
									/>
								</svg>
							{/if}
						</button>
					{/each}
				{/if}
			</div>
		</div>
	{/snippet}

	{#snippet footer()}
		<div class="flex justify-end">
			<button onclick={onClose} class="btn-primary">Done</button>
		</div>
	{/snippet}
</Modal>
