<!--
  SceneRenameDialog — modal for creating or renaming a workbench scene.

  Single dialog handles both flows; the parent decides which by passing an
  initial name (empty for create, current name for rename) and a title.
-->
<script lang="ts">
	interface Props {
		show: boolean;
		title: string;
		initialName?: string;
		initialIcon?: string;
		confirmLabel?: string;
		onSubmit: (name: string, icon: string | undefined) => void | Promise<void>;
		onCancel: () => void;
	}

	let {
		show,
		title,
		initialName = '',
		initialIcon = '',
		confirmLabel = 'Speichern',
		onSubmit,
		onCancel,
	}: Props = $props();

	let name = $state('');
	let icon = $state('');
	let pending = $state(false);
	let inputEl = $state<HTMLInputElement | null>(null);

	// Reset local fields each time the dialog opens with new props.
	$effect(() => {
		if (show) {
			name = initialName;
			icon = initialIcon;
			// Focus on next tick once the input is mounted.
			queueMicrotask(() => inputEl?.focus());
		}
	});

	async function handleSubmit(e: SubmitEvent) {
		e.preventDefault();
		if (pending || !name.trim()) return;
		pending = true;
		try {
			await onSubmit(name.trim(), icon.trim() || undefined);
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
	<!-- svelte-ignore a11y_click_events_have_key_events -->
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div class="srd-backdrop" onclick={onCancel}>
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
				<div class="srd-fields">
					<label class="srd-field srd-field-icon">
						<span class="srd-label">Icon</span>
						<input
							class="srd-input srd-icon-input"
							type="text"
							maxlength="2"
							placeholder="🏠"
							bind:value={icon}
						/>
					</label>
					<label class="srd-field srd-field-name">
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
				</div>
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
		background: rgba(0, 0, 0, 0.5);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 200;
		padding: 1rem;
	}
	.srd-dialog {
		background: #fffef5;
		border-radius: 0.75rem;
		box-shadow: 0 12px 32px rgba(0, 0, 0, 0.2);
		max-width: 420px;
		width: 100%;
		padding: 1.5rem;
		animation: srd-pop 0.18s ease-out;
	}
	:global(.dark) .srd-dialog {
		background: #252220;
		box-shadow: 0 12px 32px rgba(0, 0, 0, 0.5);
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
		color: #111827;
		margin: 0 0 1rem;
	}
	:global(.dark) .srd-title {
		color: #f9fafb;
	}
	.srd-fields {
		display: flex;
		gap: 0.5rem;
		margin-bottom: 1.25rem;
	}
	.srd-field {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}
	.srd-field-icon {
		flex: 0 0 auto;
		width: 64px;
	}
	.srd-field-name {
		flex: 1;
	}
	.srd-label {
		font-size: 0.75rem;
		font-weight: 500;
		color: #6b7280;
	}
	:global(.dark) .srd-label {
		color: #9ca3af;
	}
	.srd-input {
		padding: 0.5rem 0.75rem;
		border-radius: 0.5rem;
		border: 1px solid rgba(0, 0, 0, 0.12);
		background: white;
		font-size: 0.875rem;
		color: #111827;
		outline: none;
		transition: border-color 0.15s;
	}
	.srd-input:focus {
		border-color: hsl(var(--color-primary));
	}
	:global(.dark) .srd-input {
		background: #1f1c1a;
		border-color: rgba(255, 255, 255, 0.12);
		color: #f9fafb;
	}
	.srd-icon-input {
		text-align: center;
		font-size: 1.25rem;
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
		color: #6b7280;
	}
	.srd-btn-cancel:hover:not(:disabled) {
		background: rgba(0, 0, 0, 0.05);
	}
	:global(.dark) .srd-btn-cancel {
		color: #9ca3af;
	}
	:global(.dark) .srd-btn-cancel:hover:not(:disabled) {
		background: rgba(255, 255, 255, 0.06);
	}
	.srd-btn-primary {
		background: hsl(var(--color-primary));
		color: white;
	}
	.srd-btn-primary:hover:not(:disabled) {
		filter: brightness(1.08);
	}
</style>
