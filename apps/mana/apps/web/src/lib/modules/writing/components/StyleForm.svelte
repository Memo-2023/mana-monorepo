<!--
  StyleForm — create / edit a custom WritingStyle row.

  M4 supports source='custom-description': name + freeform style prose.
  M4.1 will add source='sample-trained' (sample collection + extraction)
  and source='self-trained' (auto-pull from journal/notes/articles) via
  separate flows; those don't belong in this form.
-->
<script lang="ts">
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
		<span>Name</span>
		<!-- svelte-ignore a11y_autofocus -->
		<input type="text" bind:value={name} placeholder="Mein Corporate-Ton" required autofocus />
	</label>

	<label>
		<span>
			Beschreibung
			<small>(die KI liest das wörtlich — sei konkret)</small>
		</span>
		<textarea
			bind:value={description}
			rows="5"
			placeholder={'z.B. "Kurze Sätze, aktive Formulierungen, keine Buzzwords. Erste-Person-Singular, du-Ansprache. Max. 3 Sätze pro Absatz. Jeder Abschnitt endet mit einer konkreten nächsten Aktion."'}
			required
		></textarea>
	</label>

	{#if error}
		<p class="error">{error}</p>
	{/if}

	<div class="actions">
		<button type="button" class="secondary" onclick={onclose} disabled={saving}>Abbrechen</button>
		<button type="submit" class="primary" disabled={!isValid || saving}>
			{#if saving}
				Speichert…
			{:else if mode === 'create'}
				Stil anlegen
			{:else}
				Speichern
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
		color: var(--color-text-muted, rgba(0, 0, 0, 0.55));
	}
	small {
		font-weight: normal;
		opacity: 0.7;
	}
	input,
	textarea {
		padding: 0.5rem 0.7rem;
		border-radius: 0.5rem;
		border: 1px solid var(--color-border, rgba(0, 0, 0, 0.1));
		background: var(--color-surface, transparent);
		font: inherit;
		color: inherit;
	}
	textarea {
		resize: vertical;
		min-height: 5rem;
	}
	input:focus,
	textarea:focus {
		outline: 2px solid #0ea5e9;
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
		background: #0ea5e9;
		color: white;
		border: 1px solid #0ea5e9;
	}
	.primary:hover:not(:disabled) {
		background: #0284c7;
		border-color: #0284c7;
	}
	.secondary {
		background: transparent;
		color: var(--color-text, inherit);
		border: 1px solid var(--color-border, rgba(0, 0, 0, 0.1));
	}
	.secondary:hover:not(:disabled) {
		background: var(--color-surface, rgba(0, 0, 0, 0.04));
	}
	.error {
		color: #ef4444;
		font-size: 0.85rem;
		margin: 0;
	}
</style>
