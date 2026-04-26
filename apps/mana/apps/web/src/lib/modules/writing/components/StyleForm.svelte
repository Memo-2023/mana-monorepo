<!--
  StyleForm — create / edit a custom WritingStyle row.

  M4 supports source='custom-description': name + freeform style prose.
  M4.1 will add source='sample-trained' (sample collection + extraction)
  and source='self-trained' (auto-pull from journal/notes/articles) via
  separate flows; those don't belong in this form.
-->
<script lang="ts">
	import { _ } from 'svelte-i18n';
	import { stylesStore } from '../stores/styles.svelte';
	import type { WritingStyle } from '../types';

	let {
		mode,
		style,
		onclose,
	}: {
		mode: 'create' | 'edit';
		style?: WritingStyle;
		onclose: () => void;
	} = $props();

	/* svelte-ignore state_referenced_locally */
	let name = $state(style?.name ?? '');
	/* svelte-ignore state_referenced_locally */
	let description = $state(style?.description ?? '');

	let saving = $state(false);
	let error = $state<string | null>(null);

	const isValid = $derived(name.trim().length > 0 && description.trim().length > 0);

	async function submit(ev: Event) {
		ev.preventDefault();
		if (!isValid || saving) return;
		saving = true;
		error = null;
		try {
			if (mode === 'create') {
				await stylesStore.createStyle({
					name: name.trim(),
					description: description.trim(),
					source: 'custom-description',
				});
			} else if (style) {
				await stylesStore.updateStyle(style.id, {
					name: name.trim(),
					description: description.trim(),
				});
			}
			onclose();
		} catch (err) {
			error = err instanceof Error ? err.message : String(err);
		} finally {
			saving = false;
		}
	}
</script>

<form class="style-form" onsubmit={submit}>
	<label>
		<span>{$_('writing.style_form.label_name')}</span>
		<!-- svelte-ignore a11y_autofocus -->
		<input
			type="text"
			bind:value={name}
			placeholder={$_('writing.style_form.placeholder_name')}
			required
			autofocus
		/>
	</label>

	<label>
		<span>
			{$_('writing.style_form.label_description')}
			<small>{$_('writing.style_form.label_description_hint')}</small>
		</span>
		<textarea
			bind:value={description}
			rows="5"
			placeholder={$_('writing.style_form.placeholder_description')}
			required
		></textarea>
	</label>

	{#if error}
		<p class="error">{error}</p>
	{/if}

	<div class="actions">
		<button type="button" class="secondary" onclick={onclose} disabled={saving}
			>{$_('writing.style_form.cancel')}</button
		>
		<button type="submit" class="primary" disabled={!isValid || saving}>
			{#if saving}
				{$_('writing.style_form.saving')}
			{:else if mode === 'create'}
				{$_('writing.style_form.submit_create')}
			{:else}
				{$_('writing.style_form.submit_update')}
			{/if}
		</button>
	</div>
</form>

<style>
	.style-form {
		display: flex;
		flex-direction: column;
		gap: 0.9rem;
		padding: 1rem 1.25rem;
	}
	label {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
		font-size: 0.85rem;
	}
	label > span {
		color: hsl(var(--color-muted-foreground));
	}
	small {
		font-weight: normal;
		opacity: 0.7;
	}
	input,
	textarea {
		padding: 0.5rem 0.7rem;
		border-radius: 0.5rem;
		border: 1px solid hsl(var(--color-border));
		background: hsl(var(--color-surface));
		font: inherit;
		color: inherit;
	}
	textarea {
		resize: vertical;
		min-height: 5rem;
	}
	input:focus,
	textarea:focus {
		outline: 2px solid hsl(var(--color-primary));
		outline-offset: 1px;
		border-color: transparent;
	}
	.actions {
		display: flex;
		gap: 0.5rem;
		justify-content: flex-end;
		margin-top: 0.25rem;
	}
	button {
		padding: 0.5rem 1rem;
		border-radius: 0.55rem;
		font: inherit;
		font-weight: 500;
		cursor: pointer;
	}
	button:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}
	.primary {
		background: hsl(var(--color-primary));
		color: white;
		border: 1px solid hsl(var(--color-primary));
	}
	.primary:hover:not(:disabled) {
		background: hsl(var(--color-primary));
		border-color: hsl(var(--color-primary));
	}
	.secondary {
		background: transparent;
		color: hsl(var(--color-foreground));
		border: 1px solid hsl(var(--color-border));
	}
	.secondary:hover:not(:disabled) {
		background: hsl(var(--color-surface));
	}
	.error {
		color: #ef4444;
		font-size: 0.85rem;
		margin: 0;
	}
</style>
