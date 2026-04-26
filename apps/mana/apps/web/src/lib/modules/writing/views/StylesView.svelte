<!--
  StylesView — manage writing styles.

  Two sections: built-in presets (read-only, 9 of them) and the user's
  custom styles (CRUD). In M4 custom styles are "custom-description"
  only — a name + a prose description the prompt builder hands straight
  to the LLM. M4.1 adds sample-trained styles (principles extracted
  from a batch of user samples) via a separate flow.
-->
<script lang="ts">
	import { _ } from 'svelte-i18n';
	import { STYLE_PRESETS } from '../presets/styles';
	import { useAllStyles } from '../queries';
	import { stylesStore } from '../stores/styles.svelte';
	import StyleForm from '../components/StyleForm.svelte';
	import type { WritingStyle } from '../types';

	const styles$ = useAllStyles();
	const customStyles = $derived(styles$.value);

	let createOpen = $state(false);
	let editingId = $state<string | null>(null);
	const editingStyle = $derived<WritingStyle | null>(
		editingId ? (customStyles.find((s) => s.id === editingId) ?? null) : null
	);

	async function remove(style: WritingStyle) {
		if (!confirm($_('writing.styles_view.confirm_delete', { values: { name: style.name } })))
			return;
		await stylesStore.deleteStyle(style.id);
	}
</script>

<div class="styles-shell">
	<header class="head">
		<a href="/writing" class="back">{$_('writing.styles_view.back_to_writing')}</a>
		<div>
			<h1>{$_('writing.styles_view.title')}</h1>
			<p class="muted">{$_('writing.styles_view.subtitle')}</p>
		</div>
		<button
			type="button"
			class="create-btn"
			class:active={createOpen}
			onclick={() => (createOpen = !createOpen)}
		>
			{createOpen ? $_('writing.styles_view.close_btn') : $_('writing.styles_view.create_btn')}
		</button>
	</header>

	{#if createOpen}
		<section class="inline-form">
			<StyleForm mode="create" onclose={() => (createOpen = false)} />
		</section>
	{/if}

	<section>
		<h2>{$_('writing.styles_view.section_presets')}</h2>
		<p class="muted small">{$_('writing.styles_view.section_presets_hint')}</p>
		<div class="grid">
			{#each STYLE_PRESETS as preset (preset.id)}
				<article class="card preset">
					<header class="card-head">
						<strong>{preset.name.de}</strong>
						<span class="tag">{$_('writing.styles_view.badge_template')}</span>
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
		<h2>{$_('writing.styles_view.section_my_styles')}</h2>
		{#if styles$.loading}
			<p class="muted small">{$_('writing.styles_view.loading')}</p>
		{:else if customStyles.length === 0}
			<p class="muted small">
				{$_('writing.styles_view.empty_my_styles_pre')}<strong
					>{$_('writing.styles_view.empty_my_styles_strong')}</strong
				>{$_('writing.styles_view.empty_my_styles_post')}
			</p>
		{:else}
			<div class="grid">
				{#each customStyles as style (style.id)}
					<article class="card" class:editing={editingId === style.id}>
						<header class="card-head">
							<strong>{style.name}</strong>
							<span class="tag">{$_('writing.style_sources.' + style.source)}</span>
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
									{$_('writing.styles_view.action_edit')}
								</button>
								<button type="button" class="tiny danger" onclick={() => remove(style)}>
									{$_('writing.styles_view.action_delete')}
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
		color: hsl(var(--color-muted-foreground));
		text-decoration: none;
	}
	.back:hover {
		color: hsl(var(--color-primary));
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
		color: hsl(var(--color-muted-foreground));
		font-weight: 500;
	}
	.muted {
		color: hsl(var(--color-muted-foreground));
		margin: 0;
	}
	.muted.small {
		font-size: 0.85rem;
		margin-bottom: 0.75rem;
	}
	.create-btn {
		padding: 0.5rem 1rem;
		border-radius: 0.55rem;
		border: 1px solid hsl(var(--color-primary));
		background: hsl(var(--color-primary));
		color: white;
		cursor: pointer;
		font: inherit;
		font-weight: 500;
		white-space: nowrap;
	}
	.create-btn:hover {
		background: hsl(var(--color-primary));
		border-color: hsl(var(--color-primary));
	}
	.create-btn.active {
		background: transparent;
		color: hsl(var(--color-primary));
	}
	.inline-form {
		border: 1px solid hsl(var(--color-primary) / 0.3);
		border-radius: 0.75rem;
		background: hsl(var(--color-primary) / 0.04);
	}
	.grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
		gap: 0.75rem;
	}
	.card {
		padding: 0.9rem 1rem;
		border-radius: 0.75rem;
		border: 1px solid hsl(var(--color-border));
		background: hsl(var(--color-surface));
		display: flex;
		flex-direction: column;
		gap: 0.45rem;
	}
	.card.preset {
		border-style: dashed;
	}
	.card.editing {
		border-color: hsl(var(--color-primary));
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
		background: hsl(var(--color-primary) / 0.12);
		color: hsl(var(--color-primary));
		text-transform: uppercase;
		letter-spacing: 0.04em;
	}
	.desc {
		margin: 0;
		font-size: 0.85rem;
		line-height: 1.45;
		color: hsl(var(--color-foreground));
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
		background: hsl(var(--color-muted));
		color: hsl(var(--color-muted-foreground));
	}
	.actions {
		display: inline-flex;
		gap: 0.4rem;
		margin-top: 0.25rem;
	}
	.tiny {
		padding: 0.2rem 0.55rem;
		border-radius: 0.4rem;
		border: 1px solid hsl(var(--color-border));
		background: transparent;
		font-size: 0.75rem;
		cursor: pointer;
		color: inherit;
		font: inherit;
	}
	.tiny:hover {
		border-color: hsl(var(--color-primary));
		color: hsl(var(--color-primary));
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
