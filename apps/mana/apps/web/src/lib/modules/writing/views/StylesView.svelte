<!--
  StylesView — manage writing styles.

  Two sections: built-in presets (read-only, 9 of them) and the user's
  custom styles (CRUD). In M4 custom styles are "custom-description"
  only — a name + a prose description the prompt builder hands straight
  to the LLM. M4.1 adds sample-trained styles (principles extracted
  from a batch of user samples) via a separate flow.
-->
<script lang="ts">
	import { STYLE_PRESETS } from '../presets/styles';
	import { useAllStyles } from '../queries';
	import { stylesStore } from '../stores/styles.svelte';
	import StyleForm from '../components/StyleForm.svelte';
	import { STYLE_SOURCE_LABELS } from '../constants';
	import type { WritingStyle } from '../types';

	const styles$ = useAllStyles();
	const customStyles = $derived(styles$.value);

	let createOpen = $state(false);
	let editingId = $state<string | null>(null);
	const editingStyle = $derived<WritingStyle | null>(
		editingId ? (customStyles.find((s) => s.id === editingId) ?? null) : null
	);

	async function remove(style: WritingStyle) {
		if (!confirm(`"${style.name}" wirklich löschen?`)) return;
		await stylesStore.deleteStyle(style.id);
	}
</script>

<div class="styles-shell">
	<header class="head">
		<a href="/writing" class="back">← Zurück zu Writing</a>
		<div>
			<h1>Stile</h1>
			<p class="muted">Vorlagen und eigene Stile, die der Ghostwriter beim Generieren anwendet.</p>
		</div>
		<button
			type="button"
			class="create-btn"
			class:active={createOpen}
			onclick={() => (createOpen = !createOpen)}
		>
			{createOpen ? '× Schließen' : '+ Eigener Stil'}
		</button>
	</header>

	{#if createOpen}
		<section class="inline-form">
			<StyleForm mode="create" onclose={() => (createOpen = false)} />
		</section>
	{/if}

	<section>
		<h2>Vorlagen</h2>
		<p class="muted small">
			Eingebaute Stile — direkt im Briefing auswählbar. Nicht bearbeitbar; für Anpassungen lege
			einen eigenen Stil an.
		</p>
		<div class="grid">
			{#each STYLE_PRESETS as preset (preset.id)}
				<article class="card preset">
					<header class="card-head">
						<strong>{preset.name.de}</strong>
						<span class="tag">Vorlage</span>
					</header>
					<p class="desc">{preset.description.de}</p>
					{#if preset.principles.toneTraits.length}
						<ul class="traits">
							{#each preset.principles.toneTraits as trait (trait)}
								<li>{trait}</li>
							{/each}
						</ul>
					{/if}
				</article>
			{/each}
		</div>
	</section>

	<section>
		<h2>Meine Stile</h2>
		{#if styles$.loading}
			<p class="muted small">Lädt…</p>
		{:else if customStyles.length === 0}
			<p class="muted small">
				Keine eigenen Stile. Klick oben auf <strong>+ Eigener Stil</strong>, um einen anzulegen —
				z.B. "Mein Corporate-Ton" oder "Persönliche Blog-Stimme".
			</p>
		{:else}
			<div class="grid">
				{#each customStyles as style (style.id)}
					<article class="card" class:editing={editingId === style.id}>
						<header class="card-head">
							<strong>{style.name}</strong>
							<span class="tag">{STYLE_SOURCE_LABELS[style.source].de}</span>
						</header>
						{#if editingId === style.id}
							<StyleForm mode="edit" {style} onclose={() => (editingId = null)} />
						{:else}
							<p class="desc">{style.description}</p>
							{#if style.extractedPrinciples?.toneTraits.length}
								<ul class="traits">
									{#each style.extractedPrinciples.toneTraits as trait (trait)}
										<li>{trait}</li>
									{/each}
								</ul>
							{/if}
							<div class="actions">
								<button type="button" class="tiny" onclick={() => (editingId = style.id)}>
									Bearbeiten
								</button>
								<button type="button" class="tiny danger" onclick={() => remove(style)}>
									Löschen
								</button>
							</div>
						{/if}
					</article>
				{/each}
			</div>
		{/if}
	</section>
</div>

<style>
	.styles-shell {
		max-width: 1100px;
		margin: 0 auto;
		padding: 1.5rem;
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
	}
	.head {
		display: grid;
		grid-template-columns: auto 1fr auto;
		align-items: center;
		gap: 1rem;
	}
	.back {
		font-size: 0.85rem;
		color: var(--color-text-muted, rgba(0, 0, 0, 0.55));
		text-decoration: none;
	}
	.back:hover {
		color: #0ea5e9;
	}
	h1 {
		margin: 0 0 0.25rem;
		font-size: 1.5rem;
	}
	h2 {
		margin: 0 0 0.25rem;
		font-size: 1rem;
		text-transform: uppercase;
		letter-spacing: 0.04em;
		color: var(--color-text-muted, rgba(0, 0, 0, 0.55));
		font-weight: 500;
	}
	.muted {
		color: var(--color-text-muted, rgba(0, 0, 0, 0.55));
		margin: 0;
	}
	.muted.small {
		font-size: 0.85rem;
		margin-bottom: 0.75rem;
	}
	.create-btn {
		padding: 0.5rem 1rem;
		border-radius: 0.55rem;
		border: 1px solid #0ea5e9;
		background: #0ea5e9;
		color: white;
		cursor: pointer;
		font: inherit;
		font-weight: 500;
		white-space: nowrap;
	}
	.create-btn:hover {
		background: #0284c7;
		border-color: #0284c7;
	}
	.create-btn.active {
		background: transparent;
		color: #0ea5e9;
	}
	.inline-form {
		border: 1px solid color-mix(in srgb, #0ea5e9 30%, transparent);
		border-radius: 0.75rem;
		background: color-mix(in srgb, #0ea5e9 4%, transparent);
	}
	.grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
		gap: 0.75rem;
	}
	.card {
		padding: 0.9rem 1rem;
		border-radius: 0.75rem;
		border: 1px solid var(--color-border, rgba(0, 0, 0, 0.08));
		background: var(--color-surface, rgba(255, 255, 255, 0.04));
		display: flex;
		flex-direction: column;
		gap: 0.45rem;
	}
	.card.preset {
		border-style: dashed;
	}
	.card.editing {
		border-color: #0ea5e9;
		padding: 0;
	}
	.card-head {
		display: flex;
		justify-content: space-between;
		align-items: center;
		gap: 0.5rem;
	}
	.tag {
		font-size: 0.65rem;
		padding: 0.05rem 0.45rem;
		border-radius: 999px;
		background: color-mix(in srgb, #0ea5e9 12%, transparent);
		color: #0ea5e9;
		text-transform: uppercase;
		letter-spacing: 0.04em;
	}
	.desc {
		margin: 0;
		font-size: 0.85rem;
		line-height: 1.45;
		color: var(--color-text, inherit);
	}
	.traits {
		display: flex;
		flex-wrap: wrap;
		gap: 0.3rem;
		padding: 0;
		margin: 0;
		list-style: none;
	}
	.traits li {
		font-size: 0.7rem;
		padding: 0.05rem 0.5rem;
		border-radius: 999px;
		background: var(--color-surface-muted, rgba(0, 0, 0, 0.05));
		color: var(--color-text-muted, rgba(0, 0, 0, 0.55));
	}
	.actions {
		display: inline-flex;
		gap: 0.4rem;
		margin-top: 0.25rem;
	}
	.tiny {
		padding: 0.2rem 0.55rem;
		border-radius: 0.4rem;
		border: 1px solid var(--color-border, rgba(0, 0, 0, 0.1));
		background: transparent;
		font-size: 0.75rem;
		cursor: pointer;
		color: inherit;
		font: inherit;
	}
	.tiny:hover {
		border-color: #0ea5e9;
		color: #0ea5e9;
	}
	.tiny.danger:hover {
		border-color: #ef4444;
		color: #ef4444;
	}

	@media (max-width: 600px) {
		.head {
			grid-template-columns: 1fr;
		}
	}
</style>
