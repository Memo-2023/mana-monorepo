<script lang="ts">
	import type { Tag } from '$lib/pocketbase';
	import TagCard from './TagCard.svelte';
	import TagListItem from './TagListItem.svelte';
	import TagStats from './TagStats.svelte';
	import type { ViewMode } from '$lib/stores/viewModes';

	interface Props {
		tags: (Tag & { linkCount?: number; totalClicks?: number })[];
		viewMode: ViewMode;
		isSelectMode?: boolean;
		selectedTags?: Set<string>;
		onToggleSelect?: (tagId: string) => void;
	}

	let { 
		tags, 
		viewMode,
		isSelectMode = false,
		selectedTags = new Set<string>(),
		onToggleSelect = () => {}
	}: Props = $props();
</script>

{#if tags && tags.length > 0}
	{#if viewMode === 'stats'}
		<TagStats {tags} />
	{:else if viewMode === 'cards'}
		<div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
			{#each tags as tag}
				<div class="relative {isSelectMode && selectedTags.has(tag.id) ? 'ring-2 ring-theme-primary rounded-xl' : ''}">
					{#if isSelectMode}
						<div class="absolute top-3 left-3 z-10">
							<input
								type="checkbox"
								checked={selectedTags.has(tag.id)}
								onchange={() => onToggleSelect(tag.id)}
								class="h-5 w-5 rounded border-theme-border text-theme-primary focus:ring-theme-primary cursor-pointer bg-white"
							/>
						</div>
					{/if}
					<TagCard {tag} />
				</div>
			{/each}
		</div>
	{:else}
		<div class="rounded-xl border border-theme-border bg-theme-surface shadow-xl overflow-hidden">
			<div class="border-b border-theme-border bg-theme-surface-hover px-4 sm:px-6 py-4">
				<h2 class="text-lg sm:text-xl font-semibold text-theme-text">
					Your Tags ({tags.length} total)
				</h2>
			</div>
			<!-- Desktop Table Header -->
			<div class="hidden lg:grid {isSelectMode ? 'grid-cols-[40px_minmax(200px,1fr)_100px_120px_100px_80px_140px]' : 'grid-cols-[minmax(200px,1fr)_100px_120px_100px_80px_140px]'} items-center gap-4 border-b border-theme-border bg-theme-surface-hover px-6 py-3 text-sm font-medium text-theme-text">
				{#if isSelectMode}<div></div>{/if}
				<div>Tag Name</div>
				<div>Links</div>
				<div>Clicks</div>
				<div>Uses</div>
				<div>Status</div>
				<div class="text-right">Actions</div>
			</div>
			<!-- Tablet Table Header -->
			<div class="hidden md:grid lg:hidden {isSelectMode ? 'grid-cols-[40px_1fr_100px_120px_140px]' : 'grid-cols-[1fr_100px_120px_140px]'} items-center gap-4 border-b border-theme-border bg-theme-surface-hover px-4 py-3 text-sm font-medium text-theme-text">
				{#if isSelectMode}<div></div>{/if}
				<div>Tag Name</div>
				<div>Links</div>
				<div>Clicks</div>
				<div class="text-right">Actions</div>
			</div>
			<!-- Table Body -->
			<div>
				{#each tags as tag}
					<TagListItem 
						{tag}
						{isSelectMode}
						isSelected={selectedTags.has(tag.id)}
						onToggleSelect={() => onToggleSelect(tag.id)}
					/>
				{/each}
			</div>
		</div>
	{/if}
{:else}
	<div class="rounded-lg border border-theme-border bg-theme-surface p-8 text-center shadow-md">
		<p class="text-theme-text-muted">
			No tags yet. Create your first tag to organize your links!
		</p>
	</div>
{/if}