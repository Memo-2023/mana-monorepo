<script lang="ts">
	import { X, Trash, CheckSquare } from '@manacore/shared-icons';
	import { filesStore } from '$lib/stores/files.svelte';
	import { toastStore } from '@manacore/shared-ui';

	let deleting = $state(false);

	async function handleDelete() {
		const count = filesStore.selectionCount;
		if (!confirm(`${count} Element(e) in den Papierkorb verschieben?`)) return;

		deleting = true;
		const result = await filesStore.deleteSelected();
		deleting = false;

		if (result.hasErrors) {
			toastStore.error('Einige Elemente konnten nicht gelöscht werden');
		} else {
			toastStore.success(`${result.deleted} Element(e) gelöscht`);
		}
	}
</script>

{#if filesStore.selectionCount > 0}
	<div class="bulk-bar">
		<div class="bulk-info">
			<CheckSquare size={16} />
			<span>{filesStore.selectionCount} ausgewählt</span>
		</div>

		<div class="bulk-actions">
			<button class="bulk-btn danger" onclick={handleDelete} disabled={deleting}>
				<Trash size={16} />
				<span>{deleting ? 'Lösche...' : 'Löschen'}</span>
			</button>

			<button class="bulk-btn" onclick={() => filesStore.selectAll()}> Alle auswählen </button>

			<button
				class="bulk-btn close"
				onclick={() => filesStore.clearSelection()}
				aria-label="Auswahl aufheben"
			>
				<X size={16} />
			</button>
		</div>
	</div>
{/if}

<style>
	.bulk-bar {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 0.625rem 1rem;
		margin-bottom: 1rem;
		background: rgb(var(--color-primary) / 0.08);
		border: 1px solid rgb(var(--color-primary) / 0.2);
		border-radius: var(--radius-lg);
		animation: slideIn 200ms ease;
	}

	@keyframes slideIn {
		from {
			opacity: 0;
			transform: translateY(-8px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	.bulk-info {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		font-size: 0.875rem;
		font-weight: 500;
		color: rgb(var(--color-primary));
	}

	.bulk-actions {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.bulk-btn {
		display: flex;
		align-items: center;
		gap: 0.375rem;
		padding: 0.375rem 0.75rem;
		background: rgb(var(--color-surface-elevated));
		border: 1px solid rgb(var(--color-border));
		border-radius: var(--radius-md);
		font-size: 0.8125rem;
		color: rgb(var(--color-text-primary));
		cursor: pointer;
		transition: all 150ms ease;
	}

	.bulk-btn:hover {
		background: rgb(var(--color-surface));
	}

	.bulk-btn.danger {
		color: rgb(var(--color-error));
		border-color: rgb(var(--color-error) / 0.3);
	}

	.bulk-btn.danger:hover {
		background: rgb(var(--color-error));
		color: white;
	}

	.bulk-btn.close {
		padding: 0.375rem;
	}

	.bulk-btn:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	@media (max-width: 640px) {
		.bulk-btn span {
			display: none;
		}
	}
</style>
