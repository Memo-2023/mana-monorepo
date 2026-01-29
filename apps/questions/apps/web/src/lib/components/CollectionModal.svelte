<script lang="ts">
	import { X } from 'lucide-svelte';
	import { collectionsStore } from '$lib/stores';
	import type { Collection, CreateCollectionDto, UpdateCollectionDto } from '$lib/types';

	interface Props {
		collection?: Collection | null;
		onClose: () => void;
		onSave: (collection: Collection) => void;
	}

	let { collection = null, onClose, onSave }: Props = $props();

	let name = $state(collection?.name || '');
	let description = $state(collection?.description || '');
	let color = $state(collection?.color || '#6366f1');
	let icon = $state(collection?.icon || 'folder');
	let isDefault = $state(collection?.isDefault || false);
	let loading = $state(false);
	let error = $state<string | null>(null);

	const colors = [
		'#6366f1', // Indigo
		'#8b5cf6', // Violet
		'#ec4899', // Pink
		'#ef4444', // Red
		'#f97316', // Orange
		'#eab308', // Yellow
		'#22c55e', // Green
		'#14b8a6', // Teal
		'#3b82f6', // Blue
		'#6b7280', // Gray
	];

	const icons = [
		'folder',
		'star',
		'heart',
		'bookmark',
		'lightbulb',
		'rocket',
		'code',
		'book',
		'briefcase',
		'globe',
	];

	async function handleSubmit(e: Event) {
		e.preventDefault();

		if (!name.trim()) {
			error = 'Name is required';
			return;
		}

		loading = true;
		error = null;

		try {
			let saved: Collection | null;

			if (collection) {
				const data: UpdateCollectionDto = {
					name: name.trim(),
					description: description.trim() || undefined,
					color,
					icon,
					isDefault,
				};
				saved = await collectionsStore.update(collection.id, data);
			} else {
				const data: CreateCollectionDto = {
					name: name.trim(),
					description: description.trim() || undefined,
					color,
					icon,
					isDefault,
				};
				saved = await collectionsStore.create(data);
			}

			if (saved) {
				onSave(saved);
			} else {
				error = collectionsStore.error || 'Failed to save collection';
			}
		} catch (e) {
			error = e instanceof Error ? e.message : 'Failed to save collection';
		} finally {
			loading = false;
		}
	}

	function handleBackdropClick(e: MouseEvent) {
		if (e.target === e.currentTarget) {
			onClose();
		}
	}
</script>

<!-- svelte-ignore a11y_click_events_have_key_events a11y_no_static_element_interactions -->
<div
	class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
	onclick={handleBackdropClick}
>
	<div class="w-full max-w-md rounded-xl bg-card shadow-xl" onclick={(e) => e.stopPropagation()}>
		<!-- Header -->
		<div class="flex items-center justify-between border-b border-border px-6 py-4">
			<h2 class="text-lg font-semibold text-foreground">
				{collection ? 'Edit Collection' : 'New Collection'}
			</h2>
			<button onclick={onClose} class="rounded-lg p-2 text-muted-foreground hover:bg-secondary">
				<X class="h-5 w-5" />
			</button>
		</div>

		<!-- Form -->
		<form onsubmit={handleSubmit} class="p-6">
			{#if error}
				<div class="mb-4 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
					{error}
				</div>
			{/if}

			<!-- Name -->
			<div class="mb-4">
				<label for="name" class="mb-1 block text-sm font-medium text-foreground">Name</label>
				<input
					type="text"
					id="name"
					bind:value={name}
					placeholder="Collection name"
					class="w-full rounded-lg border border-border bg-background px-4 py-2 text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
				/>
			</div>

			<!-- Description -->
			<div class="mb-4">
				<label for="description" class="mb-1 block text-sm font-medium text-foreground"
					>Description</label
				>
				<textarea
					id="description"
					bind:value={description}
					placeholder="Optional description"
					rows="2"
					class="w-full rounded-lg border border-border bg-background px-4 py-2 text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
				></textarea>
			</div>

			<!-- Color -->
			<div class="mb-4">
				<label class="mb-2 block text-sm font-medium text-foreground">Color</label>
				<div class="flex flex-wrap gap-2">
					{#each colors as c}
						<button
							type="button"
							onclick={() => (color = c)}
							class="h-8 w-8 rounded-full border-2 transition-transform hover:scale-110 {color === c
								? 'border-foreground scale-110'
								: 'border-transparent'}"
							style="background-color: {c}"
						></button>
					{/each}
				</div>
			</div>

			<!-- Icon -->
			<div class="mb-4">
				<label class="mb-2 block text-sm font-medium text-foreground">Icon</label>
				<div class="flex flex-wrap gap-2">
					{#each icons as i}
						<button
							type="button"
							onclick={() => (icon = i)}
							class="flex h-10 w-10 items-center justify-center rounded-lg border-2 text-sm transition-all {icon ===
							i
								? 'border-primary bg-primary/10'
								: 'border-border hover:border-primary/50'}"
						>
							{i.charAt(0).toUpperCase()}
						</button>
					{/each}
				</div>
			</div>

			<!-- Default -->
			<div class="mb-6">
				<label class="flex items-center gap-3">
					<input
						type="checkbox"
						bind:checked={isDefault}
						class="h-5 w-5 rounded border-border text-primary focus:ring-primary"
					/>
					<span class="text-foreground">Set as default collection</span>
				</label>
			</div>

			<!-- Actions -->
			<div class="flex gap-3">
				<button
					type="button"
					onclick={onClose}
					class="flex-1 rounded-lg border border-border px-4 py-2 font-medium text-foreground hover:bg-secondary"
				>
					Cancel
				</button>
				<button
					type="submit"
					disabled={loading}
					class="flex-1 rounded-lg bg-primary px-4 py-2 font-medium text-primary-foreground hover:bg-primary-hover disabled:opacity-50"
				>
					{loading ? 'Saving...' : collection ? 'Update' : 'Create'}
				</button>
			</div>
		</form>
	</div>
</div>
