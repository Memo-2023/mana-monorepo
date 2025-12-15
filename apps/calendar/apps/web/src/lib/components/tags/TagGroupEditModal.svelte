<script lang="ts">
	import { Modal, Input, TagColorPicker, TagBadge } from '@manacore/shared-ui';
	import type { EventTagGroup } from '@calendar/shared';

	interface Props {
		group?: EventTagGroup | null;
		isOpen: boolean;
		onClose: () => void;
		onSave: (name: string, color: string) => void;
		onDelete?: () => void;
	}

	let { group = null, isOpen, onClose, onSave, onDelete }: Props = $props();

	const DEFAULT_COLOR = '#3B82F6';

	let name = $state(group?.name ?? '');
	let color = $state(group?.color ?? DEFAULT_COLOR);

	// Reset form when group changes
	$effect(() => {
		if (isOpen) {
			name = group?.name ?? '';
			color = group?.color ?? DEFAULT_COLOR;
		}
	});

	function handleSave() {
		if (name.trim()) {
			onSave(name.trim(), color);
		}
	}

	function handleDelete() {
		if (
			onDelete &&
			confirm(
				`Gruppe "${group?.name}" wirklich löschen? Tags in dieser Gruppe werden nicht gelöscht.`
			)
		) {
			onDelete();
		}
	}

	function handleKeyDown(e: KeyboardEvent) {
		if (e.key === 'Enter' && name.trim()) {
			e.preventDefault();
			handleSave();
		}
	}

	const previewTag = $derived({ name: name || 'Gruppenname', color });
	const isEditing = $derived(!!group);
</script>

<Modal
	visible={isOpen}
	{onClose}
	title={isEditing ? 'Gruppe bearbeiten' : 'Neue Gruppe'}
	maxWidth="sm"
>
	<div class="space-y-6">
		<!-- Name Input -->
		<div>
			<Input bind:value={name} placeholder="Gruppenname" onkeydown={handleKeyDown} />
		</div>

		<!-- Color Picker -->
		<div>
			<span class="block text-sm font-medium text-muted-foreground mb-3"> Farbe </span>
			<TagColorPicker selectedColor={color} onColorChange={(c) => (color = c)} />
		</div>

		<!-- Preview -->
		<div>
			<span class="block text-sm font-medium text-muted-foreground mb-3"> Vorschau </span>
			<div class="flex items-center gap-2">
				<TagBadge tag={previewTag} />
			</div>
		</div>

		<!-- Tag Count Info (only when editing) -->
		{#if isEditing && group?.tagCount !== undefined && group.tagCount > 0}
			<div class="text-sm text-muted-foreground">
				{group.tagCount}
				{group.tagCount === 1 ? 'Tag' : 'Tags'} in dieser Gruppe
			</div>
		{/if}
	</div>

	{#snippet footer()}
		<div class="flex items-center justify-between">
			<div>
				{#if onDelete && isEditing}
					<button
						type="button"
						onclick={handleDelete}
						class="px-4 py-2 text-sm font-medium text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
					>
						Löschen
					</button>
				{/if}
			</div>
			<div class="flex items-center gap-3">
				<button
					type="button"
					onclick={onClose}
					class="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-black/5 dark:hover:bg-white/10 rounded-lg transition-colors"
				>
					Abbrechen
				</button>
				<button
					type="button"
					onclick={handleSave}
					disabled={!name.trim()}
					class="px-4 py-2 text-sm font-medium bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
				>
					{isEditing ? 'Speichern' : 'Erstellen'}
				</button>
			</div>
		</div>
	{/snippet}
</Modal>
