<script lang="ts">
	import { Modal, Input, Button } from '@manacore/shared-ui';
	import { deckStore } from '$lib/stores/deckStore.svelte';

	interface Props {
		open?: boolean;
		onClose?: () => void;
	}

	let { open = $bindable(false), onClose }: Props = $props();

	let title = $state('');
	let description = $state('');
	let isPublic = $state(false);
	let tags = $state('');
	let submitting = $state(false);

	async function handleSubmit() {
		if (!title.trim()) return;

		submitting = true;

		const tagArray = tags
			.split(',')
			.map((t) => t.trim())
			.filter((t) => t.length > 0);

		const deck = await deckStore.createDeck({
			title: title.trim(),
			description: description.trim() || undefined,
			is_public: isPublic,
			tags: tagArray.length > 0 ? tagArray : undefined
		});

		submitting = false;

		if (deck) {
			// Reset form
			title = '';
			description = '';
			isPublic = false;
			tags = '';

			// Close modal
			open = false;
			onClose?.();
		}
	}
</script>

<Modal bind:open title="Create New Deck" {onClose}>
	<form onsubmit={(e) => { e.preventDefault(); handleSubmit(); }} class="space-y-4">
		<Input
			label="Deck Title"
			bind:value={title}
			placeholder="e.g., Spanish Vocabulary"
			required
		/>

		<div class="space-y-2">
			<label class="text-sm font-medium">Description</label>
			<textarea
				bind:value={description}
				placeholder="What is this deck about?"
				class="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
			></textarea>
		</div>

		<Input
			label="Tags (comma-separated)"
			bind:value={tags}
			placeholder="e.g., language, beginner, vocabulary"
		/>

		<div class="flex items-center space-x-2">
			<input
				type="checkbox"
				id="isPublic"
				bind:checked={isPublic}
				class="h-4 w-4 rounded border-input"
			/>
			<label for="isPublic" class="text-sm font-medium cursor-pointer">
				Make this deck public
			</label>
		</div>

		{#if deckStore.error}
			<div class="p-3 rounded-md bg-destructive/10 text-destructive text-sm">
				{deckStore.error}
			</div>
		{/if}

		<div class="flex justify-end space-x-3">
			<Button type="button" variant="ghost" onclick={() => { open = false; onClose?.(); }}>
				Cancel
			</Button>
			<Button type="submit" loading={submitting}>
				Create Deck
			</Button>
		</div>
	</form>
</Modal>
