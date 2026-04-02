<script lang="ts">
	import { Tag as TagIcon, Plus, X } from '@manacore/shared-icons';
	import { tagsApi } from '$lib/api/client';
	import type { Tag } from '$lib/api/client';
	import { toastStore } from '@manacore/shared-ui';

	interface Props {
		fileId: string;
	}

	let { fileId }: Props = $props();

	let allTags = $state<Tag[]>([]);
	let fileTags = $state<Tag[]>([]);
	let loading = $state(true);
	let showDropdown = $state(false);
	let newTagName = $state('');
	let creating = $state(false);

	let availableTags = $derived(allTags.filter((t) => !fileTags.some((ft) => ft.id === t.id)));

	const TAG_COLORS = [
		{ name: 'blue', value: '#3b82f6' },
		{ name: 'green', value: '#22c55e' },
		{ name: 'yellow', value: '#eab308' },
		{ name: 'red', value: '#ef4444' },
		{ name: 'purple', value: '#a855f7' },
		{ name: 'pink', value: '#ec4899' },
		{ name: 'orange', value: '#f97316' },
		{ name: 'teal', value: '#14b8a6' },
	];

	$effect(() => {
		loadTags();
	});

	async function loadTags() {
		loading = true;
		const [allResult, fileResult] = await Promise.all([
			tagsApi.list(),
			tagsApi.getFileTags(fileId),
		]);
		if (allResult.data) allTags = allResult.data;
		if (fileResult.data) fileTags = fileResult.data;
		loading = false;
	}

	async function addTag(tag: Tag) {
		const result = await tagsApi.addToFile(fileId, tag.id);
		if (!result.error) {
			fileTags = [...fileTags, tag];
		}
		showDropdown = false;
	}

	async function removeTag(tagId: string) {
		const result = await tagsApi.removeFromFile(fileId, tagId);
		if (!result.error) {
			fileTags = fileTags.filter((t) => t.id !== tagId);
		}
	}

	async function createAndAddTag() {
		if (!newTagName.trim()) return;
		creating = true;
		const color = TAG_COLORS[Math.floor(Math.random() * TAG_COLORS.length)].value;
		const result = await tagsApi.create(newTagName.trim(), color);
		if (result.data) {
			allTags = [...allTags, result.data];
			await addTag(result.data);
			newTagName = '';
		} else {
			toastStore.error('Tag konnte nicht erstellt werden');
		}
		creating = false;
	}

	function getTagColor(tag: Tag): string {
		return tag.color || '#6b7280';
	}
</script>

<div class="tag-picker">
	<div class="tag-label">
		<TagIcon size={14} />
		<span>Tags</span>
	</div>

	{#if loading}
		<div class="tags-loading">Laden...</div>
	{:else}
		<div class="tags-list">
			{#each fileTags as tag (tag.id)}
				<span class="tag" style="--tag-color: {getTagColor(tag)}">
					<span class="tag-dot"></span>
					{tag.name}
					<button class="tag-remove" onclick={() => removeTag(tag.id)} aria-label="Tag entfernen">
						<X size={10} />
					</button>
				</span>
			{/each}

			<div class="add-tag-wrapper">
				<button class="add-tag-btn" onclick={() => (showDropdown = !showDropdown)}>
					<Plus size={12} />
					<span>Tag</span>
				</button>

				{#if showDropdown}
					<div class="tag-dropdown">
						{#if availableTags.length > 0}
							<div class="dropdown-section">
								{#each availableTags as tag (tag.id)}
									<button class="dropdown-item" onclick={() => addTag(tag)}>
										<span class="tag-dot-sm" style="background: {getTagColor(tag)}"></span>
										{tag.name}
									</button>
								{/each}
							</div>
						{/if}
						<div class="dropdown-create">
							<input
								type="text"
								placeholder="Neuer Tag..."
								bind:value={newTagName}
								onkeydown={(e) => e.key === 'Enter' && createAndAddTag()}
							/>
							<button
								class="create-btn"
								onclick={createAndAddTag}
								disabled={!newTagName.trim() || creating}
							>
								<Plus size={14} />
							</button>
						</div>
					</div>
				{/if}
			</div>
		</div>
	{/if}
</div>

<style>
	.tag-picker {
		margin-top: 0.5rem;
	}

	.tag-label {
		display: flex;
		align-items: center;
		gap: 0.375rem;
		font-size: 0.8125rem;
		font-weight: 500;
		color: rgb(var(--color-text-secondary));
		margin-bottom: 0.375rem;
	}

	.tags-loading {
		font-size: 0.75rem;
		color: rgb(var(--color-text-secondary));
	}

	.tags-list {
		display: flex;
		flex-wrap: wrap;
		gap: 0.375rem;
		align-items: center;
	}

	.tag {
		display: inline-flex;
		align-items: center;
		gap: 0.25rem;
		padding: 0.125rem 0.5rem;
		background: rgb(var(--color-surface));
		border: 1px solid rgb(var(--color-border));
		border-radius: 9999px;
		font-size: 0.75rem;
		color: rgb(var(--color-text-primary));
	}

	.tag-dot {
		width: 6px;
		height: 6px;
		border-radius: 50%;
		background: var(--tag-color);
		flex-shrink: 0;
	}

	.tag-remove {
		display: flex;
		align-items: center;
		padding: 0;
		background: transparent;
		border: none;
		color: rgb(var(--color-text-secondary));
		cursor: pointer;
		margin-left: 0.125rem;
	}

	.tag-remove:hover {
		color: rgb(var(--color-error));
	}

	.add-tag-wrapper {
		position: relative;
	}

	.add-tag-btn {
		display: inline-flex;
		align-items: center;
		gap: 0.25rem;
		padding: 0.125rem 0.5rem;
		background: transparent;
		border: 1px dashed rgb(var(--color-border));
		border-radius: 9999px;
		font-size: 0.75rem;
		color: rgb(var(--color-text-secondary));
		cursor: pointer;
		transition: all 150ms ease;
	}

	.add-tag-btn:hover {
		border-color: rgb(var(--color-primary));
		color: rgb(var(--color-primary));
	}

	.tag-dropdown {
		position: absolute;
		top: 100%;
		left: 0;
		margin-top: 0.375rem;
		background: rgb(var(--color-surface-elevated));
		border: 1px solid rgb(var(--color-border));
		border-radius: var(--radius-md);
		box-shadow: var(--shadow-lg);
		min-width: 180px;
		z-index: 10;
		overflow: hidden;
	}

	.dropdown-section {
		max-height: 150px;
		overflow-y: auto;
		padding: 0.25rem;
	}

	.dropdown-item {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		width: 100%;
		padding: 0.375rem 0.625rem;
		background: transparent;
		border: none;
		border-radius: var(--radius-sm);
		font-size: 0.8125rem;
		color: rgb(var(--color-text-primary));
		cursor: pointer;
		text-align: left;
	}

	.dropdown-item:hover {
		background: rgb(var(--color-surface));
	}

	.tag-dot-sm {
		width: 8px;
		height: 8px;
		border-radius: 50%;
		flex-shrink: 0;
	}

	.dropdown-create {
		display: flex;
		gap: 0.25rem;
		padding: 0.375rem;
		border-top: 1px solid rgb(var(--color-border));
	}

	.dropdown-create input {
		flex: 1;
		padding: 0.25rem 0.5rem;
		background: rgb(var(--color-surface));
		border: 1px solid rgb(var(--color-border));
		border-radius: var(--radius-sm);
		font-size: 0.75rem;
		color: rgb(var(--color-text-primary));
	}

	.dropdown-create input:focus {
		outline: none;
		border-color: rgb(var(--color-primary));
	}

	.create-btn {
		display: flex;
		align-items: center;
		padding: 0.25rem;
		background: rgb(var(--color-primary));
		border: none;
		border-radius: var(--radius-sm);
		color: white;
		cursor: pointer;
	}

	.create-btn:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}
</style>
