<script lang="ts">
	import { X } from 'lucide-svelte';

	interface Props {
		open: boolean;
		onClose: () => void;
		onCreate: (name: string, color?: string) => void;
	}

	let { open, onClose, onCreate }: Props = $props();

	let folderName = $state('');
	let selectedColor = $state<string | undefined>(undefined);
	let loading = $state(false);

	const colors = [
		{ id: 'blue', value: '#3b82f6', label: 'Blau' },
		{ id: 'green', value: '#22c55e', label: 'Grün' },
		{ id: 'yellow', value: '#eab308', label: 'Gelb' },
		{ id: 'red', value: '#ef4444', label: 'Rot' },
		{ id: 'purple', value: '#a855f7', label: 'Lila' },
		{ id: 'pink', value: '#ec4899', label: 'Pink' },
		{ id: 'orange', value: '#f97316', label: 'Orange' },
		{ id: 'teal', value: '#14b8a6', label: 'Türkis' },
	];

	async function handleSubmit() {
		if (!folderName.trim()) return;

		loading = true;
		try {
			await onCreate(folderName.trim(), selectedColor);
			folderName = '';
			selectedColor = undefined;
			onClose();
		} finally {
			loading = false;
		}
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Escape') {
			onClose();
		}
	}
</script>

{#if open}
	<div
		class="modal-overlay"
		onclick={onClose}
		onkeydown={handleKeydown}
		role="dialog"
		aria-modal="true"
		aria-labelledby="modal-title"
		tabindex="-1"
	>
		<div class="modal-content" onclick={(e) => e.stopPropagation()}>
			<div class="modal-header">
				<h2 id="modal-title">Neuer Ordner</h2>
				<button class="close-button" onclick={onClose} aria-label="Schließen">
					<X size={20} />
				</button>
			</div>

			<form onsubmit={(e) => { e.preventDefault(); handleSubmit(); }}>
				<div class="form-group">
					<label for="folder-name">Ordnername</label>
					<input
						type="text"
						id="folder-name"
						bind:value={folderName}
						placeholder="Neuer Ordner"
						autofocus
					/>
				</div>

				<div class="form-group">
					<label>Ordnerfarbe (optional)</label>
					<div class="color-picker">
						<button
							type="button"
							class="color-option default"
							class:selected={!selectedColor}
							onclick={() => (selectedColor = undefined)}
							aria-label="Standard"
						>
							<span class="checkmark">✓</span>
						</button>
						{#each colors as color (color.id)}
							<button
								type="button"
								class="color-option"
								class:selected={selectedColor === color.id}
								style="background-color: {color.value}"
								onclick={() => (selectedColor = color.id)}
								aria-label={color.label}
							>
								{#if selectedColor === color.id}
									<span class="checkmark white">✓</span>
								{/if}
							</button>
						{/each}
					</div>
				</div>

				<div class="modal-actions">
					<button type="button" class="btn-secondary" onclick={onClose}>Abbrechen</button>
					<button type="submit" class="btn-primary" disabled={!folderName.trim() || loading}>
						{loading ? 'Erstellen...' : 'Erstellen'}
					</button>
				</div>
			</form>
		</div>
	</div>
{/if}

<style>
	.modal-overlay {
		position: fixed;
		inset: 0;
		background: rgba(0, 0, 0, 0.5);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 1000;
		backdrop-filter: blur(4px);
	}

	.modal-content {
		background: rgb(var(--color-surface-elevated));
		border-radius: var(--radius-xl);
		box-shadow: var(--shadow-xl);
		width: 100%;
		max-width: 400px;
		margin: 1rem;
	}

	.modal-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 1rem 1.5rem;
		border-bottom: 1px solid rgb(var(--color-border));
	}

	.modal-header h2 {
		margin: 0;
		font-size: 1.125rem;
		font-weight: 600;
		color: rgb(var(--color-text-primary));
	}

	.close-button {
		padding: 0.25rem;
		background: transparent;
		border: none;
		border-radius: var(--radius-sm);
		color: rgb(var(--color-text-secondary));
		cursor: pointer;
	}

	.close-button:hover {
		background: rgb(var(--color-surface));
		color: rgb(var(--color-text-primary));
	}

	form {
		padding: 1.5rem;
	}

	.form-group {
		margin-bottom: 1.25rem;
	}

	.form-group label {
		display: block;
		margin-bottom: 0.5rem;
		font-size: 0.875rem;
		font-weight: 500;
		color: rgb(var(--color-text-primary));
	}

	.form-group input {
		width: 100%;
		padding: 0.75rem;
		background: rgb(var(--color-surface));
		border: 1px solid rgb(var(--color-border));
		border-radius: var(--radius-md);
		font-size: 0.875rem;
		color: rgb(var(--color-text-primary));
	}

	.form-group input:focus {
		outline: none;
		border-color: rgb(var(--color-primary));
		box-shadow: 0 0 0 3px rgba(var(--color-primary), 0.1);
	}

	.color-picker {
		display: flex;
		gap: 0.5rem;
		flex-wrap: wrap;
	}

	.color-option {
		width: 32px;
		height: 32px;
		border-radius: 50%;
		border: 2px solid transparent;
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: center;
		transition: all var(--transition-fast);
	}

	.color-option.default {
		background: rgb(var(--color-surface));
		border-color: rgb(var(--color-border));
	}

	.color-option.selected {
		border-color: rgb(var(--color-text-primary));
		transform: scale(1.1);
	}

	.checkmark {
		font-size: 0.75rem;
		color: rgb(var(--color-text-primary));
	}

	.checkmark.white {
		color: white;
	}

	.modal-actions {
		display: flex;
		justify-content: flex-end;
		gap: 0.75rem;
		margin-top: 1.5rem;
	}

	.btn-secondary,
	.btn-primary {
		padding: 0.625rem 1rem;
		border-radius: var(--radius-md);
		font-size: 0.875rem;
		font-weight: 500;
		cursor: pointer;
		transition: all var(--transition-fast);
	}

	.btn-secondary {
		background: transparent;
		border: 1px solid rgb(var(--color-border));
		color: rgb(var(--color-text-primary));
	}

	.btn-secondary:hover {
		background: rgb(var(--color-surface));
	}

	.btn-primary {
		background: rgb(var(--color-primary));
		border: none;
		color: white;
	}

	.btn-primary:hover:not(:disabled) {
		opacity: 0.9;
	}

	.btn-primary:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}
</style>
