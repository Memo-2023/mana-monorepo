<script lang="ts">
	import { _ } from 'svelte-i18n';
	import { X } from '@manacore/shared-icons';

	interface Props {
		onClose: () => void;
		onCreate: (data: { name: string; description?: string }) => void;
	}

	let { onClose, onCreate }: Props = $props();

	let name = $state('');
	let description = $state('');
	let loading = $state(false);

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Escape') {
			onClose();
		}
	}

	function handleBackdropClick(e: Event) {
		if (e.target === e.currentTarget) {
			onClose();
		}
	}

	async function handleSubmit(e: Event) {
		e.preventDefault();
		if (!name.trim() || loading) return;

		loading = true;
		await onCreate({
			name: name.trim(),
			description: description.trim() || undefined,
		});
		loading = false;
	}
</script>

<svelte:window onkeydown={handleKeydown} />

<!-- svelte-ignore a11y_click_events_have_key_events a11y_no_static_element_interactions -->
<div class="modal-backdrop" onclick={handleBackdropClick}>
	<div class="modal-content">
		<header class="modal-header">
			<h2 class="text-lg font-semibold">{$_('albums.create')}</h2>
			<button class="close-btn" onclick={onClose} type="button">
				<X size={20} />
			</button>
		</header>

		<form onsubmit={handleSubmit}>
			<div class="form-group">
				<label for="name" class="form-label">{$_('albums.name')}</label>
				<input
					id="name"
					type="text"
					class="form-input"
					bind:value={name}
					placeholder="My Album"
					required
				/>
			</div>

			<div class="form-group">
				<label for="description" class="form-label">{$_('albums.description')}</label>
				<textarea
					id="description"
					class="form-input"
					bind:value={description}
					placeholder="Optional description..."
					rows="3"
				></textarea>
			</div>

			<div class="modal-actions">
				<button type="button" class="btn btn-ghost" onclick={onClose} disabled={loading}>
					{$_('common.cancel')}
				</button>
				<button type="submit" class="btn btn-primary" disabled={!name.trim() || loading}>
					{#if loading}
						{$_('common.loading')}
					{:else}
						{$_('common.create')}
					{/if}
				</button>
			</div>
		</form>
	</div>
</div>

<style>
	.modal-backdrop {
		position: fixed;
		inset: 0;
		background: rgba(0, 0, 0, 0.5);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 50;
		padding: 1rem;
	}

	.modal-content {
		background: var(--color-card);
		border-radius: var(--radius-lg);
		width: 100%;
		max-width: 400px;
		padding: 1.5rem;
	}

	.modal-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 1.5rem;
	}

	.close-btn {
		padding: 0.25rem;
		border-radius: 50%;
		background: transparent;
		color: var(--color-muted-foreground);
		border: none;
		cursor: pointer;
	}

	.close-btn:hover {
		background: var(--color-accent);
	}

	.form-group {
		margin-bottom: 1rem;
	}

	.form-label {
		display: block;
		font-size: 0.875rem;
		font-weight: 500;
		margin-bottom: 0.5rem;
	}

	.form-input {
		width: 100%;
		padding: 0.75rem;
		border: 1px solid var(--color-border);
		border-radius: var(--radius-md);
		background: var(--color-background);
		color: var(--color-foreground);
		font-size: 0.875rem;
	}

	.form-input:focus {
		outline: none;
		border-color: var(--color-primary);
	}

	textarea.form-input {
		resize: vertical;
		min-height: 80px;
	}

	.modal-actions {
		display: flex;
		justify-content: flex-end;
		gap: 0.5rem;
		margin-top: 1.5rem;
	}
</style>
