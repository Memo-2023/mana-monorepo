<script lang="ts">
	import type { Tag } from '$lib/types/memo.types';
	import { Modal, Text } from '@manacore/shared-ui';
	import Icon from '$lib/components/Icon.svelte';

	interface Props {
		tag: Tag;
		isOpen: boolean;
		onClose: () => void;
		onSave: (tagId: string, name: string, color: string) => void;
		onDelete: (tagId: string) => void;
	}

	let { tag, isOpen, onClose, onSave, onDelete }: Props = $props();

	let editedName = $state(tag.name || tag.text || '');
	let editedColor = $state(tag.style?.color || tag.color || '#3b82f6');

	// Update local state when tag changes
	$effect(() => {
		editedName = tag.name || tag.text || '';
		editedColor = tag.style?.color || tag.color || '#3b82f6';
	});

	function handleSave() {
		if (editedName.trim()) {
			onSave(tag.id, editedName.trim(), editedColor);
			onClose();
		}
	}

	function handleDelete() {
		if (confirm(`Tag "${tag.name || tag.text}" wirklich löschen?`)) {
			onDelete(tag.id);
			onClose();
		}
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Escape') {
			onClose();
		} else if (e.key === 'Enter' && !e.shiftKey) {
			e.preventDefault();
			handleSave();
		}
	}

	// Predefined color palette
	const colorPalette = [
		'#3b82f6', // blue
		'#10b981', // green
		'#f59e0b', // amber
		'#ef4444', // red
		'#8b5cf6', // violet
		'#ec4899', // pink
		'#06b6d4', // cyan
		'#f97316', // orange
		'#14b8a6', // teal
		'#6366f1', // indigo
	];
</script>

<Modal visible={isOpen} {onClose} title="Tag bearbeiten" maxWidth="md">
	{#snippet children()}
		<!-- Tag Name -->
		<div class="mb-6">
			<label for="tag-name" class="mb-2 block text-sm font-medium text-theme"> Tag-Name </label>
			<input
				id="tag-name"
				type="text"
				bind:value={editedName}
				onkeydown={handleKeydown}
				class="w-full rounded-lg border border-theme bg-menu px-4 py-2 text-theme focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
				placeholder="Tag-Name eingeben..."
			/>
		</div>

		<!-- Color Picker -->
		<div class="mb-6">
			<Text variant="small" weight="medium" class="mb-2 block">Farbe</Text>
			<div class="flex flex-wrap gap-3">
				{#each colorPalette as color}
					<button
						type="button"
						onclick={() => (editedColor = color)}
						class="h-10 w-10 rounded-full border-2 transition-all hover:scale-110"
						class:border-theme={editedColor !== color}
						class:border-black={editedColor === color}
						class:ring-2={editedColor === color}
						class:ring-primary={editedColor === color}
						style="background-color: {color}"
						aria-label="Select color {color}"
					></button>
				{/each}
			</div>
		</div>

		<!-- Preview -->
		<div class="mb-6">
			<Text variant="small" weight="medium" class="mb-2 block">Vorschau</Text>
			<div class="flex items-center justify-center rounded-lg bg-menu p-4">
				<div
					class="inline-flex items-center gap-2 rounded-full border-2 px-5 py-3 text-base font-medium"
					style="background-color: {editedColor}20; color: {editedColor}; border-color: {editedColor}40"
				>
					<div class="h-4 w-4 rounded-full" style="background-color: {editedColor}"></div>
					{editedName || 'Tag-Name'}
				</div>
			</div>
		</div>

		<!-- Usage Info -->
		{#if tag.usage !== undefined}
			<div class="mb-6 rounded-lg bg-menu p-3">
				<Text variant="small" class="text-theme-secondary">
					Verwendet in <span class="font-semibold text-theme">{tag.usage}</span>
					{tag.usage === 1 ? 'Memo' : 'Memos'}
				</Text>
			</div>
		{/if}
	{/snippet}

	{#snippet footer()}
		<div class="flex gap-3">
			<button
				onclick={handleDelete}
				class="btn-danger flex h-12 flex-1 items-center justify-center gap-2"
			>
				<Icon name="trash" size={20} />
				Löschen
			</button>
			<button
				onclick={onClose}
				class="btn-secondary flex h-12 flex-1 items-center justify-center gap-2"
			>
				Abbrechen
			</button>
			<button
				onclick={handleSave}
				disabled={!editedName.trim()}
				class="btn-primary flex h-12 flex-1 items-center justify-center gap-2 disabled:cursor-not-allowed disabled:opacity-50"
			>
				Speichern
			</button>
		</div>
	{/snippet}
</Modal>
