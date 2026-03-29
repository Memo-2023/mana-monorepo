<script lang="ts">
	import type { Tag } from '$lib/pocketbase';
	import { enhance } from '$app/forms';
	import TagBadge from './TagBadge.svelte';
	import { DEFAULT_TAG_COLORS } from '$lib/pocketbase';
	import { MousePointer } from 'lucide-svelte';

	interface Props {
		tag: Tag & { linkCount?: number; totalClicks?: number };
		isSelectMode?: boolean;
		isSelected?: boolean;
		onToggleSelect?: () => void;
	}

	let {
		tag,
		isSelectMode = false,
		isSelected = false,
		onToggleSelect = () => {},
	}: Props = $props();
	let editingTag = $state(false);

	function startEdit() {
		editingTag = true;
	}

	function cancelEdit() {
		editingTag = false;
	}
</script>

<!-- Desktop View -->
<div
	class="hidden lg:grid {isSelectMode
		? 'grid-cols-[40px_minmax(200px,1fr)_100px_120px_100px_80px_140px]'
		: 'grid-cols-[minmax(200px,1fr)_100px_120px_100px_80px_140px]'} items-center gap-4 border-b border-theme-border {isSelected
		? 'bg-theme-primary/5'
		: 'bg-theme-surface'} px-6 py-4 transition-colors hover:bg-theme-surface-hover"
>
	{#if isSelectMode}
		<div>
			<input
				type="checkbox"
				checked={isSelected}
				onchange={onToggleSelect}
				class="h-4 w-4 cursor-pointer rounded border-theme-border text-theme-primary focus:ring-theme-primary"
			/>
		</div>
	{/if}
	{#if editingTag}
		<form
			method="POST"
			action="?/update"
			class="col-span-6 flex w-full items-center gap-4"
			use:enhance={() => {
				return async ({ update }) => {
					await update();
					cancelEdit();
				};
			}}
		>
			<input type="hidden" name="id" value={tag.id} />
			<div class="flex flex-1 items-center gap-4">
				<input
					type="text"
					name="name"
					value={tag.name}
					required
					class="flex-1 rounded border border-theme-border bg-theme-surface px-3 py-2 text-sm text-theme-text focus:outline-none focus:ring-1 focus:ring-theme-accent"
				/>
				<select
					name="color"
					class="rounded border border-theme-border bg-theme-surface px-3 py-2 text-sm text-theme-text"
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
						class="h-4 w-4 rounded border-theme-border"
					/>
					Public
				</label>
			</div>
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
		</form>
	{:else}
		<!-- Tag Name Column -->
		<div class="flex items-center">
			<TagBadge {tag} size="md" />
		</div>

		<!-- Links Column -->
		<div class="group/stat relative text-sm text-theme-text-muted">
			<span>{tag.linkCount || 0} links</span>
			<div
				class="invisible absolute bottom-full left-0 z-10 mb-1 whitespace-nowrap rounded-lg bg-gray-900 px-2 py-1 text-xs text-white opacity-0 shadow-lg transition-all group-hover/stat:visible group-hover/stat:opacity-100"
			>
				Used in {tag.linkCount || 0} links
			</div>
		</div>

		<!-- Clicks Column -->
		<div class="group/stat relative flex items-center gap-1 text-sm text-theme-text-muted">
			<MousePointer class="h-3 w-3" />
			<span>{tag.totalClicks || 0} clicks</span>
			<div
				class="invisible absolute bottom-full left-0 z-10 mb-1 whitespace-nowrap rounded-lg bg-gray-900 px-2 py-1 text-xs text-white opacity-0 shadow-lg transition-all group-hover/stat:visible group-hover/stat:opacity-100"
			>
				Total clicks from all links: {tag.totalClicks || 0}
			</div>
		</div>

		<!-- Uses Column -->
		<div class="group/stat relative text-sm text-theme-text-muted">
			<span>{tag.usage_count || 0} uses</span>
			<div
				class="invisible absolute bottom-full left-0 z-10 mb-1 whitespace-nowrap rounded-lg bg-gray-900 px-2 py-1 text-xs text-white opacity-0 shadow-lg transition-all group-hover/stat:visible group-hover/stat:opacity-100"
			>
				Internal usage counter
			</div>
		</div>

		<!-- Status Column -->
		<div class="text-sm">
			{#if tag.is_public}
				<span class="text-green-600 dark:text-green-400">Public</span>
			{:else}
				<span class="text-theme-text-muted">Private</span>
			{/if}
		</div>

		<!-- Actions Column -->
		<div class="flex justify-end gap-2">
			<button
				onclick={startEdit}
				class="bg-theme-primary/10 hover:bg-theme-primary/20 rounded px-3 py-1 text-sm font-medium text-theme-primary transition"
			>
				Edit
			</button>
			<form
				method="POST"
				action="?/delete"
				use:enhance={() => {
					return async ({ update }) => {
						if (confirm(`Are you sure you want to delete the tag "${tag.name}"?`)) {
							await update();
						}
					};
				}}
			>
				<input type="hidden" name="id" value={tag.id} />
				<button
					type="submit"
					class="rounded bg-red-100 px-3 py-1 text-sm font-medium text-red-600 transition hover:bg-red-200 dark:bg-red-900/20 dark:text-red-400"
				>
					Delete
				</button>
			</form>
		</div>
	{/if}
</div>

<!-- Tablet View -->
<div
	class="hidden md:grid lg:hidden {isSelectMode
		? 'grid-cols-[40px_1fr_100px_120px_140px]'
		: 'grid-cols-[1fr_100px_120px_140px]'} items-center gap-4 border-b border-theme-border {isSelected
		? 'bg-theme-primary/5'
		: 'bg-theme-surface'} px-4 py-4 transition-colors hover:bg-theme-surface-hover"
>
	{#if isSelectMode}
		<div>
			<input
				type="checkbox"
				checked={isSelected}
				onchange={onToggleSelect}
				class="h-4 w-4 cursor-pointer rounded border-theme-border text-theme-primary focus:ring-theme-primary"
			/>
		</div>
	{/if}
	{#if editingTag}
		<form
			method="POST"
			action="?/update"
			class="col-span-4 flex w-full items-center gap-4"
			use:enhance={() => {
				return async ({ update }) => {
					await update();
					cancelEdit();
				};
			}}
		>
			<input type="hidden" name="id" value={tag.id} />
			<div class="flex flex-1 items-center gap-4">
				<input
					type="text"
					name="name"
					value={tag.name}
					required
					class="flex-1 rounded border border-theme-border bg-theme-surface px-3 py-2 text-sm text-theme-text focus:outline-none focus:ring-1 focus:ring-theme-accent"
				/>
				<select
					name="color"
					class="rounded border border-theme-border bg-theme-surface px-3 py-2 text-sm text-theme-text"
				>
					{#each DEFAULT_TAG_COLORS as color}
						<option value={color} selected={color === tag.color}>{color}</option>
					{/each}
				</select>
			</div>
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
		</form>
	{:else}
		<div class="flex items-center">
			<TagBadge {tag} size="md" />
		</div>
		<div class="text-sm text-theme-text-muted">
			{tag.linkCount || 0} links
		</div>
		<div class="flex items-center gap-1 text-sm text-theme-text-muted">
			<MousePointer class="h-3 w-3" />
			<span>{tag.totalClicks || 0}</span>
		</div>
		<div class="flex justify-end gap-2">
			<button
				onclick={startEdit}
				class="bg-theme-primary/10 hover:bg-theme-primary/20 rounded px-3 py-1 text-sm font-medium text-theme-primary transition"
			>
				Edit
			</button>
			<form
				method="POST"
				action="?/delete"
				use:enhance={() => {
					return async ({ update }) => {
						if (confirm(`Are you sure you want to delete the tag "${tag.name}"?`)) {
							await update();
						}
					};
				}}
			>
				<input type="hidden" name="id" value={tag.id} />
				<button
					type="submit"
					class="rounded bg-red-100 px-3 py-1 text-sm font-medium text-red-600 transition hover:bg-red-200 dark:bg-red-900/20 dark:text-red-400"
				>
					Delete
				</button>
			</form>
		</div>
	{/if}
</div>

<!-- Mobile View -->
<div
	class="border-b border-theme-border md:hidden {isSelected
		? 'bg-theme-primary/5'
		: 'bg-theme-surface'} p-4 transition-colors hover:bg-theme-surface-hover"
>
	{#if editingTag}
		<form
			method="POST"
			action="?/update"
			class="space-y-3"
			use:enhance={() => {
				return async ({ update }) => {
					await update();
					cancelEdit();
				};
			}}
		>
			<input type="hidden" name="id" value={tag.id} />
			<input
				type="text"
				name="name"
				value={tag.name}
				required
				class="w-full rounded border border-theme-border bg-theme-surface px-3 py-2 text-sm text-theme-text focus:outline-none focus:ring-1 focus:ring-theme-accent"
			/>
			<select
				name="color"
				class="w-full rounded border border-theme-border bg-theme-surface px-3 py-2 text-sm text-theme-text"
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
					class="h-4 w-4 rounded border-theme-border"
				/>
				Public
			</label>
			<div class="flex gap-2">
				<button
					type="submit"
					class="flex-1 rounded bg-green-600 px-3 py-2 text-sm font-medium text-white hover:bg-green-700"
				>
					Save
				</button>
				<button
					type="button"
					onclick={cancelEdit}
					class="flex-1 rounded bg-theme-surface-hover px-3 py-2 text-sm font-medium text-theme-text hover:bg-theme-border"
				>
					Cancel
				</button>
			</div>
		</form>
	{:else}
		<div class="space-y-3">
			{#if isSelectMode}
				<div class="mb-2 flex items-center justify-between">
					<label class="flex cursor-pointer items-center gap-2">
						<input
							type="checkbox"
							checked={isSelected}
							onchange={onToggleSelect}
							class="h-4 w-4 rounded border-theme-border text-theme-primary focus:ring-theme-primary"
						/>
						<span class="text-sm text-theme-text">Select</span>
					</label>
				</div>
			{/if}
			<div class="flex items-center justify-between">
				<TagBadge {tag} size="md" />
				{#if tag.is_public}
					<span class="text-xs font-medium text-green-600 dark:text-green-400">Public</span>
				{:else}
					<span class="text-xs text-theme-text-muted">Private</span>
				{/if}
			</div>

			<div class="flex items-center justify-between text-sm text-theme-text-muted">
				<div class="flex items-center gap-4">
					<span>{tag.linkCount || 0} links</span>
					<span class="flex items-center gap-1">
						<MousePointer class="h-3 w-3" />
						{tag.totalClicks || 0} clicks
					</span>
					<span>{tag.usage_count || 0} uses</span>
				</div>
			</div>

			{#if !isSelectMode}
				<div class="flex gap-2">
					<button
						onclick={startEdit}
						class="bg-theme-primary/10 hover:bg-theme-primary/20 flex-1 rounded px-3 py-2 text-sm font-medium text-theme-primary transition"
					>
						Edit
					</button>
					<form
						method="POST"
						action="?/delete"
						class="flex-1"
						use:enhance={() => {
							return async ({ update }) => {
								if (confirm(`Are you sure you want to delete the tag "${tag.name}"?`)) {
									await update();
								}
							};
						}}
					>
						<input type="hidden" name="id" value={tag.id} />
						<button
							type="submit"
							class="w-full rounded bg-red-100 px-3 py-2 text-sm font-medium text-red-600 transition hover:bg-red-200 dark:bg-red-900/20 dark:text-red-400"
						>
							Delete
						</button>
					</form>
				</div>
			{/if}
		</div>
	{/if}
</div>
