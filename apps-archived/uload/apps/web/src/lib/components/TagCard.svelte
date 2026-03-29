<script lang="ts">
	import type { Tag } from '$lib/pocketbase';
	import { enhance } from '$app/forms';
	import TagBadge from './TagBadge.svelte';
	import Dropdown from './Dropdown.svelte';
	import { DEFAULT_TAG_COLORS } from '$lib/pocketbase';
	import { MousePointer, Link, Hash } from 'lucide-svelte';

	interface Props {
		tag: Tag & { linkCount?: number; totalClicks?: number };
	}

	let { tag }: Props = $props();
	let editingTag = $state(false);

	function startEdit() {
		editingTag = true;
	}

	function cancelEdit() {
		editingTag = false;
	}
</script>

<div
	class="group relative z-0 rounded-xl border border-theme-border bg-theme-surface p-6 shadow-lg transition-colors hover:bg-theme-surface-hover"
>
	{#if editingTag}
		<form
			method="POST"
			action="?/update"
			use:enhance={() => {
				return async ({ update }) => {
					await update();
					cancelEdit();
				};
			}}
		>
			<input type="hidden" name="id" value={tag.id} />
			<div class="space-y-3">
				<input
					type="text"
					name="name"
					value={tag.name}
					required
					class="w-full rounded border border-theme-border bg-theme-surface px-2 py-1 text-sm text-theme-text focus:outline-none focus:ring-1 focus:ring-theme-accent"
				/>
				<select
					name="color"
					class="rounded border border-theme-border bg-theme-surface px-2 py-1 text-sm text-theme-text"
				>
					{#each DEFAULT_TAG_COLORS as color}
						<option value={color} selected={color === tag.color}>{color}</option>
					{/each}
				</select>
				<label class="flex items-center gap-2 text-sm">
					<input
						type="checkbox"
						name="is_public"
						checked={tag.is_public}
						class="h-3 w-3 rounded border-theme-border"
					/>
					Public
				</label>
				<div class="flex gap-2">
					<button
						type="submit"
						class="rounded bg-green-600 px-3 py-1 text-sm font-medium text-white hover:bg-green-700"
					>
						Save
					</button>
					<button
						type="button"
						onclick={cancelEdit}
						class="rounded bg-theme-surface-hover px-3 py-1 text-sm font-medium text-theme-text hover:bg-theme-border"
					>
						Cancel
					</button>
				</div>
			</div>
		</form>
	{:else}
		<div class="flex items-start justify-between">
			<div class="flex-1">
				<div class="mb-4">
					<TagBadge {tag} size="lg" />
				</div>
				<div class="flex flex-wrap items-center gap-3 text-sm text-theme-text-muted">
					<div class="group/stat relative flex items-center gap-1.5">
						<Link class="h-3.5 w-3.5" />
						<span>{tag.linkCount || 0} links</span>
						<div
							class="invisible absolute bottom-full left-0 z-10 mb-1 whitespace-nowrap rounded-lg bg-gray-900 px-2 py-1 text-xs text-white opacity-0 shadow-lg transition-all group-hover/stat:visible group-hover/stat:opacity-100"
						>
							Used in {tag.linkCount || 0} links
						</div>
					</div>
					<span class="text-theme-border">•</span>
					<div class="group/stat relative flex items-center gap-1.5">
						<MousePointer class="h-3.5 w-3.5" />
						<span>{tag.totalClicks || 0} clicks</span>
						<div
							class="invisible absolute bottom-full left-0 z-10 mb-1 whitespace-nowrap rounded-lg bg-gray-900 px-2 py-1 text-xs text-white opacity-0 shadow-lg transition-all group-hover/stat:visible group-hover/stat:opacity-100"
						>
							Total clicks: {tag.totalClicks || 0}
						</div>
					</div>
					<span class="text-theme-border">•</span>
					<div class="group/stat relative flex items-center gap-1.5">
						<Hash class="h-3.5 w-3.5" />
						<span>{tag.usage_count || 0} uses</span>
						<div
							class="invisible absolute bottom-full left-0 z-10 mb-1 whitespace-nowrap rounded-lg bg-gray-900 px-2 py-1 text-xs text-white opacity-0 shadow-lg transition-all group-hover/stat:visible group-hover/stat:opacity-100"
						>
							Usage count: {tag.usage_count || 0}
						</div>
					</div>
					{#if tag.is_public}
						<span class="text-theme-border">•</span>
						<span class="font-medium text-green-600 dark:text-green-400">Public</span>
					{:else}
						<span class="text-theme-border">•</span>
						<span class="font-medium">Private</span>
					{/if}
				</div>
			</div>
			<Dropdown
				items={[
					{
						label: 'Edit',
						icon: '<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>',
						color: '#9333ea',
						action: startEdit,
					},
					{
						label: 'View Links',
						icon: '<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" /></svg>',
						color: '#2563eb',
						href: `/my/links?tag=${tag.name}`,
					},
					{
						label: tag.is_public ? 'Make Private' : 'Make Public',
						icon: tag.is_public
							? '<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>'
							: '<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>',
						color: '#ea580c',
						type: 'form',
						formAction: '?/togglePublic',
						formData: { id: tag.id, is_public: String(!tag.is_public) },
					},
					{
						divider: true,
					},
					{
						label: 'Delete',
						icon: '<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>',
						color: '#dc2626',
						type: 'form',
						formAction: '?/delete',
						formData: { id: tag.id },
						enhanceOptions: () => {
							return async ({ update }) => {
								if (confirm(`Are you sure you want to delete the tag "${tag.name}"?`)) {
									await update();
								}
							};
						},
					},
				]}
				buttonText="Actions"
				size="sm"
			/>
		</div>
	{/if}
</div>
