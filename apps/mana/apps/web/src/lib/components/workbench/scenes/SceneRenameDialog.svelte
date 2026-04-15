<!--
  SceneRenameDialog — modal for renaming a workbench scene.
-->
<script lang="ts">
	interface Props {
		show: boolean;
		title: string;
		initialName?: string;
		initialDescription?: string;
		confirmLabel?: string;
		onSubmit: (name: string, description: string) => void | Promise<void>;
		onCancel: () => void;
	}

	let {
		show,
		title,
		initialName = '',
		initialDescription = '',
		confirmLabel = 'Speichern',
		onSubmit,
		onCancel,
	}: Props = $props();

	let name = $state('');
	let description = $state('');
	let pending = $state(false);
	let inputEl = $state<HTMLInputElement | null>(null);

	$effect(() => {
		if (show) {
			name = initialName;
			description = initialDescription;
			queueMicrotask(() => inputEl?.focus());
		}
	});

	async function handleSubmit(e: SubmitEvent) {
		e.preventDefault();
		if (pending || !name.trim()) return;
		pending = true;
		try {
			await onSubmit(name.trim(), description);
		} finally {
			pending = false;
		}
	}

	function handleKeydown(e: KeyboardEvent) {
		if (!show) return;
		if (e.key === 'Escape') onCancel();
	}
</script>

<svelte:window onkeydown={handleKeydown} />

{#if show}
	<div class="srd-backdrop" onclick={onCancel} role="presentation" tabindex="-1">
		<!-- svelte-ignore a11y_click_events_have_key_events -->
		<div
			class="srd-dialog"
			role="dialog"
			tabindex="-1"
			aria-modal="true"
			aria-labelledby="srd-title"
			onclick={(e) => e.stopPropagation()}
		>
			<h3 id="srd-title" class="srd-title">{title}</h3>
			<form onsubmit={handleSubmit}>
				<label class="srd-field">
					<span class="srd-label">Name</span>
					<input
						class="srd-input"
						type="text"
						maxlength="40"
						placeholder="z.B. Deep Work"
						bind:this={inputEl}
						bind:value={name}
						required
					/>
				</label>
				<label class="srd-field">
					<span class="srd-label">Beschreibung</span>
					<textarea
						class="srd-input srd-textarea"
						maxlength="240"
						rows="3"
						placeholder="Wofür ist diese Szene gedacht?"
						bind:value={description}
					></textarea>
				</label>
				<div class="srd-actions">
					<button
						type="button"
						class="srd-btn srd-btn-cancel"
						onclick={onCancel}
						disabled={pending}
					>
						Abbrechen
					</button>
					<button type="submit" class="srd-btn srd-btn-primary" disabled={pending || !name.trim()}>
						{pending ? '…' : confirmLabel}
					</button>
				</div>
			</form>
		</div>
	</div>
{/if}

<style>
	.srd-backdrop {
		position: fixed;
		inset: 0;
		background: hsl(0 0% 0% / 0.5);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 200;
		padding: 1rem;
	}
	.srd-dialog {
		background: hsl(var(--color-card));
		border-radius: 0.75rem;
		box-shadow: 0 12px 32px rgba(0, 0, 0, 0.2);
		max-width: 420px;
		width: 100%;
		padding: 1.5rem;
		animation: srd-pop 0.18s ease-out;
	}
	@keyframes srd-pop {
		from {
			opacity: 0;
			transform: scale(0.96);
		}
		to {
			opacity: 1;
			transform: scale(1);
		}
	}
	.srd-title {
		font-size: 1.0625rem;
		font-weight: 600;
		color: hsl(var(--color-foreground));
		margin: 0 0 1rem;
	}
	.srd-field {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
		margin-bottom: 1.25rem;
	}
	.srd-label {
		font-size: 0.75rem;
		font-weight: 500;
		color: hsl(var(--color-muted-foreground));
	}
	.srd-input {
		padding: 0.5rem 0.75rem;
		border-radius: 0.5rem;
		border: 1px solid hsl(var(--color-border));
		background: white;
		font-size: 0.875rem;
		color: hsl(var(--color-foreground));
		outline: none;
		transition: border-color 0.15s;
	}
	.srd-input:focus {
		border-color: hsl(var(--color-primary));
	}
	.srd-textarea {
		resize: vertical;
		min-height: 4rem;
		font-family: inherit;
		line-height: 1.45;
	}
	.srd-actions {
		display: flex;
		justify-content: flex-end;
		gap: 0.5rem;
	}
	.srd-btn {
		padding: 0.5rem 1rem;
		border-radius: 0.5rem;
		border: none;
		font-size: 0.875rem;
		font-weight: 500;
		cursor: pointer;
		transition: all 0.15s;
	}
	.srd-btn:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}
	.srd-btn-cancel {
		background: transparent;
		color: hsl(var(--color-muted-foreground));
	}
	.srd-btn-cancel:hover:not(:disabled) {
		background: hsl(var(--color-surface-hover));
	}
	.srd-btn-primary {
		background: hsl(var(--color-primary));
		color: hsl(var(--color-primary-foreground));
	}
	.srd-btn-primary:hover:not(:disabled) {
		filter: brightness(1.08);
	}
</style>
