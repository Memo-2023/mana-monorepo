<script lang="ts">
	import { Modal, Text } from '@manacore/shared-ui';

	interface Props {
		visible: boolean;
		memoTitle: string | null;
		onClose: () => void;
		onConfirm: () => void;
		isDeleting?: boolean;
	}

	let { visible, memoTitle, onClose, onConfirm, isDeleting = false }: Props = $props();
</script>

<Modal {visible} {onClose} title="Delete Memo" maxWidth="md">
	{#snippet children()}
		<div class="space-y-4">
			<!-- Warning Icon -->
			<div class="flex justify-center">
				<div class="rounded-full bg-red-100 p-3 dark:bg-red-900/20">
					<svg
						class="h-12 w-12 text-red-600 dark:text-red-500"
						fill="none"
						stroke="currentColor"
						viewBox="0 0 24 24"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
						/>
					</svg>
				</div>
			</div>

			<!-- Message -->
			<div class="text-center">
				<Text variant="large" weight="semibold" class="mb-2">
					Are you sure you want to delete this memo?
				</Text>
				<Text variant="body-secondary">
					{#if memoTitle}
						You're about to delete <strong class="text-theme">"{memoTitle}"</strong>.
					{:else}
						You're about to delete this memo.
					{/if}
				</Text>
				<Text variant="small" class="mt-2 text-red-600 dark:text-red-500">
					This action cannot be undone. All associated data including memories, tags, and audio will
					be permanently deleted.
				</Text>
			</div>
		</div>
	{/snippet}

	{#snippet footer()}
		<div class="flex justify-end gap-3">
			<button onclick={onClose} disabled={isDeleting} class="btn-secondary">Cancel</button>
			<button onclick={onConfirm} disabled={isDeleting} class="btn-danger">
				{#if isDeleting}
					<svg
						class="h-4 w-4 animate-spin"
						fill="none"
						viewBox="0 0 24 24"
						xmlns="http://www.w3.org/2000/svg"
					>
						<circle
							class="opacity-25"
							cx="12"
							cy="12"
							r="10"
							stroke="currentColor"
							stroke-width="4"
						/>
						<path
							class="opacity-75"
							fill="currentColor"
							d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
						/>
					</svg>
					<Text variant="small">Deleting...</Text>
				{:else}
					<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
						/>
					</svg>
					<Text variant="small">Delete Permanently</Text>
				{/if}
			</button>
		</div>
	{/snippet}
</Modal>
