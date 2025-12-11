<script lang="ts">
	import { Modal } from '../../organisms';
	import { Input } from '../../molecules';
	import TagBadge from './TagBadge.svelte';
	import TagColorPicker from './TagColorPicker.svelte';
	import { DEFAULT_TAG_COLOR } from './constants';
	import type { Tag } from './constants';

	interface Props {
		tag?: Tag | null;
		isOpen: boolean;
		onClose: () => void;
		onSave: (name: string, color: string) => void;
		onDelete?: () => void;
		usageCount?: number;
		title?: string;
		saveLabel?: string;
		deleteLabel?: string;
		cancelLabel?: string;
		namePlaceholder?: string;
		colorLabel?: string;
		previewLabel?: string;
		usageLabel?: string;
		deleteConfirmMessage?: string;
	}

	let {
		tag = null,
		isOpen,
		onClose,
		onSave,
		onDelete,
		usageCount,
		title = 'Tag bearbeiten',
		saveLabel = 'Speichern',
		deleteLabel = 'Löschen',
		cancelLabel = 'Abbrechen',
		namePlaceholder = 'Tag Name',
		colorLabel = 'Farbe',
		previewLabel = 'Vorschau',
		usageLabel = 'Verwendung',
		deleteConfirmMessage = 'Möchtest du diesen Tag wirklich löschen?',
	}: Props = $props();

	let name = $state(tag?.name ?? '');
	let color = $state(tag?.color ?? tag?.style?.color ?? DEFAULT_TAG_COLOR);

	// Reset form when tag changes
	$effect(() => {
		if (isOpen) {
			name = tag?.name ?? '';
			color = tag?.color ?? tag?.style?.color ?? DEFAULT_TAG_COLOR;
		}
	});

	function handleSave() {
		if (name.trim()) {
			onSave(name.trim(), color);
		}
	}

	function handleDelete() {
		if (onDelete && confirm(deleteConfirmMessage)) {
			onDelete();
		}
	}

	function handleKeyDown(e: KeyboardEvent) {
		if (e.key === 'Enter' && name.trim()) {
			e.preventDefault();
			handleSave();
		}
	}

	const previewTag = $derived({ name: name || namePlaceholder, color });
</script>

<Modal visible={isOpen} {onClose} {title} maxWidth="sm">
	<div class="space-y-6">
		<!-- Name Input -->
		<div>
			<Input bind:value={name} placeholder={namePlaceholder} onkeydown={handleKeyDown} />
		</div>

		<!-- Color Picker -->
		<div>
			<span class="block text-sm font-medium text-muted-foreground mb-3">
				{colorLabel}
			</span>
			<TagColorPicker selectedColor={color} onColorChange={(c) => (color = c)} />
		</div>

		<!-- Preview -->
		<div>
			<span class="block text-sm font-medium text-muted-foreground mb-3">
				{previewLabel}
			</span>
			<div class="flex items-center gap-2">
				<TagBadge tag={previewTag} />
			</div>
		</div>

		<!-- Usage Count (optional) -->
		{#if usageCount !== undefined && usageCount > 0}
			<div class="text-sm text-muted-foreground">
				{usageLabel}: {usageCount}
			</div>
		{/if}
	</div>

	{#snippet footer()}
		<div class="flex items-center justify-between">
			<div>
				{#if onDelete && tag}
					<button
						type="button"
						onclick={handleDelete}
						class="px-4 py-2 text-sm font-medium text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
					>
						{deleteLabel}
					</button>
				{/if}
			</div>
			<div class="flex items-center gap-3">
				<button
					type="button"
					onclick={onClose}
					class="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-black/5 dark:hover:bg-white/10 rounded-lg transition-colors"
				>
					{cancelLabel}
				</button>
				<button
					type="button"
					onclick={handleSave}
					disabled={!name.trim()}
					class="px-4 py-2 text-sm font-medium bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
				>
					{saveLabel}
				</button>
			</div>
		</div>
	{/snippet}
</Modal>
